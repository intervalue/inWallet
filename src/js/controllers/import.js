'use strict';


angular.module('copayApp.controllers').controller('importController',
    function ($rootScope, $scope, $timeout, storageService, notification, profileService, bwcService, $log, $stateParams, gettext, gettextCatalog, lodash, go, isCordova) {
        var self = this;
        var indexScope = $scope.index;
        self.addwalleterr = false;
        self.importname = '';
        self.importpass = '';
        self.importrpass = '';
        self.importcode = '';
        self.importcode1 = '';
        self.importcode2 = '';
        //表单验证
        self.formvalidatename = false;
        self.formvalidatepass = false;
        self.formvalidaterpass = false;
        self.walletId = $stateParams.walletId;
        self.name = $stateParams.name;
        /**
         * 通过输入助记次导入钱包
         */
        self.importw = function () {
            if (self.importpass !== self.importrpass) {
                $rootScope.$emit('Local/ShowErrorAlert', gettextCatalog.getString('*Inconsistent password'));
                return;
            }

            self.importcode1 = self.importcode.replace(/^\s+/, '').replace(/\s+$/, '');
            self.importcode2 = self.importcode1.replace(/\s+/g, ' ');
            if (isCordova)
                window.plugins.spinnerDialog.show(null, gettextCatalog.getString('Loading...'), true);
            else {
                $scope.index.progressing = true;
                $scope.index.progressingmsg = 'Loading...';
            }

            profileService.importWallets({
                name: self.importname,
                password: self.importpass,
                mnemonic: self.importcode2,
                m: 1,
                n: 1,
                networkName: "livenet",
                cosigners: [],
                isSinglecreateress: true,
                type: indexScope.type
            }, function (err, walletId) {
                $timeout(function () {
                    if (isCordova)
                        window.plugins.spinnerDialog.hide();
                    else
                        $scope.index.progressing = false;

                    if (err) {
                        self.creatingProfile = false;
                        $log.warn(err);
                        self.error = err;
                        $rootScope.$emit('Local/ShowErrorAlert', err);
                        $timeout(function () {
                            $scope.$apply();
                        });
                        return;
                    }
                    // if (isCordova)
                    //     window.plugins.spinnerDialog.hide();
                    notification.success(gettextCatalog.getString('Success'), gettextCatalog.getString('successfully create wallet "{{walletName}}"', {
                        walletName: self.importname
                    }));
                    $rootScope.$emit('Local/WalletImported', walletId);
                    go.walletHome();
                });

            });

        }

        /**
         * 获取import form表单
         */
        self.generateAddressQRCode = function () {
            var form = $scope.addressForm;
            var address = form.address.$modelValue;
            if (address && address.length == 32) {
                $rootScope.$emit('Local/ShadowAddressForm', address);
                $scope.index.signatureAddr = '';
                $scope.addressForm.$setPristine();
            } else {
                $scope.index.signatureAddr = '';
                $scope.addressForm.$setPristine();
                return $rootScope.$emit('Local/ShowErrorAlert', gettextCatalog.getString('The address: ') + address + gettextCatalog.getString(' is illegal'));
            }

        }

        $rootScope.$on('Local/ShowAlertdirs', function (event, msg, msg_icon, cb) {
            $scope.index.showPopup(msg, msg_icon, cb);
        });

        /**
         * 输入框的验证，名称验证
         */
        self.validateName = function ($event) {
            // var val = $event.srcElement.value;
            var val = self.importname;
            var vdparent = $event.srcElement.parentElement.parentElement;
            var vderrp = $event.srcElement.parentElement.nextElementSibling;
            if (typeof (val) == 'undefined') {
                angular.element(vdparent).removeClass('setErrorexp');
                self.formvalidatename = false;
            } else if (val == '') {
                angular.element(vdparent).removeClass('setErrorexp');
                self.formvalidatename = false;
            } else if (val.length < 1 || val.length > 20) {
                angular.element(vdparent).addClass('setErrorexp');
                angular.element(vderrp).html(gettextCatalog.getString('*Characters exceed the 1-20 limit!'));
                self.formvalidatename = false;
            } else {
                angular.element(vdparent).removeClass('setErrorexp');
                self.formvalidatename = true;
            }
            $timeout(function () {
                $scope.$apply();
            })
        }
        
        /**
         * 输入框的验证，密码验证
         */
        self.validatePass = function ($event) {
            var val = self.importpass;
            var vdparent = $event.srcElement.parentElement.parentElement;
            var vderrp = $event.srcElement.parentElement.nextElementSibling;
            var trimeasyExp = /^(([a-z]){8,18}|([A-Z]){8,18}|([0-9]){8,18})$/;
            if (typeof (val) == 'undefined') {
                angular.element(vdparent).removeClass('setErrorexp');
                angular.element(vdparent).removeClass('setWarmErrorexp');
                self.formvalidatepass = false;
            } else if (val == '') {
                angular.element(vdparent).removeClass('setErrorexp');
                angular.element(vdparent).removeClass('setWarmErrorexp');
                self.formvalidatepass = false;
            } else if (val.length > 18 || val.length < 8) {
                angular.element(vdparent).removeClass('setWarmErrorexp');
                angular.element(vdparent).addClass('setErrorexp');
                angular.element(vderrp).html(gettextCatalog.getString('*Password cannot less than 8 digits or exceed 18 digits!'));
                self.formvalidatepass = false;
            } else if (trimeasyExp.test(val)) {
                angular.element(vdparent).addClass('setWarmErrorexp');
                angular.element(vdparent).removeClass('setErrorexp');
                angular.element(vderrp).html(gettextCatalog.getString('*The password is too simple, it is recommended to mix uppercase and lowercase letters, numbers, special characters!'));
                self.formvalidatepass = true;
            } else {
                angular.element(vdparent).removeClass('setErrorexp');
                angular.element(vdparent).removeClass('setWarmErrorexp');
                self.formvalidatepass = true;
            }
            $timeout(function () {
                $scope.$apply();
            })
        }
        /**
         * 输入框的验证，重复密码验证
         */
        self.validateRpass = function ($event) {
            var val = self.importrpass;
            var vdparent = $event.srcElement.parentElement.parentElement;
            var vderrp = $event.srcElement.parentElement.nextElementSibling;
            if (typeof (val) == 'undefined') {
                angular.element(vdparent).removeClass('setErrorexp');
                self.formvalidaterpass = false;
            } else if (val == '') {
                angular.element(vdparent).removeClass('setErrorexp');
                self.formvalidaterpass = false;
            } else if (self.importrpass !== self.importpass) {
                angular.element(vdparent).addClass('setErrorexp');
                angular.element(vderrp).html(gettextCatalog.getString('*Inconsistent password'));
                self.formvalidaterpass = false;
            } else {
                angular.element(vdparent).removeClass('setErrorexp');
                self.formvalidaterpass = true;
            }
            $timeout(function () {
                $scope.$apply();
            })
        }
    });
