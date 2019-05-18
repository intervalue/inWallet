'use strict';

angular.module('copayApp.controllers').controller('walletController',
    function($rootScope, $scope, $timeout, isCordova, $state, nodeWebkit, gettext, gettextCatalog) {
        var self = this;
        var indexScope = $scope.index;
        self.showWallettab = 'INVE';
        //钱包钱包菜单列表跳转到錢包詳情页面
        self.towalletname = function (walletType, walletId, addr, name, image, ammount, mnemonic, mnemonicEncrypted) {
            $state.go('walletname', { walletType: walletType, walletId: walletId, address: addr, name: name, image: image, ammount: ammount, mnemonic: mnemonic, mnemonicEncrypted: mnemonicEncrypted });
        };
        //钱包钱包菜单列表跳转到备份页面
        self.goBack = function($event, type, id){
            $event.stopImmediatePropagation();
            $state.go('backup', {  walletType: type, walletId: id});
        }
        /**
         * 复制地址
         * @param addr
         */
        self.copyAddress = function(addr,$event) {
            $event.stopImmediatePropagation();
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
                    $scope.$apply();
                },1500);
            }
        };
    });