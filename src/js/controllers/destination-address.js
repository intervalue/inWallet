'use strict';


angular.module('copayApp.controllers').controller('destinationAddressController',
    function ($rootScope, $scope, $timeout, storageService, $state, $stateParams, notification, profileService, bwcService, $log, gettext, gettextCatalog, lodash, addressbookService, go) {
        var self = this;
        var fc = profileService.focusedClient;
        $scope.editAddressbook = false;
        $scope.addAddressbookEntry = false;
        $scope.selectedAddressbook = {};
        //交换页面的input框的address
        $scope.newAddress = $stateParams.address;
        $scope.fromPage = $stateParams.page;
        self.walletType = $stateParams.walletType;
        self.walletId = $stateParams.walletId;
        //转账页面的address
        self.address = $stateParams.addressess;
        self.walletName = $stateParams.walletName;
        console.log($stateParams)
        self.addressType = 'INVE';
        $scope.addressbook = {
            'address': ($scope.newAddress || ''),
            'label': ''
        };
        $scope.color = fc.backgroundColor;
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

        $scope.toggleEditAddressbook = function() {
            $scope.editAddressbook = !$scope.editAddressbook;
            $scope.selectedAddressbook = {};
            $scope.addAddressbookEntry = false;
        };

        $scope.toggleSelectAddressbook = function(addr) {
            $scope.selectedAddressbook[addr] = $scope.selectedAddressbook[addr] ? false : true;
        };
        */

        $scope.toggleEditAddressbook = function() {
            $scope.editAddressbook = !$scope.editAddressbook;
            $scope.selectedAddressbook = {};
            $scope.addAddressbookEntry = false;
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
                $scope.addressList = ab;
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
                $scope.addressList = ab;
                $scope.editAddressbook = true;
                $scope.toggleEditAddressbook();
                $timeout(function () {
                    $rootScope.$apply();
                },1);
            })
        }

        $scope.addressbookRmove = function (address,type) {
            $scope.error = null;
            addressbookService.remove(address,type,function (err, ab) {
                if (err) {
                    $scope.error = err;
                    return;
                }
                $scope.addressList = ab;
                $timeout(function () {
                    if(!$rootScope.$$phase) $scope.$apply();
                },1);
            })
        }

        /**
         * 添加交易地址至通讯录
         * @type {Function}
         */
        $scope.add = lodash.debounce(function(addressbook) {
            $scope.error = null;
            addressbookService.add(addressbook, function(err, ab) {
                if (err) {
                    $timeout(function () {
                        $scope.error = err;
                    });
                    return;
                }
                $rootScope.$emit('Local/AddressbookUpdated', ab);
                $scope.list = ab;
                $scope.editAddressbook = true;
                $scope.toggleEditAddressbook();
                $timeout(function () {
                    $rootScope.$apply();
                },1);
            });
        },1000);

        /**
         * 删除交易地址
         * @param addr
         */
        $scope.remove = function(addr) {
            $scope.error = null;
            $timeout(function() {
                addressbookService.remove(addr, function(err, ab) {
                    if (err) {
                        $scope.error = err;
                        return;
                    }
                    $rootScope.$emit('Local/AddressbookUpdated', ab);
                    $scope.list = ab;
                    $timeout(function () {
                        if(!$rootScope.$$phase) $scope.$apply();
                    },1);

                });
            }, 100);
        };

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

        self.goBack = function(page){
            if(page == 'exchange'){
                go.send();
            }else{
                $state.go('transfer',{ walletType:self.walletType, walletId:self.walletId, address:self.address,walletName :self.walletName });
            }
        }

        self.changeType = function(type){
            $scope.addressType = type;
            $scope.addressbookList(type);
            $timeout(function(){
                $scope.$apply();
            })
        }

    });