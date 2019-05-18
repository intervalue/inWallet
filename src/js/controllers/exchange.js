'use strict';

var light = require('inWalletcore/light');
var _ = require('lodash');

angular.module('copayApp.controllers').controller('exchangeController',
    function($rootScope, $scope, $timeout, isCordova, $state, nodeWebkit, gettext, gettextCatalog, profileService, go, configService) {
        var self = this;
        self.showsecnav = 'exchange';
        self.error = false;
        self.exExchangeToId = true;
        self.homechange = true;
        var indexScope = $scope.index;
        self.movenew = ($scope.index.walletType.ETH.length == 0 && $scope.index.walletType.BTC.length == 0) ? true : false;
        /*  $scope.index.exExchangeToImg = $scope.index.walletType.ETH.length > 0 ? 'eth' : ($scope.index.walletType.BTC.length > 0 ? 'btc': '')*/
        // console.log('$scope.index.walletType: ',$scope.index.walletType)
        // console.log('$scope.index.walletType: ',$scope.index.walletType.ETH.length)
        // console.log('$scope.index.walletType: ',$scope.index.walletType.BTC.length)
        $scope.$watch('index.assetIndex', function(newVal, oldVal) {
            $scope.assetIndexSelectorValue = newVal;
            self.switchForms();
        });

        indexScope.getRelayInfo(function(){
            if (indexScope.relayLength == 0){
                self.setSendError(gettextCatalog.getString('Currently no relay online can not cross-chain transactions')); //TODO need tranlate;
            }
        });

        // indexScope.showAlert2 = {};
        // indexScope.showAlert2.msg = '当前无中继在线无法跨链交易'; //TODO need tranlate
        // indexScope.showAlert = true;
        // go.walletHome();

        self.switchForms = function() {
            self.bSendAll = false;
            if (self.send_multiple && $scope.index.arrBalances[$scope.index.assetIndex] && $scope.index.arrBalances[$scope.index.assetIndex].is_private)
                self.lockAmount = self.send_multiple = false;
            if ($scope.assetIndexSelectorValue < 0) {
                self.shownForm = 'data';
            }
            else {
                $scope.index.assetIndex = $scope.assetIndexSelectorValue;
                self.shownForm = 'payment';
            }
            $scope.mtab = $scope.index.arrBalances[$scope.index.assetIndex] && $scope.index.arrBalances[$scope.index.assetIndex].is_private && !self.lockAddress ? 2 : 1;
        }

        function myMulti(amount, multiNum){
            var length = amount.toString().split('.').length;
            var miLength = amount.toString().split('.').length > 1? amount.toString().split('.')[1].length: 0;
            var numLength = multiNum.toString().length;
            var sourceCurrencyValue = amount;
            var bigNumber = require("decimal.js");
            if (length > 1){
                if (amount.toString().split('.')[0] == 0)
                    sourceCurrencyValue = new bigNumber(amount.toString().split('.')[1]).toString();
                else
                    sourceCurrencyValue = amount.toString().replace('.', '');
            }
            for (var j=1; j<numLength - miLength; j++){
                sourceCurrencyValue += '0';
            }
            return sourceCurrencyValue;
        }
        /**
         * 点击交易页面move按钮开始执行
         * @param chat
         * @param deviceAddress
         * @returns {*}
         */
        self.submitPaymentmove = function() {
            var webHelper = require('inWalletcore/sendTransactionToNode');
            var fromAddress = $scope.index.exExchangeFromAddr;
            var toinAddress = $scope.index.exExchangeToAddr;

            /**
             * TODO 拿到对应节点的对应币种的地址， 费率什么的
             * @type {string}
             */
                //var nodeAddress = 'mkiytxYA6kxUC8iTnzLPgMfCphnz91zRfZ';

            var fromType = $scope.index.exExchangeFromImg.toUpperCase();
            var toType = $scope.index.exExchangeToImg.toUpperCase();
            /**
             * @type {number}
             * 获取对应币种的币种id
             */
            light.getCoinType(fromType, function(fromType1ERR, fromTypeObject) {
                light.getCoinType(toType, function (toType1ERR, toTypeObject) {
                    if (fromType1ERR !== null || toType1ERR !== null)
                        setError(fromType1ERR + toType1ERR);
                    /**
                     *
                     * @type {string}
                     */
                    var amount = $scope.index.exExchangeToStables;
                    var chooseNetWork = "http://" + indexScope.url + "/transfer";//self.chooseNetWork == undefined ? "http://relay.inve.one:9090/transfer" : self.chooseNetWork;
                    var fee = 0.00001;
                    var note;
                    var exchangeRate = 0.1;

                    profileService.setAndStoreFocusToWallet($scope.index.exTradeOutId, function () {
                        var fc = profileService.focusedClient;
                        if (fc.isPrivKeyEncrypted()) {
                            profileService.unlockFC(null, function (err) {
                                if (err)
                                    return self.setSendError(err.message);
                                delete self.current_payment_key;
                                return self.submitPaymentmove();
                            });
                            return;
                        } else {
                            //加载中
                            if (isCordova)
                                window.plugins.spinnerDialog.show(null, gettextCatalog.getString('Loading...'), true);
                            else{
                                $scope.index.progressing = true;
                                $scope.index.progressingmsg = 'Loading...';
                            }
                            var assetInfo = $scope.index.arrBalances[$scope.index.assetIndex];
                            var asset = 'base';
                            var current_payment_key = '' + asset + fromAddress + amount;
                            var merkle_proof = '';
                            self.current_payment_key = current_payment_key;
                            /**
                             * 判断是否有指纹锁，如果设置后，需要指纹解锁才能继续往下走
                             */
                            profileService.requestTouchid(function (err) {
                                if (err) {
                                    profileService.lockFC();
                                    self.error = err;
                                    $timeout(function () {
                                        delete self.current_payment_key;
                                        if (!$rootScope.$$phase) $scope.$apply();
                                    }, 1);
                                    return;
                                }
                                var importType = fc.credentials.mnemonicEncrypted ? 0 : 1;
                                var mnemonic = fc.credentials.mnemonic;
                                //var sourceCurrencyValue = new bigNumber(amount).times(new bigNumber(mateByte[fromType.toUpperCase()])).toString();
                                // var length = amount.toString().split('.').length;
                                // var miLength = amount.toString().split('.').length > 1? amount.toString().split('.')[1].length: 0;
                                // var numLength = mateByte[fromType.toUpperCase()].toString().length;
                                // var sourceCurrencyValue = amount;
                                // if (length > 1){
                                //     sourceCurrencyValue = amount.toString().replace('.', '');
                                // }
                                // for (var j=1; j<numLength - miLength; j++){
                                //     sourceCurrencyValue += '0';
                                // }
                                // console.log(sourceCurrencyValue);

                                var sourceCurrencyValue = myMulti(amount, mateByte[fromType.toUpperCase()]);
                                if (importType)
                                    mnemonic = fc.credentials.xPrivKey;
                                try{
                                    if (getHash[fromType.toUpperCase() + 'To']) {
                                        getHash[fromType.toUpperCase() + 'To'](fc.credentials.otherObject, mnemonic, fromAddress, indexScope.chooseNodeList[fromType.toUpperCase()], amount, fee, note, function (err, hash, obj) {
                                            if (err !== null){
                                                errAlert(gettextCatalog.getString("Not enough spendable"));
                                                return;
                                            }
                                            if (hash != undefined && hash != null && hash.toString().indexOf("not enough spendable funds from") > -1){
                                                errAlert(gettextCatalog.getString("Not enough spendable"));
                                                return;
                                            }
                                            try {
                                                var jsonObject = {
                                                    "messageStyle": 1,
                                                    "core": {
                                                        "sourceCurrency": fromType,
                                                        "desCurrency": toType,
                                                        "sourceAddress": fromAddress,
                                                        "desAddress": toinAddress,
                                                        "exchangeRate": $scope.index.exchangeRate,      //这里要实时获取才行
                                                        "sourceCurrencyValue": sourceCurrencyValue,
                                                        "transactionHash": hash.txid ? hash.txid : hash //交易的hash 在广播之前先发过去
                                                    }
                                                };
                                                jsonObject = JSON.parse(JSON.stringify(jsonObject));
                                                webHelper.post( chooseNetWork, jsonObject, {"Content-Type": "application/json;"},function (err2, result2) {
                                                    if (err2 !== null || result2 == null || result2 == undefined){
                                                        errAlert(gettextCatalog.getString('Relay node failure'));
                                                        return;
                                                    }
                                                    result2 = result2.body;
                                                    if (result2.code == 200) {
                                                        if (broadcaseHash[fromType.toUpperCase() + 'To']) {
                                                            broadcaseHash[fromType.toUpperCase() + 'To'](hash.hash?hash.hash: hash, fromType.toUpperCase() == 'BTC'?false: obj, function (err, result, address) {
                                                                //data.txid, Math.round(new Date().getTime()/1000), data.amount, data.fee, data.addressFrom, data.addressTo, 'pending', '', data.type, data.sType, data.eType, data.percent, data.txid, 0, 0, data.multiHash
                                                                //type 为0 就是转账 1 是交换  2是转移
                                                                if (err !== null){
                                                                    errAlert(err);
                                                                    return;
                                                                }
                                                                var jsonObject2 = {
                                                                    "messageStyle": 2,
                                                                    "core": {
                                                                        "orderNumber": result2.data.orderNumber,
                                                                        "transactionBlock": 123,
                                                                        "transactionHash": hash.txid ? hash.txid : hash

                                                                    }
                                                                };

                                                                jsonObject2 = JSON.parse(JSON.stringify(jsonObject2));
                                                                webHelper.post(chooseNetWork, jsonObject2, {"Content-Type": "application/json;"},function (err2, result3) {
                                                                    if (fromType.toUpperCase() == 'INVE') {
                                                                        light.updateMultiHash(hash, result2.data.orderNumber, 2, function (err, result) {
                                                                            indexScope.resetSendForm();
                                                                            successAlert();
                                                                            return;
                                                                        })
                                                                    } else {
                                                                        let sourceAmount = getAmountAndFee[fromType.toUpperCase()](sourceCurrencyValue);
                                                                        let amount_int = sourceAmount.amount_int;
                                                                        let amount_point = sourceAmount.amount_point;
                                                                        let fee_int = 0;
                                                                        let fee_point = 0;
                                                                        light.insertMultiTran({
                                                                            'txid': hash.txid?hash.txid: hash,
                                                                            'amount': amount_int,
                                                                            'fee': fee_int,
                                                                            'amount_point': amount_point,
                                                                            'fee_point': fee_point,
                                                                            'addressFrom': fromAddress,
                                                                            'addressTo': indexScope.chooseNodeList[fromType.toUpperCase()],
                                                                            'type': 1,
                                                                            'sType': fromTypeObject.id,
                                                                            'eType': toTypeObject.id,
                                                                            'multiHash': result2.data.orderNumber,
                                                                            percent: exchangeRate
                                                                        }, function () {
                                                                            if (err !== null) {
                                                                                console.log(err);
                                                                            } else {
                                                                                indexScope.resetSendForm();
                                                                                successAlert();
                                                                                return;
                                                                            }

                                                                        });
                                                                    }
                                                                });
                                                            });
                                                        }
                                                    } else {
                                                        if (result2 > 299 || result2.data == undefined){
                                                            errAlert(gettextCatalog.getString('Relay node failure'));
                                                            return
                                                        }
                                                        spinnerHide();
                                                        setError(result2.data.errorInformation);
                                                        $scope.$apply();
                                                        return;
                                                    }

                                                });
                                            } catch (err) {
                                                setError(err);
                                            }

                                        });
                                    }
                                } catch (e) {
                                    setError(e);
                                }
                            });
                        }
                    });
                });
            });
        };

        function setError(error){
            if(error == 'Insufficient relay balance'){
                errAlert(gettextCatalog.getString('Insufficient relay balance'));
            }else if(error == 'not enough spendable') {
                errAlert(gettextCatalog.getString('not enough spendable'));
            }else if (error == 'parameter value error'){
                errAlert(gettextCatalog.getString('parameter value error'));
            }else if (error == 'The transfer amount is too small, and the relay refuses to transfer'){
                errAlert(gettextCatalog.getString('The transfer amount is too small, and the relay refuses to transfer'))
            }
            spinnerHide();
            $scope.error = error;
        }

        self.setSendError = function(err) {
            var fc = profileService.focusedClient;
            var prefix =
                fc.credentials.m > 1 ? gettextCatalog.getString('Could not create payment proposal') : gettextCatalog.getString('Could not send payment');

            self.error = prefix + ": " + err;
            console.log(self.error);

            $timeout(function() {
                if(!$rootScope.$$phase) $scope.$apply();
            }, 1);
        };

        self.resetError = function() {
            self.error = self.success = null;
        };


        // var nodeAddress = {
        //     'BTC': 'mit4nmVTHnqfpZhmv2NbUpCKmjhjWVi2eB',
        //     'ETH': '0xf72848fbe3a28358a197b8ecb4dce6e311b5d5dc',
        //     'INVE': 'RZE63OCLF4SWJRUEYW7GCX5ZTQXH53JC'
        // };

        var btcrpc = require('inWalletcore/HDWallet/btc_rpcHelper');
        var ethrpc = require('inWalletcore/HDWallet/eth_rpchelper');
        var ethHelper = require('inWalletcore/HDWallet/eth_helper');
        /**
         * 获取交易
         * @type {{BTCTo: BTCTo}}
         */
        var getHash = {
            "BTCTo": function(otherObject, mnemonic, from_address, toAddress, amount, fee, note, callback, getHash){
                if (getHash == undefined)
                    getHash = true;
                btcrpc.sendTransaction(mnemonic, toAddress, amount, fee, function(err, hash, address){
                    callback(err, hash, address);
                }, false, 0, otherObject.importType, otherObject.segwit, otherObject.network, getHash);
            },
            "INVETo" : function (object, mnemonic, from_address, to_address,amount,fee,note,cb, getHash) {
                if (getHash == undefined)
                    getHash = true;
                let fc = profileService.focusedClient;
                let opts = {
                    shared_address: from_address ? from_address: '',
                    asset: 'base',
                    isHot: false,
                    xPrivKey: fc.credentials.xPrivKey,
                    sendType : 1,
                    to_address : to_address,
                    amount : Number(amount),
                    fee : fee,
                    note : note ? note: '',
                    getHash : getHash,
                    walletId : fc.credentials.walletId
                }
                fc.sendMultiPayment(opts, function (hash,obj) {
                    cb(null, hash, obj);
                });

            },
            "ETHTo": function (otherObject, mnemonic, from_address, toAddress, amount, fee, note, callback, getHash){
                var bigNumber = require("decimal.js");
                amount = myMulti(amount, 1000000000000000000);
                //amount = new bigNumber(amount).times(1000000000000000000).toString();
                if (getHash == undefined)
                    getHash = true;
                ethrpc.sendtranstion(mnemonic, toAddress, amount, 0, otherObject.importType, getHash, callback);
            }
        }

        /**
         * 广播交易
         * @type {{BTCTo: BTCTo}}
         */
        var broadcaseHash = {
            "BTCTo": function(hash, highfee, callback){
                btcrpc.sendrawtransaction(hash, highfee, callback);
            },
            "INVETo": function (hash, obj, callback) {
                let fc = profileService.focusedClient;
                obj.signature = hash;
                obj.amount = obj.amount;
                obj.getHash = false;
                obj.goSendTran = true;
                fc.sendMultiPayment(obj, callback);
            },
            "ETHTo": function (hash, obj, callback){
                ethHelper.sendRawTranstion(obj, callback);
            }
        }

        var mateByte = {
            "INVE" : 1000000000000000000,
            "BTC"  : 100000000,
            "ETH"  : 1000000000000000000
        }

        var zero = '000000000000000000';
        var getAmountAndFee = {
            "BTC": function(amount){
                let amount_int = amount;
                let amount_point = 0;
                return {'amount_int': amount_int, 'amount_point': amount_point};
            },
            "ETH": function (amount){
                var bigNumber = require("bignumber.js");
                amount = new bigNumber(amount).dividedBy(1000000000000000000).toString();
                let amount_int = (amount + "").split('.')[0];
                let amountP = (amount + "").split('.')[1] ? (amount + "").split('.')[1] : '';
                let amount_point = amountP+zero.substring(-1,zero.length-amountP.length);
                return {'amount_int': amount_int, 'amount_point': amount_point};
            }
        }

        self.getHandling = function(type){
            var bigNumber = require("bignumber.js");
            let from,to;
            if (type == 0){
                from = indexScope.exExchangeFromImg.toString().toUpperCase();
                to =  indexScope.exExchangeToImg.toString().toUpperCase();
            } else {
                from = indexScope.exTradeOutImg.toString().toUpperCase();
                to =  indexScope.exTradeInImg.toString().toUpperCase();
            }
            for (let key in indexScope.relayObject){
                let data = indexScope.relayObject[key];
                let rate = 1;
                if (from != to){
                    if (data.exchangeRatios[from + ':' + to] != undefined || data.exchangeRatios[to + ':' + from] != undefined)
                        rate = data.exchangeRatios[from + ':' + to] == undefined? new bigNumber(1).dividedBy(data.exchangeRatios[to + ':' + from]).toString():  data.exchangeRatios[from + ':' + to].toString();
                }
                data.rate = Number(rate).toFixed(6);
                data.to = to;
            }
        }

        /**
         * 点击交易页面transfer按钮后开始执行
         * @param chat
         * @param deviceAddress
         * @returns {*}
         */
        self.submitPayment = function() {
            var webHelper = require('inWalletcore/sendTransactionToNode');
            var bigNumber = require("bignumber.js");

            var fromAddress = $scope.index.exTradeOutAddr;     //发起方的地址
            var fromType = $scope.index.exTradeOutImg.toUpperCase();         //发起方的type
            var toAddress = $scope.index.exTradeInAddr;        //发起方的接受地址
            var toType = $scope.index.exTradeInImg.toUpperCase();            //发起方的接受type
            var thirdToAddress = $scope.index.toinAddress;          //接收方的收款地址
            var thirdFromAddress = $scope.index.tooutAddress;       //接收方的发送地址
            var value = $scope.index.exTradeOutStable;         //发送方交换的数量

            var amount2 = $scope.index.exTradeInStable;
            /**
             * TODO 拿到对应节点的对应币种的地址， 费率什么的
             * @type {string}
             */
            /**
             * @type {number}
             * 获取对应币种的币种id
             */
            light.getCoinType(fromType, function(fromType1ERR, fromTypeObject) {
                light.getCoinType(toType, function (toType1ERR, toTypeObject) {
                    if (fromType1ERR !== null || toType1ERR !== null)
                        setError(fromType1ERR + toType1ERR);
                    /**
                     *
                     * @type {string}
                     */
                    var amount = $scope.index.exExchangeToStables;
                    var chooseNetWork = "http://" + indexScope.url + "/exchange";//var chooseNetWork = self.chooseNetWork == undefined ? "http://relay.inve.one:9090/exchange" : self.chooseNetWork;
                    var fee = 0.00001;
                    var note;
                    var exchangeRate = 0.1;

                    profileService.setAndStoreFocusToWallet($scope.index.exTradeOutId, function () {
                        var fc = profileService.focusedClient;
                        if (fc.isPrivKeyEncrypted()) {
                            profileService.unlockFC(null, function (err) {
                                if (err)
                                    return self.setSendError(err.message);
                                delete self.current_payment_key;
                                return self.submitPayment();
                            });
                            return;
                        } else {
                            //加载中
                            if (isCordova)
                                window.plugins.spinnerDialog.show(null, gettextCatalog.getString('Loading...'), true);
                            else{
                                $scope.index.progressing = true;
                                $scope.index.progressingmsg = 'Loading...';
                            }
                            var assetInfo = $scope.index.arrBalances[$scope.index.assetIndex];
                            var asset = 'base';
                            var current_payment_key = '' + asset + fromAddress + amount;
                            var merkle_proof = '';
                            self.current_payment_key = current_payment_key;
                            /**
                             * 判断是否有指纹锁，如果设置后，需要指纹解锁才能继续往下走
                             */
                            profileService.requestTouchid(function (err) {
                                if (err) {
                                    profileService.lockFC();
                                    self.error = err;
                                    $timeout(function () {
                                        delete self.current_payment_key;
                                        if (!$rootScope.$$phase) $scope.$apply();
                                    }, 1);
                                    return;
                                }
                                var importType = fc.credentials.mnemonicEncrypted ? 0 : 1;
                                var mnemonic = fc.credentials.mnemonic;
                                var sourceCurrencyValue = new bigNumber(value).times(mateByte[fromType.toUpperCase()]).toString();
                                if (importType)
                                    mnemonic = fc.credentials.xPrivKey;
                                try{
                                    if (getHash[fromType.toUpperCase() + 'To']) {
                                        getHash[fromType.toUpperCase() + 'To'](fc.credentials.otherObject, mnemonic, fromAddress, indexScope.chooseNodeList[fromType.toUpperCase()], value, fee, note, function (err, hash, obj) {
                                            if (err){
                                                errAlert(gettextCatalog.getString("Not enough spendable"));
                                                return;
                                            }
                                            try {
                                                if (hash != undefined && hash != null && hash.toString().indexOf("not enough spendable funds from") > -1){
                                                    errAlert(gettextCatalog.getString("Not enough spendable"));
                                                    return;
                                                }
                                                let mateValue = mateByte[toType.toUpperCase()];
                                                //var ff = $scope.index[fromType.toUpperCase() + 'TO' + toType.toUpperCase()]
                                                var num = new bigNumber(Number(new bigNumber(amount2))).toString();
                                                var toValue = myMulti(num, mateValue);
                                                //var toValue = .times(mateValue).toString();//parseInt(new bigNumber(Number(new bigNumber(value).times(ff).toString()).toFixed(12)).times(mateValue).toString());
                                                var jsonObject = {
                                                    "messageStyle": 1,
                                                    "core": {
                                                        "aFromCurrency": toType,
                                                        "aToCurrency": fromType,
                                                        "aFromAddress": toAddress,
                                                        "aToAddress": fromAddress,
                                                        "bFromAddress": thirdToAddress,      //这里要实时获取才行
                                                        "bToAddress": thirdFromAddress,
                                                        "aFromValue": toValue,
                                                        "aToValue": sourceCurrencyValue,
                                                        "transactionHash": hash.txid ? hash.txid : hash //交易的hash 在广播之前先发过去
                                                    }
                                                };
                                                jsonObject = JSON.parse(JSON.stringify(jsonObject));
                                                webHelper.post( chooseNetWork, jsonObject, {"Content-Type": "application/json;"},function (err2, result2) {
                                                    if (err2 !== null || result2 == null || result2 == undefined){
                                                        errAlert(gettextCatalog.getString('Relay node failure'));
                                                        return;
                                                    }
                                                    result2 = result2.body;
                                                    if (result2.code == 200) {
                                                        if (broadcaseHash[fromType.toUpperCase() + 'To']) {
                                                            broadcaseHash[fromType.toUpperCase() + 'To'](hash.hash?hash.hash: hash, fromType.toUpperCase() == 'BTC'?false: obj, function (err, result, address) {
                                                                //data.txid, Math.round(new Date().getTime()/1000), data.amount, data.fee, data.addressFrom, data.addressTo, 'pending', '', data.type, data.sType, data.eType, data.percent, data.txid, 0, 0, data.multiHash
                                                                //type 为0 就是转账 1 是交换  2是转移
                                                                var jsonObject2 = {
                                                                    "messageStyle": 2,
                                                                    "core": {
                                                                        "orderNumber": result2.data.orderNumber,
                                                                        "transactionBlock": 123,
                                                                        "transactionHash": hash.txid ? hash.txid : hash

                                                                    }
                                                                };

                                                                jsonObject2 = JSON.parse(JSON.stringify(jsonObject2));
                                                                webHelper.post(chooseNetWork, jsonObject2, {"Content-Type": "application/json;"},function (err2, result3) {
                                                                    if (fromType.toUpperCase() == 'INVE') {
                                                                        indexScope.resetSendForm();
                                                                        light.updateMultiHash(hash, result2.data.orderNumber, 2, function (err, result) {
                                                                            successAlert();
                                                                            return;
                                                                        })
                                                                    } else {
                                                                        let sourceAmount = getAmountAndFee[fromType.toUpperCase()](sourceCurrencyValue);
                                                                        let amount_int = sourceAmount.amount_int;
                                                                        let amount_point = sourceAmount.amount_point;
                                                                        let fee_int = 0;
                                                                        let fee_point = 0;
                                                                        light.insertMultiTran({
                                                                            'txid': hash.txid?hash.txid: hash,
                                                                            'amount': amount_int,
                                                                            'fee': fee_int,
                                                                            'amount_point': amount_point,
                                                                            'fee_point': fee_point,
                                                                            'addressFrom': fromAddress,
                                                                            'addressTo': indexScope.chooseNodeList[fromType.toUpperCase()],
                                                                            'type': 2,
                                                                            'sType': fromTypeObject.id,
                                                                            'eType': toTypeObject.id,
                                                                            'multiHash': result2.data.orderNumber,
                                                                            percent: exchangeRate
                                                                        }, function () {
                                                                            if (err !== null) {
                                                                                console.log(err);
                                                                            } else {
                                                                                indexScope.resetSendForm();
                                                                                successAlert();
                                                                                return;
                                                                            }

                                                                        });
                                                                    }
                                                                });
                                                            });
                                                        }
                                                    } else {
                                                        errAlert(result2.data.errorInformation);
                                                        return;
                                                    }

                                                });
                                            } catch (err) {
                                                setError(err);
                                                return;
                                            }

                                        });
                                    }
                                } catch (e) {
                                    setError(e);
                                    return;
                                }
                            });
                        }
                    });
                });
            });
        };

        function errAlert(msg){
            spinnerHide();
            indexScope.showAlert2 = {};
            indexScope.showAlert2.msg = msg;
            indexScope.showAlert = true;
            $scope.$apply();
            return;
        }

        function successAlert(){
            spinnerHide();
            indexScope.showAlert2 = {};
            indexScope.showAlert2.msg = 'Success';
            indexScope.showAlert = true;
            go.walletHome();
            return;
        }

        function spinnerHide(){
            if (isCordova)
                window.plugins.spinnerDialog.hide();
            else
                $scope.index.progressing = false;
        }

        //模态框点击后赋addr值
        $rootScope.$on('Local/sethomeAddressVal1', function(event,addr,type){
            $scope.index.exTradeToInImg = type.toLowerCase();
            $scope.index.exPlaceholderToinAddr = $scope.index.exTradeToInImg;
            var form = $scope.sendTransferForm;
            if (!form || !form.toinAddress) // disappeared?
                return console.log('form.address has disappeared');
            form.toinAddress.$setViewValue(addr);
            form.toinAddress.$isValid = true;
            form.toinAddress.$render();
        });
        //模态框点击后赋addr值
        $rootScope.$on('Local/sethomeAddressVal2', function(event,addr,type){
            $scope.index.exTradeToOutImg = type.toLowerCase();
            $scope.index.exPlaceholderTooutAddr = $scope.index.exTradeToOutImg;
            var form = $scope.sendTransferForm;
            if (!form || !form.tooutAddress) // disappeared?
                return console.log('form.address has disappeared');
            form.tooutAddress.$setViewValue(addr);
            form.tooutAddress.$isValid = true;
            form.tooutAddress.$render();
        });

        /**
         * 重置form
         */
        self.resetForm = function() {
            //var self = self;
            self.resetError();
            delete self.binding;

            self.lockAsset = false;
            self.lockAddress = false;
            self.lockAmount = false;
            self.hideAdvSend = true;
            self.send_multiple = false;
            self.current_payment_key = '';
            self.chat = false;
            self.chatAddress = false;
            self.exTradeOutId = '';
            $scope.index.exTradeOutStable = '';
            self.deviceAddress = '';
            $scope.currentSpendUnconfirmed = configService.getSync().wallet.spendUnconfirmed;

            self._amount = self._address = null;
            self.bSendAll = false;

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
                self.switchForms();
                /*$timeout(function() {
                    $rootScope.$apply();
                }, 1);*/
                $timeout(function () {
                    if(!$rootScope.$$phase) $rootScope.$apply();
                },1);

            });
        };
    });