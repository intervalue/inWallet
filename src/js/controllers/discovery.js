'use strict';

angular.module('copayApp.controllers').controller('discoveryController',
    function ($rootScope, $scope, $timeout, lodash, isCordova, $modal, storageService, profileService, gettext, gettextCatalog, nodeWebkit, $sce) {
        var utils = require('inWalletcore/utils.js');
        var payment = require('inWalletcore/payment.js');
        var webHelper = require('inWalletcore/webhelper.js');
        var wallet = require('inWalletcore/wallet.js');
        var self = this;
        self.shownewsnav = 'news';
        self.shownewsloading = false;
        self.showquicksloading = false;
        self.showcoinloading = false;
        self.newslist = '';
        self.coinlist = '';
        self.coininvelist = '';
        self.quicklist = [];
        self.quicklistshow = '';
        self.newslists = [];
        self.quicklists = {};
        self.coinlists = [];
        self.newspage = 1;
        self.quickpage = 1;
        self.coinpage = 1;
        self.shownonews = false;
        self.shownoquick = false;
        self.shownocoin = false;
        self.shownewstab = 'new1';
        self.quickscrolltop = 0;
        self.quickdatanow = '';
        self.currentfixDate = null;
        self.online = navigator.onLine;
        //行情排序
        self.orderByValue = '';
        self.orderByPrice = '';
        self.orderByQuoteChange = '';
        let news = require("inWalletcore/newsServers");

        self.isCordova = isCordova
        // dapp列表
        self.dappList = []
        self.address = '' // 当前地址
        self.address = $scope.index.walletType.INVE[0].address; // 获取第一个INVE地址
        self.orderPayData = ""    //  支付展示的参数
        var ref;
        var dappUrl;

        let walletId = $scope.index.walletType.INVE[0].wallet;


        // self.getAddress = function () {
        //     var wallet = require('inWalletcore/wallet.js');
        //     var webSocket = require('inWalletcore/webSocket.js');
        //     wallet.getWallets(function (res) {
        //         if (res.length > 0) {
        //             self.address = res[0].address;
        //             console.log(self.address)
        //             webSocket.register(self.address);
        //         } else {
        //             self.getAddress();
        //         }
        //
        //     });
        // }
        // self.getAddress();

        //	dapp轮播
        self.dappslider = function () {
            var swiper = new Swiper('.dappswiperin', {
                pagination: {
                    el: '.swiper-pagination',
                    clickable: false
                },
                autoplay: true,
                speed: 500,
                loop: true,
                on: {
                    click: function () {
                        $scope.$apply(this.clickedSlide.dataset.click)
                    }
                }
            });
        }
        //24小时显示小时，超过24小时显示日期
        self.getTimeFromNow = function (datestr) {
            if (datestr) {
                let aa = new Date(Date.parse(datestr.replace(/-/g, "/")))
                let now = new Date()
                let hour = (now.getTime() - aa.getTime()) / (1000 * 60 * 60)
                let showtime = null
                if (hour < 0) {
                    return "1分钟前"
                }
                if (hour < 1) {
                    showtime = Math.floor(hour * 60)
                    return showtime + "分钟前"
                } else if (hour >= 1 && hour <= 23) {
                    showtime = Math.floor(hour)
                    return showtime + "小时前"
                } else {
                    showtime = (datestr.split(" "))[0]
                    return showtime
                }
            }
            return null
        };

        function timeChange(valueTime) {

            if (valueTime) {
                var newData = Date.parse(new Date());
                var diffTime = Math.abs(newData - valueTime);
                if (diffTime > 7 * 24 * 3600 * 1000) {
                    var date = new Date(valueTime);
                    var y = date.getFullYear();
                    var m = date.getMonth() + 1;
                    m = m < 10 ? ('0' + m) : m;
                    var d = date.getDate();
                    d = d < 10 ? ('0' + d) : d;
                    var h = date.getHours();
                    h = h < 10 ? ('0' + h) : h;
                    var minute = date.getMinutes();
                    var second = date.getSeconds();
                    minute = minute < 10 ? ('1' + minute) : minute;
                    second = second < 10 ? ('0' + second) : second;
                    return m + '-' + d + ' ' + h + ':' + minute;

                } else if (diffTime < 7 * 24 * 3600 * 1000 && diffTime > 24 * 3600 * 1000) {
                    // //注释("一周之内");

                    // var time = newData - diffTime;
                    var dayNum = Math.floor(diffTime / (24 * 60 * 60 * 1000));

                    if (dayNum === 1) {
                        return '昨天'
                    }
                } else {
                    return '今天'
                }
            }
        }

        //获取快讯固定的时间
        self.getWeekNow = function (datestr) {
            if (datestr) {
                //当前年月日
                var date = new Date();
                var year = date.getFullYear();
                var month = date.getMonth() + 1;
                var day = date.getDate() < 10 ? '0' + date.getDate() : date.getDate();
                var comprared = year + '-' + month + '-' + day;
                var datestrtime = new Date(year + '-' + month + '-' + day).getTime();
                var cstrtime = new Date(datestr).getTime();
                //计算星期几
                let qdatearr = datestr.split('-');
                let qdatearr2 = new Date(qdatearr[0], parseInt(qdatearr[1] - 1), qdatearr[2]);
                let qweeknow = String(qdatearr2.getDay()).replace("0", "日").replace("1", "一").replace("2", "二").replace("3", "三").replace("4", "四").replace("5", "五").replace("6", "六");
                let qdatenow = "星期" + qweeknow;
                if (datestr == comprared) {
                    return '今天' + ' ' + qdatearr[1] + '/' + qdatearr[2] + ' ' + qdatenow;
                } else if (parseInt(datestrtime) == parseInt(cstrtime) + 86400000) {
                    return '昨天' + ' ' + qdatearr[1] + '/' + qdatearr[2] + ' ' + qdatenow;
                } else {
                    return qdatearr[1] + '/' + qdatearr[2] + ' ' + qdatenow;
                }
            }
            return null
        };
        //获取快讯滚动的时间
        self.getDateNow = function (datestr) {
            if (datestr) {
                let qdatearr = datestr.split('-');
                return qdatearr[0] + '-' + qdatearr[1] + '-' + qdatearr[2];
            }
            return null
        };

        //行情排序
        /**
         * 根据产品要求，改为单项排序
         */
        //根据总市值排序
        self.orderbyShowValue = function () {
            if (self.orderByValue == '-values') self.orderByValue = 'values'; else self.orderByValue = '-values';
            //self.orderByList = [self.orderByValue,self.orderByQuoteChange,self.orderByPrice];
            self.orderByList = self.orderByValue;
            self.orderByPrice = '';
            self.orderByQuoteChange = ''

        }

        //根据货币单价排序
        self.orderbyShowPrice = function () {
            if (self.orderByPrice == '-price') self.orderByPrice = 'price'; else self.orderByPrice = '-price';
            //self.orderByList = [self.orderByPrice,self.orderByQuoteChange,self.orderByValue];
            self.orderByList = self.orderByPrice;
            self.orderByValue = '';
            self.orderByQuoteChange = '';

        }

        //根据24H涨幅排序
        self.orderbyShowGains = function () {
            if (self.orderByQuoteChange == '-quoteChange') self.orderByQuoteChange = 'quoteChange'; else self.orderByQuoteChange = '-quoteChange';
            //self.orderByList = [self.orderByQuoteChange,self.orderByPrice,self.orderByValue];
            self.orderByList = self.orderByQuoteChange;
            self.orderByPrice = '';
            self.orderByValue = '';
        }


        //定时拉取信息
        /*   setInterval(function() {
               if (navigator.onLine) {//有网的话
                   self.online = true;
                   self.newsData('up');
                   self.quickData('up');
                   self.currencyData('up');
               } else {
                   self.online = false;
                   self.newsloading = false;
                   self.quickloading = false;
                   self.currencyloading = false;
               }
           }, 5 * 1000);*/
        self.newsDatals = function () {
            if ($scope.index.isNewslist !== false) {
                self.newslist = $scope.index.isNewslist;
                return;
            }
            self.newsData('up');
        }
        self.newsData = function (upyn) {

            if (upyn == 'up') {//上拉刷新
                if (!navigator.onLine) {
                    self.online = false;
                    self.newsloading = true;
                    $timeout(function () {
                        self.newsloading = false;
                        $scope.$apply();
                    }, 500);
                    return;
                }
                self.online = true;
                self.newsloading = true;
                news.getNewsData(20, 1, null, function (res) {
                    if (!!res && res.code == 0) {
                        //给返回对象加字段
                        lodash.forEach(res.page.list, function (value, key) {
                            value.greentime = self.getTimeFromNow(value.createTime);
                        })
                        angular.element(document.getElementById('newupheight')).css('display', 'none');
                        self.newslists = res.page.list;
                        self.newslist = res.page.list;
                        $scope.index.isNewslist = self.newslist;
                        self.newspage = 2;
                        self.newsloading = false;
                        $timeout(function () {
                            $scope.$apply();
                        });
                        return;
                    } else {
                        self.newslist = '';
                        self.newsloading = false;
                    }

                });
                /*   $timeout(function () {
                       self.newsloading = false;
                   },500);*/

            } else {//下拉加载更多
                if (!navigator.onLine) {
                    self.online = false;
                    self.newsloading = true;
                    $timeout(function () {
                        self.newsloading = false;
                        $scope.$apply();
                    }, 500);
                    return;
                }
                self.online = true;
                self.newsloading = true;
                news.getNewsData(20, self.newspage, null, function (res) {
                    if (!!res && res.code == 0) {
                        self.shownewsloading = false;
                        //给返回对象加字段
                        lodash.forEach(res.page.list, function (value, key) {
                            value.greentime = self.getTimeFromNow(value.createTime);
                        })
                        if (JSON.stringify(self.newslists) == '[]') {
                            self.newslists = res.page.list;
                            self.newslist = res.page.list;
                            self.newspage += 1;
                            $timeout(function () {
                                $scope.$apply();
                            })
                        } else {
                            self.newslists = self.newslists.concat(res.page.list);
                            self.newslist = self.newslists;
                            if (self.newspage == res.page.totalPage) {
                                self.shownonews = true;
                                self.shownewsloading = false;
                            }
                            self.newspage += 1;
                            $timeout(function () {
                                $scope.$apply();
                            });
                            return;
                        }
                    } else
                        self.newslist = '';

                });
                self.newsloading = false;
            }
        };

        self.quickData = function (upyn) {
            if (upyn == 'up') {
                if (!navigator.onLine) {
                    self.online = false;
                    self.quickloading = true;
                    $timeout(function () {
                        self.quickloading = false;
                        $scope.$apply();
                    }, 500);
                    return;
                }
                self.online = true;
                self.quickloading = true;
                news.getQuickData(20, 1, null, null, function (res) {
                    var list = [];
                    if (!!res && res.code == 0) {
                        angular.element(document.getElementById('quickupheight')).css('display', 'none');
                        angular.element(document.getElementById('datenow')).css('display', 'block');
                        self.quicklists = {};
                        //给返回对象加字段
                        lodash.forEach(res.page.list, function (value, key) {
                            value.grayweek = self.getWeekNow((value.createTime).substring(0, lodash.indexOf((value.createTime), ' ', 0)));
                            value.graydate = self.getDateNow((value.createTime).substring(0, lodash.indexOf((value.createTime), ' ', 0)));
                            value.greentime = self.getTimeFromNow(value.createTime);
                            value.greenhms = (value.createTime).slice((lodash.indexOf((value.createTime), ' ', 0) + 1), -3);
                        })
                        list = res.page.list;
                        //转换返回对象的格式
                        for (var i = 0; i < list.length; i++) {
                            if (!self.quicklists[list[i].grayweek]) {
                                var arr = [];
                                arr.push(list[i]);
                                self.quicklists[list[i].grayweek] = arr;
                            } else {
                                self.quicklists[list[i].grayweek].push(list[i])
                            }
                        }
                        self.quicklistshow = res.page.list;
                        self.quicklist = self.quicklists;
                        self.quickpage = 2;
                        $timeout(function () {
                            self.quickdatanow = res.page.list[0].grayweek;
                            $scope.$apply();
                        });
                    } else
                        cself.quicklistshow = '';
                });
                $timeout(function () {
                    self.quickloading = false;
                }, 500);
            } else {
                if (!navigator.onLine) {
                    self.online = false;
                    self.quickloading = true;
                    $timeout(function () {
                        self.quickloading = false;
                        $scope.$apply();
                    }, 500);
                    return;
                }
                self.online = true;
                self.quickloading = true;
                news.getQuickData(20, self.quickpage, null, null, function (res) {
                    var list = [];
                    if (!!res && res.code == 0) {
                        //给返回对象加字段
                        lodash.forEach(res.page.list, function (value, key) {
                            value.grayweek = self.getWeekNow((value.createTime).substring(0, lodash.indexOf((value.createTime), ' ', 0)));
                            value.graydate = self.getDateNow((value.createTime).substring(0, lodash.indexOf((value.createTime), ' ', 0)));
                            value.greentime = self.getTimeFromNow(value.createTime);
                            value.greenhms = (value.createTime).slice((lodash.indexOf((value.createTime), ' ', 0) + 1), -3);
                        })
                        list = res.page.list;
                        //转换返回对象的格式
                        for (var i = 0; i < list.length; i++) {
                            if (!self.quicklists[list[i].grayweek]) {
                                var arr = [];
                                arr.push(list[i]);
                                self.quicklists[list[i].grayweek] = arr;
                            } else {
                                self.quicklists[list[i].grayweek].push(list[i])
                            }
                        }
                        self.quicklistshow = res.page.list;
                        self.quicklist = self.quicklists;
                        if (self.quickpage == res.page.totalPage) {
                            self.shownoquick = true;
                            self.showquicksloading = false;
                        }
                        self.quickpage += 1;
                        $timeout(function () {
                            if (self.quickpage == 2) {
                                self.quickdatanow = res.page.list[0].grayweek;
                            } else {
                                return;
                            }
                            $scope.$apply();
                        });
                    } else
                        self.quicklistshow = '';
                });
                self.quickloading = false;
            }
        };

        self.currencyData = function (upyn) {
            //inve 行情
            news.getInveData2(function (res) {
                if (!!res && res != null) {
                    self.coininvelist = res.page.list;
                }
            });

            if (upyn == 'up') {
                if (!navigator.onLine) {
                    self.online = false;
                    self.currencyloading = true;
                    $timeout(function () {
                        self.currencyloading = false;
                        $scope.$apply();
                    }, 500);
                    return;
                }
                self.online = true;
                self.currencyloading = true;
                news.getCurrencyData(6, 1, null, function (res) {
                    if (!!res) {
                        angular.element(document.getElementById('coinupheight')).css('display', 'none');
                        self.coinlists = res.page.list;
                        self.coinlist = res.page.list;
                        self.coinpage = 2;
                        $timeout(function () {
                            $scope.$apply();
                        })
                        return;
                    } else
                        self.coinlist = '';
                });
                $timeout(function () {
                    self.currencyloading = false;
                }, 500);
            } else {
                if (!navigator.onLine) {
                    self.online = false;
                    self.currencyloading = true;
                    $timeout(function () {
                        self.currencyloading = false;
                        $scope.$apply();
                    }, 500);
                    return;
                }
                self.online = true;
                self.currencyloading = true;
                news.getCurrencyData(6, self.coinpage, null, function (res) {
                    if (!!res) {
                        self.showcoinloading = false;
                        if (JSON.stringify(self.coinlists) == '[]') {
                            self.coinlists = res.page.list;
                            self.coinlist = res.page.list;
                            self.coinpage += 1;
                            $timeout(function () {
                                $scope.$apply();
                            })
                        } else {
                            // self.coinlists = self.coinlists.concat(res.page.list);
                            self.coinlist = self.coinlists;
                            if (self.coinpage == res.page.totalPage) {
                                self.shownonews = true;
                                self.showcoinloading = false;
                            }
                            self.coinpage += 1;
                            $timeout(function () {
                                $scope.$apply();
                            });
                            return;
                        }
                    } else
                        self.coinlist = '';
                });
                self.loading = false;
            }

        };

        self.getexRate = function () {
            news.getInveData2(function (res) {
                if (!!res && res != null) {
                    //self.invedollar = res.page.list.INVE.price;
                    $scope.index.invedollar = res.page.list.INVE.price;
                    //self.invermb = res.page.list.INVE.cnyPrice;
                    $scope.index.invermb = res.page.list.INVE.cnyPrice;
                    $timeout(function () {
                        $scope.$apply();
                    })
                }
            });
        }
        self.getexRate();

        self.quickequaltop = function () {
            var curtop = document.getElementById('removescroll2').scrollTop;
            var dateall = document.querySelectorAll('.news .letterlist .itemin .date');
            for (var i = 1; i < dateall.length; i++) {
                if (self.currentfixDate) {
                    if (curtop >= dateall[i].offsetTop - 78 && curtop <= dateall[i].offsetTop + 78) {
                        if (curtop < dateall[i].offsetTop) {
                            self.currentfixDate = dateall[i - 1]
                        } else {
                            self.currentfixDate = dateall[i]
                        }
                        self.quickdatanow = self.currentfixDate.innerText;
                    }
                } else {
                    self.currentfixDate = dateall[0];
                }

            }
        }

        //	加载更多
        self.loadmore = function (outlr, inlr, num) {
            if (outlr == 'new1tab') {
                if (self.shownonews == true) {
                    self.shownewsloading = false;
                    return;
                } else {
                    self.shownewsloading = true;
                    self.newsData();
                }
            } else if (outlr == 'new2tab') {
                if (self.shownoquick == true) {
                    self.showquicksloading = false;
                    return;
                } else {
                    self.showquicksloading = true;
                    self.quickData();
                }
            } else if (outlr == 'new3tab') {
                if (self.shownocoin == true) {
                    self.showcoinloading = false;
                    return;
                } else {
                    self.showcoinloading = true;
                    self.currencyData();
                }
            }
        }


        // 新闻内容
        self.openNewsinModal = function (id) {
            $rootScope.modalOpened = true;

            var ModalInstanceCtrl = function ($scope, $modalInstance, $sce) {
                $scope.newsInfoData = function (useid = id) {
                    if (!$scope.online) {
                        if (navigator.onLine) {
                            $scope.online = true;
                        } else {
                            $scope.online = false;
                            $scope.loading = true;
                            $timeout(function () {
                                $scope.loading = false;
                            }, 1000);
                            return;
                        }
                    }
                    news.getNewsInfo(useid, function (res) {
                        if (!!res && res.code == 0) {
                            $scope.newstitle = $sce.trustAsHtml(res.article.title);
                            $scope.newscontent = $sce.trustAsHtml(res.article.content);

                            $timeout(function () {
                                $scope.$apply();
                            });
                        } else
                            console.error("error~!");
                    })
                }
                $scope.cancel = function () {
                    $modalInstance.dismiss('cancel');
                    for (let item in self.newslist) {
                        if (self.newslist[item].id == id) self.newslist[item].pageviews += 1;
                    }

                };
            };

            var modalInstance = $modal.open({
                templateUrl: 'views/modals/newsin.html',
                controller: ModalInstanceCtrl,
            });

            var disableCloseModal = $rootScope.$on('closeModal', function () {
                modalInstance.dismiss('cancel');
            });

            modalInstance.result.finally(function () {
                $rootScope.modalOpened = false;
                disableCloseModal();
                var m = angular.element(document.getElementsByClassName('reveal-modal'));
                m.addClass(animationService.modalAnimated.slideOutDown);
            });

            modalInstance.result.then(function onDestModalDone(addr) {

            });
        };

        //
        // function wechatShare(url){
        //     Wechat.share({
        //         message: {
        //             title: "Hi, there",
        //             description: "This is description.",
        //             thumb: "www/img/thumbnail.png",
        //             mediaTagName: "TEST-TAG-001",
        //             messageExt: "这是第三方带的测试字段",
        //             messageAction: "<action>dotalist</action>",
        //             media: {
        //                 type: Wechat.Type.WEBPAGE,
        //                 webpageUrl: url
        //             }
        //         },
        //         scene: Wechat.Scene.TIMELINE   // share to Timeline
        //     }, function () {
        //         alert("Success");
        //     }, function (reason) {
        //         alert("Failed: " + reason);
        //     });
        // }

        // dapp外部链接
        self.opendapplink = function (link, title) {
            if (isCordova) {
                cordova.InAppBrowser.open(link, '_blank', 'location=yes');
            } else {
                $rootScope.modalOpened = true;

                let ModalInstanceCtrl = function ($scope, $modalInstance, $sce) {
                    $scope.dapplinkdata = function () {
                        $scope.trustSrc = $sce.trustAsResourceUrl(link);
                    }
                    $scope.dapptitle = title;
                    $scope.isFrameLoadDone = false;
                    //监听iframe的资源加载
                    $scope.isIload = function () {
                        let iframe = document.getElementById('linkiframe');
                        iframe.onload = function () {
                            $scope.$apply(function () {
                                $scope.isFrameLoadDone = true;
                            });
                        };
                    }
                    $scope.cancel = function () {
                        $modalInstance.dismiss('cancel');
                    };
                };

                var modalInstance = $modal.open({
                    templateUrl: 'views/modals/dapplink.html',
                    controller: ModalInstanceCtrl,
                });

                var disableCloseModal = $rootScope.$on('closeModal', function () {
                    modalInstance.dismiss('cancel');
                });

                modalInstance.result.finally(function () {
                    $rootScope.modalOpened = false;
                    disableCloseModal();
                    var m = angular.element(document.getElementsByClassName('reveal-modal'));
                    m.addClass(animationService.modalAnimated.slideOutDown);
                });

                modalInstance.result.then(function onDestModalDone(addr) {
                });
            }
        };

        /**
         *
         * 输入金额
         * @param addr
         */
        self.setAmountForm = function () {
            let from = $scope.Form;
            var amount = from.amount.$modelValue;
            var asset = 'INVE';
            self.hasamount = amount;
            if (!asset)
                throw Error("no asset");
            var amountInSmallestUnits = amount;
            $timeout(function () {
                $scope.customizedAmountUnit =
                    amount + ' ' + (asset === 'base') ? '' : 'of ' + asset;
                $scope.amountInSmallestUnits = amountInSmallestUnits;
                $scope.asset_param = (asset === 'base') ? '' : '&asset=' + encodeURIComponent(asset);
                self.setAmountShow = false;
                self.amount = '';
            }, 1);
        }

        const eventBus = require('inWalletcore/event_bus.js');
        eventBus.on('payMessage', function (data) {
            if (isCordova) console.log(ref);
            if (isCordova && ref) ref.hide();//隐藏：显示使用:ref.show()
            console.log(data)
            self.orderPayData = data
            self.showPayPop()
        });
        //  支付弹框弹出
        self.showPayPop = function () {
            $scope.index.payController = true;
            apply();
            console.log('pay click test' + "showPayPop")
        }


        //  确认支付
        self.confirmPay = function () {
            profileService.setAndStoreFocusToWallet(walletId, function () {
                profileService.unlockFC(null, function (err) {
                    if (err) {
                        $rootScope.$emit('Local/ShowErrorAlert', gettextCatalog.getString('Wrong password'));
                        return;
                    }
                    let fc = profileService.focusedClient;
                    console.log('walletClients: ', fc.credentials);
                    let pubkey = utils.getPubkey(fc.credentials.xPrivKey);
                    let res1 = {
                        xprivKey: fc.credentials.xPrivKey,
                        pubkey: pubkey
                    }
                    let res = self.orderPayData;
                    let obj = {
                        bizid: res.bizid,
                        orderid: res.orderid,
                        paysign: res.paysign,
                        paytransid: res.paytransid,
                        ptimestamp: res.ptimestamp,
                        amount: res.amount
                    }
                    let objJson = {
                        fromAddress: self.address,
                        to_address: res.toaddress,
                        amount: obj.amount,
                        xprivKey: res1.xprivKey,
                        pubkey: res1.pubkey,
                        walletId: walletId
                    }

                    payment.transactionMessage(objJson, function (err, res2) {
                        if (err) {
                            if (err.match(/not enough spendable/)) {
                                err = gettextCatalog.getString("not enough spendable");
                            }
                            if (err.match(/unable to get nrgPrice/)) {
                                err = gettextCatalog.getString("network error,please try again.");
                            }
                            return $rootScope.$emit('Local/ShowErrorAlert', err);
                        }
                        webHelper.httpPost(device.my_device_hashnetseed_url + '/v1/getlocalfullnodes', null, {pubkey: objJson.pubkey}, function (err, res) {
                            if (err) {
                                if (err.match(/not enough spendable/)) {
                                    err = gettextCatalog.getString("not enough spendable");
                                    return $rootScope.$emit('Local/ShowErrorAlert', err);
                                } else {
                                    return $rootScope.$emit('Local/ShowErrorAlert', err);
                                }

                            }
                            if (res.code == 200 && res.data == '') {
                                return $rootScope.$emit('Local/ShowErrorAlert', 'localfullnode is null');
                            }
                            let data = JSON.parse(res);

                            if (data.code != 200 | data.data == '') {
                                return $rootScope.$emit('Local/ShowErrorAlert', `localfullnodes is null`);
                            }
                            let localfullnodes = JSON.parse(data.data);
                            let urlList = [];
                            lodash.forEach(localfullnodes, function (res) {
                                urlList.push(`${res.ip}:${res.httpPort}`)
                            });
                            /*console.log(tt)
                            tt = _.difference(tt,['13.211.5.129:35796']);//移除*/
                            obj.localfullnode_list = urlList;//IP+httpPort
                            console.log('urlList', urlList)
                            obj.wallettransid = res2.signature;
                            obj.paybody = {message: res2};
                            // console.log(obj.wallettransid)
                            // console.log(obj.localfullnode_list)
                            payment.sendTransactionToOtherServer(obj, function (err, res3) {
                                if (err) return $rootScope.$emit('Local/ShowErrorAlert', err);
                                console.log(res3);
                                $scope.index.payController = false;
                                if (ref) {
                                    ref.show();
                                } else {
                                    ref = cordova.InAppBrowser.open(dappUrl, '_blank', 'location=yes,hidden=no,hideurlbar=yes,zoom=no,toolbarcolor=#000000,closebuttoncolor=#F0FFFF,navigationbuttoncolor=#F0FFFF');
                                }
                                apply();
                            });
                        });
                    });
                });
            });
        }

        //  取消支付
        self.cancelPay = function () {
            $scope.index.payController = false;
            ref.show();
        }

        // cordova插件 页面跳转
        self.JumpHref = function (url) {
            // var fc = profileService.walletClients;
            // let k = Object.keys(fc);
            // let walletId = fc[k[0]].credentials.walletId;

            function go(url) {
                dappUrl = url;
                if (isCordova) {
                    ref = cordova.InAppBrowser.open(url, '_blank', 'location=yes,hidden=no,hideurlbar=yes,zoom=no,toolbarcolor=#000000,closebuttoncolor=#F0FFFF,navigationbuttoncolor=#F0FFFF');
                } else {
                    console.error(' no cordova ')
                }
            }

            function setDapp() {
                profileService.setAndStoreFocusToWallet(walletId, function () {
                    profileService.unlockFC(null, function (err) {
                        if (err) {
                            $rootScope.$emit('Local/ShowErrorAlert', gettextCatalog.getString('Wrong password'));
                            return;
                        }
                        let fc = profileService.focusedClient;
                        let pubkey = utils.getPubkey(fc.credentials.xPrivKey);
                        let sign = utils.signature(url, fc.credentials.xPrivKey);
                        url = `${url}?pubkey=${pubkey}&sign=${sign}`;
                        let obj = {
                            pubkey: pubkey,
                            sign: sign,
                            address: self.address
                        }
                        storageService.setDapp(obj, function (err) {
                            go(url);
                        });
                    });
                });
            }

            storageService.getDapp(function (err, res) {
                if (!err) {
                    if (res.address && res.address == self.address) {
                        let pubkey = res.pubkey;
                        let sign = res.sign;
                        url = `${url}?pubkey=${pubkey}&sign=${sign}`;
                        go(url)
                    } else {
                        setDapp()
                    }

                } else {
                    setDapp()
                }

            });


            //
            // self.hrefUrl = $sce.trustAsResourceUrl(url)
            // self.hrefUrl = url;
            // self.iframecoll = true;

        }

        function apply() {
            setTimeout(function () {
                $scope.$apply();
            });
        }

        //    dapp列表查询
        function _getDappList() {
            var dapp = require('inWalletcore/dapp');
            dapp.getDappList(function (err, res) {
                console.log('LIST=======', res)
                // console.log('errr=======', err)
                self.dappList = res;
                apply();
            });
        }

        _getDappList()

    });
