'use strict';


angular.module('copayApp.controllers').controller('diceWinController',
    function ($rootScope, $scope, $timeout, storageService, notification, profileService, bwcService, $log, $stateParams, gettext, gettextCatalog, lodash, go, isCordova) {
        let self = this;
        let MaxAmount = 10000   //  可下注最大值
        let MinAmount = 1       //  可下注最小值

        let payment = require('inWalletcore/payment.js')
        var utils = require('inWalletcore/utils.js');
        self.paymentList = [50, 100, 200]                               // 可选金额列表
        self.address = $scope.index.walletType.INVE[0].address;         // 获取第一个INVE地址
        self.walletId = $scope.index.walletType.INVE[0].wallet;
        //self.contAddress = 'IAMEEADVI76RPUMZDJZTMIDADC2M53ON'           // 测试网合约地址
        self.contAddress = '2THMAGMCOORSASMFRXAHSUQNVL3JWPE3'           // 测试网合约地址

        self.Magnification = 1.96                                       //  倍率


        self.diceData = {
            type: '0',                                                  // 0正 1反
            amount: MinAmount                                           //  下注金额
        }                                                               // 下注所需数据


        self.amountActiveIndex = -2                                     //  金额选中

        // 金额选中效果
        self.amountActive = function (index, value) {
            self.amountActiveIndex = index
            if (index === -1) {
                //    最大值
                self.diceData.amount = MaxAmount
            } else {
                self.diceData.amount = value
            }
        }

        // 金额加
        self.amountAdd = function () {
            if (self.diceData.amount < MaxAmount) {
                self.diceData.amount++
            }
        }

        // 金额减
        self.amountCut = function () {
            if (self.diceData.amount > MinAmount) {
                self.diceData.amount--
            }
        }

        // 计算 预计总额

        //  下注
        self.Bets = function () {
            $scope.index.payController = true;
            apply();
        }

        //  确认支付
        self.confirmPay = function () {
            profileService.setAndStoreFocusToWallet(self.walletId, function () {
                profileService.unlockFC(null, function (err) {
                    if (err) {
                        $rootScope.$emit('Local/ShowErrorAlert', gettextCatalog.getString('Wrong password'));
                        return;
                    }
                    let fc = profileService.focusedClient;
                    let pubkey = utils.getPubkey(fc.credentials.xPrivKey);
                    console.warn('walletClients: ', fc.credentials);

                    let obj = {
                        fromAddress: self.address,
                        toAddress: self.contAddress,
                        amount: self.diceData.amount,
                        callData: self.diceData.type,
                        pubkey: pubkey,
                        xprivKey: fc.credentials.xPrivKey
                    }

                    console.warn('合约交易构造传递前的数据格式')
                    console.log(obj)
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
                                console.warn('发送交易后返回的数据')
                                console.log(err)
                                console.log(res)
                                if (err) {
                                    return $rootScope.$emit('Local/ShowErrorAlert', err);
                                } else {
                                    self.cancelPay()
                                }
                            })
                        }
                    })
                });
            });
        }

        //  取消支付
        self.cancelPay = function () {
            $scope.index.payController = false;
        }


        // 页面渲染
        function apply() {
            setTimeout(function () {
                $scope.$apply();
            });
        }


    });
