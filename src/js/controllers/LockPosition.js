'use strict';


angular.module('copayApp.controllers').controller('LockPositionController',
    function ($rootScope, $scope, $state, $timeout, storageService, notification, profileService, bwcService, $log, $stateParams, gettext, gettextCatalog, lodash, go, isCordova) {
        let self = this;

        self.showselectwtmove = false   // 选择地址控制器

        self.lockAddress = '请选择INVE锁仓地址';     //  锁仓地址
        self.extractAddress = null;    //  提取地址

        self.lockDappAddress = 'IAMEEADVI76RPUMZDJZTMIDADC2M53ON'   //  锁仓dapp 地址
        let payment = require('inWalletcore/payment.js')
        let utils = require('inWalletcore/utils.js');
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


        //提取
        self._extrac = function () {
            if(!self.wallet){
                $rootScope.$emit('Local/ShowErrorAlert', gettextCatalog.getString('请选择锁仓地址！！！'));
                return;
            }
            profileService.setAndStoreFocusToWallet(self.wallet, function () {
                profileService.unlockFC(null, function (err) {
                    if (err) {
                        $rootScope.$emit('Local/ShowErrorAlert', gettextCatalog.getString('Wrong password'));
                        return;
                    }
                    let fc = profileService.focusedClient;
                    let pubkey = utils.getPubkey(fc.credentials.xPrivKey);
                    //等合约结构
                    let obj = {
                        fromAddress: self.address,
                        toAddress: self.contAddress,
                        amount: "0",
                        pubkey: pubkey,
                        xprivKey: fc.credentials.xPrivKey
                    }

                    //  构造合约交易
                    payment.contractTransactionData(obj, function (err, res) {
                        console.error(res)
                        console.error(err)
                        if (err) {
                            if (err.match(/not enough spendable/)) {
                                err = gettextCatalog.getString("not enough spendable");
                            }
                            if (err.match(/unable to get nrgPrice/)) {
                                err = gettextCatalog.getString("network error,please try again.");
                            }
                            return $rootScope.$emit('Local/ShowErrorAlert', err);
                        } else {

                            //     发送合约交易
                            payment.sendTransactions(res, function (err, res) {
                                if (err) {
                                    return $rootScope.$emit('Local/ShowErrorAlert', err);
                                } else {
                                    $rootScope.$emit('Local/ShowErrorAlert', gettextCatalog.getString('Payment Success'));
                                    self.cancelPay()
                                }
                            })
                        }
                    })

                })
            })
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
