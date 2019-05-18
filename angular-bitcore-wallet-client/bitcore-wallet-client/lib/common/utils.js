'use strict';

var _ = require('lodash');

var Constants = require('./constants');

function Utils() {};









Utils.formatAmount = function(bytes, unitCode, opts) {
  //if(!_.isNumber(bytes)) throw new Error("Variable should be a Number.");
  //if(!Constants.UNITS[unitCode]) throw new Error("Illegal Argument.");

  function addSeparators(nStr, thousands, decimal, minDecimals) {
    nStr = nStr.replace('.', decimal);
    var x = nStr.split(decimal);
    var x0 = x[0];
    var x1 = x[1];

    x1 = _.dropRightWhile(x1, function(n, i) {
        return n == '0' && i >= minDecimals;
    }).join('');
    var x2 = x.length > 1 && parseInt(x[1]) ? decimal + x1 : '';

    // in safari, toLocaleString doesn't add thousands separators
    if (navigator && navigator.vendor && navigator.vendor.indexOf('Apple') >= 0) {
			x0 = x0.replace(/\B(?=(\d{3})+(?!\d))/g, thousands);
			return x0 + x2;
		}
    else {
        if(x1){
            return parseFloat(x0).toLocaleString([], {maximumFractionDigits: 20})+"."+x1;
        }else
        return parseFloat(x0).toLocaleString([], {maximumFractionDigits: 20});
		}
  }


  opts = opts || {};

  var u = Constants.UNITS[unitCode] ? Constants.UNITS[unitCode] : 1;
  //var intAmountLength = Math.floor(bytes / u.value).toString().length;
  //var digits = intAmountLength >= 6 || unitCode == 'one' ? 0 : 6 - intAmountLength;
  //   var digits = (unitCode =='inve' || unitCode == 'eth') ? 18 : 8;//修改INVE由6位小数改为18位小数
  var digits = (u.value+"").length-1;//修改INVE由6位小数改为18位小数
  var amount = ( unitCode=='atom' ||unitCode=='satoshi' || unitCode=='gas') ? bytes.toFixed(0) :(bytes / u.value).toFixed(digits);
  var Decimal = require('decimal.js');
  if (unitCode=='eth'||unitCode=='inve')
      amount = new Decimal(bytes).div(new Decimal(u.value)).toString();
  if(amount.match(/e/)) amount = (bytes / u.value).toFixed(digits);
  return addSeparators(amount, opts.thousandsSeparator || ',', opts.decimalSeparator || '.', u.minDecimals);
};

module.exports = Utils;