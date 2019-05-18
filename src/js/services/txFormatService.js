'use strict';

var constants = require('inWalletcore/constants.js');

angular.module('copayApp.services').factory('txFormatService', function (profileService, configService, lodash) {
  var root = {};

  var formatAmountStr = function (amount, asset) {
    if (!amount) return;
    return profileService.formatAmountWithUnit(amount, asset);
  };

  var formatAmount = function (amount, asset) {
      return profileService.formatAmountUnit(amount, asset);
  };

  var formatFeeStr = function (fee , asset) {
    if (!fee) return;
    let unit = asset =='inve' ? 'inve' : (asset =='btc' ? 'satoshi': 'gas');
    return formatAmount(fee, unit) + ' '+(unit =='inve' ? 'INVE' : unit);
  };

  root.processTx = function (tx,asset) {
    if (!tx) return;
    //console.log(JSON.stringify(tx));
    var outputs = tx.outputs ? tx.outputs.length : 0;
    if (outputs > 1 && tx.action != 'received') {
      tx.hasMultiplesOutputs = true;
      tx.recipientCount = outputs;
      tx.amount = lodash.reduce(tx.outputs, function (total, o) {
        o.amountStr = formatAmountStr(o.amount, tx.asset);
        return total + o.amount;
      }, 0);
    }
    tx.my_address = tx.addressFrom;
    tx.asset = asset;
    tx.confirmations = tx.result;
    tx.time = tx.creation_date;
    tx.amountStr = formatAmountStr(tx.amount, asset);
    tx.amountTl = formatAmount(tx.amount, asset);//
    tx.feeStr = formatFeeStr(tx.fee + tx.fee_point || tx.fees , tx.asset);
    tx.addressFrom = tx.addressFrom;
    return tx;
  };

  return root;
});
