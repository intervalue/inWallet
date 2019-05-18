'use strict';

angular.module('copayApp.controllers').controller('createwalletController',
    function ($rootScope, $scope, $timeout, storageService, notification, profileService, bwcService, $log,gettext,go,gettextCatalog,isCordova) {
        var self = this;
        var successMsg = gettext('Backup words deleted');
        var indexScope = $scope.index;
        self.createwname = '';
        self.createwpass = '';
        self.createwrpass = '';
        self.createwipass = '';
        self.createwiname = '';
        self.importcode = '';
        self.createwirpass = '';
        self.chosenWords = [];
        self.showcodes = [];
        self.showrandamcodes = [];
        self.mnemonic = '';
        self.showcodeerr = false;
        self.createwalleterr = false;
        self.showconfirm = false;
        self.showtab = 'tabcold';
        //表单验证
        self.formvalidatename = false;
        self.formvalidatepass = false;
        self.formvalidaterpass = false;
        //表单验证import
        self.formvalidatenamei = false;
        self.formvalidatepassi = false;
        self.formvalidaterpassi = false;
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
        self.createwordf = function ($event) {
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
         * 首次创建钱包入口
         * @param walletName
         * @param password
         * @param passphrase
         * @param mnemonic
         * @param del
         */
        self.createWallet= function (walletName, password, passphrase, mnemonic,del) {
            console.log('start createwallet======')
            if(password !== passphrase){
                $rootScope.$emit('Local/ShowErrorAlert', gettextCatalog.getString('*Inconsistent password'));
                return;
            }
            mnemonic = mnemonic.trim();
            if (isCordova)
                window.plugins.spinnerDialog.show(null, gettextCatalog.getString('Loading...'), true);
            else{
                $scope.index.progressing = true;
                $scope.index.progressingmsg = 'Loading...';
            }

            // $scope.loading = true;
            setTimeout(function () {
                profileService.createNewWallets({ walletName: walletName, password: passphrase, mnemonic: mnemonic, type:'INVE' }, function (err) {
                    $timeout(function () {
                        if (isCordova)
                            window.plugins.spinnerDialog.hide();
                        else
                            $scope.index.progressing = false;

                        if (err) {
                            $log.warn(err);
                            self.error = err;
                            $timeout(function () {
                                $rootScope.$apply();
                            });
                            return;
                        } else if(del){
                            var fc = profileService.focusedClient;
                            fc.clearMnemonic();
                            profileService.clearMnemonic(function()  {
                                self.deleted = true;
                                notification.success(successMsg);
                            });
                        }
                        go.walletHome();
                    });
                });
            })

        };

        /**
         * 首次导入钱包入口
         */
        self.importw = function(){
            if(self.addwipass !== self.addwirpass){
                $rootScope.$emit('Local/ShowErrorAlert', gettextCatalog.getString('*Inconsistent password'));
                return;
            }
            if (isCordova)
                window.plugins.spinnerDialog.show(null, gettextCatalog.getString('Loading...'), true);
            else{
                $scope.index.progressing = true;
                $scope.index.progressingmsg = 'Loading...';
            }

            setTimeout(function () {
                profileService.createNewWallets({ walletName: self.createwiname, password: self.createwipass, mnemonic: self.importcode ,type:'INVE'}, function (err) {
                    $timeout(function () {
                        if (isCordova)
                            window.plugins.spinnerDialog.hide();
                        else
                            $scope.index.progressing = false;

                        if(err){
                            self.creatingProfile = false;
                            $log.warn(err);
                            self.error = err;
                            $rootScope.$emit('Local/ShowErrorAlert', err);
                            $timeout(function () {
                                $scope.$apply();
                            });
                        }
                        go.walletHome();
                    });

                });
            })

        }



        self.setSendError = function(err) {
            return $rootScope.$emit('Local/ShowErrorAlert', err);
        };

        /**
         * 输入框的验证，名称验证
         */
        self.validateName = function( $event ){
            // var val = $event.srcElement.value;
            var val = self.createwname;
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
            var val = self.createwpass;
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
            var val = self.createwrpass;
            var vdparent = $event.srcElement.parentElement.parentElement;
            var vderrp = $event.srcElement.parentElement.nextElementSibling;
            if(typeof(val) == 'undefined'){
                angular.element(vdparent).removeClass('setErrorexp');
                self.formvalidaterpass = false;
            }else if(val == ''){
                angular.element(vdparent).removeClass('setErrorexp');
                self.formvalidaterpass = false;
            }else if(self.createwrpass !== self.createwpass){
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

        /**
         * 输入框的验证，名称验证
         */
        self.validateNamei = function( $event ){
            // var val = $event.srcElement.value;
            var val = self.createwiname;
            var vdparent = $event.srcElement.parentElement.parentElement;
            var vderrp = $event.srcElement.parentElement.nextElementSibling;
            if(typeof(val) == 'undefined'){
                angular.element(vdparent).removeClass('setErrorexp');
                self.formvalidatenamei = false;
            }else if(val == ''){
                angular.element(vdparent).removeClass('setErrorexp');
                self.formvalidatenamei = false;
            }else if(val.length < 1 || val.length > 20){
                angular.element(vdparent).addClass('setErrorexp');
                angular.element(vderrp).html(gettextCatalog.getString('*Characters exceed the 1-20 limit!'));
                self.formvalidatenamei = false;
            }else{
                angular.element(vdparent).removeClass('setErrorexp');
                self.formvalidatenamei = true;
            }
            $timeout(function(){
                $scope.$apply();
            })
        }
        /**
         * 输入框的验证，密码验证
         */
        self.validatePassi = function( $event ){
            var val = self.createwipass;
            var vdparent = $event.srcElement.parentElement.parentElement;
            var vderrp = $event.srcElement.parentElement.nextElementSibling;
            var trimeasyExp=/^(([a-z]){8,18}|([A-Z]){8,18}|([0-9]){8,18})$/;
            if(typeof(val) == 'undefined'){
                angular.element(vdparent).removeClass('setErrorexp');
                angular.element(vdparent).removeClass('setWarmErrorexp');
                self.formvalidatepassi = false;
            }else if(val == ''){
                angular.element(vdparent).removeClass('setErrorexp');
                angular.element(vdparent).removeClass('setWarmErrorexp');
                self.formvalidatepassi = false;
            }else if(val.length > 18 || val.length < 8){
                angular.element(vdparent).removeClass('setWarmErrorexp');
                angular.element(vdparent).addClass('setErrorexp');
                angular.element(vderrp).html(gettextCatalog.getString('*Password cannot less than 8 digits or exceed 18 digits!'));
                self.formvalidatepassi = false;
            }else if(trimeasyExp.test(val)){
                angular.element(vdparent).addClass('setWarmErrorexp');
                angular.element(vdparent).removeClass('setErrorexp');
                angular.element(vderrp).html(gettextCatalog.getString('*The password is too simple, it is recommended to mix uppercase and lowercase letters, numbers, special characters!'));
                self.formvalidatepassi = true;
            }else{
                angular.element(vdparent).removeClass('setErrorexp');
                angular.element(vdparent).removeClass('setWarmErrorexp');
                self.formvalidatepassi = true;
            }
            $timeout(function(){
                $scope.$apply();
            })
        }
        /**
         * 输入框的验证，重复密码验证
         */
        self.validateRpassi = function( $event ){
            var val = self.createwirpass;
            var vdparent = $event.srcElement.parentElement.parentElement;
            var vderrp = $event.srcElement.parentElement.nextElementSibling;
            if(typeof(val) == 'undefined'){
                angular.element(vdparent).removeClass('setErrorexp');
                self.formvalidaterpassi = false;
            }else if(val == ''){
                angular.element(vdparent).removeClass('setErrorexp');
                self.formvalidaterpassi = false;
            }else if(self.createwirpass !== self.createwipass){
                angular.element(vdparent).addClass('setErrorexp');
                angular.element(vderrp).html(gettextCatalog.getString('*Inconsistent password'));
                self.formvalidaterpassi = false;
            }else{
                angular.element(vdparent).removeClass('setErrorexp');
                self.formvalidaterpassi = true;
            }
            $timeout(function(){
                $scope.$apply();
            })
        }
        /**
         * 冷钱包扫码后，展示预览交易信息
         */
        $rootScope.$on('Local/createTabChange', function(event,tabFrom){
            self.step = tabFrom;
            $timeout(function () {
                $rootScope.$apply();
            });
        });

    });