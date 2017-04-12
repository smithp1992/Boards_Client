/**
 * Created by Philip on 7/22/2016.
 */

var controllers = angular.module('controllers', []);

// TODO: Side Menu Controller
controllers.controller('SideMenuCtrl', function($scope, $ionicHistory, $location, $timeout, DB, $cordovaInAppBrowser, Config) {

    $scope.userBoards = function() {
        $timeout(function() {
            $location.path('app/BoardSelectModerator');
        }, 300);
    };
    $scope.userPictures = function() {
        $timeout(function() {
            $location.path('app/BoardSelectUser');
        }, 300);
    };
    $scope.settings = function() {
        $timeout(function() {
            $location.path('app/SettingsMenu');
        }, 300);
    };
    $scope.help = function() {
        $cordovaInAppBrowser.open('https://boardsapp.io/help', '_system', Config.inAppBrowser);
    };
    $scope.logoutUser = function() {
        clearDB();
        $timeout(function() {
            $ionicHistory.clearHistory();
            $ionicHistory.clearCache();
            $ionicHistory.nextViewOptions({
                historyRoot: true
            });
            $location.path('app/IntroMenu');
        }, 300);
    };
    
    function clearDB() {
        DB.remove('user');
        DB.remove('key');
        DB.remove('board');
    }
});

// TODO: Intro Menu Controller
controllers.controller('IntroMenuCtrl', function ($scope, $ionicHistory, $location, $window, Cache) {

    var isIOS = ionic.Platform.isIOS();
    var isAndroid = ionic.Platform.isAndroid();
    var isWindowsPhone = ionic.Platform.isWindowsPhone();

    if(isAndroid || isWindowsPhone) {
        $scope.images = [
            {src: "img/LocalBoardsSlideAndroid.png"},
            {src: "img/PictureViewSlideAndroid.png"},
            {src: "img/BoardInfoSlideAndroid.png"},
            {src: "img/ModeratorSlideAndroid.png"}
        ];
    }
    else if(isIOS) {
        $scope.images = [
            {src: "img/LocalBoardsSlideiOS.png"},
            {src: "img/PictureViewSlideiOS.png"},
            {src: "img/BoardInfoSlideiOS.png"},
            {src: "img/ModeratorSlideiOS.png"}
        ];
    }
    $scope.goToUserLogin = function() {
        $location.path('app/LoginMenu');
    };
    $scope.goToCreateUser = function() {
        $location.path('app/CreateUserMenu');
    };

    $scope.$on('$ionicView.beforeLeave', function() {
        Cache.setInfo('dimensions', {width: $window.innerWidth, height: $window.innerHeight});
    });
});

