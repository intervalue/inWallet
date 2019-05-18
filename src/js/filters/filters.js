'use strict';

angular.module('copayApp.filters', [])
  .filter('amTimeAgo', ['amMoment',
    function(amMoment) {
      return function(input) {
        return amMoment.preprocessDate(input).fromNow();
      };
    }
  ])
  .filter('paged', function() {
    return function(elements) {
      if (elements) {
        return elements.filter(Boolean);
      }

      return false;
    };
  })
  .filter('removeEmpty', function() {
    return function(elements) {
      elements = elements || [];
      // Hide empty change addresses from other copayers
      return elements.filter(function(e) {
        return !e.isChange || e.balance > 0;
      });
    }
  })

  .filter('noFractionNumber', ['$filter', '$locale', 'configService',
    function(filter, locale, configService) {
      var numberFilter = filter('number');
      var formats = locale.NUMBER_FORMATS;
      var config = configService.getSync().wallet.settings;
      return function(amount, n) {
        if (typeof(n) === 'undefined' && !config) return amount;

        var fractionSize = (typeof(n) !== 'undefined') ?
          n : config.unitValue.toString().length - 1;
        var value = numberFilter(amount, fractionSize);
        var sep = value.indexOf(formats.DECIMAL_SEP);
        var group = value.indexOf(formats.GROUP_SEP);
        if (amount >= 0) {
          if (group > 0) {
            if (sep < 0) {
              return value;
            }
            var intValue = value.substring(0, sep);
            var floatValue = parseFloat(value.substring(sep));
            if (floatValue === 0) {
              floatValue = '';
            } else {
              if (floatValue % 1 === 0) {
                floatValue = floatValue.toFixed(0);
              }
              floatValue = floatValue.toString().substring(1);
            }
            var finalValue = intValue + floatValue;
            return finalValue;
          } else {
            value = parseFloat(value);
            if (value % 1 === 0) {
              value = value.toFixed(0);
            }
            return value;
          }
        }
        return 0;
      };
    }
  ])
  .filter('tenEllips', function() {
      var tenexp = /^([a-zA-Z0-9]{10})(.*)([a-zA-Z0-9]{10})$/g;
      return function(elements) {
          elements = elements || [];
          return elements.replace(tenexp, '$1...$3');
      }
  })
  .filter('trustAsResourceUrl', ['$sce', function($sce) {
      return function(val) {
          return $sce.trustAsResourceUrl(val);
      };
  }])
  .filter('encodeURIComponent', function() {//编码特殊字符为百分号字符
      return window.encodeURIComponent;
  })
  .filter('objectKeys', [function() {//对象排序
      return function(item) {
          if (!item) return null;
          var keys = Object.keys(item);
          keys.sort();
          return keys;
      };
  }])
  .filter('sumNumbers', [function(){
      return function(str) {
          return str ? str.split(/[\n\s,;]/).reduce(function(acc, val){return isNaN(+val) ? acc : acc + (+val)}, 0) : 0;
      };
  }])
  .filter('isEyeShowOrNOt', [function(){
        return function(value, showqian, lang, isunit, banner) {
            if(showqian){
                if(value == 0){
                    if(isunit){//带单位的金额
                        if(lang == 'en'){
                            return '= 0.00 $';
                        }else{
                            return '= 0.00 ￥';
                        }
                    }else{//不带单位的金额
                        return '0.00';
                    }
                }else{
                    if(!banner){//不是banner上面的金额
                        if(isunit){//带单位的金额
                            if(lang == 'en'){
                                return '≈ '+value.toFixed(4)+' $';
                            }else{
                                return '≈ '+value.toFixed(4)+' ￥';
                            }
                        }else{//不带单位的金额
                            return value;
                        }
                    }else{//banner上面的金额
                        return value.toFixed(2)
                    }
                }
            }else{
                return '＊＊＊＊＊';
            }
        };
    }]);
