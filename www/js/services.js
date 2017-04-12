/**
 * Created by Philip on 7/22/2016.
 */
var services = angular.module('services', []);
// var mainUrl = "http://192.168.1.5:3000/api/v2/";
var mainUrl = "https://boardsapp.io/api/v2/";
var db = new PouchDB('local_db',{adapter : 'websql'});
var bitcore = require('bitcore-lib');
var sign = require('bitcore-message');

////////////////// Storage Services //////////////////////
services.factory('DB', function() {
    return {
        create: function(id) {
            return db.get(id).catch(function() {
                return db.put({
                    _id: id
                });
            });
        },
        get: function(id) {
            return db.get(id);
        },
        update: function(id, params) {
            return db.get(id).then(function(doc) {
                return db.put({
                    _id: id,
                    _rev: doc._rev,
                    info: params
                });
            });
        },
        remove: function(id) {
            return db.get(id).then(function(doc) {
                return db.remove(doc).then(function() {
                    return db.put({
                        _id: id
                    });
                });
            });
        }
    };
});

services.factory('Cache', function() {
    var user = {};
    var board = {};
    var key = {};
    var dimensions = {};
    var accepted = [];
    var rejected = [];
    var token = "";
    var local_global = "";
    var tabs = "";
    var picture_menu = "";
    return {
        getInfo: function(option) {
            if(option == 'user') {
                return user;
            }
            else if(option == 'board') {
                return board;
            }
            else if(option == 'key') {
                return key;
            }
            else if (option == 'dimensions') {
                return dimensions;
            }
            else if(option == 'token') {
                return token;
            }
            else if(option == 'local_global') {
                return local_global;
            }
            else if(option == 'tabs') {
                return tabs;
            }
            else if (option == 'picture_menu') {
                return picture_menu;
            }
            else if (option == 'accepted') {
                return accepted;
            }
            else if (option == 'rejected') {
                return rejected;
            }
        },
        setInfo: function(option, info) {
            if(option == 'user') {
                user = info;
            }
            else if(option == 'board') {
                board = info;
            }
            else if(option == 'key') {
                key = info;
            }
            else if (option == 'dimensions') {
                dimensions = info;
            }
            else if(option == 'token') {
                token = info;
            }
            else if(option == 'local_global') {
                local_global = info;
            }
            else if(option == 'tabs') {
                tabs = info;
            }
            else if (option == 'picture_menu') {
                picture_menu = info;
            }
            else if (option == 'accepted') {
                accepted = info;
            }
            else if (option == 'rejected') {
                rejected = info;
            }
        }
    };
});


/////////////////////// Http Services ///////////////////////////
services.factory('HttpService', function($log, $http, $cordovaToast, $q, signService) {
    var defer;
    return {
        post: function(url, params) {
            defer = $q.defer();
            return $http.post(mainUrl + url, params, {timeout: defer.promise}).then(function(response) {
                $log.debug("Http:", response);
                if(angular.isDefined(response.data.success)) {
                    return response.data;
                }
                else {
                    throw new Error("Request Error");
                }
            });
        },
        getSignature: function(params) {
            return signService.signParams(params).then(function(signature) {
                if (signature != false) {
                    return signature;
                }
                else {
                    throw new Error("No Signature");
                }
            });
        },
        cancel: function() {
            return defer.reject();
        }
    };
});

/////////////////////// Misc Services ///////////////////////////

services.factory('signService', function($log, DB, Cache, $q) {
    return {
        signParams: function(params){
            return $q(function(resolve) {
                var key = Cache.getInfo('key');
                resolve(sign(JSON.stringify(params)).sign(key.privateKey));
            });
        },
        signParamsWithKey: function(params, key) {
            return $q(function(resolve) {
                resolve(sign(JSON.stringify(params)).sign(key.privateKey));
            });
        },
        createKeyPair: function(password) {
            var buffer = new bitcore.deps.Buffer(password);
            var hash = bitcore.crypto.Hash.sha256(buffer).toString('hex');
            var dHash = new bitcore.deps.Buffer(hash, 'hex');
            var bn = bitcore.crypto.BN.fromBuffer(dHash);
            var pub_key = new bitcore.PrivateKey(bn).toAddress();
            return DB.update('key', {hash: hash, pub_key: pub_key.toString()});
        },
        getKeyPair: function() {
            return $q(function(resolve, reject) {
                DB.get('key').then(function(result) {
                    if(result.info) {
                        var key = result.info;
                        var dHash = new bitcore.deps.Buffer(key.hash, 'hex');
                        var bn = bitcore.crypto.BN.fromBuffer(dHash);
                        key.privateKey = bitcore.PrivateKey(bn);
                        Cache.setInfo('key', key);
                        resolve(key);
                    }
                    else {
                        reject(result);
                    }
                }, function(error) {
                    reject(error);
                });
            });
        }
    }
});

