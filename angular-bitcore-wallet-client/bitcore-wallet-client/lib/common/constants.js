'use strict';

var Constants = {};

Constants.DERIVATION_STRATEGIES = {
  BIP44: 'BIP44',
  BIP48: 'BIP48',
  BIP49: 'BIP49'
};




Constants.UNITS = {
    btc: {
        value: 100000000,
        maxDecimals: 0,
        minDecimals: 0,
    },
    eth: {
        value: 1000000000000000000,
        maxDecimals: 0,
        minDecimals: 0,
    },
      inve: {
        value: 1000000000000000000,
        maxDecimals: 0,
        minDecimals: 0,
      },
    snc: {
        value: 1000000,
        maxDecimals: 0,
        minDecimals: 0,
    }
};

module.exports = Constants;
