/**
 * Created by Philip on 7/22/2016.
 */
var app = angular.module('app', ['ionic', 'ngCordova', 'pasvaz.bindonce', 'controllers', 'services', 'directives',
    'images', 'config']);
app.run(function ($log, $ionicPlatform, $state, $ionicHistory, $cordovaSplashscreen, $q, $timeout, HttpService, $ionicPopup,
                  $cordovaInAppBrowser, $cordovaStatusbar, $rootScope, $cordovaPushV5, Cache, DB, signService, Config) {
    $ionicPlatform.ready(function () {
        // Hide the accessory bar by default (remove this to show the accessory bar above the keyboard
        // for form inputs)
        if (window.cordova && window.cordova.plugins.Keyboard) {
            cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
        }
        if (window.StatusBar) {
            StatusBar.styleDefault();
        }
        // Changed Status Bar Color for Android
        if (ionic.Platform.isAndroid()) {
            // $cordovaStatusbar.styleHex('#4369BA');
            $cordovaStatusbar.style(0);
        }
        // Create Database on start up
        DB.create('user');
        DB.create('key');
        DB.create('board');
        // Register Push Notifications
        pushNotifications().then(function (result) {
            var mToken = result;
            return DB.get('user').then(function (result) {
                if (result.info) {
                    var user = result.info;
                    user.notification_token = mToken;
                    return signService.getKeyPair().then(function () {
                        user.version = Config.appInfo.appVersion;
                        return HttpService.getSignature(user).then(function (result) {
                            user.signature = result;
                            return HttpService.post('getUser',user).then(function (result) {
                                if(result.version < Config.appInfo.serverVersion) {
                                    if (result.success == true) {
                                        result.response.age = getAge(result.response.birthday);
                                        Cache.setInfo('user', result.response);
                                        DB.update('user', result.response);
                                        goToMainMenu();
                                    }
                                    else {
                                        throw new Error('Success callback is false');
                                    }
                                }
                                else {
                                    clearDb();
                                    wrongVersionPopup();
                                }
                            });
                        });
                    });
                }
                else {
                    throw new Error('User not found');
                }
            });
        }).catch(function (error) {
            $log.debug(error);
            clearDb();
        }).then(function () {
            $timeout(function () {
                $cordovaSplashscreen.hide();
            }, 1000);
        });
    });

    function pushNotifications() {
        var options = {
            android: {
                senderID: "359705104297",
                icon: "boards_notification",
                iconColor: '#4369BA'
            },
            ios: {
                alert: "true",
                badge: "true",
                sound: "true"
            },
            windows: {}
        };
        return $q(function (resolve, reject) {
            // resolve("");
            // initialize
            $cordovaPushV5.initialize(options).then(function () {
                // start listening for new notifications
                $cordovaPushV5.onNotification();
                // start listening for errors
                $cordovaPushV5.onError();

                // register to get registrationId
                $cordovaPushV5.register().then(function (data) {
                    $log.debug("Token: ", data);
                    Cache.setInfo('token', data);
                    resolve(data);
                    // `data.registrationId` save it somewhere;
                }).catch(function (error) {
                    reject(error);
                });
            });
        });
    }

    function wrongVersionPopup() {
        $ionicPopup.show({
            title: 'Wrong Version',
            template: '<div class="text-color text-size-regular text-center-horizontal">You are using an outdated version, please update.</div>',
            buttons: [{
                text: 'Cancel',
                type: 'button-block button-outline button-light text-color'
            }, {
                text: 'Update',
                type: 'button-block button-dark',
                onTap: function () {
                    if (ionic.Platform.isIOS()) {
                        $cordovaInAppBrowser.open('https://itunes.apple.com/app/id1046409600', '_system', Cache.inAppBrowser);
                    }
                    else {
                        $cordovaInAppBrowser.open('https://play.google.com/store/apps/details?id=com.boards.boardsapp', '_system', Cache.inAppBrowser);
                    }
                }
            }]
        });
    }

    function getAge(dateString) {
        var today = new Date();
        var birthDate = new Date(dateString);
        var age = today.getFullYear() - birthDate.getFullYear();
        var m = today.getMonth() - birthDate.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }
        return age;
    }

    function clearDb() {
        DB.remove('user');
        DB.remove('key');
        DB.remove('board');
    }

    function goToMainMenu() {
        $ionicHistory.nextViewOptions({
            disableAnimate: true,
            historyRoot: true
        });
        $state.go('app.mainMenu');
    }

    // triggered every time notification received
    $rootScope.$on('$cordovaPushV5:notificationReceived', function (event, data) {
        $log.debug("Event: ", event);
        $log.debug("Data: ", data);
        // data.message,
        // data.title,
        // data.count,
        // data.sound,
        // data.image,
        // data.additionalData
    });

    // triggered every time error occurs
    $rootScope.$on('$cordovaPushV5:errorOcurred', function (event, error) {
        $log.debug("Event: ", event);
        $log.debug("Error: ", error);
        // error.message
    });

    $ionicPlatform.onHardwareBackButton(function (event) {
        event.preventDefault();
        $ionicHistory.goBack();
    });
});

