module.exports = function() {
    var Service = {};
    var navigator = window.navigator;

    if (!navigator.getUserMedia) {
        navigator.getUserMedia =
            navigator.getUserMedia ||
            navigator.webkitGetUserMedia ||
            navigator.mozGetUserMedia ||
            navigator.msGetUserMedia;
    }

    window.navigator.getUserMedia = navigator.getUserMedia;

    Service.enabled = typeof navigator.getUserMedia === 'function';

    Service.getNavigator = function() {
        return window.navigator;
    };

    return Service;
};