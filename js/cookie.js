/*
 * cookie.js
 *
 * Copyright (c) 2015 ALSENET SA - http://doxel.org
 * Please read <http://doxel.org/license> for more information.
 *
 * Author(s):
 *
 *      Rurik Bogdanov <rurik.bugdanov@alsenet.com>
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

var cookie={

  /**
  * @method cookie.get
  *
  * Return requested cookie value from cookies or localStorage.
  * When cookie exists, copy value in localStorage.
  *
  * @param {String} [name] cookie name
  * @return {Object} [cookie]  cookie value, or undefined
  *
  */
  get: function cookie_get(name) {

    // get cookie
    var value=$.cookie(name);

    if (value!==undefined) {

      if (localStorage) {
        // copy cookie in localStorage
        localStorage[name]=value;
      }

      return value;
    }

    if (!localStorage) {
      return undefined;
    }

    // get cookie from localStorage
    value=localStorage[name];

    // copy in real cookie
    if (value!==undefined) {
      $.cookie(name,value,cookie.expire);
    }

    return value;

  }, // cookie.get

  /**
  * @method cookie.set
  *
  * Store specified value in specified cookie and in localStorage.
  *
  * @param {String} [name] cookie name
  * @param {Object] [value] cookie value
  * @param {Number} [expire] cookie expiration timestamp, defaults to cookie.expire
  *
  */
  set: function cookie_set(name,value,expire) {

    $.cookie(name,value,expire||cookie.expire);

    if (localStorage) {
      localStorage[name]=value;
    }

  }, // cookie.set

  /**
  * @method cookie.unset
  *
  * unset specified cookie and localStorage.
  *
  * @param {String} [name] cookie name
  *
  */
  unset: function cookie_unset(name,value,expire) {

    $.removeCookie(name);

    if (localStorage) {
      delete localStorage[name];
    }

  } // cookie.unset

} // cookie
