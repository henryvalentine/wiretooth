
"use strict";
require.config({
    baseUrl: "",

    // alias libraries paths
    paths: {
        'wireTooth': 'wireTooth',
        'angular': 'bower_components/angular/angular',
        'btford.socket-io': 'bower_components/angular-socket-io/socket',
        'ngIdle': 'scripts/angular-idle.min',
        'ngRoute': 'bower_components/angular-route/angular-route.min',
        'ngAnimate': 'bower_components/angular-animate/angular-animate.min',
        'ui.bootstrap': 'bower_components/angular-bootstrap/ui-bootstrap.min',
        'ui.bootstrap.tpls': 'bower_components/angular-bootstrap/ui-bootstrap-tpls.min',
        'angularjs-dropdown-multiselect' : 'bower_components/angularjs-dropdown-multiselect/src/angularjs-dropdown-multiselect',
        'angularAMD': 'scripts/angularAMD',
        'ngFileUpload': 'bower_components/ng-file-upload/ng-file-upload.min',
        'fileReader': 'scripts/fileReader',
        'ui.utils.masks': 'scripts/masks',
        'ngResource' : 'bower_components/angular-resource/angular-resource.min',
        'angucomplete' : 'scripts/angucomplete',
        'ngCookies' : 'bower_components/angular-cookies/angular-cookies.min',
        
        //SERVICES
        'communicationsService': 'services/communicationServices',
        'locationService': 'services/locationServices',
        'countryService': 'services/countriesServices',

        'angular-sanitize': 'scripts/angular-sanitize.min'
    },

    // Add angular modules that does not support AMD out of the box, put it in a shim
    shim: {

        'fileupload-shim': ['angular'],
        'fileupload': ['angular'],
        'angularAMD': ['angular'],
        'ngRoute': ['angular'],
        'ngAnimate': ['angular'],
        'angular-sanitize': ['angular'],
        'bootstrap': ['angular'],
        'ui.bootstrap': ['angular'],
        'ui.bootstrap.tpls': ['angular'],
        'ngIdle': ['angular'],
        'ngFileUpload': ['angular'],
        'fileReader': ['angular'],
        'angularjs-dropdown-multiselect': ['angular'],
        'ngStorage': ['angular'],
        'ui.utils.masks': ['angular'],
        'angucomplete' : ['angular'],
        'btford.socket-io': ['angular'],
        'ngCookies' : ['angular']
    },

    // kick start application
    deps: ['wireTooth']
});
