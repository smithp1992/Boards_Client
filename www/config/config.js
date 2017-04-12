/**
 * Created by Philip on 7/22/2016.
 */

var configure = angular.module('config',[]);

configure.factory('Config', function() {
    var config = {};
    
    config.inAppBrowser = {
        location: 'no',
        clearcache: 'yes',
        toolbar: 'no'
    };
    
    config.appInfo = {
        serverVersion: 400,
        appVersion: 270
    };
    
    config.videoEditor = {
        // Quality: High = 0, Medium = 1, Low = 2
        Quality: 1,
        // Optimize for Network Use: No = 0, Yes = 1
        OptimizeForNetworkUse: 1,
        // Output: M4V = 0, MPEG4 = 1, M4A = 2, QUICK_TIME = 3
        OutputFileType: 1
    };

    config.cameraOptions = {
        quality: 100,
        // Destination Type: Base64: 0, File URI: 1, Native URI: 2
        destinationType: 0,
        // Picture Source Type: Photo Library: 0, Camera: 1, Saved Photo Album: 2
        sourceType: 1,
        // Encoding Type: JPEG: 0, PNG: 1
        encodingType: 0,
        targetWidth: 720,
        targetHeight: 1280,
        saveToPhotoAlbum: false,
        correctOrientation: true
    };

    config.galleryOptions = {
        quality: 100,
        // Destination Type: Base64: 0, File URI: 1, Native URI: 2
        destinationType: 0,
        // Picture Source Type: Photo Library: 0, Camera: 1, Saved Photo Album: 2
        sourceType: 0,
        // Encoding Type: JPEG: 0, PNG: 1
        encodingType: 0,
        targetWidth: 720,
        targetHeight: 1280,
        saveToPhotoAlbum: false,
        correctOrientation: true
    };

    config.gallerySmallOptions = {
        quality: 75,
        // Destination Type: Base64: 0, File URI: 1, Native URI: 2
        destinationType: 0,
        // Picture Source Type: Photo Library: 0, Camera: 1, Saved Photo Album: 2
        sourceType: 0,
        // Encoding Type: JPEG: 0, PNG: 1
        encodingType: 0,
        targetWidth: 75,
        targetHeight: 75,
        saveToPhotoAlbum: false,
        correctOrientation: true
    };

    config.videoOptions = {
        duration: 10
    };
    
    config.pushConfig = {
        "ios": {
            "alert": true,
            "badge": true,
            "sound": true,
            "clearBadge": true
        },
        "android": {
            "sound": true,
            "vibrate": true,
            "icon": "boards_notification",
            "iconColor": "#4369ba"
        }
    };
    
    config.geolocation = {
        enableHighAccuracy: true,
        maximumAge: 300000
    };
    
    return config;
});