'use strict';

angular.module('copayApp.controllers').controller('transferController',
    function($http, $scope, $rootScope, $timeout, $window, $state, $stateParams, $filter, $modal, $log, notification, isCordova, profileService, lodash, configService, storageService, gettext, gettextCatalog, go, nodeWebkit, addressService, confirmDialog, animationService, addressbookService, txFormatService) {
        var self = this;
        let fc  = profileService.profile;
        let w = fc.credentials[0];
        self.walletId = $stateParams.walletId ? $stateParams.walletId : w.walletId;
        self.walletIdRoute = $stateParams.walletId ? $stateParams.walletId : w.walletId;
        self.walletType = $stateParams.walletType ? $stateParams.walletType :w.type;
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
        self.walletNameInfo =(self.walletType).split("-")[0] ? (self.walletType).split("-")[0]:'INVE';
        self.nameValue = (( self.walletName == undefined) ? 'SNC' : (self.walletName.length > 7 ? self.walletName.substring(0, 8)+'...' : self.walletName));
        self.addressValue = '';
        self.rangevalue = 50;
        self.low = 4 * 1024;
        self.high = 105 * 1024;
        self.tranFee =  profileService.formatAmount(constants.BASE_NRG * indexScope.nrgPrice , 'inve');

        var webHelper = require('inWalletcore/sendTransactionToNode');
        webHelper.get('https://api.blockcypher.com/v1/btc/main', {}, function (err2, result2) {
            if (result2 == null){
                return;
            }
            result2 = JSON.parse(result2);
            self.low = result2.low_fee_per_kb;
            self.high = result2.high_fee_per_kb;
            self.percent = parseInt((self.low + self.rangevalue/300 * (self.high - self.low)) / 1024);
        });
        self.percent = parseInt((self.low + self.rangevalue/300 * (self.high - self.low)) / 1024);

        self.gowalleInfo = function(walletType, walletId, addr, name, image, ammount, mnemonic, mnemonicEncrypted){
            $state.go('walletinfo', { walletType: walletType, walletId: walletId, address: addr, name: name, image: image, ammount: ammount, mnemonic: mnemonic, mnemonicEncrypted: mnemonicEncrypted });
        }

        /**
         * 根据walletId生成对应的钱包列表
         * @type {Array}
         */
        let walletInfo = [];
        for(let item in indexScope.walletInfo){
            if(indexScope.walletInfo[item].wallet.indexOf(self.walletNameInfo) != -1)
            {
                walletInfo.push(indexScope.walletInfo[item]);
            }
            else if(self.walletNameInfo == 'INVE' && indexScope.walletInfo[item].wallet.indexOf('BTC') == -1 && indexScope.walletInfo[item].wallet.indexOf('ETH') == -1)
            {
                walletInfo.push(indexScope.walletInfo[item]);
            }
        }
        self.walletInfo = walletInfo;

        /**
         * 判断当前钱包，设置钱包转账图片
         * @param
         */
        for(let item in configWallets){
            if(item == self.walletType) {
                self.inputImg = configWallets[item][0];
                self.unit = configWallets[item][2];
                self.addrPlacehoder = gettextCatalog.getString('Type')+' '+configWallets[item][2]+' '+gettextCatalog.getString('address');
            }
        }
        /**
         * 选择钱包
         * @paramExchange rate
         */
        self.findPaymentAddress = function(walletId, stables, walletName, address){
            self.showselectwt = false;
            self.walletId = walletId;
            self.nameValue = walletName;
            self.addressValue = address;
            self.amount = stables;
            $timeout(function(){
                $scope.$apply();
            })
        }

        self.setSendError = function(err) {
            return $rootScope.$emit('Local/ShowErrorAlert', err);
        };

        self.changePercent = function(){
            console.log('change');
            self.percent = parseInt((self.low + self.rangevalue/300 * (self.high - self.low)) / 1024);
        }

        self.cancel = function () {
            $rootScope.$emit('Local/paymentDoneAndCallBack',self.deviceAddress);
            $rootScope.$emit('Local/SetTabDefine','correspondentDevices');
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
        var disablePaymentRequestListener = $rootScope.$on('paymentRequest', function(event, address, amount, asset, recipient_device_address,chat) {
            //alert(chat)
            if(chat){
                $scope.index.chat = true;
                self.deviceAddress = recipient_device_address;
            }
            let fc  = profileService.profile;
            if(fc.credentials.length != 1 && chat){
                self.chatAddress = true;
            }
            self.setForm(address, amount, null, asset, recipient_device_address);
        });



        this.setForm = function(to, amount, comment, asset, recipient_device_address) {
            this.resetError();
            $timeout((function() {
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
                    $timeout(function() {
                        //form.amount.$setViewValue("" + profileService.getAmountInDisplayUnits(amount, asset));
                        form.amount.$setViewValue("" + amount);
                        form.amount.$isValid = true;
                        form.amount.$render();
                    });
                }
                else {
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
                }
                else
                    this.lockAsset = false;
            }).bind(this), 1);
        };

        /**
         * 交易根据不用的type调用
         * @type {{BTC: {}, ETH: {}}}
         */
        var transactionObject = {
            "BTC":{
                composeAndSend: btcComposeAndSend
            },
            "ETH":{
                composeAndSend: ethComposeAndSend
            },
            "SNC":{
                composeAndSend: sncComposeAndSend
            }
        }

        /**
         * 增加SNC交易
         * @param to_address
         * @param amount
         * @param fee
         */
        function sncComposeAndSend(to_address, amount, fee) {
            let fc = profileService.focusedClient;
            require('inWalletcore/wallet').readAddressByWallet(fc.credentials.walletId, function (cb) {
                let from_address = cb;
                var opts = {
                    from_address: from_address ? from_address : '',
                    xPrivKey: fc.credentials.xPrivKey,
                    walletId: fc.credentials.walletId,
                    sendType: 0,
                    to_address: to_address,
                    amount: Number(amount),
                    fee: fee ? fee : "0",
                };
                let wallet_snc = require('inWalletcore/stornet/wallet_snc')
                wallet_snc.sendTransactions(opts, function (err, res) {
                    console.log(res)
                    console.log(err)
                    if(err){
                        self.errMessage(err);
                        return;

                    }
                    $state.go('walletinfo', {   walletType: self.walletType, walletId: self.walletId, address: self.address, name: self.walletName, image: self.image, ammount: self.ammount, mnemonic: self.mnemonic, mnemonicEncrypted: self.mnemonicEncrypted });
                    $rootScope.$emit('Local/paymentDone');
                    $scope.index.updateTxHistory();
                    self.resetForm();
                })

            })
        }

        function ethComposeAndSend(toAddress, amount, fee) {
            var ethRpcHelper = require('inWalletcore/HDWallet/eth_rpchelper');
            var fc = profileService.focusedClient;
            amount = new bigNumber(amount).times(1000000000000000000).toString();
            var importType = fc.credentials.mnemonicEncrypted?0: 1;
            var mnemonic = fc.credentials.mnemonic;
            if (importType == 1){
                mnemonic = fc.credentials.xPrivKey;
            }
            try {
                ethRpcHelper.sendtranstion(mnemonic, toAddress, amount, 0, importType, false, function(err, hash, address){
                    if (err !== null){
                        if (isCordova)
                            window.plugins.spinnerDialog.hide();
                        else
                            $scope.index.progressing = false;
                        return $rootScope.$emit('Local/ShowErrorAlert', err);
                    } else {
                        var light = require('inWalletcore/light');
                        var amount1 = 0;
                        var amount2 = amount;
                        if (amount.length > 18){
                            amount1 = amount.substr(0, amount.length - 18);
                            amount2 = amount.substr(amount.length - 18);
                        }
                        light.insertETHTran({'txid': hash, 'amount': amount1, 'amount_point': amount2,'fee': 0, 'addressFrom': address, 'addressTo': toAddress, 'type': 3}, function(){
                            if (err !== null){
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
                                if($scope.index.chat){
                                    // let tranMessage = gettextCatalog.getString(cb.id+'?Transferred: ')+ new bigNumber(amount).dividedBy(100000000).toString();+' BTC';
                                    // $rootScope.$emit('Local/paymentDoneAndSendMessage',self.deviceAddress,tranMessage);
                                    $scope.index.updateTxHistory(3);
                                    $rootScope.$emit('Local/SetTab','correspondentDevices');
                                }else {
                                    $rootScope.$emit('Local/paymentDone');
                                    $scope.index.updateTxHistory();
                                    $state.go('walletinfo', {   walletType: self.walletType, walletId: self.walletId, address: self.address, name: self.walletName, image: self.image, ammount: self.ammount, mnemonic: self.mnemonic, mnemonicEncrypted: self.mnemonicEncrypted });

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
            } catch (err){
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
        function btcComposeAndSend(toAddress, amount, fee){
            if (inTran){
                return;
            }
            inTran = true;
            if (fee == undefined)
                fee = 0.0001;
            // amount = new bigNumber(amount).dividedBy(100000000).toString();
            var fc = profileService.focusedClient;
            var btcrpcHelper = require('inWalletcore/HDWallet/btc_rpcHelper');
            var importType = fc.credentials.mnemonicEncrypted?0: 1;
            var mnemonic = fc.credentials.mnemonic;
            if (importType)
                mnemonic = fc.credentials.xPrivKey;
            try {
                btcrpcHelper.sendTransaction(mnemonic, toAddress, amount,0.0001, function(err, hash, address){
                    if (err !== null){
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
                        light.insertOtherTran({'txid': hash.result, 'amount': Math.abs(parseInt(new bigNumber(amount).times(100000000).toString())), 'fee': Math.abs(parseInt(new bigNumber(fee).times(100000000).toString())), 'addressFrom': address, 'addressTo': toAddress, 'type': 2}, function(){
                            if (err !== null){
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
                                if($scope.index.chat){
                                    // let tranMessage = gettextCatalog.getString(cb.id+'?Transferred: ')+ new bigNumber(amount).dividedBy(100000000).toString();+' BTC';
                                    // $rootScope.$emit('Local/paymentDoneAndSendMessage',self.deviceAddress,tranMessage);
                                    $scope.index.updateTxHistory(3);
                                    $rootScope.$emit('Local/SetTab','correspondentDevices');
                                }else {
                                    $rootScope.$emit('Local/paymentDone');
                                    $scope.index.updateTxHistory();
                                    $state.go('walletinfo', {   walletType: self.walletType, walletId: self.walletId, address: self.address, name: self.walletName, image: self.image, ammount: self.ammount, mnemonic: self.mnemonic, mnemonicEncrypted: self.mnemonicEncrypted });

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
            } catch (err){
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
        this.submitPayment = lodash.debounce(function(chat,deviceAddress) {
            console.log(this.rangevalue*100/300);
            $scope.index.chat = chat ;
            self.deviceAddress = deviceAddress;
            var form = $scope.sendPaymentForm;
            let note  = form.note.$modelValue;
            if(note != undefined && note.length > 50){
                self.setSendError(gettextCatalog.getString('Character is too long'));
                return;
            }


           // var fc = profileService.focusedClient;
            var unitValue = this.unitValue;
            var bbUnitValue = this.bbUnitValue;
            if (isCordova && this.isWindowsPhoneApp) {
                this.hideAddress = false;
                this.hideAmount = false;
            }

            var isMultipleSend = !!form.addresses;
            if (!form)
                return console.log('form is gone');
            if (self.bSendAll)
                form.amount.$setValidity('validAmount', true);

            var resetAddressValidation = function(){};
            if ($scope.mtab == 2 && !isMultipleSend && !form.address.$modelValue) { // clicked 'share via message' button
                resetAddressValidation = function() {
                    if (form && form.address)
                        form.address.$setValidity('validAddressOrAccount', false);
                }

            }
            form.address.$setValidity('validAddressOrAccount', true);

            if (form.$invalid) {
                this.error = gettext('Unable to send transaction proposal');
                return;
            }

            //TODO 添加其他类型地址后，需要修改
            /**
             * 通过walletId判断，解锁对应地址进行交易
             * 目前只有INVE,如果增加BTC、ETH后，可能需要修改判断条件
             * 待同事处理完后，添加
             *
             *  // -- over by pmj 沒解密之前一致 解密之後根據不同的類型发起不同交易
             */

            profileService.setAndStoreFocusToWallet((self.walletId).indexOf('SNC-')? (self.walletId).replace('SNC-','INVE-') : self.walletId,function () {
                fc = profileService.focusedClient;
                if (fc.isPrivKeyEncrypted()) {
                    profileService.unlockFC(null, function (err) {
                        if (err)
                            return self.setSendError(err.message);
                        delete self.current_payment_key;
                        return self.submitPayment($scope.index.chat,self.deviceAddress);
                    });
                    return;
                }else {
                    //加载中
                    if (isCordova)
                        window.plugins.spinnerDialog.show(null, gettextCatalog.getString('Loading...'), true);
                    else{
                        $scope.index.progressing = true;
                        $scope.index.progressingmsg = 'Loading...';
                    }
                    var wallet = require('inWalletcore/wallet.js');
                    var assetInfo = $scope.index.arrBalances[$scope.index.assetIndex];
                    var asset = 'base';
                    console.log("asset " + asset);
                    //TODO 此部分需要重新梳理，改写
                    var address = form.address.$modelValue;
                    var amount = form.amount.$modelValue;


                    var current_payment_key = '' + asset + address + amount;

                    var merkle_proof = '';
                    if (form.merkle_proof && form.merkle_proof.$modelValue)
                        merkle_proof = form.merkle_proof.$modelValue.trim();

                    // if (current_payment_key === self.current_payment_key)
                    //     return $rootScope.$emit('Local/ShowErrorAlert', "This payment is already under way");
                    self.current_payment_key = current_payment_key;

                    //indexScope.setOngoingProcess(gettext('sending'), true);
                    $timeout(function() {
                        /**
                         * 判断是否有指纹锁，如果设置后，需要指纹解锁才能继续往下走
                         */
                        profileService.requestTouchid(function(err) {
                            if (err) {
                                profileService.lockFC();
                                self.error = err;
                                $timeout(function() {
                                    delete self.current_payment_key;
                                    if(!$rootScope.$$phase) $scope.$apply();
                                }, 1);
                                return;
                            }

                            if (transactionObject[self.walletNameInfo]) {
                                transactionObject[self.walletNameInfo].composeAndSend(address, form.amount.$modelValue);
                                return;
                            }

                            if (self.binding) {
                                if (isTextcoin) {
                                    delete self.current_payment_key;
                                    //indexScope.setOngoingProcess(gettext('sending'), false);
                                    return self.setSendError("you can send bound payments to inWallet adresses only");
                                }
                            }
                            else
                                composeAndSend(address);

                            // compose and send
                            var from_address ;
                            function composeAndSend(to_address) {
                                var arrSigningDeviceAddresses = []; // empty list means that all signatures are required (such as 2-of-2)
                                if (fc.credentials.m < fc.credentials.n)
                                    $scope.index.copayers.forEach(function (copayer) {
                                        if (copayer.me || copayer.signs)
                                            arrSigningDeviceAddresses.push(copayer.device_address);
                                    });
                                else if (indexScope.shared_address)
                                    arrSigningDeviceAddresses = indexScope.copayers.map(function (copayer) {
                                        return copayer.device_address;
                                    });
                                breadcrumbs.add('sending payment in ' + asset);
                                profileService.bKeepUnlocked = true;
                                var isHot = fc.credentials.xPrivKeyEncrypted ? 0 : 1;//判断冷热钱包,0为普通钱包，1为热钱包

                                require('inWalletcore/wallet').readAddressByWallet(fc.credentials.walletId,function (cb) {
                                    from_address = cb;
                                    var opts = {
                                        shared_address: from_address ? from_address: '',
                                        merkle_proof: merkle_proof,
                                        asset: asset,
                                        do_not_email: true,
                                        send_all: self.bSendAll,
                                        arrSigningDeviceAddresses: arrSigningDeviceAddresses,
                                        //recipient_device_address: recipient_device_address,
                                        isHot: isHot,
                                        xPrivKey: fc.credentials.xPrivKey,
                                        walletId: fc.credentials.walletId,
                                        deviceAddress : self.deviceAddress ? self.deviceAddress: '',
                                        sendType : 0,
                                        to_address : to_address,
                                        amount : Number(amount),
                                        note : note ? note: ''
                                    };

                                    var filePath;
                                    if (assetInfo != undefined && assetInfo.is_private) {
                                        opts.getPrivateAssetPayloadSavePath = function (cb) {
                                            self.getPrivatePayloadSavePath(function (fullPath, cordovaPathObj) {
                                                filePath = fullPath ? fullPath : (cordovaPathObj ? cordovaPathObj.root + cordovaPathObj.path + '/' + cordovaPathObj.fileName : null);
                                                cb(fullPath, cordovaPathObj);
                                            });
                                        };
                                    }
                                    /**
                                     * 热钱包交易
                                     * 生成热钱包交易信息，提供给冷钱包进行扫码签名
                                     */
                                    if (opts.isHot == 1 ) {
                                        var wallet = require('inWalletcore/wallet.js');
                                        wallet.readAddressByWallet(fc.credentials.walletId, function (objAddr) {
                                            opts.change_address = objAddr;
                                            var shadowWallet = require('inWalletcore/shadowWallet');
                                            shadowWallet.getTradingUnit(opts, function (obj) {
                                                if(typeof obj == "object"){
                                                    $rootScope.$emit('Local/unsignedTransactionIfo', obj);
                                                }else {
                                                    console.log("error: "+obj);
                                                    return self.setSendError(gettextCatalog.getString(obj));
                                                }
                                            });
                                            $timeout(function () {
                                                if (isCordova)
                                                    window.plugins.spinnerDialog.hide();
                                                else
                                                    $scope.index.progressing = false;
                                                delete self.current_payment_key;
                                                resetAddressValidation();
                                                profileService.bKeepUnlocked = false;
                                                self.resetForm();
                                            },1000);

                                        });
                                        return;
                                    }

                                    /**
                                     * 发送交易后，回调
                                     * 1.错误信息提示
                                     * 2.交易成功后，返回交易结构供后续操作调用
                                     */
                                    // for( let i =0; i < 1000 ; i++){
                                    //     opts.amount +=1;
                                    //     fc.sendMultiPayment(opts,cb);
                                    //     i++;
                                    //     console.log(i);
                                    // }
                                    fc.sendMultiPayment(opts, function(err, cb) {
                                        if (isCordova)
                                            window.plugins.spinnerDialog.hide();
                                        else
                                            $scope.index.progressing = false;
                                        breadcrumbs.add('done payment in ' + asset + ', err=' + err);
                                        delete self.current_payment_key;
                                        resetAddressValidation();
                                        profileService.bKeepUnlocked = false;
                                        if (err) {
                                            self.errMessage(err);
                                            return;
                                        }
                                        var binding = self.binding;
                                        /**
                                         * 如果从聊天窗口跳转发出的交易，交易完成后需要跳转回聊天窗口
                                         * 当前只有INVE类型交易
                                         */
                                        if($scope.index.chat){
                                            let tranMessage = gettextCatalog.getString(cb.id+'?Transferred: ')+form.amount.$modelValue+' INVE';
                                            $rootScope.$emit('Local/paymentDoneAndSendMessage',self.deviceAddress,tranMessage);
                                            $scope.index.updateTxHistory(3);
                                            $rootScope.$emit('Local/SetTab','correspondentDevices');
                                        }else {
                                            $rootScope.$emit('Local/paymentDone');
                                            //$scope.index.updateTxHistory();
                                            $state.go('walletinfo', {   walletType: self.walletType, walletId: self.walletId, address: self.address, name: self.name, image: self.image, ammount: self.ammount, mnemonic: self.mnemonic, mnemonicEncrypted: self.mnemonicEncrypted });

                                        }
                                        self.resetForm();
                                    });
                                });
                            }

                        });
                    }, 100);
                }
            });


        },1 * 1000);


        /**
         * 重置属性值
         */
        this.resetForm = function() {
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


            $timeout(function() {
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

        this.resetError = function() {
            this.error = this.success = null;
        };

        /**
         * 转账页面扫描地址二维码
         * @type {*|(function())|angular.noop}
         */
        var transferQR = $rootScope.$on('Local/transferQR',function (event,address,amount,type) {
            if(type != self.walletType){
                $rootScope.$emit('Local/ShowErrorAlert', gettextCatalog.getString('The address type does not match, the address type must be')+': '+self.walletType+' '+gettextCatalog.getString('address'));
                return;
            }else {
                self._address = address;
                if(amount) self._amount = amount;
            }

        })


        //模态框点击后赋addr值
        $rootScope.$on('Local/setAddressVal', function(event,addr,type){
            var form = $scope.sendPaymentForm;
            if (!form || !form.address) // disappeared?
                return console.log('form.address has disappeared');
            form.address.$setViewValue(addr);
            form.address.$isValid = true;
            form.address.$render();
        });

        $scope.$on('$destroy', function() {
            transferQR();
        });


        self.errMessage = function (err) {
            if (typeof err === 'object') {
                err = JSON.stringify(err);
                eventBus.emit('nonfatal_error', "error object from sendMultiPayment: " + err, new Error());
            }
            else if (err.match(/device address/))
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
        self.transactionFee = function() {
            let Base64 = require('inWalletcore/base64Code');
            //console.log('self._note: ',$scope._note)
            if($scope._note)Base64.encode($scope._note).then(function (resolve,reject) {
                 self.tranFee = resolve ?  profileService.formatAmount(((resolve.length * 1.0 /1024) * constants.NRG_PEER_KBYTE + constants.BASE_NRG) * indexScope.nrgPrice, 'inve'):  profileService.formatAmount(constants.BASE_NRG * indexScope.nrgPrice, 'inve');
             });
            else self.tranFee =  profileService.formatAmount(constants.BASE_NRG * indexScope.nrgPrice, 'inve');
            setTimeout(function () {
                $scope.$apply();
            });
        }

        self.onClickWallet = function(){

        }
    });