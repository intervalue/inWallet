'use strict';

function selectText(element) {
    var doc = document;
    if (doc.body.createTextRange) { // ms
        var range = doc.body.createTextRange();
        range.moveToElementText(element);
        range.select();
    } else if (window.getSelection) {
        var selection = window.getSelection();
        var range = doc.createRange();
        range.selectNodeContents(element);
        selection.removeAllRanges();
        selection.addRange(range);

    }
}

function isValidAddress(value,type) {
    var ValidationUtils = require('inWalletcore/validation_utils.js');
    if (!value) {
        return false;
    }
    console.log(ValidationUtils.isValidAddress(value,type))
        return ValidationUtils.isValidAddress(value,type);



}

angular.module('copayApp.directives')
    .directive('validAddress', ['$rootScope', 'profileService',
        function($rootScope, profileService) {
            return {
                require: 'ngModel',
                link: function(scope, elem, attrs, ctrl) {
                    var validator = function(value) {
                        var type = attrs.validAddress;
                        if (!profileService.focusedClient)
                            return;
                        ctrl.$setValidity('validAddress', isValidAddress(value,type));
                        return value;
                    };
                    ctrl.$parsers.unshift(validator);
                    ctrl.$formatters.unshift(validator);
                }
            };
        }
    ])
    .directive('validAddresses', ['$rootScope', 'profileService', 'configService',
        function($rootScope, profileService, configService) {
            return {
                require: 'ngModel',
                link: function(scope, elem, attrs, ctrl) {
                    var asset = attrs.validAddresses;
                    var validator = function(value) {
                        for (var key in ctrl.$error) {
                            if (key.indexOf('line-') > -1) ctrl.$setValidity(key, true);
                        }
                        if (!profileService.focusedClient || !value)
                            return value;
                        var lines = value.split(/\r?\n/);
                        if (lines.length > 120) {
                            ctrl.$setValidity('validAddresses', false);
                            return value;
                        }
                        for (i = 0; i < lines.length; i++) {
                            var tokens = lines[i].trim().match(/^([A-Z0-9]{32})[\s,;]+([0-9]*\.[0-9]+|[0-9]+)$/);
                            if (!tokens) {
                                ctrl.$setValidity('validAddresses', false);
                                ctrl.$setValidity("line-" + lines[i], false); //hack to get wrong line text
                                return value;
                            }
                            var address = tokens[1];
                            var amount = +tokens[2];

                            var settings = configService.getSync().wallet.settings;
                            var unitValue = 1;
                            var decimals = 0;
                            if (asset === 'base'){
                                unitValue = settings.unitValue;
                                decimals = Number(settings.unitDecimals);
                            }
                            else if (profileService.assetMetadata[asset]){
                                decimals = profileService.assetMetadata[asset].decimals || 0;
                                unitValue = Math.pow(10, decimals);
                            }

                            var vNum = Number((amount * unitValue).toFixed(0));

                            if (!isValidAddress(address) || typeof vNum !== "number" || vNum <= 0) {
                                ctrl.$setValidity('validAddresses', false);
                                ctrl.$setValidity("line-" + lines[i], false); //hack to get wrong line text
                                return value;
                            }
                            var sep_index = ('' + amount).indexOf('.');
                            var str_value = ('' + amount).substring(sep_index + 1);
                            if (sep_index > 0 && str_value.length > decimals) {
                                ctrl.$setValidity('validAddresses', false);
                                ctrl.$setValidity("line-" + lines[i], false); //hack to get wrong line text
                                return value;
                            }
                        }
                        ctrl.$setValidity('validAddresses', true);
                        return value;
                    };
                    ctrl.$parsers.unshift(validator);
                    ctrl.$formatters.unshift(validator);
                }
            };
        }
    ])
    .directive('validUrl', [

        function() {
            return {
                require: 'ngModel',
                link: function(scope, elem, attrs, ctrl) {
                    var validator = function(value) {
                        // Regular url
                        if (/^https?:\/\//.test(value)) {
                            ctrl.$setValidity('validUrl', true);
                            return value;
                        } else {
                            ctrl.$setValidity('validUrl', false);
                            return value;
                        }
                    };

                    ctrl.$parsers.unshift(validator);
                    ctrl.$formatters.unshift(validator);
                }
            };
        }
    ])
    .directive('validMnemonic', [function() {
        return {
            require: 'ngModel',
            link: function(scope, elem, attrs, ctrl) {
                var Mnemonic = require('bitcore-mnemonic');
                var validator = function(value) {
                    try {
                        value = value.split('-').join(' ');
                        if (Mnemonic.isValid(value)) {
                            ctrl.$setValidity('validMnemonic', true);
                            return value;
                        } else {
                            ctrl.$setValidity('validMnemonic', false);
                            return value;
                        }
                    } catch(ex) {
                        ctrl.$setValidity('validMnemonic', false);
                        return value;
                    }
                };
                ctrl.$parsers.unshift(validator);
                ctrl.$formatters.unshift(validator);
            }
        };
    }
    ])
    .directive('validAmount', ['configService', 'profileService', '$parse',
        function(configService, profileService, $parse) {
            var parseval = '';
            return {
                require: 'ngModel',
                link: function(scope, element, attrs, ctrl) {
                    function validamount(value) {
                        var sixellisexp = /^([0-9]+\.[0-9]{7,})$/g;
                        var sixvl = /^([0-9]+\.[0-9]{6})([0-9]*)$/;
                        var asset = attrs.validAmount;
                        var settings = configService.getSync().wallet.settings;
                        var unitValue = 1;
                        var decimals = 0;
                        if (asset === 'INVE'){
                            unitValue = settings.unitValue;
                            decimals = Number(settings.unitDecimals);
                        }else if(asset === 'BTC'){
                            unitValue = 100000000;
                            decimals = 8;
                        }else if(asset === 'ETH'){
                            unitValue = 100000000;
                            decimals = 8;
                        }

                        var vNum = Number((value * unitValue).toFixed(0));

                        if (isNaN(vNum)) {
                            $parse(attrs['ngModel']).assign(scope, '');
                            return true;
                        }

                        if (typeof value == 'undefined' || value == 0) {
                            ctrl.$pristine = true;
                            ctrl.$setValidity('validAmount', false);
                            return;
                        }

                        if(value.match(sixellisexp)){
                            ctrl.$setValidity('validAmount', false);
                            parseval = value.replace(sixvl,'$1');
                            $parse(attrs['ngModel']).assign(scope, parseval);
                            return true;
                        }

                        if (typeof vNum == "number" && vNum > 0) {

                            var sep_index = ('' + value).indexOf('.');
                            var str_value = ('' + value).substring(sep_index + 1);
                            if (sep_index > 0 && str_value.length > decimals) {
                                ctrl.$setValidity('validAmount', false);
                            }else if(sep_index == 0){
                                ctrl.$setValidity('validAmount', false);
                            }else if(str_value == 0){
                                ctrl.$setValidity('validAmount', false);
                            }else {
                                ctrl.$setValidity('validAmount', true);
                            }
                            return value;
                        } else {
                            ctrl.$setValidity('validAmount', false);
                            return value;
                        }

                    }
                    if (ctrl) {
                        scope.$watch(function(){
                            return ctrl.$modelValue + "";
                        },function(val){
                            validamount(val)
                        })
                    }
                }
            }
        }
    ])
    .directive('validFeedName', ['configService',
        function(configService) {

            return {
                require: 'ngModel',
                link: function(scope, elem, attrs, ctrl) {
                    var validator = function(value) {
                        var oracle = configService.oracles[attrs.validFeedName];
                        if (!oracle || !oracle.feednames_filter) {
                            ctrl.$setValidity('validFeedName', true);
                            return value;
                        }
                        for (var i in oracle.feednames_filter) {
                            var matcher = new RegExp(oracle.feednames_filter[i], "g");
                            if (matcher.test(value)) {
                                ctrl.$setValidity('validFeedName', true);
                                return value;
                            }
                        }
                        ctrl.$setValidity('validFeedName', false);
                        return value;
                    };

                    ctrl.$parsers.unshift(validator);
                    ctrl.$formatters.unshift(validator);
                }
            };
        }
    ])
    .directive('validFeedValue', ['configService',
        function(configService) {

            return {
                require: 'ngModel',
                link: function(scope, elem, attrs, ctrl) {
                    var validator = function(value) {
                        var oracle = configService.oracles[attrs.validFeedValue];
                        if (!oracle || !oracle.feedvalues_filter) {
                            ctrl.$setValidity('validFeedValue', true);
                            return value;
                        }
                        for (var i in oracle.feedvalues_filter) {
                            var matcher = new RegExp(oracle.feedvalues_filter[i], "g");
                            if (matcher.test(value)) {
                                ctrl.$setValidity('validFeedValue', true);
                                return value;
                            }
                        }
                        ctrl.$setValidity('validFeedValue', false);
                        return value;
                    };

                    ctrl.$parsers.unshift(validator);
                    ctrl.$formatters.unshift(validator);
                }
            };
        }
    ])
    .directive('loading', function() {
        return {
            restrict: 'A',
            link: function($scope, element, attr) {
                var a = element.html();
                var text = attr.loading;
                element.on('click', function() {
                    element.html('<i class="size-21 fi-bitcoin-circle icon-rotate spinner"></i> ' + text + '...');
                });
                $scope.$watch('loading', function(val) {
                    if (!val) {
                        element.html(a);
                    }
                });
            }
        }
    })
    .directive('ngFileSelect', function() {
        return {
            link: function($scope, el) {
                el.bind('change', function(e) {
                    $scope.file = (e.srcElement || e.target).files[0];
                    $scope.getFile();
                });
            }
        }
    })
    .directive('contact', ['addressbookService', function(addressbookService) {
        return {
            restrict: 'E',
            link: function(scope, element, attrs) {
                var addr = attrs.address;
                addressbookService.getLabel(addr, function(label) {
                    if (label) {
                        element.append(label);
                    } else {
                        element.append(addr);
                    }
                });
            }
        };
    }])
    .directive('highlightOnChange', function() {
        return {
            restrict: 'A',
            link: function(scope, element, attrs) {
                scope.$watch(attrs.highlightOnChange, function(newValue, oldValue) {
                    element.addClass('highlight');
                    setTimeout(function() {
                        element.removeClass('highlight');
                    }, 500);
                });
            }
        }
    })
    .directive('checkStrength', function() {
        return {
            replace: false,
            restrict: 'EACM',
            require: 'ngModel',
            link: function(scope, element, attrs) {

                var MIN_LENGTH = 8;
                var MESSAGES = ['Very Weak', 'Very Weak', 'Weak', 'Medium', 'Strong', 'Very Strong'];
                var COLOR = ['#dd514c', '#dd514c', '#faa732', '#faa732', '#16A085', '#16A085'];

                function evaluateMeter(password) {
                    var passwordStrength = 0;
                    var text;
                    if (password.length > 0) passwordStrength = 1;
                    if (password.length >= MIN_LENGTH) {
                        if ((password.match(/[a-z]/)) && (password.match(/[A-Z]/))) {
                            passwordStrength++;
                        } else {
                            text = ', add mixed case';
                        }
                        if (password.match(/\d+/)) {
                            passwordStrength++;
                        } else {
                            if (!text) text = ', add numerals';
                        }
                        if (password.match(/.[!,@,#,$,%,^,&,*,?,_,~,-,(,)]/)) {
                            passwordStrength++;
                        } else {
                            if (!text) text = ', add punctuation';
                        }
                        if (password.length > 12) {
                            passwordStrength++;
                        } else {
                            if (!text) text = ', add characters';
                        }
                    } else {
                        text = ', that\'s short';
                    }
                    if (!text) text = '';

                    return {
                        strength: passwordStrength,
                        message: MESSAGES[passwordStrength] + text,
                        color: COLOR[passwordStrength]
                    }
                }

                scope.$watch(attrs.ngModel, function(newValue, oldValue) {
                    if (newValue && newValue !== '') {
                        var info = evaluateMeter(newValue);
                        scope[attrs.checkStrength] = info;
                    }
                });
            }
        };
    })
    .directive('showFocus', function($timeout) {
        return function(scope, element, attrs) {
            scope.$watch(attrs.showFocus,
                function(newValue) {
                    $timeout(function() {
                        newValue && element[0].focus();
                    });
                }, true);
        };
    })
    .directive('match', function() {
        return {
            require: 'ngModel',
            restrict: 'A',
            scope: {
                match: '='
            },
            link: function(scope, elem, attrs, ctrl) {
                scope.$watch(function() {
                    return (ctrl.$pristine && angular.isUndefined(ctrl.$modelValue)) || scope.match === ctrl.$modelValue;
                }, function(currentValue) {
                    ctrl.$setValidity('match', currentValue);
                });
            }
        };
    })
    .directive('clipCopy', function() {
        return {
            restrict: 'A',
            scope: {
                clipCopy: '=clipCopy'
            },
            link: function(scope, elm) {
                // TODO this does not work (FIXME)
                elm.attr('tooltip', 'Press Ctrl+C to Copy');
                elm.attr('tooltip-placement', 'top');

                elm.bind('click', function() {
                    selectText(elm[0]);
                });
            }
        };
    })
    .directive('logo', function() {
        return {
            restrict: 'E',
            scope: {
                width: "@",
                negative: "="
            },
            controller: function($scope) {
                //$scope.logo_url = $scope.negative ? 'img/logo-negative.svg' : 'img/logo.svg';
                $scope.logo_url = $scope.negative ? 'img/icons/icon-white-32.png' : 'img/icons/icon-black-32.png';
            },
            replace: true,
            //template: '<img ng-src="{{ logo_url }}" alt="inWallet">'
            template: '<div><img ng-src="{{ logo_url }}" alt="inWallet"><br>inWallet</div>'
        }
    })
    .directive('availableBalance', function() {
        return {
            restrict: 'E',
            replace: true,
            templateUrl: 'views/includes/available-balance.html'
        }
    })
    .directive('selectable', function ($rootScope, $timeout) {
        return {
            restrict: 'A',
            scope: {
                bindObj: "=model",
                bindProp: "@prop",
                targetProp: "@exclusionBind"
            },
            link: function (scope, elem, attrs) {
                $timeout(function(){
                    var dropdown = angular.element(document.querySelector(attrs.selectable));

                    dropdown.find('li').on('click', function(e){
                        var li = angular.element(this);
                        elem.html(li.find('a').find('span').eq(0).html());
                        scope.bindObj[scope.bindProp] = li.attr('data-value');
                        $timeout(function () {
                            if(!$rootScope.$$phase) $rootScope.$digest();
                        },1);
                    });
                    scope.$watch(function(scope){return scope.bindObj[scope.bindProp]}, function(newValue, oldValue) {
                        angular.forEach(dropdown.find('li'), function(element){
                            var li = angular.element(element);
                            if (li.attr('data-value') == newValue) {
                                elem.html(li.find('a').find('span').eq(0).html());
                                li.addClass('selected');
                            } else {
                                li.removeClass('selected');
                            }
                        });
                    });
                    var selected = false;
                    angular.forEach(dropdown.find('li'), function(el){
                        var li = angular.element(el);
                        var a = angular.element(li.find('a'));
                        a.append('<i class="fi-check check"></i>');
                        if (scope.bindObj[scope.bindProp] == li.attr('data-value')) {
                            a[0].click();
                            selected = true;
                        }
                    });
                    if (!selected && typeof attrs.notSelected == "undefined") dropdown.find('a').eq(0)[0].click();

                    if (scope.targetProp) {
                        scope.$watch(function(scope){return scope.bindObj[scope.targetProp]}, function(newValue, oldValue) {
                            angular.forEach(dropdown.find('li'), function(element){
                                var li = angular.element(element);
                                if (li.attr('data-value') != newValue) {
                                    li[0].click();
                                    scope.bindObj[scope.bindProp] = li.attr('data-value');
                                }
                            });
                        });
                    }
                });
            }
        }})
    .directive('cosigners', function() {
        return {
            restrict: 'E',
            template: '<ul class="no-bullet m20b whopays">\
                      <li class="" ng-repeat="copayer in index.copayers">\
                          <span class="size-12 text-gray" ng-show="copayer.me">\
                              <i class="icon-contact size-24 m10r"></i>{{\'Me\'|translate}} <i class="fi-check m5 right"></i>\
                          </span>\
                          <div class="size-12" style="width: 100%" ng-show="!copayer.me" ng-click="copayer.signs = !copayer.signs">\
                              <i class="icon-contact size-24 m10r"></i> {{copayer.name}} ({{copayer.device_address.substr(0,4)}}...) <i class="m5 right" ng-class="copayer.signs ? \'fi-check\' : \'\'"></i>\
                          </div>\
                      </li>\
                    </ul>\
                    '
        }
    })
    .directive('historyBack', ['$window', function($window){
        return {
            restrict: "A",
            link: function(scope, element, attrs) {
                element.on('click', function() {
                    $window.history.back();
                });
            }
        }
    }])
    .directive("mdinputc", function(){//label动画
        return {
            scope: {},
            restrict: 'A',
            controller: function($scope, $element){
                this.setFocused = function(isFocused) {
                    $element.toggleClass('md-input-focused', !!isFocused);
                };
                this.setHasValue = function(hasValue) {
                    $element.toggleClass('md-input-has-value', !!hasValue);
                };
            }
        }
    })
    .directive("mdinput",function(){
        return {
            scope: {},
            restrict: 'A',
            require: ['^mdinputc','?ngModel'],
            link: postLink
        }
        function postLink(scope, elem, attrs, ctrl){
            var el = angular.element(elem);
            var self = this;
            el
                .on('focus', function(ev) {
                    ctrl[0].setFocused(true);
                    if((elem[0].value).trim() !== ''){
                        ctrl[0].setHasValue(true);
                    }else{
                        ctrl[0].setHasValue(false);
                    }
                })
                .on('blur', function(ev) {
                    ctrl[0].setFocused(false);
                    if((elem[0].value).trim() !== ''){
                        ctrl[0].setHasValue(true);
                    }else{
                        ctrl[0].setHasValue(false);
                        elem[0].value = '';
                    }
                });
            if(ctrl[1]){
                scope.$watch(function(){
                    return (ctrl[1]).$modelValue + "";
                },function(val){
                    if(val == 'undefined'){
                        ctrl[0].setHasValue(false);
                    }else if(val.trim() !== ''){
                        ctrl[0].setHasValue(true);
                    }else{
                        ctrl[0].setHasValue(false);
                    }
                })
            }
            scope.$on('$destroy', function() {
                ctrl[0].setFocused(false);
                ctrl[0].setHasValue(false);
            });
        }
    })
    .directive("mdlabel",function(){
        return {
            scope: {},
            restrict: 'A',
            require: '^mdinputc',
            link: postLink
        }
        function postLink(scope, elem, attrs, controllerInstance){
            var el = angular.element(elem);
            el
                .on('click', function(ev) {
                    controllerInstance.setFocused(true);
                })
            scope.$on('$destroy', function() {
                controllerInstance.setFocused(false);
                controllerInstance.setHasValue(false);
            });
        }
    })
    .directive("mdchangename",function(){
        return {
            scope: {},
            restrict: 'A',
            require: ['?ngModel'],
            link: postLink
        }
        function postLink(scope, elem, attrs, ctrl){
            if(ctrl){
                scope.$watch(function(){
                    return (ctrl).$modelValue + "";
                },function(val){
                    if(typeof(val) == 'undefined'){
                        ctrl.$setValidity('mdchangename', false);
                    }else if(val == ''){
                        ctrl.$setValidity('mdchangename', false);
                    }else if(val.length < 5 || val.length > 20){
                        ctrl.$setValidity('mdchangename', false);
                    }else{
                        ctrl.$setValidity('mdchangename', true);
                    }
                })
            }
        }
    })
    .directive("mdinputvalidc", function(){//输入框验证
        return {
            scope: {},
            restrict: 'A',
            controller: function($scope, $element, gettextCatalog){
                this.setErrorexp = function(isFocused, errpass) {
                    var errtext = '';
                    if (errpass.match(/regerror/))
                        errtext = '*Not less than 8 characters, it is recommended to mix uppercase and lowercase letters, numbers, special characters!';
                    else if (errpass.match(/lengtherror/))
                        errtext = '*Password cannot less than 8 digits or exceed 18 digits!';
                    else if (errpass.match(/lengthnameerror/))
                        errtext = '*Characters exceed the 1-20 limit!';
                    else if (errpass.match(/nomatch/))
                        errtext = '*Inconsistent password';
                    else if(errpass.match(/numerror/))
                        errtext = '*The amount must be a number or a decimal within 6 digits.';
                    $element[0].children[1].innerHTML = gettextCatalog.getString(errtext);
                    $element.removeClass('setWarmErrorexp');
                    $element.toggleClass('setErrorexp', !!isFocused);
                };
                this.setWarmErrorexp = function(isWarm, errpass) {
                    var errtext = '';
                    if (errpass.match(/easyerror/))
                        errtext = '*The password is too simple, it is recommended to mix uppercase and lowercase letters, numbers, special characters!';
                    $element[0].children[1].innerHTML = gettextCatalog.getString(errtext);
                    $element.removeClass('setErrorexp');
                    $element.toggleClass('setWarmErrorexp', !!isWarm);
                };
            }
        }
    })
    .directive("mdinputname",function(){
        return {
            scope: {},
            restrict: 'A',
            require: ['^mdinputvalidc','?ngModel'],
            link: postLink
        }
        function postLink(scope, elem, attrs, ctrl){
            if(ctrl[1]){
                scope.$watch(function(){
                    return (ctrl[1]).$modelValue + "";
                },function(val){
                    if(typeof(val) == 'undefined'){
                        ctrl[0].setErrorexp(false, 'noerror');
                        ctrl[1].$setValidity('mdinputname', false);
                    }else if(val == ''){
                        ctrl[0].setErrorexp(false, 'noerror');
                        ctrl[1].$setValidity('mdinputname', false);
                    }else if(val.length < 1 || val.length > 20){
                        ctrl[0].setErrorexp(true, 'lengthnameerror');
                        ctrl[1].$setValidity('mdinputname', false);
                    }else{
                        ctrl[0].setErrorexp(false, 'noerror');
                        ctrl[1].$setValidity('mdinputname', true);
                    }
                })
            }
        }
    })
    .directive("mdinputpass",function(){
        return {
            scope: {},
            restrict: 'A',
            require: ['^mdinputvalidc','?ngModel'],
            link: postLink
        }
        function postLink(scope, elem, attrs, ctrl){
            if(ctrl[1]){
                scope.$watch(function(){
                    return (ctrl[1]).$modelValue + "";
                },function(val){
                    var trimExp=/^[a-zA-Z0-9-\.!@#\$%&~\\\{\}\[\]\_\$\^\*\(\)\+\?><]{8,}$/;
                    var trimeasyExp=/^(([a-z]){8,18}|([A-Z]){8,18}|([0-9]){8,18})$/;
                    if(typeof(val) == 'undefined'){
                        ctrl[0].setErrorexp(false, 'noerror');
                        ctrl[1].$setValidity('mdinputpass', false);
                    }else if(val == ''){
                        ctrl[0].setErrorexp(false, 'noerror');
                        ctrl[1].$setValidity('mdinputpass', false);
                    }else if(val.length > 18 || val.length < 8){
                        ctrl[0].setErrorexp(true, 'lengtherror');
                        ctrl[1].$setValidity('mdinputpass', false);
                    }else if(trimeasyExp.test(val)){
                        ctrl[0].setWarmErrorexp(true, 'easyerror');
                        ctrl[1].$setValidity('mdinputpass', true);
                    }else{
                        ctrl[0].setErrorexp(false, 'noerror');
                        ctrl[1].$setValidity('mdinputpass', true);
                    }
                })
            }
        }
    })
    .directive("mdinputamount",['$parse', function($parse){
        return {
            scope: {},
            restrict: 'A',
            require: ['^mdinputvalidc','?ngModel'],
            link: postLink
        }
        function postLink(scope, elem, attrs, ctrl){
            var parseval = '';
            var sixellisexp = /^([0-9]+\.[0-9]{7,})$/g;
            var sixvl = /^([0-9]+\.[0-9]{6})([0-9]*)$/;
            if(ctrl[1]){
                scope.$watch(function(){
                    return (ctrl[1]).$modelValue + "";
                },function(val){
                    var vNum = Number((val * 1).toFixed(0));
                    if(val.match(sixellisexp)){
                        ctrl[0].setErrorexp(true, 'numerror');
                        ctrl[1].$setValidity('mdinputamount', false);
                        parseval = val.replace(sixvl,'$1');
                        $parse(attrs['ngModel']).assign(scope, parseval);
                        return true;
                    }
                    if(typeof(val) == 'undefined'){
                        ctrl[0].setErrorexp(false, 'noerror');
                        ctrl[1].$setValidity('mdinputamount', false);
                    }else if(val == ''){
                        ctrl[0].setErrorexp(false, 'noerror');
                        ctrl[1].$setValidity('mdinputamount', false);
                    }else if (typeof vNum == "number" && vNum >= 0) {
                        var sep_index = ('' + val).indexOf('.');
                        var str_value = ('' + val).substring(sep_index + 1);
                        if (sep_index > 0 && str_value.length > 6) {
                            ctrl[0].setErrorexp(true, 'numerror');
                            ctrl[1].$setValidity('mdinputamount', false);
                        }else if(sep_index > 0 && str_value.length == 0){
                            ctrl[0].setErrorexp(true, 'numerror');
                            ctrl[1].$setValidity('mdinputamount', false);
                        }else if(sep_index == 0){
                            ctrl[0].setErrorexp(true, 'numerror');
                            ctrl[1].$setValidity('mdinputamount', false);
                        }else if(str_value == 0){
                            ctrl[0].setErrorexp(true, 'numerror');
                            ctrl[1].$setValidity('mdinputamount', false);
                        }else if(val.length > 18){
                            ctrl[0].setErrorexp(true, 'lengtherror');
                            ctrl[1].$setValidity('mdinputamount', false);
                        }else {
                            ctrl[0].setErrorexp(false, 'noerror');
                            ctrl[1].$setValidity('mdinputamount', true);
                        }
                    }else{
                        ctrl[0].setErrorexp(true, 'numerror');
                        ctrl[1].$setValidity('mdinputamount', false);
                    }
                })
            }
        }
    }])
    .directive("input",function(){//IOS输入框相应慢
        return {
            restrict: 'E',
            link: postLink
        }
        function postLink(scope, elem, isCordova){
            var el = angular.element(elem);
            if(isCordova){
                el.on('click', function() {
                    el[0].focus();
                })
            }
            scope.$on('$destroy', function() {
                el[0].blur();
            });
        }
    })
    .directive("textarea",function(){//IOS输入框相应慢
        return {
            restrict: 'E',
            link: postLink
        }
        function postLink(scope, elem, isCordova){
            var el = angular.element(elem);
            if(isCordova){
                el.on('click', function() {
                    el[0].focus();
                })
            }
            scope.$on('$destroy', function() {
                el[0].blur();
            });
        }
    })
    .directive('homescrolled', function() {
        return function(scope, elm, attr) {//首页最新和行情滚动刷新
            var raw = elm[0];

            elm.bind('scroll', function() {
                if (raw.scrollTop + raw.offsetHeight >= raw.scrollHeight) {
                    scope.$apply(attr.homescrolled);
                };
            });
        };
    })
    .directive('homequiscrolled', function() {//首页快讯滚动刷新
        return function(scope, elm, attr) {
            var raw = elm[0];

            elm.bind('scroll', function() {
                scope.$apply(attr.quickscrolltop);
                if (raw.scrollTop + raw.offsetHeight >= raw.scrollHeight) {
                    scope.$apply(attr.homequiscrolled);
                };
            });
        };
    })
    .directive('homePullDown',function(){//首页最新和行情下拉刷新
        return{
            restrict:'A',
            link:function(scope, elm, attr){
                var raw = elm[0];
                var rawh = elm[0].parentElement.firstElementChild;
                scope._start = 0;
                scope. _end = 0;
                raw.addEventListener("dragstart",dragStart,false);//当鼠标按住屏幕时候触发。
                raw.addEventListener("drag",dragMove,false);//当鼠标屏幕上滑动的时候连续地触发。在这个事件发生期间，调用preventDefault()事件可以阻止滚动。
                raw.addEventListener("dragend",dragEnd,false);
                raw.addEventListener("touchstart",touchStart,false);//当按住屏幕时候触发。
                raw.addEventListener("touchmove",touchMove,false);//当屏幕上滑动的时候连续地触发。在这个事件发生期间，调用preventDefault()事件可以阻止滚动。
                raw.addEventListener("touchend",touchEnd,false);
                function dragStart(event){//dragStart函数
                    var img = new Image();
                    img.src = './img/transparent.png';
                    event.dataTransfer.setDragImage(img, 10, 10);
                    scope._start = event.pageY;
                }
                function dragMove(event){//dragMove函数
                    scope._end = (scope._start - event.pageY);
                    //下滑才执行操作
                    if(raw.scrollTop <= 0){
                        if(scope._end < 0){
                            releaseh(scope._end);
                        }else{
                            return;
                        }
                    }else{
                        return;
                    }
                }
                function dragEnd(event){//dragEnd函数
                    scope._end = (scope._start - event.pageY);
                    if(scope._end >0){
                        resetdrag();
                        return;
                    }else{
                        if( raw.scrollTop <= 0 && scope._end < -18){
                            releaseload();
                        }else{
                            resetdrag();
                            return;
                        }
                    }
                }
                function touchStart(event){//dragStart函数
                    scope._start = event.targetTouches[0].pageY;
                }
                function touchMove(event){//dragMove函数
                    scope._end = (scope._start - event.targetTouches[0].pageY);
                    //下滑才执行操作
                    if(raw.scrollTop <= 0){
                        if(scope._end < 0){
                            releaseh(scope._end);
                        }else{
                            return;
                        }
                    }else{
                        return;
                    }

                }
                function touchEnd(event){//dragEnd函数
                    scope._end = (scope._start - event.changedTouches[0].pageY);
                    if(scope._end >0){
                        resetdrag();
                        return;
                    }else{
                        if( raw.scrollTop <= 0 && scope._end < -18){
                            releaseload();
                        }else{
                            resetdrag();
                            return;
                        }
                    }
                }
                function releaseh(dist){ // dist 下滑的距离，用以拉长背景模拟拉伸效果
                    angular.element(elm).css({'overflow-y':'hidden','width':'calc(100% - 6px)'});
                    rawh.style.height = (-dist) + "px";//松开刷新的高度
                    rawh.style.display = 'block';
                    rawh.children[0].style.display = 'block';
                    rawh.children[1].style.display = 'none';
                }
                function releaseload(){
                    angular.element(elm).css({'overflow-y':'scroll','width':'100%'});
                    rawh.children[0].style.display = 'none';
                    rawh.children[1].style.display = 'block';
                    rawh.style.height = "45px";//高度设定为45px
                    scope.$apply(attr.homePullDown);
                }
                function resetdrag(){
                    angular.element(elm).css({'overflow-y':'scroll','width':'100%'});
                    rawh.style.display = 'none';
                }
            }
        }
    })
    .directive('homeQpullDown',function(){//首页快讯下拉刷新
        return{
            restrict:'A',
            link:function(scope, elm, attr){
                var raw = elm[0];
                var rawh = elm[0].parentElement.firstElementChild;
                scope._start = 0;
                scope. _end = 0;
                raw.addEventListener("dragstart",dragStart,false);//当鼠标按住屏幕时候触发。
                raw.addEventListener("drag",dragMove,false);//当鼠标屏幕上滑动的时候连续地触发。在这个事件发生期间，调用preventDefault()事件可以阻止滚动。
                raw.addEventListener("dragend",dragEnd,false);
                raw.addEventListener("touchstart",touchStart,false);//当按住屏幕时候触发。
                raw.addEventListener("touchmove",touchMove,false);//当屏幕上滑动的时候连续地触发。在这个事件发生期间，调用preventDefault()事件可以阻止滚动。
                raw.addEventListener("touchend",touchEnd,false);
                function dragStart(event){//dragStart函数
                    var img = new Image();
                    img.src = './img/transparent.png';
                    event.dataTransfer.setDragImage(img, 10, 10);
                    scope._start = event.pageY;
                }
                function dragMove(event){//dragMove函数
                    scope._end = (scope._start - event.pageY);
                    //下滑才执行操作
                    if(raw.scrollTop <= 0){
                        document.getElementById('datenow').style.display = 'none';
                        if(scope._end < 0){
                            releaseh(scope._end);
                        }else{
                            return;
                        }
                    }else{
                        return;
                    }
                }
                function dragEnd(event){//dragEnd函数
                    scope._end = (scope._start - event.pageY);
                    if(scope._end >0){
                        resetdrag();
                        return;
                    }else{
                        if( raw.scrollTop <= 0 && scope._end < -18){
                            releaseload();
                        }else{
                            resetdrag();
                            return;
                        }
                    }
                }
                function touchStart(event){//dragStart函数
                    scope._start = event.targetTouches[0].pageY;
                }
                function touchMove(event){//dragMove函数
                    scope._end = (scope._start - event.targetTouches[0].pageY);
                    if(raw.scrollTop <= 0){
                        document.getElementById('datenow').style.display = 'none';
                        if(scope._end < 0){
                            releaseh(scope._end);
                        }else{
                            document.getElementById('datenow').style.display = 'block';
                            return;
                        }
                    }else{
                        return;
                    }

                }
                function touchEnd(event){//dragEnd函数
                    scope._end = (scope._start - event.changedTouches[0].pageY);
                    if(scope._end >0){
                        resetdrag();
                        return;
                    }else{
                        if( raw.scrollTop <= 0 && scope._end < -18){
                            releaseload();
                        }else{
                            resetdrag();
                            return;
                        }
                    }
                }
                function releaseh(dist){ // dist 下滑的距离，用以拉长背景模拟拉伸效果
                    angular.element(elm).css({'overflow-y':'hidden','width':'calc(100% - 6px)'});
                    rawh.style.height = (-dist) + "px";//松开刷新的高度
                    rawh.style.display = 'block';
                    rawh.children[0].style.display = 'block';
                    rawh.children[1].style.display = 'none';
                }
                function releaseload(){
                    angular.element(elm).css({'overflow-y':'scroll','width':'100%'});
                    rawh.children[0].style.display = 'none';
                    rawh.children[1].style.display = 'block';
                    rawh.style.height = "45px";//高度设定为45px
                    scope.$apply(attr.homeQpullDown);
                }
                function resetdrag(){
                    angular.element(elm).css({'overflow-y':'scroll','width':'100%'});
                    rawh.style.display = 'none';
                }
            }
        }
    })
    .directive('wallelist', function(){
        return{
            restrict:'A',
            link: postLink
        }
        function postLink(scope, elem){
            var el = angular.element(elem);
            el
                .on('click', function() {
                    if(angular.element(el[0].nextElementSibling).hasClass('ng-hide')){
                        angular.element(el[0].nextElementSibling).removeClass('downHeightOut');
                        angular.element(el[0].nextElementSibling).removeClass('ng-hide');
                        angular.element(el[0].nextElementSibling).addClass('downHeightIn');
                        el.removeClass('rotateimgback');
                        el.addClass('rotateimg');
                    }else{
                        angular.element(el[0].nextElementSibling).removeClass('downHeightIn');
                        angular.element(el[0].nextElementSibling).addClass('downHeightOut');
                        angular.element(el[0].nextElementSibling).addClass('ng-hide');
                        el.removeClass('rotateimg');
                        el.addClass('rotateimgback');

                    }

                })

        }
    })
    .directive('addrSwiper',function(){
        return{
            restrict:'A',
            link:function(scope, elm){
                var raw = elm[0];
                var swiperEl = elm[0].children[1];
                var transferEl = elm[0].children[0];
                var deleteEl = elm[0].children[2];
                scope._start = 0;
                scope. _end = 0;
                raw.addEventListener("click",dragClick,false);//当鼠标
                raw.addEventListener("dragstart",dragStart,false);//当鼠标按住屏幕时候触发。
                raw.addEventListener("drag",dragMove,false);//当鼠标屏幕上滑动的时候连续地触发。在这个事件发生期间，调用preventDefault()事件可以阻止滚动。
                raw.addEventListener("dragend",dragEnd,false);
                raw.addEventListener("touchstart",touchStart,false);//当按住屏幕时候触发。
                raw.addEventListener("touchmove",touchMove,false);//当屏幕上滑动的时候连续地触发。在这个事件发生期间，调用preventDefault()事件可以阻止滚动。
                raw.addEventListener("touchend",touchEnd,false);
                function dragClick() {
                    resetdrag()
                }
                function dragStart(event){//dragStart函数
                    dragClick();
                    var img = new Image();
                    img.src = './img/transparent.png';
                    event.dataTransfer.setDragImage(img, 10, 10);
                    scope._start = event.pageX;
                }
                function dragMove(event){//dragMove函数
                    scope._end = (scope._start - event.pageX);
                    //滑动才执行操作
                    if (event.pageX !== 0){
                        if(scope._end >= 5){
                            showdelete(scope._end);
                            return;
                        }else if(scope._end <= -5){
                            showtransfer(scope._end);
                            return;
                        }else {
                            resetdrag();
                            return;
                        }
                    }
                }
                function dragEnd(event){//dragEnd函数
                    scope._end = (scope._start - event.pageX);
                    if(scope._end >= 5){
                        showdeleteok();
                        return;
                    }else if(scope._end <= -5){
                        showtransferok();
                        return;
                    }else {
                        resetdrag();
                        return;
                    }
                }
                function touchStart(event){//dragStart函数
                    dragClick();
                    scope._start = event.targetTouches[0].pageX;
                }
                function touchMove(event){//dragMove函数
                    scope._end = (scope._start - event.targetTouches[0].pageX);
                    //下滑才执行操作
                    if (event.targetTouches[0].pageX !== 0){
                        if(scope._end >= 5){
                            showdelete(scope._end);
                            return;
                        }else if(scope._end <= -5){
                            showtransfer(scope._end);
                            return;
                        }else {
                            resetdrag();
                            return;
                        }
                    }
                }
                function touchEnd(event){//dragEnd函数
                    scope._end = (scope._start - event.changedTouches[0].pageX);
                    if(scope._end >= 5){
                        showdeleteok();
                        return;
                    }else if(scope._end <= -5){
                        showtransferok();
                        return;
                    }else {
                        resetdrag();
                        return;
                    }
                }

                function showtransfer(dist){ // dist 滑动的距离
                    deleteEl.style.width = 0;
                    deleteEl.style.zIndex = 1;
                    deleteEl.style.opacity = 0;
                    deleteEl.style.paddingLeft = 0;
                    deleteEl.style.paddingRight = 0;
                    //以上复位另一个
                    transferEl.style.opacity = 1;
                    transferEl.style.zIndex = 3;
                    dist = -dist;
                    transferEl.style.paddingLeft = '24px';
                    transferEl.style.paddingRight = '24px';

                    if(dist > 80){
                        transferEl.style.width = 'auto';
                    }else{
                        transferEl.style.width = dist + 'px';
                    }
                }

                function showtransferok(){
                    transferEl.style.width = 'auto';
                    transferEl.style.zIndex = '3';
                    transferEl.style.opacity = '1';
                    transferEl.style.paddingLeft = '24px';
                    transferEl.style.paddingRight = '24px';
                }

                function showdelete(dist){ // dist 滑动的距离
                    transferEl.style.width = 0;
                    transferEl.style.zIndex = 1;
                    transferEl.style.opacity = 0;
                    transferEl.style.paddingLeft = 0;
                    transferEl.style.paddingRight = 0;
                    //以上复位另一个
                    deleteEl.style.opacity = 1;
                    deleteEl.style.zIndex = 3;
                    deleteEl.style.paddingLeft = '24px';
                    deleteEl.style.paddingRight = '24px';
                    if(dist > 80){
                        deleteEl.style.width = 'auto';
                    }else{
                        deleteEl.style.width = dist + 'px';
                    }
                }

                function showdeleteok(){
                    deleteEl.style.width = 'auto';
                    deleteEl.style.zIndex = '3';
                    deleteEl.style.opacity = '1';
                    deleteEl.style.paddingLeft = '24px';
                    deleteEl.style.paddingRight = '24px';
                }

                function resetdrag(){
                    transferEl.style.width = 0;
                    deleteEl.style.width = 0;
                    transferEl.style.zIndex = 1;
                    deleteEl.style.zIndex = 1;
                    transferEl.style.opacity = 0;
                    deleteEl.style.opacity = 0;
                    swiperEl.style.width = "100%";
                    deleteEl.style.paddingLeft = 0;
                    deleteEl.style.paddingRight = 0;
                    transferEl.style.paddingLeft = 0;
                    transferEl.style.paddingRight = 0;
                }
            }
        }
    })
    .directive('addrSwipers',function(){
       return{
        restrict:'A',
        link:function(scope, elm){
            var raw = elm[0];
            var swiperEl = elm[0].children[0];
            var deleteEl = elm[0].children[1];
            scope._start = 0;
            scope. _end = 0;
            raw.addEventListener("click",dragClick,false);//当鼠标
            raw.addEventListener("dragstart",dragStart,false);//当鼠标按住屏幕时候触发。
            raw.addEventListener("drag",dragMove,false);//当鼠标屏幕上滑动的时候连续地触发。在这个事件发生期间，调用preventDefault()事件可以阻止滚动。
            raw.addEventListener("dragend",dragEnd,false);

            raw.addEventListener("touchstart",touchStart,false);//当按住屏幕时候触发。
            raw.addEventListener("touchmove",touchMove,false);//当屏幕上滑动的时候连续地触发。在这个事件发生期间，调用preventDefault()事件可以阻止滚动。
            raw.addEventListener("touchend",touchEnd,false);
            function dragClick() {
                resetdrag()
            }
            function dragStart(event){//dragStart函数
                dragClick();
                var img = new Image();
                img.src = './img/transparent.png';
                event.dataTransfer.setDragImage(img, 10, 10);
                scope._start = event.pageX;
            }
            function dragMove(event){//dragMove函数
                scope._end = (scope._start - event.pageX);
                //滑动才执行操作
                if (event.pageX !== 0){
                    if(scope._end >= 5){
                        showdelete(scope._end);
                        return;
                    }else {
                        resetdrag();
                        return;
                    }
                }
            }
            function dragEnd(event){//dragEnd函数
                scope._end = (scope._start - event.pageX);
                if(scope._end >= 5){
                    showdeleteok();
                    return;
                }else {
                    resetdrag();
                    return;
                }
            }
            function touchStart(event){//dragStart函数
                    // alert(scope._start)
                    // dragClick();
                    // scope._start = event.targetTouches[0].pageX;
                console.log('===================',scope._end)
                //     // if (scope._start <5) {
                //     //     dragClick();
                //     // }
                // scope._start = event.targetTouches[0].pageX;
                if (scope._end <=0) {
                    dragClick();
                    scope._start = event.targetTouches[0].pageX;
                }
            }
            function touchMove(event){//dragMove函数
                scope._end = (scope._start - event.targetTouches[0].pageX);
                //下滑才执行操作
                if (event.targetTouches[0].pageX !== 0){
                    if(scope._end >= 5){
                        showdelete(scope._end);
                        return;
                    }else {
                        // resetdrag();
                        return;
                    }
                }
            }
            function touchEnd(event){//dragEnd函数
                // scope._end = (scope._start - event.changedTouches[0].pageX);
                // if(scope._end >= 5){
                if(scope._end >= 5 && event.changedTouches[0].pageX!==0){
                    showdeleteok();
                    return;
                }else {
                    resetdrag();
                    return;
                }
            }


            function showdelete(dist){ // dist 滑动的距离
                //以上复位另一个
                deleteEl.style.opacity = 1;
                deleteEl.style.zIndex = 3;
                deleteEl.style.paddingLeft = '24px';
                deleteEl.style.paddingRight = '24px';
                if(dist > 80){
                    deleteEl.style.width = 'auto';
                }else{
                    deleteEl.style.width = dist + 'px';
                }
            }

            function showdeleteok(){
                deleteEl.style.width = 'auto';
                deleteEl.style.zIndex = '3';
                deleteEl.style.opacity = '1';
                deleteEl.style.paddingLeft = '24px';
                deleteEl.style.paddingRight = '24px';
            }

            function resetdrag(){
                deleteEl.style.width = 0;
                deleteEl.style.zIndex = 1;
                deleteEl.style.opacity = 0;
                swiperEl.style.width = "100%";
                deleteEl.style.paddingLeft = 0;
                deleteEl.style.paddingRight = 0;
            }
        }
    }
});
