'use strict';

var unsupported, isaosp;
var breadcrumbs = require('inWalletcore/breadcrumbs.js');

if (window && window.navigator) {
  var rxaosp = window.navigator.userAgent.match(/Android.*AppleWebKit\/([\d.]+)/);
  isaosp = (rxaosp && rxaosp[1] < 537);
  if (!window.cordova && isaosp)
    unsupported = true;
  if (unsupported) {
    window.location = '#/unsupported';
  }
}


//Setting up route
angular
  .module('copayApp')
  .config(function (historicLogProvider, $provide, $logProvider, $stateProvider, $urlRouterProvider, $compileProvider, $qProvider) {
    $qProvider.errorOnUnhandledRejections(false);
    $urlRouterProvider.otherwise('/');

    $logProvider.debugEnabled(true);
    $provide.decorator('$log', ['$delegate',
      function ($delegate) {
        var historicLog = historicLogProvider.$get();

        ['debug', 'info', 'warn', 'error', 'log'].forEach(function (level) {

          var orig = $delegate[level];
          $delegate[level] = function () {
            if (level == 'error')
              console.log(arguments);

            var args = [].slice.call(arguments);
            if (!Array.isArray(args)) args = [args];
            args = args.map(function (v) {
              try {
                if (typeof v == 'undefined') v = 'undefined';
                if (!v) v = 'null';
                if (typeof v == 'object') {
                  if (v.message)
                    v = v.message;
                  else
                    v = JSON.stringify(v);
                }
                // Trim output in mobile
                if (window.cordova) {
                  v = v.toString();
                  if (v.length > 1000) {
                    v = v.substr(0, 997) + '...';
                  }
                }
              } catch (e) {
                console.log('Error at log decorator:', e);
                v = 'undefined';
              }
              return v;
            });
            try {
              if (window.cordova)
                console.log(args.join(' '));
              historicLog.add(level, args.join(' '));
              orig.apply(null, args);
            } catch (e) {
              console.log('ERROR (at log decorator):', e, args[0]);
            }
          };
        });
        return $delegate;
      }
    ]);

    // whitelist 'chrome-extension:' for chromeApp to work with image URLs processed by Angular
    // link: http://stackoverflow.com/questions/15606751/angular-changes-urls-to-unsafe-in-extension-page?lq=1
    $compileProvider.imgSrcSanitizationWhitelist(/^\s*((https?|ftp|file|blob|chrome-extension):|data:image\/)/);

    $stateProvider
      .state('splash', {
        url: '/splash',
        needProfile: false,
        views: {
          'main': {
            templateUrl: 'views/splash.html',
          }
        }
      })
        .state('create', {
            url: '/create',
            needProfile: false,
            views: {
                'main': {
                    templateUrl: 'views/create.html'
                }
            }
        })
      .state('addwallet', {
          url: '/addwallet.html',
          needProfile: false,
          views: {
              'main': {
                  templateUrl: 'views/addwallet.html',
              }
          }
      });

    $stateProvider
      .state('walletHome', {
        url: '/?walletType&walletId',
        walletShouldBeComplete: true,
        needProfile: true,
        deepStateRedirect: true,
        sticky: true,
        views: {
          'main': {
            templateUrl: 'views/walletHome.html',
          }
        }
      })
      .state('discovery', {
          url: '/discovery',
          needProfile: true,
          views: {
              'main': {
                  templateUrl: 'views/discovery.html',
              }
          }
      })
      .state('exchange', {
          url: '/exchange',
          needProfile: true,
          views: {
              'main': {
                  templateUrl: 'views/exchange.html',
              }
          }
      })
      .state('wallet', {
          url: '/wallet',
          needProfile: true,
          views: {
              'main': {
                  templateUrl: 'views/wallet.html',
              }
          }
      })
      .state('unsupported', {
        url: '/unsupported',
        needProfile: false,
        views: {
          'main': {
            templateUrl: 'views/unsupported.html'
          }
        }
      })

      .state('correspondentDevices', {
        url: '/correspondentDevices',
        walletShouldBeComplete: false,
        needProfile: true,
        deepStateRedirect: true,
        sticky: true,
        views: {
          'main': {
            templateUrl: 'views/correspondentDevices.html'
          }
        }
      })
      .state('correspondentDevices.correspondentDevice', {
        url: '/device',
        walletShouldBeComplete: false,
        needProfile: true,
        views: {
          'dialog@correspondentDevices': {
            templateUrl: 'views/correspondentDevice.html'
          }
        }
      })
      .state('correspondentDevices.correspondentDevice.editCorrespondentDevice', {
        url: '/edit',
        walletShouldBeComplete: false,
        needProfile: true,
        views: {
          'dialog@correspondentDevices': {
            templateUrl: 'views/editCorrespondentDevice.html'
          }
        }
      })
      .state('correspondentDevices.addCorrespondentDevice', {
        url: '/add',
        needProfile: true,
        views: {
          'dialog': {
            templateUrl: 'views/addCorrespondentDevice.html'
          }
        }
      })
      .state('correspondentDevices.addCorrespondentDevice.inviteCorrespondentDevice', {
        url: '/invite',
        walletShouldBeComplete: false,
        needProfile: true,
        views: {
          'dialog@correspondentDevices': {
            templateUrl: 'views/inviteCorrespondentDevice.html'
          }
        }
      })
      .state('correspondentDevices.addCorrespondentDevice.acceptCorrespondentInvitation', {
        url: '/acceptCorrespondentInvitation',
        walletShouldBeComplete: false,
        needProfile: true,
        views: {
          'dialog@correspondentDevices': {
            templateUrl: 'views/acceptCorrespondentInvitation.html'
          }
        }
      })
      .state('preferences', {
        url: '/preferences',
        templateUrl: 'views/preferences.html',
        walletShouldBeComplete: true,
        needProfile: true,
        modal: true,
        views: {
          'main': {
            templateUrl: 'views/preferences.html',
          }
        }
      })

      .state('preferencesGlobal', {
        url: '/preferencesGlobal',
        needProfile: true,
        modal: true,
        views: {
          'main': {
            templateUrl: 'views/preferencesGlobal.html',
          }
        }
      })
      .state('preferencesGlobal.preferencesLanguage', {
        url: '/language',
        walletShouldBeComplete: true,
        needProfile: true,
        views: {
          'main@': {
            templateUrl: 'views/preferencesLanguage.html'
          }
        }
      })
      .state('preferencesGlobal.preferencesCurrency', {
          url: '/currency',
          walletShouldBeComplete: true,
          needProfile: true,
          views: {
              'main@': {
                  templateUrl: 'views/preferencesCurrency.html'
              }
          }
      })

      .state('preferencesGlobal.recoveryFromSeed', {
        url: '/recoveryFromSeed',
        templateUrl: 'views/recoveryFromSeed.html',
        walletShouldBeComplete: true,
        needProfile: true,
        views: {
          'main@': {
            templateUrl: 'views/recoveryFromSeed.html'
          }
        }
      })
      .state('preferencesGlobal.export', {
        url: '/export',
        templateUrl: 'views/export.html',
        walletShouldBeComplete: true,
        needProfile: true,
        views: {
          'main@': {
            templateUrl: 'views/export.html'
          }
        }
      })
      .state('import', {
        url: '/import',
        needProfile: true,
        views: {
          'main@': {
            templateUrl: 'views/import.html'
          }
        }
      })
      .state('importbtc', {
          url: '/importbtc',
          needProfile: true,
          views: {
              'main': {
                  templateUrl: 'views/importbtc.html'
              }
          }
      })
    .state('importeth', {
        url: '/importeth',
        needProfile: true,
        views: {
            'main': {
                templateUrl: 'views/importeth.html'
            }
        }
    })
        .state('importsnc', {
            url: '/importsnc',
            needProfile: true,
            views: {
                'main': {
                    templateUrl: 'views/importsnc.html'
                }
            }
        })
      .state('preferencesGlobal.preferencesAbout', {
        url: '/about',
        templateUrl: 'views/preferencesAbout.html',
        walletShouldBeComplete: true,
        needProfile: true,
        views: {
          'main@': {
            templateUrl: 'views/preferencesAbout.html'
          }
        }
      })
      .state('preferencesGlobal.preferencesAbout.term', {
        url: '/term',
        needProfile: false,
        views: {
          'main@': {
            templateUrl: 'views/term.html',
          }
        }
      })
      .state('disclaimer', {
        url: '/disclaimer',
        needProfile: false,
        views: {
          'main': {
            templateUrl: 'views/disclaimer.html',
          }
        }
      })
      .state('preferencesGlobal.preferencesAbout.translators', {
        url: '/translators',
        walletShouldBeComplete: true,
        needProfile: true,
        views: {
          'main@': {
            templateUrl: 'views/translators.html'
          }
        }
      })
      .state('preferencesGlobal.preferencesAbout.preferencesLogs', {
        url: '/logs',
        templateUrl: 'views/preferencesLogs.html',
        walletShouldBeComplete: true,
        needProfile: true,
        views: {
          'main@': {
            templateUrl: 'views/preferencesLogs.html'
          }
        }
      })

      .state('walletname', {
        url: '/walletname?walletType&walletId&address&name&image&ammount&mnemonic&mnemonicEncrypted',
        needProfile: true,
        views: {
            'main@': {
                templateUrl: 'views/walletname.html'
            }
        }
      })
      .state('changeWalletPassWord', {
          url: '/changeWalletPassWord?walletType&walletId&address&name&image&ammount&mnemonic&mnemonicEncrypted',
          needProfile: true,
          views: {
              'main@': {
                  templateUrl: 'views/changeWalletPassWord.html'
              }
          }
      })
      .state('importwallet', {
          url: '/importwallet?walletType&walletId&address&name&image&ammount&mnemonic&mnemonicEncrypted',
          needProfile: true,
          views: {
              'main': {
                  templateUrl: 'views/importwallet.html'
              }
          }
      })

      .state('backup', {
          url: '/backup?walletType&walletId&address&name&image&ammount&mnemonic&mnemonicEncrypted',
          templateUrl: 'views/backup.html',
          walletShouldBeComplete: true,
          needProfile: true,
          views: {
              'main@': {
                  templateUrl: 'views/backup.html'

              }
          }
      })
      .state('receive', {
          url: '/receive?booleanPay&walletType&walletId&address&name&image&ammount&mnemonic&mnemonicEncrypted',
          walletShouldBeComplete: true,
          needProfile: true,
          views: {
              'main': {
                  templateUrl: 'views/receive.html'

              }
          }
      })

      .state('newsin', {
            url: '/article?id',
            views: {
                'main': {
                    templateUrl: 'views/newsin.html'
                }
            }
      })
      .state('storselect', {
          url: '/storselect',
          views: {
              'main': {
                  templateUrl: 'views/storselect.html'
              }
          }
      })
      .state('rent', {
          url: '/rent',
          views: {
              'main': {
                  templateUrl: 'views/rent.html'
              }
          }
      })
      .state('hashset', {
          url: '/hashset',
          views: {
              'main': {
                  templateUrl: 'views/hashset.html'
              }
          }
      })
        .state('authorization', {
            url: '/authorization',
            views: {
                'main': {
                    templateUrl: 'views/authorization.html'
                }
            }
        })
        .state('login', {
            url: '/login',
            views: {
                'main': {
                    templateUrl: 'views/login.html'
                }
            }
        })
        .state('register', {
            url: '/register',
            views: {
                'main': {
                    templateUrl: 'views/register.html'
                }
            }
        })
        .state('stornet', {
            url: '/stornet',
            views: {
                'main': {
                    templateUrl: 'views/stornet.html'
                }
            }
        })
        .state('walletinfo', {
            url: '/walletinfo?walletType&walletId&address&name&image&ammount&mnemonic&mnemonicEncrypted',
            views: {
                'main': {
                    templateUrl: 'views/walletinfo.html'
                }
            }
        })
        .state('transfer', {
            url: '/transfer?walletType&walletId&address&name&image&ammount&mnemonic&mnemonicEncrypted',
            views: {
                'main': {
                    templateUrl: 'views/transfer.html'
                }
            }
        })
        .state('txall', {
            url: '/txall',
            views: {
                'main': {
                    templateUrl: 'views/txall.html'
                }
            }
        })
        .state('diceWin', {
            url: '/diceWin',
            views: {
                'main': {
                    templateUrl: 'views/diceWin.html'
                }
            }
        })
        /*.state('destination-address', {
            url: '/destination-address?addr&page&walletType&walletId&addressess&walletName',
            views: {
                'main': {
                    templateUrl: 'views/destination-address.html'
                }
            }
        })*/
      .state('cordova', { // never used
          url: '/cordova/:status/:isHome',
          views: {
              'main': {
                  controller: function ($rootScope, $state, $stateParams, $timeout, go, isCordova) {
                      console.log('cordova status: ' + $stateParams.status);
                      switch ($stateParams.status) {
                          case 'resume':
                              $rootScope.$emit('Local/Resume');
                              break;
                          case 'backbutton':
                              if (isCordova && $stateParams.isHome == 'true' && !$rootScope.modalOpened)
                                  navigator.app.exitApp();
                              else
                                  $rootScope.$emit('closeModal');
                              break;
                      };
                      // why should we go home on resume or backbutton?
                      /*
                    $timeout(function() {
                      $rootScope.$emit('Local/SetTab', 'walletHome', true);
                    }, 100);
                    go.walletHome();
                    */
                  }
              }
          },
          needProfile: false
      });
  })
  .run(function ($rootScope, $state, $log, uriHandler, isCordova, profileService, $timeout, nodeWebkit, uxLanguage ,uxCurrency, animationService) {
     FastClick.attach(document.body);
    uxLanguage.init();
    uxCurrency.init();
    // Register URI handler, not for mobileApp
    if (!isCordova) {
      uriHandler.register();
    }
    //屏蔽顶部空块
    /*if (nodeWebkit.isDefined()) {
      var gui = require('nw.gui');
      var win = gui.Window.get();
      var nativeMenuBar = new gui.Menu({
        type: "menubar"
      });
      try {
        nativeMenuBar.createMacBuiltin("inWallet");
      } catch (e) {
        $log.debug('This is not OSX');
      }
      win.menu = nativeMenuBar;
    }*/

    $rootScope.$on('$stateChangeStart', function (event, toState, toParams, fromState, fromParams) {
        $rootScope.previousState_name = fromState.name;
        $rootScope.previousState_params = fromParams;
      /*  historyUrlService.setBackUrl(window.location.href);*/
      if (!profileService.profile && toState.needProfile) {

        // Give us time to open / create the profile
        event.preventDefault();

        if (!profileService.assocVisitedFromStates)
          profileService.assocVisitedFromStates = {};
        breadcrumbs.add('$stateChangeStart no profile from ' + fromState.name + ' to ' + toState.name);
        if (profileService.assocVisitedFromStates[fromState.name] && !fromState.name)
          return breadcrumbs.add("already loading profile, ignoring duplicate $stateChangeStart from " + fromState.name);
        profileService.assocVisitedFromStates[fromState.name] = true;

        // Try to open local profile
        profileService.loadAndBindProfile(function (err) {
          delete profileService.assocVisitedFromStates[fromState.name];
          if (err) {
            if (err.message && err.message.match('NOPROFILE')) {
              $log.debug('No profile... redirecting');
              return $state.transitionTo('create');
            } else if (err.message && err.message.match('NONAGREEDDISCLAIMER')) {
              $log.debug('Display disclaimer... redirecting');
              return $state.transitionTo('disclaimer');
            } else {
              throw new Error(err.message || err); // TODO
            }
          } else {
            $log.debug('Profile loaded ... Starting UX.');
            /*$rootScope.createdataw = profileService.profile.credentials;*/
            return $state.transitionTo(toState.name || toState, toParams);
          }
        });
      }

     /* if (profileService.focusedClient && !profileService.focusedClient.isComplete() && toState.walletShouldBeComplete) {

        $state.transitionTo('copayers');
        event.preventDefault();
      }*/

      if (!animationService.transitionAnimated(fromState, toState)) {
        event.preventDefault();
        // Time for the backpane to render
        setTimeout(function () {
          $state.transitionTo(toState);
        }, 50);
      }
    });
    $rootScope.back = function() {//实现返回的函数
        $state.go($rootScope.previousState_name,$rootScope.previousState_params);
    };
  });
