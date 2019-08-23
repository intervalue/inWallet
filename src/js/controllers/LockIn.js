'use strict';

angular.module('copayApp.controllers').controller('LockInController',
    function ($http, $scope, $rootScope, $timeout, $window, $state, $stateParams, $filter, $modal, $log, notification, isCordova, profileService, lodash, configService, storageService, gettext, gettextCatalog, go, nodeWebkit, addressService, confirmDialog, animationService, addressbookService, txFormatService) {
        var self = this;
        let fc = profileService.profile;
        let w = fc.credentials[0];
        self.walletId = $stateParams.walletId ? $stateParams.walletId : w.walletId;
        self.walletIdRoute = $stateParams.walletId ? $stateParams.walletId : w.walletId;
        self.walletType = $stateParams.walletType ? $stateParams.walletType : w.type;
        self.address = $stateParams.address;
        self.walletName = $stateParams.name ? $stateParams.name : w.walletName;
        self.amount = $stateParams.ammount;
        self.amountRoute = $stateParams.ammount;
        self.image = $stateParams.image;
        self.mnemonic = $stateParams.mnemonic;
        self.mnemonicEncrypted = $stateParams.mnemonicEncrypted;
        self.tranInfo = $scope.index.walletInfo;
        let configWallets = configService.defaultImages;
        self.infinite_isCmp = false;
        self.showselectwt = false;
        var conf = require('inWalletcore/conf.js');
        this.protocol = conf.program;
        $rootScope.hideMenuBar = false;
        $rootScope.wpInputFocused = false;
        var config = configService.getSync();
        var configWallet = config.wallet;
        var indexScope = $scope.index;
        $scope.currentSpendUnconfirmed = configWallet.spendUnconfirmed;
        var network = require('inWalletcore/network.js');
        var bigNumber = require('bignumber.js');

        // INIT
        var walletSettings = configWallet.settings;
        this.unitValue = walletSettings.unitValue;
        this.bbUnitValue = walletSettings.bbUnitValue;
        this.unitName = walletSettings.unitName;
        this.bbUnitName = walletSettings.bbUnitName;
        this.unitDecimals = walletSettings.unitDecimals;
        this.isCordova = isCordova;
        this.addresses = [];
        this.isMobile = isMobile.any();
        this.isWindowsPhoneApp = isMobile.Windows() && isCordova;
        this.blockUx = false;
        this.showScanner = false;
        this.isMobile = isMobile.any();
        this.addr = {};
        this.isTestnet = constants.version.match(/t$/);
        this.testnetName = (constants.alt === '2') ? '[NEW TESTNET]' : '[TESTNET]';
        this.exchangeRates = network.exchangeRates;
        $scope.index.chat = false;
        self.chatAddress = false;
        self.deviceAddress = '';
        $scope.index.tab = 'walletHome'; // for some reason, current tab state is tracked in index and survives re-instatiations of walletHome.js
        self.hometransfer = true;
        self.eye = true;
        self.walletNameInfo = (self.walletType).split("-")[0] ? (self.walletType).split("-")[0] : 'INVE';
        self.nameValue = ((self.walletName == undefined) ? 'SNC' : (self.walletName.length > 7 ? self.walletName.substring(0, 8) + '...' : self.walletName));
        self.addressValue = '';
        self.rangevalue = 50;
        self.low = 4 * 1024;
        self.high = 105 * 1024;
        self.tranFee = profileService.formatAmount(constants.BASE_NRG * indexScope.nrgPrice, 'inve');

        /*锁仓功能新增：接受支付地址*/
        self._isAddress = $stateParams._address ? true : false
        self._address = $stateParams._address

        self._lockTimer = "1"   //  锁仓时长


        var webHelper = require('inWalletcore/sendTransactionToNode');
        webHelper.get('https://api.blockcypher.com/v1/btc/main', {}, function (err2, result2) {
            if (result2 == null) {
                return;
            }
            result2 = JSON.parse(result2);
            self.low = result2.low_fee_per_kb;
            self.high = result2.high_fee_per_kb;
            self.percent = parseInt((self.low + self.rangevalue / 300 * (self.high - self.low)) / 1024);
        });
        self.percent = parseInt((self.low + self.rangevalue / 300 * (self.high - self.low)) / 1024);

        self.gowalleInfo = function (walletType, walletId, addr, name, image, ammount, mnemonic, mnemonicEncrypted) {
            $state.go('walletinfo', {
                walletType: walletType,
                walletId: walletId,
                address: addr,
                name: name,
                image: image,
                ammount: ammount,
                mnemonic: mnemonic,
                mnemonicEncrypted: mnemonicEncrypted
            });
        }

        /**
         * 根据walletId生成对应的钱包列表
         * @type {Array}
         */
        let walletInfo = [];
        for (let item in indexScope.walletInfo) {
            if (indexScope.walletInfo[item].wallet.indexOf(self.walletNameInfo) != -1) {
                walletInfo.push(indexScope.walletInfo[item]);
            } else if (self.walletNameInfo == 'INVE' && indexScope.walletInfo[item].wallet.indexOf('BTC') == -1 && indexScope.walletInfo[item].wallet.indexOf('ETH') == -1) {
                walletInfo.push(indexScope.walletInfo[item]);
            }
        }
        self.walletInfo = walletInfo;

        /**
         * 判断当前钱包，设置钱包转账图片
         * @param
         */
        for (let item in configWallets) {
            if (item == self.walletType) {
                self.inputImg = configWallets[item][0];
                self.unit = configWallets[item][2];
                self.addrPlacehoder = gettextCatalog.getString('Type') + ' ' + configWallets[item][2] + ' ' + gettextCatalog.getString('address');
            }
        }
        /**
         * 选择钱包
         * @paramExchange rate
         */
        self.findPaymentAddress = function (walletId, stables, walletName, address) {
            self.showselectwt = false;
            self.walletId = walletId;
            self.nameValue = walletName;
            self.addressValue = address;
            self.amount = stables;
            $timeout(function () {
                $scope.$apply();
            })
        }

        self.setSendError = function (err) {
            return $rootScope.$emit('Local/ShowErrorAlert', err);
        };

        self.changePercent = function () {
            console.log('change');
            self.percent = parseInt((self.low + self.rangevalue / 300 * (self.high - self.low)) / 1024);
        }

        self.cancel = function () {
            $rootScope.$emit('Local/paymentDoneAndCallBack', self.deviceAddress);
            $rootScope.$emit('Local/SetTabDefine', 'correspondentDevices');
            self.resetForm();
        }

        /**
         * 触发监听事件后，销毁事件，防止重复触发
         */
        // $scope.$on('$destroy', function() {
        //     console.log("walletHome $destroy");
        //     transferQR();
        //     openTranInfoListener();
        //     disablePaymentRequestListener();
        // });
        /**
         * 聊天窗口，点击地址发送交易时跳转
         * @type {*|(function())|angular.noop}
         */
        var disablePaymentRequestListener = $rootScope.$on('paymentRequest', function (event, address, amount, asset, recipient_device_address, chat) {
            //alert(chat)
            if (chat) {
                $scope.index.chat = true;
                self.deviceAddress = recipient_device_address;
            }
            let fc = profileService.profile;
            if (fc.credentials.length != 1 && chat) {
                self.chatAddress = true;
            }
            self.setForm(address, amount, null, asset, recipient_device_address);
        });


        this.setForm = function (to, amount, comment, asset, recipient_device_address) {
            this.resetError();
            $timeout((function () {
                delete this.binding;
                var form = $scope.sendPaymentForm;
                if (!form || !form.address) // disappeared?
                    return console.log('form.address has disappeared');
                if (to) {
                    form.address.$setViewValue(to);
                    form.address.$isValid = true;
                    form.address.$render();
                    this.lockAddress = true;
                    $scope.mtab = 1;
                    // if (recipient_device_address) // must be already paired
                    //     assocDeviceAddressesByPaymentAddress[to] = recipient_device_address;
                }

                if (amount) {
                    this.lockAmount = true;
                    $timeout(function () {
                        //form.amount.$setViewValue("" + profileService.getAmountInDisplayUnits(amount, asset));
                        form.amount.$setViewValue("" + amount);
                        form.amount.$isValid = true;
                        form.amount.$render();
                    });
                } else {
                    this.lockAmount = false;
                    form.amount.$pristine = true;
                    form.amount.$setViewValue('');
                    form.amount.$render();
                }

                if (form.merkle_proof) {
                    form.merkle_proof.$setViewValue('');
                    form.merkle_proof.$render();
                }
                if (comment) {
                    form.comment.$setViewValue(comment);
                    form.comment.$isValid = true;
                    form.comment.$render();
                }

                if (asset) {
                    // var assetIndex = lodash.findIndex($scope.index.arrBalances, {
                    //     asset: asset
                    // });
                    // // if (assetIndex < 0)
                    // //     throw Error("failed to find asset index of asset " + asset);
                    // $scope.index.assetIndex = assetIndex;
                    this.lockAsset = true;
                } else
                    this.lockAsset = false;
            }).bind(this), 1);
        };

        /**
         * 交易根据不用的type调用
         * @type {{BTC: {}, ETH: {}}}
         */
        var transactionObject = {
            "BTC": {
                composeAndSend: btcComposeAndSend
            },
            "ETH": {
                composeAndSend: ethComposeAndSend
            }
        }


        function ethComposeAndSend(toAddress, amount, fee) {
            var ethRpcHelper = require('inWalletcore/HDWallet/eth_rpchelper');
            var fc = profileService.focusedClient;
            amount = new bigNumber(amount).times(1000000000000000000).toString();
            var importType = fc.credentials.mnemonicEncrypted ? 0 : 1;
            var mnemonic = fc.credentials.mnemonic;
            if (importType == 1) {
                mnemonic = fc.credentials.xPrivKey;
            }
            try {
                ethRpcHelper.sendtranstion(mnemonic, toAddress, amount, 0, importType, false, function (err, hash, address) {
                    if (err !== null) {
                        if (isCordova)
                            window.plugins.spinnerDialog.hide();
                        else
                            $scope.index.progressing = false;
                        return $rootScope.$emit('Local/ShowErrorAlert', err);
                    } else {
                        var light = require('inWalletcore/light');
                        var amount1 = 0;
                        var amount2 = amount;
                        if (amount.length > 18) {
                            amount1 = amount.substr(0, amount.length - 18);
                            amount2 = amount.substr(amount.length - 18);
                        }
                        light.insertETHTran({
                            'txid': hash,
                            'amount': amount1,
                            'amount_point': amount2,
                            'fee': 0,
                            'addressFrom': address,
                            'addressTo': toAddress,
                            'type': 3
                        }, function () {
                            if (err !== null) {
                                //console.log(err);
                                indexScope.showAlert2 = {};
                                indexScope.showAlert2.msg = err;
                                indexScope.showAlert = true;
                                if (isCordova)
                                    window.plugins.spinnerDialog.hide();
                                else
                                    $scope.index.progressing = false;
                                return;
                            } else {
                                /**
                                 * 如果从聊天窗口跳转发出的交易，交易完成后需要跳转回聊天窗口
                                 * 当前只有INVE类型交易
                                 */
                                if ($scope.index.chat) {
                                    // let tranMessage = gettextCatalog.getString(cb.id+'?Transferred: ')+ new bigNumber(amount).dividedBy(100000000).toString();+' BTC';
                                    // $rootScope.$emit('Local/paymentDoneAndSendMessage',self.deviceAddress,tranMessage);
                                    $scope.index.updateTxHistory(3);
                                    $rootScope.$emit('Local/SetTab', 'correspondentDevices');
                                } else {
                                    $rootScope.$emit('Local/paymentDone');
                                    $scope.index.updateTxHistory();
                                    $state.go('walletinfo', {
                                        walletType: self.walletType,
                                        walletId: self.walletId,
                                        address: self.address,
                                        name: self.walletName,
                                        image: self.image,
                                        ammount: self.ammount,
                                        mnemonic: self.mnemonic,
                                        mnemonicEncrypted: self.mnemonicEncrypted
                                    });

                                }
                                if (isCordova)
                                    window.plugins.spinnerDialog.hide();
                                else
                                    $scope.index.progressing = false;
                                self.resetForm();
                            }
                        });
                    }
                })
            } catch (err) {
                console.log(err);
                indexScope.showAlert2 = {};
                indexScope.showAlert2.msg = err;
                indexScope.showAlert = true;
                if (isCordova)
                    window.plugins.spinnerDialog.hide();
                else
                    $scope.index.progressing = false;
                return;
            }

        }

        var inTran = false;

        /*
         * 发起BTC交易
         */
        function btcComposeAndSend(toAddress, amount, fee) {
            if (inTran) {
                return;
            }
            inTran = true;
            if (fee == undefined)
                fee = 0.0001;
            // amount = new bigNumber(amount).dividedBy(100000000).toString();
            var fc = profileService.focusedClient;
            var btcrpcHelper = require('inWalletcore/HDWallet/btc_rpcHelper');
            var importType = fc.credentials.mnemonicEncrypted ? 0 : 1;
            var mnemonic = fc.credentials.mnemonic;
            if (importType)
                mnemonic = fc.credentials.xPrivKey;
            try {
                btcrpcHelper.sendTransaction(mnemonic, toAddress, amount, 0.0001, function (err, hash, address) {
                    if (err !== null) {
                        indexScope.showAlert2 = {};
                        indexScope.showAlert2.msg = err;
                        indexScope.showAlert = true;
                        inTran = false;
                        if (isCordova)
                            window.plugins.spinnerDialog.hide();
                        else
                            $scope.index.progressing = false;
                        return;
                        //return $rootScope.$emit('Local/ShowErrorAlert', err);
                    } else {
                        let light = require('inWalletcore/light');
                        light.insertOtherTran({
                            'txid': hash.result,
                            'amount': Math.abs(parseInt(new bigNumber(amount).times(100000000).toString())),
                            'fee': Math.abs(parseInt(new bigNumber(fee).times(100000000).toString())),
                            'addressFrom': address,
                            'addressTo': toAddress,
                            'type': 2
                        }, function () {
                            if (err !== null) {
                                console.log(err);
                                inTran = false;
                                indexScope.showAlert2 = {};
                                indexScope.showAlert2.msg = err;
                                indexScope.showAlert = true;
                                if (isCordova)
                                    window.plugins.spinnerDialog.hide();
                                else
                                    $scope.index.progressing = false;
                                return;
                            } else {
                                /**
                                 * 如果从聊天窗口跳转发出的交易，交易完成后需要跳转回聊天窗口
                                 * 当前只有INVE类型交易
                                 */
                                inTran = false;
                                if ($scope.index.chat) {
                                    // let tranMessage = gettextCatalog.getString(cb.id+'?Transferred: ')+ new bigNumber(amount).dividedBy(100000000).toString();+' BTC';
                                    // $rootScope.$emit('Local/paymentDoneAndSendMessage',self.deviceAddress,tranMessage);
                                    $scope.index.updateTxHistory(3);
                                    $rootScope.$emit('Local/SetTab', 'correspondentDevices');
                                } else {
                                    $rootScope.$emit('Local/paymentDone');
                                    $scope.index.updateTxHistory();
                                    $state.go('walletinfo', {
                                        walletType: self.walletType,
                                        walletId: self.walletId,
                                        address: self.address,
                                        name: self.walletName,
                                        image: self.image,
                                        ammount: self.ammount,
                                        mnemonic: self.mnemonic,
                                        mnemonicEncrypted: self.mnemonicEncrypted
                                    });

                                }
                                if (isCordova)
                                    window.plugins.spinnerDialog.hide();
                                else
                                    $scope.index.progressing = false;
                                self.resetForm();
                            }
                        });
                    }
                }, false, 0, importType, fc.credentials.otherObject.segwit, fc.credentials.otherObject.network, false, self.percent);
            } catch (err) {
                console.log(err);
                inTran = false;
                indexScope.showAlert2 = {};
                indexScope.showAlert2.msg = err;
                indexScope.showAlert = true;
                if (isCordova)
                    window.plugins.spinnerDialog.hide();
                else
                    $scope.index.progressing = false;
                return;
            }

        }


        /**
         * 点击交易页面发送交易后开始执行
         * @param chat
         * @param deviceAddress
         * @returns {*}
         */
        this.submitPayment = lodash.debounce(function (chat, deviceAddress) {
            profileService.setAndStoreFocusToWallet(self.walletId, function () {
                profileService.unlockFC(null, function (err) {
                    if (err) {
                        $rootScope.$emit('Local/ShowErrorAlert', gettextCatalog.getString('Wrong password'));
                        return;
                    }
                    let fc = profileService.focusedClient;
                    let pubkey = utils.getPubkey(fc.credentials.xPrivKey);
                    // console.warn('walletClients: ', fc.credentials);

                    let obj = {
                        fromAddress: self.address,
                        toAddress: self.contAddress[0],
                        amount: self.diceData.amount,
                        callData: callData + self.diceData.type,
                        pubkey: pubkey,
                        xprivKey: fc.credentials.xPrivKey
                    }

                    // console.warn('合约交易构造传递前的数据格式')
                    // console.log(obj)
                    //  构造合约交易
                    payment.contractTransactionData(obj, function (err, res) {
                        // console.error(res)
                        // console.error(err)
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
                                // console.warn('发送交易后返回的数据')
                                // console.log(err)
                                // console.log(res)
                                if (err) {
                                    return $rootScope.$emit('Local/ShowErrorAlert', err);
                                } else {
                                    $rootScope.$emit('Local/ShowErrorAlert', gettextCatalog.getString('Payment Success'));

                                    // console.info('确认支付后，查询列表')
                                    self.showNewDice()
                                    self.cancelPay()
                                }
                            })
                        }
                    })
                });
            });
        }, 1 * 1000);


        /**
         * 重置属性值
         */
        this.resetForm = function () {
            var self = this;
            this.resetError();
            delete this.binding;

            this.lockAsset = false;
            this.lockAddress = false;
            this.lockAmount = false;
            this.hideAdvSend = true;
            this.send_multiple = false;
            this.current_payment_key = '';
            $scope.index.chat = false;
            self.chatAddress = false;
            self.exTradeOutId = '';
            self.exTradeOutImg = '';
            self.exTradeOutStable = '';
            self.deviceAddress = '';
            $scope.currentSpendUnconfirmed = configService.getSync()
                .wallet.spendUnconfirmed;

            this._amount = this._address = this._note = null;
            this.bSendAll = false;

            var form = $scope.sendPaymentForm;


            $timeout(function () {
                if (form && form.amount) {
                    form.amount.$pristine = true;
                    form.amount.$setViewValue('');
                    if (form.amount)
                        form.amount.$render();

                    if (form.merkle_proof) {
                        form.merkle_proof.$setViewValue('');
                        form.merkle_proof.$render();
                    }
                    if (form.comment) {
                        form.comment.$setViewValue('');
                        form.comment.$render();
                    }
                    form.$setPristine();

                    if (form.address) {
                        form.address.$setPristine();
                        form.address.$setViewValue('');
                        form.address.$render();
                    }
                }

            });
        }

        this.resetError = function () {
            this.error = this.success = null;
        };

        /**
         * 转账页面扫描地址二维码
         * @type {*|(function())|angular.noop}
         */
        var transferQR = $rootScope.$on('Local/transferQR', function (event, address, amount, type) {
            if (type != self.walletType) {
                $rootScope.$emit('Local/ShowErrorAlert', gettextCatalog.getString('The address type does not match, the address type must be') + ': ' + self.walletType + ' ' + gettextCatalog.getString('address'));
                return;
            } else {
                self._address = address;
                if (amount) self._amount = amount;
            }

        })


        //模态框点击后赋addr值
        $rootScope.$on('Local/setAddressVal', function (event, addr, type) {
            var form = $scope.sendPaymentForm;
            if (!form || !form.address) // disappeared?
                return console.log('form.address has disappeared');
            form.address.$setViewValue(addr);
            form.address.$isValid = true;
            form.address.$render();
        });

        $scope.$on('$destroy', function () {
            transferQR();
        });


        self.errMessage = function (err) {
            if (typeof err === 'object') {
                err = JSON.stringify(err);
                eventBus.emit('nonfatal_error', "error object from sendMultiPayment: " + err, new Error());
            } else if (err.match(/device address/))
                err = "This is a private asset, please send it only by clicking links from chat";
            else if (err.match(/no funded/))
                err = gettextCatalog.getString("Not enough spendable funds, make sure all your funds are confirmed");
            else if (err.match(/authentifier verification failed/))
                err = "Check that smart contract conditions are satisfied and signatures are correct";
            else if (err.match(/precommit/))
                err = err.replace('precommit callback failed: ', '');
            else if (err.match(/is same/))
                err = gettextCatalog.getString("to_address and from_address is same");
            else if (err.match(/network error/))
                err = gettextCatalog.getString("network error,please try again.");
            else if (err.match(/not enough spendable/))
                err = gettextCatalog.getString("not enough spendable");
            else if (err.match(/Insufficient balance/))
                err = gettextCatalog.getString("not enough spendable");
            return self.setSendError(err);
        }

        /**
         * 实时计算INVE手续费
         */
        self.transactionFee = function () {
            let Base64 = require('inWalletcore/base64Code');
            //console.log('self._note: ',$scope._note)
            if ($scope._note) Base64.encode($scope._note).then(function (resolve, reject) {
                self.tranFee = resolve ? profileService.formatAmount(((resolve.length * 1.0 / 1024) * constants.NRG_PEER_KBYTE + constants.BASE_NRG) * indexScope.nrgPrice, 'inve') : profileService.formatAmount(constants.BASE_NRG * indexScope.nrgPrice, 'inve');
            });
            else self.tranFee = profileService.formatAmount(constants.BASE_NRG * indexScope.nrgPrice, 'inve');
            setTimeout(function () {
                $scope.$apply();
            });
        }

        self.onClickWallet = function () {

        }


        self.__goBack = function () {
            history.go(-1);
        }
    });
