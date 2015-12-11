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

function getAccessToken($token) {
    // compute hash for (user_token + proxy_ip + client_ip + session_salt)
    return sha1($token.(isset($_SERVER['HTTP_X_FORWARDED_FOR'])?$_SERVER['HTTP_X_FORWARDED_FOR']:"").$_SERVER['REMOTE_ADDR'].$_SESSION['random']);
}

function setAccessTokenCookie($token) {
    global $access_token;
    $access_token=getAccessToken($token);
    setcookie( "access_token", $access_token, pow(2,31) /* 2038-01-19 04:14:07 */, '../');
}

function checkAccessToken($access_token) {
    global $pdo;

    if (!isset($_SESSION) || !isset($_SESSION['userid'])) {
        return FALSE;
    }

    // check
    $s=$pdo->prepare("SELECT * FROM users WHERE id = :userid LIMIT 1");
    if ($s->execute(array(
        ':userid' => $_SESSION['userid']
    ))){
    if ($row=$s->fetch(PDO::FETCH_ASSOC)) {
            $_SESSION['user']=strlen($row['email'])?$row['email']:$row['token'];
            $_SESSION['usertoken']=$row['token'];
            return $access_token == getAccessToken($row['token']);
        } else {
            return FALSE;
        }

    } else {
        return FALSE;
    }
}

if (isset($access_token) && eregi('^[0-9a-z]{40}$',$access_token) && checkAccessToken($access_token)) {
    $authenticated=true;

    // set or change user email
    if (isset($email) && filter_var($email, FILTER_VALIDATE_EMAIL)) {
        if (!filter_var($_SESSION['user']['email'], FILTER_VALIDATE_EMAIL)) {
            // setting email for the first time
            $s=$pdo->prepare("UPDATE users SET email = :email WHERE id = :id LIMIT 1");
            if (!$s->execute(array(
                ':id' => $_SESSION['userid'],
                ':email' => $email
            ))){
                die('{"jsonrpc" : "2.0", "error" : {"code": 911, "message": "Query failed."}, "id" : "id"}');
            }

        } else {
            // TODO: change email
            die('{"jsonrpc" : "2.0", "error" : {"code": 911, "message": "Query failed."}, "id" : "id"}');
        }

    }
    $_SESSION['user']=$email;

} else {

    // delete access_token
    setcookie("access_token", FALSE, -1, '../');

    // action defaults to "login"
    $action=isset($_REQUEST['action']) ? $_REQUEST['action'] : 'login';

    if ($action=='login') {

        // if email looks like a valid email, authenticate using email / password
        if (isset($email) && preg_match('/\S+@\S+\.\S+/',$email)) {

         // get user info for given email and password
          $s=$pdo->prepare("SELECT * FROM users WHERE email = :email LIMIT 1");
          if ($s->execute(array(
            ':email' => $email
          ))){
            if ($row=$s->fetch(PDO::FETCH_ASSOC) && password_verify($password,$row['pass'])) {
              setAccessTokenCookie($row['token']);
              $_SESSION['userid']=$row['id'];
              $_SESSION['user']=strlen($row['email'])?$row['email']:$row['token'];

            } else {
              setcookie("authenticate_again", true, pow(2,31), '../');
              die('{"jsonrpc" : "2.0", "error" : {"code": 910, "message": "Authentication failed."}, "id" : "id"}');
            }

          } else {
            die('{"jsonrpc" : "2.0", "error" : {"code": 911, "message": "Query failed."}, "id" : "id"}');
          }

        // else assume email is the generated token
        } else if (isset($email) && eregi('^[0-9a-z]{32}$',$email)) {

         // get user info for given token and password
          $s=$pdo->prepare("SELECT * FROM users WHERE token = :token LIMIT 1");
          if ($s->execute(array(
            ':token' => $email
          ))){
            if (($row=$s->fetch(PDO::FETCH_ASSOC)) && password_verify($password,$row['pass'])) {
              setAccessTokenCookie($email);
              $_SESSION['userid']=$row['id'];
              $_SESSION['user']=strlen($row['email'])?$row['email']:$row['token'];

            } else {
              setcookie("authenticate_again", true, pow(2,31), '../');
              die('{"jsonrpc" : "2.0", "error" : {"code": 910, "message": "Authentication failed."}, "id" : "id"}');
            }

          } else {
            die('{"jsonrpc" : "2.0", "error" : {"code": 911, "message": "Query failed."}, "id" : "id"}');
          }

        } else {
            // invalid email input content
            setcookie("authenticate_again", true, pow(2,31), '../');
            die('{"jsonrpc" : "2.0", "error" : {"code": 910, "message": "Authentication failed."}, "id" : "id"}');
        }

    } else if ($action=='signup') {

          // validate fingerprint
          if (!isset($fingerprint) || !eregi('^[0-9a-z]{32}$',$fingerprint)) {
            setcookie("authenticate_again", true, pow(2,31), '../');
            die('{"jsonrpc" : "2.0", "error" : {"code": 909, "message": "Invalid or missing fingerprint."}, "id" : "id"}');
          }

          // generate unique token for new user
          $length=16;
          do {
            $token=bin2hex(openssl_random_pseudo_bytes($length));
            $s=$pdo->prepare("SELECT * FROM users WHERE token = :token LIMIT 1");
            $s->bindValue(':token', $token);
            $s->execute();

          } while($s->fetch());

          // generate unique password for new user
          do {
            $password=bin2hex(openssl_random_pseudo_bytes($length));
            $s=$pdo->prepare("SELECT * FROM users WHERE pass = :password LIMIT 1");
            $s->bindValue(':password', $password);
            $s->execute();

          } while($s->fetch());

          $row=array(
            "fingerprint" => $fingerprint,
            "email" => (preg_match('/\S+@\S+\.\S+/',$email)?$email:''),
            "token" => $token,
            "pass" => password_hash($password,PASSWORD_DEFAULT),
            "ip" => $_SERVER['REMOTE_ADDR'],
            "forwarded_for" => (isset($_SERVER['HTTP_X_FORWARDED_FOR'])?$_SERVER['HTTP_X_FORWARDED_FOR']:"")
          );

          // add new user to database
          $s=$pdo->prepare("INSERT INTO users(fingerprint, email, token, pass, ip, forwarded_for) VALUES(:fingerprint, :email, :token, :pass, :ip, :forwarded_for)");
          $s->execute($row);

          // set user as authenticated
          setAccessTokenCookie($token);
          $_SESSION['userid']=$pdo->lastInsertId();
          $_SESSION['user']=$token;
          $_SESSION['password']=$password;

          $shit=array(
            "fingerprint" => $fingerprint,
            "token" => $token,
            "pass" => password_hash($password,PASSWORD_DEFAULT),
            "ip" => $_SERVER['REMOTE_ADDR'],
            "forwarded_for" => (isset($_SERVER['HTTP_X_FORWARDED_FOR'])?$_SERVER['HTTP_X_FORWARDED_FOR']:"")
        );
          $pass=password_hash($password,PASSWORD_DEFAULT);
          $isnewuser=true;

    }

}

?>