services.factory('videoEditor', function($q, Config) {
    return {
        transcode: function(info) {
            var d = new Date().getTime();
            var uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
                var r = (d + Math.random()*16)%16 | 0;
                d = Math.floor(d/16);
                return (c=='x' ? r : (r&0x3|0x8)).toString(16);
            });
            var width, height;
            if (info.width < info.height) {
                width = 640;
                height = 360;
            }
            else {
                width = 360;
                height = 640;
            }
            return $q(function(resolve, reject) {
                VideoEditor.transcodeVideo(
                    function (result) {
                        var xhr = new XMLHttpRequest();
                        xhr.open('GET', result, true);
                        xhr.responseType = 'blob';
                        xhr.onload = function() {
                            var reader = new FileReader();
                            reader.onload = function () {
                                resolve(reader.result.replace(/data:video\/mp4;base64,/gi, ""));
                            };
                            reader.readAsDataURL(xhr.response);
                        };
                        xhr.onerror = function(e) {
                            reject(e);
                        };
                        xhr.send();
                    },
                    function (error) {
                        reject(error);
                    },
                    {
                        fileUri: info.src,
                        outputFileName: uuid,
                        outputFileType: Config.videoEditor.OutputFileType,
                        optimizeForNetworkUse: Config.videoEditor.OptimizeForNetworkUse,
                        saveToLibrary: false,
                        deleteInputFile: false,
                        maintainAspectRatio: ionic.Platform.isIOS(),
                        width: width,
                        height: height
                    }
                );
            });
        }
    }
});

services.factory('Draw', function (Cache, $timeout) {
    return {
        horizontalPicture: function(context, canvas, image) {
            var dimensions = Cache.getInfo('dimensions');
            var ratio = image.height / image.width;
            var newWidth = dimensions.height * ratio;
            var newHeight = dimensions.width / ratio;
            var centerVertical = (dimensions.height - newHeight)/2;
            var centerHorizontal = (dimensions.width - newWidth)/2;
            context.clearRect(0,0,canvas.width,canvas.height);
            context.save();
            /*Expand to fit*/
            context.translate(dimensions.width, 0);
            context.rotate(90 * Math.PI / 180);
            if(newHeight <= dimensions.height - 15) {
                context.drawImage(image, 0, centerHorizontal, dimensions.height, newWidth);
            }
            else if (newHeight >= dimensions.height + 15) {
                context.drawImage(image, centerVertical, 0, newHeight, dimensions.width);
            }
            else {
                context.drawImage(image,0, 0, dimensions.height, dimensions.width);
            }
            context.restore();
        },
        verticalPicture: function(context, canvas, image) {
            var dimensions = Cache.getInfo('dimensions');
            var ratio = image.width / image.height;
            var newWidth = dimensions.height * ratio;
            var newHeight = dimensions.width / ratio;
            var centerVertical = (dimensions.height - newHeight)/2;
            var centerHorizontal = (dimensions.width - newWidth)/2;
            context.clearRect(0,0,canvas.width,canvas.height);
            context.save();
            /*Expand to fit*/
            if(newHeight <= dimensions.height - 15) {
                context.drawImage(image,centerHorizontal, 0, newWidth, dimensions.height);
            }
            else if(newHeight >= dimensions.height + 15) {
                context.drawImage(image,0, centerVertical, dimensions.width, newHeight);
            }
            else {
                context.drawImage(image,0, 0, dimensions.width, dimensions.height);
            }
            context.restore();
        }
    }
});

services.factory('pushNotifications', function($log, $ionicPush, $q, Config, Cache) {
    return {
        init: function() {
            $ionicPush.init({
                "debug": true,
                "onNotification": function(notification) {
                    $log.debug("Notification Received: ", notification.payload);
                },
                "onRegister": function() {
                },
                "pluginConfig": Config.pushConfig
            });
        },
        register: function() {
            return $q(function(resolve) {
                $ionicPush.register(function(result) {
                    Cache.setInfo('token', result.token);
                    $ionicPush.saveToken(result);
                    resolve(result.token);
                });
            });
        }
    }
});

