<?php

if (!isset($pdo)) {

  $db_host="localhost";
  $db_user="root";
  $db_pass="root";
  $db_name="doxel";

  try {
      $pdo = new PDO("mysql:host=$db_host;dbname=$db_name", $db_user, $db_pass, array(PDO::ATTR_PERSISTENT => true));
      // set the PDO error mode to exception
      $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

  } catch(PDOException $e) {
      $message="Database connection failed: " . $e->getMessage();
      die('{"jsonrpc" : "2.0", "error" : {"code": 800, "message": "'.$message.'"}, "id" : "id"}');

  }

}

?>

