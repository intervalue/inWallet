'use strict';

angular.module('copayApp.controllers').controller('wordsController',
  function($rootScope, $scope, $timeout, $stateParams, profileService, go, gettext, confirmDialog, notification, $log, isCordova,$state,gettextCatalog) {
      var self = this;
      self.walletType = $stateParams.walletType;
      self.walletId = $stateParams.walletId;
      self.name = $stateParams.name;
      self.image = $stateParams.image;
      self.address = $stateParams.address;
      self.ammount = $stateParams.ammount;
      self.mnemonic = $stateParams.mnemonic;
      self.mnemonicEncrypted = $stateParams.mnemonicEncrypted;
      self.show = false;
    var fc = profileService.focusedClient;


      /**
       * 判断删除的钱包是否当前使用钱包，如果不是需要先切换钱包再删除
       */
    if(self.walletId && fc.credentials.walletId != self.walletId){
        profileService.setAndStoreFocus(self.walletId, function() {
            fc = profileService.focusedClient;
            $state.go('backup');
        });


    }
	if (!isCordova){
		var desktopApp = require('inWalletcore/desktop_app.js'+'');
		self.appDataDir = desktopApp.getAppDataDir();
	}
	self.isCordova = isCordova;


    if (fc.isPrivKeyEncrypted()) self.credentialsEncrypted = true;
    else {
      setWords(fc.getMnemonic());
    }
    if (fc.credentials && !fc.credentials.mnemonicEncrypted && !fc.credentials.mnemonic) {
      self.deleted = true;
    }

    self.toggle = function() {
      self.error = "";
      if (!self.credentialsEncrypted) {
        if (!self.show)
          $rootScope.$emit('Local/BackupDone');
        self.show = !self.show;
      }

      if (self.credentialsEncrypted)
        self.passwordRequest();

      $timeout(function() {
        $scope.$apply();
      }, 1);
    };

    self.delete = function() {
      self.needsBackupa = false;
      self.showconfirm = true;
    };

    self.deleteyes = function() {
        fc.clearMnemonic();
        profileService.clearMnemonic(function() {
          self.deleted = true;
          go.walletHome();
        });
    };

    $scope.$on('$destroy', function() {
      profileService.lockFC();
    });

    function setWords(words) {
      if (words) {
        self.mnemonicWords = words.split(/[\u3000\s]+/);
        self.mnemonicHasPassphrase = fc.mnemonicHasPassphrase();
        self.useIdeograms = words.indexOf("\u3000") >= 0;
      }
    };

    self.passwordRequest = function() {
      try {
        setWords(fc.getMnemonic());
      } catch (e) {
        if (e.message && e.message.match(/encrypted/) && fc.isPrivKeyEncrypted()) {
          self.credentialsEncrypted = true;

          $timeout(function() {
            $scope.$apply();
          }, 1);

          profileService.unlockFC(null, function(err) {
            if (err) {
                $rootScope.$emit('Local/ShowErrorAlert', gettextCatalog.getString('Could not decrypt') +': '+ err.message);
                $scope.showSwitch = false;
                self.error = gettext('Could not decrypt') +': '+ err.message;
                $log.warn('Error decrypting credentials:', self.error); //TODO
                return;
            }
            if (!self.show && self.credentialsEncrypted)
               self.show = !self.show;
               self.credentialsEncrypted = false;
               setWords(fc.getMnemonic());
               $rootScope.$emit('Local/BackupDone');
          });
        }
      }
    }
    $rootScope.$on('Local/closePass', function(event){
        $scope.showSwitch = false;
    })
  });
