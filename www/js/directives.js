/**
 * Created by Philip on 7/14/2015.
 */
var directives = angular.module('directives', []);

directives.directive('boardInfo', function(){
    return{
        restrict: 'A',
        link: function($scope, $element){
            $element.on('touchend', function() {
                $scope.getBoardInfo();
            });
        }
    };
});

directives.directive('ngResize', function ($window) {
    return function ($scope) {
        $scope.initializeWindowSize = function () {
            $scope.width = $window.innerWidth;
            $scope.height = $window.innerHeight;
        };
        $scope.initializeWindowSize();
        return angular.element($window).bind('resize', function () {
            $scope.initializeWindowSize();
            return $scope.$apply();
        });
    };
});

directives.directive('iconFavorite', function(){
    return{
        restrict: 'A',
        link: function($scope, $element,$attr){
            if($scope.boardInfo.favorite === true) {
                // Set To True Yellow Star
                $element.removeClass($attr.offIcon);
                $element.addClass($attr.onIcon);
            }
            $element.on('touchend', function(){
                if($scope.boardInfo.favorite === true) {
                    // Set To False White Star
                    $element.removeClass($attr.onIcon);
                    $element.addClass($attr.offIcon);
                }
                else {
                    // Set To True Yellow Star
                    $element.removeClass($attr.offIcon);
                    $element.addClass($attr.onIcon);
                }
                $scope.addToFavorites();
            });
        }
    };
});

directives.directive('imageVideo', function(){
    return{
        restrict: 'A',
        link: function($scope, $element){
            $element.on('touchend', function() {
                $scope.$apply($scope.nextPicture());
            });
        }
    };
});

directives.directive('iconPlatform', function () {
    return {
        restrict: 'A',
        link: function ($scope, $element, $attr) {
            if (ionic.Platform.isAndroid() === true) {
                // Remove IOS icon and set Android icon
                $element.removeClass($attr.iosIcon);
                $element.addClass($attr.androidIcon);
            }
            else if (ionic.Platform.isIOS() === true) {
                // Remove Android icon and set IOS icon
                $element.removeClass($attr.androidIcon);
                $element.addClass($attr.iosIcon);
            }
        }
    };
});