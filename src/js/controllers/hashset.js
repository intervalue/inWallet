'use strict';

angular.module('copayApp.controllers').controller('hashsetController',
    function($scope, $timeout, $state) {
        var self = this;
        self.hashsetshow = false;
        self.submitset = function(){
            self.hashsetshow = true;
        }
    })