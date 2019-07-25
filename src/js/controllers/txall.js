angular.module('copayApp.controllers').controller('txallController',
    function ($scope, $rootScope, $modal, animationService, $timeout) {
        var self = this;
        self.txallmaskShow = false;
        self.txalldate = false;
        self.txallstatus = false;
        self.txallcurrency = false;
        self.txHistory = $scope.index.txTotal;
        self.yearIndex = 0;
        self.monthIndex = parseInt(new Date().getMonth());
        self.yearIndexPrev = 0;
        self.monthIndexPrev = parseInt(new Date().getMonth());
        self.isPrevIndex = false;
        let MM = [];
        for (let item in self.txHistory) {
            let date = new Date(self.txHistory[item].creation_date);
            if (MM.indexOf(date.getFullYear() + '-' + ((parseInt(date.getMonth()) + 1) < 10 ? '0' + (parseInt(date.getMonth()) + 1) : (parseInt(date.getMonth()) + 1))) == -1) {
                MM.push(date.getFullYear() + '-' + ((parseInt(date.getMonth()) + 1) < 10 ? '0' + (parseInt(date.getMonth()) + 1) : (parseInt(date.getMonth()) + 1)));
            }

        }
        self.YYMM = MM;

        /**
         * 点击交易记录跳转到单笔交易详情
         * @param btx
         */
        self.openTxModal = function (btx) {
            let walletInfo = $scope.index.walletInfo;
            for (let item in walletInfo) {
                /**
                 * 发送地址钱包名字
                 */
                if (walletInfo[item].address == btx.addressFrom) {
                    btx.fromName = walletInfo[item].walletName;
                }
                /**
                 * 转移收款钱包名字
                 */
                if (walletInfo[item].address == btx.addressTo) {
                    btx.toName = walletInfo[item].walletName;
                }
            }
            $rootScope.modalOpened = true;
            let ModalInstanceCtrl = function ($scope, $modalInstance) {
                $scope.btx = btx;
                $scope.cancel = function () {
                    breadcrumbs.add('dismiss tx details');
                    try {
                        $modalInstance.dismiss('cancel');
                    } catch (e) {
                    }
                };

            };

            let modalInstance = $modal.open({
                templateUrl: 'views/modals/tx-details.html',
                windowClass: animationService.modalAnimated.slideRight,
                controller: ModalInstanceCtrl,
            });

            let disableCloseModal = $rootScope.$on('closeModal', function () {
                breadcrumbs.add('on closeModal tx details');
                modalInstance.dismiss('cancel');
            });

            modalInstance.result.finally(function () {
                $rootScope.modalOpened = false;
                disableCloseModal();
                let m = angular.element(document.getElementsByClassName('reveal-modal'));
                m.addClass(animationService.modalAnimated.slideOutRight);
            });
        };

        /**
         * 交易记录tab切换
         * @param
         */
        self.tabswitch = function (id) {
            if (angular.element(document.querySelectorAll('#' + id + ' ul')).hasClass('ng-hide')) {
                if (id == 'txdate') {
                    self.txallmaskShow2 = true;
                    self.txallmaskShow = false;
                } else {
                    self.txallmaskShow = true;
                }
                angular.element(document.querySelectorAll('.titlelabel .item ul')).addClass('ng-hide');
                angular.element(document.querySelectorAll('#' + id + ' ul')).removeClass('ng-hide');
            } else {
                self.txallmaskShow = false;
                self.txallmaskShow2 = false;
                angular.element(document.querySelectorAll('.titlelabel .item ul')).addClass('ng-hide');
            }
        }
        /**
         * 交易记录弹层隐藏
         * @param
         */
        self.hideall = function () {
            self.txallmaskShow = false;
            self.txallmaskShow2 = false;
            angular.element(document.querySelectorAll('.titlelabel .item ul')).addClass('ng-hide');
        }

        /**
         * 交易记录弹层隐藏2
         * @param
         */
        self.hideall2 = function (isPrev) {
            self.txallmaskShow2 = false;
            angular.element(document.querySelectorAll('.definedata')).addClass('ng-hide');
            if (isPrev) {
                self.isPrevIndex = true;
                self.slider1(true);
                self.slider2(true);
            } else {
                self.isPrevIndex = false;
                self.slider1(false);
                self.slider2(false);
            }
            $timeout(function () {
                $scope.$apply();
            })
        }

        /**
         * 时间弹出swiper
         */
        self.txdatef = function () {
            angular.element(document.querySelectorAll('.titlelabel .item ul')).addClass('ng-hide');
            self.txallmaskShow = false;
            if (angular.element(document.querySelectorAll('.definedata')).hasClass('ng-hide')) {
                self.txallmaskShow2 = true;
                angular.element(document.querySelectorAll('.definedata')).removeClass('ng-hide');
            } else {
                self.txallmaskShow2 = false;
                angular.element(document.querySelectorAll('.titlelabel .item ul')).addClass('ng-hide');
            }
            //滚动时间
            self.txacuryearval = new Date().getFullYear();
            self.txacurmthval = parseInt(new Date().getMonth()) + 1 < 10 ? '0' + (parseInt(new Date().getMonth()) + 1) : parseInt(new Date().getMonth());
            self.txalldate = true;
            self.txallmaskShow2 = true;
            if (self.isPrevIndex == false) {//完成后的初始化
                self.slider1(false);
                self.slider2(false);
            } else {//取消后的初始化
                self.slider1(true);
                self.slider2(true);
            }
        }

        /**
         * 日期时间滚动
         */
        self.slider1 = function (initialPrev) {
            self.yearIndex = initialPrev ? self.yearIndexPrev : self.yearIndex;
            /*console.log('year---initialPrev---'+initialPrev);
            console.log('year---self.yearIndexPrev---'+self.yearIndexPrev);
            console.log('year---self.yearIndex---'+self.yearIndex);*/
            var initialS = initialPrev ? self.yearIndexPrev : self.yearIndex;
            self.yearIndexPrev = initialS;
            /* console.log('year---initialS---'+initialS);*/
            var swiper = new Swiper('.txallswiper1', {
                speed: 500,
                direction: 'vertical',
                observer: true,//修改swiper自己或子元素时，自动初始化swiper
                observeParents: true,//修改swiper的父元素时，自动初始化swiper
                initialSlide: initialS,
                on: {
                    slideChangeTransitionEnd: function () {
                        var slideractiveVal = angular.element(document.querySelectorAll('.txallswiper1 .swiper-slide-active span')).text();
                        self.txacuryearval = slideractiveVal;
                        self.yearIndex = this.activeIndex;
                        $timeout(function () {
                            $scope.$apply();
                        })
                    },
                },
            });
        }
        self.slider2 = function (initialPrev) {
            self.monthIndex = initialPrev ? self.monthIndexPrev : self.monthIndex;
            /* console.log('month---initialPrev---'+initialPrev);
             console.log('month---self.monthIndexPrev---'+self.monthIndexPrev);
             console.log('month---self.monthIndex---'+self.monthIndex);*/
            var initialS = initialPrev ? self.monthIndexPrev : self.monthIndex;
            self.monthIndexPrev = initialS;
            /* console.log('month---initialS---'+initialS);*/
            var swiper = new Swiper('.txallswiper2', {
                speed: 500,
                direction: 'vertical',
                observer: true,//修改swiper自己或子元素时，自动初始化swiper
                observeParents: true,//修改swiper的父元素时，自动初始化swiper
                initialSlide: initialS,
                on: {
                    slideChangeTransitionEnd: function () {
                        var slideractiveVal = angular.element(document.querySelectorAll('.txallswiper2 .swiper-slide-active span')).text();
                        self.txacurmthval = slideractiveVal;
                        self.monthIndex = this.activeIndex;
                        $timeout(function () {
                            $scope.$apply();
                        })
                    },
                },
            });
        }

        /**
         * 筛选
         *
         */
        self.orderbyTX = function (key, type) {
            switch (type) {
                case 'date':
                    self.hideall2(false);
                    self.seach = {dateTime: self.txacuryearval + '-' + self.txacurmthval};
                    break;
                case 'status':
                    self.seach = {type: key};
                    break;
                case 'currency':
                    self.seach = {asset: key};
                    break;
            }

        }

        /**
         * 返回交易頁面
         *
         */
        self.goSend = function () {
            $rootScope.$emit('Local/SetTab', 'exchange', true);
        }

    });
