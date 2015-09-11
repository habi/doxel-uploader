<?php
/**
 * upload.php
 *
 * Copyright 2013, Moxiecode Systems AB
 * Released under GPL License.
 *
 * License: http://www.plupload.com/license
 * Contributing: http://www.plupload.com/contributing
 *
 * Modified by Rurik Bogdanov <rurik.bugdanov@alsenet.com>
 *
 */

// Make sure file is not cached (as it happens for example on iOS devices)
header("Expires: Mon, 26 Jul 1997 05:00:00 GMT");
header("Last-Modified: " . gmdate("D, d M Y H:i:s") . " GMT");
header("Cache-Control: no-store, no-cache, must-revalidate");
header("Cache-Control: post-check=0, pre-check=0", false);
header("Pragma: no-cache");

header("Content-Type: text/json");

include "auth.inc";
include "utils.inc";

/*
// Support CORS
header("Access-Control-Allow-Origin: *");
// other CORS headers if any...
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
	exit; // finish preflight CORS requests here
}
*/

include('upload.config.inc');

// get user id, check for hexadecimal only
$userDirectory = $token;
if (!preg_match('/^[0-9A-Fa-f]+$/', $userDirectory)) {
  die('{"jsonrpc" : "2.0", "error" : {"code": 900, "message": "Invalid user id."}, "id" : "id"}');
}

// get timestamp and check format
$timestamp = $_REQUEST['timestamp'];
if (!preg_match('/^[0-9]{10}_[0-9]{6}$/', $timestamp)) {
    die('{"jsonrpc" : "2.0", "error" : {"code": 901, "message": "Invalid timestamp."}, "id" : "id"}');
}

// get hash
$sha256 = $_REQUEST['sha256'];

// check for duplicate hash
assertUniqueHash($sha256);

$lon = isset($_REQUEST['lon'])?$_REQUEST['lon']:NULL;
$lat = isset($_REQUEST['lat'])?$_REQUEST['lat']:NULL;

$target = getTargetSegment($userDirectory, $timestamp, $lon, $lat);
$targetDir=$target['dir'] . DIRECTORY_SEPARATOR . $target['segment'];

// Create tmp dir
if (!file_exists($tmpDir)) {
  if (!mkdir($tmpDir,$tmpDirMod,true)) {
    die('{"jsonrpc" : "2.0", "error" : {"code": 903, "message": "Could not create remote temporary directory '.$tmpDir.'."}, "id" : "id"}');
  }
}

function getDiskUsage($directory) {
  $total=disk_total_space($directory)+$_SERVER['CONTENT_LENGTH'];
  $free=disk_free_space($directory);
  if (!$total || ! $free) {
    die('{"jsonrpc" : "2.0", "error" : {"code": 906, "message": "Could not compute free space on '.$directory.'"}, "id" : "id"}');
  }
  return $free/$total*100.0;
}

if (getDiskUsage($tmpDir) > $maxDiskUsage) {
    die('{"jsonrpc" : "2.0", "error" : {"code": 907, "message": "Remote temporary disk is full !"}, "id" : "id"}');
}

// Get a file name
if (isset($_REQUEST["name"])) {
	$originalFilename = $_REQUEST["name"];
} elseif (!empty($_FILES)) {
	$originalFilename = $_FILES["file"]["name"];
} else {
	$originalFilename = uniqid("file_");
}

$tmpFilename = $tmpDir . DIRECTORY_SEPARATOR . $userDirectory . '-' . $timestamp . '.part';
$destBasename = $targetDir . DIRECTORY_SEPARATOR . $timestamp;


// Chunking might be enabled
$chunk = isset($_REQUEST["chunk"]) ? intval($_REQUEST["chunk"]) : 0;
$chunks = isset($_REQUEST["chunks"]) ? intval($_REQUEST["chunks"]) : 0;


// Remove old temp files	
if ($cleanupTmpDir) {
	if (!is_dir($tmpDir) || !$dir = opendir($tmpDir)) {
		die('{"jsonrpc" : "2.0", "error" : {"code": 100, "message": "Failed to open temp directory."}, "id" : "id"}');
	}

	while (($file = readdir($dir)) !== false) {
		$file = $tmpDir . DIRECTORY_SEPARATOR . $file;

		// If temp file is current file proceed to the next
		if ($file == $tmpFilename) {
			continue;
		}

		// Remove temp file if it is older than the max age and is not the current file
		if (preg_match('/\.part$/', $file) && (filemtime($file) < time() - $maxFileAge)) {
      if (!unlink($file)) {
		    die('{"jsonrpc" : "2.0", "error" : {"code": 104, "message": "Failed to remove temporary file."}, "id" : "id"}');
      }
		}
	}
	closedir($dir);
}	

