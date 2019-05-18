'use strict';

angular.module('copayApp.services').factory('promptBackupService', function(storageService) {
    var root = {};


    /**
     * 获取首页提示备份状态
     * @param prompt
     * @param cb
     */
    root.get = function(cb) {
        storageService.getPrompt( function(err, ab) {
            if (!ab) return cb();
            return cb(ab);
        });
    };


    /**
     * 存储首页备份助记词状态
     * @param prompt
     * @param cb
     */
    root.set = function( cb) {
        console.log('prompt:');
            storageService.setPrompt( function() {
                root.get(function(err, ab) {
                    if(!ab) return;
                    return cb(err, ab);
                });
            });
    };


    return root;
});
