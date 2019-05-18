'use strict';

angular.module('copayApp.controllers').controller('correspondentDevicesController',
  function($scope, $timeout, configService, profileService, go, correspondentListService, $state, $rootScope, isCordova,gettextCatalog,nodeWebkit) {
	
	var self = this;
	
	var wallet = require('inWalletcore/wallet.js');
	//todo delete
	 var bots = require('inWalletcore/bots.js');
	var mutex = require('inWalletcore/mutex.js');
	$scope.editCorrespondentList = false;
	$scope.selectedCorrespondentList = {};
	var fc = profileService.focusedClient;
	$scope.backgroundColor = fc.backgroundColor;
	var indexScope = $scope.index;

	$scope.state = $state;
	$scope.showchatdel = false;
	$scope.hideRemove = true;
      var conf = require('inWalletcore/conf.js');
      $scope.protocol = conf.program;
      $scope.isCordova = isCordova;

	var listScrollTop = 0;

	$scope.removechataddr=''  // 將要刪除的用戶地址

	$scope.$on('$stateChangeStart', function(evt, toState, toParams, fromState) {
	    if (toState.name === 'correspondentDevices') {
	        $scope.readList();
	    	setTimeout(function(){
	    	    document.querySelector('[ui-view=main]').scrollTop = listScrollTop;
                $rootScope.$emit('Local/SetTab', 'correspondentDevices', true);
            }, 5);
	    }
	});

	$scope.showchatdelete = function(device_address,$event){
        $event.stopImmediatePropagation();
        $scope.removechataddr = device_address;
        $scope.showchatdel = true;
        angular.element(document.querySelectorAll('.correspondentList .liin')).css({'width':'calc(100% - 30px)'});
        angular.element(document.querySelectorAll('.correspondentList .morerimg')).css({'display':'block'});
        angular.element(document.querySelectorAll('.correspondentList .chatremovep')).css({'opacity':'0','width':0});
	}

	$scope.showCorrespondent = function(correspondent) {
		//console.log("showCorrespondent", correspondent);
		correspondentListService.currentCorrespondent = correspondent;
		listScrollTop = document.querySelector('[ui-view=main]').scrollTop;
		go.path('correspondentDevices.correspondentDevice');
	};

	$scope.showBot = function(bot) {
		$state.go('correspondentDevices.bot', {id: bot.id});
	};

	$scope.toggleEditCorrespondentList = function() {
		$scope.editCorrespondentList = !$scope.editCorrespondentList;
		$scope.selectedCorrespondentList = {};
	};

	$scope.toggleSelectCorrespondentList = function(addr) {
		$scope.selectedCorrespondentList[addr] = $scope.selectedCorrespondentList[addr] ? false : true;
	};

	$scope.newMsgByAddressComparator = function(correspondent) {
	      return (-$scope.newMessagesCount[correspondent.device_address]||correspondent.name.toLowerCase());
	};

	$scope.beginAddCorrespondent = function() {
		console.log("beginAddCorrespondent");
		listScrollTop = document.querySelector('[ui-view=main]').scrollTop;
		go.path('correspondentDevices.addCorrespondentDevice');
	};


	$scope.readList = function() {
		$scope.error = null;
		correspondentListService.list(function(err, ab) {
			if (err) {
				$scope.error = err;
				return;
			}

			wallet.readDeviceAddressesUsedInSigningPaths(function(arrNotRemovableDeviceAddresses) {
				// add a new property indicating whether the device can be removed or no
				if(!ab) return;
				var length = ab.length;
				for (var i = 0; i < length; i++) {
 				 	corrDev = ab[i];

				 	corrDevAddr = corrDev.device_address;

				 	var ix = arrNotRemovableDeviceAddresses.indexOf(corrDevAddr);

					// device is removable when not in list
				 	corrDev.removable = (ix == -1);
				}
			});
		
			$scope.list = ab;
			bots.load(function(err, rows){
				if (err) $scope.botsError = err.toString();
				$scope.bots = rows;
				$timeout(function(){
					$scope.$digest();
				});
			});
		});
	};


      correspondentListService.startWaitingForPairing(function(pairingInfo){
          console.log("beginAddCorrespondent " + pairingInfo.pairing_secret);
          let device_pubkey = profileService.profile.device_pubkey;
          $scope.codee = device_pubkey + "@" + pairingInfo.hub + "#" + pairingInfo.pairing_secret;

          function determineQRcodeVersionFromString( inputtext ) {
              // maximum characters per QR code version using ECC level m
              // source: http://www.qrcode.com/en/about/version.html
              var maxCharsforQRVersion = [0,14,26,42,62,84,106,122,152,180,213];
              var qrversion = 5;
              // find lowest version number that has enough space for our text
              for (var i = (maxCharsforQRVersion.length-1); i > 0 ; i--) {
                  if ( maxCharsforQRVersion[i] >= inputtext.length)
                  {
                      qrversion = i;
                  }
              }

              return qrversion;
          }

          var qrstring = $scope.protocol + ":" +$scope.codee;  //as passed to the qr generator in inviteCorrespondentDevice.html
          $scope.qr_version = determineQRcodeVersionFromString( qrstring );

          $scope.$digest();
          //$timeout(function(){$scope.$digest();}, 100);
          var eventName = 'paired_by_secret-'+pairingInfo.pairing_secret;
          eventBus.once(eventName, onPaired);
          $scope.$on('$destroy', function() {
              console.log("removing listener for pairing by our secret");
              eventBus.removeListener(eventName, onPaired);
          });
      });

      function onPaired(peer_address){
          correspondentListService.setCurrentCorrespondent(peer_address, function(bAnotherCorrespondent){
              go.path('correspondentDevices.correspondentDevice');
          });
      }

      $scope.copyCode = function() {
          if (isCordova) {
              window.cordova.plugins.clipboard.copy($scope.codee);
              window.plugins.toast.showShortCenter(gettextCatalog.getString('Successful copy'));
          }else if (nodeWebkit.isDefined()) {
              nodeWebkit.writeToClipboard($scope.codee);
              indexScope.layershow = true;
              indexScope.layershowmsg = gettextCatalog.getString('Successful copy');
              setTimeout(function () {
                  indexScope.layershow = false;
                  $rootScope.$apply();
              },1500)
          }
      };

	$scope.hideRemoveButton = function(removable){
		return $scope.hideRemove || !removable;
	}

	$scope.remove = function(device_address,$event) {
		//mutex.lock(["remove_device"], function(unlock){
			// check to be safe

			wallet.determineIfDeviceCanBeRemoved(device_address, function(bRemovable) {
				if (!bRemovable) {
					//unlock();
					return console.log('device '+device_address+' is not removable');
				}
				var device = require('inWalletcore/device.js');

				// send message to paired device
				// this must be done before removing the device
				 device.sendMessageToDevice(device_address, "removed_paired_device", "removed");

				// remove device
				device.removeCorrespondentDevice(device_address, function() {
					//unlock();
					$scope.hideRemove = true;
					correspondentListService.currentCorrespondent = null;
					$scope.readList();
                    $rootScope.$emit('Local/SetTab', 'correspondentDevices', true);
					setTimeout(function(){document.querySelector('[ui-view=main]').scrollTop = listScrollTop;}, 5);
				});
			});
		//});
        $scope.showchatdel = false;
	};

	$scope.cancel = function() {
		console.log("cancel clicked");
		go.walletHome();
	};

  })
  .directive('chatSwiperLeft',function(){
    return{
        restrict:'A',
        link:function(scope, elm){
            var raw = elm[0];
            var swiperEl = elm[0];//滑动的div
            var moreEl = elm[0].children[1].children[0];//更多按钮
            var deleteEl = elm[0].parentNode.children[1];//删除按钮
            scope._start = 0;
            scope. _end = 0;
            raw.addEventListener("dragstart",dragStart,false);//当鼠标按住屏幕时候触发。
            raw.addEventListener("drag",dragMove,false);//当鼠标屏幕上滑动的时候连续地触发。在这个事件发生期间，调用preventDefault()事件可以阻止滚动。
            raw.addEventListener("dragend",dragEnd,false);
            raw.addEventListener("touchstart",touchStart,false);//当按住屏幕时候触发。
            raw.addEventListener("touchmove",touchMove,false);//当屏幕上滑动的时候连续地触发。在这个事件发生期间，调用preventDefault()事件可以阻止滚动。
            raw.addEventListener("touchend",touchEnd,false);
            function dragStart(event){//dragStart函数
                var img = new Image();
                img.src = './img/transparent.png';
                event.dataTransfer.setDragImage(img, 10, 10);
                scope._start = event.pageX;
            }
            function dragMove(event){//dragMove函数
                scope._end = (scope._start - event.pageX);
                //下滑才执行操作
                if( 5 < scope._end){
                    showdelete(scope._end);
                }else{
                    resetdrag();
                }
            }
            function dragEnd(event){//dragEnd函数
                scope._end = (scope._start - event.pageX);
                if(scope._end < 5){
                    resetdrag();
                    return;
                }else{
                    showdeleteok();
                    return;
                }
            }
            function touchStart(event){//dragStart函数
                scope._start = event.targetTouches[0].pageX;
            }
            function touchMove(event){//dragMove函数
                scope._end = (scope._start - event.targetTouches[0].pageX);
                //滑动才执行操作
                if( 5 < scope._end){
                    showdelete(scope._end);
                }else{
                    resetdrag();
                }
            }
            function touchEnd(event){//dragEnd函数
                scope._end = (scope._start - event.changedTouches[0].pageX);
                if(scope._end < 5){
                    resetdrag();
                    return;
                }else{
                    showdeleteok();
                    return;
                }
            }
            function showdelete(dist){ // dist 滑动的距离
                moreEl.style.display = 'none';
                deleteEl.style.opacity = '1';
                deleteEl.style.zIndex = '3';
                if(dist > 80){
                    deleteEl.style.width = 'auto';
                    swiperEl.style.width = "calc(100% - 15px - "+deleteEl.style.width+"px)";
                }else{
                    deleteEl.style.width = dist + 'px';
                    swiperEl.style.width = "calc(100% - 15px - "+dist+"px)";
                }
            }
            function showdeleteok(){
                moreEl.style.display = 'none';
                deleteEl.style.width = 'auto';
                deleteEl.style.zIndex = '3';
                deleteEl.style.opacity = '1';
                swiperEl.style.width = "calc(100% - 15px - "+deleteEl.style.width+"px)";
            }
            function resetdrag(){
                moreEl.style.display = 'block';
                deleteEl.style.width = 0 + 'px';
                deleteEl.style.zIndex = '1';
                deleteEl.style.opacity = '0';
                swiperEl.style.width = "calc(100% - 30px)";
            }
        }
    }
});
