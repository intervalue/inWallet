'use strict';

var breadcrumbs = require('inWalletcore/breadcrumbs.js');
var constants = require('inWalletcore/constants.js');

angular.module('copayApp.services')
    .factory('profileService', function profileServiceFactory($rootScope, $location, $timeout, $filter, $log, lodash, storageService, bwcService, configService, pushNotificationsService, isCordova, gettext, gettextCatalog, nodeWebkit, uxLanguage) {
        var root = {};

        root.profile = null;
        root.focusedClient = null;
        root.walletClients = {};

        root.assetMetadata = {};

        root.Utils = bwcService.getUtils();
        root.formatAmount = function (amount, asset, opts) {
            var config = configService.getSync().wallet.settings;
            //if (config.unitCode == 'byte') return amount;

            //TODO : now only works for english, specify opts to change thousand separator and decimal separator
                return this.Utils.formatAmount(amount, asset, opts);

        };

        root.formatAmountWithUnit = function (amount, asset, opts) {
            return root.formatAmount(amount, asset, opts) + ' ' + root.getUnitName(asset);
        };

        root.formatAmountUnit = function (amount, asset, opts) {
            return root.formatAmount(amount, asset, opts);
        };

        root.formatAmountWithUnitIfShort = function (amount, asset, opts) {
            var str = root.formatAmount(amount, asset, opts);
            var unit = root.getUnitName(asset);
            if (unit.length <= 8)
                str += ' ' + unit;
            return str;
        };

        root.getUnitName = function (asset) {
            var config = configService.getSync().wallet.settings;
            if (asset === 'base' || asset === 'bytes')
                return config.unitName;
            else if (root.assetMetadata[asset])
                return root.assetMetadata[asset].name;
            else
                return "of " + asset;
        };

        root.getAmountInSmallestUnits = function (amount, asset) {
            var config = configService.getSync().wallet.settings;
            if (asset === 'base')
                amount *= config.unitValue;
            else if (root.assetMetadata[asset])
                amount *= Math.pow(10, root.assetMetadata[asset].decimals || 0);
            return Math.round(amount);
        };

        root.getAmountInDisplayUnits = function (amount, asset) {
            var config = configService.getSync().wallet.settings;
            if (asset === 'base')
                amount /= config.unitValue;
            else if (root.assetMetadata[asset])
                amount /= Math.pow(10, root.assetMetadata[asset].decimals || 0);
            return amount;
        };

        root._setFocus = function (walletId, cb) {
            $log.debug('Set focus:', walletId);

            // Set local object
            if (walletId) {
                var device = require('inWalletcore/device');
                device.uPMyHotDeviceAddress(walletId);
                root.focusedClient = root.walletClients[walletId];
            }
            else
                root.focusedClient = [];

            if (lodash.isEmpty(root.focusedClient)) {
                root.focusedClient = root.walletClients[lodash.keys(root.walletClients)[0]];
            }

            // Still nothing?
            // if (lodash.isEmpty(root.focusedClient)) {
            //     $rootScope.$emit('Local/NoWallets');
            // } else {
                 $rootScope.$emit('Local/NewFocusedWallet', function () {});
            // }

             return cb();
        };

        root._setFocusToPayment = function (walletId, cb) {
            $log.debug('Set focus:', walletId);

            // Set local object
            if (walletId) {
                var device = require('inWalletcore/device');
                device.uPMyHotDeviceAddress(walletId);
                root.focusedClient = root.walletClients[walletId];
            }
            else
                root.focusedClient = [];

            if (lodash.isEmpty(root.focusedClient)) {
                root.focusedClient = root.walletClients[lodash.keys(root.walletClients)[0]];
            }

            // Still nothing?
            if (lodash.isEmpty(root.focusedClient)) {
                $rootScope.$emit('Local/NoWallets');
            } else {
                $rootScope.$emit('Local/NewFocusedWalletToPayment', function () { return cb() });
            }

            // return cb();
        };

        /**
         * 聊天窗口跳转付款，选择钱包
         * @param walletId
         * @param cb
         */
        root.setAndStoreFocusToWallet = function (walletId, cb) {
            root._setFocusToPayment(walletId, function () {
                storageService.storeFocusedWalletId(walletId, cb);
            });
        };

        root.setAndStoreFocus = function (walletId, cb) {
            root._setFocus(walletId, function () {
                $log.debug('Set focus setAndStoreFocus:', walletId);
                storageService.storeFocusedWalletId(walletId, cb);
            });
        };

        root.setWalletClient = function (credentials) {
            /* if (root.walletClients[credentials.walletId] && root.walletClients[credentials.walletId].started)
               return;*/
            var client = bwcService.getClient(JSON.stringify(credentials));
            for(let item in root.profile.credentials){
                if(root.profile.credentials[item].walletId ==client.credentials.walletId ){
                    client.credentials.xPrivKey = root.profile.credentials[item].xPrivKey;
                    client.credentials.mnemonic = root.profile.credentials[item].mnemonic;
                    client.credentials.xPrivKeyEncrypted = root.profile.credentials[item].xPrivKeyEncrypted;
                    client.credentials.mnemonicEncrypted = root.profile.credentials[item].mnemonicEncrypted;
                    client.credentials.walletName = root.profile.credentials[item].walletName;
                    break;
                }
            }
            /*client.credentials.xPrivKey = root.profile.xPrivKey;
            client.credentials.mnemonic = root.profile.mnemonic;
            client.credentials.xPrivKeyEncrypted = root.profile.xPrivKeyEncrypted;
            client.credentials.mnemonicEncrypted = root.profile.mnemonicEncrypted;*/

            root.walletClients[credentials.walletId] = client;
            root.walletClients[credentials.walletId].started = true;
            client.initialize({}, function (err) {
                if (err) {
                    // impossible
                    return;
                }
            });
        };

        root.setWalletClients = function () {
            var credentials = root.profile.credentials;
            lodash.each(credentials, function (credentials) {
                root.setWalletClient(credentials);
            });
            $rootScope.$emit('Local/WalletListUpdated');
        };


        function saveTempKeys(tempDeviceKey, prevTempDeviceKey, onDone) {
            $timeout(function () {
                console.log("will save temp device keys");//, tempDeviceKey, prevTempDeviceKey);
                root.profile.tempDeviceKey = tempDeviceKey.toString('base64');
                if (prevTempDeviceKey)
                    root.profile.prevTempDeviceKey = prevTempDeviceKey.toString('base64');
                storageService.storeProfile(root.profile, function (err) {
                    onDone(err);
                });
            });
        }

        function unlockWalletAndInitDevice() {
            // wait till the wallet fully loads
            breadcrumbs.add('unlockWalletAndInitDevice');
            //Hide the mainSection
            var mainSectionElement = angular.element(document.querySelector('#mainSection'));
            mainSectionElement.css('visibility', 'hidden');

            var removeListener = $rootScope.$on('Local/BalanceUpdated', function () {
                removeListener();
                breadcrumbs.add('unlockWalletAndInitDevice BalanceUpdated');
                var mainSectionElement = angular.element(document.querySelector('#mainSection'));
                    mainSectionElement.css('visibility', 'visible');
                var config = configService.getSync();
                let confHub  = configService.getHub();
                let deviceName = typeof config.deviceName =='function' ? (isCordova ? cordova.plugins.deviceName.name : require('os').hostname()):config.deviceName;
                root.focusedClient.initDeviceProperties(
                    root.profile.device_xprivKey, root.profile.my_device_address, confHub, deviceName);
                $rootScope.$emit('Local/BalanceUpdatedAndWalletUnlocked');
            });
        }

        root.bindProfile = function (profile, cb) {
            breadcrumbs.add('bindProfile');
            root.profile = profile;
            configService.get(function (err) {
                //$log.debug('Preferences read');
                if (err)
                    return cb(err);
                root.setWalletClients();
                storageService.getFocusedWalletId(function (err, focusedWalletId) {
                    if (err)
                        return cb(err);
                    root._setFocus(focusedWalletId, function () {
                        console.log("focusedWalletId", focusedWalletId);
                        var Wallet = require('inWalletcore/wallet.js');
                        var device = require('inWalletcore/device.js');
                        var config = configService.getSync();
                        let confHub  = configService.getHub();
                        var firstWc = root.walletClients[lodash.keys(root.walletClients)[0]];
                        // set light_vendor_url here as we may request new assets history at startup during balances update

                        require('inWalletcore/light_wallet.js').setLightVendorHost(confHub);
                        if (root.profile.xPrivKeyEncrypted) {
                            console.log('priv key is encrypted, will wait for UI and request password');
                            unlockWalletAndInitDevice();
                            device.setDeviceAddress(root.profile.my_device_address);
                        }
                        else if (root.profile.xPrivKey){
                            console.log(2);
                            root.focusedClient.initDeviceProperties(root.profile.device_xprivKey, root.profile.my_device_address, confHub, config.deviceName);
                        }
                        if(profile.tempDeviceKey){
                            var tempDeviceKey = Buffer.from(profile.tempDeviceKey, 'base64');
                            var prevTempDeviceKey = profile.prevTempDeviceKey ? Buffer.from(profile.prevTempDeviceKey, 'base64') : null;
                            device.setTempKeys(tempDeviceKey, prevTempDeviceKey, saveTempKeys);
                        }
                        return cb();
                    });
                });
            });
        };

        root.bindProfileOld = function (profile, cb) {
            breadcrumbs.add('bindProfile');
            root.profile = profile;
            configService.get(function (err) {
                //$log.debug('Preferences read');
                if (err)
                    return cb(err);
                root.setWalletClients();
                storageService.getFocusedWalletId(function (err, focusedWalletId) {
                    if (err)
                        return cb(err);
                    root._setFocus(focusedWalletId, function () {
                        console.log("focusedWalletId", focusedWalletId);
                        var Wallet = require('inWalletcore/wallet.js');
                        var device = require('inWalletcore/device.js');
                        var config = configService.getSync();
                        let confHub = configService.getHub();
                        var firstWc = root.walletClients[lodash.keys(root.walletClients)[0]];
                        // set light_vendor_url here as we may request new assets history at startup during balances update

                        require('inWalletcore/light_wallet.js').setLightVendorHost(confHub);
                        if (root.profile.xPrivKeyEncrypted) {
                            console.log('priv key is encrypted, will wait for UI and request password');
                            device.setDeviceAddress(root.profile.my_device_address);
                        }

                        else if (root.profile.xPrivKey){
                            console.log(3);
                            root.focusedClient.initDeviceProperties(root.profile.device_xprivKey, root.profile.my_device_address, confHub, config.deviceName);
                        }

                        if(profile.tempDeviceKey){
                            var tempDeviceKey = Buffer.from(profile.tempDeviceKey, 'base64');
                            var prevTempDeviceKey = profile.prevTempDeviceKey ? Buffer.from(profile.prevTempDeviceKey, 'base64') : null;
                            device.setTempKeys(tempDeviceKey, prevTempDeviceKey, saveTempKeys);
                        }

                        $rootScope.$emit('Local/ProfileBound');
                        return cb();
                    });
                });
            });
        };

        root.loadAndBindProfile = function (cb) {
            breadcrumbs.add('loadAndBindProfile');
            storageService.getDisclaimerFlag(function (err, val) {
                if (!val) {
                    breadcrumbs.add('Non agreed disclaimer');
                    return cb(new Error('NONAGREEDDISCLAIMER: Non agreed disclaimer'));
                } else {
                    storageService.getProfile(function (err, profile) {
                        if (err) {
                            $rootScope.$emit('Local/DeviceError', err);
                            return cb(err);
                        }
                        if (!profile) {
                            breadcrumbs.add('no profile');
                            return cb(new Error('NOPROFILE: No profile'));
                        } else {
                            $log.debug('Profile read');
                            //console.log(profile);
                            return root.bindProfile(profile, cb);
                        }

                    });
                }
            });
        };



        root._seedWallet = function (opts, cb) {
            opts = opts || {};
            var walletClient = bwcService.getClient();
            var network = opts.networkName || 'livenet';


            if (opts.mnemonic) {
                try {
                    //console.log('come this');
                    opts.mnemonic = root._normalizeMnemonic(opts.mnemonic);
                    //console.log('return this');
                    walletClient.seedFromMnemonic(opts.mnemonic, {
                        network: network,
                        passphrase: opts.passphrase,
                        password: opts.password,
                        account: opts.account || 0,
                        derivationStrategy: opts.derivationStrategy || 'BIP44',
                        type: opts.type,
                        segwit: opts.segwit,
                        walletName: opts.name,
                        info: ''
                    });
                    //console.log('key  Test');
                   // console.log(walletClient.credentials);
                } catch (ex) {
                    $log.info(ex);
                    // $rootScope.$emit('Local/ShowAlert', gettextCatalog.getString(' Could not create: Invalid wallet seed.'), 'fi-check', function () {
                    // });
                    // return;
                    return cb(gettext('Could not create: Invalid wallet seed'));
                }
            } else if (opts.extendedPrivateKey) {
                try {
                    walletClient.seedFromExtendedPrivateKey(opts.extendedPrivateKey, opts.account || 0);
                } catch (ex) {
                    $log.warn(ex);
                    return cb(gettext('Could not create using the specified extended private key'));
                }
            } else if (opts.extendedPublicKey) {
                try {
                    walletClient.seedFromExtendedPublicKey(opts.extendedPublicKey, opts.externalSource, opts.entropySource, {
                        account: opts.account || 0,
                        derivationStrategy: opts.derivationStrategy || 'BIP44',
                    });
                } catch (ex) {
                    $log.warn("Creating wallet from Extended Public Key Arg:", ex, opts);
                    return cb(gettext('Could not create using the specified extended public key'));
                }
            } else if (opts.privateKey){
                try {
                    walletClient.seedFromPrivateKey(opts.privateKey, opts);
                } catch (ex) {
                    $log.warn("Creating wallet from privateKey Public Key Arg:", ex, opts);
                    return cb(gettext('Could not create using the specified extended privateKey key'));
                }
            }
            else {
                var lang = uxLanguage.getCurrentLanguage();
                console.log("will seedFromRandomWithMnemonic for language " + lang);
                try {
                    walletClient.seedFromRandomWithMnemonic({
                        network: network,
                        passphrase: opts.passphrase,
                        password: opts.password,
                        language: lang,
                        account: opts.account || 0,
                    });
                } catch (e) {
                    $log.info('Error creating seed: ' + e.message);
                    if (e.message.indexOf('language') > 0) {
                        $log.info('Using default language for mnemonic');
                        walletClient.seedFromRandomWithMnemonic({
                            network: network,
                            password: opts.password,
                            passphrase: opts.passphrase,
                            account: opts.account || 0,
                        });
                    } else {
                        return cb(e);
                    }
                }
            }
            return cb(null, walletClient);
        };

        //初次创建钱包或还原钱包
        root._createNewProfile = function (opts, cb) {
            console.log("_createNewProfile");
            if (opts.noWallet)
                return cb(null, Profile.create());
            //创建钱包，带有助记词和密码
            root._seedWallet(opts, function (err, walletClient) {
                if (err)
                    return cb(err);
                var config = configService.getSync();
                let confHub  = configService.getHub();
                require('inWalletcore/wallet.js'); // load hub/ message handlers
                var device = require('inWalletcore/device.js');
                var tempDeviceKey = device.genPrivKey();
                require('inWalletcore/light_wallet.js').setLightVendorHost(confHub);
                // initDeviceProperties sets my_device_address needed by walletClient.createWallet
                walletClient.initDeviceProperties(walletClient.credentials.xPrivKey, null, confHub, config.deviceName);
                var walletName = opts.walletName || gettextCatalog.getString('Small Expenses Wallet');
                //数据库中创建钱包
                walletClient.createWallet(walletName, 1, 1, {
                    //	isSingleAddress: true,
                    network: 'livenet'
                }, function (err) {
                    if (err)
                        return cb(gettext('Error creating wallet') + ": " + err);
                    //console.log("created wallet, client: ", JSON.stringify(walletClient));
                    //将钱包信息存入文件中
                    var xPrivKey = walletClient.credentials.xPrivKey;
                    var mnemonic = walletClient.credentials.mnemonic;
                    console.log("mnemonic: " + mnemonic + ', xPrivKey: ' + xPrivKey);
                    var p = Profile.create({
                        credentials: [JSON.parse(walletClient.export())],
                        xPrivKey: xPrivKey,
                        mnemonic: mnemonic,
                        tempDeviceKey: tempDeviceKey.toString('base64'),
                        my_device_address: device.getMyDeviceAddress(),
                        device_pubkey:  device.getDevicePubkey(),
                        device_xprivKey:xPrivKey
                    });
                    device.setTempKeys(tempDeviceKey, null, saveTempKeys);
                    return cb(null, p);
                },opts.type);
            });
        };

        //新增一个钱包或者还原钱包接口
        // create additional wallet (the first wallet is created in _createNewProfile())
        root.importWallets = function (opts, cb) {
            //这里把钱包创建出来了
            $log.debug('Creating Wallet:', opts);
                opts.account = 0;
                root._seedWallet(opts, function (err, walletClient) {
                    if (err)
                        return cb(err);
                    var xPubKey = walletClient.credentials.xPubKey;

                    // check if exists
                    var w = lodash.find(root.profile.credentials, { 'xPubKey': xPubKey });
                    if (w){
                        return cb(gettextCatalog.getString('wallet already exist'));
                    }

                    walletClient.createWallet(opts.name, opts.m, opts.n, {
                        network: opts.networkName,
                        account: opts.account,
                        cosigners: opts.cosigners,
                        isSingleAddress: opts.isSingleAddress,
                        segwit: opts.segwit,
                        type: opts.type
                    }, function (err) {
                        $timeout(function () {
                            if (err)
                                return cb(gettext('Error creating wallet') + ": " + err);
                            root._addWalletClient(walletClient, opts, cb);
                        });
                    }, opts.type);
                });
        };

        /**
         * 创建热钱包
         * @param opts
         * @param addr
         * @param cb
         */
        root.createHotWallet = function (opts, addr, cb) {
            $log.debug('Creating HotWallet:', opts);
            var device = require('inWalletcore/device.js');
            device.setMyHotDeviceAddress(addr);
            var walletClient = bwcService.getClient();
            if(!root.profile){
                Profile.create();
                var walletClient = bwcService.getClient();
                walletClient.import(JSON.stringify(opts));
                walletClient.createWallet(opts.name, opts.m, opts.n, {
                    network: opts.network,
                    account: opts.account,
                    cosigners: opts.cosigners
                }, function (err) {
                    if (err)
                        return cb(gettext('Error creating wallet') + ": " + err);
                    var p = Profile.create({
                        credentials: [JSON.parse(walletClient.export())],
                        tempDeviceKey: null,
                        my_device_address: addr
                    });
                    console.log(p);
                    root.profile = p;
                    configService.get(function (err) {
                        root.bindProfile(p, function (err) {
                            storageService.storeNewProfile(p, function (err) {
                                root.setSingleAddressFlag(true);
                                return cb(err);
                            });
                        });
                    });
                },'INVE');

            }else {
                walletClient.import(JSON.stringify(opts));
                walletClient.createWallet(opts.name, opts.m, opts.n, {
                    network: opts.network,
                    account: opts.account,
                    cosigners: opts.cosigners
                }, function (err) {
                    if (err)
                        return cb(gettext('Error creating wallet') + ": " + err);
                    opts.observed = true;
                    root._addWalletClient(walletClient, opts, cb);
                },'INVE');
            }
        };

        root.getClient = function (walletId) {
            return root.walletClients[walletId];
        };

        root.deleteWallet = function (walletId,walletName, cb) {
            $log.debug('Deleting Wallet:', walletName);
            breadcrumbs.add('Deleting Wallet: ' + walletName);

            root.profile.credentials = lodash.reject(root.profile.credentials, {
                walletId: walletId
            });

            delete root.walletClients[walletId];
            root.focusedClient = null;

            storageService.clearBackupFlag(walletId, function (err) {
                if (err) $log.warn(err);
            });

            $timeout(function () {
                root.setWalletClients();
                root.setAndStoreFocus(null, function () {
                    storageService.storeProfile(root.profile, function (err) {
                        if (err) return cb(err);
                        var walletDefinedByKeys = require('inWalletcore/wallet_defined_by_keys.js');
                        return walletDefinedByKeys.deleteWalletFromUI(walletId, cb);
                    });
                });
            });
        };

        root.setMetaData = function (walletClient, addressBook, cb) {
            storageService.getAddressbook(walletClient.credentials.network, function (err, localAddressBook) {
                var localAddressBook1 = {};
                try {
                    localAddressBook1 = JSON.parse(localAddressBook);
                } catch (ex) {
                    $log.warn(ex);
                }
                var mergeAddressBook = lodash.merge(addressBook, localAddressBook1);
                storageService.setAddressbook(walletClient.credentials.network, JSON.stringify(addressBook), function (err) {
                    if (err) return cb(err);
                    return cb(null);
                });
            });
        }

        root._addWalletClient = function (walletClient, opts, cb) {
            var walletId = walletClient.credentials.walletId;

            // check if exists
            var w = lodash.find(root.profile.credentials, { 'walletId': walletId });
            if (w)
                return cb(gettext('Wallet already in inWallet' + ": ") + w.walletName);

            root.profile.credentials.push(JSON.parse(walletClient.export()));
            root.setWalletClients();

            // assign wallet color based on first character of walletId
            var color = configService.colorOpts[walletId.charCodeAt(5) % configService.colorOpts.length];
            var configOpts = { colorFor: {},imageFor: {} };
            configOpts.colorFor[walletId] = color;
            //添加图标
            var image = configService.imageOpts[walletId.charCodeAt(5) % configService.imageOpts.length];
            configOpts.imageFor[walletId] = image;
            configService.set(configOpts, function (err) {
                root.setAndStoreFocus(walletId, function () {
                    storageService.storeProfile(root.profile, function (err) {
                        var config = configService.getSync();
                        return cb(err, walletId);
                    });
                });
            });
        };


        root.importWallet = function (str, opts, cb) {

            var walletClient = bwcService.getClient();

            $log.debug('Importing Wallet:', opts);
            try {
                walletClient.import(str, {
                    compressed: opts.compressed,
                    password: opts.password
                });
            } catch (err) {
                return cb(gettext('Could not import. Check input file and password'));
            }

            str = JSON.parse(str);

            var addressBook = str.addressBook || {};

            root._addWalletClient(walletClient, opts, function (err, walletId) {
                if (err) return cb(err);
                root.setMetaData(walletClient, addressBook, function (error) {
                    if (error) console.log(error);
                    return cb(err, walletId);
                });
            });
        };


        root.importExtendedPrivateKey = function (xPrivKey, opts, cb) {
            var walletClient = bwcService.getClient();
            $log.debug('Importing Wallet xPrivKey');

            walletClient.importFromExtendedPrivateKey(xPrivKey, function (err) {
                if (err)
                    return cb(gettext('Could not import') + ": " + err);

                root._addWalletClient(walletClient, opts, cb);
            });
        };

        root._normalizeMnemonic = function (words) {
            var isJA = words.indexOf('\u3000') > -1;
            var wordList = words.split(/[\u3000\s]+/);

            return wordList.join(isJA ? '\u3000' : ' ');
        };


        root.importMnemonic = function (words, opts, cb) {

            var walletClient = bwcService.getClient();

            $log.debug('Importing Wallet Mnemonic');

            words = root._normalizeMnemonic(words);
            walletClient.importFromMnemonic(words, {
                network: opts.networkName,
                passphrase: opts.passphrase,
                account: opts.account || 0,
            }, function (err) {
                if (err)
                    return cb(gettext('Could not import') + ": " + err);

                root._addWalletClient(walletClient, opts, cb);
            });
        };


        root.importExtendedPublicKey = function (opts, cb) {

            var walletClient = bwcService.getClient();
            $log.debug('Importing Wallet XPubKey');

            walletClient.importFromExtendedPublicKey(opts.extendedPublicKey, opts.externalSource, opts.entropySource, {
                account: opts.account || 0,
                derivationStrategy: opts.derivationStrategy || 'BIP44',
            }, function (err) {
                if (err) {

                    // in HW wallets, req key is always the same. They can't addAccess.
                    if (err.code == 'NOT_AUTHORIZED')
                        err.code = 'WALLET_DOES_NOT_EXIST';

                    return cb(gettext('Could not import') + ": " + err);
                }

                root._addWalletClient(walletClient, opts, cb);
            });
        };

        //初次创建钱包或初次还原钱包的入口
        root.createNewWallets = function (opts, cb) {
            $log.info('Creating profile', opts);
            var defaults = configService.getDefaults();

            //configService.get(function (err) {
                root._createNewProfile(opts, function (err, p) {
                    if (err) return cb(err);
                    root.bindProfile(p, function (err) {
                        storageService.storeNewProfile(p, function (err) {
                            root.setSingleAddressFlag(true);
                            cb(err);
                        });
                    });
                });
            //});
        };


        root.updateCredentialsFC = function (cb) {
            var fc = root.focusedClient;

            var newCredentials = lodash.reject(root.profile.credentials, {
                walletId: fc.credentials.walletId
            });
            newCredentials.push(JSON.parse(fc.export()));
            root.profile.credentials = newCredentials;
            //root.profile.my_device_address = device.getMyDeviceAddress();

            storageService.storeProfile(root.profile, cb);
        };

        root.clearMnemonic = function (cb) {
            delete root.profile.mnemonic;
            delete root.profile.mnemonicEncrypted;
            delete root.focusedClient.mnemonicEncrypted;
            for(let item in root.profile.credentials){
                if(root.focusedClient.credentials.walletId == root.profile.credentials[item].walletId){
                    delete  root.profile.credentials[item].mnemonic;
                    delete  root.profile.credentials[item].mnemonicEncrypted;
                }

            }
            /*for (var wid in root.walletClients){
              alert(wid);
                root.walletClients[wid].clearMnemonic();
            }*/

            storageService.storeProfile(root.profile, cb);
        };

        root.setPrivateKeyEncryptionFC = function (password, cb) {
            var fc = root.focusedClient;
            $log.debug('Encrypting private key for', fc.credentials.walletName);

            fc.setPrivateKeyEncryption(password);
            if (!fc.credentials.xPrivKeyEncrypted)
                throw Error("no xPrivKeyEncrypted after setting encryption");
            root.profile.xPrivKeyEncrypted = fc.credentials.xPrivKeyEncrypted;
            root.profile.mnemonicEncrypted = fc.credentials.mnemonicEncrypted;
            // delete root.profile.xPrivKey;
            // delete root.profile.mnemonic;
            var p_cre = lodash.find(root.profile.credentials, { walletId: fc.credentials.walletId });
            p_cre.xPrivKeyEncrypted = fc.credentials.xPrivKeyEncrypted;
            p_cre.mnemonicEncrypted = fc.credentials.mnemonicEncrypted;
            // delete p_cre.xPrivKey;
            // delete p_cre.mnemonic;

            root.lockFC();
            // root.walletClients[fc.credentials.walletId].credentials.xPrivKeyEncrypted = root.profile.xPrivKeyEncrypted;
            // delete root.walletClients[fc.credentials.walletId].credentials.xPrivKey;
            // for (var wid in root.walletClients) {
            //   root.walletClients[wid].credentials.xPrivKeyEncrypted = root.profile.xPrivKeyEncrypted;
            //   delete root.walletClients[wid].credentials.xPrivKey;
            // }
            storageService.storeProfile(root.profile, function () {
                $log.debug('Wallet encrypted');
                return cb();
            });
            /*root.updateCredentialsFC(function() {
                $log.debug('Wallet encrypted');
                    return cb();
            });*/
        };


        root.disablePrivateKeyEncryptionFC = function (cb) {
            var fc = root.focusedClient;
            $log.debug('Disabling private key encryption for', fc.credentials.walletName);

            try {
                fc.disablePrivateKeyEncryption();
            } catch (e) {
                return cb(e);
            }
            if (!fc.credentials.xPrivKey)
                throw Error("no xPrivKey after disabling encryption");
            root.profile.xPrivKey = fc.credentials.xPrivKey;
            root.profile.mnemonic = fc.credentials.mnemonic;
            delete root.profile.xPrivKeyEncrypted;
            delete root.profile.mnemonicEncrypted;
            var p_cre = lodash.find(root.profile.credentials, { walletId: fc.credentials.walletId });
            p_cre.xPrivKey = fc.credentials.xPrivKey;
            p_cre.mnemonic = fc.credentials.mnemonic;
            delete p_cre.xPrivKeyEncrypted;
            delete p_cre.mnemonicEncrypted;
            // for (var wid in root.walletClients) {
            //   root.walletClients[wid].credentials.xPrivKey = root.profile.xPrivKey;
            //   delete root.walletClients[wid].credentials.xPrivKeyEncrypted;
            // }
            storageService.storeProfile(root.profile, function () {
                $log.debug('Wallet encryption disabled');
                return cb();
            });
            /*root.updateCredentialsFC(function() {
                $log.debug('Wallet encryption disabled');
                    return cb();
            });*/
        };

        root.lockFC = function () {
            var fc = root.focusedClient;
            try {
                fc.lock();
            } catch (e) { };
        };

        root.unlockFC = function (error_message, cb) {
            $log.debug('Wallet is encrypted');
            $rootScope.$emit('Local/NeedsPassword', false, error_message, function (err2, password) {
                if (err2 || !password) {
                    return cb({
                        message: (err2 || gettextCatalog.getString('Password needed'))
                    });
                }
                var fc = root.focusedClient;
                try {
                    fc.unlock(password);
                    breadcrumbs.add('unlocked ' + fc.credentials.walletId);
                } catch (e) {
                    $log.debug(e);
                    return cb({
                        message: gettextCatalog.getString('Wrong password')
                    });
                }
                var autolock = function () {
                    if (root.bKeepUnlocked) {
                        console.log("keeping unlocked");
                        breadcrumbs.add("keeping unlocked");
                        $timeout(autolock, 30 * 1000);
                        return;
                    }
                    console.log('time to auto-lock wallet', fc.credentials);
                    if (fc.hasPrivKeyEncrypted()) {
                        $log.debug('Locking wallet automatically');
                        try {
                            fc.lock();
                            breadcrumbs.add('locked ' + fc.credentials.walletId);
                        } catch (e) { };
                    };
                };
                $timeout(autolock, 30 * 1000);
                return cb();
            });
        };

        // continue to request password until the correct password is entered
        root.insistUnlockFC = function (error_message, cb) {
            root.unlockFC(error_message, function (err) {
                if (!err)
                    return cb();
                $timeout(function () {
                    root.insistUnlockFC(err.message, cb);
                }, 1000);
            });
        };

        root.getWallets = function (network) {
            if (!root.profile) return [];
            var config = configService.getSync();
            config.colorFor = config.colorFor || {};
            config.aliasFor = config.aliasFor || {};
            config.imageFor = config.imageFor || {};
            var ret = lodash.map(root.profile.credentials, function (c) {
                return {
                    m: c.m,
                    n: c.n,
                    is_complete: (c.publicKeyRing && c.publicKeyRing.length === c.n),
                    name: config.aliasFor[c.walletId] || c.walletName,
                    id: c.walletId,
                    network: c.network,
                    color: config.colorFor[c.walletId] || '#2C3E50',
                    image: config.imageFor[c.walletId] || './img/rimg/1.png'
                };
            });
            ret = lodash.filter(ret, function (w) {
                return (w.network == network && w.is_complete);
            });
            return lodash.sortBy(ret, 'name');
        };



        root.requestTouchid = function (cb) {
            var fc = root.focusedClient;
            var config = configService.getSync();
            config.touchIdFor = config.touchIdFor || {};
            if (window.touchidAvailable && config.touchIdFor[fc.credentials.walletId])
                $rootScope.$emit('Local/RequestTouchid', cb);
            else
                return cb();
        };

        root.replaceProfile = function (xPrivKey, mnemonic, myDeviceAddress, cb) {
            var device = require('inWalletcore/device.js');

            root.profile.credentials = [];
            root.profile.xPrivKey = xPrivKey;
            root.profile.mnemonic = mnemonic;
            root.profile.my_device_address = myDeviceAddress;
            device.setNewDeviceAddress(myDeviceAddress);

            storageService.storeProfile(root.profile, function () {
                return cb();
            });
        };

        root.setSingleAddressFlag = function (newValue) {
            var fc = root.focusedClient;
            fc.isSingleAddress = newValue;
            var walletId = fc.credentials.walletId;
            var config = configService.getSync();
            var oldValue = config.isSingleAddress || false;

            var opts = {
                isSingleAddress: {}
            };
            opts.isSingleAddress[walletId] = newValue;
            configService.set(opts, function (err) {
                if (err) {
                    fc.isSingleAddress = oldValue;
                    $rootScope.$emit('Local/DeviceError', err);
                    return;
                }
                $rootScope.$emit('Local/SingleAddressFlagUpdated');
            });
        }


        return root;
    });
