'use strict';

var crypto = require('crypto');
var $ = require('preconditions').singleton();
var _ = require('lodash');

var Bitcore = require('bitcore-lib');
var Mnemonic = require('bitcore-mnemonic');
var sjcl = require('sjcl');
var Common = require('./common');
var Constants = Common.Constants;
var bitcoinCore = require('inWalletcore/HDWallet/wallet_bean');
var ethCore = require('inWalletcore/HDWallet/EthwalletBean');

var FIELDS = [
    'walletId',
    'network',
    'xPrivKey',
    'xPrivKeyEncrypted',
    'xPubKey',
    'publicKeyRing',
    'walletName',
    'm',
    'n',
    'externalSource',
    'mnemonic',
    'mnemonicEncrypted',
    'entropySource',
    'mnemonicHasPassphrase',
    'derivationStrategy',
    'account',
    'type',
    'otherObject',
    'segwit'
];

/**
 * change by pmj 18.11.27 add type
 * @param type  account 在btc情况下代表不同的地址
 * @constructor
 * version ++  btc 2.0.0暂时是默认的BIP44 将在后面的版本增加BIP49的加密方式
 */
function Credentials(type) {
    this.version = '1.0.0';
    this.derivationStrategy = Constants.DERIVATION_STRATEGIES.BIP44;
    this.account = 0;
    this.type = type;
};

function _checkNetwork(network) {
    if (!_.includes(['livenet', 'testnet'], network)) throw new Error('Invalid network');
};

Credentials.create = function (network, account, type) {
    _checkNetwork(network);

    var x = new Credentials(type);

    x.network = network;
    x.account = account;
    x.xPrivKey = (new Bitcore.HDPrivateKey(network)).toString();
    x._expand();
    return x;
};

var wordsForLang = {
    'en': Mnemonic.Words.ENGLISH,
    'es': Mnemonic.Words.SPANISH,
    'ja': Mnemonic.Words.JAPANESE,
    'zh': Mnemonic.Words.CHINESE,
    'fr': Mnemonic.Words.FRENCH,
};

Credentials.createRandomMnemonic = function (language) {
    var m = new Mnemonic(wordsForLang[language]);
    while (!Mnemonic.isValid(m.toString())) {
        console.log('--- retrying mnemonic generation');
        m = new Mnemonic(wordsForLang[language])
    };
    return m.toString();
}

Credentials.createWithMnemonic = function (network, passphrase, language, account, type, info, segwit) {
    _checkNetwork(network);
    if (!wordsForLang[language])
        throw new Error('Unsupported language');
    $.shouldBeNumber(account);

    var m = new Mnemonic(wordsForLang[language]);
    while (!Mnemonic.isValid(m.toString())) {
        console.log('--- retrying mnemonic generation');
        m = new Mnemonic(wordsForLang[language])
    };
    var x = new Credentials(type);

    x.network = network;
    x.account = account;
    x.xPrivKey = m.toHDPrivateKey(passphrase, network).toString();
    x._expand(passphrase, info, segwit);
    x.mnemonic = m.phrase;
    x.mnemonicHasPassphrase = !!passphrase;
    console.log("credentials: createWithMnemonic " + network + ', ' + passphrase + ',' + language + ',' + account);

    return x;
};

Credentials.fromExtendedPrivateKey = function (xPrivKey, account, type) {
    var x = new Credentials(type);
    x.xPrivKey = xPrivKey;
    x.account = account || 0;
    x._expand();
    return x;
};

Credentials.fromPirvateKey = function (privateKey, account, passphrase, type, info, segwit, network, walletName){
    console.log(666666666666666);
    var x = new Credentials(type);
    console.log(888888);
    x.xPrivKey = privateKey;
    x.account = account || 0;
    console.log(777777777);
    x._expand(passphrase, info, segwit, network, walletName);
    return x;
};

Credentials.fromMnemonic = function (network, words, passphrase, account, derivationStrategy, type, info, segwit, walletName) {
    _checkNetwork(network);
    $.shouldBeNumber(account);
    $.checkArgument(_.includes(_.values(Constants.DERIVATION_STRATEGIES), derivationStrategy));

    var m = new Mnemonic(words);
    console.log('TYPE TEST' + type);
    var x = new Credentials(type);
    x.xPrivKey = m.toHDPrivateKey(passphrase, network).toString();
    x.mnemonic = words; // store the mnemonic
    x.mnemonicHasPassphrase = !!passphrase;
    x.account = account;
    x.derivationStrategy = derivationStrategy;
    x._expand(passphrase, info, segwit, network, walletName);
    return x;
};

/*
 * BWC uses
 * xPrivKey -> m/44'/network'/account' -> Base Address Key
 * so, xPubKey is PublicKeyHD(xPrivKey.derive("m/44'/network'/account'").
 *
 * For external sources, this derivation should be done before
 * call fromExtendedPublicKey
 *
 * entropySource should be a HEX string containing pseudo-random data, that can
 * be deterministically derived from the xPrivKey, and should not be derived from xPubKey
 */
