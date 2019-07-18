'use strict';


angular.module('copayApp.controllers').controller('LockPositionController',
    function ($rootScope, $scope, $state, $timeout, storageService, notification, profileService, bwcService, $log, $stateParams, gettext, gettextCatalog, lodash, go, isCordova) {
        let self = this;

        self.showselectwtmove = false   // 选择地址控制器

        self.lockAddress = '请选择INVE锁仓地址';     //  锁仓地址
        self.extractAddress = null;    //  提取地址

        self.lockDappAddress = 'IAMEEADVI76RPUMZDJZTMIDADC2M53ON'   //  锁仓dapp 地址

        self.showselectlayermove = function () {
            self.showselectwtmove = true
            $scope.index.changesendType('INVE')
        }

        self.findPaymentAddressmove = function (item) {
            // console.log(item)

            self.extractAddress = deepCopyObj(item).address
            self.lockAddress = deepCopyObj(item).address

            self.showselectwtmove = false

        }


        self._extrac = function () {
            console.log('提取方法')
        }

        // 跳转交易
        self.goTransfer = function () {
            $state.go('transfer', {
                walletType: null,
                walletId: null,
                address: null,
                name: null,
                image: null,
                ammount: null,
                mnemonic: null,
                mnemonicEncrypted: null,
                _address: self.lockDappAddress
            });
        }


        //  深拷贝
        function deepCopyObj(obj) {
            if (typeof obj != 'object') {
                return obj;
            }
            var newobj = {};
            for (var attr in obj) {
                newobj[attr] = deepCopyObj(obj[attr]);
            }
            return newobj;
        }

    });
