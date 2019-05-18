'use strict';

var async = require('async');
var eventBus = require('inWalletcore/event_bus.js');
var breadcrumbs = require('inWalletcore/breadcrumbs.js');
var device = require('inWalletcore/device.js');
var bignumber = require("decimal.js");

angular.module('copayApp.controllers').controller('indexController', function ($rootScope, $scope, $log, $filter, $timeout, lodash, go, profileService, configService, isCordova, storageService, addressService, gettext, gettextCatalog, amMoment, nodeWebkit, txFormatService, uxLanguage,uxCurrency, $state, isMobile, addressbookService, notification, animationService, $modal, bwcService, backButton, promptBackupService, $anchorScroll, $location, newVersion) {
    breadcrumbs.add('index.js');
    var self = this;
    self.isCordova = isCordova;
    self.isSafari = isMobile.Safari();
    self.onGoingProcess = {};
    self.historyShowLimit = 10;
    self.updatingTxHistory = {};
    self.bSwipeSuspended = false;
    self.arrBalances = [];
    self.assetIndex = 0;
    self.$state = $state;
    self.usePushNotifications = isCordova && !isMobile.Windows();
    self.showshadow= false;
    self.showshadow100= false;
    self.verificationQRCode = '';
    self.signatureAddr = '';
    self.shadowstep = 'hot1';
    self.needsBackupa = false;
    //头部显示返回按钮 start
    self.backwallet = false;
    self.backtowalltindex = false;
    self.backhome = false;
    self.backwaname = false;
    //头部显示返回按钮 end
    self.changePD = false;
    self.invedollar = 0;
    self.invermb = 0;
    self.exTradeOutStable = '';
    self.online = true;
    self.layershow = false;
    self.progressing = false;
    self.layershowmsg = '';
    self.remindbackup = false;
    self.remindNetx = true;
    self.walletInfomation = {};
    self.showpopwallet = "INVE";
    //send页面要初始化值所以写在index.js里面
    self.toinAddress = '';
    self.tooutAddress = '';
    self.exTradeOutImg = 'eth';
    self.exTradeInImg = 'inve';
    self.exTradeToInImg = 'eth';
    self.exTradeToOutImg = 'inve';
    self.exTradeOutName = gettextCatalog.getString('Choose a wallet');
    self.exTradeInName = gettextCatalog.getString('Choose a wallet');
    self.exExchangeFromImg = 'inve';
    self.exExchangeToImg = '';
    self.exExchangeToStables = '';
    self.exExchangeToName = '';
    self.exExchangeFromName = '';
    self.exPlaceholderToinAddr = self.exTradeToInImg;
    self.exPlaceholderTooutAddr = self.exTradeToOutImg;
    self.exExchangeFromAddr = '';
    self.exExchangeToAddr = '';
    self.moveRate = 1;
    self.showexhash = false;
    self.showexok = false;
    //密码框是否带信息
    self.passMassage = false;
    self.message = '';
    //chat  to transfer
    self.chat = false;
    //最新有没有加载
    self.isNewslist = false;
    self.helpshow = true;
    self.eye = true;
    self.relayObject = {};
    self.relayLength = 0;
    self.defaultLanguageIsoCode = uxLanguage.currentLanguage;
    var checkVerion = require('inWalletcore/checkVersion')
    checkVerion.version(window.version);
    var webHelper = require('inWalletcore/sendTransactionToNode');
    var bigNumber = require("bignumber.js");
    var jsonObject = JSON.parse('{}');
    var light = require('inWalletcore/light');
    self.relaySynTime = 0;
    var urlList = [];
    self.chooseNodeList = {};
    self.url = '';
    self.correspondentDeviceCount = 0;
    $rootScope.tabFrom = '';
    self.defaultShowQian = true;

    self.getRelayInfo = function(callback){
        if (new Date().getTime() - self.relaySynTime < 10000 && self.moveRate != undefined){
            return;
        }
        self.relaySynTime = new Date().getTime();
        webHelper.post( device.my_device_hashnetseed_url+'/v1/relay/list', jsonObject, {"Content-Type": "application/json;"},function (err2, result2) {
            try {
                var backResult = JSON.parse(result2.body.data);
                var data = backResult[0];
                self.BTCTOETH  = data.exchangeRatios['BTC:ETH'].toString();
                self.ETHTOBTC  = new bigNumber(1).dividedBy(data.exchangeRatios['BTC:ETH']).toString();
                self.INVETOBTC = data.exchangeRatios['INVE:BTC'].toString();
                self.BTCTOINVE = new bigNumber(1).dividedBy(data.exchangeRatios['INVE:BTC']).toString();
                self.ETHTOINVE = new bigNumber(1).dividedBy(data.exchangeRatios['INVE:ETH']).toString();
                self.INVETOETH = data.exchangeRatios['INVE:ETH'].toString();
                self.INVETOINVE = 1;
                self.ETHTOETH = 1;
                self.BTCTOBTC = 1;
                self.middleNodeName = (data.name).replace('word','World');
                self.exchangeRate = data.feeRatio;
                self.chooseNodeList = data.addresses;
                self.moveRate = self[self.exExchangeFromImg.toUpperCase() + 'TO' + self.exExchangeToImg.toUpperCase()];
                self.moveRateExchange = self[self.exTradeOutImg.toUpperCase() + 'TO' + self.exTradeInImg.toUpperCase()];
                self.url = data.ip + ':' + data.httpPort;
                urlList = [];
                var length = backResult.length;
                for (var i=0; i<length; i++){
                    if(backResult[i].name=='word')backResult[i].name='World';
                    self.relayObject[backResult[i].pubkey] = backResult[i];
                    self.relayLength ++;
                    urlList.push(backResult[i].ip + ':' + backResult[i].httpPort);
                }
                light.setMultiUrl(urlList);
                $scope.$apply();
                if (callback)
                    callback();
            } catch(err){
                console.log('全节点异常' + err);
            }
        });
    }
    self.getRelayInfo();

    self.trueRate = 1;

    self.findPaymentAddress = function(walletId,stables,walletName,address,type){
        self.showselectwt = false;
        if(self.selectid == 1){
            self.exTradeOutId = walletId;
            self.exTradeOutName = walletName;
            self.exTradeOutImg = type.toLowerCase();
            self.exTradeToInImg = type.toLowerCase();
            self.exPlaceholderToinAddr = self.exTradeToInImg;
            self.exTradeOutAddr = address;
            //self.moveRate = self[self.exTradeOutImg.toUpperCase() + 'TO' + self.exTradeToOutImg.toUpperCase()];
            self.moveRateExchange = self[self.exTradeOutImg.toUpperCase() + 'TO' + self.exTradeInImg.toUpperCase()];
        }else{
            self.exTradeInId = walletId;
            self.exTradeInName = walletName;
            self.exTradeToOutImg = type.toLowerCase();
            self.exPlaceholderTooutAddr = self.exTradeToOutImg;
            self.exTradeInImg = type.toLowerCase();
            self.exTradeInAddr = address;
            //self.moveRate = self[self.exTradeOutImg.toUpperCase() + 'TO' + self.exTradeToOutImg.toUpperCase()];
            self.moveRateExchange = self[self.exTradeOutImg.toUpperCase() + 'TO' + self.exTradeInImg.toUpperCase()];
        }
    }

    self.findPaymentAddressmove = function(walletId,stables,walletName,address,type){
        let tenexp = /^([a-zA-Z0-9]{10})(.*)([a-zA-Z0-9]{10})$/g;
        self.showselectwtmove = false;
        if(self.selectidmove == 1){
            self.exTradeOutId = walletId;
            self.exExchangeFromId = walletId;
            self.exExchangeFromStable = stables;
            self.exExchangeFromName = walletName;
            self.exExchangeFromImg = type.toLowerCase();
            self.exExchangeFromAddr = address;
            self.exExchangeFromAddrShow = address.replace(tenexp, '$1...$3');
            self.moveRate = self[self.exExchangeFromImg.toUpperCase() + 'TO' + self.exExchangeToImg.toUpperCase()];
            self.moveRateExchange = self[self.exTradeOutImg.toUpperCase() + 'TO' + self.exTradeInImg.toUpperCase()];
        }else{
            self.exExchangeToId = walletId;
            self.exExchangeToStable = stables;
            self.exExchangeToName = walletName;
            self.exExchangeToImg = type.toLowerCase();
            self.exExchangeToAddr = address;
            self.exExchangeToAddrShow = address.replace(tenexp, '$1...$3');
            self.moveRate = self[self.exExchangeFromImg.toUpperCase() + 'TO' + self.exExchangeToImg.toUpperCase()];
            self.moveRateExchange = self[self.exTradeOutImg.toUpperCase() + 'TO' + self.exTradeInImg.toUpperCase()];
        }
    }
    self.showselectlayer = function(selectid){
        self.showselectwt = true;
        if(selectid == 1){
            self.selectid = 1;
        }else if(selectid == 2){
            self.selectid = 2;
        }
        self.changesendType('INVE');
    }
    self.showselectlayermove = function(selectid){
        self.showselectwtmove = true;
        if(selectid == 1){
            self.selectidmove = 1;
        }else if(selectid == 2){
            self.selectidmove = 2;
        }
        self.changesendType('INVE');
    }
    self.changesendType = function(type){
        if (type == self.moveState) {
            return;
        }
        self.showpopwallet = type;
        self.chooseWalletInfo = [];
        var walletInfo = self.walletInfo;
        var type = self.showpopwallet? self.showpopwallet: 'INVE';
        var length = self.walletInfo.length;
        for (var i=0; i<length; i++){
            var walletType = (walletInfo[i].wallet).split("-")[1] ? (walletInfo[i].wallet).split("-")[0]:'INVE';
            if (walletType == type){
                walletInfo[i].type = walletType;
                self.chooseWalletInfo.push(walletInfo[i]);
            }
        }
        return;
    }
    //到这里都是为了初始化值把js写在index.js

    function updatePublicKeyRing(walletClient, onDone) {
        // var walletDefinedByKeys = require('inWalletcore/wallet_defined_by_keys.js');
        // walletDefinedByKeys.readCosigners(walletClient.credentials.walletId, function (arrCosigners) {
        //     var arrApprovedDevices = arrCosigners.
        //     filter(function (cosigner) { return cosigner.approval_date; }).
        //     map(function (cosigner) { return cosigner.device_address; });
        //     console.log("approved devices: " + arrApprovedDevices.join(", "));
        //     walletClient.credentials.addPublicKeyRing(arrApprovedDevices);
        //
        //     // save it to profile
        //     var credentialsIndex = lodash.findIndex(profileService.profile.credentials, { walletId: walletClient.credentials.walletId });
        //     if (credentialsIndex < 0)
        //         throw Error("failed to find our credentials in profile");
        //     profileService.profile.credentials[credentialsIndex] = JSON.parse(walletClient.export());
        //     console.log("saving profile: " + JSON.stringify(profileService.profile));
        //     storageService.storeProfile(profileService.profile, function () {
        //         if (onDone)
        //             onDone();
        //     });
        // });
    }


    function sendBugReport(error_message, error_object) {
        var conf = require('inWalletcore/conf.js');
        var network = require('inWalletcore/network.js');
        var bug_sink_url = conf.WS_PROTOCOL + (conf.bug_sink_url || configService.getSync().hub);
        network.findOutboundPeerOrConnect(bug_sink_url, function (err, ws) {
            if (err)
                return;
            breadcrumbs.add('bugreport');
            var description = error_object.stack || JSON.stringify(error_object, null, '\t');
            if (error_object.bIgnore)
                description += "\n(ignored)";
            description += "\n\nBreadcrumbs:\n" + breadcrumbs.get().join("\n") + "\n\n";
            description += "UA: " + navigator.userAgent + "\n";
            description += "Language: " + (navigator.userLanguage || navigator.language) + "\n";
            description += "Program: " + conf.program + ' ' + conf.program_version + ' ' + (conf.bLight ? 'light' : 'full') + " #" + window.commitHash + "\n";

            network.sendJustsaying(ws, 'bugreport', { message: error_message, exception: description });
        });
    }

    self.sendBugReport = sendBugReport;


    eventBus.on('nonfatal_error', function (error_message, error_object) {
        console.log('nonfatal error stack', error_object.stack);
        error_object.bIgnore = true;
        sendBugReport(error_message, error_object);
    });

    eventBus.on('uncaught_error', function (error_message, error_object) {
        if (error_message.indexOf('ECONNREFUSED') >= 0 || error_message.indexOf('host is unreachable') >= 0) {
            $rootScope.$emit('Local/ShowAlert', "Error connecting to TOR", 'fi-alert', function () {
                go.path('preferencesGlobal');
            });
            return;
        }
        if (error_message.indexOf('ttl expired') >= 0 || error_message.indexOf('general SOCKS server failure') >= 0) // TOR error after wakeup from sleep
            return;
        console.log('stack', error_object.stack);
        sendBugReport(error_message, error_object);
        if (error_object && error_object.bIgnore)
            return;
        self.showErrorPopup(error_message, function () {
            var db = require('inWalletcore/db.js');
            db.close();
            if (self.isCordova && navigator && navigator.app) // android
                navigator.app.exitApp();
            else if (process.exit) // nwjs
                process.exit();
            // ios doesn't exit
        });
        /*if (isCordova) {
            alert('indexshow---uncaught_error');
            wallet.showCompleteClient();
        }*/
    });

    function readLastDateString(cb) {
        var conf = require('inWalletcore/conf.js');
        if (conf.storage !== 'sqlite')
            return cb();
        var db = require('inWalletcore/db.js');
        db.query(
            "SELECT int_value FROM unit_authors JOIN data_feeds USING(unit) \n\
                  WHERE address=? AND feed_name='timestamp' \n\
                  ORDER BY unit_authors.rowid DESC LIMIT 1",
            [configService.TIMESTAMPER_ADDRESS],
            function (rows) {
                if (rows.length === 0)
                    return cb();
                var ts = rows[0].int_value;
                cb('at ' + $filter('date')(ts, 'short'));
            }
        );
    }

    function readSyncPercent(cb) {
        var db = require('inWalletcore/db.js');
        db.query("SELECT COUNT(1) AS count_left FROM catchup_chain_balls", function (rows) {
            var count_left = rows[0].count_left;
            if (count_left === 0)
                return cb("0%");
            if (catchup_balls_at_start === -1)
                catchup_balls_at_start = count_left;
            var percent = ((catchup_balls_at_start - count_left) / catchup_balls_at_start * 100).toFixed(3);
            cb(percent + '%');
        });
    }

    function readSyncProgress(cb) {
        readLastDateString(function (strProgress) {
            strProgress ? cb(strProgress) : readSyncPercent(cb);
        });
    }

    function setSyncProgress() {
        readSyncProgress(function (strProgress) {
            self.syncProgress = strProgress;
            $timeout(function () {
                $rootScope.$apply();
            });
        });
    }

    eventBus.on('rates_updated', function () {
        $timeout(function () {
            $rootScope.$apply();
        });
    });
    eventBus.on('started_db_upgrade', function () {
        $timeout(function () {
            if (self.bUpgradingDb === undefined)
                self.bUpgradingDb = true;
            $rootScope.$apply();
        }, 100);
    });
    eventBus.on('finished_db_upgrade', function () {
        $timeout(function () {
            self.bUpgradingDb = false;
            $rootScope.$apply();
        });
    });

    var catchup_balls_at_start = -1;

    eventBus.on("confirm_on_other_devices", function () {
        $rootScope.$emit('Local/ShowAlert', "Transaction created.\nPlease approve it on the other devices.", 'fi-key', function () {
            go.walletHome();
        });
    });

    eventBus.on("refused_to_sign", function (device_address) {
        var device = require('inWalletcore/device.js');
        //todo delete
        // device.readCorrespondent(device_address, function (correspondent) {
        //     notification.success(gettextCatalog.getString('Refused'), correspondent.name + " refused to sign the transaction");
        // });
    });


    eventBus.on("new_my_transactions", function () {
        breadcrumbs.add('new_my_transactions');
        self.updateTxHistory(3);
    });

    eventBus.on("my_transactions_became_stable", function () {
        breadcrumbs.add('my_transactions_became_stable');
        self.updateTxHistory(3);
    });

    eventBus.on("maybe_new_transactions", function () {
        breadcrumbs.add('maybe_new_transactions');
        self.updateTxHistory(3);
    });

    eventBus.on("wallet_approved", function (walletId, device_address) {
        console.log("wallet_approved " + walletId + " by " + device_address);
        var client = profileService.walletClients[walletId];
        if (!client) // already deleted (maybe declined by another device) or not present yet
            return;
        var walletName = client.credentials.walletName;
        updatePublicKeyRing(client);
        var device = require('inWalletcore/device.js');
        //todo delete
        // device.readCorrespondent(device_address, function (correspondent) {
        //     notification.success(gettextCatalog.getString('Success'), "Wallet " + walletName + " approved by " + correspondent.name);
        // });
    });

    eventBus.on("wallet_declined", function (walletId, device_address) {
        var client = profileService.walletClients[walletId];
        if (!client) // already deleted (maybe declined by another device)
            return;
        var walletName = client.credentials.walletName;
        var device = require('inWalletcore/device.js');
        //todo delete
        // device.readCorrespondent(device_address, function (correspondent) {
        //     notification.info(gettextCatalog.getString('Declined'), "Wallet " + walletName + " declined by " + (correspondent ? correspondent.name : 'peer'));
        // });
        profileService.deleteWallet({ client: client }, function (err) {
            if (err)
                console.log(err);
        });
    });

    eventBus.on("wallet_completed", function (walletId) {
        console.log("wallet_completed " + walletId);
        var client = profileService.walletClients[walletId];
        if (!client) // impossible
            return;
        var walletName = client.credentials.walletName;
        updatePublicKeyRing(client, function () {
            if (!client.isComplete())
                throw Error("not complete");
            notification.success(gettextCatalog.getString('Success'), "Wallet " + walletName + " is ready");
            $rootScope.$emit('Local/WalletCompleted');
        });
    });


    // in arrOtherCosigners, 'other' is relative to the initiator
    eventBus.on("create_new_wallet", function (walletId, arrWalletDefinitionTemplate, arrDeviceAddresses, walletName, arrOtherCosigners, isSingleAddress) {
        var device = require('inWalletcore/device.js');
        var walletDefinedByKeys = require('inWalletcore/wallet_defined_by_keys.js');
        device.readCorrespondentsByDeviceAddresses(arrDeviceAddresses, function (arrCorrespondentInfos) {
            // my own address is not included in arrCorrespondentInfos because I'm not my correspondent
            var arrNames = arrCorrespondentInfos.map(function (correspondent) { return correspondent.name; });
            var name_list = arrNames.join(", ");
            var question = gettextCatalog.getString('Create new wallet ' + walletName + ' together with ' + name_list + ' ?');
            requestApproval(question, {
                ifYes: function () {
                    console.log("===== YES CLICKED")
                    var createNewWallet = function () {
                        walletDefinedByKeys.readNextAccount(function (account) {
                            var walletClient = bwcService.getClient();
                            if (!profileService.focusedClient.credentials.xPrivKey)
                                throw Error("no profileService.focusedClient.credentials.xPrivKeyin createNewWallet");
                            walletClient.seedFromExtendedPrivateKey(profileService.focusedClient.credentials.xPrivKey, account);
                            //walletClient.seedFromMnemonic(profileService.profile.mnemonic, {account: account});
                            walletDefinedByKeys.approveWallet(
                                walletId, walletClient.credentials.xPubKey, account, arrWalletDefinitionTemplate, arrOtherCosigners,
                                function () {
                                    walletClient.credentials.walletId = walletId;
                                    walletClient.credentials.network = 'livenet';
                                    var n = arrDeviceAddresses.length;
                                    var m = arrWalletDefinitionTemplate[1].required || n;
                                    walletClient.credentials.addWalletInfo(walletName, m, n);
                                    updatePublicKeyRing(walletClient);
                                    profileService._addWalletClient(walletClient, {}, function () {
                                        if (isSingleAddress) {
                                            profileService.setSingleAddressFlag(true);
                                        }
                                        console.log("switched to newly approved wallet " + walletId);
                                    });
                                }
                            );
                        });
                    };
                    if (profileService.focusedClient.credentials.xPrivKey)
                        createNewWallet();
                    else
                        profileService.insistUnlockFC(null, createNewWallet);
                },
                ifNo: function () {
                    console.log("===== NO CLICKED")
                    walletDefinedByKeys.cancelWallet(walletId, arrDeviceAddresses, arrOtherCosigners);
                }
            });
        });
    });



    var accept_msg = gettextCatalog.getString('Yes');
    var cancel_msg = gettextCatalog.getString('No');
    var confirm_msg = gettextCatalog.getString('Confirm');

    var _modalRequestApproval = function (question, callbacks) {
        var ModalInstanceCtrl = function ($scope, $modalInstance, $sce, gettext) {
            $scope.title = $sce.trustAsHtml(question);
            $scope.yes_icon = 'fi-check';
            $scope.yes_button_class = 'primary';
            $scope.cancel_button_class = 'warning';
            $scope.cancel_label = 'No';
            $scope.loading = false;

            $scope.ok = function () {
                $scope.loading = true;
                $modalInstance.close(accept_msg);
            };
            $scope.cancel = function () {
                $modalInstance.dismiss(cancel_msg);
            };
        };

        var modalInstance = $modal.open({
            templateUrl: 'views/modals/confirmation.html',
            windowClass: animationService.modalAnimated.slideUp,
            controller: ModalInstanceCtrl
        });

        modalInstance.result.finally(function () {
            var m = angular.element(document.getElementsByClassName('reveal-modal'));
            m.addClass(animationService.modalAnimated.slideOutDown);
        });

        modalInstance.result.then(callbacks.ifYes, callbacks.ifNo);
    };

    var requestApproval = function (question, callbacks) {
        if (isCordova) {
            navigator.notification.confirm(
                question,
                function (buttonIndex) {
                    if (buttonIndex == 1)
                        callbacks.ifYes();
                    else
                        callbacks.ifNo();
                },
                confirm_msg, [accept_msg, cancel_msg]
            );
        } else {
            _modalRequestApproval(question, callbacks);
        }
    };



    self.openSubwalletModal = function () {
        $rootScope.modalOpened = true;
        var fc = profileService.focusedClient;

        var ModalInstanceCtrl = function ($scope, $modalInstance) {
            $scope.color = fc.backgroundColor;
            selfCtl = self;
            var arrSharedWallets = [];
            $scope.mainWalletBalanceInfo = self.arrMainWalletBalances[self.assetIndex];
            $scope.asset = $scope.mainWalletBalanceInfo.asset;
            var asset = $scope.asset;
            var assetInfo = self.arrBalances[self.assetIndex];
            var assocSharedByAddress = assetInfo.assocSharedByAddress;
            for (var sa in assocSharedByAddress) {
                var objSharedWallet = {};
                objSharedWallet.shared_address = sa;
                objSharedWallet.total = assocSharedByAddress[sa];
                if (asset === 'base' || $scope.mainWalletBalanceInfo.name)
                    objSharedWallet.totalStr = profileService.formatAmountWithUnit(assocSharedByAddress[sa], asset);
                arrSharedWallets.push(objSharedWallet);
            }
            $scope.arrSharedWallets = arrSharedWallets;

            var walletDefinedByAddresses = require('inWalletcore/wallet_defined_by_addresses.js');
            async.eachSeries(
                arrSharedWallets,
                function (objSharedWallet, cb) {
                    walletDefinedByAddresses.readSharedAddressCosigners(objSharedWallet.shared_address, function (cosigners) {
                        objSharedWallet.shared_address_cosigners = cosigners.map(function (cosigner) { return cosigner.name; }).join(", ");
                        objSharedWallet.creation_ts = cosigners[0].creation_ts;
                        cb();
                    });
                },
                function () {
                    arrSharedWallets.sort(function (o1, o2) { return (o2.creation_ts - o1.creation_ts); });
                    $timeout(function () {
                        $scope.$apply();
                    });
                }
            );

            $scope.cancel = function () {
                breadcrumbs.add('openSubwalletModal cancel');
                $modalInstance.dismiss('cancel');
            };

            $scope.selectSubwallet = function (shared_address) {
                self.shared_address = shared_address;
                if (shared_address) {
                    walletDefinedByAddresses.determineIfHasMerkle(shared_address, function (bHasMerkle) {
                        self.bHasMerkle = bHasMerkle;
                        walletDefinedByAddresses.readSharedAddressCosigners(shared_address, function (cosigners) {
                            self.shared_address_cosigners = cosigners.map(function (cosigner) { return cosigner.name; }).join(", ");
                            $timeout(function () {
                                $rootScope.$apply();
                            });
                        });
                    });
                }
                else
                    self.bHasMerkle = false;
                self.updateTxHistory(3);
                $modalInstance.close();
            };
        };

        var modalInstance = $modal.open({
            templateUrl: 'views/modals/select-subwallet.html',
            windowClass: animationService.modalAnimated.slideUp,
            controller: ModalInstanceCtrl,
        });

        var disableCloseModal = $rootScope.$on('closeModal', function () {
            breadcrumbs.add('openSubwalletModal on closeModal');
            modalInstance.dismiss('cancel');
        });

        modalInstance.result.finally(function () {
            $rootScope.modalOpened = false;
            disableCloseModal();
            var m = angular.element(document.getElementsByClassName('reveal-modal'));
            m.addClass(animationService.modalAnimated.slideOutDown);
        });

    };

    /**
     * 打开地址簿页面,因为传参影响是从exchange页面过来的还是从transfer页面过来的，所以写在index里面
     * @param addr
     */
    self.openAddressModal = function (addr, walletType, walletId, address, walletName, order) {
        $rootScope.modalOpened = true;
        var fc = profileService.focusedClient;

        var ModalInstanceCtrl = function ($scope, $modalInstance) {
            $scope.editAddressbook = false;
            $scope.addAddressbookEntry = false;
            $scope.selectedAddressbook = {};
            //交换页面的input框的address
            if( addr !== ''){
                $scope.newAddress = addr;
            }else{
                $scope.newAddress = address;
            }
            $scope.walletType = walletType;
            $scope.walletId = walletId;
            //转账页面的address
            $scope.address = address;
            $scope.walletName = walletName;
            $scope.addressbook = {
                'address': ($scope.newAddress || ''),
                'label': ''
            };
            $scope.showDelete = false;
            $scope.showDeletes = false;
            $scope.order = order;
            /*$scope.bAllowAddressbook = self.canSendExternalPayment();*/

            $scope.beforeQrCodeScann = function() {
                $scope.error = null;
                $scope.addAddressbookEntry = true;
                $scope.editAddressbook = false;
            };

            $scope.onQrCodeScanned = function(data, addressbookForm) {
                $timeout(function() {
                    var form = addressbookForm;
                    if (data && form) {
                        data = data.replace(self.protocol + ':', '');
                        form.address.$setViewValue(data);
                        form.address.$isValid = true;
                        form.address.$render();
                    }
                    $timeout(function () {
                        if(!$rootScope.$$phase) $scope.$apply();
                    },1);

                }, 100);
            };

            /*$scope.selectAddressbook = function(addr) {
                $modalInstance.close(addr);
            };
            */

            $scope.toggleEditAddressbook = function() {
                $scope.editAddressbook = !$scope.editAddressbook;
                $scope.selectedAddressbook = {};
                $scope.addAddressbookEntry = false;
                lodash.forEach($scope.addressList, function(key, value) {
                    $scope.addressList[value].select = false;
                })
            };

            $scope.toggleAddAddressbookEntry = function() {
                $scope.error = null;
                $scope.addressbook = {
                    'address': ($scope.newAddress || ''),
                    'label': ''
                };
                $scope.addAddressbookEntry = !$scope.addAddressbookEntry;
            };

            $scope.addressbookSave = function (addressbook, curType) {
                $scope.error = null;
                addressbookService.add(addressbook, curType, function (err,ab) {
                    if (err) {
                        $timeout(function () {
                            $scope.error = err;
                        });
                        return;
                    }
                    $scope.addressListShow = ab;
                    $scope.addressList = {};
                    lodash.forEach($scope.addressListShow, function(key, value){
                        $scope.noAddress = true;
                        $scope.addressList[value] = {
                            addr: value,
                            name: key,
                            select: false
                        }
                    })
                    $scope.editAddressbook = true;
                    $scope.toggleEditAddressbook();
                    $timeout(function () {
                        $scope.$apply();
                    });
                });
            }

            $scope.addressbookList = function (type) {
                addressbookService.list(type,function (err,ab) {
                    if (err) {
                        $timeout(function () {
                            $scope.error = err;
                        });
                        return;
                    }
                    $scope.addressListShow = ab;
                    $scope.addressList = {};
                    $scope.noAddress = false;
                    lodash.forEach($scope.addressListShow, function(key, value){
                        $scope.noAddress = true;
                        $scope.addressList[value] = {
                            addr: value,
                            name: key,
                            select: false
                        }
                    })
                    $scope.editAddressbook = true;
                    $scope.toggleEditAddressbook();
                    $timeout(function () {
                        $rootScope.$apply();
                    },1);
                })
            }
            if( walletType !== ''){
                //transfer page
                $scope.shortType = walletType.split('-')[0];
                $scope.addressType = $scope.shortType;
                $scope.addressbookList($scope.shortType);
            }else{
                //wallethome send page
                $scope.shortType = false;
                $scope.addressType = 'INVE';
                $scope.addressbookList('INVE');
            }

            /**
             * 刪除地址
             * @param address
             * @param type
             */
            $scope.addressbookRmove = function (address,type) {
                $scope.showDelete = false;
                $scope.error = null;
                addressbookService.remove(address,type,function (err, ab) {
                    if (err) {
                        $scope.error = err;
                        return;
                    }
                    $scope.addressListShow = ab;
                    $scope.addressList = {};
                    $scope.noAddress = false;
                    lodash.forEach($scope.addressListShow, function(key, value){
                        $scope.noAddress = true;
                        $scope.addressList[value] = {
                            addr: value,
                            name: key,
                            select: false
                        }
                    })
                    $timeout(function () {
                        if(!$rootScope.$$phase) $scope.$apply();
                    },1);
                })
            }

            /**
             * 刪除所选地址
             * @param type
             */
            $scope.deleteSelect = function (type) {
                var selectAddrList = [];
                lodash.forEach($scope.addressList, function(key, value){
                    if($scope.addressList[value].select == true){
                        selectAddrList.push($scope.addressList[value].addr)
                    }
                })
                console.log(selectAddrList)
                $scope.showDeletes = false;
                $scope.error = null;
                lodash.forEach(selectAddrList, function(key, value){
                    addressbookService.remove(key,type,function (err, ab) {
                        if (err) {
                            $scope.error = err;
                            return;
                        }
                        $scope.addressListShow = ab;
                        $scope.addressList = {};
                        $scope.noAddress = false;
                        lodash.forEach($scope.addressListShow, function(key, value){
                            $scope.noAddress = true;
                            $scope.addressList[value] = {
                                addr: value,
                                name: key,
                                select: false
                            }
                        })
                        $timeout(function () {
                            if(!$rootScope.$$phase) $scope.$apply();
                        },1);
                    })
                })
            }

            /**
             * 选择所有地址删除
             * @param type
             */
            $scope.selectAll = function () {
                lodash.forEach($scope.addressList, function(key, value) {
                    $scope.addressList[value].select = true;
                })
            }

            $scope.selectWallet = function(walletId, walletName) {
                $scope.selectedWalletName = walletName;
                addressService.getAddress(walletId, false, function onGotAddress(err, addr) {
                    $scope.gettingAddress = false;

                    if (err) {
                        self.error = err;
                        breadcrumbs.add('openDestinationAddressModal getAddress err: ' + err);
                        $modalInstance.dismiss('cancel');
                        return;
                    }

                    $modalInstance.close(addr);
                });
            };

            $scope.changeType = function(type){
                $scope.addressType = type;
                $scope.addressbookList(type);
                $timeout(function(){
                    $scope.$apply();
                })
            }
            /**
             * 复制地址
             * @param addr
             */
            $scope.copyAddress = function(addr,$event) {
                $event.stopImmediatePropagation();
                if (isCordova) {
                    window.cordova.plugins.clipboard.copy(addr);
                    window.plugins.toast.showShortCenter(gettextCatalog.getString('Successful copy'));
                }
                else if (nodeWebkit.isDefined()) {
                    nodeWebkit.writeToClipboard(addr);
                    self.layershow = true;
                    self.layershowmsg = gettextCatalog.getString('Successful copy');
                    setTimeout(function () {
                        self.layershow = false;
                        $scope.$apply();
                    },1500);
                }
            };

            /**
             *
             * @param $event
             */
            $scope.goTransfer = function ($event,addr) {
                //walletType&walletId&addressess&walletName
                console.log('self.walletInfo:   ',self.walletInfo);
                $event.stopImmediatePropagation();
                $scope.cancel();
                //$state.go('transfer',{ walletType:self.walletType, walletId:self.walletId, address:self.address,walletName :self.walletName });
            }

            /**
             *
             * * @param addr
             */
            $scope.showDeleteF = function (addr,$event) {
                $event.stopImmediatePropagation();
                $scope.showDelete = true;
                $scope.deleteaddr = addr;
            }
            /**
             *
             */
            $scope.hideDeleteF = function () {
                $scope.showDelete = false;
                let resetel = document.querySelectorAll('.addeditin .addrremove');
                lodash.forEach(resetel, function(key, value){
                    resetel[value].style.width = 0;
                    resetel[value].style.zIndex = 1;
                    resetel[value].style.opacity = 0;
                    resetel[value].style.paddingLeft = 0;
                    resetel[value].style.paddingRight = 0;
                })
            }
            /**
             *
             * * @param $event
             */
            $scope.showDeleteSF = function (addr) {
                $scope.showDeletes = true;
            }
            /**
             *
             */
            $scope.hideDeleteSF = function () {
                $scope.showDeletes = false;

            }
            /**
             *返回到来的页面，并带上点击地址
             *@params addr
             */
            $scope.goBackAddr = function (addr,type) {

                if( walletType !== ''){
                    //transfer  page
                    $rootScope.$emit('Local/setAddressVal', addr,type);
                    $scope.cancel();
                }else{
                    //walletHome send page
                    if($scope.order == 1){
                        $rootScope.$emit('Local/sethomeAddressVal1', addr,type);
                        $scope.cancel();
                    }else if($scope.order == 2){
                        $rootScope.$emit('Local/sethomeAddressVal2', addr,type);
                        $scope.cancel();
                    }

                }

            }
            $scope.cancel = function () {
                breadcrumbs.add('openAddressModal cancel');
                $modalInstance.dismiss('cancel');
            };

        };

        var modalInstance = $modal.open({
            templateUrl: 'views/modals/destination-address.html',
            windowClass: animationService.modalAnimated.slideUp,
            controller: ModalInstanceCtrl,
        });

        var disableCloseModal = $rootScope.$on('closeModal', function () {
            breadcrumbs.add('openAddressModal on closeModal');
            modalInstance.dismiss('cancel');
        });

        modalInstance.result.finally(function () {
            $rootScope.modalOpened = false;
            disableCloseModal();
            var m = angular.element(document.getElementsByClassName('reveal-modal'));
            m.addClass(animationService.modalAnimated.slideOutDown);
        });

        /*modalInstance.result.then(function onDestModalDone(addr) {
            if (addr) {
                self.setToAddress(addr);
            }
        });*/

    };

    self.goHome = function () {
        go.walletHome();
    };


    self.menu = [{
        'title': gettext('Home'),
        'img': 'mmtabwalletHome',
        'imgid': 'walletHome',
        'link': 'walletHome'
    }, {
        'title': gettext('Discovery'),
        'img': 'mmtabnews',
        'imgid': 'news',
        'link': 'discovery'
    }, {
        'title': gettext('Flash'),
        'img': 'mmtabsend',
        'imgid': 'send',
        'link': 'exchange'
    }, {
        'title': gettext('Chat'),
        'img': 'mmtabchat',
        'imgid': 'chat',
        'link': 'correspondentDevices',
    }, {
        'title': gettext('Wallet'),
        'img': 'mmtabwallet',
        'imgid': 'wallet',
        'link': 'wallet'
    }];

    self.tab = 'walletHome';



    self.setFocusedWallet = function (cb) {
        var fc = profileService.focusedClient;
        if (!fc) return;

        breadcrumbs.add('setFocusedWallet ' + fc.credentials.walletId);
        var device = require('inWalletcore/device.js');
        device.setWalletId(fc.credentials.walletId);
        // Clean status
        self.totalBalanceBytes = null;
        self.lockedBalanceBytes = null;
        self.availableBalanceBytes = null;
        self.pendingAmount = null;
        self.spendUnconfirmed = null;

        self.totalBalanceStr = null;
        self.availableBalanceStr = null;
        self.lockedBalanceStr = null;

        self.arrBalances = [];
        self.assetIndex = 0;
        self.shared_address = null;
        self.bHasMerkle = false;

        self.txHistory = [];
        self.completeHistory = [];
        self.txProgress = 0;
        self.historyShowShowAll = false;
        self.balanceByAddress = null;
        self.pendingTxProposalsCountForUs = null;
        self.setSpendUnconfirmed();

        $timeout(function () {
            //$rootScope.$apply();
            self.hasProfile = true;
            self.noFocusedWallet = false;
            self.onGoingProcess = {};

            // Credentials Shortcuts
            self.m = fc.credentials.m;
            self.n = fc.credentials.n;
            self.network = fc.credentials.network;
            self.requiresMultipleSignatures = fc.credentials.m > 1;
            //self.isShared = fc.credentials.n > 1;
            self.walletName = fc.credentials.walletName;
            self.walletId = fc.credentials.walletId;
            self.isComplete = fc.isComplete();
            self.canSign = fc.canSign();
            self.isPrivKeyExternal = fc.isPrivKeyExternal();
            self.isPrivKeyEncrypted = fc.isPrivKeyEncrypted();
            self.mnemonic = fc.credentials.mnemonic;
            self.externalSource = fc.getPrivKeyExternalSourceName();
            self.account = fc.credentials.account;

            self.txps = [];
            self.copayers = [];
            self.updateColor();
            self.updateAlias();
            self.updateSingleAddressFlag();
            //self.setAddressbook();


            profileService.profile.mnemonic = fc.credentials.mnemonic;
            profileService.profile.mnemonicEncrypted = fc.credentials.mnemonicEncrypted;
            profileService.profile.xPrivKey = fc.credentials.xPrivKey;
            profileService.profile.xPrivKeyEncrypted = fc.credentials.xPrivKeyEncrypted;

            // storageService.storeProfile(profileService.profile, function () {
            console.log("reading cosigners");
            // var walletDefinedByKeys = require('inWalletcore/wallet_defined_by_keys.js');
            // walletDefinedByKeys.readCosigners(self.walletId, function (arrCosignerInfos) {
            //     self.copayers = arrCosignerInfos;
            //     $timeout(function () {
            //         $rootScope.$digest();
            //     });
            // });

            self.needsBackup = false;
            self.singleAddressWallet = false;
            self.openWallet();
            if (lodash.isFunction(cb)) {
                cb();
            }
            $timeout(function () {
                $rootScope.$apply();
            });
        });
    };

    /**
     * 切换钱包标签，进入不同页面
     * @param tab
     * @param reset
     * @param tries
     * @param switchState
     * @returns {*}
     */
   /* self.setTab = function (tab, reset, tries, switchState) {
        // console.log("setTab", tab, reset, tries, switchState);
        tries = tries || 0;

        var changeTab = function (tab) {

            go.path(tab);

            if (document.getElementById(tab)) {
                var el = angular.element(document.getElementById(tab));
                el.removeClass('tab-out').addClass('tab-in');
                var newe = angular.element(document.getElementById('menu-' + tab));
                if (newe) {
                    newe.className = 'active';
                }
            }

            /!**
             * 根据点击标签内容切换对应标签图标样式
             *!/
            let menuu = self.menu;
            if((self.tab== tab &&!$rootScope.tab) ||$rootScope.tab != tab && !(self.tab == 'chat' && tab == 'correspondentDevices')){
                for(let item in menuu){
                    if(menuu[item].link == tab) {
                        let cc = menuu[item];
                        cc.img = 'active'+cc.img;
                        menuu.splice(item,1,cc);
                    }
                    if(menuu[item].link == $rootScope.tab) {
                        let cc = menuu[item];
                        cc.img = cc.img.substring(6);
                        menuu.splice(item,1,cc);
                    }
                }
            }

            $rootScope.tab = self.tab = tab;

            $rootScope.$emit('Local/TabChanged', tab);
        };

        // check if the whole menu item passed
        if (typeof tab == 'object') {
            if (!tab.new_state) backButton.clearHistory();
            if (tab.open) {
                if (tab.link) {
                    $rootScope.tab = self.tab = tab.link;
                }
                tab.open();
                return;
            } else if (tab.new_state) {
                changeTab(tab.link);
                go.path(tab.new_state);
                $rootScope.tab = self.tab = tab.link;
                return;
            } else {
                return self.setTab(tab.link, reset, tries, switchState);
            }
        }
        //console.log("current tab " + self.tab + ", requested to set tab " + tab + ", reset=" + reset);
        if (self.tab === tab && !reset)
            return;

        if (!document.getElementById('menu-' + tab) && ++tries < 5) {
            //console.log("will retry setTab later:", tab, reset, tries, switchState);
            return $timeout(function () {
                self.setTab(tab, reset, tries, switchState);
            }, (tries === 1) ? 10 : 300);
        }

        // if (!self.tab || !$state.is('walletHome'))
        //     $rootScope.tab = self.tab = 'walletHome';

        if (switchState && !$state.is('walletHome')) {
            go.path('walletHome', function () {
                changeTab(tab);
            });
            return;
        }

        changeTab(tab);
    };*/

    self.setTab = function (tab) {
        var changeTab = function (tab) {

            go.path(tab);

            $rootScope.tab = self.tab = tab;

            $rootScope.$emit('Local/TabChanged', tab);
        };
        changeTab(tab);
    };

    $rootScope.$on('Local/SetTabDefine',function (event,tab){

        let menuu = self.menu;
        if((self.tab== tab &&!$rootScope.tab) ||$rootScope.tab != tab ){
            for(let item in menuu){
                if(menuu[item].link == tab) {
                    let cc = menuu[item];
                    cc.img = 'active'+cc.img;
                    menuu.splice(item,1,cc);
                }
                if(menuu[item].link == $rootScope.tab) {
                    let cc = menuu[item];
                    cc.img = cc.img.substring(6);
                    menuu.splice(item,1,cc);
                }
                console.log(item+': ',menuu);
            }

        }
        $rootScope.tab = self.tab = tab;
    });

    /**
     * 变更交易的中继节点
     */
    self.changeRelay = function(pubkey){
        try {
            var data = self.relayObject[pubkey];
            self.BTCTOETH  = data.exchangeRatios['BTC:ETH'].toString();
            self.ETHTOBTC  = new bigNumber(1).dividedBy(data.exchangeRatios['BTC:ETH']).toString();
            self.INVETOBTC = data.exchangeRatios['INVE:BTC'].toString();
            self.BTCTOINVE = new bigNumber(1).dividedBy(data.exchangeRatios['INVE:BTC']).toString();
            self.ETHTOINVE = new bigNumber(1).dividedBy(data.exchangeRatios['INVE:ETH']).toString();
            self.INVETOETH = data.exchangeRatios['INVE:ETH'].toString();
            self.exchangeRate = data.feeRatio;
            self.chooseNodeList = data.addresses;
            self.url = data.ip + ':' + data.httpPort;
            self.middleNodeName = (data.name).replace('word','world');
        } catch(err){
            self.showAlert2 = {};
            self.showAlert2.msg = gettextCatalog.getString('The relay node is abnormal. Please select another relay node.');
            self.showAlert = true;
            return;
        }
        return;
    }


    self.resetSendForm = function(){
        /**
         * move
         * 默认设置兑换转出地址信息
         */
        setTimeout(function () {
            let tenexp = /^([a-zA-Z0-9]{10})(.*)([a-zA-Z0-9]{10})$/g;
            self.exTradeOutId = self.walletType.INVE[0].walletId;
            self.exExchangeFromId = self.walletType.INVE[0].walletId;
            self.exExchangeFromStable = self.walletType.INVE[0].stables;
            self.exExchangeFromName = self.walletType.INVE[0].walletName;
            self.exExchangeFromImg = 'inve';
            self.exExchangeFromAddr = self.walletType.INVE[0].address;
            self.exExchangeFromAddrShow = self.walletType.INVE[0].address.replace(tenexp, '$1...$3');
            self.moveRate = self[self.exExchangeFromImg.toUpperCase() + 'TO' + self.exExchangeToImg.toUpperCase()];
            /**
             * move
             * 默认设置兑换转入地址信息
             * @type {*|string}
             */
            self.exExchangeToId = self.walletType.ETH.length > 0 ? self.walletType.ETH[0].walletId: (self.walletType.BTC.length > 0 ? self.walletType.BTC[0].walletId : '');
            self.exExchangeToStable = self.walletType.ETH.length > 0 ? self.walletType.ETH[0].stables:  (self.walletType.BTC.length > 0 ? self.walletType.BTC[0].stables : 0);
            self.exExchangeToName = self.walletType.ETH.length > 0 ? self.walletType.ETH[0].walletName:  (self.walletType.BTC.length > 0 ? self.walletType.BTC[0].walletName : '');
            self.exExchangeToImg = self.walletType.ETH.length > 0 ? 'eth':(self.walletType.BTC.length > 0 ? 'btc' : '');
            self.exExchangeToAddr = self.walletType.ETH.length > 0 ? self.walletType.ETH[0].address:  (self.walletType.BTC.length > 0 ? self.walletType.BTC[0].address : '');
            self.exExchangeToAddrShow = (self.walletType.ETH.length > 0 ? self.walletType.ETH[0].address: (self.walletType.BTC.length > 0 ? self.walletType.BTC[0].address : '')).replace(tenexp, '$1...$3');
            self.moveRateExchange = self[self.exTradeOutImg.toUpperCase() + 'TO' + self.exTradeInImg.toUpperCase()];

            self.showsecnav = 'move';

            self.exExchangeFromStables = '';
            self.exExchangeToStables = '';
            /* self.exTradeOutImg = 'eth';
             self.exTradeInImg = 'inve';
             self.exExchangeFromImg = 'inve';
             self.exExchangeToImg = 'inve';
             self.exTradeToInImg = 'eth';
             self.exTradeToOutImg = 'inve';
             self.exTradeOutStable = '';
             self.exTradeOutName = '';
             self.exTradeInName = '';
             self.exExchangeToStables = '';
             self.exExchangeToName = '';
             self.exExchangeFromName = '';*/
            self.toinAddress = '';
            self.tooutAddress = '';
            /*self.moveRate = self[self.exExchangeFromImg.toUpperCase() + 'TO' + self.exExchangeToImg.toUpperCase()];*/
            /*self.moveRateExchange = self[self.exTradeOutImg.toUpperCase() + 'TO' + self.exTradeInImg.toUpperCase()];*/
            self.exPlaceholderToinAddr = self.exTradeToInImg;
            self.exPlaceholderTooutAddr = self.exTradeToOutImg;
        }, 2000)

    }


    self.setSpendUnconfirmed = function () {
        self.spendUnconfirmed = configService.getSync().wallet.spendUnconfirmed;
    };


    self.openWallet = function () {
        console.log("index.openWallet called");
        var fc = profileService.focusedClient;
        breadcrumbs.add('openWallet ' + fc.credentials.walletId);
        $timeout(function () {
            self.updateError = false;
            fc.openWallet(function onOpenedWallet(err, walletStatus) {
                /*self.setOngoingProcess('openingWallet', false);*/
                if (err)
                    throw "impossible error from openWallet";
                $log.debug('Wallet Opened');
            });
        });
    };



    self.processNewTxs = function (txs,asset) {
        var config = configService.getSync().wallet.settings;
        var now = Math.floor(Date.now() / 1000);
        var ret = [];

        lodash.each(txs, function (tx) {
            tx = txFormatService.processTx(tx,asset);

            // no future transactions...
            if (tx.time > now)
                tx.time = now;
            ret.push(tx);
        });

        return ret;
    };

    self.updateAlias = function () {
        var config = configService.getSync();
        config.aliasFor = config.aliasFor || {};
        self.alias = config.aliasFor[self.walletId];
        var fc = profileService.focusedClient;
        fc.alias = self.alias;
    };

    /**
     * 设置钱包对应头像
     */
    setTimeout(function () {
        self.updateImage();
    });

    self.updateImage = function(){
        var config = configService.getSync();
        var fc = profileService.walletClients;
        config.colorFor = config.colorFor || {};
        config.imageFor = config.imageFor || {};
        for(let item in fc){
            if(!fc[item].image) fc[item].image = './img/rimg/1.png';
            for(let cf in config.imageFor){
                if(item == cf){
                    fc[item].image = config.imageFor[cf];
                    break;
                }
            }
        }
    }
    self.updateColor = function () {
        var config = configService.getSync();
        config.colorFor = config.colorFor || {};
        config.imageFor = config.imageFor || {};
        self.backgroundColor = config.colorFor[self.walletId] || '#4A90E2';
        self.image = config.imageFor[self.walletId] || './img/rimg/1.png';
        var fc = profileService.focusedClient;
        fc.backgroundColor = self.backgroundColor;
        fc.image = self.image;
    };

    self.updateSingleAddressFlag = function () {
        var config = configService.getSync();
        config.isSingleAddress = config.isSingleAddress || {};
        self.isSingleAddress = config.isSingleAddress[self.walletId];
        var fc = profileService.focusedClient;
        fc.isSingleAddress = self.isSingleAddress;
    };

    self.setBalance = function (assocBalances, assocSharedBalances) {
        if (!assocBalances) return;
        var config = configService.getSync().wallet.settings;

        // Selected unit
        self.unitValue = config.unitValue;
        self.unitName = config.unitName;
        self.bbUnitName = config.bbUnitName;

        self.arrBalances = [];
        for (var asset in assocBalances) {
            var balanceInfo = assocBalances[asset];
            balanceInfo.asset = asset;
            balanceInfo.total = balanceInfo.stable + balanceInfo.pending;
            if (assocSharedBalances[asset]) {
                balanceInfo.shared = 0;
                balanceInfo.assocSharedByAddress = {};
                for (var sa in assocSharedBalances[asset]) {
                    var total_on_shared_address = (assocSharedBalances[asset][sa].stable || 0) + (assocSharedBalances[asset][sa].pending || 0);
                    balanceInfo.shared += total_on_shared_address;
                    balanceInfo.assocSharedByAddress[sa] = total_on_shared_address;
                }
            }
            if (balanceInfo.name)
                profileService.assetMetadata[asset] = { decimals: balanceInfo.decimals, name: balanceInfo.name };
            if (asset === "base" || balanceInfo.name) {
                balanceInfo.totalStr = profileService.formatAmountWithUnit(balanceInfo.total, asset);
                balanceInfo.totalStrWithoutUnit = profileService.formatAmount(balanceInfo.total, asset);
                balanceInfo.stableStr = profileService.formatAmountWithUnit(balanceInfo.stable, asset);
                balanceInfo.pendingStr = profileService.formatAmountWithUnitIfShort(balanceInfo.pending, asset);
                if (typeof balanceInfo.shared === 'number')
                    balanceInfo.sharedStr = profileService.formatAmountWithUnitIfShort(balanceInfo.shared, asset);
                if (!balanceInfo.name) {
                    if (!Math.log10) // android 4.4
                        Math.log10 = function (x) { return Math.log(x) * Math.LOG10E; };
                    if (asset === "base") {
                        balanceInfo.name = self.unitName;
                        balanceInfo.decimals = Math.round(Math.log10(config.unitValue));
                    }
                }
            }
            self.arrBalances.push(balanceInfo);
        }
        self.assetIndex = self.assetIndex || 0;
        if (!self.arrBalances[self.assetIndex]) // if no such index in the subwallet, reset to bytes
            self.assetIndex = 0;
        if (!self.shared_address)
            self.arrMainWalletBalances = self.arrBalances;
        /*if (isCordova) {
            alert('indexshow----setBalance');
            wallet.showCompleteClient();
        }*/
        //console.log('========= setBalance done, balances: ' + JSON.stringify(self.arrBalances));
        breadcrumbs.add('setBalance done, balances: ' + JSON.stringify(self.arrBalances));


        $timeout(function () {
            $rootScope.$apply();
        });
    };



    this.csvHistory = function () {

        function saveFile(name, data) {
            var chooser = document.querySelector(name);
            chooser.addEventListener("change", function (evt) {
                var fs = require('fs');
                fs.writeFile(this.value, data, function (err) {
                    if (err) {
                        $log.debug(err);
                    }
                });
            }, false);
            chooser.click();
        }

        function formatDate(date) {
            var dateObj = new Date(date);
            if (!dateObj) {
                $log.debug('Error formating a date');
                return 'DateError'
            }
            if (!dateObj.toJSON()) {
                return '';
            }

            return dateObj.toJSON();
        }

        function formatString(str) {
            if (!str) return '';

            if (str.indexOf('"') !== -1) {
                //replace all
                str = str.replace(new RegExp('"', 'g'), '\'');
            }

            //escaping commas
            str = '\"' + str + '\"';

            return str;
        }

        var step = 6;
        var unique = {};


        if (isCordova) {
            $log.info('CSV generation not available in mobile');
            return;
        }
        var isNode = nodeWebkit.isDefined();
        var fc = profileService.focusedClient;
        var c = fc.credentials;
        if (!fc.isComplete()) return;
        var self = this;
        var allTxs = [];

        $log.debug('Generating CSV from History');
        /*self.setOngoingProcess('generatingCSV', true);*/

        $timeout(function () {
            fc.getTxHistory(self.arrBalances[self.assetIndex].asset, self.shared_address, function (txs) {
                /* self.setOngoingProcess('generatingCSV', false);*/
                $log.debug('Wallet Transaction History:', txs);

                var data = txs;
                var filename = 'inWallet-' + (self.alias || self.walletName) + '.csv';
                var csvContent = '';

                if (!isNode) csvContent = 'data:text/csv;charset=utf-8,';
                csvContent += 'Date,Destination,Note,Amount,Currency,Spot Value,Total Value,Tax Type,Category\n';

                var _amount, _note;
                var dataString;
                data.forEach(function (it, index) {
                    var amount = it.amount;

                    if (it.action == 'moved')
                        amount = 0;

                    _amount = (it.action == 'sent' ? '-' : '') + amount;
                    _note = formatString((it.message ? it.message : '') + ' unit: ' + it.unit);

                    if (it.action == 'moved')
                        _note += ' Moved:' + it.amount

                    dataString = formatDate(it.time * 1000) + ',' + formatString(it.addressTo) + ',' + _note + ',' + _amount + ',byte,,,,';
                    csvContent += dataString + "\n";

                });

                if (isNode) {
                    saveFile('#export_file', csvContent);
                } else {
                    var encodedUri = encodeURI(csvContent);
                    var link = document.createElement("a");
                    link.setAttribute("href", encodedUri);
                    link.setAttribute("download", filename);
                    link.click();
                }
                $timeout(function () {
                    $rootScope.$apply();
                });
            });
        });
    };


    // eventBus.on('transactionList', function (result) {
    //     self.transactionList = result;
    //     //console.log('result: ',result);
    //     self.updateTxHistory();
    // });


    /**
     * 刷新钱包信息：余额，交易记录
     * @param client
     * @param cb
     */
    var count = false;
    self.updateLocalTxHistory = function () {
        let trans = [];
        let fc = profileService.walletClients;
        let ammount_INVE = 0;
        let ammount_BTC = 0;
        let ammount_ETH = 0;
        let ammount_SNC = 0;
        $timeout(function () {
            require('inWalletcore/wallet').getWalletsInfo(function (obj) {
                if(!obj) return self.updateLocalTxHistory();
                self.updateImage();
                let tenexp = /^([a-zA-Z0-9]{10})(.*)([a-zA-Z0-9]{10})$/g;
                obj.forEach(function(tran){
                    for(var item in fc) {
                        if(fc[item].credentials.mnemonicEncrypted  && self.remindNetx)
                            promptBackupService.get(function (res) {
                                if(!res) self.remindbackup = true;
                            });
                        if (tran.wallet == fc[item].credentials.walletId){
                            var walletNameIfo = fc[item].credentials.walletName;
                            var imageIfo = fc[item].image;
                            var mnemonicEncryptedIfo = fc
                                [item].credentials.mnemonicEncrypted;
                            var mnemonic = fc[item].credentials.mnemonic;
                            break;
                        }
                    }
                    let pointLen = (configService.getUnitValue((tran.wallet).split('-')[0].toLowerCase())+"").length-1;
                    var point = (tran.stablesPoint/configService.getUnitValue((tran.wallet).split('-')[0].toLowerCase())).toFixed(pointLen);
                    let stables = (tran.wallet).split('-')[0] == 'BTC' ? new bignumber(tran.stablesInt).plus(point).toString(): new bignumber(tran.stablesInt*configService.getUnitValue((tran.wallet).split('-')[0].toLowerCase())).plus(tran.stablesPoint).toString();
                    trans.push({
                        addressabb :tran.address.replace(tenexp, '$1...$3'),
                        address : tran.address,
                        wallet  : tran.wallet,
                        stablesNmuber  : stables,
                        stabless : stables/configService.getUnitValue((tran.wallet).split('-')[0].toLowerCase()),
                        stables  : profileService.formatAmount(stables,(tran.wallet).split('-')[0].toLowerCase()),
                        walletName : walletNameIfo,
                        image : imageIfo,
                        mnemonicEncrypted: mnemonicEncryptedIfo,
                        mnemonic : mnemonic
                    });
                });
                //self.ammountTatolNmuber = ammount;
                //self.ammountTatol = profileService.formatAmount(ammount,'bytes');
                self.walletInfo = trans;

                //console.log('trans:  ',trans);
                self.walletType = {};
                let transBTC = [];
                let transETH = [];
                let transINVE = [];
                let transSNC = [];
                for(let item in trans) {
                    if(trans[item].wallet.indexOf('BTC-') != -1){
                        ammount_BTC = new bignumber(ammount_BTC).plus(trans[item].stablesNmuber).toString();
                        transBTC.push(trans[item]);
                    }else if(trans[item].wallet.indexOf('ETH-') != -1){
                        ammount_ETH = new bignumber(ammount_ETH).plus(trans[item].stablesNmuber).toString();
                        transETH.push(trans[item]);
                    }else if(trans[item].wallet.indexOf('INVE-') != -1){
                        ammount_INVE = new bignumber(ammount_INVE).plus(trans[item].stablesNmuber).toString();
                        transINVE.push(trans[item]);
                    } else if(trans[item].wallet.indexOf('SNC-') != -1){
                        ammount_SNC = new bignumber(ammount_SNC).plus(trans[item].stablesNmuber).toString();
                        transSNC.push(trans[item]);
                    }
                }
                /**
                 * 统计各种币别余额
                 * 1.未格式化的金额，用于计算等额RMB
                 * 2.格式化后的金额，用于显示单币种金额
                 * @type {{ammount_BTC: {ammount: number, ammountFro: *}, ammount_ETH:
{ammount: number, ammountFro: *}, ammount_INVE: {ammount: number, ammountFro: *}}}
                 */
                self.ammount = {
                    ammount_BTC :{
                        ammount : ammount_BTC/configService.getUnitValue('btc'),
                        ammountFro : profileService.formatAmount(ammount_BTC,'btc')
                    },
                    ammount_ETH :{
                        ammount : ammount_ETH/configService.getUnitValue('eth'),
                        ammountFro : profileService.formatAmount(ammount_ETH,'eth')
                    },
                    ammount_INVE :{
                        ammount : ammount_INVE/configService.getUnitValue('inve'),
                        ammountFro : profileService.formatAmount(ammount_INVE,'inve')
                    },
                    ammount_SNC :{
                        ammount : ammount_SNC,
                        ammountFro : profileService.formatAmount(ammount_SNC,'snc')
                    }
                }
                //console.log('self.ammount',self.ammount)
                //self.ammount_ETH = profileService.formatAmount(ammount_ETH,'eth');
                //self.ammount_INVE = profileService.formatAmount(ammount_INVE,'bytes');
                self.walletType.BTC = transBTC;
                self.walletType.ETH = transETH;
                self.walletType.INVE = transINVE;
                self.walletType.SNC = transSNC;
                //self.exExchangeToImg = self.walletType.ETH.length > 0 ? 'eth' : (self.walletType.BTC.length > 0 ? 'btc' : '');
                if(!self.exExchangeToImg){
                    lodash.forEach(fc,function(uu){
                        let e = lodash.find(uu,{type: "ETH"});
                        let b = lodash.find(uu,{type: "BTC"});
                        if(e) self.exExchangeToImg = "eth";
                        if(b) self.exExchangeToImg = "btc";
                    });
                }

                if(!count || !self.exExchangeFromImg){
                    count = true;
                    /**
                     * move
                     * 默认设置兑换转出地址信息
                     */
                    self.exTradeOutId = transINVE[0].walletId;
                    self.exExchangeFromId = transINVE[0].walletId;
                    self.exExchangeFromStable = transINVE[0].stables;
                    self.exExchangeFromName = transINVE[0].walletName;
                    self.exExchangeFromImg = 'inve';
                    self.exExchangeFromAddr = transINVE[0].address;
                    self.exExchangeFromAddrShow = transINVE[0].address.replace(tenexp, '$1...$3');
                    self.moveRate = self[self.exExchangeFromImg.toUpperCase() + 'TO' + self.exExchangeToImg.toUpperCase()];

                    /**
                     * move
                     * 默认设置兑换转入地址信息
                     * @type {*|string}
                     */
                    //console.log('transETH: ',transETH)
                    self.exExchangeToId = transETH.length > 0 ? transETH[0].walletId: (transBTC.length > 0 ? transBTC[0].walletId : '');
                    self.exExchangeToStable = transETH.length > 0 ? transETH[0].stables:  (transBTC.length > 0 ? transBTC[0].stables : 0);
                    self.exExchangeToName = transETH.length > 0 ? transETH[0].walletName:  (transBTC.length > 0 ? transBTC[0].walletName : '');
                    self.exExchangeToImg = transETH.length > 0 ? 'eth':(transBTC.length > 0 ? 'btc' : '');
                    self.exExchangeToAddr = transETH.length > 0 ? transETH[0].address:  (transBTC.length > 0 ? transBTC[0].address : '');
                    self.exExchangeToAddrShow = (transETH.length > 0 ? transETH[0].address: (transBTC.length > 0 ? transBTC[0].address : '')).replace(tenexp, '$1...$3');
                    self.moveRateExchange = self[self.exTradeOutImg.toUpperCase() + 'TO' + self.exTradeInImg.toUpperCase()];
                }


                let walletInfo = self.walletInfo;
                for(let item in walletInfo){
                    if(walletInfo[item].wallet == profileService.focusedClient.credentials.walletId) {
                        self.stables = walletInfo[item].stables;
                        break;
                    }
                }
                self.txTotal = null;
                self.walletInfomation = {};
                let txTotal = [];
                for(let item in fc){
                    let light = require('inWalletcore/light');
                    light.findTranList(item,function (txs,cb) {
                        //console.log('item',item)
                        for(let sa in txs){
                            let pointLen = (configService.getUnitValue(item.split('-')[0].toLowerCase())+"").length-1;
                            txs[sa].type = txs[sa].type == 0 ? 'tranfer':(txs[sa].type == 1 ? 'move':'exchange');
                            let amount1 = item.indexOf('BTC') != -1 ? txs[sa].amount : txs[sa].amount*configService.getUnitValue(item.split('-')[0].toLowerCase());
                            let amount2 =  item.indexOf('BTC') != -1 ? new bignumber (txs[sa].amount_point.toFixed(pointLen)).dividedBy(configService.getUnitValue(item.split('-')[0].toLowerCase())).toString():txs[sa].amount_point;
                            let num = new bignumber(amount1).plus(amount2).toString();
                            let result = String(num);
                            if (result.indexOf('-') >= 0) {
                                result = '0' + String(Number(result) + 1).substr(1);
                            }
                            txs[sa].amount = result;
                            txTotal.push(txs[sa]);
                        }
                        self.walletInfomation[item] =  item;
                        self.updatingTxHistory = false;
                        if(!txs) self.txHistoryError = true;
                        let newHistory= self.processNewTxs(txs,item.split('-')[0].toLowerCase());
                        self.completeHistory = newHistory;
                        self.walletInfomation[item] = newHistory;
                        self.txHistory = newHistory;
                        //console.log('self.walletInfomation : ',self.walletInfomation );
                        //self.txHistory = newHistory.slice(0, self.historyShowLimit);
                        // console.log('self.txHistory: ',self.txHistory);
                        self.historyShowShowAll = newHistory.length >= self.historyShowLimit;
                        self.txTotal = txTotal;
                        //console.log('txTotal: ',txTotal);
                        $rootScope.$emit('Local/transactionUpdate');
                        self.updateFromStable();
                        $timeout(function () {
                            $rootScope.$apply();
                        });

                    });

                }

            });



        });

    };

    self.showAllHistory = function () {
        self.historyShowShowAll = false;
        self.historyRendering = true;
        $timeout(function () {
            if(!$rootScope.$$phase) $rootScope.$apply();
            $timeout(function () {
                self.historyRendering = false;
                self.txHistory = self.completeHistory;
            }, 100);
        }, 100);
    };


    self.updateHistory = function (retry) {
        // $log.debug('Updating Transaction History');
        self.txHistoryError = false;
        self.updatingTxHistory = true;
        self.txTotal = [];
        self.updateLocalTxHistory();
    };

    self.updateTxHistory = lodash.debounce(function (retry) {
        // console.log('self.updateTxHistory');
        self.updateHistory(retry);
        $rootScope.$emit('Local/BalanceUpdated');
        /*if (isCordova) {
            alert('indexshow---updateTxHistory');
            wallet.showCompleteClient();
        }*/
    }, 1000);

    /**
     * 交易完成后跳转首页
     * @param obj
     */
    $rootScope.$on('Local/paymentDone', function(event){
        //$rootScope.$emit('Local/SetTab', 'walletHome');
        self.updateTxHistory(3);
    });

    $rootScope.$on('Local/addWallets', function(event){
        self.updateTxHistory(3);
    });


    self.onClick = function () {
        console.log('== click');
        self.oldAssetIndex = self.assetIndex;
    };

    // for light clients only
    self.updateHistoryFromNetwork = lodash.throttle(function () {
        setTimeout(function () {
            if (self.assetIndex !== self.oldAssetIndex) // it was a swipe
                return console.log("== swipe");
            console.log('== updateHistoryFromNetwork');
            //todo delete
            // var lightWallet = require('inWalletcore/light_wallet.js');
            // lightWallet.refreshLightClientHistory();
        }, 500);
    }, 5000);

    self.showPopup = function (msg, msg_icon, cb) {
        $log.warn('Showing ' + msg_icon + ' popup:' + msg);
        self.showAlert = {
            msg: msg.toString(),
            msg_icon: msg_icon,
            close: function (err) {
                self.showAlert = null;
                if (cb) return cb(err);
            },
        };
        $timeout(function () {
            $rootScope.$apply();
        });
    };

    self.showErrorPopup = function (msg, cb) {
        $log.warn('Showing err popup:' + msg);
        self.showPopup(msg, 'fi-alert', cb);
    };

    self.openMenu = function () {
        backButton.menuOpened = true;
        go.swipe(true);
    };

    self.closeMenu = function () {
        backButton.menuOpened = false;
        go.swipe();
    };

    self.swipeLeft = function () {
        if (!self.bSwipeSuspended)
            self.openMenu();
        else
            console.log('ignoring swipe');
    };

    self.suspendSwipe = function () {
        if (self.arrBalances.length <= 1)
            return;
        self.bSwipeSuspended = true;
        console.log('suspending swipe');
        $timeout(function () {
            self.bSwipeSuspended = false;
            console.log('resuming swipe');
        }, 100);
    };

    self.retryScan = function () {
        var self = this;
        self.startScan(self.walletId);
    }

    self.startScan = function (walletId) {
        $log.debug('Scanning wallet ' + walletId);
        var c = profileService.walletClients[walletId];
        if (!c.isComplete()) return;
        /*
      if (self.walletId == walletId)
        self.setOngoingProcess('scanning', true);

      c.startScan({
        includeCopayerBranches: true,
      }, function(err) {
        if (err && self.walletId == walletId) {
          self.setOngoingProcess('scanning', false);
          self.handleError(err);
          $rootScope.$apply();
        }
      });
        */
    };

    /**
     * 设置语言
     */
    self.setUxLanguage = function () {
        var userLang = uxLanguage.update();
        self.defaultLanguageIsoCode = userLang;
        self.defaultLanguageName = uxLanguage.getName(userLang);
    };

    /**
     * 设置资讯行情计价货币
     */
    self.setUxCurrency = function () {
        var userCoin = uxCurrency.update();
        self.defaultCurrencyIsoCode = userCoin;
        self.defaultCurrencyName = uxCurrency.getName(userCoin);
    };



    function getNumberOfSelectedSigners() {
        var count = 1; // self
        self.copayers.forEach(function (copayer) {
            if (copayer.signs)
                count++;
        });
        return count;
    }

    self.isEnoughSignersSelected = function () {
        if (self.m === self.n)
            return true;
        return (getNumberOfSelectedSigners() >= self.m);
    };

    self.getWallets = function () {
        return profileService.getWallets('livenet');
    };


    $rootScope.$on('Local/ClearHistory', function (event) {
        $log.debug('The wallet transaction history has been deleted');
        self.txHistory = self.completeHistory = [];
        self.updateHistory();
    });

    $rootScope.$on('Local/AddressbookUpdated', function (event, ab) {
        //self.setAddressbook(ab);
    });

    // UX event handlers
    $rootScope.$on('Local/ColorUpdated', function (event) {
        self.updateColor();
        $timeout(function () {
            $rootScope.$apply();
        });
    });

    $rootScope.$on('Local/AliasUpdated', function (event) {
        self.updateAlias();
        $timeout(function () {
            $rootScope.$apply();
        });
    });

    $rootScope.$on('Local/SingleAddressFlagUpdated', function (event) {
        self.updateSingleAddressFlag();
        $timeout(function () {
            $rootScope.$apply();
        });
    });

    $rootScope.$on('Local/SpendUnconfirmedUpdated', function (event) {
        self.setSpendUnconfirmed();
    });

    $rootScope.$on('Local/ProfileBound', function () {
    });

    $rootScope.$on('Local/NewFocusedWallet', function () {
        self.setUxLanguage();
        self.setUxCurrency();
    });

    $rootScope.$on('Local/LanguageSettingUpdated', function () {
        self.setUxLanguage();
    });

    $rootScope.$on('Local/CurrencySettingUpdated', function () {
        self.setUxCurrency();
    });


    $rootScope.$on('Local/UnitSettingUpdated', function (event) {
        breadcrumbs.add('UnitSettingUpdated');
        self.updateTxHistory(3);
    });

    $rootScope.$on('Local/NeedFreshHistory', function (event) {
        breadcrumbs.add('NeedFreshHistory');
        self.updateTxHistory(3);
    });


    $rootScope.$on('Local/WalletCompleted', function (event) {
        self.setFocusedWallet();
        go.walletHome();
    });


    $rootScope.$on('Local/Resume', function (event) {
        $log.debug('### Resume event');
        //todo delete
        // var lightWallet = require('inWalletcore/light_wallet.js');
        // lightWallet.refreshLightClientHistory();
        //self.debouncedUpdate();
    });

    $rootScope.$on('Local/BackupDone', function (event) {
        self.needsBackup = false;
        $log.debug('Backup done');
        storageService.setBackupFlag('all', function (err) {
            if (err)
                return $log.warn("setBackupFlag failed: " + JSON.stringify(err));
            $log.debug('Backup done stored');
        });
    });

    $rootScope.$on('Local/DeviceError', function (event, err) {
        self.showErrorPopup(err, function () {
            if (self.isCordova && navigator && navigator.app) {
                navigator.app.exitApp();
            }
        });
    });


    $rootScope.$on('Local/WalletImported', function (event, walletId) {
        self.needsBackup = false;
        self.updateTxHistory(3);
        storageService.setBackupFlag(walletId, function () {
            $log.debug('Backup done stored');
            // addressService.expireAddress(walletId, function (err) {
            //     // $timeout(function () {
            //     //     self.txHistory = self.completeHistory = [];
            //     //     //self.startScan(walletId);
            //     // }, 500);
            //
            // });

        });
    });

    $rootScope.$on('NewIncomingTx', function () {
    });



    $rootScope.$on('NewOutgoingTx', function () {
        breadcrumbs.add('NewOutgoingTx');
    });

    lodash.each(['NewTxProposal', 'TxProposalFinallyRejected', 'TxProposalRemoved', 'NewOutgoingTxByThirdParty',
        'Local/NewTxProposal', 'Local/TxProposalAction'
    ], function (eventName) {
        $rootScope.$on(eventName, function (event, untilItChanges) {
        });
    });

    $rootScope.$on('ScanFinished', function () {
        $log.debug('Scan Finished. Updating history');
    });


    $rootScope.$on('Local/NoWallets', function (event) {
        $timeout(function () {
            self.hasProfile = true;
            self.noFocusedWallet = true;
            self.isComplete = null;
            self.walletName = null;
            go.path('preferencesGlobal.import');
        });
    });

    $rootScope.$on('Local/NewFocusedWallet', function (event, cb) {
        console.log('on Local/NewFocusedWallet');
        self.setFocusedWallet(cb);
        self.updateTxHistory(3);
    });

    $rootScope.$on('Local/NewFocusedWalletToPayment', function (event, cb) {
        console.log('Local/NewFocusedWalletToPayment');
        self.setFocusedWallet(cb);
    });

    $rootScope.$on('Local/SetTab', function (event, tab, reset, swtichToHome) {
        self.setTab(tab, reset, null, swtichToHome);
    });

    $rootScope.$on('Local/RequestTouchid', function (event, cb) {
        window.plugins.touchid.verifyFingerprint(
            gettextCatalog.getString('Scan your fingerprint please'),
            function (msg) {
                // OK
                return cb();
            },
            function (msg) {
                // ERROR
                return cb(gettext('Invalid Touch ID'));
            }
        );
    });

    $rootScope.$on('Local/ShowAlert', function (event, msg, msg_icon, cb) {
        self.showPopup(msg, msg_icon, cb);
    });

    $rootScope.$on('Local/ShowErrorAlert', function (event, msg, cb) {
        self.showErrorPopup(msg, cb);
    });

    $rootScope.$on('Local/NeedsPassword', function (event, isSetup, error_message, cb) {
        self.askPassword = {
            isSetup: isSetup,
            error: error_message,
            callback: function (err, pass) {
                self.askPassword = null;
                return cb(err, pass);
            },
        };
        $timeout(function () {
            $rootScope.$apply();
        });
    });

    lodash.each(['NewCopayer', 'CopayerUpdated'], function (eventName) {
        $rootScope.$on(eventName, function () {
            // Re try to open wallet (will triggers)
            self.setFocusedWallet();
        });
    });

    $rootScope.$on('Local/NewEncryptionSetting', function () {
        var fc = profileService.focusedClient;
        self.isPrivKeyEncrypted = fc.isPrivKeyEncrypted();
        self.changePD = false;
        $timeout(function () {
            $rootScope.$apply();
        });
    });

    $rootScope.$on('Local/pushNotificationsReady', function () {
        self.usePushNotifications = true;
        $timeout(function () {
            $rootScope.$apply();
        });
    });

    /**
     * 生成待授权二维码
     */
    $rootScope.$on('Local/ShadowAddress', function(event,address){
        self.signatureAddr = address;
        setTimeout(function () {
            $rootScope.$apply()
        })

    });

    /**
     * 生成授权签名二维码
     */
    $rootScope.$on('Local/ShadowAddressForm', function(event,address){
        var shadowWallet = require('inWalletcore/shadowWallet');
        shadowWallet.getSignatureCode(address,function(signatureCodeQRCode) {
            if(typeof signatureCodeQRCode == "object"){
                self.signatureCodeQRCode = JSON.stringify(signatureCodeQRCode);
                self.showshadow = true;
                self.shadowstep = 'hot2';
                console.log(signatureCodeQRCode);
            }else{
                $rootScope.$emit('Local/ShowErrorAlert', gettextCatalog.getString("The address: ")+gettextCatalog.getString(signatureCodeQRCode));
            }
            $timeout(function () {
                $rootScope.$apply();
            });
        });
    });

    /**
     * 冷钱包授权签名详情
     */
    $rootScope.$on('Local/ShadowSignInvitation', function(event,signatureDetlCode){
        self.signatureDetlCodeAddr = signatureDetlCode.addr;
        self.sinatureRandom = signatureDetlCode.random;
        self.signatureDetlCode = JSON.stringify(signatureDetlCode);
        self.showshadow = true;
        self.shadowstep = 'cold1';
        $timeout(function () {
            $rootScope.$apply();
        });
    });

    /**
     * 热钱包扫描授权签名详情
     */
    $rootScope.$on('Local/generateShadowWallet', function(event,shadowWallet){
        self.signatureData = shadowWallet.sign;
        self.shadowWallet = JSON.stringify(shadowWallet);
        self.shadowstep = 'hot3';
        $timeout(function () {
            $rootScope.$apply();
        });
    });

    /**
     * 热钱包生成未签名的交易二维码
     */
    $rootScope.$on('Local/unsignedTransactionIfo', function(event,unsignedTransactionIfo){
        self.unsignedTransactionIfo = JSON.stringify(unsignedTransactionIfo);
        self.showshadow = true;
        self.shadowstep = 'hsend1';
        $timeout(function () {
            $rootScope.$apply();
        });
    });

    /**
     * 热钱包生成已签名的交易信息
     */
    $rootScope.$on('Local/signedTransactionIfoHot', function(event,signedTransactionIfo){
        self.signatureIfo = signedTransactionIfo.signature;
        self.signedTransactionIfo = JSON.stringify(signedTransactionIfo);
        self.showshadow = true;
        self.shadowstep = 'hsend2';
        $timeout(function () {
            $rootScope.$apply();
        });
    });

    /**
     * 冷钱包扫码后，展示预览交易信息
     */
    $rootScope.$on('Local/showUnsignedTransactionIfo', function(event,showUnsignedTransactionIfo){
        self.showUnsignedTransactionIfoObj = showUnsignedTransactionIfo;
        self.showUnsignedTransactionInfo = JSON.stringify(showUnsignedTransactionIfo);
        self.ShowAmount = profileService.formatAmount(parseInt(showUnsignedTransactionIfo.amount),'bytes');
        self.showshadow = true;
        self.showshadow100 = true;
        self.shadowstep = 'csend1';
        $timeout(function () {
            $rootScope.$apply();
        });
    });

    /**
     * 冷钱包点击授权签名后，生成对应二维码
     * @param obj
     */
    $rootScope.$on('Local/signedTransactionIfo', function(event,signedTransactionIfo){
        self.signedTransactionIfo = JSON.stringify(signedTransactionIfo);
        self.showshadow = true;
        self.shadowstep = 'csend2';
        $timeout(function () {
            $rootScope.$apply();
        });
    });

    /**
     * 在聊天窗口点击【转账完成信息】后触发
     * @type {*|(function())|angular.noop}
     */
    var openTranInfoListener = $rootScope.$on('openTranInfo',function (event,tranId) {
        console.log('openTranInfoListener')
        let db = require('inWalletcore/db');
        $scope.btx = {};
        db.query('SELECT * FROM transactions WHERE id=?',[tranId],function (rows) {
            if(rows.length == 1){
                $scope.btx.id = rows[0].id;
                $scope.btx.creation_date = rows[0].creation_date;
                $scope.btx.amountTl = rows[0].amount+rows[0].amount_point/configService.getUnitValue('inve');
                $scope.btx.amountStr = rows[0].amount+rows[0].amount_point/configService.getUnitValue('inve') +' INVE';
                $scope.btx.feeStr = profileService.formatAmount(rows[0].fee*configService.getUnitValue('inve')+rows[0].fee_point,'inve')+ ' INVE';
                $scope.btx.addressTo = rows[0].addressTo;
                $scope.btx.addressFrom = rows[0].addressFrom;
                $scope.btx.time = rows[0].creation_date;
                $scope.btx.confirmations = rows[0].result;
                $scope.btx.result = rows[0].result;
                $scope.btx.asset = 'base';
                $scope.btx.action = 'received';
                $scope.btx.type = 'tranfer';
                $scope.btx.sType = rows[0].sType;
                $scope.btx.eType = rows[0].eType;
                self.openTxModal($scope.btx);
            }
        });
    });

    /**
     * 点击交易记录跳转到单笔交易详情
     * @param btx
     */
    self.openTxModal = function(btx) {
        console.log(btx)
        let walletInfo = self.walletInfo;
        for(let item in walletInfo){
            /**
             * 发送地址钱包名字
             */
            if(walletInfo[item].address == btx.addressFrom){
                btx.fromName = walletInfo[item].walletName;
            }
            /**
             * 转移收款钱包名字
             */
            if(walletInfo[item].address == btx.addressTo){
                btx.toName = walletInfo[item].walletName;
            }
        }
        $rootScope.modalOpened = true;
        let ModalInstanceCtrl = function($scope, $modalInstance) {
            $scope.btx = btx;
            $scope.btx.defaultLanguageIsoCode = self.defaultLanguageIsoCode;
            $scope.cancel = function() {
                breadcrumbs.add('dismiss tx details');
                try {
                    $modalInstance.dismiss('cancel');
                }
                catch (e) {
                }
            };
            $scope.copyAddress = function(addr,$event) {
                $event.stopImmediatePropagation();
                if (isCordova) {
                    window.cordova.plugins.clipboard.copy(addr);
                    window.plugins.toast.showShortCenter(gettextCatalog.getString('Successful copy'));
                }
                else if (nodeWebkit.isDefined()) {
                    return false;
                }
            };
        };

        let modalInstance = $modal.open({
            templateUrl: 'views/modals/tx-details.html',
            windowClass: animationService.modalAnimated.slideRight,
            controller: ModalInstanceCtrl,
        });

        let disableCloseModal = $rootScope.$on('closeModal', function() {
            breadcrumbs.add('on closeModal tx details');
            modalInstance.dismiss('cancel');
        });

        modalInstance.result.finally(function() {
            $rootScope.modalOpened = false;
            disableCloseModal();
            let m = angular.element(document.getElementsByClassName('reveal-modal'));
            m.addClass(animationService.modalAnimated.slideOutRight);
        });
    };

    /**
     * 根据当前地址生成对应二维码
     * @param address
     */
    self.generatePubkey =  function (address) {
        self.verificationAddress = "inWallet:"+address;
        self.showshadow = true;
        self.shadowstep = 'hot1';
        $timeout(function () {
            $rootScope.$apply();
        });

    };

    if (navigator.onLine) {
        self.online = true;
    } else {
        self.online = false;
    }


    /**
     * 备份助记词：点击下次再说执行
     */
    self.remindClose = function () {
        self.remindbackup = false;
        self.remindNetx = false;
    }

    /**
     * 备份助记词：点击不再显示执行
     */
    self.remind = function () {
        self.remindbackup = false;
        promptBackupService.set();
    }

    self.goDestination = function(addr, page, walletType, walletId, address, walletName){
        $state.go('destination-address',{addr:addr, page:page, walletType:walletType, walletId:walletId, address:address, walletName:walletName});
    }

    let news = require("inWalletcore/newsServers");

    /**
     * 获取BTC、ETH市价
     */
    news.getCurrencyData(6,1,null,function(res) {
        if(!!res) {
            self.coinlists = res.page.list;
            self.coinlist = res.page.list;
            /**
             * usd
             */
            self.coinBtcPrice = self.coinlist[0].price;
            self.coinEthPrice = self.coinlist[1].price;

            /**
             * rmb
             */
            self.coinBtcPricecy = self.coinlist[0].price * news.getRate();
            self.coinEthPricecy = self.coinlist[1].price * news.getRate();
            $timeout(function () {
                $scope.$apply();
            })
        }
    })
    /**
     * 获取INVE市价
     */
    self.updateInvePrice = function(){
        news.getInveData2(function (res) {
            if (!!res && res != null) {
                self.invedollar = res.page.list.INVE.price;//usd
                self.invermb = res.page.list.INVE.cnyPrice;//rmb
                $timeout(function(){
                    $scope.$apply();
                })
            }
        });
    }

    self.updateInvePrice();

    /**
     *定时更新
     * @type {number}
     */
    var updateInvePrice = setInterval(function () {
        self.updateInvePrice();
    }, 5 * 1000);




    /**
     * 浏览器默认的路由返回
     */
    self.gobackDeft = function () {
        $rootScope.back();
    }

    /**
     * 回退到上一个页面
     */
    /*self.gobackDeft = function(){
        var  url = historyUrlService.getBackUrl();
        if(url == ""){
            historyUrlService.goUrlByState("walletHome");
        }else{
            historyUrlService.goUrlBuyUrl(url);
        }
    }*/

    /**
     * 相同设备地址登录多个设备时
     */
    eventBus.on('sameDeviceAddress',function (res) {
        $rootScope.$emit('Local/ShowErrorAlert', gettextCatalog.getString('device address {{deviceAddress}} log in to multiple devices with the same device address'),{
            deviceAddress:res
        });
    });

    self.tabChange = function (from) {
        $rootScope.tabFrom = from;
    }


    self.toggleAllQian = function(){
        if(self.defaultShowQian) self.defaultShowQian = false;
        else self.defaultShowQian = true;
        storageService.setEye({eye:self.defaultShowQian}, function(err) {
            storageService.getEye(function (res) {
                /*console.log('eye:',res.eye)*/
            })
            //$scope.$emit('Local/ShowQianUpdated');
        });
    }

    /**
     * 实时刷新交易页面，fromAddress stables
     */
    self.updateFromStable = function(){
        let imgFrom = self.exExchangeFromImg;
        let unitFrom =  self.walletType[imgFrom.toUpperCase()];
        let indexFrom = lodash.findIndex(unitFrom,function (res) {
            res.wallet ==self.exExchangeFromId
        });
        self.exExchangeFromStable = indexFrom >= 0 ? unitFrom[indexFrom].stables : unitFrom[0].stables;

    }

    /**
     * 钱包内页返回首页，首页滚动到选择钱包处
     */
    $rootScope.$on('Local/homeScrollToWallet', function(event, wallettype, walletid){
        var el = angular.element(document.getElementById(wallettype+'-homelist'));
        angular.element(el[0].nextElementSibling).removeClass('downHeightOut');
        angular.element(el[0].nextElementSibling).removeClass('ng-hide');
        angular.element(el[0].nextElementSibling).addClass('downHeightIn');
        el.removeClass('rotateimgback');
        el.addClass('rotateimg');
        $timeout(function () {
            $location.hash(wallettype+'-'+walletid);
            $anchorScroll();
            $rootScope.$apply();
        });
    });

    /**
     * 接受nrgPrice
     */
    eventBus.on('nrgPrice',function (res) {
        self.nrgPrice = res;
    });

    self.resetTransactions = function () {
        var arrQueries = [];
        db.addQuery(arrQueries, "DELETE FROM transactions_index");
        db.addQuery(arrQueries, "DELETE FROM transactions");
        async.series(arrQueries, function (err, res) {
            require('inWalletcore/light.js').updateStatu()
            $state.go('walletHome')
        });
    }

});
