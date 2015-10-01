module.exports = function($window) {
    var Service = {};
    var navigator = $window.navigator;

    if (!navigator.getUserMedia) {
        navigator.getUserMedia =
            navigator.getUserMedia ||
            navigator.webkitGetUserMedia ||
            navigator.mozGetUserMedia;
    }

    $window.navigator.getUserMedia = navigator.getUserMedia;

    Service.enabled = typeof navigator.getUserMedia === 'function';

    Service.getNavigator = function() {
        return $window.navigator;
    };

    return Service;
};