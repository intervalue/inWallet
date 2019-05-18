'use strict';

angular.module('copayApp.controllers').controller('rentController',
    function($scope, $http, $timeout, $state, $window, isCordova) {
        var self = this;
        self.username = 'chanhan01';
        self.password = 'chanhan888888';
        self.paysureshow = false;
        self.payinfoshow = false;
        self.period = [{
            'time': '1个月',
            'timeint': '1'
        }, {
            'time': '3个月',
            'timeint': '3'
        }, {
            'time': '6个月',
            'timeint': '6'
        }, {
            'time': '18个月',
            'timeint': '18'
        }];
        self.space = [{
            'spacetext': '1G',
            'spaceint': '1'
        }, {
            'spacetext': '2G',
            'spaceint': '2'
        }, {
            'spacetext': '3G',
            'spaceint': '3'
        }, {
            'spacetext': '4G',
            'spaceint': '4'
        }, {
            'spacetext': '5G',
            'spaceint': '5'
        }, {
            'spacetext': '6G',
            'spaceint': '6'
        }];
        self.selettw = [{
            'name': 'SNC',
            'rate': '1'
        }, {
            'name': 'INVE',
            'rate': '10'
        }, {
            'name': 'BTC',
            'rate': '100'
        }];
        // self.periods = self.period[0];
        // self.spaces = self.space[0];
        self.selettws = self.selettw[0];
        self.submitRent = function(){
            var form = $scope.rentform;
            self.paysureshow = true;
        }
        //支付按钮
        self.pay = function(){
            self.paysureshow = false;
            self.payinfoshow = true;
        }
        //支付成功，我知道了按钮
        self.payok = function(){
            var form = $scope.storform;
            var data = {'username':form.username.$modelValue, 'password': form.password.$modelValue};
            self.paysureshow = false;
            self.payinfoshow = false;
            // $scope.index.progressing = true;
            // $scope.index.progressingmsg = 'Loading...';
            if(isCordova)
                cordova.InAppBrowser.open('http://47.106.165.38/stornet/index.php/apps/files/?dir=/StorNet&fileid=19', '_blank', 'location=yes');
            /*$http({
                method: 'POST',
                url: 'http://47.106.165.38/stornet/index.php/apps/loginviapost/login',
                data: data
            }).then(function successCallback() {
                $scope.index.progressing = false;
                alert('success;qq');
                $scope.index.opendapplink('http://47.106.165.38/stornet');
                /!*if(isCordova)
                    cordova.InAppBrowser.open('http://47.106.165.38/stornet/index.php/apps/files/?dir=/StorNet&fileid=19', '_blank', 'location=yes');*!/
            }, function errorCallback() {
                $scope.index.progressing = false;
                alert('reject;qq');
                // if(isCordova)
                //     cordova.InAppBrowser.open('http://47.106.165.38/stornet/index.php/apps/files/?dir=/StorNet&fileid=19', '_blank', 'location=yes');
                return;
            });*/

            /*if(isCordova)
            cordova.InAppBrowser.open('http://47.106.165.38/stornet/index.php/apps/files/?dir=/StorNet&fileid=19', '_blank', 'location=yes');*/
//             //$scope.index.opendapplink('http://47.106.165.38/stornet/index.php/login');
//             var webHelper = require('inWalletcore/webhelper');
//             var data = {username:'chenhan01', password:'chenhan888888'};
// //let url ='http://47.106.165.38/stornet/index.php/apps/loginviapost/login';
//             let url ='http://47.106.165.38/stornet/index.php/apps/loginviapost/login';
//             let type = {'Content-Type':'application/form-data'};
//             var http=require('http');
//             var queryString = require('querystring');
//             var content = queryString.stringify(data);
//             var parse_u = require('url').parse(url,true);
//             var options = {
//                 host:parse_u.hostname,
//                 port:parse_u.port,
//                 path:parse_u.path,
//                 method: 'POST',
//                 headers: {
//                     'Content-Type':'application/x-www-form-urlencoded',
//                     'Content-Length':content.length
//                 }
//             };
//
//             var req = http.request(options, function(res){
//
//                 let cookie = res.headers['set-cookie'];
//                 //console.log(res.headers['set-cookie']);
//                 let cookies = cookie[2].split(";")[0]+"; "+cookie[3].split(";")[0]+"; "+cookie[1].split(";")[0]+'; '+cookie[4].split(";")[0];
//                 $cookies.put(cookie[2].split(";")[0].split("=")[0],cookie[2].split(";")[0].split("=")[1]);
//                 $cookies.put(cookie[3].split(";")[0].split("=")[0],cookie[3].split(";")[0].split("=")[1]);
//                 $cookies.put(cookie[1].split(";")[0].split("=")[0],cookie[1].split(";")[0].split("=")[1]);
//                 $cookies.put(cookie[4].split(";")[0].split("=")[0],cookie[4].split(";")[0].split("=")[1]);
//                 if(isCordova){
//                     cordova.InAppBrowser.open('http://47.106.165.38/stornet/index.php/apps/files/?dir=/StorNet&fileid=19', '_blank', 'location=yes');
//                 }
//
//                 else window.location.href = 'http://47.106.165.38/stornet/index.php/apps/files/?dir=/StorNet&fileid=19';
//                 // if (window.cordova && window.cordova.InAppBrowser) {
//                 //     alert(1);
//                 //     window.open = window.cordova.InAppBrowser.open;
//                 //     window.open('http://47.106.165.38/stornet/index.php/apps/files/?dir=/StorNet&fileid=19');
//                 //
//                 // }else {
//                 //     $window.location.href = 'http://47.106.165.38/stornet/index.php/apps/files/?dir=/StorNet&fileid=19';
//                 // }
//                 //$scope.index.opendapplink('http://47.106.165.38/stornet/index.php/apps/files/?dir=/StorNet&fileid=19');
//                 //console.log('cookie  :',cookie);
//                 //console.log('cookies  :',cookies);
//
//                 // webHelper.httpPostStornet('http://47.106.165.38/stornet/index.php',null, null, cookies).then(function (resolve,reject) {
//                 //     //console.log('resolve:  ',resolve.replace(/index.php/g,'http://47.106.165.38/stornet/index.php'));
//                 //     console.log('resolve:  ',resolve);
//                 //     $scope.index.openstornetlink(resolve);
//                 //     //console.log('reject:  ',reject);
//                 //     //$scope.index.openstornetlink(resolve.replace(/\/stornet/g,'http://47.106.165.38/stornet'),cookies);
//                 // });
//
//             }).on('error', function(err){
//                 console.log('error: ', err.message);
//             });
//
//
//             req.write(content); //req为ClientRequest的实例，是writableStream，写数据到流中
//             req.end();//结束请求
        }
    })