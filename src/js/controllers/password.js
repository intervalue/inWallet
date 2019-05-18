'use strict';

angular.module('copayApp.controllers').controller('passwordController',
  function($rootScope, $scope, $timeout, profileService, notification, go, gettext, gettextCatalog) {

    var self = this;
    self.password = '';
    var pass1;

    self.isVerification = false;
	
	var fc = profileService.focusedClient;
	self.bHasMnemonic = (fc.credentials && fc.credentials.mnemonic);

	self.passInputFocus = function(){
	    setTimeout(function () {
            document.getElementById("passwordInput").focus();
        })

    }
    self.close = function(cb) {
        $scope.index.askPassword = false;
        $rootScope.$emit('Local/closePass');
      //return cb(gettextCatalog.getString('No password given'));
    };

    self.set = function(isSetup, cb) {
      self.error = false;

      if (isSetup && !self.isVerification) {
        document.getElementById("passwordInput").focus();
        self.isVerification = true;
        pass1 = self.password;
        self.password = null;
        $timeout(function() {
          $rootScope.$apply();
        })
        return;
      }
      if (isSetup) {
        if (pass1 != self.password) {
          self.error = gettextCatalog.getString('Passwords do not match');
          self.isVerification = false;
          self.password = null;
          pass1 = null;

          return;
        }
      }
      return cb(null, self.password);
    };
      /*setTimeout(function(){
         /!* alert('2')*!/
          document.getElementById("passwordInput").focus();
          $scope.$apply();
      },1000)*/
  });