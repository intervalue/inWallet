'use strict';


angular.module('copayApp.controllers').controller('importbtcController',
    function ($rootScope, $scope, $timeout, storageService, notification, profileService, bwcService, $log, $stateParams, gettext, gettextCatalog, lodash, go, isCordova) {
        var self = this;
        self.addwalleterr = false;
        self.importcode = '';
        self.addwipass = '';
        self.addwiname = '';
        self.addwirpass = '';
        self.walletId = $stateParams.walletId;
        self.name = $stateParams.name;

        var self = this;
        self.showtab = 'tabcold';
        var indexScope = $scope.index;


        self.importcode_seed = '';
        self.addwiname_seed = '';
        self.addwipass_seed = '';
        self.addwirpass_seed = '';


        self.importcode_pri = '';
        self.addwiname_pri = '';
        self.addwipass_pri = '';
        self.addwirpass_pri = '';
        self.btctype = 1;
        self.switchType = 'segwit';
        self.switchBtcType = function (val, type) {
            self.btctype = val;
            self.switchType = type;
            $timeout(function () {
                $scope.$apply();
            })
        }


        self.importSeed_btc = function () {
            let flag = require("bitcore-mnemonic").isValid(self.importcode_seed.toString());
            if (!flag) {
                $rootScope.$emit('Local/ShowErrorAlert', gettextCatalog.getString('Could not create: Invalid wallet seed'));
                return;
            }
            if (isCordova)
                window.plugins.spinnerDialog.show(null, gettextCatalog.getString('Loading...'), true);
            else {
                $scope.index.progressing = true;
                $scope.index.progressingmsg = 'Loading...';
            }

            $timeout(function () {
                profileService.importWallets({
                    networkName: 'livenet',
                    cosigners: [],
                    n: 1,
                    m: 1,
                    name: self.addwiname_seed,
                    passphrase: '',
                    password: self.addwipass_seed,
                    mnemonic: self.importcode_seed.toString(),
                    type: 'BTC',
                    segwit: self.switchType == 'segwit'
                }, function (err, walletId) {
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
                    notification.success(gettextCatalog.getString('Success'), gettextCatalog.getString('successfully create wallet "{{walletName}}"', {
                        walletName: self.addwiname_seed
                    }));
                    $rootScope.$emit('Local/addWallets');
                    go.walletHome();
                });
            }, 100);
        };

        self.importPrivateKey_btc = function () {
            try {
                if (isCordova)
                    window.plugins.spinnerDialog.show(null, gettextCatalog.getString('Loading...'), true);
                else {
                    $scope.index.progressing = true;
                    $scope.index.progressingmsg = 'Loading...';
                }
                profileService.importWallets({
                    privateKey: self.importcode_pri,
                    cosigners: [],
                    n: 1,
                    m: 1,
                    passphrase: self.addwipass_pri,
                    type: 'BTC',
                    segwit: true,
                    networkName: 'livenet',
                    name: self.addwiname_pri,
                    info: ''
                }, function (err, walletId) {
                    if (isCordova)
                        window.plugins.spinnerDialog.hide();
                    else
                        $scope.index.progressing = false;
                    if (err) {
                        indexScope.showAlert2 = {};
                        indexScope.showAlert2.msg = err;
                        indexScope.showAlert = true;
                        return;
                    }
                    notification.success(gettextCatalog.getString('Success'), gettextCatalog.getString('successfully create wallet "{{walletName}}"', {
                        walletName: self.addwiname_pri
                    }));
                    $rootScope.$emit('Local/addWallets');
                    go.walletHome();
                });
            } catch (err) {
                if (isCordova)
                    window.plugins.spinnerDialog.hide();
                else
                    $scope.index.progressing = false;
                $rootScope.$emit('Local/ShowErrorAlert', gettextCatalog.getString('Could not create: Invalid wallet seed'));
                return;
            }
        }
    });
