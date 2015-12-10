<?php
/*
 * cookies.inc.php
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

session_name("session");
session_set_cookie_params(0,'/');
if (session_status()!==PHP_SESSION_ACTIVE) {
    session_start();
    $_SESSION['random']=bin2hex(openssl_random_pseudo_bytes(16));
}
$session=session_id();

if (isset($_COOKIE['access_token'])) {
  $access_token=$_COOKIE['access_token'];
}

if (isset($_COOKIE['token'])) {
  $token=$_COOKIE['token'];
}

if (isset($_COOKIE['fingerprint'])) {
  $fingerprint=$_COOKIE['fingerprint'];
}

if (isset($_COOKIE['email'])) {
  $email=$_COOKIE['email'];
}

?>
