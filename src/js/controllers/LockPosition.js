'use strict';


angular.module('copayApp.controllers').controller('LockPositionController',
    function ($rootScope, $scope, $state, $timeout, storageService, notification, profileService, bwcService, $log, $stateParams, gettext, gettextCatalog, lodash, go, isCordova) {
        let self = this;

        self.showselectwtmove = false   // 选择地址控制器

        self.lockAddress = 'Please enter the INVE extract address';     //  锁仓地址
        self.extractAddress = null;    //  提取地址

        self.lockDappAddress = 'B4GTLVSZXA2JGRGXJ5ZUDRCVXZHNP2WS'   //  锁仓dapp 地址

        let payment = require('inWalletcore/payment.js')
        let utils = require('inWalletcore/utils.js');
        let light = require('inWalletcore/light.js')

        self.rateObj = null  //  利率列表

        self.testList = null


        self.transactionList = []


        self.showselectlayermove = function () {
            self.showselectwtmove = true
            $scope.index.changesendType('INVE')
        }

        self.findPaymentAddressmove = function (item) {
            self.wallet = deepCopyObj(item).wallet
            self.extractAddress = deepCopyObj(item).address
            self.lockAddress = deepCopyObj(item).address
            self.showselectwtmove = false
        }

        // 锁仓点击事件
        self.goTransfer = function () {
            $state.go('LockIn', {
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

        // 提取点击事件
        self.goExtract = function () {
            $state.go('LockExtract');
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


        // 查询汇率
        self.findRate = function () {
            payment.getRate((error, res) => {
                // console.log(res)
                let list = JSON.parse(res)

                self.testList = list
                /* let newList = [1, 2, 3]
                 let obj = []

                 for (let i = 0; i < newList.length; i++) {
                     let lists = []
                     for (let j = 0; j < list.length; j++) {
                         if (newList[i] === list[j].balTerm) {
                             lists.push(list[j])
                         }
                     }
                     obj.push(lists)
                 }

                 self.rateObj = obj*/
            })
        }

        self.findRate()


        // 查询交易记录
        self.findLockList = function () {
            light.getAddressHistory(self.lockDappAddress, function (err, res) {
                if (err) {
                    $rootScope.$emit('Local/ShowErrorAlert', gettextCatalog.getString(err));
                } else {
                    console.log(res)
                    self.transactionList = res
                }
            })
        }

        self.findLockList()


    });
