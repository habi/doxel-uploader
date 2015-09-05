/*
 * histogram.js
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

/**
* @constructor Histogram
* @param {Object} [options]
*   @param {String} [options.type] histogram type (hsv, ...)
*   @param {Image} [options.img]
*/
function Histogram(options) {
  if (!(this instanceof Histogram)) {
    return new Histogram(options);
  }
  $.extend(true,this,options);
  this[this.type].init.call(this);
}

$.extend(true,Histogram.prototype,{

  width: 512,

  compare: function histogram_compare(options){
    var histogram=this;
    return histogram[histogram.type].compare.apply(histogram,[options]);

  }, // histogram_compare

  /**
  * @object histogram.hsv
  */
  hsv: {

    /**
    * @property histogram.hsv.steps
    */
    steps: {
      hue: 360,
      sat: 255,
      val: 255
    },

    /**
    * @method histogram.hsv.init
    */
    init: function histogram_hsv_init() {
      var histogram=this;

      var img=histogram.img;
      var canvas=document.createElement('canvas');

      canvas.width=histogram.width||img.width;
      canvas.height=(histogram.width)?histogram.width/img.width*img.height:img.height;

      var ctx=canvas.getContext('2d');
      ctx.drawImage(img,0,0);

      var imageData=ctx.getImageData(0,0,canvas.width,canvas.height);

      var hueSteps=histogram.hsv.steps.hue;
      var satSteps=histogram.hsv.steps.sat;
      var valSteps=histogram.hsv.steps.val;
      var H=histogram.H=new Uint32Array(hueSteps+1);
      var S=histogram.S=new Uint32Array(satSteps+1);

      if (valSteps) {
        var V=histogram.V=new Uint32Array(valSteps+1);
      } else {
        histogram.V=null;
      }

      var data=imageData.data;

      for(var offset=0; offset<data.length; offset+=4) {

        // convert RGB pixel to HSV

        var r=data[offset]/255;
        var g=data[offset+1]/255;
        var b=data[offset+2]/255;

        var max=Math.max(r,g,b);
        var h,s,v=max;
        var min=Math.min(r,g,b);
        var d=max-min;
        s=(max)?d/max:0;

        switch(max) {
          case min:
            h=0;
            break;

          case r:
            h=((g-b)/d+(g<b?6:0))/6;
            break;

          case g:
            h=((b-r)/d+2)/6;
            break;

          case b:
            h=((r-g)/d+4)/6;
            break;
        }

        ++H[h*hueSteps];
        ++S[s*satSteps];
        ++V[v*valSteps];

      }

    }, // histogram.hsv.init

    /**
     * @method histogram.hsv.compare
     * @param {Object} [options]
     * @param {Histogram} [options.with]
     * @param {String} [options.type] correlation, euclidian, ...
    */
    compare: function histogram_hsv_compare(options) {
      var histogram=this;
      var histogram2=options.histogram;

      if (
        histogram.hsv.steps.hue!=histogram2.hsv.steps.hue ||
        histogram.hsv.steps.sat!=histogram2.hsv.steps.sat ||
        histogram.type!=histogram2.type
      ) {
        throw "histogram mismatch";
      }

      var hueSteps=histogram.hsv.steps.hue;
      var H=histogram.H;
      var H2=histogram2.H;

      var satSteps=histogram.hsv.steps.sat;
      var S=histogram.S;
      var S2=histogram2.S;

      var valSteps=histogram.hsv.steps.val;
      var V=histogram.V;
      var V2=histogram2.V;

      switch(options.type) {

        case 'correlation': 
          // Algorithm from opencv/modules/imgproc/histogram.cpp
          var s12=0;
          var s1=0;
          var s11=0;
          var s2=0;
          var s22=0;
          for(var hi=0; hi<=hueSteps; ++hi) {
            var a=H[hi];
            var b=H2[hi];
            s12+=a*b;
            s1+=a;
            s11+=a*a;
            s22+=b*b;
          }
          var scale=1/hueSteps;
          var num=s12-s1*s2*scale;
          var denom2=(s11-s1*s1*scale)*(s22-s2*s2*scale);

          return [Math.abs(denom2)>(Number.EPSILON||2e-16)?num/Math.sqrt(denom2):1];

        case 'euclidian':
        default:
          var Hsum=0;
          for(var hi=0; hi<=hueSteps; ++hi) {
            var dh=Math.abs(H[hi]-H2[hi]);
            Hsum+=dh*dh;
          }

          var Ssum=0;
          for(var si=0; si<=satSteps; ++si) {
            var ds=Math.abs(S[si]-S2[si]);
            Ssum+=ds*ds;
          }

          var Vsum=0;
          for(var vi=0; vi<=valSteps; ++vi) {
            var dv=Math.abs(V[vi]-V2[vi]);
            Vsum+=dv*dv;
          }

          return [
            (Hsum)?Math.sqrt(Hsum):0,
            (Ssum)?Math.sqrt(Ssum):0,
            (Vsum)?Math.sqrt(Vsum):0
          ];
      }

    } // histogram.hsv.compare

  } // hsv

}); // extend Histogram.prototype
