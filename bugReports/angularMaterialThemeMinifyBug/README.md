# Test case for angular material bug

Encountered problem while trying to set Angular Material theme properties in my application.
Followed [instructions for configuring theme](https://material.angularjs.org/latest/#/Theming/03_configuring_a_theme)

```
angular.module('myApp', ['ngMaterial'])
.config(function($mdThemingProvider) {
  $mdThemingProvider.theme('default')
    .primaryPalette('pink')
    .accentPalette('orange');
});
```

But encountered error
```
Error: [$injector:modulerr] Failed to instantiate module MinifyBug due to:
[$injector:unpr] Unknown provider: e
http://errors.angularjs.org/1.4.5/$injector/unpr?p0=e
http://localhost:8000/application.js:8:630
http://localhost:8000/application.js:8:38004
r@http://localhost:8000/application.js:8:37173
i@http://localhost:8000/application.js:8:56549
r@http://localhost:8000/application.js:8:36565
http://localhost:8000/application.js:8:36685
o@http://localhost:8000/application.js:8:1296
f@http://localhost:8000/application.js:8:36462
Ze@http://localhost:8000/application.js:8:20455
s@http://localhost:8000/application.js:8:7930
ae@http://localhost:8000/application.js:8:8239
oe@http://localhost:8000/application.js:8:7487
http://localhost:8000/application.js:12:26790
r@http://localhost:8000/application.js:10:30346
n@http://localhost:8000/application.js:8:16862
http://errors.angularjs.org/1.4.5/$injector/modulerr?p0=MinifyBug&p1=%5B%24injector%3Aunpr%5D%20Unknown%20provider%3A%20e%0Ahttp%3A%2F%2Ferrors.angularjs.org%2F1.4.5%2F%24injector%2Funpr%3Fp0%3De%0Ahttp%3A%2F%2Flocalhost%3A8000%2Fapplication.js%3A8%3A630%0Ahttp%3A%2F%2Flocalhost%3A8000%2Fapplication.js%3A8%3A38004%0Ar%40http%3A%2F%2Flocalhost%3A8000%2Fapplication.js%3A8%3A37173%0Ai%40http%3A%2F%2Flocalhost%3A8000%2Fapplication.js%3A8%3A56549%0Ar%40http%3A%2F%2Flocalhost%3A8000%2Fapplication.js%3A8%3A36565%0Ahttp%3A%2F%2Flocalhost%3A8000%2Fapplication.js%3A8%3A36685%0Ao%40http%3A%2F%2Flocalhost%3A8000%2Fapplication.js%3A8%3A1296%0Af%40http%3A%2F%2Flocalhost%3A8000%2Fapplication.js%3A8%3A36462%0AZe%40http%3A%2F%2Flocalhost%3A8000%2Fapplication.js%3A8%3A20455%0As%40http%3A%2F%2Flocalhost%3A8000%2Fapplication.js%3A8%3A7930%0Aae%40http%3A%2F%2Flocalhost%3A8000%2Fapplication.js%3A8%3A8239%0Aoe%40http%3A%2F%2Flocalhost%3A8000%2Fapplication.js%3A8%3A7487%0Ahttp%3A%2F%2Flocalhost%3A8000%2Fapplication.js%3A12%3A26790%0Ar%40http%3A%2F%2Flocalhost%3A8000%2Fapplication.js%3A10%3A30346%0An%40http%3A%2F%2Flocalhost%3A8000%2Fapplication.js%3A8%3A16862
```

Application uses gulp and browserify to build. Isolated root cause to be the use of minification on the generated app.
In this test case provided, this can be demonstrated by commenting out line 43 `.pipe(uglify())`, and rebuilding the app.
In this case, the page loads fine without error.

It appears that the recommended way of changing the theme colors for material-angular is not compatible with minification.

This is noted in [other angular documention]()https://docs.angularjs.org/tutorial/step_05)

Is there a recommended way of setting theme colors that is minification friendly?

# FIXED

[Bug report](https://github.com/angular/material/issues/4383) yeilded guidance to use [gulp-ng-annotate](https://www.npmjs.com/package/gulp-ng-annotate).