'use strict';


angular.module('copayApp.controllers').controller('importsncController',
    function ($rootScope, $scope, $timeout, storageService, notification, profileService, bwcService, $log, $stateParams, gettext, gettextCatalog,lodash,go, isCordova) {
        var self = this;
        self.addwalleterr = false;
        self.importcode = '';
        self.addwipass = '';
        self.addwiname = '';
        self.addwirpass = '';
        self.walletId = $stateParams.walletId;
        self.name = $stateParams.name;

        /**
         * 助记词导入
         */
        self.importSeed_eth = function(){
            let flag = require("bitcore-mnemonic").isValid(self.importcode1.toString());
            if(!flag){
                $rootScope.$emit('Local/ShowErrorAlert', gettextCatalog.getString('Could not create: Invalid wallet seed'));
                return ;
            }
            if (isCordova)
                window.plugins.spinnerDialog.show(null, gettextCatalog.getString('Loading...'), true);
            else{
                $scope.index.progressing = true;
                $scope.index.progressingmsg = 'Loading...';
            }

            $timeout(function () {
                profileService.importWallets({ networkName: 'testnet', cosigners: [],n:1,m:1,name: self.addwiname1, passphrase: self.addwipass1, password: self.addwipass1, mnemonic: self.importcode1.toString(), type: 'ETH', segwit: true}, function (err,walletId) {
                    if (isCordova)
                        window.plugins.spinnerDialog.hide();
                    else
                        $scope.index.progressing = false;
                    if(err){
                        self.creatingProfile = false;
                        $log.warn(err);
                        self.error = err;
                        $rootScope.$emit('Local/ShowErrorAlert', err);
                        $timeout(function () {
                            $scope.$apply();
                        });
                        return;
                    }
                    $rootScope.$emit('Local/WalletImported', walletId);
                    go.walletHome();
                });
            }, 100);
        }

        /**
         * 私钥导入
         */
        self.importPrivateKey_eth = function(){
            if (isCordova)
                window.plugins.spinnerDialog.show(null, gettextCatalog.getString('Loading...'), true);
            else{
                $scope.index.progressing = true;
                $scope.index.progressingmsg = 'Loading...';
            }
            profileService.importWallets({privateKey: self.importcode2, cosigners: [],n:1,m:1, passphrase: self.addwipass2, type: 'ETH', segwit: true, networkName: 'testnet', name: self.addwiname2, info: ''}, function (err,walletId) {
                if(err){
                    self.creatingProfile = false;
                    $log.warn(err);
                    self.error = err;
                    $timeout(function () {
                        $scope.$apply();
                    });
                }
                if (isCordova)
                    window.plugins.spinnerDialog.hide();
                else
                    $scope.index.progressing = false;
                $rootScope.$emit('Local/WalletImported', walletId);
                go.walletHome();
            });
        }

        /**
         * 文件导入
         */
        self.importByKeystore_eth = function(){
            var keyStore = self.importcode3;
            var password3 = self.password3;
            const wallets = require('ethereumjs-wallet');
            var wallet;
            var haveBack = true;
            try {
                wallet = wallets.fromV1(keyStore, password3);
            } catch (err){
                console.log(err);
                try {
                    wallet = wallets.fromV3(keyStore, password3);
                } catch (err){
                    haveBack = false;
                }
            }

            if (!haveBack){
                $rootScope.$emit('Local/ShowErrorAlert', err);
                return;
            }

            var privateKey = wallet.getPrivateKeyString().replace('0x', '');
            if (isCordova)
                window.plugins.spinnerDialog.show(null, gettextCatalog.getString('Loading...'), true);
            else{
                $scope.index.progressing = true;
                $scope.index.progressingmsg = 'Loading...';
            }
            profileService.importWallets({privateKey: privateKey, cosigners: [],n:1,m:1, passphrase: self.addwipass3, type: 'ETH', segwit: true, networkName: 'testnet', name: self.addwiname3, info: ''}, function (err,walletId) {
                if(err){
                    self.creatingProfile = false;
                    $log.warn(err);
                    self.error = err;
                    $timeout(function () {
                        $scope.$apply();
                    });
                }
                if (isCordova)
                    window.plugins.spinnerDialog.hide();
                else
                    $scope.index.progressing = false;
                $rootScope.$emit('Local/WalletImported', walletId);
                go.walletHome();
            });
        }
    });