'use strict';

angular.module('copayApp.controllers').controller('changeWalletPassWordController',
    function($rootScope, $scope, $timeout, profileService, go, gettext, $state, $stateParams, storageService,lodash,$log,gettextCatalog) {

        var self = this;
        self.walletType = $stateParams.walletType;
        self.walletId = $stateParams.walletId;
        self.name = $stateParams.name;
        self.image = $stateParams.image;
        self.address = $stateParams.address;
        self.ammount = $stateParams.ammount;
        self.mnemonic = $stateParams.mnemonic;
        self.mnemonicEncrypted = $stateParams.mnemonicEncrypted;
        self.newadpass = '';
        self.comadpass = '';
        self.changePassWord = function (walletId) {
            $scope.index.changePD = true;
            var form = $scope.changepassW;
            var newadpass = form.newadpass.$modelValue;
            var comadpass = form.comadpass.$modelValue;
            if(newadpass != comadpass) {
                    $rootScope.$emit('Local/ShowErrorAlert', "Two password entries are inconsistent");
                    return;
            }
            profileService.setAndStoreFocus(walletId, function() {
                    var fc = profileService.focusedClient;
                    if (!fc) return;
                    if (comadpass && !fc.hasPrivKeyEncrypted()) {
                        $rootScope.$emit('Local/NeedsPassword', true, null, function(err, comadpass) {
                            if (err || !comadpass) {
                                return;
                            }
                            profileService.setPrivateKeyEncryptionFC(comadpass, function() {
                                $rootScope.$emit('Local/NewEncryptionSetting');
                            });
                        });
                    } else {
                        if ( fc.hasPrivKeyEncrypted())  {
                            profileService.unlockFC(null, function (err){
                                if (err) {
                                    $rootScope.$emit('Local/ShowErrorAlert', gettextCatalog.getString('Wrong password'));
                                    return;
                                }
                                profileService.disablePrivateKeyEncryptionFC(function(err) {
                                    $rootScope.$emit('Local/NewEncryptionSetting');
                                    if (err) {
                                        $log.error(err);
                                    }
                                    profileService.setPrivateKeyEncryptionFC(comadpass, function() {
                                        $rootScope.$emit('Local/NewEncryptionSetting');
                                        $rootScope.$emit('Local/ShowErrorAlert', gettextCatalog.getString("Password reset complete"));
                                    });
                                });
                            });
                        }
                    }
                });
        }

        self.goimport = function ( walletType, walletId, addr, name, image, ammount, mnemonic, mnemonicEncrypted) {
            $state.go('importwallet', {  walletType: walletType, walletId: walletId, address: addr, name: name, image: image, ammount:ammount, mnemonic: mnemonic, mnemonicEncrypted: mnemonicEncrypted});
        };
        /**
         * 输入框的验证，密码验证
         */
        self.validatePass = function( $event ){
            var val = self.newadpass;
            var vdparent = $event.srcElement.parentElement.parentElement;
            var vderrp = $event.srcElement.parentElement.nextElementSibling;
            var trimeasyExp=/^(([a-z]){8,18}|([A-Z]){8,18}|([0-9]){8,18})$/;
            if(typeof(val) == 'undefined'){
                angular.element(vdparent).removeClass('setErrorexp');
                angular.element(vdparent).removeClass('setWarmErrorexp');
                self.formvalidatepass = false;
            }else if(val == ''){
                angular.element(vdparent).removeClass('setErrorexp');
                angular.element(vdparent).removeClass('setWarmErrorexp');
                self.formvalidatepass = false;
            }else if(val.length > 18 || val.length < 8){
                angular.element(vdparent).removeClass('setWarmErrorexp');
                angular.element(vdparent).addClass('setErrorexp');
                angular.element(vderrp).html(gettextCatalog.getString('*Password cannot less than 8 digits or exceed 18 digits!'));
                self.formvalidatepass = false;
            }else if(trimeasyExp.test(val)){
                angular.element(vdparent).addClass('setWarmErrorexp');
                angular.element(vdparent).removeClass('setErrorexp');
                angular.element(vderrp).html(gettextCatalog.getString('*The password is too simple, it is recommended to mix uppercase and lowercase letters, numbers, special characters!'));
                self.formvalidatepass = true;
            }else{
                angular.element(vdparent).removeClass('setErrorexp');
                angular.element(vdparent).removeClass('setWarmErrorexp');
                self.formvalidatepass = true;
            }
            $timeout(function(){
                $scope.$apply();
            })
        }
        /**
         * 输入框的验证，重复密码验证
         */
        self.validateRpass = function( $event ){
            var val = self.comadpass;
            var vdparent = $event.srcElement.parentElement.parentElement;
            var vderrp = $event.srcElement.parentElement.nextElementSibling;
            if(typeof(val) == 'undefined'){
                angular.element(vdparent).removeClass('setErrorexp');
                self.formvalidaterpass = false;
            }else if(val == ''){
                angular.element(vdparent).removeClass('setErrorexp');
                self.formvalidaterpass = false;
            }else if(self.comadpass !== self.newadpass){
                angular.element(vdparent).addClass('setErrorexp');
                angular.element(vderrp).html(gettextCatalog.getString('*Inconsistent password'));
                self.formvalidaterpass = false;
            }else{
                angular.element(vdparent).removeClass('setErrorexp');
                self.formvalidaterpass = true;
            }
            $timeout(function(){
                $scope.$apply();
            })
        }
    });