Credentials.fromExtendedPublicKey = function (xPubKey, source, entropySourceHex, account, derivationStrategy, type) {
    $.checkArgument(entropySourceHex);
    $.shouldBeNumber(account);
    $.checkArgument(_.includes(_.values(Constants.DERIVATION_STRATEGIES), derivationStrategy));

    var entropyBuffer = new Buffer(entropySourceHex, 'hex');
    //require at least 112 bits of entropy
    $.checkArgument(entropyBuffer.length >= 14, 'At least 112 bits of entropy are needed')

    var x = new Credentials(type);
    x.xPubKey = xPubKey;
    x.entropySource = Bitcore.crypto.Hash.sha256sha256(entropyBuffer).toString('hex');
    x.account = account;
    x.derivationStrategy = derivationStrategy; //这里是加密参数
    x.externalSource = source;
    x._expand();
    return x;
};

// Get network from extended private key or extended public key
// btc not have this check btc只能通过地址判断是测试网还是正式网
Credentials._getNetworkFromExtendedKey = function (xKey, type) {
    $.checkArgument(xKey && _.isString(xKey));

    if (type == 'BTC'){

    }

    return xKey.charAt(0) == 't' ? 'testnet' : 'livenet';
};


Credentials.prototype._hashFromEntropy = function (prefix, length) {
    $.checkState(prefix);
    var b = new Buffer(this.entropySource, 'hex');
    var b2 = Bitcore.crypto.Hash.sha256hmac(b, new Buffer(prefix));
    return b2.slice(0, length);
};

/**
 * 生成一些钱包对象的默认参数 主要是 network  xPubKey publicKeyRing
 *
 * add by pmj
 *    btc 增加公钥数组 测试地址与正式地址的判断方式通过前缀是否是 [m,2]
 */
Credentials.prototype._expand = function (passphrase, info, segwit, inNetwork, walletName) {
    console.log('into expand');
    $.checkState(this.xPrivKey || (this.xPubKey && this.entropySource));
    if (this.type == 'INVE'){
        var network = Credentials._getNetworkFromExtendedKey(this.xPrivKey || this.xPubKey);
        if (this.network) {
            $.checkState(this.network == network);
        } else {
            this.network = network;
        }
        if (this.xPrivKey) {
            console.log('_expand path: ' + this.getBaseAddressDerivationPath());
            var xPrivKey = new Bitcore.HDPrivateKey.fromString(this.xPrivKey);

            // this extra derivation is not to share a non hardened xPubKey to the server.
            var addressDerivation = xPrivKey.derive(this.getBaseAddressDerivationPath());
            this.xPubKey = (new Bitcore.HDPublicKey(addressDerivation)).toString();
            console.log('_expand xPubKey: ' + this.xPubKey);
        } else {
        }
    } else if (this.type == 'BTC'){
        try {
            console.log('coming');
            console.log(this.xPrivKey, this.type, walletName, passphrase, info, segwit, 1, inNetwork);
            if (this.mnemonic){
                this.otherObject = new bitcoinCore(this.mnemonic, this.type, walletName, passphrase, info, segwit, 0, inNetwork);
            } else {
                this.otherObject = new bitcoinCore(this.xPrivKey, this.type, walletName, passphrase, info, segwit, 1, inNetwork);
            }
            this.segwit = segwit;
            console.log('end');
            this.xPubKey = this.otherObject.getPublicKey();
            console.log(this.xPubKey);
            //var network = Credentials._getNetworkFromExtendedKey(this.otherObject.getAddress(), 'BTC');
            //if (this.network) {
            //    $.checkState(this.network == network);
            //} else {
                this.network = inNetwork;
            //}
        } catch (err){
            console.log(err);
        }

    } else if (this.type == 'ETH'){
        try {
            if (this.mnemonic){
                this.otherObject = new ethCore(this.mnemonic, this.type, walletName, passphrase, info, 0);
            } else {
                this.otherObject = new ethCore(this.xPrivKey, this.type, walletName, passphrase, info, 1);
            }
            this.segwit = segwit;
            console.log('end');
            this.xPubKey = this.otherObject.getPublicKey();
            console.log(this.xPubKey);
            //var network = Credentials._getNetworkFromExtendedKey(this.otherObject.getAddress(), 'BTC');
            //if (this.network) {
            //    $.checkState(this.network == network);
            //} else {
            this.network = inNetwork;
            //}
        } catch (err){
            console.log(err);
        }
    }

    this.publicKeyRing = [{
        xPubKey: this.xPubKey,
    }];
};

Credentials.fromObj = function (obj) {
    var x = new Credentials();

    _.each(FIELDS, function (k) {
        x[k] = obj[k];
    });

    x.derivationStrategy = x.derivationStrategy || Constants.DERIVATION_STRATEGIES.BIP44;
    x.account = x.account || 0;

    $.checkState(x.xPrivKey || x.xPubKey || x.xPrivKeyEncrypted, "invalid input");
    return x;
};

