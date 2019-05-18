'use strict';

angular.module('copayApp.controllers').controller('importwalletController',
    function ($scope, $rootScope, gettext, gettextCatalog, $timeout, storageService, profileService, $stateParams, lodash, go, notification) {
        var self = this;
        self.importname = '';
        self.importpass = '';
        self.importrpass = '';
        self.importcode = '';
        self.walletId = $stateParams.walletId;
        self.walletType = $stateParams.walletType;
        //表单验证
        self.formvalidatename = false;
        self.formvalidatepass = false;
        self.formvalidaterpass = false;
        /**
         * 忘记钱包密码时，使用助记词重新导入钱包并设置密码
         * @param walletId
         * @param name
         */
        self.recoveryWallet = function(){
            let walletId = self.walletId;

            storageService.getProfile(function (err, profile) {
                console.log(profile.credentials.length);
                let fc = profile.credentials;
                let opts = {};
                opts.mnemonic = self.importcode;
                opts.type = self.walletType;
                let mnemonic = self.importcode;
                let flag = require("bitcore-mnemonic").isValid(mnemonic.toString());
                if(!flag){
                    $rootScope.$emit('Local/ShowErrorAlert', gettextCatalog.getString('Could not create: Invalid wallet seed'));
                    return ;

                }
                profileService._seedWallet(opts, function (err, walletClient) {
                    if (err) return;
                    var xPubKey = walletClient.credentials.xPubKey;
                    let  crypto = require('crypto');
                    let wallet = self.walletType+'-'+crypto.createHash("sha256").update(xPubKey, "utf8").digest("base64");
                    // check if exists
                    var w = lodash.find(profileService.profile.credentials, { 'xPubKey': xPubKey });
                    if (!w){
                        $rootScope.$emit('Local/ShowErrorAlert', gettextCatalog.getString('wallet does not exist'));
                        return ;
                    }
                    if(wallet != walletId){
                        $rootScope.$emit('Local/ShowErrorAlert', gettextCatalog.getString('Please enter the mnemonic corresponding to the wallet'));
                        return ;
                    }
                    profileService.setAndStoreFocus(walletId, function() {
                        let wc = profileService.focusedClient;
                        let Mnemonic = require('bitcore-mnemonic');
                        let mn = new Mnemonic(self.importcode);
                        wc.credentials.xPrivKey = mn.toHDPrivateKey("").xprivkey;

                        wc.credentials.mnemonic = self.importcode;
                        /* for(let item in profile.credentials) {
                             if(profile.credentials[item].walletId == walletId){
                                 profile.credentials[item].walletName = self.aiwiname;
                                 break;
                             }
                         }*/
                        profileService.disablePrivateKeyEncryptionFC(function(err) {
                            $rootScope.$emit('Local/NewEncryptionSetting');
                            if (err) {
                                $log.error(err);
                            }
                            profileService.setPrivateKeyEncryptionFC(self.importpass, function() {

                                $rootScope.$emit('Local/NewEncryptionSetting');
                                profileService.setAndStoreFocus(walletId, function() {
                                });
                                notification.success(gettextCatalog.getString('Success'), gettextCatalog.getString('wallet "{{walletName}}" Password reset complete', {
                                    walletName: self.importname
                                }));

                            });
                            $timeout(function () {
                                storageService.getProfile(function (err, profile) {
                                    if (err) {
                                        $rootScope.$emit('Local/DeviceError', err);
                                        return;
                                    }
                                    if (!profile) {
                                        breadcrumbs.add('no profile');
                                        return cb(new Error('NOPROFILE: No profile'));
                                    } else {
                                        var profile = profile;
                                        for(let item in profile.credentials) {
                                            if(profile.credentials[item].walletId == walletId){
                                                profile.credentials[item].walletName = self.importname;
                                                break;
                                            }
                                        }
                                        storageService.storeProfile(profile, function (err) {
                                            if (err)
                                                $rootScope.$emit('Local/ShowErrorAlert', +walletId + ":    " + err);
                                            profileService.bindProfileOld(profile, function () {
                                                go.walletHome();
                                                $timeout(function() {
                                                    profileService.lockFC();
                                                    console.log('time to auto-lock wallet', profileService.focusedClient.credentials);
                                                },30 * 1000);
                                            });
                                        });
                                    }
                                });
                            },500);

                        });
                    });
                });
            });

        }


        /**
         * 输入框的验证，名称验证
         */
        self.validateName = function( $event ){
            // var val = $event.srcElement.value;
            var val = self.importname;
            var vdparent = $event.srcElement.parentElement.parentElement;
            var vderrp = $event.srcElement.parentElement.nextElementSibling;
            if(typeof(val) == 'undefined'){
                angular.element(vdparent).removeClass('setErrorexp');
                self.formvalidatename = false;
            }else if(val == ''){
                angular.element(vdparent).removeClass('setErrorexp');
                self.formvalidatename = false;
            }else if(val.length < 1 || val.length > 20){
                angular.element(vdparent).addClass('setErrorexp');
                angular.element(vderrp).html(gettextCatalog.getString('*Characters exceed the 1-20 limit!'));
                self.formvalidatename = false;
            }else{
                angular.element(vdparent).removeClass('setErrorexp');
                self.formvalidatename = true;
            }
            $timeout(function(){
                $scope.$apply();
            })
        }
        /**
         * 输入框的验证，密码验证
         */
        self.validatePass = function( $event ){
            var val = self.importpass;
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
            var val = self.importrpass;
            var vdparent = $event.srcElement.parentElement.parentElement;
            var vderrp = $event.srcElement.parentElement.nextElementSibling;
            if(typeof(val) == 'undefined'){
                angular.element(vdparent).removeClass('setErrorexp');
                self.formvalidaterpass = false;
            }else if(val == ''){
                angular.element(vdparent).removeClass('setErrorexp');
                self.formvalidaterpass = false;
            }else if(self.importrpass !== self.importpass){
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
