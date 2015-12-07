<?php

include "db_config.inc.php";

function assertUniqueHash($sha256) {
  global $pdo;
  global $originalFilename;

  if (!preg_match('/^[0-9A-Fa-f]{64}$/', $sha256)) {
      die('{"jsonrpc" : "2.0", "error" : {"code": 913, "message": "Invalid hash."}, "id" : "id"}');
  }

  // check for duplicate hash
  $s=$pdo->prepare('SELECT id FROM pictures WHERE sha256 = :sha256 LIMIT 1');
  $s->bindValue(':sha256',hex2bin($sha256));
  $s->execute();
  $row=$s->fetch(PDO::FETCH_ASSOC);
  if ($row) {
    die('{"jsonrpc" : "2.0", "error" : {"code": 904, "message": "Duplicate file: '."$originalFilename (".$row['id'].')."}, "id" : "id"}');
  }
}


?>
