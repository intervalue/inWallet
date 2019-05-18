'use strict';

angular.module('copayApp.controllers').controller('addwalletController',
    function ($rootScope, $scope, $timeout, storageService, notification, profileService, bwcService, $log, gettext, go, gettextCatalog, isCordova) {
        var self = this;
        var successMsg = gettext('Backup words deleted');
        var indexScope = $scope.index;
        self.aiwname = '';
        self.aiwpass = '';
        self.aiwrpass = '';
        self.chosenWords = [];
        self.showcodes = [];
        self.showrandamcodes = [];
        self.mnemonic = '';
        self.showcodeerr = false;
        self.addwalleterr = false;
        self.showconfirm = false;
        self.showtab = 'tabcold';
        //表单验证
        self.formvalidatename = false;
        self.formvalidatepass = false;
        self.formvalidaterpass = false;
        var fc = profileService.focusedClient;
        var walletClient = bwcService.getClient();
        self.ducodes = walletClient.createRandomMnemonic().split(' ');
        //乱序
        self.shuffle = function (v) {
            for (var j, x, i = v.length; i; j = parseInt(Math.random() * i), x = v[--i], v[i] = v[j], v[j] = x);
            return v;
        };
        // 定义提示框内容
        self.funReg = function () {
            var newlist = [];
            if (self.showrandamcodes.length > 3) {
                // 显示乱序提示框
                self.showrandamcodes = self.shuffle(JSON.parse(JSON.stringify(self.showrandamcodes)));
                // 显示乱序提示框  结束
                return false;
            } else {
                for (var i = 0; i <= 11; i++) {
                    var newStr = {
                        id: i,
                        str: self.ducodes[i],
                        chosen: false
                    };
                    newlist.push(newStr);
                }
                self.showcodes = JSON.parse(JSON.stringify(newlist));
                self.showrandamcodes = self.shuffle(JSON.parse(JSON.stringify(newlist)));
            }
            $timeout(function () {
                $scope.$digest();
            });
        };
        // 定义提示框内容  结束
        self.addwordf = function ($event) {
            self.showcodeerr = false;
            if ($event.srcElement.tagName == 'BUTTON') {
                self.showrandamcodes.forEach(function (item, index) {
                    if (item.id == $event.srcElement.id) {
                        self.showrandamcodes[index].chosen = true;
                        self.chosenWords.push({
                            id: item.id,
                            str: item.str
                        })
                    }
                });
            } else {
                return false;
            }
            self.watchchose();
        }
        self.minuswordf = function ($event) {
            self.showcodeerr = false;
            if ($event.srcElement.tagName == 'SPAN') {
                self.showrandamcodes.forEach(function (item, index) {
                    if (item.id == $event.srcElement.id) {
                        self.showrandamcodes[index].chosen = false;
                    }
                });
                self.chosenWords.forEach(function (item, index) {
                    if (item.id == $event.srcElement.id) {
                        self.chosenWords.splice(index, 1);
                    };
                })
            } else {
                return false;
            }
            self.watchchose();
        };
        self.watchchose = function(){
            if (self.chosenWords.length > 11) {
                var chostr = '';
                for (var i = 0; i < self.chosenWords.length; i++) {
                    chostr += self.chosenWords[i].str;
                }
                var showstr = '';
                for (var i = 0; i < self.showcodes.length; i++) {
                    showstr += self.showcodes[i].str;
                }
                if (chostr == showstr) {
                    for (var i = 0; i < self.showcodes.length; i++) {
                        self.mnemonic += ' ' + self.showcodes[i].str;
                    }
                    self.step = 'deletecode';
                } else {
                    self.showcodeerr = true;
                }
            }else{
                return;
            }
        }

        /**
         * 创建钱包
         * @param walletName
         * @param password
         * @param passphrase
         * @param mnemonic
         * @param del
         */
        self.addWallet = function (walletName, password, passphrase, mnemonic,del) {
            if(password !== passphrase){
                $rootScope.$emit('Local/ShowErrorAlert', gettextCatalog.getString('*Inconsistent password'));
                return;
            }
            mnemonic = mnemonic.trim();
            if (self.creatingProfile)
                return console.log('already creating profile');
            self.creatingProfile = true;
            if (isCordova)
                window.plugins.spinnerDialog.show(null, gettextCatalog.getString('Loading...'), true);
            else{
                $scope.index.progressing = true;
                $scope.index.progressingmsg = 'Loading...';
            }
            let networkName = indexScope.type =='BTC' ? 'livenet' : 'livenet';
            //{ walletName: walletName, password: passphrase, mnemonic: mnemonic, type:'INVE' }
            setTimeout(function () {
                profileService.importWallets({
                    name: walletName,
                    password: passphrase,
                    passphrase: '',
                    mnemonic: mnemonic,
                    m: 1,
                    n: 1,
                    networkName: networkName,
                    cosigners: [],
                    isSinglecreateress: true,
                    type: indexScope.type,
                    segwit: true,
                    info: ''
                }, function (err, walletId) {
                    $timeout(function () {
                        if (indexScope.type != 'BTC') {
                            if (isCordova)
                                window.plugins.spinnerDialog.hide();
                            else
                                $scope.index.progressing = false;
                        }
                        if (err) {
                            self.creatingProfile = false;
                            $log.warn(err);
                            self.error = err;
                            $timeout(function () {
                                $scope.$apply();
                            });
                        }
                        else if (del) {
                            //$rootScope.$emit('Local/WalletImported', walletId);
                            var fc = profileService.focusedClient;
                            fc.clearMnemonic();
                            profileService.clearMnemonic(function () {
                                self.deleted = true;
                                notification.success(successMsg);
                            });
                        }
                        notification.success(gettextCatalog.getString('Success'), gettextCatalog.getString('successfully create wallet "{{walletName}}"', {
                            walletName: walletName
                        }));
                        importAfterDo[indexScope.type] ? importAfterDo[indexScope.type].do() : importAfterDo['INVE'].do();
                    });

                });
            });
        };

        var rpcHelper = require('inWalletcore/HDWallet/btc_rpcHelper');
        var importAfterDo = {
            'INVE': {
                do: function(){
                    $rootScope.$emit('Local/addWallets');
                    go.walletHome();
                }
            },
            'BTC': {
                do: function(){
                        if (self.page == 'addwallet'){
                            var address = profileService.focusedClient.credentials.otherObject.addressList[0];
                            rpcHelper.importAddress(address, address, function(err, res) {
                                if (isCordova)
                                    window.plugins.spinnerDialog.hide();
                                else
                                    $scope.index.progressing = false;
                                $rootScope.$emit('Local/addWallets');
                                go.walletHome();
                            }, false, 'now');
                        } else {
                            $rootScope.$emit('Local/addWallets');
                            go.walletHome();
                        }
                }
            },
            'ETH': {
                do: function(){
                    $rootScope.$emit('Local/addWallets');
                    go.walletHome();
                }
            }
        }


        /**
         * 输入框的验证，名称验证
         */
        self.validateName = function( $event ){
            // var val = $event.srcElement.value;
            var val = self.aiwname;
            var vdparent = $event.srcElement.parentElement.parentElement;
            var vderrp = $event.srcElement.parentElement.nextElementSibling;
            if(typeof(val) == 'undefined'){
                angular.element(vdparent).removeClass('setErrorexp');
                self.formvalidatename = false;
            }else if(val == ''){
                angular.element(vdparent).removeClass('setErrorexp');
                self.formvalidatename = false;
            }else if(val.length < 1 || val.length > 20){
                angular.element(vdparent).addClass('setErrorexp');
                angular.element(vderrp).html(gettextCatalog.getString('*Characters exceed the 1-20 limit!'));
                self.formvalidatename = false;
            }else{
                angular.element(vdparent).removeClass('setErrorexp');
                self.formvalidatename = true;
            }
            $timeout(function(){
                $scope.$apply();
            })
        }
        /**
         * 输入框的验证，密码验证
         */
        self.validatePass = function( $event ){
            var val = self.aiwpass;
            var vdparent = $event.srcElement.parentElement.parentElement;
            var vderrp = $event.srcElement.parentElement.nextElementSibling;
            var trimeasyExp=/^(([a-z]){8,18}|([A-Z]){8,18}|([0-9]){8,18})$/;
            if(typeof(val) == 'undefined'){
                angular.element(vdparent).removeClass('setErrorexp');
                angular.element(vdparent).removeClass('setWarmErrorexp');
                self.formvalidatepass = false;
            }else if(val == ''){
                angular.element(vdparent).removeClass('setErrorexp');
                angular.element(vdparent).removeClass('setWarmErrorexp');
                self.formvalidatepass = false;
            }else if(val.length > 18 || val.length < 8){
                angular.element(vdparent).removeClass('setWarmErrorexp');
                angular.element(vdparent).addClass('setErrorexp');
                angular.element(vderrp).html(gettextCatalog.getString('*Password cannot less than 8 digits or exceed 18 digits!'));
                self.formvalidatepass = false;
            }else if(trimeasyExp.test(val)){
                angular.element(vdparent).addClass('setWarmErrorexp');
                angular.element(vdparent).removeClass('setErrorexp');
                angular.element(vderrp).html(gettextCatalog.getString('*The password is too simple, it is recommended to mix uppercase and lowercase letters, numbers, special characters!'));
                self.formvalidatepass = true;
            }else{
                angular.element(vdparent).removeClass('setErrorexp');
                angular.element(vdparent).removeClass('setWarmErrorexp');
                self.formvalidatepass = true;
            }
            $timeout(function(){
                $scope.$apply();
            })
        }
        /**
         * 输入框的验证，重复密码验证
         */
        self.validateRpass = function( $event ){
            var val = self.aiwrpass;
            var vdparent = $event.srcElement.parentElement.parentElement;
            var vderrp = $event.srcElement.parentElement.nextElementSibling;
            if(typeof(val) == 'undefined'){
                angular.element(vdparent).removeClass('setErrorexp');
                self.formvalidaterpass = false;
            }else if(val == ''){
                angular.element(vdparent).removeClass('setErrorexp');
                self.formvalidaterpass = false;
            }else if(self.aiwrpass !== self.aiwpass){
                angular.element(vdparent).addClass('setErrorexp');
                angular.element(vderrp).html(gettextCatalog.getString('*Inconsistent password'));
                self.formvalidaterpass = false;
            }else{
                angular.element(vdparent).removeClass('setErrorexp');
                self.formvalidaterpass = true;
            }
            $timeout(function(){
                $scope.$apply();
            })
        }
    });