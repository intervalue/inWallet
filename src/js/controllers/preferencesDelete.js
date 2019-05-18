'use strict';

angular.module('copayApp.controllers').controller('preferencesDeleteWalletController',
  function($scope, $rootScope, $filter, $timeout, $modal, $log, storageService, notification, profileService, isCordova, go, gettext, gettextCatalog, animationService) {
    this.isCordova = isCordova;
    this.error = null;

    var delete_msg = gettextCatalog.getString('Are you sure you want to delete this wallet?');
    var accept_msg = gettextCatalog.getString('Accept');
    var cancel_msg = gettextCatalog.getString('Cancel');
    var confirm_msg = gettextCatalog.getString('Confirm');

    var _modalDeleteWallet = function(walletId,name) {
      var ModalInstanceCtrl = function($scope, $modalInstance, $sce, gettext) {
        $scope.title = $sce.trustAsHtml(delete_msg);
        $scope.loading = false;

        $scope.ok = function() {
          $scope.loading = true;
          $modalInstance.close(accept_msg);

        };
        $scope.cancel = function() {
          $modalInstance.dismiss(cancel_msg);
        };
      };

      var modalInstance = $modal.open({
        templateUrl: 'views/modals/confirmation.html',
        windowClass: animationService.modalAnimated.slideUp,
        controller: ModalInstanceCtrl
      });

      modalInstance.result.finally(function() {
        var m = angular.element(document.getElementsByClassName('reveal-modal'));
        m.addClass(animationService.modalAnimated.slideOutDown);
      });

      modalInstance.result.then(function(ok) {
        if (ok) {
          _deleteWallet(walletId,name);
        }
      });
    };

    var _deleteWallet = function(walletId,name) {
      var fc = profileService.focusedClient;
      var walletName = (fc.alias || '') + ' [' + name + ']';
      var self = this;

      profileService.deleteWallet(walletId,name, function(err) {
        if (err) {
          self.error = err.message || err;
        } else {
          notification.success(gettextCatalog.getString('Success'), gettextCatalog.getString('The wallet "{{walletName}}" was deleted', {
            walletName: walletName
          }));
        }
      });
    };

    //开始删除钱包
    this.deleteWallet = function(walletId,name) {
	  if (profileService.profile.credentials.length === 1 || profileService.getWallets().length === 1)
		  return $rootScope.$emit('Local/ShowErrorAlert', gettextCatalog.getString("Can't delete the last remaining wallet"));
      if (isCordova) {
        navigator.notification.confirm(
          delete_msg,
          function(buttonIndex) {
            if (buttonIndex == 1) {
              _deleteWallet(walletId,name);
            }
          },
          confirm_msg, [accept_msg, cancel_msg]
        );
      } else {
        _modalDeleteWallet(walletId,name);
      }
    };
  });
