<?php
/*
 * auth.inc.php
 *
 * Copyright (c) 2015 ALSENET SA - http://doxel.org
 * Please read <http://doxel.org/license> for more information.
 *
 * Author(s):
 *
 *      Rurik Bugdanov <rurik.bugdanov@alsenet.com>
 *
 * This file is part of the DOXEL project <http://doxel.org>.
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 *
 * Additional Terms:
 *
 *      You are required to preserve legal notices and author attributions in
 *      that material or in the Appropriate Legal Notices displayed by works
 *      containing it.
 *
 *      You are required to attribute the work as explained in the "Usage and
 *      Attribution" section of <http://doxel.org/license>.
 */

include "db_config.inc.php";
include "cookies.inc.php";

// validate fingerprint
if (!isset($fingerprint) || !eregi('^[0-9a-z]{32}$',$fingerprint)) {
  die('{"jsonrpc" : "2.0", "error" : {"code": 909, "message": "Invalid or missing fingerprint."}, "id" : "id"}');
}

// validate existing user or die
if (isset($token) && eregi('^[0-9a-z]{32}$',$token)) {

 // get user info for given fingerprint and token                                                         
  $s=$pdo->prepare("SELECT * FROM users WHERE fingerprint = :fingerprint AND pass = :token LIMIT 1");
  if ($s->execute(array(
    ':fingerprint' => $fingerprint,
    ':token' => $token
  ))){
    if ($row=$s->fetch(PDO::FETCH_ASSOC)) {
      setcookie( "userid", $row['id'], pow(2,31) /* 2038-01-19 04:14:07 */, '/');

    } else {
      die('{"jsonrpc" : "2.0", "error" : {"code": 910, "message": "Access denied. Try to clear your cookies."}, "id" : "id"}');

    }

  } else {
    die('{"jsonrpc" : "2.0", "error" : {"code": 911, "message": "Query failed."}, "id" : "id"}');

  }

}

// automatic registration 
if (isset($fingerprint) && (!isset($token) || !eregi('^[0-9a-z]{32}$',$token))) {

  // generate unique password for new user
  $length=16;
  do {
    $token=bin2hex(openssl_random_pseudo_bytes($length));
    $s=$pdo->prepare("SELECT * FROM users WHERE pass = :token LIMIT 1"); 
    $s->bindValue(':token', $token);
    $s->execute();

  } while($s->fetch());

  $s=$pdo->prepare("INSERT INTO users(fingerprint, pass, ip, forwarded_for) VALUES(:fingerprint, :pass, :ip, :forwarded_for)");
  $s->execute(array(
    "fingerprint" => $fingerprint,
    "pass" => $token,
    "ip" => $_SERVER['REMOTE_ADDR'],
    "forwarded_for" => (isset($_SERVER['HTTP_X_FORWARDED_FOR'])?$_SERVER['HTTP_X_FORWARDED_FOR']:"")
  ));
  $userid=$pdo->lastInsertId();

  setcookie( "userid", $userid, pow(2,31) /* 2038-01-19 04:14:07 */, '/');
  setcookie( "token", $token, pow(2,31) /* 2038-01-19 04:14:07 */, '/');

}


?>
