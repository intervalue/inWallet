'use strict';

angular.module('copayApp.controllers').controller('preferencesGlobalController',
    function ($scope, $rootScope, $log, configService, uxLanguage, uxCurrency, pushNotificationsService, profileService, $timeout) {

        var conf = require('inWalletcore/conf.js');
        let self = this

        $scope.encrypt = !!profileService.profile.xPrivKeyEncrypted;

        this.init = function () {
            var config = configService.getSync();
            this.unitName = config.wallet.settings.unitName;
            this.bbUnitName = config.wallet.settings.bbUnitName;
            this.deviceName = config.deviceName;
            this.myDeviceAddress = require('inWalletcore/device.js').getMyDeviceAddress();
            this.hub = config.hub;
            this.currentLanguageName = uxLanguage.getCurrentLanguageName();
            this.currentCurrencyName = uxCurrency.getCurrentCurrencyName();
            this.currentCurrencyEnName = uxCurrency.getCurrentCurrencyEnName();
            this.torEnabled = conf.socksHost && conf.socksPort;
            $scope.pushNotifications = config.pushNotifications.enabled;
            $scope.helpshowc = $scope.index.helpshow;
        };

        // 同步交易控制器
        this.showconfirm = false

        // 同步交易方法
        this.Btnclick = function () {
           $scope.index.resetTransactions()
            self.showconfirm = false
        }

        var unwatchHelpshow = $scope.$watch('helpshowc', function (newVal, oldVal) {
            if (newVal == oldVal) return;
            if (newVal == true) {
                $scope.index.helpshow = true;
            } else {
                $scope.index.helpshow = false;
            }
            $timeout(function () {
                $scope.$apply();
            });
        });

        var unwatchPushNotifications = $scope.$watch('pushNotifications', function (newVal, oldVal) {
            if (newVal == oldVal) return;
            var opts = {
                pushNotifications: {
                    enabled: newVal
                }
            };
            configService.set(opts, function (err) {
                if (opts.pushNotifications.enabled)
                    pushNotificationsService.pushNotificationsInit();
                else
                    pushNotificationsService.pushNotificationsUnregister();
                if (err) $log.debug(err);
            });
        });

        var unwatchEncrypt = $scope.$watch('encrypt', function (val) {
            var fc = profileService.focusedClient;
            if (!fc) return;

            if (val && !fc.hasPrivKeyEncrypted()) {
                $rootScope.$emit('Local/NeedsPassword', true, null, function (err, password) {
                    if (err || !password) {
                        $scope.encrypt = false;
                        return;
                    }
                    profileService.setPrivateKeyEncryptionFC(password, function () {
                        $rootScope.$emit('Local/NewEncryptionSetting');
                        $scope.encrypt = true;
                    });
                });
            } else {
                if (!val && fc.hasPrivKeyEncrypted()) {
                    profileService.unlockFC(null, function (err) {
                        if (err) {
                            $scope.encrypt = true;
                            return;
                        }
                        profileService.disablePrivateKeyEncryptionFC(function (err) {
                            $rootScope.$emit('Local/NewEncryptionSetting');
                            if (err) {
                                $scope.encrypt = true;
                                $log.error(err);
                                return;
                            }
                            $scope.encrypt = false;
                        });
                    });
                }
            }
        });


        $scope.$on('$destroy', function () {
            unwatchHelpshow();
            unwatchPushNotifications();
            unwatchEncrypt();
        });
    });
