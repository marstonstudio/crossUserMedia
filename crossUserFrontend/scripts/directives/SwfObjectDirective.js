var SwfObject  = require('jakobmattsson-swfobject');

// https://github.com/jeef3/angular-swfobject
module.exports = function ($log, $window, $timeout, $interval) {

    return {
        restrict: 'EAC',
        template: '<div id="{{id}}" ng-transclude></div>',
        transclude: true,
        scope: {
            isSwfVisible:'@swfVisible',
            vars: '=?swfVars',
            expressInstallSwfurl:'=?xiSwfUrlStr',
            swfLoad: '&'
        },
        link: function link(scope, element, attrs) {

            scope.id = attrs.swfId;

            if('swfVisible' in attrs) {
                if(attrs.swfVisible === 'false') {
                    SwfObject.switchOffAutoHideShow();
                }

                scope.$watch('isSwfVisible', function(newvalue, oldvalue){
                    element.css('visibility', (newvalue === 'true') ? 'visible' : 'hidden');
                });
            }

            var attributes = {
                id:scope.id,
                name:scope.id
            };

            var params = {
                bgcolor: attrs.swfBgcolor || '#FFFFFF',
                wmode: attrs.swfWmode || 'window',
                allowscriptaccess: 'always'
            };

            $timeout(function () {
                SwfObject.embedSWF(attrs.swfUrl,
                    scope.id,
                    attrs.swfWidth || 800,
                    attrs.swfHeight || 600,
                    attrs.swfVersion || '10',
                    scope.expressInstallSwfurl,
                    scope.vars,
                    params,
                    attributes,
                    embedHandler);
            }, 0);

            // http://learnswfobject.com/advanced-topics/executing-javascript-when-the-swf-has-finished-loading/
            function swfLoadEvent(evt, fn) {
                //This timeout ensures we don't try to access PercentLoaded too soon
                $timeout(function () {
                    //Ensure Flash Player's PercentLoaded method is available and returns a value
                    if (typeof evt.ref.PercentLoaded !== 'undefined' && evt.ref.PercentLoaded()) {
                        //Set up a timer to periodically check value of PercentLoaded
                        var loadCheckInterval = $interval(function () {
                            //Once value == 100 (fully loaded) we can do whatever we want
                            if (evt.ref.PercentLoaded() === 100) {
                                //Clear interval
                                $interval.cancel(loadCheckInterval);
                                loadCheckInterval = null;
                                //Execute function
                                fn({evt: evt});
                            }
                        }, 1500);
                    }
                }, 200);
            }

            // https://code.google.com/p/swfobject/wiki/api
            function embedHandler(evt) {
                if (scope.swfLoad && typeof(scope.swfLoad) === 'function') {
                    // if failure no reason to go and check if flash is 100% loaded
                    if (!evt.success || !evt.ref) {
                        scope.swfLoad({evt: evt});
                    } else {
                        swfLoadEvent(evt, scope.swfLoad);
                    }
                }

            }
        }
    };
};