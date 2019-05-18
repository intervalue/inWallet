var Bitcore = require('bitcore-lib');
var Mnemonic = require('bitcore-mnemonic');
var ecdsaSig = require('inWalletcore/signature');
var objectHash = require('inWalletcore/object_hash.js');
let words = 'shield salmon sport horse cool hole pool panda embark wrap fancy equip'
//xprv9s21ZrQH143K41SuZsbEspEJ6e2zgYDyk9HEC6FA1L2BQfuJffCD8QUkkSQcJipZKVj6Lvd9vqsaATVQkWg2pX7SEnW6VQGz9N4JxLWRmF1
var m = new Mnemonic(words);
let xprivKey = 'xprv9s21ZrQH143K4aqjA1znm7o6isSkaRvy4h5Xeoaw6H6MhCF1scJTdDZ8z6DoJMESPQJcfdKaSAE7xo65iSK4nqxKXengFSerDSLsnP1LqJM';
let msg = '11111dsfsdfsdfsdf111'
var pubkey ="AgEeN3Kt1VRDgGmi9J3mb8BgGQJcBHfDop+fnS23RSnv"
let message1 = {
        pubkey:'testset'
}
var buf_to_sign = require("inWalletcore/secrethelper").sha256hash(new Buffer(JSON.stringify(message1)));
//获取签名的私钥
var xPrivKey = new Bitcore.HDPrivateKey.fromString(xprivKey);
var path = "m/44'/0'/0'/0/0";
var privKeyBuf = xPrivKey.derive(path).privateKey.bn.toBuffer({size:32});

// var privKeyBuf = params.getLocalPrivateKey(params.xPrivKey);
//通过私钥进行签名
let signature = ecdsaSig.sign(buf_to_sign, privKeyBuf);



let flag = ecdsaSig.verify(buf_to_sign,signature,pubkey)
let obj = JSON.parse(JSON.stringify(message1))
let message = {
    message:JSON.stringify(message1),
    pubkey :pubkey,
    signature :signature
}

console.log(message)


console.log('message: ',JSON.stringify(message1))
console.log('signature: ',signature)
console.log('sendMessage: ',JSON.stringify(message))
console.log('flag: ',flag)


const webhelper = require('inWalletcore/webhelper')
let header = {'Content-Type':'application/json'};
let getAddressUrl ='http://180.76.150.134:5000/get_address';

/**
 * 获取snc地址
 */
webhelper.httpPost(getAddressUrl,header,JSON.stringify(message),function (err,res) {
    if(err) console.log('err: ',err);
    if(res) console.log('res: ',JSON.parse(res))
})