// TODO: Login Menu Controller
controllers.controller('LoginMenuCtrl', function ($scope, $log, $location, $cordovaKeyboard, $ionicPopup, $ionicHistory, $ionicLoading,
                                                  $cordovaInAppBrowser, $cordovaToast, DB, Config, signService, HttpService, Cache) {
    $scope.userInfo = {
        email: "",
        password: ""
    };
    $scope.loading = false;

    $scope.goBack = function() {
        $ionicHistory.goBack();
    };
    $scope.goToRecoveryMenu = function() {
        $location.path('app/RecoveryMenu');
    };
    $scope.loginUser = function() {
        /*if ($cordovaKeyboard.isVisible()) {
            $cordovaKeyboard.close();
         }*/
        if (!$scope.loading && checkUserInfo()) {
            $scope.loading = true;
            $ionicLoading.show();
            signService.createKeyPair($scope.userInfo.password).then(function (result) {
                return signService.getKeyPair().then(function (result) {
                    if (result.pub_key) {
                        var params = {
                            email: $scope.userInfo.email,
                            pub_key: result.pub_key,
                            version: Config.appInfo.appVersion,
                            notification_token: Cache.getInfo('token')
                        };
                        return HttpService.getSignature(params).then(function (result) {
                            params.signature = result;
                            return HttpService.post('loginUser', params).then(function (result) {
                                if (result.version < Config.appInfo.serverVersion) {
                                    if (result.success == true) {
                                        result.response.age = getAge(result.response.birthday);
                                        Cache.setInfo('user', result.response);
                                        return DB.update('user', result.response).then(function () {
                                            goToMainMenu();
                                        });
                                    }
                                    else {
                                        $log.debug("Invalid Email and/or Password");
                                        $cordovaToast.showShortCenter("Invalid Email and/or Password");
                                    }
                                }
                                else {
                                    wrongVersionPopup();
                                }
                            });
                        });
                    }
                    else {
                        throw new Error("Unable to get public key")
                    }
                });
            }).catch(function (error) {
                $log.debug(error);
                $cordovaToast.showShortCenter("Error logging in");
                clearDB();
            }).then(function () {
                $scope.loading = false;
                $ionicLoading.hide();
            });
        }
    };

    function goToMainMenu() {
        $ionicHistory.clearHistory();
        $ionicHistory.clearCache();
        $ionicHistory.nextViewOptions({
            historyRoot: true
        });
        $location.path('app/MainMenu');
    }

    function wrongVersionPopup() {
        $ionicPopup.show({
            title: 'Wrong Version',
            template: '<div class="text-color text-size-regular text-center-horizontal">You are using an outdated version, please update.</div>',
            buttons: [{
                text: 'Cancel',
                type: 'button-block button-outline button-light text-color'
            },{
                text: 'Update',
                type: 'button-block button-dark',
                onTap: function() {
                    if(ionic.Platform.isIOS()) {
                        $cordovaInAppBrowser.open('https://itunes.apple.com/app/id1046409600', '_system', Config.inAppBrowser);
                    }
                    else {
                        $cordovaInAppBrowser.open('https://play.google.com/store/apps/details?id=com.boards.boardsapp', '_system', Config.inAppBrowser);
                    }
                }
            }]
        });
    }

    function checkUserInfo() {
        if ($scope.userInfo.email == "" && $scope.userInfo.password == "") {
            $cordovaToast.showShortCenter("Please Enter Your Email and Password");
        }
        else if ($scope.userInfo.email == "") {
            $cordovaToast.showShortCenter("Please Enter Your Email");
        }
        else if ($scope.userInfo.password == "") {
            $cordovaToast.showShortCenter("Please Enter Your Password");
        }
        else {
            return true;
        }
        return false;
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

    function clearDB() {
        DB.remove('key');
        DB.remove('user');
    }
});

// TODO: Create User Menu Controller
controllers.controller('CreateUserMenuCtrl', function($scope, $log, $ionicHistory, $location, $cordovaToast, $cordovaInAppBrowser,
                                                      $cordovaKeyboard, $ionicPopup, Cache, Config, DB, signService) {
    $scope.userInfo = {
        email: "",
        username: "",
        password: "",
        verifyPass: "",
        termsOfService: false
    };
    $scope.loading = false;
    var birthday;
    $scope.createUser = function(params) {
        if($cordovaKeyboard.isVisible()) {
            $cordovaKeyboard.close();
        }
        if (checkUserInfo() && !$scope.loading) {
            $scope.loading = true;
            var birthday = params;
            signService.createKeyPair($scope.userInfo.birthday).then(function (result) {
                return signService.getKeyPair().then(function (result) {
                    if (result.pub_key) {
                        var params = {
                            email: $scope.userInfo.email,
                            pub_key: result.pub_key,
                            username: $scope.userInfo.username,
                            birthday: birthday,
                            nsfw: (getAge($scope.userInfo.birthday) >= 18),
                            version: Config.appInfo.appVersion,
                            notification_token: Cache.getInfo('token')
                        };
                        return HttpService.getSignature(params).then(function (result) {
                            params.signature = result;
                            return HttpService.post('newUser', params).then(function (result) {
                                if (result.version < Config.appInfo.serverVersion) {
                                    if (result.success) {
                                        result.response.age = getAge(result.response.birthday);
                                        Cache.setInfo('user', result.response);
                                        return DB.update('user', result.response).then(function (result) {
                                            goToMainMenu();
                                        });
                                    }
                                    else {
                                        $log.debug("Username and/or email is taken");
                                        $cordovaToast.showLongCenter("Username and/or Email Is Taken");
                                    }
                                }
                                else {
                                    wrongVersionPopup();
                                }
                            });
                        });
                    }
                    else {
                        throw new Error("Error Getting Key Pair");
                    }
                });
            }).catch(function (error) {
                $log.debug(error);
                $cordovaToast.showShortCenter("Error creating user");
                clearDB();
            }).then(function () {
                $scope.loading = false;
            });
        }
    };

    $scope.termsOfService = function() {
        $cordovaInAppBrowser.open('https://boardsapp.io/terms', '_system', options);
    };

    function goToMainMenu() {
        $ionicHistory.clearHistory();
        $ionicHistory.clearCache();
        $ionicHistory.nextViewOptions({
            historyRoot: true
        });
        $location.path('app/MainMenu');
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

    function checkUserInfo() {
        if ($scope.userInfo.email == "" && $scope.userInfo.username == "" && $scope.userInfo.password == "" && $scope.userInfo.verifyPass == "") {
            $cordovaToast.showShortCenter("Please Provide Your Information");
        }
        else if ($scope.userInfo.email == "") {
            $cordovaToast.showShortCenter("No Email Specified");
        }
        else if ($scope.userInfo.username == "") {
            $cordovaToast.showShortCenter("No Username Specified");
        }
        else if (!($scope.userInfo.username.indexOf(' ') === -1)) {
            $cordovaToast.showLongCenter("No Spaces Allowed in Username");
        }
        else if ($scope.userInfo.password == "") {
            $cordovaToast.showShortCenter("No Password Specified");
        }
        else if ($scope.userInfo.verifyPass == "") {
            $cordovaToast.showShortCenter("Please Verify Password");
        }
        else if ($scope.userInfo.verifyPass != $scope.userInfo.password) {
            $cordovaToast.showShortCenter("Passwords Do Not Match");
        }
        else if ($scope.userInfo.termsOfService == false) {
            $cordovaToast.showShortCenter("Please Agree to Terms of Service");
        }
        else if (angular.isUndefined(birthday) || birthday == null || getAge(birthday) < 13) {
            birthday = new Date(1994, 0, 1);
            return true
        }
        else {
            return true;
        }
        return false;
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
});

// TODO: Recovery Menu Controller
controllers.controller('RecoveryMenuCtrl', function($scope, $log, $ionicHistory, $cordovaKeyboard, $cordovaToast, HttpService) {
    $scope.userInfo = {};
    $scope.goBack = function() {
        $ionicHistory.goBack();
    };

    $scope.recoverUser = function() {
        if ($cordovaKeyboard.isVisible()) {
            $cordovaKeyboard.close();
        }
        HttpService.post('sendRecoveryEmail', $scope.userInfo).then(function (result) {
            if(result.success) {
                $cordovaToast.showShortCenter("Recovery email sent");
                $scope.goBack();
            }
            else {
                $log.debug("Unable to send email")
                $cordovaToast.showShortCenter("Unable to send email");
            }
        }).catch(function (error) {
            $log.debug(error);
            $cordovaToast.showShortCenter("Error sending recovery email");
        });
    };
});


// TODO: Main Menu Controller
controllers.controller('MainMenuCtrl', function($scope, $log, $ionicHistory, $location, $ionicLoading, $ionicTabsDelegate,
                                                $ionicSlideBoxDelegate, $cordovaToast, $ionicPlatform, $ionicScrollDelegate,
                                                $cordovaGeolocation, HttpService, Cache, Config) {
    
    $scope.boardsLocal = [];
    $scope.boardsGlobal = [];
    $scope.loading = false;
    $scope.title = "Local Boards";
    $scope.noMoreBoards = false;
    $scope.menu = {
        slideIndex: 0,
        slideCount: 2,
        slides: [
            {template: "view/LocalBoardsMenu.html"},
            {template: "view/GlobalBoardsMenu.html"}
        ]
    };
    var userInfo = {};
    var boardInfo = {};
    var offset = 0;
    var listPos = 0;
    var currentSlide = -1;
    var local_global = "";
    var tabs = "";
    
    $scope.goToAddBoardMenu = function() {
        $location.path('app/AddBoardMenu');
    };
    $scope.goToSearchMenu = function() {
        $location.path('app/SearchMenu');
    };
    $scope.goToPictureMenu = function(item) {
        // Send list index into boardInfo variable
        if(local_global == 'local') {
            item.index = $scope.boardsLocal.indexOf(item);
        }
        else {
            item.index = $scope.boardsGlobal.indexOf(item);
        }
        item.flag = false;
        item.array = local_global;
        // Send boardInfo into cache
        Cache.setInfo('board', item);
        $location.path('app/PictureMenu');
    };
    
    $scope.getBoards = function() {
        if(!$scope.loading) {
            $scope.loading = true;
            offset = 0;
            $cordovaGeolocation.getCurrentPosition(Config.geolocation).then(function (result) {
                var params = {
                    u_id: userInfo.u_id,
                    longitude: result.coords.longitude,
                    latitude: result.coords.latitude,
                    local_global: local_global,
                    offset: offset
                };
                return HttpService.getSignature(params).then(function (result) {
                    params.signature = result;
                    return HttpService.post(tabs + "Boards", params).then(function (result) {
                        if(result.success) {
                            if(result.response.length > 0) {
                                var index = 0;
                                offset = result.response.length;
                                $scope.noMoreBoards = (result.response.length < 10);
                                if(local_global == 'local') {
                                    $scope.boardsLocal = result.response;
                                    for(index; index < offset; index++) {
                                        $scope.boardsLocal[index].logo = "data:image/jpeg;base64," + $scope.boardsLocal[index].logo;
                                    }
                                    $scope.loading = false;
                                }
                                else if(local_global == 'global') {
                                    $scope.boardsGlobal = result.response;
                                    for(index; index < offset; index++) {
                                        $scope.boardsGlobal[index].logo = "data:image/jpeg;base64," + $scope.boardsGlobal[index].logo;
                                    }
                                    $scope.loading = false;
                                }
                                else {
                                    throw new Error("Local_Global not set");
                                }
                            }
                            else {
                                throw "No boards found";
                            }
                        }
                        else {
                            throw new Error("Http request failed");
                        }
                    });
                });
            }).catch(function (error) {
                $log.debug(error);
                $scope.boardsGlobal = [];
                $scope.boardsLocal = [];
                $scope.noMoreBoards = true;
                $scope.loading = false;
            });
        }
    };
    
    $scope.getMoreBoards = function() {
        $cordovaGeolocation.getCurrentPosition(Cache.geolocation).then(function (result) {
            var params = {
                u_id: userInfo.u_id,
                longitude: result.coords.longitude,
                latitude: result.coords.latitude,
                local_global: local_global,
                offset: offset
            };
            return HttpService.getSignature(params).then(function (result) {
                params.signature = result;
                return HttpService.post(tabs + "Boards", params).then(function (result) {
                    if(result.success) {
                        if(result.response.length > 0) {
                            var index = offset;
                            if(local_global == 'local') {
                                $scope.boardsLocal = $scope.boardsLocal.concat(result.response);
                                offset = $scope.boardsLocal.length;
                                for(index; index < offset; index++) {
                                    $scope.boardsLocal[index].logo = "data:image/jpeg;base64," + $scope.boardsLocal[index].logo;
                                }
                                $scope.$broadcast('scroll.infiniteScrollComplete');
                            }
                            else if(local_global == 'global') {
                                $scope.boardsGlobal = $scope.boardsGlobal.concat(result.response);
                                offset = $scope.boardsGlobal.length;
                                for(index; index < offset; index++) {
                                    $scope.boardsGlobal[index].logo = "data:image/jpeg;base64," + $scope.boardsGlobal[index].logo;
                                }
                                $scope.$broadcast('scroll.infiniteScrollComplete');
                            }
                            else {
                                throw new Error("Local_Global not defined");
                            }
                        }
                        else {
                            throw "No boards found";
                        }
                    }
                    else {
                        throw new Error("Http Request Failed");
                    }
                });
            });
        }).catch(function (error) {
            $log.debug(error);
            $scope.noMoreBoards = true;
            $scope.$broadcast('scroll.infiniteScrollComplete');
        });
    };

    $scope.orderList = function(param) {
        if(tabs != "") {
            tabs = param;
            Cache.setInfo('tabs', tabs);
            $scope.getBoards();
        }
    };

    $scope.changeLocalGlobal = function(param) {
        if(param == 'local') {
            $ionicSlideBoxDelegate.slide(0, 400);
            $scope.slideChanged(0);
        }
        else if(param == 'global') {
            $ionicSlideBoxDelegate.slide(1, 400);
            $scope.slideChanged(1);
        }
    };

    $scope.slideChanged = function(index) {
        if(currentSlide != -1) {
            currentSlide = index;
            if(index == 0) {
                $scope.boardsGlobal = [];
                $scope.title = "Local Boards";
                local_global = 'local';
                if($ionicTabsDelegate.$getByHandle('local-global-tabs').selectedIndex() != 0) {
                    $ionicTabsDelegate.$getByHandle('local-global-tabs').select(0);
                }
            }
            else if(index == 1) {
                $scope.boardsLocal = [];
                $scope.title = "Global Boards";
                local_global = 'global';
                if($ionicTabsDelegate.$getByHandle('local-global-tabs').selectedIndex() != 1) {
                    $ionicTabsDelegate.$getByHandle('local-global-tabs').select(1);
                }
            }
            Cache.setInfo('local_global', local_global);
            $scope.menu.slideIndex = index;
            if ($ionicTabsDelegate.$getByHandle('board-tabs').selectedIndex() != 0) {
                $ionicTabsDelegate.$getByHandle('board-tabs').select(0);
            }
            $scope.orderList('trending');
        }
    };

    function updateBoardInfo() {
        boardInfo = Cache.getInfo('board');
        if(boardInfo.b_id) {
            var params = {
                u_id: userInfo.u_id,
                b_id: boardInfo.b_id
            };
            Cache.setInfo('board', {});
            HttpService.getSignature(params).then(function (result) {
                params.signature = result;
                return HttpService.post('getBoard', params).then(function (result) {
                    if (result.success == true && result.response.length > 0) {
                        if (boardInfo.array == 'local' && angular.isDefined($scope.boardsLocal[boardInfo.index])) {
                            $scope.boardsLocal[boardInfo.index].count = parseInt(result.response[0].viewableCount);
                        }
                        else if (boardInfo.array == 'global' && angular.isDefined($scope.boardsGlobal[boardInfo.index])) {
                            $scope.boardsGlobal[boardInfo.index].count = parseInt(result.response[0].viewableCount);
                        }
                    }
                    else {
                        throw new Error("Board id not found");
                    }
                });
            }).catch(function (error) {
                $log.debug(error);
                $cordovaToast.showShortCenter("Unable to get board information");
            });
        }
        else {
            $scope.getBoards();
        }
    }
    
    function getTabPosition() {
        // Get Current Position of tab from when the user changed views
        var tab = Cache.getInfo('tabs');
        if(tab == "" || tab == 'trending') {
            tab = 'trending';
            $ionicTabsDelegate.select(0);
        }
        else if(tab == 'popular') {
            $ionicTabsDelegate.select(1);
        }
        else if(tab == 'newest') {
            $ionicTabsDelegate.select(2);
        }
        else if(tab == 'favorite') {
            $ionicTabsDelegate.select(3);
        }
        return tab;
    }
    function getCurrentSlide() {
        currentSlide = -1;
        // Gets current slide from cache then slides to Local or Global slide
        var slide = Cache.getInfo('local_global');
        if(slide == "" || slide == 'local') {
            currentSlide = 0;
        }
        else if(slide == 'global') {
            $ionicSlideBoxDelegate.slide(1, 400);
            currentSlide = 1;
        }
        $scope.slideChanged(currentSlide);
    }

    $scope.$on('$ionicView.enter', function() {
        updateBoardInfo();
    });

    $scope.$on('$ionicView.beforeEnter', function() {
        // Scroll to old position in list
        if(local_global != "") {
            $ionicScrollDelegate.$getByHandle(local_global).scrollTo(0, listPos, false);
        }
    });

    $scope.$on('$ionicView.beforeLeave', function() {
        if($scope.loading == true) {
            HttpService.cancel();
        }
        listPos = $ionicScrollDelegate.$getByHandle(local_global).getScrollPosition().top;
    });

    $scope.$on('$ionicView.loaded', function() {
        userInfo = Cache.getInfo('user');
        $scope.boardsLocal = [];
        $scope.boardsGlobal = [];
        tabs = getTabPosition();
        getCurrentSlide();
    });
});

// TODO: Search Menu Controller
controllers.controller('SearchMenuCtrl', function($scope, $log, $ionicHistory, $location, $cordovaGeolocation, $cordovaKeyboard,
                                                  Cache, HttpService, Config) {
    $scope.boards = [];
    $scope.search = {
        board: ""
    };
    $scope.title = "";
    $scope.style = {};
    $scope.loading = false;
    $scope.noMoreBoards = false;
    var local_global = Cache.getInfo('local_global');
    var userInfo = Cache.getInfo('user');
    var offset = 0;
    var search = "";
    
    $scope.goBack = function() {
        $ionicHistory.goBack();
    };
    $scope.goToPictureMenu = function(item) {
        item.index = $scope.boards.indexOf(item);
        item.flag = false;
        item.array = local_global;
        // Send boardInfo into cache
        Cache.setInfo('board', item);
        $location.path('app/PictureMenu');
    };
    $scope.searchBoards = function() {
        if(!$scope.loading) {
            if($cordovaKeyboard.isVisible()) {
                $cordovaKeyboard.close();
            }
            $scope.loading = true;
            search = $scope.search.board;
            offset = 0;
            $cordovaGeolocation.getCurrentPosition(Config.geolocation).then(function (result) {
                var params = {
                    u_id: userInfo.u_id,
                    search: search,
                    longitude: result.coords.longitude,
                    latitude: result.coords.latitude,
                    local_global: local_global,
                    offset: offset
                };
                return HttpService.getSignature(params).then(function (result) {
                    params.signature = result;
                    return HttpService.post('boardSearch', params).then(function (result) {
                        $scope.noMoreBoards = (!result.response.length > 0);
                        $scope.boards = result.response;
                        for(offset; offset < $scope.boards.length; offset++) {
                            $scope.boards[offset].logo = "data:image/jpeg;base64," + $scope.boards[offset].logo;
                        }
                    });
                });
            }).catch(function (error) {
                $log.debug(error);
                $scope.noMoreBoards = true;
            }).then(function() {
                $scope.loading = false;
            });
        }
    };

    $scope.getMoreBoards = function() {
        if(search != "" && !$scope.loading) {
            $cordovaGeolocation.getCurrentPosition(Config.geolocation).then(function (result) {
                var params = {
                    u_id: $scope.userInfo.u_id,
                    search: search,
                    longitude: result.coords.longitude,
                    latitude: result.coords.latitude,
                    local_global: local_global,
                    offset: offset
                };
                return HttpService.getSignature(params).then(function(result) {
                    params.signature = result;
                    return HttpService.post('boardSearch',params).then(function(result) {
                        $scope.noMoreBoards = (result.response.length < 10);
                        $scope.boards = $scope.boards.concat(result.response);
                        for(offset; offset < $scope.boards.length; offset++) {
                            $scope.boards[offset].logo = "data:image/jpeg;base64," + $scope.boards[offset].logo;
                        }
                    });
                });
            }).catch(function (error) {
                $log.debug(error);
                $scope.noMoreBoards = true;
            }).then(function() {
                $scope.$broadcast('scroll.infiniteScrollComplete');
            });
        }
    };
    
    function updateBoardInfo() {
        var info = Cache.getInfo('board');
        if(angular.isDefined(info.index)) {
            if(angular.isDefined($scope.boards[info.index])) {
                $scope.boards[info.index].count = info.count;
            }
        }
        Cache.setInfo('board', {});
    }
    
    $scope.$on('$ionicView.enter', function() {
        updateBoardInfo();
    });

    $scope.$on('$ionicView.loaded', function() {
        if(local_global == 'local') {
            $scope.title = "Search Locally";
        }
        else {
            $scope.title = "Search Globally";
        }
    })
});

// TODO: Picture Menu Controller
controllers.controller('PictureMenuCtrl', function($scope, $log, $ionicHistory, $ionicModal, $location, $interval, $timeout,
                                                   $cordovaToast, $ionicPopup, $window, Cache, DB, HttpService, Draw) {
    $scope.pictureInfo = {};
    $scope.boardInfo = Cache.getInfo('board');
    $scope.loading = false;
    $scope.tapToRefresh = false;
    $scope.noPictures = false;
    $scope.isFlag = false;
    var userInfo = Cache.getInfo('user');
    var picturesViewed = [];
    var pictures = [];
    var loadingPictures = false;
    var offset = 0;
    var index = 0;
    var timerInterval;
    var isVideo = false;
    var time = 0;

    var video = document.getElementById('video');
    var canvas = document.getElementById('canvas');
    var context = canvas.getContext('2d');
    var image = new Image();
    var pixelRatio = $window.devicePixelRatio;
    var dimensions = Cache.getInfo('dimensions');
    var newWidth, newHeight, centerVertical, centerHorizontal, ratio;


    $ionicModal.fromTemplateUrl('view/PictureBoardInfoModal.html', {
        scope: $scope,
        animation: 'slide-in-up'
    }).then(function(modal) {
        $scope.boardInfoModal = modal;
    });
    $scope.closeBoardInfoModal = function() {
        $scope.boardInfoModal.hide().then(function() {
            startTimer();
            playVideo();
        });
    };
    $scope.openBoardInfoModal = function() {
        $scope.boardInfoModal.show().then(function() {
            stopTimer();
            pauseVideo();
        });
    };

    $scope.goBack = function() {
        $ionicHistory.goBack();
    };
    $scope.getBoardInfo = function() {
        $scope.openBoardInfoModal();
    };
    $scope.goToAddPictureMenu = function() {
        $location.path('app/AddPictureMenu');
    };
    
    function pictureLogin() {
        if(!$scope.loading) {
            $scope.loading = true;
            offset = 0;
            var params = {
                u_id: userInfo.u_id,
                b_id: $scope.boardInfo.b_id,
                offset: offset
            };
            HttpService.getSignature(params).then(function (result) {
                params.signature = result;
                return HttpService.post('boardPictures', params).then(function (result) {
                    if(result.response.length > 0) {
                        pictures = result.response;
                        $scope.nextPicture();
                        startTimer();
                    }
                    else if($scope.boardInfo.repeat_view == true) {
                        $scope.tapToRefresh = true;
                    }
                    else {
                        $scope.noPictures = true;
                    }
                });
            }).catch(function (error) {
                $log.debug(error);
                $scope.noPictures = true;
            }).then(function () {
                $scope.loading = false;
            });
        }
    }
    function getMorePictures() {
        loadingPictures = true;
        var params = {
            u_id: userInfo.u_id,
            b_id: $scope.boardInfo.b_id,
            offset: offset
        };
        HttpService.getSignature(params).then(function (result) {
            params.signature = result;
            return HttpService.post('boardPictures', params).then(function (result) {
                pictures = pictures.concat(result.response);
                if($scope.loading) {
                    $scope.loading = false;
                    $scope.nextPicture();
                    startTimer();
                }
            });
        }).catch(function (error) {
            $log.debug(error);
            $scope.loading = false;
        }).then(function () {
            loadingPictures = false;
        });
    }

    $scope.refreshBoard = function() {
        if($scope.boardInfo.repeat_view) {
            $scope.loading = true;
            $scope.tapToRefresh = false;
            var params = {
                u_id: userInfo.u_id,
                b_id: $scope.boardInfo.b_id
            };
            HttpService.getSignature(params).then(function(result) {
                params.signature = result;
                return HttpService.post('refreshBoard',params).then(function() {
                    $scope.loading = false;
                    pictureLogin();
                });
            }).catch(function(error) {
                $log.debug(error);
                $scope.loading = false;
            });
        }
    };

    $scope.nextPicture = function() {
        if(isVideo) {
            video.pause();
        }
        if(index < pictures.length) {
            $scope.pictureInfo = pictures[index];
            if($scope.pictureInfo.type == 'video') {
                drawToVideo($scope.pictureInfo.pic_src);
            }
            else {
                drawToCanvas($scope.pictureInfo.pic_src);
            }
            time = $scope.pictureInfo.duration;
            picturesViewed.push(pictures[index].p_id);
            pictures[index] = {};
            if(index == pictures.length - 5) {
                offset = index + 5;
                getMorePictures();
            }
            index++;
            $scope.isFlag = true;
        }
        else if(loadingPictures) {
            $scope.loading = true;
            $scope.isFlag = false;
            $scope.pictureInfo = {};
            $scope.stopTimer();
            clearCanvas();
        }
        else {
            resetVariables();
            stopTimer();
            sendPicturesViewed();
            clearCanvas();
            if($scope.boardInfo.repeat_view) {
                $scope.tapToRefresh = true;
            }
            else {
                $scope.noPictures = true;
            }
        }
    };

    function sendPicturesViewed() {
        if(picturesViewed.length > 0) {
            var params = {
                u_id: userInfo.u_id,
                p_id: picturesViewed
            };
            HttpService.getSignature(params).then(function(result) {
                params.signature = result;
                return HttpService.post('viewedPictures', params).then(function() {
                    picturesViewed = [];
                });
            }).catch(function(error) {
                $log.debug(error);
                picturesViewed = [];
            });
        }
    }

    ////////////////////////// Favorite Board ////////////////////////
    $scope.addToFavorites = function() {
        var params = {
            u_id: userInfo.u_id,
            b_id: [$scope.boardInfo.b_id]
        };
        if(!$scope.boardInfo.favorite) {
            $scope.boardInfo.favorite = true;
            HttpService.getSignature(params).then(function(result) {
                params.signature = result;
                return HttpService.post('addToFavorites', params).then(function() {
                    $cordovaToast.showShortCenter("Added to Favorites");
                });
            }).catch(function(error) {
                $log.debug(error);
                $cordovaToast.showShortCenter("Error Adding to Favorites");
            });
        }
        else {
            $scope.boardInfo.favorite = false;
            HttpService.getSignature(params).then(function(result) {
                params.signature = result;
                return HttpService.post('removeFromFavorites', params).then(function () {
                    $cordovaToast.showShortCenter("Removed From Favorites");
                });
            }).catch(function(error) {
                $log.debug(error);
                $cordovaToast.showShortCenter("Error Removing From Favorites");
            });
        }
    };

    ////////////////////////// Report Picture ////////////////////////

    $scope.reportPopup = function() {
        pauseVideo();
        $ionicPopup.show({
            title: 'Report Picture',
            template: '<div class="text-color text-size-regular text-center-horizontal">Are you sure you want to report this picture and user?</div>',
            buttons: [{
                text: 'Cancel',
                type: 'button-block button-outline button-light text-color',
                onTap: function() {
                    startTimer();
                }
            }, {
                text: 'Report',
                type: 'button-block button-dark',
                onTap: function() {
                    reportPicture();
                }
            }]
        });
    };

    function reportPicture() {
        var params = {
            u_id: userInfo.u_id,
            p_id: $scope.pictureInfo.p_id
        };
        HttpService.getSignature(params).then(function(result) {
            params.signature = result;
            return HttpService.post('reportPicture',params).then(function() {
                startTimer();
                $cordovaToast.showShortCenter("Content Reported");
            });
        }).catch(function(error) {
            $log.debug(error);
            $cordovaToast.showShortCenter("Error Reporting Picture and User");
        });
    }
    
    /////////////////// Timer Functions ///////////////////
    function startTimer() {
        if(angular.isUndefined(timerInterval)) {
            $scope.currentTime = time;
            timerInterval = $interval(function() {
                time--;
                if(time == 0) {
                    $scope.nextPicture();
                }
                $scope.currentTime = time;
            },1000)
        }
    }
    function stopTimer() {
        if(angular.isDefined(timerInterval)) {
            $interval.cancel(timerInterval);
            timerInterval = undefined;
            $scope.currentTime = 0;
        }
    }

    /////////////////// Canvas Functions ////////////////////
    // Draw Pictures
    function drawToCanvas(pic_src) {
        isVideo = false;
        image.onload = function() {
            if(image.width > image.height) {
                Draw.horizontalPicture(context, canvas, image)
            }
            else {
                Draw.verticalPicture(context, canvas, image);
            }
        };
        image.src = "data:image/jpeg;base64," + pic_src;
    }
    // Draw Videos
    function drawToVideo(src) {
        video.src = "data:video/mp4;base64," + src;
        isVideo = true;
        video.onloadeddata = function() {
            video.play();
            if(video.videoWidth > video.videoHeight) {
                drawHorizontalVideo();
            }
            else {
                drawVerticalVideo();
            }
        };
        video.load();
    }

    function drawHorizontalVideo() {
        if (!video.paused && !video.ended) {
            ratio = video.videoHeight / video.videoWidth;
            if (ratio > 1) {
                ratio = video.videoWidth / video.videoHeight;
            }
            newWidth = dimensions.height * ratio;
            newHeight = dimensions.width / ratio;
            centerVertical = (dimensions.height - newHeight) / 2;
            centerHorizontal = (dimensions.width - newWidth) / 2;
            context.clearRect(0, 0, canvas.width, canvas.height);
            context.save();
            context.translate(dimensions.width, 0);
            context.rotate(90 * Math.PI / 180);
            if (newHeight <= dimensions.height - 15) {
                context.drawImage(video, 0, centerHorizontal, dimensions.height + 15, newWidth);
            }
            else if (newHeight >= dimensions.height + 15) {
                context.drawImage(video, centerVertical, 0, newHeight, dimensions.width);
            }
            else {
                context.drawImage(video, 0, 0, dimensions.height, dimensions.width + 15);
            }
            context.restore();
            if (video.videoHeight > video.videoWidth) {
                $timeout(drawVerticalVideo, 35);
            }
            else {
                $timeout(drawHorizontalVideo, 35);
            }
        }
    }

    function drawVerticalVideo() {
        if (!video.paused && !video.ended) {
            ratio = video.videoWidth / video.videoHeight;
            if (ratio > 1) {
                ratio = video.videoHeight / video.videoWidth;
            }
            newWidth = dimensions.height * ratio;
            newHeight = dimensions.width / ratio;
            centerVertical = (dimensions.height - newHeight) / 2;
            centerHorizontal = (dimensions.width - newWidth) / 2;
            context.clearRect(0, 0, canvas.width, canvas.height);
            context.save();
            if (newHeight <= dimensions.height - 15) {
                context.drawImage(video, centerHorizontal, 0, newWidth, dimensions.height);
            }
            else if (newHeight >= dimensions.height + 15) {
                context.drawImage(video, 0, centerVertical, dimensions.width, newHeight);
            }
            else {
                context.drawImage(video, 0, 0, dimensions.width, dimensions.height);
            }
            context.restore();
            if (video.videoWidth > video.videoHeight) {
                $timeout(drawHorizontalVideo, 35);
            }
            else {
                $timeout(drawVerticalVideo, 35);
            }
        }
    }

    // Picture / Video Controls
    function clearCanvas() {
        if(isVideo) {
            cancelVideo()
        }
        context.clearRect(0, 0, canvas.width, canvas.height);
        context.save();
        context.setTransform(pixelRatio,0,0,pixelRatio,0,0);
        context.restore();
    }
    function cancelVideo() {
        video.pause();
        video.src = "";
        video.load();
        isVideo = false;
    }
    function pauseVideo() {
        if(isVideo && !video.paused) {
            video.pause();
        }
    }
    function playVideo() {
        if(isVideo && video.paused) {
            video.play();
            if(video.videoWidth > video.videoHeight) {
                drawHorizontalVideo();
            }
            else {
                drawVerticalVideo();
            }
        }
    }

    function resetVariables() {
        index = 0;
        offset = 0;
        pictures = [];
        $scope.pictureInfo = {};
        $scope.tapToRefresh = false;
        $scope.noPictures = false;
        $scope.isFlag = false;
    }

    $scope.$on('$ionicView.enter', function() {
        picturesViewed = [];
        canvas.width = dimensions.width * pixelRatio;
        canvas.height = dimensions.height * pixelRatio;
        canvas.style.width = dimensions.width + "px";
        canvas.style.height = dimensions.height  + "px";
        context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
        resetVariables();
        pictureLogin();
    });
    $scope.$on('$ionicView.beforeLeave', function() {
        if(!$scope.loading) {
            stopTimer();
        }
        else {
            HttpService.cancel();
        }
        clearCanvas();
        sendPicturesViewed();
    });

    $scope.$on('$destroy', function() {
        $scope.boardInfoModal.remove();
    });
});


// TODO: Add Picture Menu Controller
controllers.controller('AddPictureMenuCtrl', function ($scope, $log, $ionicHistory, $window, $timeout, $ionicPopup, $cordovaGeolocation,
                                                       $cordovaToast, $cordovaCamera, $cordovaCapture, Cache, HttpService, Draw,
                                                       videoEditor, Config) {
    $scope.pictureInfo = {
        text: "",
        duration: 8
    };
    $scope.loading = false;
    $scope.pictureTaken = false;
    $scope.videoTaken = false;
    $scope.timer = false;
    $scope.boardInfo = Cache.getInfo('board');
    var userInfo = Cache.getInfo('user');

    var dimensions = Cache.getInfo('dimensions');
    var canvas = document.getElementById('addCanvas');
    var context = canvas.getContext('2d');
    var newCanvas = document.getElementById('canvas');
    var newContext = newCanvas.getContext('2d');
    var video = document.getElementById('addVideo');
    var pixelRatio = $window.devicePixelRatio;
    var newWidth, newHeight, centerVertical, centerHorizontal, ratio;
    var image = new Image();
    var comment = false;
    var draggable = true;
    var orientationVertical = true;
    var position = {
        x: 0,
        y: 0
    };
    $scope.draggedStyle = {
        "-webkit-transform": "translate(" + 0 + "px, " + -50 + "px)"
    };

    $scope.goBack = function () {
        if ($scope.pictureTaken == false && $scope.videoTaken == false) {
            $ionicHistory.goBack();
        }
        else if ($scope.videoTaken) {
            $scope.cancelVideo();
        }
        else {
            $scope.cancelPicture();
        }
    };

    $scope.picture = function () {
        // drawToCanvas("https://s-media-cache-ak0.pinimg.com/736x/b2/4f/98/b24f983fd3531272868e1a48bcf7a91a.jpg");
        $cordovaCamera.getPicture(Config.cameraOptions).then(function (result) {
            drawToCanvas(result);
        });
    };
    $scope.gallery = function () {
        $cordovaCamera.getPicture(Config.galleryOptions).then(function (result) {
            drawToCanvas(result);
        });
    };
    $scope.video = function () {
        $cordovaCapture.captureVideo(Config.videoOptions).then(function (result) {
            /*VideoEditor.getVideoInfo(function(result) {
                console.log(result);
            }, function(error) {}, {fileUri: result[0].fullPath});*/
            drawToVideo(result[0].fullPath);
        });
    };
    ///////////////////////////////// Register Pictures and Videos //////////////////////
    $scope.registerPicture = function () {
        if ($scope.loading == false) {
            $scope.loading = true;
            hidePicture();
            $cordovaGeolocation.getCurrentPosition(Config.geolocation).then(function (result) {
                portraitTextBox();
                var base64 = base64FromCanvas();
                var params = {
                    u_id: userInfo.u_id,
                    b_id: $scope.boardInfo.b_id,
                    longitude: result.coords.longitude,
                    latitude: result.coords.latitude,
                    duration: Number($scope.pictureInfo.duration),
                    pic_src: base64,
                    type: "picture"
                };
                return HttpService.getSignature(params).then(function (result) {
                    params.signature = result;
                    return HttpService.post('addPicture', params).then(function (result) {
                        if (result.success == true) {
                            $cordovaToast.showShortCenter("Picture Sent For Review");
                        }
                        else {
                            $cordovaToast.showShortCenter("You Are Banned or Out of Range");
                        }
                    });
                });
            }).catch(function (error) {
                $log.debug(error);
                $cordovaToast.showShortCenter("Error Sending Picture");
            }).then(function () {
                $scope.loading = false;
                clearCanvas();
            });
        }
    };

    $scope.registerVideo = function () {
        if ($scope.loading == false) {
            hideVideo();
            $scope.loading = true;
            $cordovaGeolocation.getCurrentPosition(Config.geolocation).then(function (result) {
                var params = {
                    u_id: userInfo.u_id,
                    b_id: $scope.boardInfo.b_id,
                    longitude: result.coords.longitude,
                    latitude: result.coords.latitude,
                    duration: Math.ceil(video.duration)
                };
                return videoEditor.transcode({
                    width: video.videoWidth,
                    height: video.videoHeight,
                    src: video.src
                }).then(function (result) {
                    params.pic_src = result;
                    params.type = "video";
                    return HttpService.getSignature(params).then(function (result) {
                        params.signature = result;
                        return HttpService.post('addPicture', params).then(function (result) {
                            if (result.success == true) {
                                $cordovaToast.showShortCenter("Video Sent For Review");
                            }
                            else {
                                $cordovaToast.showShortCenter("You Are Banned or Out of Range");
                            }
                        });
                    });
                });
            }).catch(function (error) {
                $log.debug(error);
                $cordovaToast.showShortCenter("Error Sending Video");
            }).then(function () {
                video.src = "";
                video.load();
                $scope.loading = false;
            });
        }
    };

    ///////////////////////////// Canvas Draw Functions ////////////////////////////
    function drawToCanvas(src) {
        $scope.pictureTaken = true;
        $scope.title = "";
        image.onload = function () {
            if (image.width > image.height) {
                orientationVertical = false;
                Draw.horizontalPicture(context, canvas, image);
            }
            else {
                orientationVertical = true;
                Draw.verticalPicture(context, canvas, image);
            }
        };
        image.src = "data:image/jpeg;base64," + src;
        /*image.setAttribute('crossOrigin', 'anonymous');
         image.src = src;*/
    }

    function drawToVideo(src) {
        video.src = src;
        video.onloadeddata = function () {
            video.play();
            if (video.videoWidth > video.videoHeight) {
                drawHorizontalVideo();
            }
            else {
                drawVerticalVideo();
            }
        };
        video.load();
        $scope.videoTaken = true;
        $scope.title = "";
    }

    function drawHorizontalVideo() {
        if (!video.paused && !video.ended) {
            ratio = video.videoHeight / video.videoWidth;
            if (ratio > 1) {
                ratio = video.videoWidth / video.videoHeight;
            }
            newWidth = dimensions.height * ratio;
            newHeight = dimensions.width / ratio;
            centerVertical = (dimensions.height - newHeight) / 2;
            centerHorizontal = (dimensions.width - newWidth) / 2;
            context.clearRect(0, 0, canvas.width, canvas.height);
            context.save();
            context.translate(dimensions.width, 0);
            context.rotate(90 * Math.PI / 180);
            if (newHeight <= dimensions.height - 15) {
                context.drawImage(video, 0, centerHorizontal, dimensions.height, newWidth);
            }
            else if (newHeight >= dimensions.height + 15) {
                context.drawImage(video, centerVertical, 0, newHeight, dimensions.width);
            }
            else {
                context.drawImage(video, 0, 0, dimensions.height, dimensions.width + 15);
            }
            context.restore();
            if (video.videoHeight > video.videoWidth) {
                $timeout(drawVerticalVideo, 35);
            }
            else {
                $timeout(drawHorizontalVideo, 35);
            }
        }
    }

    function drawVerticalVideo() {
        if (!video.paused && !video.ended) {
            ratio = video.videoWidth / video.videoHeight;
            if (ratio > 1) {
                ratio = video.videoHeight / video.videoWidth;
            }
            newWidth = dimensions.height * ratio;
            newHeight = dimensions.width / ratio;
            centerVertical = (dimensions.height - newHeight) / 2;
            centerHorizontal = (dimensions.width - newWidth) / 2;
            context.clearRect(0, 0, canvas.width, canvas.height);
            context.save();
            if (newHeight <= dimensions.height - 15) {
                context.drawImage(video, centerHorizontal, 0, newWidth, dimensions.height);
            }
            else if (newHeight >= dimensions.height + 15) {
                context.drawImage(video, 0, centerVertical, dimensions.width, newHeight);
            }
            else {
                context.drawImage(video, 0, 0, dimensions.width, dimensions.height);
            }
            context.restore();
            if (video.videoWidth > video.videoHeight) {
                $timeout(drawHorizontalVideo, 35);
            }
            else {
                $timeout(drawVerticalVideo, 35);
            }
        }
    }

    //////////////////////////////////// Canvas Options and Playback  ///////////////////////
    $scope.setTimer = function () {
        $ionicPopup.show({
            templateUrl: "view/TimePopupMenu.html",
            scope: $scope,
            title: '<div class="text-color">Picture Duration</div>',
            buttons: [{
                text: 'Set',
                type: 'button-block button-dark'
            }]
        });
    };

    $scope.addComment = function () {
        if ($scope.pictureTaken) {
            if (comment == false) {
                comment = true;
                position.y = dimensions.height / 2;
                $scope.draggedStyle = {
                    "-webkit-transform": "translate(" + 0 + "px, " + dimensions.height / 2 + "px)"
                };
            }
            else if (comment == true && $scope.pictureInfo.text == "") {
                comment = false;
                position.y = 0;
                $scope.draggedStyle = {
                    "-webkit-transform": "translate(" + 0 + "px, " + -50 + "px)"
                };
            }
        }
    };

    $scope.setDraggable = function (bool) {
        draggable = bool;
        if (draggable == false) {
            $scope.draggedStyle = {
                "-webkit-transform": "translate(" + 0 + "px, " + dimensions.height / 3 + "px)"
            };
        }
        else if (draggable == true && $scope.pictureInfo.text != "") {
            $scope.draggedStyle = {
                "-webkit-transform": "translate(" + position.x + "px, " + position.y + "px)"
            };
        }
    };

    $scope.onDrag = function (event) {
        if (draggable == true && orientationVertical == true) {
            if (event.gesture.center.pageY > 25 && event.gesture.center.pageY < window.innerHeight - 65) {
                position.y = event.gesture.center.pageY;
                $scope.draggedStyle = {
                    "-webkit-transform": "translate(" + position.x + "px, " + position.y + "px)"
                };
            }
        }
        else if (draggable == true && orientationVertical == false) {
            if (event.gesture.center.pageY > 25 && event.gesture.center.pageY < window.innerHeight - 65) {
                position.y = event.gesture.center.pageY;
                $scope.draggedStyle = {
                    "-webkit-transform": "translate(" + position.x + "px, " + position.y + "px)"
                };
            }
        }
    };

    $scope.cancelPicture = function () {
        if (comment == true) {
            $scope.draggedStyle = {
                "-webkit-transform": "translate(" + 0 + "px, " + -50 + "px)"
            };
        }
        clearCanvas();
        $scope.title = "Add Picture";
        $scope.pictureTaken = false;
    };
    $scope.cancelVideo = function () {
        video.pause();
        $window.resolveLocalFileSystemURL(video.src, function (result) {
            result.remove();
            video.src = "";
        }, function (error) {
            $log.debug(error);
            video.src = "";
        });
        clearCanvas();
        $scope.title = "Add Picture";
        $scope.videoTaken = false;
    };

    /////////////////////////////// Canvas and Video Handling ////////////////////////
    function hidePicture() {
        if (comment == true) {
            $scope.draggedStyle = {
                "-webkit-transform": "translate(" + 0 + "px, " + -50 + "px)"
            };
        }
        $scope.title = "Add Picture";
        $scope.pictureTaken = false;
    }

    function hideVideo() {
        video.pause();
        $scope.title = "Add Picture";
        $scope.videoTaken = false;
    }

    function clearCanvas() {
        position.y = 0;
        $scope.pictureInfo.text = "";
        context.clearRect(0, 0, canvas.width, canvas.height);
        context.save();
        context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
        context.restore();
    }

    function portraitTextBox() {
        if ($scope.pictureInfo.text != "") {
            var yPos = position.y;
            var xPos = 0;
            var width = dimensions.width;
            var height = 34;
            var text = $scope.pictureInfo.text;
            var fillStyle = "rgba(0,0,0,0.5)";
            context.save();
            context.beginPath();
            context.rect(xPos, yPos, width, height);
            context.fillStyle = fillStyle;
            context.fill();
            context.font = '14pt sans-serif';
            context.textAlign = 'center';
            context.fillStyle = 'white';
            context.textBaseline = 'middle';
            context.fillText(text, (width / 2), yPos + (height / 2));
            context.restore();
            $scope.draggedStyle = {
                "-webkit-transform": "translate(" + 0 + "px, " + -50 + "px)"
            };
        }
    }

    function base64FromCanvas() {
        // draw cropped image
        newCanvas.width = 576;
        newCanvas.height = 1024;
        newCanvas.style.width = dimensions.width + "px";
        newCanvas.style.height = dimensions.height + "px";
        var sourceX = 0;
        var sourceY = 0;
        var sourceWidth = canvas.width;
        var sourceHeight = canvas.height;
        var destWidth = newCanvas.width;
        var destHeight = newCanvas.height;
        var destX = 0;
        var destY = 0;
        newContext.drawImage(canvas, sourceX, sourceY, sourceWidth, sourceHeight, destX, destY, destWidth, destHeight);
        var data = newCanvas.toDataURL("image/jpeg", 0.8);
        context.clearRect(0, 0, newCanvas.width, newCanvas.height);
        context.save();
        context.restore();
        return data.replace(/data:image\/jpeg;base64,/gi, "");
    }

    ///////////////////// Ionic View Enter and Leave Functions /////////////////////
    $scope.$on('$ionicView.enter', function () {
        canvas.width = dimensions.width * pixelRatio;
        canvas.height = dimensions.height * pixelRatio;
        canvas.style.width = dimensions.width + "px";
        canvas.style.height = dimensions.height + "px";
        context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
        context.save();
    });

    $scope.$on('$ionicView.beforeLeave', function () {
        if ($scope.loading == true) {
            HttpService.cancel();
        }
        if ($scope.videoTaken) {
            $scope.cancelVideo();
        }
    });
});

// TODO: Add Board Menu Controller
controllers.controller('AddBoardMenuCtrl', function ($log, $scope, $ionicHistory, $timeout, $ionicModal, $cordovaCamera, $cordovaToast, DB,
                                                     $cordovaGeolocation, $ionicLoading, Cache, base64Images, Config, HttpService) {
    $scope.boardInfo = {
        b_name: "",
        about: "",
        pic_expire: 7,
        repeat_view: true,
        nsfw: false,
        view_range: Cache.getInfo('local_global'),
        post_range: Cache.getInfo('local_global'),
        min_age: 1,
        max_age: 100,
        email: "",
        logo: ""
    };
    $scope.image = "data:image/jpeg;base64," + base64Images.arrowGrey();
    $scope.toggle = {
        view_range: ($scope.boardInfo.view_range == 'local'),
        post_range: ($scope.boardInfo.post_range == 'local'),
        nsfw: $scope.boardInfo.nsfw
    };
    $scope.loading = false;
    var userInfo = Cache.getInfo('user');

    $scope.goBack = function () {
        $ionicHistory.goBack();
    };

    $scope.boardRegister = function () {
        if (!$scope.loading && checkBoardInfo()) {
            $scope.loading = true;
            $ionicLoading.show();
            $cordovaGeolocation.getCurrentPosition(Config.geolocation).then(function (result) {
                var params = {
                    u_id: userInfo.u_id,
                    b_name: $scope.boardInfo.b_name,
                    logo: $scope.image.replace(/data:image\/jpeg;base64,/gi, ""),
                    about: $scope.boardInfo.about,
                    repeat_view: $scope.boardInfo.repeat_view,
                    min_age: Number($scope.boardInfo.min_age),
                    max_age: Number($scope.boardInfo.max_age),
                    pic_expire: Number($scope.boardInfo.pic_expire),
                    longitude: result.coords.longitude,
                    latitude: result.coords.latitude,
                    view_range: $scope.boardInfo.view_range,
                    post_range: $scope.boardInfo.post_range,
                    email: $scope.boardInfo.email,
                    nsfw: $scope.boardInfo.nsfw
                };
                return HttpService.getSignature(params).then(function (result) {
                    params.signature = result;
                    return HttpService.post('newBoard', params).then(function (result) {
                        if (result.success == true) {
                            $scope.goBack();
                        }
                        else {
                            $log.debug("Board Already Exists");
                            $cordovaToast.showShortCenter("Board Already Exists");
                        }
                    });
                });
            }).catch(function (error) {
                $log.debug(error);
                $cordovaToast.showShortCenter("Error Creating Board");
            }).then(function () {
                $scope.loading = false;
                $ionicLoading.hide();
            });
        }
    };

    $scope.addLogo = function () {
        $cordovaCamera.getPicture(Config.gallerySmallOptions).then(function (result) {
            $scope.image = "data:image/jpeg;base64," + result;
        });
    };


    ///////////////// Board Options Toggle ///////////////
    $scope.checkAgeRange = function () {
        if ($scope.boardInfo.nsfw == true && $scope.boardInfo.min_age < 18) {
            $scope.boardInfo.min_age = 18;
        }
    };

    $scope.changeViewRange = function () {
        if ($scope.toggle.view_range == false) {
            $scope.boardInfo.view_range = "global";
        }
        else {
            $scope.boardInfo.view_range = "local";
        }
    };

    $scope.changePostRange = function () {
        if ($scope.toggle.post_range == false) {
            $scope.boardInfo.post_range = "global";
        }
        else {
            $scope.boardInfo.post_range = "local";
        }
    };

    function checkBoardInfo() {
        if ($scope.boardInfo.b_name == "" && $scope.boardInfo.about == "") {
            $cordovaToast.showShortCenter("Please Enter a Title and Description");
        }
        else if ($scope.boardInfo.b_name == "") {
            $cordovaToast.showShortCenter("Please Enter a Title");
        }
        else if ($scope.boardInfo.about == "") {
            $cordovaToast.showShortCenter("Please Enter a Description");
        }
        else if ($scope.boardInfo.min_age < 1 && $scope.boardInfo.max_age > 100) {
            $cordovaToast.showShortCenter("Age Range Must Be Between 1 and 100");
        }
        else {
            return true;
        }
        return false;
    }
});


// TODO: Settings Menu Controller
controllers.controller('SettingsMenuCtrl', function ($log, $scope, $ionicHistory, $location, $cordovaToast, $ionicLoading, HttpService,
                                                     signService, Cache, DB) {
    $scope.userInfo = Cache.getInfo('user');
    $scope.updatePassword = {};
    $scope.newPassword = false;
    $scope.loading = false;

    $scope.goBack = function () {
        if ($scope.newPassword) {
            $scope.newPassword = false;
        }
        else {
            $ionicHistory.goBack();
        }
    };

    $scope.userUpdate = function () {
        if (checkInfo() && !$scope.loading) {
            $scope.loading = true;
            $ionicLoading.show();
            var params = {
                u_id: $scope.userInfo.u_id,
                username: $scope.userInfo.username,
                email: $scope.userInfo.email,
                distance: $scope.userInfo.distance,
                nsfw: $scope.userInfo.nsfw,
                notification: $scope.userInfo.notification
            };
            HttpService.getSignature(params).then(function (result) {
                params.signature = result;
                return HttpService.post('updateUser', params).then(function (result) {
                    if (result.success == true) {
                        $scope.userInfo = result.response;
                        DB.update('user', $scope.userInfo).then(function () {
                            Cache.setInfo('user', $scope.userInfo);
                            $log.debug("Successfully Updated User");
                            $cordovaToast.showShortCenter("User Updated Successfully");
                        });
                    }
                    else {
                        $log.debug("Invalid Username/email");
                        $cordovaToast.showShortCenter("Username and/or Email Is Taken");
                    }
                });
            }).catch(function (error) {
                $log.debug(error);
                $log.debug("Error updating user");
                $cordovaToast.showShortCenter("Error Updating User");
            }).then(function () {
                $scope.userInfo = Cache.getInfo('user');
                $scope.loading = false;
                $ionicLoading.hide();
            });
        }
    };

    $scope.changePassword = function () {
        if (checkPassword() && !$scope.loading) {
            $scope.loading = true;
            $ionicLoading.show();
            var oldKey = Cache.getInfo('key');
            signService.createKeyPair($scope.updatePassword.password).then(function () {
                return signService.getKeyPair().then(function (result) {
                    if (result) {
                        var params = {
                            u_id: $scope.userInfo.u_id,
                            new_pub_key: result.pub_key
                        };
                        return HttpService.getSignature(params).then(function (result) {
                            params.new_signature = result;
                            return signService.signParamsWithKey(params, oldKey).then(function (result) {
                                params.signature = result;
                                return HttpService.post('newPassword', params).then(function (result) {
                                    if (result.success == true) {
                                        $scope.userInfo = result.response;
                                        $log.debug("Password Changed");
                                        return DB.update("user", $scope.userInfo).then(function () {
                                            $cordovaToast.showShortCenter("Password Changed");
                                            Cache.setInfo('user', $scope.userInfo);
                                            $scope.goBack();
                                        });
                                    }
                                    else {
                                        throw new Error("Error Updating Password");
                                    }
                                });
                            });
                        });
                    }
                    else {
                        throw new Error("Error Updating Password");
                    }
                });
            }).catch(function (error) {
                $log.debug("Update failed, logging out", error);
                $cordovaToast.showShortCenter("Update Failed. Logging Out");
                $scope.logoutUser();
            }).then(function () {
                $scope.newPassword = false;
                $scope.loading = false;
                $ionicLoading.hide();
            });
        }
    };

    $scope.setNewPassword = function () {
        $scope.newPassword = true;
    };

    function checkInfo() {
        if ($scope.userInfo.nsfw == true && $scope.userInfo.age < 18) {
            $cordovaToast.showShortCenter("You Are Not Of Age");
        }
        else if ($scope.userInfo.username == "" && $scope.userInfo.email == "") {
            $cordovaToast.showShortCenter("Please Provide Your Username and Email");
        }
        else if ($scope.userInfo.username == "") {
            $cordovaToast.showShortCenter("No Username Specified");
        }
        else if (!($scope.userInfo.username.indexOf(' ') === -1)) {
            $cordovaToast.showLongCenter("No Spaces Allowed in Username");
        }
        else if ($scope.userInfo.email == "") {
            $cordovaToast.showShortCenter("No Email Specified");
        }
        else {
            return true;
        }
        return false;
    }

    function checkPassword() {
        if ($scope.updatePassword.password == "" && $scope.updatePassword.verifyPass == "") {
            $cordovaToast.showShortCenter("Please Provide A Password");
        }
        else if ($scope.updatePassword.password == "") {
            $cordovaToast.showShortCenter("No Password Specified");
        }
        else if ($scope.updatePassword.verifyPass == "") {
            $cordovaToast.showShortCenter("Please Verify Password");
        }
        else if ($scope.updatePassword.password != $scope.updatePassword.verifyPass) {
            $cordovaToast.showShortCenter("Passwords Do Not Match");
        }
        else {
            return true;
        }
        return false;
    }
});

// TODO: Board Select Moderator Controller
controllers.controller('BoardSelectModeratorCtrl', function ($log, $scope, $location, $ionicHistory, $cordovaToast, Cache, HttpService) {
    $scope.boards = [];
    $scope.noMoreBoards = false;
    $scope.emptyBoards = true;
    $scope.loading = false;
    var userInfo = Cache.getInfo('user');
    var boardInfo = {};
    var offset = 0;

    $scope.boardLogin = function () {
        if (!$scope.loading) {
            $scope.loading = true;
            offset = 0;
            var params = {
                u_id: userInfo.u_id,
                offset: offset
            };
            HttpService.getSignature(params).then(function (result) {
                params.signature = result;
                return HttpService.post('myAdminBoards', params).then(function (result) {
                    if (result.success == true) {
                        $scope.emptyBoards = (result.response.length == 0);
                        $scope.noMoreBoards = (result.response.length < 10);
                        $scope.boards = result.response;
                        offset = $scope.boards.length;
                    }
                    else {
                        throw new Error("Unable to get moderator boards");
                    }
                });
            }).catch(function (error) {
                $log.debug(error);
                $scope.noMoreBoards = true;
                $scope.emptyBoards = true;
            }).then(function (result) {
                $scope.loading = false;
            });
        }
    };

    $scope.getMoreBoards = function () {
        if (!$scope.loading) {
            var params = {
                u_id: userInfo.u_id,
                offset: offset
            };
            HttpService.getSignature(params).then(function (result) {
                params.signature = result;
                return HttpService.post('myAdminBoards', params).then(function (result) {
                    if (result.success == true) {
                        $scope.noMoreBoards = (result.response.length < 10);
                        $scope.boards = $scope.boards.concat(result.response);
                        offset = $scope.boards.length;
                    }
                    else {
                        throw new Error("Unable to get more boards");
                    }
                });
            }).catch(function (error) {
                $log.debug(error);
                $scope.noMoreBoards = true;
            }).then(function (result) {
                $scope.$broadcast('scroll.infiniteScrollComplete');
            });
        }
    };

    $scope.boardSelect = function (item) {
        boardInfo = item;
        boardInfo.u_id = userInfo.u_id;
        boardInfo.count = parseInt(item.count);
        boardInfo.activeCount = parseInt(item.activeCount);
        $scope.title = item.b_name;
        boardInfo.flag = false;
        Cache.setInfo('board', boardInfo);
        $location.path('app/ModeratorOptionMenu');
    };

    $scope.$on('$ionicView.enter', function () {
        Cache.setInfo('board', {});
        $scope.boardLogin();
    });

    $scope.$on('$ionicView.beforeLeave', function () {
        if ($scope.loading == true) {
            HttpService.cancel();
        }
    });
});

// TODO: Boards Select User Controller
controllers.controller('BoardSelectUserCtrl', function ($log, $scope, $location, $ionicHistory, $cordovaToast, Cache, HttpService) {
    $scope.boards = [];
    $scope.noMoreBoards = false;
    $scope.emptyBoards = true;
    $scope.loading = false;
    var userInfo = Cache.getInfo('user');
    var boardInfo = {};
    var offset = 0;

    $scope.boardLogin = function () {
        if (!$scope.loading) {
            $scope.loading = true;
            offset = 0;
            var params = {
                u_id: userInfo.u_id,
                offset: offset
            };
            HttpService.getSignature(params).then(function (result) {
                params.signature = result;
                return HttpService.post('boardsPostedTo', params).then(function (result) {
                    if (result.success == true) {
                        $scope.emptyBoards = (result.response.length == 0);
                        $scope.noMoreBoards = (result.response.length < 10);
                        $scope.boards = result.response;
                        offset = $scope.boards.length;
                        for (var i = 0; i < $scope.boards.length; i++) {
                            if ($scope.boards[i].approved == true) {
                                $scope.boards[i].approved = "Active";
                            }
                            else if ($scope.boards[i].approved == false) {
                                $scope.boards[i].approved = "Waiting";
                            }
                        }
                    }
                    else {
                        throw new Error("Unable to get moderator boards");
                    }
                });
            }).catch(function (error) {
                $log.debug(error);
                $scope.noMoreBoards = true;
                $scope.emptyBoards = true;
            }).then(function (result) {
                $scope.loading = false;
            });
        }
    };

    $scope.getMoreBoards = function () {
        if (!$scope.loading) {
            var params = {
                u_id: userInfo.u_id,
                offset: offset
            };
            HttpService.getSignature(params).then(function (result) {
                params.signature = result;
                return HttpService.post('boardsPostedTo', params).then(function (result) {
                    if (result.success == true) {
                        $scope.noMoreBoards = (result.response.length < 10);
                        var oldLength = $scope.boards.length;
                        $scope.boards = $scope.boards.concat(result.response);
                        offset = $scope.boards.length;
                        for (var i = oldLength; i < $scope.boards.length; i++) {
                            if ($scope.boards[i].approved == true) {
                                $scope.boards[i].approved = "Active";
                            }
                            else if ($scope.boards[i].approved == false) {
                                $scope.boards[i].approved = "Waiting";
                            }
                        }
                    }
                });
            }).catch(function (error) {
                $log.debug(error);
                $scope.noMoreBoards = true;
            }).then(function () {
                $scope.$broadcast('scroll.infiniteScrollComplete');
            });
        }
    };

    $scope.boardSelect = function (item) {
        boardInfo = item;
        boardInfo.u_id = userInfo.u_id;
        boardInfo.count = parseInt(item.count);
        boardInfo.activeCount = parseInt(item.activeCount);
        $scope.title = item.b_name;
        boardInfo.flag = false;
        Cache.setInfo('board', boardInfo);
        $location.path('app/UserMenu');
    };

    $scope.$on('$ionicView.enter', function () {
        Cache.setInfo('board', {});
        $scope.boardLogin();
    });

    $scope.$on('$ionicView.beforeLeave', function () {
        if ($scope.loading == true) {
            HttpService.cancel();
        }
    });
});


// TODO: Moderator Option Menu Controller
controllers.controller('ModeratorOptionMenuCtrl', function ($log, $scope, $q, $ionicModal, $ionicHistory, $location, $ionicPopup,
                                                            $cordovaCamera, $cordovaToast, $cordovaKeyboard, $ionicLoading, Cache,
                                                            HttpService, Config) {
    $scope.userInfo = Cache.getInfo('user');
    $scope.boardInfo = Cache.getInfo('board');
    $scope.editInfo = {};
    $scope.title = $scope.boardInfo.b_name;
    $scope.users = [];
    $scope.loading = false;
    $scope.isOwner = ($scope.boardInfo.owner == $scope.userInfo.u_id);
    $scope.toggle = {
        view_range: ($scope.boardInfo.view_range == 'local'),
        post_range: ($scope.boardInfo.post_range == 'local')
    };
    $scope.user = {
        search: ""
    };
    $scope.search = false;
    var offset = 0;

    $scope.goBack = function () {
        $ionicHistory.goBack();
    };

    $scope.goToPictureMenu = function (menu) {
        if (menu == 'waiting' && $scope.boardInfo.count > 0) {
            Cache.setInfo('picture_menu', menu);
            $location.path('app/ModeratorPictureMenu');
        }
        else if (menu == 'active' && $scope.boardInfo.activeCount > 0) {
            Cache.setInfo('picture_menu', menu);
            $location.path('app/ModeratorPictureMenu');
        }
    };
    //////////////////////////////////// Moderator Menu //////////////////////////////////
    $ionicModal.fromTemplateUrl('view/ModeratorModal.html', {
        scope: $scope,
        // animation: 'slide-in-right'
        animation: 'slide-in-up'
    }).then(function (modal) {
        $scope.moderatorModal = modal;
    });
    $scope.closeModeratorModal = function () {
        $scope.moderatorModal.hide();
        $scope.users = [];
        $scope.user.search = "";
    };
    $scope.openModeratorModal = function () {
        if (!$scope.moderatorModal.isShown()) {
            $scope.moderatorModal.show().then(function () {
                $scope.moderatorLogin();
            });
        }
        else {
            $scope.moderatorLogin();
        }
    };

    $scope.moderatorLogin = function () {
        if (!$scope.loading) {
            $scope.loading = true;
            $scope.search = false;
            var params = {
                u_id: $scope.userInfo.u_id,
                b_id: $scope.boardInfo.b_id
            };
            HttpService.getSignature(params).then(function (result) {
                params.signature = result;
                return HttpService.post('getAdmins', params).then(function (result) {
                    if (result.success == true) {
                        $scope.users = result.response;
                    }
                    else {
                        throw new Error("Get Admins success false");
                    }
                });
            }).catch(function (error) {
                $log.debug(error);
                $cordovaToast.showShortCenter("Error Getting Moderators");
            }).then(function () {
                $scope.loading = false;
            });
        }
    };

    $scope.addModerator = function (params) {
        if (!$scope.loading) {
            $scope.loading = true;
            var params = {
                u_id: $scope.userInfo.u_id,
                b_id: $scope.boardInfo.b_id,
                u_ids: [params]
            };
            HttpService.getSignature(params).then(function (result) {
                params.signature = result;
                return HttpService.post('addAdmins', params).then(function (result) {
                    if (result.success == true) {
                        $cordovaToast.showShortCenter("Moderator Added");
                    }
                    else {
                        throw new Error("Add Admin success false");
                    }
                });
            }).catch(function (error) {
                $log.debug(error);
                $cordovaToast.showShortCenter("Error Adding Moderator");
            }).then(function () {
                $scope.loading = false;
                $scope.user.search = "";
                $scope.moderatorLogin();
            });
        }
    };

    $scope.removeModerator = function (params) {
        if (!$scope.loading) {
            $scope.loading = true;
            var params = {
                u_id: $scope.userInfo.u_id,
                b_id: $scope.boardInfo.b_id,
                u_ids: [params]
            };
            HttpService.getSignature(params).then(function (result) {
                params.signature = result;
                return HttpService.post('removeAdmins', params).then(function (result) {
                    if (result.success == true) {
                        $cordovaToast.showShortCenter("Moderator Removed");
                    }
                    else {
                        throw new Error("Remove admin success false");
                    }
                });
            }).catch(function (error) {
                $log.debug(error);
                $cordovaToast.showShortCenter("Error Removing Moderator");
            }).then(function () {
                $scope.loading = false;
                $scope.moderatorLogin();
            });
        }
    };

    /////////////////////////////// Blacklist Menu ///////////////////////////////
    $ionicModal.fromTemplateUrl('view/BlackListModal.html', {
        scope: $scope,
        // animation: 'slide-in-right'
        animation: 'slide-in-up'
    }).then(function (modal) {
        $scope.blacklistModal = modal;
    });
    $scope.closeBlacklistModal = function () {
        $scope.blacklistModal.hide();
        $scope.users = [];
        $scope.user.search = "";
    };
    $scope.openBlacklistModal = function () {
        if (!$scope.blacklistModal.isShown()) {
            $scope.blacklistModal.show().then(function () {
                $scope.blacklistLogin();
            });
        }
        else {
            $scope.blacklistLogin();
        }
    };

    $scope.blacklistLogin = function () {
        if (!$scope.loading) {
            $scope.loading = true;
            $scope.search = false;
            var params = {
                u_id: $scope.userInfo.u_id,
                b_id: $scope.boardInfo.b_id
            };
            HttpService.getSignature(params).then(function (result) {
                params.signature = result;
                return HttpService.post('getBlackList', params).then(function (result) {
                    if (result.success == true) {
                        $scope.users = result.response;
                    }
                    else {
                        throw new Error("Get Blacklist success false");
                    }
                });
            }).catch(function (error) {
                $log.debug(error);
                $cordovaToast.showShortCenter("Error Getting Blacklist");
            }).then(function () {
                $scope.loading = false;
            });
        }
    };

    $scope.addBlackList = function (params) {
        if (!$scope.loading) {
            $scope.loading = true;
            var params = {
                u_id: $scope.userInfo.u_id,
                b_id: $scope.boardInfo.b_id,
                u_ids: [params]
            };
            HttpService.getSignature(params).then(function (result) {
                params.signature = result;
                return HttpService.post('addBlackList', params).then(function (result) {
                    if (result.success == true) {
                        $cordovaToast.showShortCenter("Added To Blacklist");
                    }
                    else {
                        throw new Error("Add Blacklist success false");
                    }
                });
            }).catch(function (error) {
                $log.debug(error);
                $cordovaToast.showShortCenter("Error Adding To Blacklist");
            }).then(function () {
                $scope.loading = false;
                $scope.user.search = "";
                $scope.blacklistLogin();
            });
        }
    };

    $scope.removeBlackList = function (params) {
        if (!$scope.loading) {
            $scope.loading = true;
            var params = {
                u_id: $scope.userInfo.u_id,
                b_id: $scope.boardInfo.b_id,
                u_ids: [params]
            };
            HttpService.getSignature(params).then(function (result) {
                params.signature = result;
                return HttpService.post('removeBlackList', params).then(function (result) {
                    if (result.success == true) {
                        $cordovaToast.showShortCenter("Removed From Blacklist");
                    }
                    else {
                        throw new Error("Error remove blacklist success false");
                    }
                });
            }).catch(function (error) {
                $log.debug(error);
                $cordovaToast.showShortCenter("Error Removing From Blacklist");
            }).then(function () {
                $scope.loading = false;
                $scope.blacklistLogin();
            });
        }
    };
    //////////////////////////////////// Board Info Menu /////////////////////////////////
    $ionicModal.fromTemplateUrl('view/BoardInfoModal.html', {
        scope: $scope,
        // animation: 'slide-in-right'
        animation: 'slide-in-up'
    }).then(function (modal) {
        $scope.boardInfoModal = modal;
    });
    $scope.closeBoardInfoModal = function () {
        $scope.editInfo = {};
        $scope.image = "img/transparent.png";
        $scope.boardInfoModal.hide();
    };
    $scope.openBoardInfoModal = function () {
        $scope.editInfo = $scope.boardInfo;
        $scope.image = "data:image/jpeg;base64," + $scope.editInfo.logo;
        $scope.boardInfoModal.show();
    };
    $scope.updateBoardInfo = function () {
        if (!$scope.loading && checkBoardInfo()) {
            $scope.loading = true;
            $ionicLoading.show();
            var params = {
                u_id: $scope.editInfo.u_id,
                b_id: $scope.editInfo.b_id,
                b_name: $scope.editInfo.b_name,
                email: $scope.editInfo.email,
                logo: $scope.image.replace(/^data:image\/jpeg;base64,/g, ""),
                about: $scope.editInfo.about,
                repeat_view: $scope.editInfo.repeat_view,
                nsfw: $scope.editInfo.nsfw,
                min_age: $scope.editInfo.min_age,
                max_age: $scope.editInfo.max_age,
                pic_expire: Number($scope.editInfo.pic_expire),
                longitude: Number($scope.editInfo.longitude),
                latitude: Number($scope.editInfo.latitude),
                view_range: $scope.editInfo.view_range,
                post_range: $scope.editInfo.post_range
            };
            HttpService.getSignature(params).then(function (result) {
                params.signature = result;
                return HttpService.post('updateBoard', params).then(function (result) {
                    if (result.success == true) {
                        delete params.signature;
                        Cache.setInfo('board', params);
                        $cordovaToast.showShortCenter("Board Updated");
                        $scope.closeBoardInfoModal();
                    }
                    else {
                        throw new Error("Update Board success false");
                    }
                });
            }).catch(function (error) {
                $log.debug(error);
                $cordovaToast.showShortCenter("Error Updating Board");
            }).then(function () {
                $scope.loading = false;
                $ionicLoading.hide();
                $scope.editInfo = Cache.getInfo('board');
            });
        }
    };
    $scope.addLogo = function () {
        $cordovaCamera.getPicture(Config.gallerySmallOptions).then(function (result) {
            $scope.image = "data:image/jpeg;base64," + result;
        });
    };
    $scope.checkAgeRange = function () {
        if ($scope.editInfo.nsfw == true && $scope.editInfo.min_age < 18) {
            $scope.editInfo.min_age = 18;
        }
    };
    $scope.changeViewRange = function () {
        if ($scope.toggle.view_range == false) {
            $scope.editInfo.view_range = "global";
        }
        else {
            $scope.editInfo.view_range = "local";
        }
    };
    $scope.changePostRange = function () {
        if ($scope.toggle.post_range == false) {
            $scope.editInfo.post_range = "global";
        }
        else {
            $scope.editInfo.post_range = "local";
        }
    };

    $scope.deleteConfirm = function () {
        $ionicPopup.show({
            title: 'Delete Board',
            template: '<div class="text-color text-size-regular text-center-horizontal">Are you sure you want to delete this board?</div>',
            buttons: [{
                text: 'Cancel',
                type: 'button-block button-outline button-light text-color'
            }, {
                text: 'Delete',
                type: 'button-block button-dark',
                onTap: function () {
                    deleteBoard();
                }
            }]
        });
    };

    function deleteBoard() {
        var params = {
            b_id: $scope.boardInfo.b_id,
            u_id: $scope.userInfo.u_id
        };
        HttpService.getSignature(params).then(function (result) {
            params.signature = result;
            return HttpService.post('deleteBoard', params).then(function (result) {
                if (result.success == true) {
                    $cordovaToast.showShortCenter("Board Deleted");
                    $scope.goBack();
                }
                else {
                    throw new Error("Delete Board success false");
                }
            });
        }).catch(function (error) {
            $log.debug(error);
            $cordovaToast.showShortCenter("Error Deleting Board");
        });
    }

    function checkBoardInfo() {
        if ($scope.editInfo.b_name == "" && $scope.boardInfo.about == "") {
            $cordovaToast.showShortCenter("Please Enter a Title and Description");
        }
        else if ($scope.editInfo.b_name == "") {
            $cordovaToast.showShortCenter("Please Enter a Title");
        }
        else if ($scope.editInfo.about == "") {
            $cordovaToast.showShortCenter("Please Enter a Description");
        }
        else if ($scope.editInfo.min_age < 1 && $scope.editInfo.max_age > 100) {
            $cordovaToast.showShortCenter("Age Range Must Be Between 1 and 100");
        }
        else {
            return true;
        }
    }

    ////////////////////////////////////// User Search ///////////////////////////////////
    $scope.userSearch = function (menu) {
        if (!$scope.loading) {
            if ($cordovaKeyboard.isVisible()) {
                $cordovaKeyboard.close();
            }
            if ($scope.user.search == "" || !($scope.user.search.indexOf(' ') === -1)) {
                if (!($scope.user.search.indexOf(' ') === -1)) {
                    $cordovaToast.showShortCenter("No Spaces In Usernames");
                }
                $scope.users = [];
                $scope.search = false;
                if (menu == 'moderator') {
                    $scope.moderatorLogin();
                }
                else if (menu == 'blacklist') {
                    $scope.blacklistLogin();
                }
            }
            else {
                $scope.loading = true;
                $scope.search = true;
                offset = 0;
                var exclude = [$scope.userInfo.u_id];
                for (var i = 0; i < $scope.users.length; i++) {
                    exclude[i + 1] = $scope.users[i].u_id;
                }
                var params = {
                    u_id: $scope.userInfo.u_id,
                    search: $scope.user.search,
                    exclude: exclude,
                    offset: offset
                };
                HttpService.getSignature(params).then(function (result) {
                    params.signature = result;
                    return HttpService.post('userSearch', params).then(function (result) {
                        $scope.loading = false;
                        if (result.success == true) {
                            if (result.response.length == 0) {
                                $cordovaToast.showShortCenter("No Users Found");
                            }
                            $scope.users = result.response;
                        }
                        else {
                            $scope.users = [];
                            $scope.search = false;
                            if (menu == 'moderator') {
                                $scope.moderatorLogin();
                            }
                            else if (menu == 'blacklist') {
                                $scope.blacklistLogin();
                            }
                        }
                    });
                }).catch(function (error) {
                    $log.debug(error);
                    $scope.loading = false;
                });
            }
        }
    };

    /////////////////////  Misc Functions ///////////////////
    function sendAcceptedPictures(picturesAccepted) {
        var params = {
            u_id: $scope.userInfo.u_id,
            b_id: $scope.boardInfo.b_id,
            p_id: picturesAccepted
        };
        if (picturesAccepted.length > 0) {
            return HttpService.getSignature(params).then(function (result) {
                params.signature = result;
                return HttpService.post('approvePictures', params);
            }).catch(function (error) {
                $log.debug(error);
            }).then(function () {
                Cache.setInfo('accepted', []);
            });
        }
        else {
            return "No Accepted Pictures";
        }
    }

    function sendRejectedPictures(picturesRejected) {
        var params = {
            u_id: $scope.userInfo.u_id,
            b_id: $scope.boardInfo.b_id,
            p_id: picturesRejected
        };
        if (picturesRejected.length > 0) {
            return HttpService.getSignature(params).then(function (result) {
                params.signature = result;
                return HttpService.post('rejectPictures', params);
            }).catch(function (error) {
                $log.debug(error);
            }).then(function () {
                Cache.setInfo('rejected', []);
            });
        }
        else {
            return "No Rejected Pictures";
        }
    }

    function updateInfo() {
        var params = {
            u_id: $scope.userInfo.u_id,
            b_id: $scope.boardInfo.b_id
        };
        HttpService.getSignature(params).then(function (result) {
            params.signature = result;
            return HttpService.post('getBoard', params).then(function (result) {
                if (result.success == true && result.response.length > 0) {
                    $scope.boardInfo.count = parseInt(result.response[0].waitingCount);
                    $scope.boardInfo.activeCount = parseInt(result.response[0].activeCount);
                }
            });
        }).catch(function (error) {
            $log.debug(error);
            $cordovaToast.showShortCenter("Error getting board information");
        });
    }

    //////////////////////////////// Ionic View Functions ///////////////////////
    $scope.$on('$ionicView.enter', function () {
        var picturesAccepted = Cache.getInfo('accepted');
        var picturesRejected = Cache.getInfo('rejected');
        $q.all([sendAcceptedPictures(picturesAccepted), sendRejectedPictures(picturesRejected)]).then(function () {
            updateInfo();
        });
    });
    $scope.$on('$destroy', function () {
        $scope.moderatorModal.remove();
        $scope.blacklistModal.remove();
        $scope.boardInfoModal.remove();
    });
});

// TODO: Moderator Menu Controller
controllers.controller('ModeratorPictureMenuCtrl', function ($log, $scope, $location, $ionicHistory, $cordovaToast, $ionicPopup,
                                                             $timeout, $window, Cache, HttpService, Draw) {
    var userInfo = Cache.getInfo('user');
    var boardInfo = Cache.getInfo('board');
    var pictures = [];
    $scope.pictureInfo = {};
    $scope.loading = false;
    $scope.pictureWaiting = (Cache.getInfo('picture_menu') == "waiting");
    var video = document.getElementById('modVideo');
    var canvas = document.getElementById('modCanvas');
    var context = canvas.getContext('2d');
    var pixelRatio = $window.devicePixelRatio;
    var image = new Image();
    var dimensions = Cache.getInfo('dimensions');
    var newWidth, newHeight, centerVertical, centerHorizontal, ratio;
    var offset = 0;
    var index = 0;
    var picturesViewed = [];
    var loadingPictures = false;
    var isVideo = false;
    var picturesAccepted = [];
    var picturesRejected = [];

    $scope.goBack = function () {
        $ionicHistory.goBack();
    };

    $scope.pictureLogin = function () {
        if (!$scope.loading) {
            $scope.loading = true;
            offset = 0;
            var params = {
                u_id: userInfo.u_id,
                b_id: boardInfo.b_id,
                offset: offset
            };
            if ($scope.pictureWaiting && boardInfo.count > 0) {
                HttpService.getSignature(params).then(function (result) {
                    params.signature = result;
                    return HttpService.post('getWaitingPictures', params).then(function (result) {
                        if (result.success == true) {
                            pictures = result.response;
                            $scope.nextPicture();
                        }
                    });
                }).catch(function (error) {
                    $log.debug(error);
                    $scope.goBack();
                }).then(function () {
                    $scope.loading = false;
                });
            }
            else if (!$scope.pictureWaiting && boardInfo.activeCount > 0) {
                HttpService.getSignature(params).then(function (result) {
                    params.signature = result;
                    return HttpService.post('getActivePictures', params).then(function (result) {
                        if (result.success == true) {
                            pictures = result.response;
                            $scope.nextPicture();
                        }
                    });
                }).catch(function (error) {
                    $log.debug(error);
                    $scope.goBack();
                }).then(function () {
                    $scope.loading = false;
                });
            }
        }
    };

    $scope.getMorePictures = function () {
        loadingPictures = true;
        var params = {
            u_id: userInfo.u_id,
            b_id: boardInfo.b_id,
            offset: offset
        };
        if ($scope.pictureWaiting) {
            HttpService.getSignature(params).then(function (result) {
                params.signature = result;
                return HttpService.post('getWaitingPictures', params).then(function (result) {
                    if (result.success == true) {
                        pictures = pictures.concat(result.response);
                    }
                    else {
                        throw new Error("Unable to get more waiting pictures");
                    }
                });
            }).catch(function (error) {
                $log.debug(error);
            }).then(function () {
                loadingPictures = false;
                $scope.loading = false;
            });
        }
        else if (!$scope.pictureWaiting) {
            HttpService.getSignature(params).then(function (result) {
                params.signature = result;
                return HttpService.post('getActivePictures', params).then(function (result) {
                    if (result.success == true) {
                        pictures = pictures.concat(result.response);
                    }
                    else {
                        throw new Error("Unable to get more active pictures");
                    }
                });
            }).catch(function (error) {
                $log.debug(error);
            }).then(function () {
                $scope.loading = false;
                loadingPictures = false;
            });
        }
    };

    ///////////////////////// Delete / Update Pictures ////////////////////
    $scope.deletePictureConfirm = function () {
        $ionicPopup.show({
            title: 'Remove Picture',
            template: '<div class="text-color text-size-regular text-center-horizontal">Are you sure you want to remove this picture?</div>',
            buttons: [{
                text: 'Cancel',
                type: 'button-block button-outline button-light text-color'
            }, {
                text: 'Delete',
                type: 'button-block button-dark',
                onTap: function () {
                    deletePicture('delete');
                }
            }]
        });
    };
    function deletePicture(param) {
        var params = {
            u_id: userInfo.u_id,
            b_id: boardInfo.b_id,
            p_id: [$scope.pictureInfo.p_id]
        };
        HttpService.getSignature(params).then(function (result) {
            params.signature = result;
            return HttpService.post('rejectPictures', params).then(function (result) {
                if (result.success == true) {
                    if (param == 'delete') {
                        $cordovaToast.showShortCenter("Picture Deleted");
                    }
                    else if (param == 'flag') {
                        $cordovaToast.showShortCenter("Added To Blacklist");
                        $scope.loading = false;
                    }
                    $scope.nextPicture();
                }
            });
        }).catch(function (error) {
            $log.debug(error);
        });
    }

    $scope.updatePictureStatus = function (param) {
        if (param == 'accept') {
            picturesAccepted.push($scope.pictureInfo.p_id);
            $cordovaToast.showShortCenter("Accepted");
            $scope.nextPicture();
        }
        else if (param == 'decline') {
            picturesRejected.push($scope.pictureInfo.p_id);
            $cordovaToast.showShortCenter("Rejected");
            $scope.nextPicture();
        }
    };
    $scope.flagUser = function (params) {
        if ($scope.loading == false) {
            $scope.loading = true;
            var params = {
                u_id: userInfo.u_id,
                b_id: boardInfo.b_id,
                u_ids: [params]
            };
            HttpService.getSignature(params).then(function (result) {
                params.signature = result;
                return HttpService.post('addBlackList', params).then(function (result) {
                    if (result.success == true) {
                        deletePicture('flag');
                    }
                    else {
                        throw new Error("Unable to add to blacklist");
                    }
                });
            }).catch(function (error) {
                $log.debug(error);
                $scope.loading = false;
                $cordovaToast.showShortCenter("Error Adding User To Blacklist");
            });
        }
    };


    //////////////////////// Picture Misc //////////////////
    $scope.nextPicture = function () {
        if (isVideo) {
            video.pause();
        }
        if (index < pictures.length) {
            $scope.pictureInfo = pictures[index];
            if ($scope.pictureInfo.type == 'video') {
                drawToVideo($scope.pictureInfo.pic_src);
            }
            else {
                drawToCanvas($scope.pictureInfo.pic_src)
            }
            picturesViewed.push(pictures[index].p_id);
            pictures[index] = {};
            if (index == pictures.length - 5) {
                offset = index + 5;
                $scope.getMorePictures();
            }
            index++;
        }
        else if (loadingPictures) {
            $scope.loading = true;
            $scope.pictureInfo = {};
            clearCanvas();
        }
        else {
            $scope.goBack();
        }
    };

    /////////////////// Canvas Functions ////////////////////
    // Draw Pictures
    function drawToCanvas(pic_src) {
        isVideo = false;
        image.onload = function () {
            if (image.width > image.height) {
                Draw.horizontalPicture(context, canvas, image)
            }
            else {
                Draw.verticalPicture(context, canvas, image);
            }
        };
        image.src = "data:image/jpeg;base64," + pic_src;
    }

    // Draw Videos
    function drawToVideo(src) {
        video.src = "data:video/mp4;base64," + src;
        isVideo = true;
        video.onloadeddata = function () {
            video.play();
            if (video.videoWidth > video.videoHeight) {
                drawHorizontalVideo();
            }
            else {
                drawVerticalVideo();
            }
        };
        video.load();
    }

    function drawHorizontalVideo() {
        if (!video.paused && !video.ended) {
            ratio = video.videoHeight / video.videoWidth;
            if (ratio > 1) {
                ratio = video.videoWidth / video.videoHeight;
            }
            newWidth = dimensions.height * ratio;
            newHeight = dimensions.width / ratio;
            centerVertical = (dimensions.height - newHeight) / 2;
            centerHorizontal = (dimensions.width - newWidth) / 2;
            context.clearRect(0, 0, canvas.width, canvas.height);
            context.save();
            context.translate(dimensions.width, 0);
            context.rotate(90 * Math.PI / 180);
            if (newHeight <= dimensions.height - 15) {
                context.drawImage(video, 0, centerHorizontal, dimensions.height, newWidth);
            }
            else if (newHeight >= dimensions.height + 15) {
                context.drawImage(video, centerVertical, 0, newHeight, dimensions.width);
            }
            else {
                context.drawImage(video, 0, 0, dimensions.height, dimensions.width);
            }
            context.restore();
            if (video.videoHeight > video.videoWidth) {
                $timeout(drawVerticalVideo, 35);
            }
            else {
                $timeout(drawHorizontalVideo, 35);
            }
        }
    }

    function drawVerticalVideo() {
        if (!video.paused && !video.ended) {
            ratio = video.videoWidth / video.videoHeight;
            if (ratio > 1) {
                ratio = video.videoHeight / video.videoWidth;
            }
            newWidth = dimensions.height * ratio;
            newHeight = dimensions.width / ratio;
            centerVertical = (dimensions.height - newHeight) / 2;
            centerHorizontal = (dimensions.width - newWidth) / 2;
            context.clearRect(0, 0, canvas.width, canvas.height);
            context.save();
            if (newHeight <= dimensions.height - 15) {
                context.drawImage(video, centerHorizontal, 0, newWidth, dimensions.height);
            }
            else if (newHeight >= dimensions.height + 15) {
                context.drawImage(video, 0, centerVertical, dimensions.width, newHeight);
            }
            else {
                context.drawImage(video, 0, 0, dimensions.width, dimensions.height);
            }
            context.restore();
            if (video.videoWidth > video.videoHeight) {
                $timeout(drawHorizontalVideo, 35);
            }
            else {
                $timeout(drawVerticalVideo, 35);
            }
        }
    }

    // Picture / Video Controls
    function clearCanvas() {
        if (isVideo) {
            cancelVideo()
        }
        context.clearRect(0, 0, canvas.width, canvas.height);
        context.save();
        context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
        context.restore();
    }

    function cancelVideo() {
        video.pause();
        video.src = "";
        video.load();
        isVideo = false;
    }

    $scope.$on('$ionicView.enter', function () {
        canvas.width = dimensions.width * pixelRatio;
        canvas.height = dimensions.height * pixelRatio;
        canvas.style.width = dimensions.width + "px";
        canvas.style.height = dimensions.height + "px";
        context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
        $scope.pictureLogin();
    });

    $scope.$on('$ionicView.beforeLeave', function () {
        Cache.setInfo('accepted', picturesAccepted);
        Cache.setInfo('rejected', picturesRejected);
        clearCanvas();
        if ($scope.loading) {
            HttpService.cancel();
        }
    });
});

// TODO: User Menu Controller
controllers.controller('UserMenuCtrl', function ($log, $scope, $ionicHistory, $ionicModal, $cordovaToast, $ionicPopup, $timeout, $window,
                                                 Cache, HttpService, Draw) {
    $scope.image = "img/transparent.png";
    $scope.pictureInfo = {};
    $scope.boardInfo = Cache.getInfo('board');
    $scope.userInfo = Cache.getInfo('user');
    $scope.loading = false;
    $scope.boardInfo.logo = "data:image/jpeg;base64," + $scope.boardInfo.logo;
    var video = document.getElementById("userVideo");
    var canvas = document.getElementById("userCanvas");
    var context = canvas.getContext('2d');
    var pixelRatio = $window.devicePixelRatio;
    var image = new Image();
    var dimensions = Cache.getInfo('dimensions');
    var newWidth, newHeight, centerVertical, centerHorizontal, ratio;
    var pictures = [];
    var index = 0;
    var offset = 0;
    var deletedPictures = [];
    var loadingPictures = false;
    var isVideo = false;

    $scope.goBack = function () {
        $ionicHistory.goBack();
    };

    //////////////// Picture Board Info Menu ////////////////////////
    $ionicModal.fromTemplateUrl('view/PictureBoardInfoModal.html', {
        scope: $scope,
        // animation: 'slide-in-right'
        animation: 'slide-in-up'
    }).then(function (modal) {
        $scope.boardInfoModal = modal;
    });
    $scope.closeBoardInfoModal = function () {
        $scope.boardInfoModal.hide().then(function () {
            playVideo();
        });
    };
    $scope.openBoardInfoModal = function () {
        $scope.boardInfoModal.show().then(function () {
            pauseVideo();
        });
    };

    $scope.getBoardInfo = function () {
        $scope.openBoardInfoModal();
    };

    ///////////////// Get User Pictures /////////////////
    $scope.pictureLogin = function () {
        if (!$scope.loading) {
            $scope.loading = true;
            offset = 0;
            var params = {
                u_id: $scope.userInfo.u_id,
                b_id: $scope.boardInfo.b_id,
                offset: offset
            };
            HttpService.getSignature(params).then(function (result) {
                params.signature = result;
                return HttpService.post('myBoardPictures', params).then(function (result) {
                    if (result.success == true) {
                        pictures = result.response;
                        for (var i = 0; i < pictures.length; i++) {
                            pictures[i].approved = $scope.checkStatus(pictures[i].approved);
                        }
                        $scope.nextPicture();
                    }
                });
            }).catch(function (error) {
                $log.debug(error);
            }).then(function (result) {
                $scope.loading = false;
            });
        }
    };
    $scope.getMorePictures = function () {
        loadingPictures = true;
        var params = {
            u_id: $scope.userInfo.u_id,
            b_id: $scope.boardInfo.b_id,
            offset: offset
        };
        HttpService.getSignature(params).then(function (result) {
            params.signature = result;
            return HttpService.post('myBoardPictures', params).then(function (result) {
                if (result.success == true) {
                    pictures = pictures.concat(result.response);
                    for (var i = offset; i < pictures.length; i++) {
                        pictures[i].approved = $scope.checkStatus(pictures[i].approved);
                    }
                }
            });
        }).catch(function (error) {
            $log.debug(error);
        }).then(function () {
            loadingPictures = false;
            $scope.loading = false;
        });
    };

    /////////////////////////// Delete Pictures /////////////////////////
    $scope.deleteConfirm = function () {
        $ionicPopup.show({
            title: 'Delete Picture',
            template: '<div class="text-color text-size-regular text-center-horizontal">Are you sure you want to delete this picture?</div>',
            buttons: [{
                text: 'Cancel',
                type: 'button-block button-outline button-light text-color'
            }, {
                text: 'Delete',
                type: 'button-block button-dark',
                onTap: function () {
                    deletePicture();
                }
            }]
        });
    };
    function deletePicture() {
        deletedPictures.push($scope.pictureInfo.p_id);
        var params = {
            u_id: $scope.userInfo.u_id,
            p_id: deletedPictures
        };
        HttpService.getSignature(params).then(function (result) {
            params.signature = result;
            return HttpService.post('deleteMyPictures', params).then(function (result) {
                if (result.success == true) {
                    $cordovaToast.showShortCenter("Picture Deleted");
                    $scope.nextPicture();
                }
                else {
                    throw new Error("Delete pictures success false");
                }
            });
        }).catch(function (error) {
            $log.debug(error);
            $cordovaToast.showShortCenter("Error Deleting Picture");
        }).then(function () {
            deletedPictures = [];
        });
    }

    /////////////////////// Picture Misc //////////////////
    $scope.addToFavorites = function () {
        var params = {
            u_id: $scope.userInfo.u_id,
            b_id: [$scope.boardInfo.b_id]
        };
        if (!$scope.boardInfo.favorite) {
            HttpService.getSignature(params).then(function (result) {
                params.signature = result;
                return HttpService.post('addToFavorites', params).then(function (result) {
                    if (result.success == true) {
                        $scope.boardInfo.favorite = true;
                        $cordovaToast.showShortCenter("Added to Favorites");
                    }
                    else {
                        throw new Error("Board add favorites success false");
                    }
                });
            }).catch(function (error) {
                $log.debug(error);
                $cordovaToast.showShortCenter("Error Adding to Favorites");
            });
        }
        else {
            HttpService.getSignature(params).then(function (result) {
                params.signature = result;
                return HttpService.post('removeFromFavorites', params).then(function (result) {
                    if (result.success == true) {
                        $scope.boardInfo.favorite = false;
                        $cordovaToast.showShortCenter("Removed From Favorites");
                    }
                    else {
                        throw new Error("Board remove favorites success false");
                    }
                });
            }).catch(function (error) {
                $log.debug(error);
                $cordovaToast.showShortCenter("Error Removing From Favorites");
            });
        }
    };

    $scope.checkStatus = function (param) {
        if (param == true) {
            return "Active";
        }
        else {
            return "Waiting";
        }
    };

    $scope.nextPicture = function () {
        pauseVideo();
        if (index < pictures.length) {
            $scope.pictureInfo = pictures[index];
            if ($scope.pictureInfo.type == 'video') {
                drawToVideo($scope.pictureInfo.pic_src);
            }
            else {
                drawToCanvas($scope.pictureInfo.pic_src);
            }
            pictures[index] = {};
            if (index == pictures.length - 5) {
                offset = index + 5;
                $scope.getMorePictures();
            }
            index++;
        }
        else if (loadingPictures) {
            $scope.loading = true;
            $scope.pictureInfo = {};
            clearCanvas();
        }
        else {
            index = 0;
            offset = 0;
            $scope.pictureInfo = {};
            $scope.goBack();
        }
    };

    /////////////////// Canvas Functions ////////////////////
    // Draw Pictures
    function drawToCanvas(pic_src) {
        isVideo = false;
        image.onload = function () {
            if (image.width > image.height) {
                Draw.horizontalPicture(context, canvas, image)
            }
            else {
                Draw.verticalPicture(context, canvas, image);
            }
        };
        image.src = "data:image/jpeg;base64," + pic_src;
    }

    // Draw Videos
    function drawToVideo(src) {
        video.src = "data:video/mp4;base64," + src;
        isVideo = true;
        video.onloadeddata = function () {
            video.play();
            if (video.videoWidth > video.videoHeight) {
                drawHorizontalVideo();
            }
            else {
                drawVerticalVideo();
            }
        };
        video.load();
    }

    function drawHorizontalVideo() {
        if (!video.paused && !video.ended) {
            ratio = video.videoHeight / video.videoWidth;
            if (ratio > 1) {
                ratio = video.videoWidth / video.videoHeight;
            }
            newWidth = dimensions.height * ratio;
            newHeight = dimensions.width / ratio;
            centerVertical = (dimensions.height - newHeight) / 2;
            centerHorizontal = (dimensions.width - newWidth) / 2;
            context.clearRect(0, 0, canvas.width, canvas.height);
            context.save();
            context.translate(dimensions.width, 0);
            context.rotate(90 * Math.PI / 180);
            if (newHeight <= dimensions.height - 15) {
                context.drawImage(video, 0, centerHorizontal, dimensions.height + 15, newWidth);
            }
            else if (newHeight >= dimensions.height + 15) {
                context.drawImage(video, centerVertical, 0, newHeight, dimensions.width);
            }
            else {
                context.drawImage(video, 0, 0, dimensions.height, dimensions.width + 15);
            }
            context.restore();
            if (video.videoHeight > video.videoWidth) {
                $timeout(drawVerticalVideo, 35);
            }
            else {
                $timeout(drawHorizontalVideo, 35);
            }
        }
    }

    function drawVerticalVideo() {
        if (!video.paused && !video.ended) {
            ratio = video.videoWidth / video.videoHeight;
            if (ratio > 1) {
                ratio = video.videoHeight / video.videoWidth;
            }
            newWidth = dimensions.height * ratio;
            newHeight = dimensions.width / ratio;
            centerVertical = (dimensions.height - newHeight) / 2;
            centerHorizontal = (dimensions.width - newWidth) / 2;
            context.clearRect(0, 0, canvas.width, canvas.height);
            context.save();
            if (newHeight <= dimensions.height - 15) {
                context.drawImage(video, centerHorizontal, 0, newWidth, dimensions.height);
            }
            else if (newHeight >= dimensions.height + 15) {
                context.drawImage(video, 0, centerVertical, dimensions.width, newHeight);
            }
            else {
                context.drawImage(video, 0, 0, dimensions.width, dimensions.height);
            }
            context.restore();
            if (video.videoWidth > video.videoHeight) {
                $timeout(drawHorizontalVideo, 35);
            }
            else {
                $timeout(drawVerticalVideo, 35);
            }
        }
    }

    // Picture / Video Controls
    function clearCanvas() {
        if (isVideo) {
            cancelVideo()
        }
        context.clearRect(0, 0, canvas.width, canvas.height);
        context.save();
        context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
        context.restore();
    }

    function cancelVideo() {
        video.pause();
        video.src = "";
        video.load();
        isVideo = false;
    }

    function pauseVideo() {
        if (isVideo && !video.paused) {
            video.pause();
        }
    }

    function playVideo() {
        if (isVideo && video.paused) {
            video.play();
            if (video.videoWidth > video.videoHeight) {
                drawHorizontalVideo();
            }
            else {
                drawVerticalVideo();
            }
        }
    }

    $scope.$on('$ionicView.enter', function () {
        canvas.width = dimensions.width * pixelRatio;
        canvas.height = dimensions.height * pixelRatio;
        canvas.style.width = dimensions.width + "px";
        canvas.style.height = dimensions.height + "px";
        context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
        $scope.pictureLogin();
    });

    $scope.$on('$ionicView.beforeLeave', function () {
        if ($scope.loading == true) {
            HttpService.cancel();
        }
        clearCanvas();
    });
    $scope.$on('$destroy', function () {
        $scope.boardInfoModal.remove();
    });
});