// Open temp file
if (!$out = fopen($tmpFilename, $chunks && $chunk ? "ab" : "wb")) {
	die('{"jsonrpc" : "2.0", "error" : {"code": 102, "message": "Failed to open output stream. Check remote upload folder permissions."}, "id" : "id"}');
}

if (!empty($_FILES)) {
	if ($_FILES["file"]["error"] || !is_uploaded_file($_FILES["file"]["tmp_name"])) {
		die('{"jsonrpc" : "2.0", "error" : {"code": 103, "message": "Failed to move uploaded file."}, "id" : "id"}');
	}

	// Read binary input stream and append it to temp file
	if (!$in = fopen($_FILES["file"]["tmp_name"], "rb")) {
		die('{"jsonrpc" : "2.0", "error" : {"code": 101, "message": "Failed to open input stream."}, "id" : "id"}');
	}
} else {	
	if (!$in = fopen("php://input", "rb")) {
		die('{"jsonrpc" : "2.0", "error" : {"code": 101, "message": "Failed to open input stream."}, "id" : "id"}');
	}
}

$contentLength=$_SERVER['CONTENT_LENGTH'];
$contentSize=0;

while ($buff = fread($in, 32768)) {
  fwrite($out, $buff);

  // check if file size exceed content-size
  $contentSize+=strlen($buff);
  if ($contentSize>$contentLength) {
    fclose($out);
    unlink($tmpFilename);
    die('{"jsonrpc" : "2.0", "error" : {"code": 105, "message": "File size exceed content-length !"}, "id" : "id"}');
  }
}

fclose($out);
fclose($in);

// Check if file has been uploaded
if (!$chunks || $chunk == $chunks - 1) {

  // get mime type
  $finfo = finfo_open(FILEINFO_MIME_TYPE);
  $mime = explode('/',finfo_file($finfo,$tmpFilename));
  if ($mime[0]!='image') {
    unlink($tmpFilename);
    die('{"jsonrpc" : "2.0", "error" : {"code": 902, "message": "Not an image: '.$originalFilename.'"}, "id" : "id"}');
  }

  $destFilename="{$destBasename}.$mime[1]";

  // Create target dir
  if (!file_exists($targetDir)) {
    if (!mkdir($targetDir,$targetDirMod,true)) {
      die('{"jsonrpc" : "2.0", "error" : {"code": 903, "message": "Could not create target directory '.$targetDir.'."}, "id" : "id"}');
    }
  }

  if (getDiskUsage($targetDir) > $maxDiskUsage) {
      die('{"jsonrpc" : "2.0", "error" : {"code": 908, "message": "Target disk is full !"}, "id" : "id"}');
  }

  // Duplicate timestamps should mean that timestamp precision is seconds,
  // so we are renaming duplicate timestamps (ie: incrementing microseconds)
  // Note that this could lead to some misordering
  //
  while(file_exists($destFilename)) {
    // increment timestamp
    $timestamp=explode('_',basename($destFilename,$mime[1]));
    $microsecs=str_pad((((int)$timestamp[1])+1),6,"0",STR_PAD_LEFT);
    $timestamp=$timestamp[0].'_'.$microsecs;

    // set new file name
    $destBasename = $targetDir . DIRECTORY_SEPARATOR . $timestamp;
    $destFilename="{$destBasename}.$mime[1]";

  }

  $s=$pdo->prepare('INSERT INTO pictures(sha256, user, timestamp, segment, lon, lat) VALUES(:sha256, :user, FROM_UNIXTIME(:timestamp), FROM_UNIXTIME(:segment), :lon, :lat)');
  if (!$s->execute(array(
    ":sha256" => hex2bin($sha256),
    ":user" => $userid,
    ":timestamp" => str_replace('_','.',$timestamp),
    ":segment" => str_replace('_','.',$target['segment']),
    ":lon" => $lon,
    ":lat" => $lat
  ))) {
    die('{"jsonrpc" : "2.0", "error" : {"code": 912, "message": "Could not register file in database."}, "id" : "id"}');
  }

	// Move and strip the temp .part suffix off
  if (!rename($tmpFilename, $destFilename)) {
      die('{"jsonrpc" : "2.0", "error" : {"code": 905, "message": "Could not move temporary file to destination."}, "id" : "id"}');
  }
}

// Return Success JSON-RPC response
die('{"jsonrpc" : "2.0", "success" : 1, "id" : "id"}');
