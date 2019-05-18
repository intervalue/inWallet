'use strict';

angular.module('copayApp.controllers').controller('receiveController',
    function($state, $stateParams, nodeWebkit, $scope, gettextCatalog, isCordova, configService, profileService,$timeout ) {
        let self = this;
        let indexScope = $scope.index;
        let conf = require('inWalletcore/conf.js');
        let configWallets = configService.defaultImages;
        self.protocol = conf.program;
        console.log($stateParams)
        self.walletId = $stateParams.walletId;
        self.walletType = $stateParams.walletType;
        self.address = $stateParams.address;
        self.name = $stateParams.name;
        self.image = $stateParams.image;
        self.ammount = $stateParams.ammount;
        self.mnemonic = $stateParams.mnemonic;
        self.mnemonicEncrypted = $stateParams.mnemonicEncrypted;
        self.isPayShow = $stateParams.booleanPay;
        self.setAmountShow = false;
        self.amount = '';

        for(let item in configWallets){
            if(item == self.walletType) {
                self.walletImage = configWallets[item][0];
                self.walletTypeShort = configWallets[item][2];
            }
        }

        /**
         * 回退到交易记录页面
         */
        self.goWalletInfo = function(walletType, walletId, addr, name, image, ammount, mnemonic, mnemonicEncrypted){
            $state.go('walletinfo', { walletType: walletType, walletId: walletId, address: addr, name: name, image: image, ammount: ammount, mnemonic: mnemonic, mnemonicEncrypted: mnemonicEncrypted });
        }


        /**
         * 复制地址
         * 复制成功后提示信息
         * @param addr
         */
        self.copyAddress = function(addr) {
            if (isCordova) {
                window.cordova.plugins.clipboard.copy(addr);
                window.plugins.toast.showShortCenter(gettextCatalog.getString('Successful copy'));
            }
            else if (nodeWebkit.isDefined()) {
                nodeWebkit.writeToClipboard(addr);
                indexScope.layershow = true;
                indexScope.layershowmsg = gettextCatalog.getString('Successful copy');
                setTimeout(function () {
                    indexScope.layershow = false;
                },1500);
            }
        };

        /**
         * 输入金额
         * @param addr
         */
        self.setAmountForm = function(){
            let from = $scope.amountform;
            var amount = from.amount.$modelValue;
            var asset = self.walletType;
            if (!asset)
                throw Error("no asset");
            var amountInSmallestUnits = amount;
            $timeout(function() {
                $scope.customizedAmountUnit =
                    amount + ' ' + (asset === 'base') ? '' : 'of '+asset;
                $scope.amountInSmallestUnits = amountInSmallestUnits;
                $scope.asset_param = (asset === 'base') ? '' : '&asset=' + encodeURIComponent(asset);
                self.setAmountShow = false;
                self.amount = '';
            }, 1);
        }

    });