app.config(function ($stateProvider, $urlRouterProvider, $ionicConfigProvider, $logProvider, $compileProvider) {
    $stateProvider
        .state('app', {
            url: "/app",
            abstract: true,
            templateUrl: "view/SideMenu.html",
            controller: 'SideMenuCtrl'
        })
        .state('app.mainMenu', {
            url: "/MainMenu",
            views: {
                'menuContent': {
                    templateUrl: 'view/MainMenu.html',
                    controller: 'MainMenuCtrl'
                }
            }
        })
        .state('app.introMenu', {
            url: "/IntroMenu",
            views: {
                'menuContent': {
                    templateUrl: 'view/IntroMenu.html',
                    controller: 'IntroMenuCtrl'
                }
            }
        })
        .state('app.LoginMenu', {
            url: "/LoginMenu",
            views: {
                'menuContent': {
                    templateUrl: 'view/LoginMenu.html',
                    controller: 'LoginMenuCtrl'
                }
            }
        })
        .state('app.createUserMenu', {
            url: "/CreateUserMenu",
            views: {
                'menuContent': {
                    templateUrl: 'view/CreateUserMenu.html',
                    controller: 'CreateUserMenuCtrl'
                }
            }
        })
        .state('app.recoveryMenu', {
            url: "/RecoveryMenu",
            views: {
                'menuContent': {
                    templateUrl: 'view/RecoveryMenu.html',
                    controller: 'RecoveryMenuCtrl'
                }
            }
        })
        .state('app.pictureMenu', {
            url: "/PictureMenu",
            views: {
                'menuContent': {
                    templateUrl: 'view/PictureMenu.html',
                    controller: 'PictureMenuCtrl'
                }
            }
        })
        .state('app.searchMenu', {
            url: "/SearchMenu",
            views: {
                'menuContent': {
                    templateUrl: 'view/SearchMenu.html',
                    controller: 'SearchMenuCtrl'
                }
            }
        })
        .state('app.addPictureMenu', {
            url: "/AddPictureMenu",
            views: {
                'menuContent': {
                    templateUrl: 'view/AddPictureMenu.html',
                    controller: 'AddPictureMenuCtrl'
                }
            }
        })
        .state('app.addBoardMenu', {
            url: "/AddBoardMenu",
            views: {
                'menuContent': {
                    templateUrl: 'view/AddBoardMenu.html',
                    controller: 'AddBoardMenuCtrl'
                }
            }
        })
        .state('app.settingsMenu', {
            url: "/SettingsMenu",
            views: {
                'menuContent': {
                    templateUrl: 'view/SettingsMenu.html',
                    controller: 'SettingsMenuCtrl'
                }
            }
        })
        .state('app.boardSelectModerator', {
            url: "/BoardSelectModerator",
            views: {
                'menuContent': {
                    templateUrl: 'view/BoardSelectMenu.html',
                    controller: 'BoardSelectModeratorCtrl'
                }
            }
        })
        .state('app.boardSelectUser', {
            url: "/BoardSelectUser",
            views: {
                'menuContent': {
                    templateUrl: 'view/BoardSelectMenu.html',
                    controller: 'BoardSelectUserCtrl'
                }
            }
        })
        .state('app.moderatorOptionMenu', {
            url: "/ModeratorOptionMenu",
            views: {
                'menuContent': {
                    templateUrl: 'view/ModeratorOptionMenu.html',
                    controller: 'ModeratorOptionMenuCtrl'
                }
            }
        })
        .state('app.moderatorPictureMenu', {
            url: "/ModeratorPictureMenu",
            views: {
                'menuContent': {
                    templateUrl: 'view/ModeratorPictureMenu.html',
                    controller: 'ModeratorPictureMenuCtrl'
                }
            }
        })
        .state('app.userMenu', {
            url: "/UserMenu",
            views: {
                'menuContent': {
                    templateUrl: 'view/UserMenu.html',
                    controller: 'UserMenuCtrl'
                }
            }
        });
    // if none of the above states are matched, use this as the fallback
    $urlRouterProvider.otherwise('app/IntroMenu');
    $ionicConfigProvider.backButton.text('');
    $ionicConfigProvider.backButton.previousTitleText(false);
    $ionicConfigProvider.views.swipeBackEnabled(false);
    $ionicConfigProvider.tabs.position('bottom');
    $ionicConfigProvider.views.forwardCache(false);
    // $ionicConfigProvider.scrolling.jsScrolling(false);

    //////////////////  Release  //////////////////////////
    $logProvider.debugEnabled(false);
    $compileProvider.debugInfoEnabled(false);
    //////////////////  Debugging  //////////////////////////
    /*$logProvider.debugEnabled(true);
     $compileProvider.debugInfoEnabled(true);*/
});

app.constant('$ionicLoadingConfig', {
    template: '<ion-spinner class="light"></ion-spinner><h4>Loading</h4>'
});

