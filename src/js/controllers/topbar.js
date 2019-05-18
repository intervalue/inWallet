'use strict';

angular.module('copayApp.controllers').controller('topbarController', function($scope, $rootScope, go, $state, $stateParams) {

    this.onQrCodeScanned = function(data) {
        go.handleUri(data);
        //$rootScope.$emit('dataScanned', data);
    };

    this.onQrCodeScannedAddr = function(data) {
        go.handleUriAddr(data);

    };

    this.openSendScreen = function() {
        go.send();
    };

    this.onBeforeScan = function() {
    };

    //返回到首页
    this.goHome = function() {
        go.walletHome();
    };

    //返回到子首页
    this.goChome = function() {
        $state.go('walletinfo',{ walletType: $stateParams.walletType, walletId: $stateParams.walletId, address: $stateParams.address, name: $stateParams.name, image: $stateParams.image, ammount: $stateParams.ammount, mnemonic: $stateParams.mnemonic, mnemonicEncrypted: $stateParams.mnemonicEncrypted });
    };

    //返回到钱包列表
    this.goWallet = function() {
        go.wallet();
    };
    this.gotoWalletIndex = function(walletType, walletId, addr, name, image, ammount, mnemonic, mnemonicEncrypted) {
        $state.go('walletinfo', { walletType: walletType, walletId: walletId, address: addr, name: name, image: image, ammount: ammount, mnemonic: mnemonic, mnemonicEncrypted: mnemonicEncrypted });
    };
    this.goNews = function() {
        go.news();
        /*$rootScope.$emit('Local/SetTab','discovery');*/
    };
    //返回到钱包信息页面
    this.goToWaname = function() {
        $scope.index.backwallet = true;
        $state.go('walletname', { walletType: $stateParams.walletType, walletId: $stateParams.walletId, address: $stateParams.address, name: $stateParams.name, image: $stateParams.image, ammount: $stateParams.ammount, mnemonic: $stateParams.mnemonic, mnemonicEncrypted: $stateParams.mnemonicEncrypted });
    };
    //返回到钱包信息页面
    this.goToPass = function() {
        $state.go('changeWalletPassWord', { walletType: $stateParams.walletType, walletId: $stateParams.walletId, address: $stateParams.address, name: $stateParams.name, image: $stateParams.image, ammount: $stateParams.ammount, mnemonic: $stateParams.mnemonic, mnemonicEncrypted: $stateParams.mnemonicEncrypted });
    };
});
