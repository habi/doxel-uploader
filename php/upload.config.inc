<?php

// 5 minutes execution time
set_time_limit(5 * 60);

// Uncomment this one to fake upload time
//usleep(1100000);

// max disk usage in percents
$maxDiskUsage=95;

// upload directory
$upload_dir = ".." . DIRECTORY_SEPARATOR . "upload";

// upload temporary directory
$tmpDir = $upload_dir . DIRECTORY_SEPARATOR . "tmp";

$tmpDirMod = 0755;
$targetDirMod = 0755;

// Remove old files
$cleanupTmpDir = true;

// Temp file age in seconds
$maxFileAge = 5 * 3600;

// get target directory and segment
function getTargetSegment($userDirectory,$timestamp,$lon,$lat) {
  global $upload_dir;
  global $pdo;
  global $userid;

  $unix_timestamp=substr($timestamp,0,10);
  $targetDir_digits=8; // 99 seconds

  // try to aggregate with existing pictures taken +/- 2minutes after/before, and
  //  new segment if (haveGPS && ( >2min and >20m)) || (!haveGPS && (>2min))
  //  same segment if (haveGPS && (<2min or <20m)) || (!haveGPS && (<2min))
  //
  //  Problems will occur if parts of the segment are uploaded randomly
  //  (eg: uploading the end first, the beginning after, and the middle
  //  images at last could result in three segments, etc)
  //
  $s=$pdo->prepare("SELECT UNIX_TIMESTAMP(segment) AS segment,lon,lat  FROM pictures WHERE user = :user AND timestamp BETWEEN FROM_UNIXTIME(:from) AND FROM_UNIXTIME(:to) ORDER BY timestamp");

  if ($s->execute(array(
    ':user' => $userid,
    ':from' => $unix_timestamp-120,
    ':to' => $unix_timestamp+120
  ))) {

    $lon1=$lon*M_PI/180;
    $lat1=$lat*M_PI/180;

    while($row=$s->fetch(PDO::FETCH_ASSOC)) {

      $segment=str_replace('.','_',$row['segment']);
      $segment=str_pad($segment, 17, "0", STR_PAD_LEFT);

      // no gps coords
      if ($row['lon']===NULL || $lon===NULL) {

        // !gps && <2min -> same segment
        return array(
          "dir" =>
            $upload_dir .
            DIRECTORY_SEPARATOR .
            date("Y".DIRECTORY_SEPARATOR."m".DIRECTORY_SEPARATOR."d"/*.DIRECTORY_SEPARATOR."H"*/, substr($segment,0,10)) .
            DIRECTORY_SEPARATOR .
            substr($segment,0,$targetDir_digits) .
            DIRECTORY_SEPARATOR .
            $userDirectory,

            "segment" => $segment

        );

      } else {
        /*
        // test if is distance is less than 20m
        $lon2=$row['lon']*M_PI/180;
        $lat2=$row['lat']*M_PI/180;

        $x=($lon2-$lon1)*cos(($lat1+$lat2)/2);
        $y=($lat2-$lat1);
        $d=sqrt($x*$x+$y*$y)*6371000;
         */

      //  if ($d<20) {
          return array(
            "dir" =>
              $upload_dir .
              DIRECTORY_SEPARATOR .
              date("Y".DIRECTORY_SEPARATOR."m".DIRECTORY_SEPARATOR."d"/*.DIRECTORY_SEPARATOR."H"*/, substr($segment,0,10)) .
              DIRECTORY_SEPARATOR .
              substr($segment,0,$targetDir_digits) .
              DIRECTORY_SEPARATOR .
              $userDirectory,

            "segment" => $segment
          );
      //  }
      }
    }
  }

  // new segment
  return array(
    "dir" =>
      $upload_dir .
      DIRECTORY_SEPARATOR .
      date("Y".DIRECTORY_SEPARATOR."m".DIRECTORY_SEPARATOR."d"/*.DIRECTORY_SEPARATOR."H"*/, $unix_timestamp) .
      DIRECTORY_SEPARATOR .
      substr($timestamp,0,$targetDir_digits) .
      DIRECTORY_SEPARATOR .
      $userDirectory,

    "segment" => $timestamp
  );
}

?>
