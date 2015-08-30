var angular = require('angular');
var angularMaterial = require('angular-material');

angular.module('MinifyBug', ['ngMaterial'])
    .config(function($mdThemingProvider) {
        $mdThemingProvider.theme('purple')
            .primaryPalette('pink')
            .accentPalette('orange');
    }
);