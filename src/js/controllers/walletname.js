'use strict';

angular.module('copayApp.controllers').controller('walletnameController',
    function($rootScope, $scope, $timeout, profileService, go, gettext, gettextCatalog, $state, $stateParams, isCordova, notification, storageService, configService, nodeWebkit) {

        var self = this;
        var indexScope = $scope.index;
        self.showconfirm = false;
        self.walletId = $stateParams.walletId;
        self.name = $stateParams.name;
        self.image = $stateParams.image;
        self.address = $stateParams.address;
        self.ammount = $stateParams.ammount;
        self.mnemonic = $stateParams.mnemonic;
        self.mnemonicEncrypted = $stateParams.mnemonicEncrypted;
        self.walletType = $stateParams.walletType;
        let configWallets = configService.defaultImages;
        /**
         * 判断当前钱包，设置钱包转账图片
         * @param
         */
        for(let item in configWallets){
            if(item == self.walletType) {
                self.walletTypeShort = configWallets[item][2];
            }
        }
        self.gobackup = function ( walletType, walletId, addr, name, image, ammount, mnemonic, mnemonicEncrypted ) {
            $state.go('backup', { walletType: walletType, walletId: walletId, address: addr, name: name, image: image, ammount:ammount, mnemonic: mnemonic, mnemonicEncrypted: mnemonicEncrypted});
        };
        self.goChangeWalletpassWord = function ( walletType, walletId, addr, name, image, ammount, mnemonic, mnemonicEncrypted) {
            $state.go('changeWalletPassWord', {  walletType: walletType, walletId: walletId, address: addr, name: name, image: image, ammount:ammount, mnemonic: mnemonic, mnemonicEncrypted: mnemonicEncrypted});
        };
        for(let item in configWallets){
            if(item == self.walletType) {
                self.inputImg = configWallets[item][0];
                self.unit = configWallets[item][2];
                self.addrPlacehoder = gettextCatalog.getString('Type')+configWallets[item][3]+gettextCatalog.getString('address');
            }
        }
        /**
         * 修改对应钱包名称
         * @param walletId
         */
        self.changeWalletName = function (walletId) {
            var form = $scope.changeName;
            var newWalletName = form.name.$modelValue;
            profileService.setAndStoreFocus(walletId, function() {
                storageService.getProfile(function (err, profile) {
                    if (err) {
                        $rootScope.$emit('Local/DeviceError', err);
                        return;
                    }
                    if (!profile) {
                        breadcrumbs.add('no profile');
                        return cb(new Error('NOPROFILE: No profile'));
                    } else {
                        var profile = profile;
                        for (let item in profile.credentials) {
                            if (profile.credentials[item].walletId == walletId) {
                                profile.credentials[item].walletName = newWalletName;
                                break;
                            }
                        }
                        profileService.unlockFC(null, function (err) {
                            if (err) {
                                $rootScope.$emit('Local/ShowErrorAlert', gettextCatalog.getString('Wrong password'));
                                return;
                            }
                            storageService.storeProfile(profile, function (err) {
                                if (err)
                                    $rootScope.$emit('Local/ShowErrorAlert', +walletId + ":    " + err);
                                profileService.bindProfileOld(profile, function () {

                                });
                                /*profileService.setAndStoreFocus(walletId, function () {

                                })*/
                                //});
                            });
                        });
                    }
                });

            });
            $scope.index.updateTxHistory(3);
        }

        //开始删除钱包
        self.deleteWallet = function(walletId,name) {
            let fc = profileService.profile.credentials;
            //console.log('fc=========',fc)
            /**
             * 删除钱包时，判断是否只有一个INVE钱包，如果只有一个，则不然删除INVE钱包
             * @type {number}
             */
            let sum = 0;
            fc.forEach(function (item) {
                if(item.type =='INVE')sum ++;
            })
            if (sum == 1 && walletId.split('-')[0] == 'INVE')
                return $rootScope.$emit('Local/ShowErrorAlert', gettextCatalog.getString("Can't delete the last remaining INVE wallet"));
            else self.showconfirm = true;
            // require('inWalletcore/wallet').findFirstAddress(function (res) {
            //     if(walletId == res.wallet)return $rootScope.$emit('Local/ShowErrorAlert', gettextCatalog.getString("Can't delete the Main INVE wallet"));
            //     self.showconfirm = true;
            // })

        };

        self.truedeleteWallet = function(walletId,name,address) {
            var isWallet = {};
            var walletName = name;
            if(!name) {

                var walletDefined = require('inWalletcore/wallet_defined_by_keys');
                walletDefined.deleteWalletFromUIForAddress(address,function (err) {
                    if (err) {
                        self.error = err.message || err;
                    } else {
                        notification.success(gettextCatalog.getString('Success'), gettextCatalog.getString('successfully deleted wallet "{{walletName}}"', {
                            walletName: walletName
                        }));

                        $timeout(function () {
                            if (isCordova)
                                window.plugins.spinnerDialog.hide();
                            else
                                $scope.index.progressing = false;
                            go.walletHome();
                            // $rootScope.$emit('Local/ShowErrorAlert', gettextCatalog.getString('successfully deleted wallet "{{walletName}}"', {
                            //     walletName: walletName
                            // }));
                        }, 1 * 1000);
                    }
                })
            }
            profileService.setAndStoreFocusToWallet(walletId, function () {
                let wc = profileService.walletClients;
                for(let item in wc){
                    if(walletId == item){

                        if(wc[item].credentials.xPrivKeyEncrypted && !wc[item].credentials.xPrivKey){
                            profileService.unlockFC(null, function (err) {
                                if (err) {
                                    $rootScope.$emit('Local/ShowErrorAlert', gettextCatalog.getString('Wrong password'));
                                    return;
                                };
                                if (isCordova)
                                    window.plugins.spinnerDialog.show(null, gettextCatalog.getString('Loading...'), true);
                                else{
                                    $scope.index.progressing = true;
                                    $scope.index.progressingmsg = 'Loading...';
                                }

                                profileService.deleteWallet(walletId,name, function(err) {
                                    if (err) {
                                        self.error = err.message || err;
                                    } else {
                                        notification.success(gettextCatalog.getString('Success'), gettextCatalog.getString('successfully deleted wallet "{{walletName}}"', {
                                            walletName: walletName
                                        }));

                                        $timeout(function () {
                                            if (isCordova)
                                                window.plugins.spinnerDialog.hide();
                                            else
                                                $scope.index.progressing = false;
                                            go.walletHome();
                                            isWallet[address] = false;
                                            // $rootScope.$emit('Local/ShowErrorAlert', gettextCatalog.getString('successfully deleted wallet "{{walletName}}"', {
                                            //     walletName: walletName
                                            // }));
                                        }, 1 * 1000);
                                    }
                                });
                            });
                        }else {
                            if (isCordova)
                                window.plugins.spinnerDialog.show(null, gettextCatalog.getString('Loading...'), true);
                            else{
                                $scope.index.progressing = true;
                                $scope.index.progressingmsg = 'Loading...';
                            }

                            profileService.deleteWallet(walletId,name, function(err) {
                                if (err) {
                                    self.error = err.message || err;
                                } else {
                                    notification.success(gettextCatalog.getString('Success'), gettextCatalog.getString('successfully deleted wallet "{{walletName}}"', {
                                        walletName: walletName
                                    }));
                                    $timeout(function () {
                                        if (isCordova)
                                            window.plugins.spinnerDialog.hide();
                                        else
                                            $scope.index.progressing = false;
                                        go.walletHome();
                                        // $rootScope.$emit('Local/ShowErrorAlert', gettextCatalog.getString('successfully deleted wallet "{{walletName}}"', {
                                        //     walletName: walletName
                                        // }));
                                    }, 1 * 1000);

                                }
                            });
                        }
                    }

                }

            });
        };

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
                    $scope.$apply();
                },1500);
            }
        };
        self.backshow = function(){
            if($scope.index.backtowalletindex == true){
                $scope.index.backwallet = false;
            }
        }
    });
