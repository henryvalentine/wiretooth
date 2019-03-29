
"use strict";

define(['angularAMD', 'ngRoute','ngAnimate', 'ui.bootstrap', 'ui.bootstrap.tpls', 'angular-sanitize', 'ui.utils.masks','ngFileUpload', 'angularjs-dropdown-multiselect', 'angucomplete', 'ngIdle', 'btford.socket-io', 'ngCookies'], function (angularAMD)
{
    var serverRoot = 'http://127.0.0.1:4000/api/';
    var reseter = '';
    var app = angular.module("mainModule", ['ngRoute', 'ngAnimate', 'ui.bootstrap', 'ui.bootstrap.tpls', 'ngSanitize', 'ui.utils.masks', 'ngFileUpload','angularjs-dropdown-multiselect', 'angucomplete', 'ngIdle', 'btford.socket-io', 'ngCookies'])
    .config(['$routeProvider', function($routeProvider)
        {
            $routeProvider
                .when("/next", angularAMD.route({
                    templateUrl: function (rp) { return 'next/next.html'; },

                    resolve: {
                        load: ['$q', '$rootScope', '$location', function ($q, $rootScope, $location) {

                            var loadController = "next/next.js";

                            var deferred = $q.defer();
                            require([loadController], function ()
                            {
                                $rootScope.$apply(function ()
                                {
                                    deferred.resolve();
                                });
                            });
                            return deferred.promise;
                        }]
                    }
                }))
                .when("/etisHts", angularAMD.route({
                    templateUrl: function (rp) { return 'next/etisHts.html'; }

                    //resolve: {
                    //    load: ['$q', '$rootScope', '$location', function ($q, $rootScope, $location) {
                    //
                    //        var loadController = "next/next.js";
                    //
                    //        var deferred = $q.defer();
                    //        require([loadController], function ()
                    //        {
                    //            $rootScope.$apply(function ()
                    //            {
                    //                deferred.resolve();
                    //            });
                    //        });
                    //        return deferred.promise;
                    //    }]
                    //}
                }))
                .when("/walletUpdate", angularAMD.route({
                    templateUrl: function (rp) { return 'walletUpdate/walletUpdate.html'; },

                    resolve: {
                        load: ['$q', '$rootScope', '$location', function ($q, $rootScope, $location) {

                            var loadController = "walletUpdate/walletUpdate.js";

                            var deferred = $q.defer();
                            require([loadController], function ()
                            {
                                $rootScope.$apply(function ()
                                {
                                    deferred.resolve();
                                });
                            });
                            return deferred.promise;
                        }]
                    }
                }))
                .otherwise({redirectTo: '/next'});
        }])
    .factory('socket', ['$rootScope', 'socketFactory', function ($rootScope, socketFactory)
        {
            var sio = io.connect('http://localhost:4000');

            var socket = socketFactory({ ioSocket: sio });

            socket.forward('pong'); // Creates a $scope.$on event called 'socket:pong'

            return socket;

        }])
    .filter('propsFilter', function ()
    {
        return function(items, props) {
            var out = [];

            if (angular.isArray(items)) {
                items.forEach(function(item) {
                    var itemMatches = false;

                    var keys = Object.keys(props);
                    for (var i = 0; i < keys.length; i++) {
                        var prop = keys[i];
                        var text = props[prop].toLowerCase();
                        if (item[prop].toString().toLowerCase().indexOf(text) !== -1) {
                            itemMatches = true;
                            break;
                        }
                    }

                    if (itemMatches)
                    {
                        out.push(item);
                    }
                });
            } else {
                // Let the output be the input untouched
                out = items;
            }

            return out;
        };
    })
    .directive('validNumber', function () {
    return {
        require: '?ngModel',
        link: function (scope, element, attrs, ngModelCtrl) {
            if (!ngModelCtrl) {
                return;
            }

            ngModelCtrl.$parsers.push(function (val) {
                if (angular.isUndefined(val)) {
                    val = '';
                }
                var clean = val.replace(/[^0-9]+/g, '');
                if (val !== clean) {
                    ngModelCtrl.$setViewValue(clean);
                    ngModelCtrl.$render();
                }
                return clean;
            });

            element.bind('keypress', function (event) {
                if (event.keyCode === 32) {
                    event.preventDefault();
                }
            });
        }
    };
});

    var defaultController = function ($scope, $rootScope, $routeParams, Upload, $timeout, $location, Idle, Keepalive, $modal, $window, $http,socket, $cookies, $compile, $sce)
    {

        $scope.getVerificationStatus = function()
        {
            $scope.ver = {successful : $routeParams.successful, message : $routeParams.message};
        };

        $rootScope.sendWithSocket = function(ss)
        {
            socket.emit('message',ss);
        }

        socket.on("connect", function()
        {
            socket.on("Socket-Id", function(data)
            {
                //console.log("socket-Id : " + JSON.stringify(data));
            });

            //user session refreshed
            socket.on("refreshed", function(data)
            {
                refreshCompleted(data);
            });

            socket.on("call-connected", function(data)
            {
                alert('Call connected!');
                console.log("Call Connected Event: " + JSON.stringify(data));
            });

            socket.on("call-completed", function(data)
            {
                alert('Call completed!');
                console.log("Call Connected Event: " + JSON.stringify(data));
            });
        });

        //$rootScope.routes = ['callDv', 'msgDv', 'contactsDv'];
        $rootScope.activeRoute = 'callDv';
        $rootScope.goToUrl= function(r)
        {
            r = r.replace('/');
            angular.element('#' + $rootScope.activeRoute).hide();
            angular.element('#' + r).fadeIn();
            $rootScope.activeRoute = r;
        };
        $scope.transaction = {amount : ''};
        $rootScope.contact = {name : '', number: '', groupId : ''};
        $rootScope.busy = false;
        $scope.authUser = {phone : ''};
        $rootScope.contactGroups = [];
        $rootScope.massContact = {bulkGroup : {name : '', id:''}};
        $rootScope.wallet = {balance : '0.00', lastUpdated : '', userId : '', id : ''};

        $rootScope.closeFeedback = function()
        {
            angular.element('#feedback').hide();
            angular.element(".popUpBg").hide();
        };

        $rootScope.showCallLog = function()
        {
            angular.element("#callLog").fadeIn('fast');
        };

        $rootScope.closeCallLog = function()
        {
            angular.element('#callLog').hide();
        };

        $rootScope.showMessageLog = function()
        {
            angular.element(".popUpBg").show();
            angular.element("#messageLog").fadeIn('fast');
        };
        $rootScope.closeMessageLog = function()
        {
            angular.element('#messageLog').hide();
            angular.element(".popUpBg").hide();
        };

        $rootScope.showFdBack = function()
        {
            angular.element(".popUpBg").show();
            angular.element("#fdBakView").fadeIn('fast');
        };

        $rootScope.closeFdBack = function()
        {
            angular.element('#fdBakView').hide();
            angular.element(".popUpBg").hide();
        };

        $rootScope.showReach = function()
        {
            angular.element(".popUpBg").show();
            angular.element("#reach").fadeIn('fast');
        };
        $rootScope.closeReach = function()
        {
            angular.element('#reach').hide();
            angular.element(".popUpBg").hide();
        };

        $rootScope.showInvite = function()
        {
            angular.element(".popUpBg").show();
            angular.element("#invite").fadeIn('fast');
        };
        $rootScope.closeInvite = function()
        {
            angular.element('#invite').hide();
            angular.element(".popUpBg").hide();
        };

        $rootScope.closeAccess = function()
        {
            angular.element('#authSection').hide();
            angular.element(".popUpBg").hide();
        };

        $rootScope.showLoginForm = function()
        {
            angular.element(".popUpBg").show();
            angular.element("#authSection").fadeIn('fast');
        };

        $rootScope.showMore = function()
        {
            angular.element(".popUpBg").show();
            angular.element("#more").slideDown();
        };

        $rootScope.closeMore = function()
        {
            angular.element('#more').hide();
            angular.element(".popUpBg").hide();
        };

        $rootScope.showModal = function(template)
        {
            ngDialog.open({
                template: template,
                className: 'ngdialog-theme-flat',
                scope: $scope
            });
        };

        $scope.getUserInfo = function()
        {
            $rootScope.wallet = {balance : 0.00, lastUpdated : ''};
            $scope.signupAuth = {phone : '' , password : '', code : '', email : ''};
            $scope.auth = { email : '' , password : ''};
            $scope.passAuth = { email : ''};

            var user = {id:2};
            //communicationsService.getUserInfo(user, $scope.getUserInfoCompleted);

            $scope.AjaxGet(serverRoot + 'wallet/getUserWalletHistory?id=' + $rootScope.wallet.userId, $scope.getUserInfoCompleted);
        };

        $scope.getUserInfoCompleted = function(res)
        {
            if(res.code < 1)
            {
                $scope.histories = [];
                $rootScope.wallet = {balance : 0.00, lastUpdated : ''};
            }
            else
            {
                $scope.histories = res.history;
                $rootScope.wallet = {balance : res.wallet.balance, lastUpdated : res.wallet.lastUpdated};
            }
        };

        $scope.auth = function()
        {
            if($scope.authUser.phone == null || $scope.authUser.phone === undefined || $scope.authUser.phone.length < 1)
            {
                alert('Please provide your Phone number.');
                return;
            }

            if($scope.regCode == null || $scope.regCode === undefined || $scope.regCode.length < 1)
            {
                alert('Please provide your Phone number in this format +2348000000000.');
                return;
            }

            if($scope.authUser.password == null || $scope.authUser.password === undefined || $scope.authUser.password.length < 1)
            {
                alert('Please provide your password of at least 8 characters.');
                return;
            }

            if($scope.authUser.password < 8)
            {
                alert('Your password must be at least 8 characters wide.');
                return;
            }
            $scope.busy = true;
            $scope.processing = true;
            $scope.authUser.code = $scope.regCode;

            //communicationsService.auth($scope.authUser, authCompleted);

            $scope.AjaxPost($scope.authUser, serverRoot + 'access/auth', authCompleted);
        };

        function authCompleted (res)
        {
            $scope.busy = false;
            $scope.processing = false;
            if(res.code < 1)
            {
                alert(res.msg);
                return;
            }

            $rootScope.histories = res.history;
            res.wallet.id = res.id;
            $rootScope.wallet = res.wallet;

            // Setting a cookie
            $cookies.remove('wallet');
            $cookies.putObject('wallet', $rootScope.wallet);

            $scope.AjaxGet(serverRoot + 'contacts/getContacts?id=' + res.iiq, $rootScope.getContactsCompleted);

            $rootScope.closeAccess();

            //if the user is nuew on the system, display the 6 digits phone verification code
            if(res.isNew === true)
            {
                $rootScope.verMsg = res.val_code;
                $rootScope.regMsgInfo = 'Your registration was successful. To be able to place  make any communication on WireTooth, please verify your phone number by pressing';
                angular.element("#feedback").slideDown();

            }
            else{
                if(res.phoneVerifiedNow === true && res.val_code.length > 0)
                {
                    $rootScope.regMsgInfo = 'You are yet to verify your phone. To be able to make any communication on WireTooth, please verify your phone number by pressing';
                    $rootScope.verMsg = res.val_code;
                    angular.element("#feedback").slideDown();

                }

            }

            //Idle.watch();

        };

        //after user session refresh
        function refreshCompleted (res)
        {
            if(res.code < 1)
            {
                alert(res.msg);
                $scope.logout();
                return;
            }

            $rootScope.histories = res.history;
            res.wallet.id = res.id;
            $rootScope.wallet = res.wallet;

            // Setting a cookie
            $cookies.remove('wallet');
            $cookies.putObject('wallet', $rootScope.wallet);

            $scope.AjaxGet(serverRoot + 'contacts/getContacts?id=' + res.iiq, $rootScope.getContactsCompleted);

            //Idle.watch();

        };

        $rootScope.getContactsCompleted = function(data)
        {
            $rootScope.getCallLog();
            $rootScope.getGroups();
            if(data.code < 1)
            {
                return;
            }

            var tempId = 1;

            $rootScope.contacts = [];
            $rootScope.contactsTempate = [];

            angular.forEach(data.contacts, function(c, i)
            {
                if(c.name == null || c.name === undefined || c.name.trim().length < 1)
                {
                    c.name = c.phone;
                }
                $rootScope.contacts.push(c)
                tempId++;
            });

            $rootScope.contactsTempate = $rootScope.contacts;
        };

        $rootScope.showTips = function(contact)
        {
            angular.element('#cnt' + contact.id).fadeIn('fast');
        }

        $rootScope.hideTips = function(contact)
        {
            angular.element('#cnt' + contact.id).fadeOut('fast');
        }


        $rootScope.showCallTips = function(callId)
        {
            angular.element('#cll'+callId).fadeIn('fast');
        }

        $rootScope.hideCallTips = function(callId)
        {
            angular.element('#cll' +callId).fadeOut('fast');
        }


        $rootScope.showTip= function()
        {
            angular.element('#feedback').hide();
        };

        $rootScope.closeFeedback = function()
        {
            angular.element('#feedback').hide();
        };

        $scope.logout = function()
        {
            $rootScope.histories = null;
            $rootScope.contacts = null;
            $rootScope.closeMore();
            socket.emit('disconnect');
            $rootScope.wallet = {balance : '0.00', lastUpdated : '', iiq : '', id : ''};
            $rootScope.calls = [];
            $rootScope.callList = [];
            $rootScope.histories = [];
            $rootScope.contactGroups = [];
            $rootScope.messages = [];
            $cookies.remove('wallet');
        };

        $rootScope.setFile = function(el)
        {
            //var el = (e.srcElement || e.target);
            if (el.files == null)
            {
                return;
            }
            var files = el.files;
            if (files && files.length)
            {
                if(files[0].size > 1024000)
                {
                    alert('file must not exceed 1MB')
                    files[0] = null;
                    return;
                }
                $rootScope.sfile = files[0];
            }
            else
            {
                alert('file not selected');
            }
        };

        $scope.processBulkContact = function()
        {
            if($rootScope.wallet == null || $rootScope.wallet == undefined || $rootScope.wallet.userId == null || $rootScope.wallet.userId.length < 1)
            {
                $rootScope.closeContacts();
                $rootScope.showLoginForm();
                return;
            }

            if ($rootScope.sfile == null || $rootScope.sfile === undefined)
            {
                alert('Please select a file');
                return;
            }

            if ($rootScope.sfile == null || $rootScope.sfile === undefined)
            {
                alert('Please select a file');
                return;
            }

            if($rootScope.massContact.bulkGroup === null || $rootScope.massContact.bulkGroup.id.length < 1)
            {
                alert('Select contact group');
                return;
            }

            Upload.upload({
                url: 'http://localhost:3000/api/contacts/uploadContacts',
                data:
                {
                    file: $rootScope.sfile,
                    userId :  $rootScope.wallet.userId,
                    groupId : $rootScope.massContact.bulkGroup.id
                }
            }).progress(function(evt)
            {
                $rootScope.busy = true;
                //var progressPercentage = parseInt(100.0 * evt.loaded / evt.total);
                //console.log('progress: ' + progressPercentage + '% ' + evt.config.file.name);
            }).success(function(data, status, headers, config)
            {
                $rootScope.busy = false;
                $rootScope.fdback = data;

                if(data.code < 1)
                {
                    var feedback = {contactId : '', msg : '', errorList: [], contacts: [], groups: [], code : -1, groupId : ''};
                    if(data.errorList < 1)
                    {
                        $rootScope.closeContacts()
                        $rootScope.showFdBack();
                    }
                }
                else
                {
                    alert(data.msg);
                    angular.forEach(data.contacts, function(c, i)
                    {
                        $rootScope.contacts.push(c);
                    });
                    $rootScope.showFdBack();
                }
            });
        };

        $rootScope.previewImage = function (e)
        {
            var el = (e.srcElement || e.target);
            if (el.files == null)
            {
                return;
            }

            var file = el.files[0];
            if (file.size > 4096000)
            {
                alert('Image size must not exceed 4MB');
                return;
            }

            var extension = angular.element('#profileImg').val().split('.').popUp();
            var supportedImageFormats = new Array("png", "jpg", "bmp", "gif", "jpeg");
            if (supportedImageFormats.indexOf(extension) >= 0)
            {
                var reader = new FileReader();
                reader.onload = function (e)
                {
                    document.getElementById('profileImg').src = e.target.result;
                };
                reader.readAsDataURL(file);
            }
            else
            {
                alert('Unsupported image format');
                angular.element('#profPic').val('');
                return;
            }

        };

        $rootScope.getGoogleContacts = function (e)
        {
            $.ajax({
                type: "GET",
                url : 'https://www.google.com/m8/feeds/contacts/user.email@gmail.com/full?access_token=' + authToken + '&max-results=9999',
                dataType: "jsonp",
                success: function (xml)
                {
                    var userContacts = [];
                    $(xml).find('entry').each(function()
                    {
                        var name = '';
                        var number = '';
                        $(this).find("gd\\:phoneNumber").each(function()
                        {
                            number = $(this).text();
                        });
                        $(this).find("title").each(function(){
                            name = $(this).text();
                        });

                        if(number!=null && number.length>0)
                        {
                            number = number.replace(/[^0-9]/g,'');
                            userContacts.push(name+'-'+number);
                        }
                    });


                }
            });

        };

        $scope.getRegCode = function()
        {
            $scope.regCode = '';
            var number = $scope.authUser.phone.trim();
            var numberLength = number.length;
            if(numberLength > 0 )
            {
                var numSub = number.substring(0, 4);
                var numSub2 = number.substring(0, 3);
                var numSub3 = number.substring(0, 2);
                var numSub4 = number.substring(0, 1);
                var destinations = [];

                if(number.indexOf('+') > -1 && number !== '+')
                {
                    destinations = $rootScope.countries.filter(function(destination)
                    {
                        return destination.dial_code === numSub;
                    });

                    if(destinations.length < 1)
                    {
                        destinations = $rootScope.countries.filter(function(destination)
                        {
                            return destination.dial_code === numSub2;

                        });
                        if(destinations.length < 1)
                        {
                            destinations = $rootScope.countries.filter(function(destination)
                            {
                                return destination.dial_code === numSub3;

                            });
                            if(destinations.length < 1)
                            {
                                destinations = $rootScope.countries.filter(function(destination)
                                {
                                    return destination.dial_code === numSub4;

                                });
                            }
                            else
                            {
                                $scope.regCode = destinations[0].dial_code;
                            }
                        }
                    }
                    else
                    {
                        $scope.regCode = destinations[0].dial_code;
                    }
                }

                else
                {
                    $scope.regCode = '';

                }
            }

        };

        $rootScope.getGroups = function()
        {
            var user = {id:$rootScope.wallet.userId};
            //communicationsService.getGroups(user, $scope.getGroupsCompleted);

            $scope.AjaxGet(serverRoot + 'contacts/getGroups?id=' + $rootScope.wallet.userId, $scope.getGroupsCompleted);
        };

        $scope.getGroupsCompleted = function(res)
        {
            $rootScope.contactGroups = [];
            $rootScope.contactGroups = res.groups;
        };

        //Normalization

        $rootScope.getDestinationCode = function(number)
        {
            var numberLength = number.length;
            var destination = {dial_code: "", code: "", name: "Unknown", flg_src : 'img/noImage.png'};
            if(numberLength > 0 )
            {
                var numSub = number.substring(0, 4);
                var numSub2 = number.substring(0, 3);
                var numSub3 = number.substring(0, 2);
                var numSub4 = number.substring(0, 1);
                var destinations = [];

                if(number.indexOf('+') > -1 && number !== '+')
                {
                    destinations = $rootScope.countries.filter(function(destination)
                    {
                        return destination.dial_code === numSub;
                    });

                    if(destinations.length < 1)
                    {
                        destinations = $rootScope.countries.filter(function(destination)
                        {
                            return destination.dial_code === numSub2;

                        });
                        if(destinations.length < 1)
                        {
                            destinations = $rootScope.countries.filter(function(destination)
                            {
                                return destination.dial_code === numSub3;

                            });
                            if(destinations.length < 1)
                            {
                                destinations = $rootScope.countries.filter(function(destination)
                                {
                                    return destination.dial_code === numSub4;

                                });
                            }
                            else
                            {
                                destination.flg_src = 'img/noImage.png';
                                $rootScope.lInfo = destination;
                                return destination;
                            }
                        }
                    }
                    if(destinations.length > 0)
                    {
                        destination = destinations[0];
                        destination.flg_src = 'img/flags/' + destination.code.toLowerCase() + '.svg';
                        $rootScope.lInfo = destination;
                        return destination;
                    }
                    else
                    {
                        destination = $rootScope.defaultLocation.country;
                        destination.flg_src = $rootScope.defaultLocation.defaultFlag;
                        $rootScope.lInfo = destination;
                        return destination;
                    }
                }

                else
                {
                    destination = $rootScope.defaultLocation.country;
                    destination.flg_src = $rootScope.defaultLocation.defaultFlag;
                    $rootScope.lInfo = destination;
                    return destination;

                }
            }
            //else
            //{
            //  $rootScope.destinationCountry = $scope.destinationCountry_local;
            //  $rootScope.flg_src =  $rootScope.local_src;
            //}
        };

        $rootScope.loadCountries = function()
        {
            //var countries = countryService.getCountries();
            var countries = $rootScope.getCountries();
            angular.forEach(countries, function(c, i)
            {
                c.name = c.name + '(' + c.dial_code + ')';

            });

            $rootScope.countries = countries;

            $scope.AjaxVanilla("//freegeoip.net/json/", geoSuccessCallBack);
            $scope.AjaxGet(serverRoot + 'contacts/getContacts?id=' + 5, $rootScope.getContactsCompleted);
            var userInfo = $cookies.getObject('wallet');
            if(userInfo !== undefined && userInfo !== null)
            {
                if(userInfo.id.length > 0)
                {
                    //refresh user session
                    $rootScope.wallet = userInfo;
                    socket.emit('refreshProfile',userInfo.userId);

                }
            }
        };

        $rootScope.defaultLocation = {country : {}, dialCode : '', defaultFlag : 'img/noImage.png' , ip : '' };

        function geoSuccessCallBack(res)
        {

            angular.forEach($rootScope.countries, function(c, i)
            {
                if(c.code === res.country_code)
                {
                    $rootScope.defaultLocation = {country : c, dialCode : c.dial_code, defaultFlag : 'img/flags/' + c.code.toLowerCase() + '.svg' , ip : res.ip };
                    c.flg_src = 'img/flags/' + c.code.toLowerCase() + '.svg';
                    $rootScope.lInfo = c;
                    //if($rootScope.wallet != null && $rootScope.wallet !== undefined && $rootScope.wallet.userId !== null && $rootScope.wallet.userId.length > 0)
                    //{
                    //    $rootScope.getToken()
                    //}

                }
            });
        }

        $rootScope.getCallLog = function()
        {
            var user = {id:$rootScope.wallet.userId};

            $scope.AjaxGet(serverRoot + 'communications/getCalls?id=' + $rootScope.wallet.userId, $scope.getCallLogCompleted);
        };
        var cllStr = '';
        $scope.getCallLogCompleted = function(res)
        {
            $rootScope.getMessageLog();

            //DISPLAY THE NAME OF CALLED CONTACTS OR THERE NUMBERS DEPENDING ON AVAILABILITY
            if($rootScope.contacts.length > 0)
            {
                angular.forEach(res.calls, function(call, i)
                {
                    var called = $rootScope.contacts.filter(function(d)
                    {
                        return d.number === call.recipient;
                    });

                    if(called.length > 0)
                    {
                        call.name = called[0].name;
                    }
                    else
                    {
                        //IF CALL WAS TO NON-CONTACT, ASSIGN RECIPIENT TO CALLED NAME
                        call.name = call.recipient;
                    }

                    cllStr += '<li class="row" id="rec-'+call.callId+'" style="border-bottom: 1px solid #e0e0e0">' +
                    '<di class="col-md-12"><a style="margin-top: 1%;color:#888"><div class="row">'+call.name+'</div><div class="row">'+call.startTime+'</div><div class="row">'+call.duration+' secs</div></a></di>' +
                    '<ul style="display: none; background-color: #fff" id="cll'+call.callId+'" class="call-controls"><li style="font-size:1.2em; float: left">' +
                    '<a ng-click="callFlashContact(\''+call.recipient+'\')" title="Call" class="icon ion-android-call"  style="color: #000"></a>&nbsp;&nbsp;</li><li style="font-size:1.2em; float: left; margin-left: 8px; color: #000">' +
                    '<a ng-click="deleteCall(\''+call.callId+'\')" title="Delete call" style="color: #000" class="icon ion-android-delete"></a></li></ul></li>';
                });
            }

            $rootScope.calls = res.calls;
            $rootScope.callList = res.calls;
            angular.element('#callRecs').append($compile(cllStr)($rootScope));
            setTips();
        };

        function showTip(id)
        {
            $('#cll'+id).fadeIn('fast');
        }
        function hideTip(id)
        {
            $('#cll' +id).fadeOut('fast');
        }

        function setTips()
        {
            var liCollection = angular.element('li[id^="rec-"]');
            angular.forEach(liCollection, function (el, i)
            {
                var element = angular.element(el);
                element.on('mouseenter',function ()
                {
                    showTip(element.attr('id').replace('rec-',''))
                }).on('mouseleave',function()
                {
                    hideTip(element.attr('id').replace('rec-',''))
                });
            });
        };

        $rootScope.getMessageLog = function()
        {
            if($rootScope.wallet == null || $rootScope.wallet == undefined || $rootScope.wallet.userId == null || $rootScope.wallet.userId.length < 1)
            {
                return;
            }

            var user = {id:$rootScope.wallet.userId};
            //communicationsService.getMessageLog(user, $scope.getMessageLogCompleted);

            $scope.AjaxGet(serverRoot + 'communications/getMessages?id=' + $rootScope.wallet.userId, $scope.getMessageLogCompleted);
        };

        $scope.getMessageLogCompleted = function(res)
        {
            $rootScope.messages = res.messages;
        };

        //$rootScope.inviteFriends = function()
        //{
        //    var user = {id:$rootScope.wallet.userId};
        //
        //    $scope.AjaxGet(serverRoot + 'misc/feedback', $scope.getCallLogCompleted);
        //};
        //
        //$scope.inviteFriendsCompleted = function(res)
        //{
        //    $rootScope.messages = res;
        //};

        $rootScope.reach = {email : '', message : ''}

        $rootScope.contactUs = function()
        {
            if($rootScope.reach == null)
            {
                alert('Your request could not be completed at this time. Please try again later.');
                return;
            }

            if($rootScope.reach.email.trim().length < 1)
            {
                alert('Please provide your valid email for feedback.');
                return;
            }

            if($rootScope.reach.message.trim().length < 1)
            {
                alert('Please provide your message.');
                return;
            }

            $scope.AjaxPost($rootScope.reach, serverRoot + 'misc/feedback', $scope.contactUsCompleted);
        };

        $scope.contactUsCompleted = function(res)
        {
            alert(res.msg);
            if(res == null || res.code < 1)
            {
                return;
            }
            $rootScope.closeReach();
            $rootScope.reach = {email : '', message : ''}
        };

        $rootScope.invite = {email: '' };

        $rootScope.inviteFriends = function()
        {
            if($rootScope.invite == null)
            {
                alert('Your request could not be completed at this time. Please try again later.');
                return;
            }

            if($rootScope.invite.email.trim().length < 1)
            {
                alert("Please provide your friend's valid email.");
                return;
            }
            $scope.AjaxPost($rootScope.invite, serverRoot + 'misc/invite', $scope.inviteFriendCompleted);
        };

        $scope.inviteFriendCompleted = function(res)
        {
            alert(res.msg);
            if(res == null || res.code < 1)
            {
                return;
            }
            $rootScope.closeInvite();
            $rootScope.invite = {email: '' };
        };

        /*POSTS, GETS*/

        $scope.AjaxGet = function (route, successFunction)
        {
            setTimeout(function() {
                $http({ method: 'GET', url: route }).success(function (response)
                {
                    successFunction(response);
                });
            }, 1);

        };

        $scope.AjaxPost = function (data, route, callbackFunction)
        {
            $http.post(route, data).success(function (response)
            {
                callbackFunction(response, status);
            });
        };


        $scope.AjaxVanilla = function (route, callback)
        {
            var xhr = new XMLHttpRequest();
            xhr.open("GET", route, true);
            xhr.withCredentials = true;
            xhr.onload = function (res)
            {
                callback(JSON.parse(xhr.responseText))
            };
            xhr.send();
        };

        /*$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$*/

        var countries = [{"dial_code": "+972", "code": "IL", "name": "Israel"}, {"dial_code": "+93", "code": "AF", "name":
            "Afghanistan"},{"dial_code": "+355", "code": "AL", "name": "Albania"},  {"dial_code": "+213", "code":
            "DZ", "name": "Algeria"},  {"dial_code": "+1684", "code": "AS", "name": "American Samoa"},
            {"dial_code": "+376", "code": "AD", "name": "Andorra"}, {"dial_code": "+244", "code": "AO", "name": "Angola"}, {"dial_code": "+1264", "code": "AI", "name": "Anguilla"},
            {"dial_code": "+1268", "code": "AG", "name": "Antigua and Barbuda"}, {"dial_code": "+54", "code":
                "AR", "name": "Argentina"}, {"dial_code": "+374", "code": "AM", "name": "Armenia"},
            {"dial_code":
                "+297", "code": "AW", "name": "Aruba"}, {"dial_code": "+61", "code": "AU", "name":
                "Australia"},
            {"dial_code": "+43", "code": "AT", "name": "Austria"}, {"dial_code": "+994", "code":
                "AZ", "name": "Azerbaijan"}, {"dial_code": "+1242", "code": "BS", "name": "Bahamas"},
            {"dial_code":
                "+973", "code": "BH", "name": "Bahrain"}, {"dial_code": "+880", "code": "BD",
                "name": "Bangladesh"}, {"dial_code": "+1246", "code": "BB", "name": "Barbados"},
            {"dial_code":
                "+375", "code": "BY", "name": "Belarus"}, {"dial_code": "+32", "code": "BE", "name":
                "Belgium"}, {"dial_code": "+501", "code": "BZ", "name": "Belize"}, {"dial_code": "+229", "code":
                "BJ", "name": "Benin"}, {"dial_code": "+1441", "code": "BM", "name": "Bermuda"},
            {"dial_code":
                "+975", "code": "BT", "name": "Bhutan"}, {"dial_code": "+387", "code": "BA",
                "name": "Bosnia and Herzegovina"}, {"dial_code": "+267", "code": "BW",
                "name": "Botswana"}, {"dial_code": "+55", "code": "BR", "name": "Brazil"},
            {"dial_code":
                "+246", "code": "IO", "name": "British Indian Ocean Territory"},
            {"dial_code":
                "+359", "code": "BG", "name": "Bulgaria"}, {"dial_code": "+226", "code": "BF",
                "name": "Burkina Faso"}, {"dial_code": "+257", "code": "BI", "name": "Burundi"},
            {"dial_code":
                "+855", "code": "KH", "name": "Cambodia"}, {"dial_code": "+237", "code": "CM",
                "name": "Cameroon"}, {"dial_code": "+1", "code": "CA", "name": "Canada"}, {"dial_code": "+238",
                "code": "CV", "name": "Cape Verde"}, {"dial_code": "+ 345", "code": "KY",
                "name": "Cayman Islands"}, {"dial_code": "+236", "code": "CF", "name": "Central African Republic"}, {"dial_code": "+235", "code": "TD", "name": "Chad"}, {"dial_code": "+56", "code":
                "CL", "name": "Chile"}, {"dial_code": "+86", "code": "CN", "name": "China"}, {"dial_code": "+61",
                "code": "CX", "name": "Christmas Island"}, {"dial_code": "+57", "code": "CO", "name":
                "Colombia"}, {"dial_code": "+269", "code": "KM", "name": "Comoros"}, {"dial_code": "+242", "code":
                "CG", "name": "Congo"}, {"dial_code": "+682", "code": "CK", "name": "Cook Islands"}, {"dial_code": "+506", "code": "CR", "name": "Costa Rica"}, {"dial_code": "+385",
                "code": "HR", "name": "Croatia"}, {"dial_code": "+53", "code": "CU", "name":
                "Cuba"}, {"dial_code": "+537", "code": "CY", "name": "Cyprus"}, {"dial_code": "+420", "code":
                "CZ", "name": "Czech Republic"},  {"dial_code": "+45", "code": "DK", "name":
                "Denmark"}, {"dial_code": "+253", "code": "DJ", "name": "Djibouti"}, {"dial_code": "+1 767", "code":
                "DM", "name": "Dominica"},  {"dial_code": "+1 849", "code": "DO", "name": "Dominican Republic"}, {"dial_code": "+593", "code": "EC", "name": "Ecuador"}, {"dial_code": "+20", "code":
                "EG", "name": "Egypt"}, {"dial_code": "+503", "code": "SV", "name": "El Salvador"},
            {"dial_code": "+240", "code": "GQ", "name": "Equatorial Guinea"}, {"dial_code": "+291", "code":
                "ER", "name": "Eritrea"}, {"dial_code": "+372", "code": "EE", "name": "Estonia"},
            {"dial_code":"+251", "code": "ET", "name": "Ethiopia"}, {"dial_code": "+298", "code": "FO","name": "Faroe Islands"}, {"dial_code": "+679", "code": "FJ", "name": "Fiji"}, {"dial_code": "+358",
                "code": "FI", "name": "Finland"},  {"dial_code": "+33", "code": "FR", "name":
                "France"}, {"dial_code": "+594", "code": "GF", "name": "French Guiana"}, {"dial_code": "+689",
                "code": "PF", "name": "French Polynesia"}, {"dial_code": "+241", "code": "GA",
                "name": "Gabon"}, {"dial_code": "+220", "code": "GM", "name": "Gambia"},
            {"dial_code": "+995", "code":
                "GE", "name": "Georgia"}, {"dial_code": "+49", "code": "DE", "name": "Germany"},
            {"dial_code": "+233", "code": "GH", "name": "Ghana"}, {"dial_code": "+350", "code": "GI",
                "name": "Gibraltar"}, {"dial_code": "+30", "code": "GR", "name": "Greece"}, {"dial_code":
                "+299", "code": "GL", "name": "Greenland"}, {"dial_code": "+1473", "code": "GD",
                "name": "Grenada"},
            {"dial_code": "+590", "code": "GP", "name": "Guadeloupe"}, {"dial_code": "+1671",
                "code": "GU", "name": "Guam"}, {"dial_code": "+502", "code": "GT",
                "name": "Guatemala"}, {"dial_code": "+224", "code": "GN", "name": "Guinea"},
            {"dial_code": "+245", "code": "GW", "name": "Guinea-Bissau"}, {"dial_code": "+595", "code": "GY",
                "name": "Guyana"}, {"dial_code": "+509", "code": "HT", "name": "Haiti"}, {"dial_code": "+504", "code":
                "HN", "name": "Honduras"}, {"dial_code": "+36", "code": "HU", "name": "Hungary"}, {"dial_code":
                "+354", "code": "IS", "name": "Iceland"}, {"dial_code": "+91", "code": "IN", "name":
                "India"}, {"dial_code": "+62", "code": "ID", "name": "Indonesia"}, {"dial_code": "+964", "code":
                "IQ", "name": "Iraq"}, {"dial_code": "+353", "code": "IE", "name": "Ireland"},
            {"dial_code": "+972", "code": "IL", "name": "Israel"}, {"dial_code": "+39", "code": "IT", "name":
                "Italy"}, {"dial_code": "+1 876", "code": "JM", "name": "Jamaica"}, {"dial_code": "+81",
                "code": "JP", "name": "Japan"}, {"dial_code": "+962", "code": "JO",
                "name": "Jordan"}, {"dial_code": "+77", "code": "KZ", "name": "Kazakhstan"}, {"dial_code": "+254",
                "code": "KE", "name": "Kenya"}, {"dial_code": "+686", "code": "KI",
                "name": "Kiribati"}, {"dial_code": "+965", "code": "KW", "name": "Kuwait"},
            {"dial_code":
                "+996", "code": "KG", "name": "Kyrgyzstan"}, {"dial_code": "+371", "code": "LV",
                "name": "Latvia"}, {"dial_code": "+961", "code": "LB", "name": "Lebanon"}, {"dial_code": "+266", "code":
                "LS", "name": "Lesotho"}, {"dial_code": "+231", "code": "LR", "name": "Liberia"},
            {"dial_code": "+423", "code": "LI", "name": "Liechtenstein"}, {"dial_code": "+370", "code": "LT",
                "name": "Lithuania"}, {"dial_code": "+352", "code": "LU", "name": "Luxembourg"},
            {"dial_code": "+261", "code": "MG", "name": "Madagascar"}, {"dial_code": "+265", "code": "MW",
                "name": "Malawi"}, {"dial_code": "+60", "code": "MY", "name": "Malaysia"}, {"dial_code": "+960", "code":
                "MV", "name": "Maldives"}, {"dial_code": "+223", "code": "ML", "name": "Mali"}, {"dial_code": "+356",
                "code": "MT", "name": "Malta"}, {"dial_code": "+692", "code": "MH",
                "name": "Marshall Islands"}, {"dial_code": "+596", "code": "MQ", "name": "Martinique"},
            {"dial_code": "+222", "code": "MR", "name": "Mauritania"},{"dial_code": "+230", "code": "MU",
                "name": "Mauritius"}, {"dial_code": "+262", "code": "YT", "name": "Mayotte"},
            {"dial_code": "+52", "code": "MX", "name": "Mexico"}, {"dial_code": "+377", "code": "MC", "name": "Monaco"}, {"dial_code": "+976", "code": "MN", "name": "Mongolia"},
            {"dial_code": "+382", "code": "ME", "name": "Montenegro"}, {"dial_code": "+1664", "code": "MS", "name": "Montserrat"},
            {"dial_code": "+212", "code": "MA", "name": "Morocco"}, {"dial_code": "+95", "code": "MM", "name":
                "Myanmar"}, {"dial_code": "+264", "code": "NA", "name": "Namibia"}, {"dial_code": "+674", "code":
                "NR", "name": "Nauru"}, {"dial_code": "+977", "code": "NP", "name": "Nepal"},
            {"dial_code": "+31",
                "code": "NL", "name": "Netherlands"}, {"dial_code": "+599", "code": "AN",
                "name": "Netherlands Antilles"}, {"dial_code": "+687", "code": "NC",
                "name": "New Caledonia"}, {"dial_code": "+64", "code": "NZ", "name": "New Zealand"},
            {"dial_code":
                "+505", "code": "NI", "name": "Nicaragua"}, {"dial_code": "+227", "code": "NE",
                "name": "Niger"}, {"dial_code": "+234", "code": "NG", "name": "Nigeria"}, {"dial_code": "+683", "code":
                "NU", "name": "Niue"}, {"dial_code": "+672", "code": "NF", "name": "Norfolk Island"}, {"dial_code": "+1670", "code": "MP", "name": "Northern Mariana Islands"}, {"dial_code": "+47", "code": "NO", "name": "Norway"}, {"dial_code": "+968", "code":
                "OM", "name": "Oman"}, {"dial_code": "+92", "code": "PK", "name": "Pakistan"},
            {"dial_code": "+680", "code": "PW", "name": "Palau"}, {"dial_code": "+507", "code": "PA",
                "name": "Panama"}, {"dial_code": "+675", "code": "PG", "name": "Papua New Guinea"},
            {"dial_code": "+595", "code": "PY", "name": "Paraguay"}, {"dial_code": "+51", "code": "PE", "name":
                "Peru"}, {"dial_code": "+63", "code": "PH", "name": "Philippines"}, {"dial_code": "+48",
                "code": "PL", "name": "Poland"}, {"dial_code": "+351", "code": "PT",
                "name": "Portugal"}, {"dial_code": "+1939", "code": "PR", "name": "Puerto Rico"}, {"dial_code": "+974", "code": "QA", "name": "Qatar"}, {"dial_code": "+40", "code":
                "RO", "name": "Romania"}, {"dial_code": "+250", "code": "RW", "name": "Rwanda"},
            {"dial_code": "+685", "code": "WS", "name": "Samoa"}, {"dial_code": "+378", "code": "SM",
                "name": "San Marino"}, {"dial_code": "+966", "code": "SA", "name": "Saudi Arabia"}, {"dial_code": "+221", "code": "SN", "name": "Senegal"}, {"dial_code": "+381", "code":
                "RS", "name": "Serbia"}, {"dial_code": "+248", "code": "SC", "name": "Seychelles"},
            {"dial_code": "+232", "code": "SL", "name": "Sierra Leone"}, {"dial_code": "+65", "code": "SG", "name":
                "Singapore"}, {"dial_code": "+421", "code": "SK", "name": "Slovakia"}, {"dial_code": "+386", "code":
                "SI", "name": "Slovenia"}, {"dial_code": "+677", "code": "SB", "name": "Solomon Islands"}, {"dial_code": "+27", "code": "ZA", "name": "South Africa"}, {"dial_code": "+500",
                "code": "GS", "name": "South Georgia and the South Sandwich Islands"}, {"dial_code": "+34", "code": "ES", "name": "Spain"}, {"dial_code": "+94", "code":
                "LK", "name": "Sri Lanka"}, {"dial_code": "+249", "code": "SD", "name": "Sudan"},
            {"dial_code":
                "+597", "code": "SR", "name": "Suriname"}, {"dial_code": "+268", "code": "SZ",
                "name": "Swaziland"}, {"dial_code": "+46", "code": "SE", "name": "Sweden"},
            {"dial_code": "+41",
                "code": "CH", "name": "Switzerland"}, {"dial_code": "+992", "code": "TJ",
                "name": "Tajikistan"}, {"dial_code": "+66", "code": "TH", "name": "Thailand"},
            {"dial_code": "+228", "code": "TG", "name": "Togo"}, {"dial_code": "+690", "code": "TK",
                "name": "Tokelau"}, {"dial_code": "+676", "code": "TO", "name": "Tonga"}, {"dial_code": "+1868", "code":
                "TT", "name": "Trinidad and Tobago"}, {"dial_code": "+216", "code": "TN",
                "name": "Tunisia"}, {"dial_code": "+90", "code": "TR", "name": "Turkey"}, {"dial_code": "+993", "code":
                "TM", "name": "Turkmenistan"}, {"dial_code": "+1649", "code": "TC",
                "name": "Turks and Caicos Islands"}, {"dial_code": "+688", "code": "TV",
                "name": "Tuvalu"}, {"dial_code": "+256", "code": "UG", "name": "Uganda"}, {"dial_code": "+380", "code":
                "UA", "name": "Ukraine"}, {"dial_code": "+971", "code": "AE", "name": "United Arab Emirates"}, {"dial_code": "+44", "code": "GB", "name": "United Kingdom"}, {"dial_code": "+1", "code":
                "US", "name": "United States"}, {"dial_code": "+598", "code": "UY",
                "name": "Uruguay"}, {"dial_code": "+998", "code": "UZ", "name": "Uzbekistan"}, {"dial_code": "+678",
                "code": "VU", "name": "Vanuatu"}, {"dial_code": "+681", "code": "WF",
                "name": "Wallis and Futuna"}, {"dial_code": "+967", "code": "YE", "name": "Yemen"},{"dial_code":
                "+260", "code": "ZM", "name": "Zambia"}, {"dial_code": "+263", "code": "ZW",
                "name": "Zimbabwe"}, {"dial_code": "", "code": "AX", "name": "\u00c5land Islands"}, {"dial_code": null, "code": "AQ", "name": "Antarctica"}, {"dial_code": "+591", "code":
                "BO", "name": "Bolivia, Plurinational State of"}, {"dial_code": "+673", "code":
                "BN", "name": "Brunei Darussalam"}, {"dial_code": "+61", "code": "CC", "name":
                "Cocos (Keeling) Islands"}, {"dial_code": "+243", "code": "CD", "name": "Congo, The Democratic Republic of the"}, {"dial_code": "+225", "code": "CI", "name": "C\u00f4te d'Ivoire"}, {"dial_code": "+500", "code": "FK", "name": "Falkland Islands(Malvinas)"}, {"dial_code": "+44", "code": "GG", "name": "Guernsey"}, {"dial_code": "+379", "code":
                "VA", "name": "Holy See (Vatican City State)"},{"dial_code": "+852", "code": "HK",
                "name": "Hong Kong"}, {"dial_code": "+98", "code": "IR", "name": "Iran, Islamic Republic of"}, {"dial_code": "+44", "code": "IM", "name": "Isle of Man"}, {"dial_code": "+44",
                "code": "JE", "name": "Jersey"}, {"dial_code": "+850", "code": "KP",
                "name": "Korea, Democratic People's Republic of"}, {"dial_code": "+82", "code":
                "KR", "name": "Korea, Republic of"}, {"dial_code": "+856", "code": "LA",
                "name": "Lao People's Democratic Republic"}, {"dial_code": "+218", "code": "LY",
                "name": "Libyan Arab Jamahiriya"}, {"dial_code": "+853", "code": "MO",
                "name": "Macao"}, {"dial_code": "+389", "code": "MK", "name": "Macedonia, The Former Yugoslav Republic of"}, {"dial_code": "+691", "code": "FM", "name": "Micronesia, Federated States of"}, {"dial_code": "+373", "code": "MD", "name": "Moldova, Republic of"}, {"dial_code": "+258", "code": "MZ", "name": "Mozambique"}, {"dial_code": "+970",
                "code": "PS", "name": "Palestinian Territory, Occupied"}, {"dial_code": "+872",
                "code": "PN", "name": "Pitcairn"}, {"dial_code": "+262", "code": "RE",
                "name": "R\u00e9union"}, {"dial_code": "+7", "code": "RU", "name": "Russia"}, {"dial_code": "+590",
                "code": "BL", "name": "Saint Barth\u00e9lemy"}, {"dial_code": "+290", "code": "SH",
                "name": "Saint Helena, Ascension and Tristan Da Cunha"},
            {"dial_code": "+1869", "code": "KN", "name": "Saint Kitts and Nevis"},  {"dial_code": "+1758", "code": "LC",
                "name": "Saint Lucia"},  {"dial_code": "+590", "code": "MF", "name": "Saint Martin"},
            {"dial_code": "+508", "code": "PM", "name": "Saint Pierre and Miquelon"},
            {"dial_code": "+1784", "code": "VC", "name": "Saint Vincent and the Grenadines"},
            {"dial_code": "+239", "code": "ST", "name": "Sao Tome and Principe"}, {"dial_code":
                "+252", "code": "SO", "name": "Somalia"},   {"dial_code": "+47", "code": "SJ", "name":
                "Svalbard and Jan Mayen"}, {"dial_code": "+963", "code": "SY", "name": "Syrian Arab Republic"}, {"dial_code": "+886", "code": "TW", "name": "Taiwan, Province of China"}, {"dial_code": "+255", "code": "TZ", "name": "Tanzania, United Republic of"},   {"dial_code": "+670", "code": "TL", "name": "Timor-Leste"},  {"dial_code": "+58", "code": "VE", "name":
                "Venezuela, Bolivarian Republic of"},  {"dial_code": "+84", "code": "VN", "name":
                "Viet Nam"}, {"dial_code": "+1284", "code": "VG", "name": "Virgin Islands, British"}, {"dial_code": "+1340", "code": "VI", "name": "Virgin Islands, U.S."}];


        $rootScope.getCountries = function()
        {
            return countries;
        };

        $rootScope.getCountry = function (countryCode)
        {
            return countries['code'] == countryCode;
        }
    };
    defaultController.$inject = ['$scope','$rootScope','$routeParams', 'Upload', '$timeout', '$location', 'Idle', 'Keepalive', '$modal', '$window', '$http','socket', '$cookies', '$compile', '$sce']; //'socket',
    app.controller("defaultController", defaultController);

    angularAMD.bootstrap(app);
    return app;
});
