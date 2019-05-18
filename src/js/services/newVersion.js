'use strict';

var eventBus = require('inWalletcore/event_bus.js');

angular.module('copayApp.services')
.factory('newVersion', function($modal, $timeout, $rootScope,uxLanguage, isMobile){
  var root = {};
  root.shown = false;
  root.timerNextShow = false;

  eventBus.on('new_version', function(data){
    let language = uxLanguage.currentLanguage;
    root.version = data.version;
    // let ux = data.update;
    // console.log('language: ',language)
    root.message = data;
    // console.log('data.description',data.description)
    // console.log('data.localhref',data.localhref)
    switch (language) {
        case "zh_CN":
             root.updateRemark = data.description;
             break;
         case "en":
             root.updateRemark = data.localhref;
             break;
    }
      let androidHref = data.androidHref;
      let iosHref = data.iosHref;
      let linuxHref = data.linuxHref;
      let windowsHref = data.windowsHref;
      let macHref = data.macHref;
      let isOpen = ((isMobile.Android() && androidHref) ||(isMobile.iOS() && iosHref) ||(isMobile.Windows() && windowsHref) ||(isMobile.Mac() && macHref) ||(navigator.userAgent.split(';')[1].substring(1,6) == 'Linux' && linuxHref));
    if(!root.shown  && isOpen) {
      var modalInstance = $modal.open({
          templateUrl: 'views/modals/newVersionIsAvailable.html',
          controller: 'newVersionIsAvailable'
      });
      $rootScope.$on('closeModal', function() {
      	  modalInstance.dismiss('cancel');
      });
      root.shown = true;
      startTimerNextShow();
    }
  });

  function startTimerNextShow(){
    if (root.timerNextShow) $timeout.cancel(root.timerNextShow);
    root.timerNextShow = $timeout(function(){
      root.shown = false;
    }, 1000 * 60 * 60 * 24);
  }

  return root;
});
