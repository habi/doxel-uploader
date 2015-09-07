<?php
/*
 * q.inc
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

  include "auth.inc";

  call_user_func('q_'.$q);
  exit(0);

  function q_getUserInfo() {
    global $token, $fingerprint, $pdo;

    $json="{}";

    // get dummy session info for given fingerprint and token
    $s=$pdo->prepare("SELECT * FROM users WHERE fingerprint = :fingerprint AND pass = :token LIMIT 1");
    if ($s->execute(array(
      ':fingerprint' => $fingerprint,
      ':token' => $token
    ))) {

      if ($row=$s->fetch(PDO::FETCH_ASSOC)) {
        setcookie("userid", $row['id'], pow(2,31), '/');
        $json=json_encode(array(
          "id" => $row['id']
        ));
      }
    }

    header('content-type: text/json');
    header('Content-Length: '.strlen($json));
    echo $json;

  } // q_getUserInfo

  function q_register() {
    global $token, $fingerprint, $user, $password_minlen;

    if (!isset($_POST['password']) || strlen($_POST['password'])<$password_minLen) {
      die('{"jsonrpc" : "2.0", "error" : {"code": 701, "message": "Invalid password."}, "id" : "id"}');
    }

    include "db_config.inc";

    $password=$_POST['password'];
    $hash=password_hash($token+$user+$password);

  }
  
?>
