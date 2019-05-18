'use strict';

var constants = require('inWalletcore/constants.js');
var eventBus = require('inWalletcore/event_bus.js');
var breadcrumbs = require('inWalletcore/breadcrumbs.js');
var ValidationUtils = require('inWalletcore/validation_utils.js');
var light = require('inWalletcore/light');
var _ = require('lodash');

angular.module('copayApp.controllers')
    .controller('walletHomeController', function($http, $scope, $rootScope, $timeout, $window, $state, $stateParams, $filter, $modal, $log, notification, isCordova, profileService, lodash, configService, storageService, gettext, gettextCatalog, nodeWebkit, addressService, confirmDialog, go) {
        var self = this;
        var home = this;
        self.infinite_isCmp = false;
        self.showselectwt = false;
        var conf = require('inWalletcore/conf.js');
        //todo delete
        // var chatStorage = require('inWalletcore/chat_storage.js');
        this.protocol = conf.program;
        $rootScope.hideMenuBar = false;
        $rootScope.wpInputFocused = false;
        var config = configService.getSync();
        var configWallet = config.wallet;
        var indexScope = $scope.index;
        $scope.currentSpendUnconfirmed = configWallet.spendUnconfirmed;
        var network = require('inWalletcore/network.js');

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
        self.chatAddress = false;
        self.deviceAddress = '';
        $scope.index.tab = 'walletHome'; // for some reason, current tab state is tracked in index and survives re-instatiations of walletHome.js
        self.selectid = 1;
        self.selectidmove = 1;
        self.moveState = '';
        self.getEye = function() {
            storageService.getEye(function (res) {
                if(!res) return;
                $scope.index.defaultShowQian = res.eye;
            })
        }

        self.getEye();

        var disablePaymentUriListener = $rootScope.$on('paymentUri', function(event, uri) {
            $timeout(function() {
                $rootScope.$emit('Local/SetTab', 'send');
                self.setForm(uri);
            }, 100);
        });

        var disableAddrListener = $rootScope.$on('Local/NeedNewAddress', function() {
            self.setAddress(true);
        });

        var disableResumeListener = $rootScope.$on('Local/Resume', function() {
            // This is needed then the apps go to sleep
            // looks like it already works ok without rebinding touch events after every resume
            //self.bindTouchDown();
        });

        self.resetError = function() {
            self.error = self.success = null;
        };

        /**
         * 切换标签后，初始化交易信息
         * @type {*|(function())|angular.noop}
         */
        var disableTabListener = $rootScope.$on('Local/TabChanged', function(e, tab) {
            // This will slow down switch, do not add things here!
            //console.log("tab changed " + tab);
            /*self.resetForm();*/
            switch (tab) {
                case 'receive':
                    // just to be sure we have an address
                    self.setAddress();
                    break;
                case 'history':
                    $rootScope.$emit('Local/NeedFreshHistory');
                    break;
                case 'send':
                    self.resetError();
            };
        });

        var disableOngoingProcessListener = $rootScope.$on('Addon/OngoingProcess', function(e, name) {
            self.setOngoingProcess(name);
        });

        function onNewWalletAddress(new_address) {
            console.log("==== NEW ADDRESSS " + new_address);
            self.addr = {};
            self.setAddress();
        }

        eventBus.on("new_wallet_address", onNewWalletAddress);


        this.openTxpModal = function(tx, copayers) {
            // deleted, maybe restore from copay sometime later
            // actually, nothing to display here that was not already shown
        };

        this.setAddress = function(forceNew) {
            self.addrError = null;
            var fc = profileService.focusedClient;
            if (!fc)
                return;

            // Address already set?
            if (!forceNew && self.addr[fc.credentials.walletId])
                return;

            if (indexScope.shared_address && forceNew)
                throw Error('attempt to generate for shared address');

            if (fc.isSingleAddress && forceNew)
                throw Error('attempt to generate for single address wallets');

            self.generatingAddress = true;
            $timeout(function() {
                addressService.getAddress(fc.credentials.walletId, forceNew, function(err, addr) {
                    self.generatingAddress = false;

                    if (err) {
                        self.addrError = err;
                    }
                    else {
                        if (addr)
                            self.addr[fc.credentials.walletId] = addr;
                    }

                    $timeout(function() {
                        if(!$rootScope.$$phase) $scope.$apply();
                    },1);
                });
            });
        };

        /**
         * 复制地址
         * @param addr
         */
        this.copyAddress = function(addr,$event) {
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

        this.shareAddress = function(addr) {
            if (isCordova) {
                if (isMobile.Android() || isMobile.Windows()) {
                    window.ignoreMobilePause = true;
                }
                window.plugins.socialsharing.shareWithOptions({message: "My inWallet address " + self.protocol +  ':' + addr, subject: "My inWallet address"/*, url: self.protocol +  ':' + addr*/}, function(){}, function(){});
            }
        };



        var disableClaimTextcoinListener = $rootScope.$on('claimTextcoin', function(event, mnemonic) {
            breadcrumbs.add("received claimTextcoin event with mnemonic: " + mnemonic.substr(0, 10) + "...");
            var addr = self.addr[profileService.focusedClient.credentials.walletId];
            if (addr) {
                claimTextCoin(mnemonic, addr);
            } else {
                addressService.getAddress(profileService.focusedClient.credentials.walletId, false, function(err, addr) {
                    if (addr) {
                        self.addr[profileService.focusedClient.credentials.walletId] = addr;
                        claimTextCoin(mnemonic, addr);
                    }

                    $timeout(function() {
                        if(!$rootScope.$$phase) $scope.$apply();
                    },1);
                });
            }
        });

        // Send

        var unwatchSpendUnconfirmed = $scope.$watch('currentSpendUnconfirmed', function(newVal, oldVal) {
            if (newVal == oldVal) return;
            $scope.currentSpendUnconfirmed = newVal;
        });

        this.bindTouchDown = function(tries) {
            var self = this;
            tries = tries || 0;
            if (tries > 5) return;
            var e = document.getElementById('menu-walletHome');
            if (!e) return $timeout(function() {
                self.bindTouchDown(++tries);
            }, 500);
gettextCatalog
            // on touchdown elements
            $log.debug('Binding touchstart elements...');
            ['hamburger', 'menu-walletHome', 'menu-send', 'menu-receive', 'menu-history'].forEach(function(id) {
                var e = document.getElementById(id);
                if (e) e.addEventListener('touchstart', function() {
                    try {
                        event.preventDefault();
                    }
                    catch (e) {};
                    $timeout(function(){
                        angular.element(e).triggerHandler('click');
                    });
                }, true);
            });
        }

        this.hideMenuBar = lodash.debounce(function(hide) {
            if (hide) {
                $rootScope.hideMenuBar = true;
                this.bindTouchDown();
            }
            else {
                $rootScope.hideMenuBar = false;
            }
            $timeout(function(){
                if(!$rootScope.$$phase) $rootScope.$apply();
            },1);
        }, 100);

        this.formFocus = function(what) {
            if (isCordova && !this.isWindowsPhoneApp) {
                this.hideMenuBar(what);
            }
            if (!this.isWindowsPhoneApp) return

            if (!what) {
                this.hideAddress = false;
                this.hideAmount = false;

            }
            else {
                if (what == 'amount') {
                    this.hideAddress = true;
                }
                else if (what == 'msg') {
                    this.hideAddress = true;
                    this.hideAmount = true;
                }
            }
            $timeout(function() {
                if(!$rootScope.$$phase) $rootScope.$apply();
            }, 1);
        };

        this.setSendPaymentFormInputs = function() {
            /**
             * Setting the two related amounts as properties prevents an infinite
             * recursion for watches while preserving the original angular updates
             *
             */
            Object.defineProperty($scope,
                "_amount", {
                    get: function() {
                        return $scope.__amount;
                    },
                    set: function(newValue) {
                        $scope.__amount = newValue;
                        self.resetError();
                    },
                    enumerable: true,
                    configurable: true
                });

            Object.defineProperty($scope,
                "_address", {
                    get: function() {
                        return $scope.__address;
                    },
                    set: function(newValue) {
                        $scope.__address = self.onAddressChange(newValue);
                    },
                    enumerable: true,
                    configurable: true
                });

            var fc = profileService.focusedClient;
            // ToDo: use a credential's (or fc's) function for this
            this.hideNote = true;
        };



        this.setOngoingProcess = function(name) {
            var self = this;
            self.blockUx = !!name;

            if (isCordova) {
                if (name) {
                    window.plugins.spinnerDialog.hide();
                    window.plugins.spinnerDialog.show(null, name + '...', true);
                }
                else {
                    window.plugins.spinnerDialog.hide();
                }
            }
            else {
                self.onGoingProcess = name;
                $timeout(function() {
                    if(!$rootScope.$$phase) $rootScope.$apply();
                },1);
            };
        };

        var haveIn2 = false;
         self.submitTrans = function(item){
            if (haveIn2){
                return;
            }
            haveIn2 = true;
            var webHelper = require('inWalletcore/sendTransactionToNode');
            var bigNumber = require("decimal.js");

            var amount = $scope.index.exExchangeToStables;
            var chooseNetWork = self.chooseNetWork == undefined ? "http://" + item.url +"/exchange" : self.chooseNetWork;
            var fee = 0.00001;
            var note;
            var exchangeRate = 0.1;

            var backResult = item.result;

            if (backResult.status == -1){
                haveIn2 = false;
                indexScope.showAlert2 = {};
                indexScope.showAlert2.msg = 'wait for other pay check';
                indexScope.showAlert = true;
                return;
            } else if (backResult.status == 1 && backResult.dtoTransactionHash == '') {
                var fromType = backResult.desCurrency;
                var fromAddress = backResult.oppositeSourceAddress;
                var toAddress = backResult.desAddress;
                var value = new bigNumber(backResult.desCurrencyValue).dividedBy(mateByte[fromType.toUpperCase()]).toString();

                profileService.setAndStoreFocusToWallet(item.walletId, function () {
                    var fc = profileService.focusedClient;
                    if (fc.isPrivKeyEncrypted()) {
                        indexScope.passMassage = true;
                        indexScope.orderNumber = backResult.orderNumber;
                        indexScope.sendAddress = fromAddress;
                        indexScope.receiveAddress = toAddress;
                        indexScope.value = value + fromType;
                        profileService.unlockFC(null, function (err) {
                            haveIn2 = false;
                            indexScope.passMassage = false;
                            if (err)
                                return self.setSendError(err.message);
                            delete self.current_payment_key;
                            return self.submitTrans(item);
                        });
                        haveIn2 = false;
                        return;
                    } else {
                        var asset = 'base';
                        var current_payment_key = '' + asset + fromAddress + amount;
                        self.current_payment_key = current_payment_key;
                        /**
                         * 判断是否有指纹锁，如果设置后，需要指纹解锁才能继续往下走
                         */
                        profileService.requestTouchid(function (err) {
                            if (err) {
                                haveIn2 = false;
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
                            try {
                                light.getCoinType(fromType, function (fromType1ERR, fromTypeObject) {
                                    if (getHash[fromType.toUpperCase() + 'To']) {
                                        getHash[fromType.toUpperCase() + 'To'](fc.credentials.otherObject, mnemonic, fromAddress, toAddress, value, fee, note, function (err, hash, obj) {
                                            if (err != null){
                                                haveIn2 = false;
                                                setError(err);
                                                indexScope.showAlert2 = {};
                                                indexScope.showAlert2.msg = err;
                                                indexScope.showAlert = true;
                                                $scope.$apply();
                                                return;
                                            }
                                            if (hash != undefined && hash != null && hash.toString().indexOf('not enough spendable funds from')> -1){
                                                indexScope.showAlert2 = {};
                                                indexScope.showAlert2.msg = gettextCatalog.getString("Not enough spendable");
                                                indexScope.showAlert = true;
                                                $scope.$apply();
                                                return;
                                            }
                                            try {
                                                var jsonObject = {
                                                    "messageStyle": 4,
                                                    "core": {
                                                        "orderNumber": backResult.orderNumber,
                                                        "transactionBlock": "123",
                                                        "transactionHash": hash.txid ? hash.txid : hash //交易的hash 在广播之前先发过去
                                                    }
                                                };
                                                jsonObject = JSON.parse(JSON.stringify(jsonObject));
                                                webHelper.post(chooseNetWork, jsonObject, {"Content-Type": "application/json;"}, function (err2, result2) {
                                                    if (err2 !== null || result2 == null || result2 == undefined){
                                                        indexScope.showAlert2 = {};
                                                        indexScope.showAlert2.msg = '中继节点故障';
                                                        indexScope.showAlert = true;
                                                        $scope.$apply();
                                                        return;
                                                    }
                                                    result2 = result2.body;
                                                    if (err2 !== null) {
                                                        haveIn2 = false;
                                                        setError(err2);
                                                        indexScope.showAlert2 = {};
                                                        indexScope.showAlert2.msg = err2;
                                                        indexScope.showAlert = true;
                                                        $scope.$apply();
                                                        return;
                                                    }
                                                    if (result2.code == 200 || result2.code == 204) {
                                                        if (broadcaseHash[fromType.toUpperCase() + 'To']) {
                                                            broadcaseHash[fromType.toUpperCase() + 'To'](hash.hash ? hash.hash : hash, fromType.toUpperCase() == 'BTC' ? false : obj, function (err, result, address) {
                                                                haveIn2 = false;
                                                                if (fromType.toUpperCase() == 'INVE') {
                                                                    item.result.dtoTransactionHash = hash.txid ? hash.txid : hash;
                                                                    light.updateMultiHash(hash, backResult.orderNumber, 2, function (err, result) {
                                                                        indexScope.showAlert2 = {};
                                                                        indexScope.showAlert2.msg = 'Success';
                                                                        indexScope.showAlert = true;
                                                                        $scope.$apply();
                                                                    })
                                                                } else {
                                                                    item.result.dtoTransactionHash = hash.txid ? hash.txid : hash;
                                                                    let sourceAmount = getAmountAndFee[fromType.toUpperCase()](sourceCurrencyValue);
                                                                    let amount_int = sourceAmount.amount_int;
                                                                    let amount_point = sourceAmount.amount_point;
                                                                    let fee_int = 0;
                                                                    let fee_point = 0;
                                                                    light.insertMultiTran({
                                                                        'txid': hash.txid ? hash.txid : hash,
                                                                        'amount': amount_int,
                                                                        'fee': fee_int,
                                                                        'amount_point': amount_point,
                                                                        'fee_point': fee_point,
                                                                        'addressFrom': fromAddress,
                                                                        'addressTo': toAddress,
                                                                        'type': 2,
                                                                        'sType': fromTypeObject.id,
                                                                        'eType': fromTypeObject.id,
                                                                        'multiHash': backResult.orderNumber,
                                                                        'percent': exchangeRate
                                                                    }, function () {
                                                                        if (err !== null) {
                                                                            console.log(err);
                                                                        } else {
                                                                            indexScope.showAlert2 = {};
                                                                            indexScope.showAlert2.msg = 'Success';
                                                                            indexScope.showAlert = true;
                                                                            $scope.$apply();
                                                                        }

                                                                    });
                                                                }
                                                                haveIn2 = false;
                                                            });
                                                        }
                                                    } else {
                                                        setError(result2.data.errorInformation);
                                                        $scope.$apply();
                                                        haveIn2 = false;
                                                    }

                                                });
                                            } catch (err) {
                                                console.log(err);
                                                haveIn2 = false;
                                            }

                                        });
                                    }
                                });
                            } catch (e) {
                                console.log(e);
                                setError(e);
                                haveIn2 = false;
                            }

                        });
                    }
                });
            } else if (backResult.status == 1 && backResult.dtoTransactionHash != ''){
                indexScope.showAlert2 = {};
                indexScope.showAlert2.msg = '等待中继确认您的交易';
                indexScope.showAlert = true;
                haveIn2 = false;
            } else if (backResult.status == 2){
                indexScope.showAlert2 = {};
                indexScope.showAlert2.msg = '等待中继转账';
                indexScope.showAlert = true;
                haveIn2 = false;
            }
        }

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
                var bigNumber = require("bignumber.js");
                amount = new bigNumber(amount).times(1000000000000000000).toString();
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

        self.homeconlist = [];
        var haveSet = [];
        var haveIn = false;
        eventBus.on('newMultiTrans', function(check){
            try {
                if (haveIn) {
                    return;
                }
                haveIn = true;
                var webHelper = require('inWalletcore/sendTransactionToNode');
                var chooseNetWork = "http://" + check.url + '/exchange';//self.chooseNetWork == undefined ? "http://relay.inve.one:9090/exchange" : self.chooseNetWork;
                //self.homeconlist = light.getCheck();
                // length = self.homeconlist.length;
                //for (let i=0; i<length; i++){
                if (check == undefined || check === null) {
                    haveIn = false;
                    return;
                }

                var updateIndex = _.indexOf(haveSet, check.result.orderNumber);
                if (updateIndex > -1){
                    self.homeconlist[updateIndex].result.status = check.result.status;
                }
                if (check.result.status == 1 && check.result.dtoTransactionHash == '') {
                    var jsonObject = {
                        "messageStyle": 3,
                        "core": {
                            "orderNumber": check.result.orderNumber
                        }
                    };

                    jsonObject = JSON.parse(JSON.stringify(jsonObject));
                    webHelper.post(chooseNetWork, jsonObject, {"Content-Type": "application/json;"}, function (err2, result2) {
                        check.show = 1;
                    });

                    var index = _.indexOf(haveSet, check.result.orderNumber);
                    if (index < 0) {
                        haveSet.push(check.result.orderNumber);
                        self.homeconlist.push(check);
                    }
                } else if (check.result.status != 3) {
                    var a = _.indexOf(haveSet, check.result.orderNumber);
                    if (a < 0) {
                        check.show = 1;
                        haveSet.push(check.result.orderNumber);
                        self.homeconlist.push(check);
                    }
                }
                haveIn = false;
            }catch (e) {
                haveIn = false;
            }
            //}
        });





        function setError(error){
            console.log("send error:", error);
            $scope.error = error;
        }

        this.submitData = function() {
            var objectHash = require('inWalletcore/object_hash.js');
            var fc = profileService.focusedClient;
            var value = {};
            var app;
            switch ($scope.assetIndexSelectorValue) {
                case -1:
                    app = "data_feed";
                    break;
                case -2:
                    app = "attestation";
                    break;
                case -3:
                    app = "profile";
                    break;
                case -4:
                    app = "data";
                    break;
                default:
                    throw new Error("invalid asset selected");
                    break;
            }
            var errored = false;
            $scope.home.feedvaluespairs.forEach(function(pair) {
                if (value[pair.name]) {
                    self.setSendError("All keys must be unique");
                    errored = true;
                    return;
                }
                value[pair.name] = pair.value;
            });
            if (errored) return;
            if (Object.keys(value)
                .length === 0) {
                self.setSendError("Provide at least one value");
                return;
            }

            if (fc.isPrivKeyEncrypted()) {
                profileService.unlockFC(null, function(err) {
                    if (err)
                        return self.setSendError(err.message);
                    return self.submitData();
                });
                return;
            }

            profileService.requestTouchid(function(err) {
                if (err) {
                    profileService.lockFC();
                    indexScope.setOngoingProcess(gettext('sending'), false);
                    self.error = err;
                    $timeout(function() {
                        if(!$rootScope.$$phase) $scope.$apply();
                    }, 1);
                    return;
                }

                if (app == "attestation") {
                    value = {
                        address: $scope.home.attested_address,
                        profile: value
                    };
                }
                var objMessage = {
                    app: app,
                    payload_location: "inline",
                    payload_hash: objectHash.getBase64Hash(value),
                    payload: value
                };
                var arrSigningDeviceAddresses = []; // empty list means that all signatures are required (such as 2-of-2)
                if (fc.credentials.m < fc.credentials.n)
                    indexScope.copayers.forEach(function(copayer) {
                        if (copayer.me || copayer.signs)
                            arrSigningDeviceAddresses.push(copayer.device_address);
                    });
                else if (indexScope.shared_address)
                    arrSigningDeviceAddresses = indexScope.copayers.map(function(copayer) {
                        return copayer.device_address;
                    });

                indexScope.setOngoingProcess(gettext('sending'), true);

                fc.sendMultiPayment({
                    arrSigningDeviceAddresses: arrSigningDeviceAddresses,
                    shared_address: indexScope.shared_address,
                    messages: [objMessage]
                }, function(err) { // can take long if multisig
                    indexScope.setOngoingProcess(gettext('sending'), false);
                    if (err) {
                        self.setSendError(err);
                        return;
                    }
                    breadcrumbs.add('done submitting data into feeds ' + Object.keys(value)
                        .join(','));
                    self.resetDataForm();
                    $rootScope.$emit('Local/SetTab', 'history');
                });
            });
        }

        this.resetDataForm = function() {
            this.resetError();
            $scope.home.feedvaluespairs = [{}];
            $timeout(function() {
                if(!$rootScope.$$phase) $rootScope.$apply();
            }, 1);
        };

        var assocDeviceAddressesByPaymentAddress = {};

        this.canSendExternalPayment = function() {
            if ($scope.index.arrBalances.length === 0 || $scope.index.assetIndex < 0) // no balances yet, assume can send
                return true;
            if (!$scope.index.arrBalances[$scope.index.assetIndex]) // no balances yet, assume can send
                return true;
            if (!$scope.index.arrBalances[$scope.index.assetIndex].is_private)
                return true;
            var form = $scope.sendPaymentForm;
            if (!form || !form.address) // disappeared
                return true;
            var address = form.address.$modelValue;
            var recipient_device_address = assocDeviceAddressesByPaymentAddress[address];
            return !!recipient_device_address;
        };

        this.deviceAddressIsKnown = function() {
            //	return true;
            if ($scope.index.arrBalances.length === 0) // no balances yet
                return false;
            var form = $scope.sendPaymentForm;
            if (!form || !form.address) // disappeared
                return false;
            var address = form.address.$modelValue;
            var recipient_device_address = assocDeviceAddressesByPaymentAddress[address];
            return !!recipient_device_address;
        };


        this.setToAddress = function(to) {
            var form = $scope.sendPaymentForm;
            if (!form || !form.address) // disappeared?
                return console.log('form.address has disappeared');
            form.address.$setViewValue(to);
            form.address.$isValid = true;
            form.address.$render();
        }

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
                    if (recipient_device_address) // must be already paired
                        assocDeviceAddressesByPaymentAddress[to] = recipient_device_address;
                }

                if (amount) {
                    this.lockAmount = true;
                    $timeout(function() {
                        form.amount.$setViewValue("" + profileService.getAmountInDisplayUnits(amount, asset));
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
                    var assetIndex = lodash.findIndex($scope.index.arrBalances, {
                        asset: asset
                    });
                    if (assetIndex < 0)
                        throw Error("failed to find asset index of asset " + asset);
                    $scope.index.assetIndex = assetIndex;
                    this.lockAsset = true;
                }
                else
                    this.lockAsset = false;
            }).bind(this), 1);
        };



        this.setSendAll = function() {
            var form = $scope.sendPaymentForm;
            if (!form || !form.amount) // disappeared?
                return console.log('form.amount has disappeared');
            var full_amount = $scope.index.stables.replace(/,/g,'');
            var full_amount2 = $scope.index.exTradeOutStable.replace(/,/g,'');
            if(self.chat){
                form.amount.$setViewValue('' + full_amount2);
            }else{
                form.amount.$setViewValue('' + full_amount);
            }

            form.amount.$render();
        };

        this.setFromUri = function(uri) {
            var objRequest;
            require('inWalletcore/uri.js')
                .parseUri(uri, {
                    ifError: function(err) {},
                    ifOk: function(_objRequest) {
                        objRequest = _objRequest; // the callback is called synchronously
                    }
                });

            if (!objRequest) // failed to parse
                return uri;
            if (objRequest.amount) {
                // setForm() cares about units conversion
                //var amount = (objRequest.amount / this.unitValue).toFixed(this.unitDecimals);
                this.setForm(objRequest.address, objRequest.amount);
            }
            return objRequest.address;
        };

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

        this.onAddressChange = function(value) {
            this.resetError();
            if (!value) return '';

            if (value.indexOf(self.protocol + ':') === 0)
                return this.setFromUri(value);
            else
                return value;
        };

        // History

        function strip(number) {
            return (parseFloat(number.toPrecision(12)));
        }

        this.getUnitName = function() {
            return this.unitName;
        };

        this.getPrivatePayloadSavePath = function(cb) {
            var fileName = 'inWalletPayment-' + $filter('date')(Date.now(), 'yyyy-MM-dd-HH-mm-ss') + '.' + configService.privateTextcoinExt;
            if (!isCordova) {
                var inputFile = document.createElement("input");
                inputFile.type = "file";
                inputFile.setAttribute("nwsaveas", fileName);
                inputFile.click();
                var wasCalled = false;
                inputFile.onchange = function() {
                    if (wasCalled) return;
                    wasCalled = true;
                    $timeout(function() {
                        cb(inputFile.value ? inputFile.value : null);
                        window.removeEventListener('focus', inputFile.onchange, true);
                    }, 1000);
                };
                window.addEventListener('focus', inputFile.onchange, true);
            }
            else {
                var root = window.cordova.file.cacheDirectory;//isMobile.iOS() ? window.cordova.file.documentsDirectory : window.cordova.file.externalRootDirectory;
                var path = 'inWallet';
                cb(null, {root: root, path: path, fileName: fileName});
            }
        };


        this.hasAction = function(actions, action) {
            return actions.hasOwnProperty('create');
        };

        this._doSendAll = function(amount) {
            this.setForm(null, amount, null);
        };

        this.sendAll = function(amount, feeStr) {
            var self = this;
            var msg = gettextCatalog.getString("{{fee}} will be deducted for bitcoin networking fees", {
                fee: feeStr
            });

            confirmDialog.show(msg, function(confirmed) {
                if (confirmed)
                    self._doSendAll(amount);
            });
        };

        /* Start setup */

        this.bindTouchDown();
        this.setSendPaymentFormInputs();
        if (profileService.focusedClient && profileService.focusedClient.isComplete()) {
            this.setAddress();
        }

        var store_mnemonic_back = function(){};
        if (isCordova){
            window.plugins.appPreferences.fetch(function(referrer){
                if (referrer) {
                    console.log('==== referrer: '+referrer);
                    window.plugins.appPreferences.remove(function(){}, function(){}, 'referrer');
                    store_mnemonic_back = function() {
                        // window.plugins.appPreferences.store(function(){}, function(){}, 'referrer', referrer);
                    };
                    if (referrer.split('-').length % 3 === 0)
                        $rootScope.$emit("claimTextcoin", referrer);
                }
            }, function(){}, "referrer");
        }


        //首页到各个钱包首页
        self.goWalletInfo = function(walletType, walletId, addr, name, image, ammount, mnemonic, mnemonicEncrypted){
            $state.go('walletinfo', { walletType: walletType, walletId: walletId, address: addr, name: name, image: image, ammount: ammount, mnemonic: mnemonic, mnemonicEncrypted: mnemonicEncrypted });
        }
        //闪兑到move
        self.goSend = function(){
            $rootScope.$emit('Local/SetTab', 'exchange', true);
        }
        //钱包首页列表跳转到备份页面
        self.homeGoBack = function($event, type, id){
            $event.stopImmediatePropagation();
            $state.go('backup', {  walletType: type, walletId: id});
        }
        /**
         * 转账页面扫描地址二维码
         * @type {*|(function())|angular.noop}
         */
        var transferQR = $rootScope.$on('Local/transferQR',function (event,address,amount,type) {
            $scope.index.toinAddress = address;
            $scope.index.exTradeToInImg = type.toLowerCase();

        })



        // //模态框点击后赋addr值
        // $rootScope.$on('Local/sethomeAddressVal1', function(event,addr,type){
        //     $scope.index.exTradeToInImg = type.toLowerCase();
        //     $scope.index.exPlaceholderToinAddr = $scope.index.exTradeToInImg;
        //     var form = $scope.sendTransferForm;
        //     if (!form || !form.toinAddress) // disappeared?
        //         return console.log('form.address has disappeared');
        //     form.toinAddress.$setViewValue(addr);
        //     form.toinAddress.$isValid = true;
        //     form.toinAddress.$render();
        // });
        // //模态框点击后赋addr值
        // $rootScope.$on('Local/sethomeAddressVal2', function(event,addr,type){
        //     $scope.index.exTradeToOutImg = type.toLowerCase();
        //     $scope.index.exPlaceholderTooutAddr = $scope.index.exTradeToOutImg;
        //     var form = $scope.sendTransferForm;
        //     if (!form || !form.tooutAddress) // disappeared?
        //         return console.log('form.address has disappeared');
        //     form.tooutAddress.$setViewValue(addr);
        //     form.tooutAddress.$isValid = true;
        //     form.tooutAddress.$render();
        // });

        /**
         * 触发监听事件后，销毁事件，防止重复触发
         */
        $scope.$on('$destroy', function() {
            console.log("walletHome $destroy");
            disableAddrListener();
            disablePaymentUriListener();
            disableTabListener();
            disableResumeListener();
            disableOngoingProcessListener();
            disableClaimTextcoinListener();
            transferQR();
            unwatchSpendUnconfirmed();
            eventBus.removeListener("new_wallet_address", onNewWalletAddress);
            $rootScope.hideMenuBar = false;

        });



    });