Credentials.prototype.toObj = function () {
    var self = this;

    if (self.hasPrivKeyEncrypted())
        self.lock();

    var x = {};
    // _.each(FIELDS, function(k) {
    //   if (k !== 'xPrivKey' && k !== 'mnemonic' && k !== 'xPrivKeyEncrypted' && k !== 'mnemonicEncrypted')
    //       x[k] = self[k];
    // });
    _.each(FIELDS, function (k) {
        // if (k !== 'xPrivKey' && k !== 'mnemonic' && k !== 'xPrivKeyEncrypted' && k !== 'mnemonicEncrypted')
        x[k] = self[k];
    });
    return x;
};

Credentials.prototype.getBaseAddressDerivationPath = function () {
    var purpose;
    switch (this.derivationStrategy) {
        case Constants.DERIVATION_STRATEGIES.BIP44:
            purpose = '44';
            break;
        case Constants.DERIVATION_STRATEGIES.BIP48:
            purpose = '48';
            break;
        case Constants.DERIVATION_STRATEGIES.BIP49:
            purpose = '49';
            break;
    }

    var coin = (this.network == 'livenet' ? "0" : "1");
    if (this.type == 'BTC') {
        //m/44'/0'/0'/0/
        return "m/" + purpose + "'/0'/0'/0/" + this.account + "";
    }
    return "m/" + purpose + "'/" + coin + "'/" + this.account + "'";
};

Credentials.prototype.getDerivedXPrivKey = function () {
    var path = this.getBaseAddressDerivationPath();
    return new Bitcore.HDPrivateKey(this.xPrivKey, this.network).derive(path);
};


Credentials.prototype.addWalletInfo = function (walletName, m, n) {
    //this.walletId = crypto.createHash("sha256").update(this.xPubKey, "utf8").digest("base64");
    this.walletName = walletName;
    this.m = m;
    this.n = n;


    // Use m/48' for multisig hardware wallets
    if (!this.xPrivKey && this.externalSource && n > 1) {
        this.derivationStrategy = Constants.DERIVATION_STRATEGIES.BIP48;
    }

    if (n == 1) {
        this.addPublicKeyRing([{
            xPubKey: this.xPubKey
        }]);
    }
};

Credentials.prototype.hasWalletInfo = function () {
    return !!this.n;
};

Credentials.prototype.isPrivKeyEncrypted = function () {
    return (!!this.xPrivKeyEncrypted) && !this.xPrivKey;
};

Credentials.prototype.hasPrivKeyEncrypted = function () {
    return (!!this.xPrivKeyEncrypted);
};

Credentials.prototype.setPrivateKeyEncryption = function (password, opts) {
    if (this.xPrivKeyEncrypted)
        throw new Error('Encrypted Privkey Already exists');

    if (!this.xPrivKey)
        throw new Error('No private key to encrypt');


    this.xPrivKeyEncrypted = sjcl.encrypt(password, this.xPrivKey, opts);
    if (!this.xPrivKeyEncrypted)
        throw new Error('Could not encrypt');

    if (this.mnemonic)
        this.mnemonicEncrypted = sjcl.encrypt(password, this.mnemonic, opts);
};


Credentials.prototype.disablePrivateKeyEncryption = function () {
    if (!this.xPrivKeyEncrypted)
        throw new Error('Private Key is not encrypted');

    if (!this.xPrivKey)
        throw new Error('Wallet is locked, cannot disable encryption');

    this.xPrivKeyEncrypted = null;
    this.mnemonicEncrypted = null;
};


Credentials.prototype.lock = function () {
    if (!this.xPrivKeyEncrypted)
        throw new Error('Could not lock, no encrypted private key');

    delete this.xPrivKey;
    delete this.mnemonic;
};

Credentials.prototype.unlock = function (password) {
    console.log('password' + password);
    $.checkArgument(password);

    if (this.xPrivKeyEncrypted) {
        this.xPrivKey = sjcl.decrypt(password, this.xPrivKeyEncrypted);
        if (this.mnemonicEncrypted) {
            this.mnemonic = sjcl.decrypt(password, this.mnemonicEncrypted);
        }
    }
};

Credentials.prototype.addPublicKeyRing = function (publicKeyRing) {
    this.publicKeyRing = _.clone(publicKeyRing);
};

Credentials.prototype.canSign = function () {
    return (!!this.xPrivKey || !!this.xPrivKeyEncrypted);
};

Credentials.prototype.setNoSign = function () {
    delete this.xPrivKey;
    delete this.xPrivKeyEncrypted;
    delete this.mnemonic;
    delete this.mnemonicEncrypted;
};

Credentials.prototype.isComplete = function () {
    if (!this.m || !this.n) return false;
    if (!this.publicKeyRing || this.publicKeyRing.length != this.n) return false;
    return true;
};

Credentials.prototype.hasExternalSource = function () {
    return (typeof this.externalSource == "string");
};

Credentials.prototype.getExternalSourceName = function () {
    return this.externalSource;
};

Credentials.prototype.getMnemonic = function () {
    if (this.mnemonicEncrypted && !this.mnemonic) {
        throw new Error('Credentials are encrypted');
    }

    return this.mnemonic;
};


Credentials.prototype.clearMnemonic = function () {
    delete this.mnemonic;
    delete this.mnemonicEncrypted;
};


module.exports = Credentials;
