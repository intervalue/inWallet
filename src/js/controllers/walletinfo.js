'use strict';

angular.module('copayApp.controllers').controller('walletinfoController',
    function($state, $stateParams, $scope, $rootScope, profileService, $timeout, lodash, txFormatService, $modal, animationService, configService, isCordova, nodeWebkit, gettext, gettextCatalog, go ) {
        let self = this;
        let tenexp = /^([a-zA-Z0-9]{10})(.*)([a-zA-Z0-9]{10})$/g;
        self.walletId = $stateParams.walletId;
        self.walletType = $stateParams.walletType;
        self.address = $stateParams.address;
        self.addressabb = self.address.replace(tenexp, '$1...$3');
        self.name = $stateParams.name;
        self.image = $stateParams.image;
        self.ammount = $stateParams.ammount;
        self.mnemonic = $stateParams.mnemonic;
        self.mnemonicEncrypted = $stateParams.mnemonicEncrypted;
        self.historyShowLimit = 10;
        self.historyShowShowAll = false;
        self.walletNameInfo =self.walletType;
        var indexScope = $scope.index;
        let configWallets = configService.defaultImages;

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
                    $scope.$apply()
                },1500);
            }
        };

        /**
         * 判断当前钱包，设置钱包灰色背景
         * @param
         */
        for(let item in configWallets){
            if(item == self.walletType) {
                self.walletBg = configWallets[item][2];
                self.walletTypeShort = configWallets[item][2];
            }
        }


        /**
         * 根据地址查询相关信息
         */
        self.transactionInfo = function () {
            self.tranInfo = $scope.index.walletInfo;
            let tranInfo = self.tranInfo;
            //console.log("tranInfo====",tranInfo)
            for(let item in tranInfo){
                if(tranInfo[item].address == self.address){
                    self.address = tranInfo[item].address;
                    self.wallet  = tranInfo[item].wallet;
                    self.stables  = tranInfo[item].stables;
                    self.walletName = tranInfo[item].walletName;
                    self.image = tranInfo[item].image;
                    self.mnemonicEncrypted = tranInfo[item].mnemonicEncrypted;
                    self.mnemonic =tranInfo[item].mnemonic;
                    break;
                }
            }
        }

        /**
         * 首次显示交易记录10笔
         */
        self.updateTxHistory = function(){
            self.walletInfomation = $scope.index.walletInfomation;
            let walletInfo = self.walletInfomation;
            let newHistory;
            for(let item in walletInfo) {
                if(self.walletId == item)  newHistory = walletInfo[item];
            }
            if(!newHistory) {
                self.txHistoryError = true;
                return;
            }
            self.txHistoryError = false;
            self.txHistory = newHistory.slice(0, self.historyShowLimit);
            self.completeHistory = newHistory;
            $timeout(function () {
                $scope.$apply();
            });
            self.historyShowShowAll = newHistory.length >= self.historyShowLimit;

        }

        /**
         * 点击show all后显示所有交易记录
         */
        self.showAllHistory = function () {
            self.historyShowShowAll = false;
            self.historyRendering = true;
            $timeout(function () {
                self.historyRendering = false;
                self.txHistory = self.completeHistory;
                $rootScope.$apply();
            }, 100);
        }

        //TODO 发送交易完成后，应跳转到哪个页面?
        /**
         * 发送交易后，同步更新交易记录
         * @param obj
         */
        var paymentDone = $rootScope.$on('Local/paymentDone', function(){
            self.updateTxHistory();
            self.transactionInfo();
        });

        /**
         * 新增交易记录时，同步更新交易记录显示
         */
        var transactionUpdate = $rootScope.$on('Local/transactionUpdate',function () {
            self.updateTxHistory();
            self.transactionInfo();
        });

        /**
         * 跳转到收款二维码页面
         * @param booleanPay
         */
        self.goReceive = function(booleanPay, walletType, walletId, addr, name, image, ammount, mnemonic, mnemonicEncrypted){
            $state.go('receive', { booleanPay: booleanPay, walletType: walletType, walletId: walletId, address: addr, name: name, image: image, ammount: ammount, mnemonic: mnemonic, mnemonicEncrypted: mnemonicEncrypted });
        };
        /**
         * 跳转到首页并展开定位到当前钱包
         * @param walletType, walletId
         */
        self.goHome = function(walletType, walletId){
            go.path('walletHome', function(){
                $rootScope.$emit('Local/homeScrollToWallet', walletType, walletId);
            })
        }
        /**
         * 跳转到首页转移页面
         * @param booleanPay
         */
        self.goSend = function(){
            go.send();
        };

        self.towalletname = function (walletType, walletId, addr, name, image, ammount, mnemonic, mnemonicEncrypted) {
            $state.go('walletname', { walletType: walletType, walletId: walletId, address: addr, name: name, image: image, ammount: ammount, mnemonic: mnemonic, mnemonicEncrypted: mnemonicEncrypted });
        };

        self.goSendPage = function(walletType, walletId, addr, name, image, ammount, mnemonic, mnemonicEncrypted){
            $state.go('transfer', { walletType: walletType, walletId: walletId, address: addr, name: name, image: image, ammount: ammount, mnemonic: mnemonic, mnemonicEncrypted: mnemonicEncrypted });
        };

        self.goBack = function(walletType, walletId, addr, name, image, ammount, mnemonic, mnemonicEncrypted){
            $state.go('backup', { walletType: walletType, walletId: walletId, address: addr, name: name, image: image, ammount: ammount, mnemonic: mnemonic, mnemonicEncrypted: mnemonicEncrypted });
        };

        $scope.$on('$destroy', function() {
            paymentDone();
            transactionUpdate();
        });


    });