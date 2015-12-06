/*
 * doxel-webapp.js
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

$(document).ready(function(){
    if (cookie.get('reload')) {
        cookie.unset('reload');
        window.location=window.location.href;
        return;
    }

    webapp.init();
});

/**
* @object views
*
* View instances
*/
var views={

  /**
   * @property views.termsAndConditions
   *
   * Display termsAndConditions
   * user must agree to continue
   *
   * @event {agree} the user agreed
   *
   */
  termsAndConditions: new View({

    url: 'view/termsAndConditions.html',
    container: 'div#termsAndConditions',
    className: 'termsAndConditions',

    /**
     * @method views.termsAndConditions.onload
     */
    onload: function views_termsAndConditions_onload() {
      var view=this;
      view.setupEventHandlers();
      $(view).trigger('ready');

    }, // views.termsAndConditions.onload

    /**
     * @method views.termsAndConditions.setupEventHandlers
     */
    setupEventHandlers: function views_termsAndConditions_setupEventHandlers(){

      var view=this;

      view.getElem().on('click','.button',function(e) {
        view.buttonClick(e);
      });;

    }, // views.termsAndConditions.setupEventHandlers

    /**
     * @method views.termsAndConditions.buttonClick
     */
    buttonClick: function views_termsAndConditions_buttonClick(e){

      // the only way out of this view is clicking on agree
      if ($(e.target).hasClass('agree')) {
        $(views.termsAndConditions.container).remove();
        $(webapp).trigger('agree');
      }

    } // views.termsAndConditions.setupEventHandlers

  }), // views.termsAndConditions

  /**
   * @property views.plupload
   *
   * view where the user can add the photos to upload
   * and where the thumbnail list is displayed using plupload
   *
   */
  plupload: new View({

    /**
    * @property views.plupload.url
    */
    url: 'view/plupload.html',

    /**
    * @property views.plupload.container
    */
    container: 'div#plupload',

    /**
    * @property views.plupload.uploaderEvents
    *
    * see plupload source code for uploader events documentation
    *
    */
    uploaderEvents: {

      /**
      * @method views.plupload.uploaderEvents.Error
      *
      */
      Error: function views_plupload_uploaderEvents_Error(uploader,error){
        console.log('Error',arguments);
        if (error.code!=-602) { // no alert here on duplicate file error
            alert(error.message);
            uploader.stop();
        }
      },

      /**
      * @method views.plupload.uploaderEvents.browse
      *
      */
      Browse: function views_plupload_uploaderEvents_browse(uploader){
        uploader.file_duplicate_count=0;
      },

      /**
      * @method views.plupload.uploaderEvents.FilesAdded
      *
      */
      FilesAdded: function views_plupload_uploaderEvents_filesAdded(uploader,files){
        if (uploader.file_duplicate_count) {
            alert(uploader.file_duplicate_count+' duplicate file'+((uploader.file_duplicate_count>1)?'s were':' was')+' discarded.');
            uploader.file_duplicate_count=0;
        }
      },

      /**
      * @method views.plupload.uploaderEvents.QueueChanged
      *
      * @param {Object} [uploader]
      */
      QueueChanged: function views_plupload_uploaderEvents_QueueChanged(uploader) {

        // update buttons on QueueChanged
        setTimeout(function(){
          plupload.calc();
          views.plupload.updateButtons();
        },0);

      }, // views_plupload_uploaderEvents.QueueChanged

      /**
      * @method views.plupload.uploaderEvents.updatebuttons
      *
      * @param {Object} [uploader]
      */
      updatebuttons: function views_plupload_uploaderEvents_updatebuttons(uploader) {

        setTimeout(function(){
          plupload.calc();
          views.plupload.updateButtons();
        },0)

      }, // views_plupload_uploaderEvents.updatebuttons

      /**
      * @method views.plupload.uploaderEvents.StateChanged
      *
      * @param {Object} [uploader]
      */
      StateChanged: function views_plupload_uploaderEvents_StateChanged(uploader) {

        switch (uploader.state) {
            case plupload.STARTED:
                // hide buttons during upload
                $('.plupload_buttons .ui-widget', views.plupload.container).css('visibility','hidden');
                break;

            case plupload.STOPPED:
                // show buttons hidden during upload
                $('.plupload_buttons .ui-widget', views.plupload.container).css('visibility','visible');

                if (uploader.file_duplicate_count) {
                    alert(uploader.file_duplicate_count+' duplicate file'+((uploader.file_duplicate_count>1)?'s were':' was')+' discarded by server.');
                    uploader.file_duplicate_count=0;
                }

                $(views.plupload.container).trigger('lazyload');
        }

      }, // views.plupload.uploaderEvents.StateChanged

      /**
      * @method views.plupload.uploaderEvents.CancelUpload
      *
      * plupload CancelUpload event handler
      *
      * @param {Object} [uploader]
      */
      CancelUpload: function views_plupload_uploaderEvents_CancelUpload(uploader){

        // requeue files not uploaded
        views.plupload.requeueFilesWithStatus(plupload.FAILED,plupload.STARTED,plupload.UPLOADING);

        // exclude uploaded files from calculations
        views.plupload.updateQueue();

        // update counters
        plupload.calc();

        // update buttons
        views.plupload.updateButtons();

      }, // views.plupload.uploaderEvents.CancelUpload

      /**
      * @method views.plupload.uploaderEvents.UploadFile
      *
      * plupload UploadFile event handler
      *
      * @param {Object} [uploader]
      * @param {Object} [file]
      */
      UploadFile: function views_plupload_uploaderEvents_UploadFile(uploader,file) {

        // set default timestamp to file modification date
        var _file=file.getNative();
        var timestamp=String(_file.lastModified || _file.lastModifiedDate.getTime() || (new Date()).getTime()).replace(/([0-9]{10})/,'$1_')+'000';

        // try to extract timestamp and GPS coordinates from EXIF
        loadImage.parseMetaData(

          // File object
          file.getNative(),

          // parseMetadata callback
          function(data){
            var date_str;
            var subSec;
            var lon,lat;

            if (data && data.exif) {

              // try to get date from EXIF
              try {
                date_str=data.exif.get('DateTimeOriginal');
                subSec=data.exif.get('SubSecTimeOriginal');

              } catch(e) {
                console.log(e);
              }

              if (date_str) {

                // try to convert date to numerical timestamp
                try {
                  var _timestamp=new Date(date_str.replace(/([0-9]{4}):([0-9]{2}):([0-9]{2})/,"$1/$2/$3")).getTime();

                  if (isNaN(_timestamp)) {
                     _timestamp=new Date(date_str.replace(/([0-9]{4}):([0-9]{2}):([0-9]{2})/,"$1-$2-$3")).getTime();
                  }

                  if (isNaN(_timestamp)) {
                    if (!window.invalidTimestamp) {
                      alert('Could not convert EXIF timestamp. Other occurences will be ignored.');
                      window.invalidTimestamp=true;
                    }

                  } else {

                    if (subSec) {
                      timestamp=String(_timestamp).substr(0,10)+'_'+subSec.trim().substr(0,6);
                      while(timestamp.length<17) timestamp+='0';

                    } else {
                      timestamp=String(_timestamp).replace(/([0-9]{10})/,'$1_')+'000';

                    }
                  }

                } catch(e) {
                  console.log(date_str,e);
                  alert(e.message);
                }
              }

              // get GPS coordinates
              try {
                var dms=data.exif.get('GPSLongitude');
                if (dms) {
                  // convert to decimal
                  lon=parseInt(dms[0])+parseInt(dms[1])/60+parseInt(dms[2])/3600;

                  // set negative value for west coordinate
                  if (data.exif.get('GPSLongitudeRef')=='W') {
                    lon=-Math.abs(lon);
                  }

                }
              } catch(e) {
                console.log(e);
                alert(e.message);
              }

              try {
                var dms=data.exif.get('GPSLatitude');

                if (dms) {
                  // convert to signed decimal
                  lat=parseInt(dms[0])+parseInt(dms[1])/60+parseInt(dms[2])/3600;

                  // set negative value for south coordinate
                  if (data.exif.get('GPSLatitudeRef')=='S') {
                    lat=-Math.abs(lat);
                  }

                }

              } catch(e) {
                console.log(e);
                alert(e.message);
              }

            }

            // insert copyright and compute file hash
            file_update(file.getNative(),function(result){

              if (!result.sha256) {
                alert("Could not compute file hash for "+file.name);
                uploader.stop();
                return;
              }

              // check for hash uniqueness
              $.ajax({
                method: 'POST',

                data: {
                  q: 'uniq',
                  sha256: result.sha256
                },

                success: function(json){
                  if (json.error) {
                    console.log(json.error);

                    // stop if error is not "duplicate file"
                    if (json.error.code!=904) {
                      alert(json.error.message);
                      uploader.stop();
                      return;
                    }

                    // increment duplicate count
                    ++uploader.file_duplicate_count;

                    // mark as uploaded
                    file.status=plupload.DONE;

                    // remove DOM element
                    var $file = $('#'+file.id);
                    $file.remove();

                    // upload next
                    setTimeout(function() {
                      plupload.uploadNext.call(uploader);
                    }, 1);

                    return;
                  }

                  if (!json.success) {
                    alert('Could not check for file hash uniqueness');
                    uploader.stop();
                    return;
                  }

                  // set metadata to be uploaded
                  uploader.setOption('multipart_params',{
                    timestamp: timestamp,
                    lon: lon,
                    lat: lat,
                    sha256: result.sha256
                  });

                  // update file
                  if (!file.updated) {

                    // convert result.jpeg to ArrayBuffer
                    var buf=new Uint8Array(result.jpeg.length);
                    for (var i=0; i< result.jpeg.length; ++i) {
                      buf[i]=result.jpeg.charCodeAt(i);
                    }

                    // convert ArrayBuffer to Blob
                    var blob=new Blob([buf],{type:'image/jpeg'});
                    blob.name=file.name;

                    // convert to plupload/moxie tainted File
                    var filesAdded=uploader.addFile(blob);
                    var newfile=filesAdded[0];

                    // copy file properties
                    newfile._handleFileStatus=file._handleFileStatus;
                    newfile.status=plupload.UPLOADING;
                    newfile.sha256=result.sha256;

                    // flag file as updated
                    newfile.updated=true;

                    for (var i=0; i<plupload.files.length; ++i) {
                      if (file.id==plupload.files[i].id) {
                        // replace old file entry value in plupload queue
                        plupload.files[i]=newfile;

                        // remove newfile array entry in plupload queue
                        plupload.files.splice(newfile._insertBefore,1);
                        break;
                      }
                    }

                    // replace gui list element
                    $('#'+file.id).replaceWith($('#'+newfile.id));

                    // use newfile instead of original one
                    file=newfile;
                  }

                  // start upload
                  plupload.onUploadFile.call(this,uploader,file);

                },

                error: function(json){
                  if (json.error) {
                    console.log(json.error);
                    alert(json.error.message);

                  } else {
                    alert('Could not check for file hash uniqueness');

                  }
                  uploader.stop();
                }

              }); // ajax

            });

          },

          // parseMetadata options
          {
             maxMetaDataSize:262144,
             disableImageHead:false
          }

        );

      }, // views.plupload.uploaderEvents.UploadFile

      /**
      * @method views.plupload.uploaderEvents.FileUploaded
      *
      * @param {Object} [uploader]
      * @param {Object} [file]
      * @param {Object} [info]
      */
      FileUploaded: function views_plupload_uploaderEvents_FileUploaded(uploader,file,info){

          var failed;
          var message;

          var $file = $('#'+file.id);

          // get upload.php response
          var response=jQuery.parseJSON(info.response);

          // upload failed
          if (response.error) {

            failed=true;
            message=response.error.message;

          } else {

            if (response.success) {
               // remove DOM element after upload
               $file.remove();

            } else {
              // upload failed
              failed=true;
              message="A server error occured.";

            }
          }

          if (failed) {
            // set file status icon
            file.status=plupload.FAILED;
            file._handleFileStatus(file);

            // set file status icon text
            $('.plupload_action_icon',$file).attr('title',message);

            alert(message);
            uploader.stop();
          }

      }, // views.plupload.uploaderEvents.FileUploaded

      /**
      * @method views.plupload.uploaderEvents.UploadComplete
      *
      * @param {Object} [uploader]
      */
      UploadComplete: function views_plupload_uploaderEvents_UploadComplete(uploader) {

        uploader.total.uploaded=0;
        uploader.total.failed=0;
        uploader.total.loaded=0;
        uploader.total.size=0;
        uploader.total.queued=0;

        views.plupload.requeueFilesWithStatus(plupload.FAILED);

        // exclude uploaded files from calculations
        views.plupload.updateQueue();

        plupload.calc();

        views.plupload.updateButtons();

      } // views.plupload.uploaderEvents.UploadComplete

    }, // views.plupload.uploaderEvents

    /**
     * @method views.plupload.onload
     */
    onload: function views_plupload_onload(){

      var view=this;

      view.setupEventHandlers();
      view.setupUploader();

    }, // views.plupload.onload

   /**
   * @method views.plupload.setupUploader
   */
   setupUploader: function views_plupload_setupUploader() {

      var view=this;

      // initialize jquery.plupload
      $(view.container)
      .plupload({

        /**
         * @property jquery.plupload.preinit
         *
         * uploader event handlers
         *
         */
        preinit: view.uploaderEvents,

        /**
        * @method jquery.plupload.init
        *
        * initialize uploader
        *
        */
        init: function(uploader){

          // expose uploader (yeeks)
          plupload.uploader=uploader;

        }, // jquery.plupload.init

       /**
        * @method jquery.plupload.selected
        *
        * select added files
        *
        */
        selected: function(e,o){
            views.plupload.selectFiles(o.files);
        }, // selected

       /**
        * @method jquery.plupload.start
        *
        * uploader is started
        *
        */
        start: function(event,o){
            var uploader=o.up;

            uploader.total.uploaded=0;
            uploader.total.failed=0;
            uploader.total.loaded=0;
            uploader.total.size=0;
            uploader.total.queued=0;

            views.plupload.requeueFilesWithStatus(plupload.FAILED);
            plupload.calc();
            views.plupload.updateButtons();
        },

        /**
        * @method jquery.plupload.updatebuttons
        *
        * update uploader buttons
        *
        */
        updatebuttons: function() {

          clearTimeout(this.updateButtonsTimeout);

          this.updateButtonsTimeout=setTimeout(function(){
              plupload.calc();
              views.plupload.updateButtons();

          },150);

        }, // jquery.plupload.updatebuttons


        // General settings
        runtimes : 'html5,html4',

        // upload script url
        url : 'php/upload.php',

        // upload chunk size
        chunk_size: '1mb',

        filters : {
          prevent_duplicates: true
        },

        // Rename files by clicking on their titles
        rename: false,

        // Sort files
        sortable: false,

        // Enable ability to drag'n'drop files onto the widget (currently only HTML5 supports that)
        dragdrop: true,

        // Views to activate
        views: {
          list: true,
          thumbs: true, // Show thumbs
          default: 'list'
        }

      });

    }, // views.plupload.setupUploader

    /**
    * @method views.plupload.setupEventHandlers
    */
    setupEventHandlers: function views_plupload_setupEventHandlers() {

      // make files selectable
      $('.plupload_content',views.plupload.container).selectable({
        filter: 'li',
        start: function(){
          views.plupload.updateButtons();
        },
        stop: function() {
          views.plupload.updateButtons();
        }
      });

      // upload cancel button
      $('.plupload_started .cancel',views.plupload.container).on('click', function(){

        var uploader=plupload.uploader;

        uploader.stop();

        uploader.total.uploaded=0;
        uploader.total.failed=0;
        uploader.total.loaded=0;
        uploader.total.size=0;
        uploader.total.queued=0;

        views.plupload.requeueFilesWithStatus(plupload.FAILED);
        plupload.calc();
        views.plupload.updateButtons();

      });

      // trash button
      $('.plupload_buttons .plupload_trash', views.plupload.container).button({
//        icons: { primary: "ui-icon-trash" },
        disabled: true

      }).on('click',function(e){
        var selection=$('.plupload_filelist_content .ui-selected', views.plupload.container);
        if (confirm($(e.target).text()+' from upload queue ?')) {
            views.plupload.removeFilesFromQueue();
        }

      });

      // buttons except view radio buttons
      $('.fa-button').not('.plupload_view_switch label').button();

      // refresh html5 input size on resize
      $(window).on('resize',function(){
        plupload.uploader.refresh();
      });

      $('a.termsAndConditions_link',views.plupload.container).on('click',function(){

        webapp.onagree=function(){
          views.termsAndConditions.getElem().hide(0);
          views.plupload.getElem().show(0);
        }

        views.plupload.getElem().hide(0);

        views.termsAndConditions.show();

      });

    }, // views.plupload.setupEventHandlers

    /**
    * @method views.plupload.updateQueue
    *
    * update queue after upload completed or canceled:
    * keep already uploaded files to detect duplicates,
    * but exclude them from calculations
    *
    */
    updateQueue: function views_plupload_updateQueue() {

      $.each(plupload.files,function(){
        if (this.status==plupload.DONE) {
          this.status=plupload.DONE_BEFORE;
        }
      });

    }, // views_plupload_updateQueue

    /**
    * @method views.plupload.removeFilesFromQueue
    *
    * remove selected files or all
    *
    */
    removeFilesFromQueue: function views_plupload_removeFilesFromQueue() {
      var getFile=plupload.uploader.getFile;
      var removeFile=plupload.uploader.removeFile;
      var selection=$('.plupload_filelist_content .ui-selected', views.plupload.container);
      var files=[];

      if (selection.length) {

        // remove selection from queue

        if (selection.length==1) {
          // get next element
          var next=selection.next();
        }

        // remove selection
        $.each(selection,function(){
          plupload.uploader.removeFile(this.id);
        });

        if (next) {
          // select next element
          next.addClass('ui-selected');
        }

      } else {

        // remove all queued files

        var queued_files=[];

        $.each(plupload.files,function(){
          if (this.status==plupload.QUEUED) {
            queued_files.push(this.id);
          }
        });

        // calling removeFile() in the plupload.files loop above fails
        $.each(queued_files,function(i,id){
          plupload.uploader.removeFile(id);
        });

      }

      plupload.uploader.trigger('lazyload');

    }, // views.plupload.removeFilesFromQueue


    /**
    * @method views.plupload.requeueFilesWithStatus
    *
    * re-queue files with given plupload status
    *
    * @param {Number, ...} [plupload_status, ...]
    *
    */
    requeueFilesWithStatus: function views_plupload_requeueFilesWithStatus() {

      // get argument list array
      var args=Array.prototype.slice.apply(arguments);

      $.each(plupload.files,function(i,file){
           if (file.status!=plupload.DONE && file.status!=plupload.UPLOADING && file.status!=plupload.DONE_BEFORE) {

              if (file.status==plupload.FAILED) {
                // decrement failed count
                --plupload.uploader.total.failed;
              }

              if (file.status!=plupload.QUEUED) {
                file.status=plupload.QUEUED;
                // increment queued count
                ++plupload.uploader.total.queued;
              }

              // reset upload counters
              file.loaded=0;
              file.percent=0;

              if (file._handleFileStatus) {
                file._handleFileStatus(file);
              }
          }
      });

    }, // views.plupload.requeueFilesWithStatus

    /**
    * @method views.plupload.selectFiles
    *
    * select specified files
    *
    * @param {Array} [files] the plupload file list
    *
    */
    selectFiles: function views_plupload_selectFiles(files) {

      var list=[];

      $.each(files,function(i,file){
        list.push('#'+file.id);
      });

      $('.plupload_filelist_content',views.plupload.container)
        .find('.ui-selected')
          .removeClass('ui-selected')
          .end()
        .find(list.join(','))
          .addClass('ui-selected');

    }, // views.plupload.selectFiles


    /**
    * @method views.plupload.updateButtons
    */
    updateButtons: function views_plupload_updateButtons() {

      views.plupload.updateBrowseButton();
      views.plupload.updateStartButton();
      views.plupload.updateTrashButton();

    }, // views.plupload.updateButtons

    /**
    * @method views.plupload.updateBrowseButton
    */
    updateBrowseButton: function views_plupload_updateBrowseButton() {

        if (plupload.uploader.total.queued === 0) {
            $('#plupload_browse .ui-button-text',views.plupload.container).html('Add Files');

        } else {
            $('#plupload_browse .ui-button-text',views.plupload.container).html(plupload.uploader.total.queued+' file'+((plupload.uploader.total.queued>1)?'s':'')+' queued');

        }

    }, // views.plupload.updateBrowseButton

    /**
    * @method views.plupload.updateStartButton
    */
    updateStartButton: function views_plupload_updateStartButton() {
        $('#plupload_start',views.plupload.container).button('option','disabled',(plupload.uploader.total.queued === 0));
    }, // views.plupload.updateStartButton

    /**
    * @method views.plupload.updateTrashButton
    */
    updateTrashButton: function views_plupload_updateTrashButton() {

        // update trash button
        var selection=$('.plupload_filelist_content .ui-selected', views.plupload.container);

        // trash button
        $('.plupload_trash',views.plupload.container)

          // upate trash button text
          .button('option', 'label', (selection.length) ? 'Remove '+selection.length+' file'+((selection.length>1)?'s':'') : 'Remove All' )

          // update trash button visibility
          .button('option','disabled',(plupload.uploader.total.queued==0));

    } // views.plupload.updateTrashButton

  }), // views.plupload

  /**
   * @property views.upload
   *
   * view where the user can specify the photos to upload
   * and where the thumbnail list is displayed
   *
   */
  upload: new View({

    /**
     * @property views.upload.url
     */
    url: 'view/upload.html',

    /**
     * @property views.upload.container
     */
    container: 'div#upload',

    /**
     * @property views.upload.className
     */
    className: 'upload',

    /**
     * @property views.upload.preview_width
     */
    preview_width: 96,

    /**
     * @property views.upload.preview_height
     */
    preview_height: 72,

    /**
     * @method views.upload.onload
     */
    onload: function views_upload_onload(){
      var view=views.upload;

      view.resize();
      view.setupEventHandlers();

    }, // views.upload.onload

    /**
     * @method views.upload.resize
     */
    resize: function views_upload_resize(){
      var view=this;
      var uploadViewElem=view.getElem();

      // dragndrop area
      $('.area',uploadViewElem).css({
        width: $(view.parent).width()-40,
        height: $(view.parent).height()/2-40
      })

      // dragndrop area text
      $('.area .text',uploadViewElem).css({
        fontSize: Math.max($(view.parent).height()/20,40)
      })

      // image preview container
      $('.preview',uploadViewElem).css({
        width: $(view.parent).width()+10,
        top: $('.area',uploadViewElem).offset().top+$('.area',uploadViewElem).outerHeight(),
        height: uploadViewElem.height-$('.area',uploadViewElem).height()
      })

    }, // views.upload.resize

    /**
     * @method views.upload.setupEventHandlers
     */
    setupEventHandlers: function views_upload_setupEventHandlers(){
      var view=this;
      var uploadViewElem=view.getElem();

      // upload button clicked
      uploadViewElem.on('click','button.upload',function(e){
        view.uploadImages();

      });

      // files selected with file selection dialog
      uploadViewElem.on('change','input.files',function(e){
        view.addFiles(e.target.files);

      });

      // click on file drop area
      uploadViewElem.on('click','div.area',function(e){
        // show file selection dialog
        $('input.files',uploadViewElem).click();
      });

      // dragndrop events
      $(view.parent).on('dragover dragenter',function(e){
        $('div.area',uploadViewElem).addClass('hover');
        e.preventDefault();
        e.stopPropagation();
      });

      // dragndrop events
      $(view.parent).on('dragstop dragleave',function(e){
        $('div.area',uploadViewElem).removeClass('hover');
        e.preventDefault();
        e.stopPropagation();
      });

      // dragndrop events
      $(view.parent).on('drop',function(e){
        $('div.area',uploadViewElem).removeClass('hover');
        e.preventDefault();
        e.stopPropagation();
        view.addFiles(e.originalEvent.dataTransfer.files);
      });

      // window resize
      $(window).on('resize',function(e){
        view.resize();
      });

    }, // views.upload.setupEventHandlers

    /**
     * @method views.upload.addFiles
     *
     * Add files to formData and show thumbnails
     *
     * @param {Object} [files] File object array
     *
     */
    addFiles: function uploadView_addFiles(files){

      if (!files.length) {
        return;
      }

      var view=this;
      var formData=view.formData=view.formData||new FormData();

      formData.totalSize=formData.totalSize||0;
      formData.files=formData.files||[];

      $.each(files,function(i,file){

        // only images
        if (!file.type.match(/^image\//)) {
          return;
        }

        // skip duplicate images
        var skip=false;
        $.each(formData.files,function(){
          if (
            this.lastModified==file.lastModified &&
            this.size==file.size &&
            this.name==file.name
          ) {
            skip=true;
            return false;
          }
        });
        if (skip) {
          return;
        }

        // add image to formData
        formData.append('image',file,file.name);

        // add file to list
        formData.files.push(file);
        formData.totalSize+=file.size;

        // display thumbnail
        view.addPreview(file);

        console.log(file);

      });

      console.log(formData);

    }, // views.upload.addFiles

    /**
     * @method views.upload.addPreview
     *
     * append cropped thumbnail in "div.preview" rescaled to
     * views.upload.preview_width x views.upload.preview_height
     *
     * @param {Object} [file] the image file
     */
    addPreview: function uploadView_addPreview(file) {

      var view=this;

      // setup image
      var img=new Image();
      img.onload=function(e){
        var canvas=document.createElement('canvas');
        canvas.width=view.preview_width;
        canvas.height=view.preview_height;

        var ctx=canvas.getContext('2d');

        // get source and dest image ratios
        var imgRatio=img.width/img.height;
        var dstRatio=canvas.width/canvas.height;

        if (imgRatio==dstRatio) {
          // same ratio, simple case
          ctx.drawImage(img,0,0,canvas.width,canvas.height);

        } else {

          // source ratio != destination ratio
          // let's assume the destination ratio is > 1
          // and compute the source rectangle dimensions

          if (imgRatio>=1) {

            // use full source height
            var srch=img.height;

            // compute source width according to dest ratio
            var srcw=img.height*dstRatio;

            // compute source horizontal origin
            var sx=(img.width-srcw)/2;

            // copy and resize source rectangle
            ctx.drawImage(img,sx,0,srcw,srch,0,0,canvas.width,canvas.height);

          } else {

            // use full source width
            var srcw=img.width;

            // compute source height according to dest ratio
            var srch=img.width/dstRatio;

            // compute source vertical origin
            var sh=(img.height-srch)/2;

            // copy and resize source rectangle
            ctx.drawImage(img,0,sh,srcw,srch,0,0,canvas.width,canvas.height);

          }
        }

        // classify new thumbnail by timestamp

        var canvas_list=$('div.preview canvas',view.getElem());
        var canvas_count=canvas_list.length;

        if (canvas_count) {

          // set canvas_count to 0
          canvas_count=0;

          $('div.preview canvas',view.getElem()).each(function(){

            if (this.lastModified>file.lastModified) {

              // insert canvas before this one
              $(canvas).insertBefore(this);

              // restore canvas count after insertion
              canvas_count=canvas_list.length+1;

              // break
              return false;
            }

          });

        }

        // canvas list empty or no canvas with lesser timestamp
        if (!canvas_count) {
          // append canvas
          $('div.preview',view.getElem()).append(canvas);
        }

        // attach file object to canvas
        canvas.lastModified=file.lastModified;
        $(canvas).data('file',file);

      } // img.onload

      // setup file reader
      var reader=new FileReader();
      reader.onload=function (e) {
        // load image
        img.src=e.target.result;
      }

      // read file
      reader.readAsDataURL(file);

    } // views.upload.addPreview

  }), // views.upload

  /**
   *  @property views.authentication
   *
   *  @TODO
   *
   * view to display the login/signup form
   *
   */
  authentication: new View({

    /**
     * @property views.authentication.url
     */
    url: 'view/authentication.html',

    /**
     * @property views.authentication.container
     */
    container: 'div#authentication',

    /**
     * @method views.authentication.onload
     */
    onload: function views_authentication_onload(){
      var view=views.authentication;

      view.setupEventHandlers();

      // for saving password with firefox / chrome ...
      if (!window.webkitURL) {
          $('form',view.getElem()).attr('action',document.location.href);
      }

      window.__alert=window.alert;
      window.alert=function(){
          console.trace('alert');
          return window.__alert.apply(window,Array.prototype.slice.call(arguments));
      }

      if (webapp.userInfo && webapp.userInfo.token) {
          // username and password should be overriden by the browser if the password was saved
          $('#username, #fingerprint',view.getElem()).val(webapp.userInfo.fingerprint);
          $('#password, #token',view.getElem()).val(webapp.userInfo.token);
          if (webapp.userInfo.isnewuser) {
              cookie.set('reload',true);
              view.getElem().find('form')[0].submit();
          }
      }

    }, // views.authentication.onload

    /**
     * @method views.authentication.setupEventHandlers
     */
    setupEventHandlers: function views_authentication_setupEventHandlers(){
      var view=views.authentication;

      view.getElem()
      .on('mouseenter', '#password', function(e){
          $(e.target).attr('type','text');
      })
      .on('mouseleave', '#password', function(e) {
          $(e.target).attr('type','password');
      })
      .on('click','.button',function(e){

        if ($(e.target).hasClass('login')) {
          view.button_login_click(e);
        }

        if ($(e.target).hasClass('register')) {
          view.button_register_click(e);
        }

        if ($(e.target).hasClass('recover')) {
          view.button_recover_click(e);
        }

      })
      .on('submit', 'form', function(e) {
          var pathname=document.location.pathname;

          cookie.set('token',$.cookie('token'));
/*
          if (window.webkitURL) {
              // disable form submit for webkit based browser
              e.preventDefault();

              // play with history to save password with without reloading page.
              setTimeout(function(){
                  window.history.replaceState({login: true}, 'Login successful', "success.html");
                  window.history.replaceState({login: true}, '', pathname);
              });

          } else {
          */
              // with firefox you cannot play with history, yu must redirect to
              // the form action url so that the browser save the password.
              // So set 'reload' cookie, and check it on document ready
              // to reload the page with a GET and avoid the 'resend post data'
              // dialog on refresh
              cookie.set('reload',true);
//          }
      });

    }, // views.authentication.setupEventHandlers

    /**
     * @method views.authentication.button_login_click
     */
    button_login_click: function views_authentication_button_login_click(e){
      var view=views.authentication;

      if (!view.input_validate()) {
        return;
      }

      $('form',view.getElem()).submit();

    }, // views.authentication.button_login_click

    /**
     * @method views.authentication.input_validate
     */
    input_validate: function views_authentication_input_validate(){
      var view=views.authentication;
      return true;


    }, // views.authentication.input_validate

  }), // views.authentication

  /**
   * views.registration
   *
   * @TODO
   *
   * view to display login/signup dialog
   *
   */
  registration: new View({

    /**
     * @property views.registration.url
     */
    url: 'view/registration.html',

    /**
     * @property views.registration.container
     */
    container: 'div#registration',

    /**
     * @method views.registration.onload
     */
    onload: function views_registration_onload(){
      var view=views.registration;
      alert('registration view load');

      view.getElem().on(click,'.button',function(e){
        if ($(e.target).hasClass('ok')) {
          // todo

        }
        if ($(e.target).hasClass('cancel')) {
          // todo
        }

      });

    } // views.registration.onload

  }), // views.registration

} // views


/**
 * @object webapp
 *
 * main application
 *
 * @event {fingerprint} the fingerprint has been loaded or computed
 * @event {login} it's time to start the login process
 * @event {ready} the webapp is ready
 *
 *
 */
var webapp={

  /**
   * @property webapp.defaults
   */
  defaults: {
    showTermsAndConditions: true,
    registrationNeeded: true,
    cookie_expire: Math.pow(2,31),
    initialView: views.plupload
  },

  /**
   * @method webapp.init
   */
  init: function webapp_init(options) {
    $.extend(true,webapp,webapp.defaults,options);
    // TODO: watch for infinite loop
    if (cookie.get('authenticate_again')) { 
        webapp.logout();
        cookie.unset('authenticate_again');
    }
    webapp.getBrowserFingerprint();

  }, // webapp.init

  /**
   * @method webapp.logout
   */
  logout: function webapp_logout() {
        cookie.unset('fingerprint');
        cookie.unset('token');
        cookie.unset('userinfo');

  }, // webapp.logout

  /**
   * @method webapp.getBrowserFingerprint
   *
   * get or generate browser fingerprint and fire fingerprint event
   *
   */
  getBrowserFingerprint: function webapp_getBrowserFingerprint() {

    var fingerprint=cookie.get('fingerprint');

    if (fingerprint) {
      // dont show terms and conditions when fingerprint already defined
      webapp.showTermsAndConditions=false;
      webapp.fingerprint=fingerprint;
      $(webapp).trigger('fingerprint');

    } else {
      // generate browser fingerprint
      new Fingerprint2().get(function(result){
        webapp.fingerprint=result;
        $(webapp).trigger('fingerprint');
      });
    }

  }, // webapp.getfingerprint

  /**
   * @method webapp.onfingerprint
   *
   * got the browser fingerprint
   *
   */
  onfingerprint: function webapp_onfingerprint() {

    if (webapp.showTermsAndConditions) {
      // fingerprint was undefined, show terms and conditions
      views.termsAndConditions.show();
      return;

    }

    $(webapp).trigger('login');

  }, // webapp.onfingerprint

  /**
   * @method webapp.onagree
   *
   * termsandCondition have been agreed
   *
   */
  onagree: function webapp_onagree() {

    // save fingerprint
    cookie.set('fingerprint',webapp.fingerprint);

    // continue
    $(webapp).trigger('login');

  }, // webapp.onagree

  /**
   * @method webapp.onlogin
   *
   * it's time to login, check for saved credentials
   * or start remote login / signup procedure
   *
   */
  onlogin: function webapp_onlogin() {

    if (!webapp.registrationNeeded) {
      $(webapp).trigger('ready');
      return;
    }

    webapp.authenticateOrRegister();

  }, // webapp.onlogin

  /**
   * @method webapp.getUserInfo
   *
   * get local or remote user info
   *
   * @param {Function} [callback] callback will be passed userInfo or null
   *
   */
  getUserInfo: function webapp_getUserInfo(callback) {

    webapp.getLocalUserInfo(function(localUserInfo){

         webapp.getRemoteUserInfo(function(userInfo){

           callback($.extend(true,{},localUserInfo,userInfo));

         });
    });

  }, // webapp.getUserInfo

  /**
   * @method webapp.getLocalUserInfo
   *
   * get user info from local cookie
   *
   * @param {Function} [callback] will be receive webapp.userInfo (or null)
   */
  getLocalUserInfo: function webapp_getLocalUserInfo(callback) {

    var json=cookie.get('userinfo');

    if (json) {
      try {
        webapp.userInfo=JSON.parse(json);
        webapp.userInfo.isnewuser=false;

      } catch(e) {
        webapp.userInfo=null;
      }
    }

    if (!webapp.userInfo) {
        webapp.getSavedCredentials(callback);
    } else {
        if (callback) {
            callback(webapp.userInfo);
        }
    }


  }, // webapp.getLocalUserInfo

  /**
   * @method webapp.getSavedCredentials
   *
   * display the (invisible) login dialog and wait one second, then
   * restore authentication cookies if the form inputs have been 
   * autocompleted by the browser.
   *
   */
  getSavedCredentials: function(callback) {

    var view=views.authentication;
//    view.hidden=true;
    $(view).on('load.getSavedCredentials',function(){
        //$(view).off('load.getSavedCredentials');
        console.log('getsaved');
        setTimeout(function(){
            var token=view.getElem().find('#password').val();
            var fingerprint=view.getElem().find('#username').val();
            if (token && fingerprint) {
                cookie.set('token',token);
                cookie.set('fingerprint',fingerprint);
            }
            console.log(token,fingerprint);
            view.getElem().remove();
            if (callback) {
                callback(webapp.userInfo);
            }
        },1000);
    });
    view.show();

  }, // webapp.getSavedCredentials

  /**
   * @method webapp.getRemoteUserInfo
   *
   * @param {Function} [callback] callback will receive webapp.userInfo
   */
  getRemoteUserInfo: function webapp_getRemoteUserInfo(callback) {

    webapp.userInfo=null;

    $.ajax({

      cache: false,
      url: document.location.pathname,
      method: 'POST',
      dataType: 'json',

      data: {
        q: 'getUserInfo'
      },

      success: function(json) {

        if (json.error) {
          alert(json.error.message);

        } else {
          webapp.userInfo=json;
          callback(webapp.userInfo);

        }
      },

      error: function() {
        alert('Could not get remote user info.');
        callback(webapp.userInfo);
      }

    });

  }, // webapp.getRemoteUserInfo

  /**
   * @method webapp.authenticateOrRegister
   *
   */
  authenticateOrRegister: function webapp_authenticateOrRegister() {

    webapp.getUserInfo(function(userInfo){

      if (userInfo) {
        webapp.userInfo=userInfo;
        cookie.set('userinfo',JSON.stringify(userInfo));
        if (userInfo.isnewuser) {
            // the new user is automatically logged in but
            // show the login page to allow saving password in browser
            // and/or to specify an email adresss
            views.authentication.show();
        } else {
            $(webapp).trigger('ready');
        }

      } else {
        cookie.set('authenticate_again', true);
        alert('Authentication failed');
        document.location=document.location.href;
      }

    });

  }, // webapp.authenticateOrRegister

  /**
   * @method webapp.onready
   */
  onready: function webapp_onready(){
    // show initial view
    webapp.initialView.show();

  } // webapp.onready

} // webapp

/**
* @function file_hash
* @param {File} file - the file to hash
* @param {Function} callback(reply) - the callback
*   {String} reply.hash - set on success
*   {Exception} reply.error - set on error
*/
function file_hash(file, callback) {

  // setup file reader
  var reader=new FileReader();
  reader.onload=function (e) {

    try {

      var time0=new Date().getTime();
      var sha256=asmCrypto.SHA256.hex(e.target.result);
      var time1=new Date().getTime();

      console.log('sha256: '+(time1-time0));

      callback({
        sha256: sha256

      });

    } catch(e) {
      console.log(e.message);
      callback({
        error: e
      });
    }

  }

  // read file
  reader.readAsArrayBuffer(file);

} // file_hash

function file_update(file,callback) {

  // skip already updated file
  if (file.updated) {
    callback({
      updated: true,
      sha256: file.sha256
    });
    return;
  }

  // setup file reader
  var reader=new FileReader();
  reader.onload=function (e) {

    var exif={};

    showtime('load exif',function(){
      exif  = piexif.load(e.target.result);
    });
    console.log(exif);          

    exif['0th'][piexif.ImageIFD.Copyright]="Copyright (c) "+(new Date()).getFullYear()+" by DOXEL.org at Alsenet SA. CCBY-SA.";

    var jpeg;

    showtime('new jpeg',function(){
      var bytes=piexif.dump(exif);
      jpeg=piexif.insert(bytes,e.target.result);
    });

    var sha256;
    showtime('sha256',function(){
      sha256=asmCrypto.SHA256.hex(jpeg);
      console.log(sha256);
    });

    callback({
      jpeg: jpeg,
      sha256: sha256
    });
  }
  reader.readAsBinaryString(file);
}

function showtime(str,func) {
  var time0=new Date().getTime();
  func();
  var time1=new Date().getTime();
  console.log(str+': '+(time1-time0));
}
