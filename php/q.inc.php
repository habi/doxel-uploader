<?php
/*
 * q.inc.php
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


include "auth.inc.php";
include "utils.inc.php";

header('Content-type: text/json');

$q=$_REQUEST['q'];
$result=array();

if (!call_user_func('q_'.$q)) {
  die('{"jsonrpc" : "2.0", "error" : {"code": 702, "message": "Invalid command: '.$q.'"}, "id" : "id"}');
}
die('{"jsonrpc" : "2.0", "result" : '.(count($result)?json_encode($result):'{}').', "id" : "id"}');

function q_getUserInfo() {
  global $isnewuser;

  $reply=array();
  $reply['isnewuser']=$isnewuser;
  $reply['email']=$_SESSION['user'];
  if ($isnewuser) {
      $reply['password']=$_SESSION['password'];
      unset($_SESSION['password']);
  }

  $json=json_encode($reply);
  header('Content-Length: '.strlen($json));
  die($json);

} // q_getUserInfo

/**
* Check sha256 uniqueness
*/
function q_uniq() {
  header('Content-type: text/json');
  assertUniqueHash($_REQUEST['sha256']);
  return true;

} // q_uniq

/**
 * Check accessToken
 */
function q_checkAccessToken() {
    // if we get here after auth.inc.php?action=verify the access token is already validated
    die('{"jsonrpc" : "2.0", "result" : {}, "id" : "id"}');
}

/*
function q_register() {
  global $token, $fingerprint, $user, $password_minlen;

  if (!isset($_POST['password']) || strlen($_POST['password'])<$password_minLen) {
    die('{"jsonrpc" : "2.0", "error" : {"code": 701, "message": "Invalid password."}, "id" : "id"}');
  }

  $password=$_REQUEST['password'];
  $hash=password_hash($token+$user+$password);

}
*/

?>
