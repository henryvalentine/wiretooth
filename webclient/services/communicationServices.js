var serverRoot = 'http://localhost:3000/api/';

define(['wireTooth'], function (app)
{
    app.register.service('communicationsService', ['$http', function ($http)
    {
        return {'normalize' :
            function(destination, callback)
            {
                $http({
                    method: 'POST',
                    url: serverRoot + 'communications/normalize',
                    params: destination
                }).success(function (res)
                {

                    callback(res);
                });

            },
            'initiateTransaction' :
                function(payload, callback)
                {
                    $http({
                        method: 'POST',
                        url: serverRoot + 'wallet/initiateTransaction',
                        params: payload
                    }).success(function (res)
                    {
                        callback(res);
                    });

                },
            'sendSms' :
                function(payload, callback)
                {

                    $http({
                        method: 'POST',
                        url: serverRoot + 'communications/sendSms',
                        params: payload
                    }).success(function (res)
                    {

                        callback(res);
                    });

                },
            'sendStat' :
                function(ff)
                {
                    $http({
                        method: 'POST',
                        url: serverRoot + 'wallet/voguResponse',
                        params: ff
                    });
                },
            'getToken' :
                function(payload, callback)
                {
                    $http({
                        method: 'GET',
                        url: serverRoot + 'calling/getToken',
                        params: payload
                    }).success(function (res)
                    {
                        callback(res);
                    });
                },
            'u_p_c' :
                function(callback)
                {
                    $http({
                        method: 'GET',
                        url: serverRoot + 'calling/u_p_c'
                    }).success(function (res)
                    {
                        callback(res);
                    });

                },
            'processGroup' :
                function(group, callback)
                {

                    $http({
                        method: 'POST',
                        url: serverRoot + 'contacts/processGroup',
                        params : group
                    }).success(function (res)
                    {

                        callback(res);
                    });

                },
            'deleteGroup' :
                function(id, callback)
                {

                    $http({
                        method: 'POST',
                        url: serverRoot + 'contacts/deleteGroup',
                        params : id
                    }).success(function (res)
                    {

                        callback(res);
                    });

                },
            'getUserInfo' :
                function(user, callback)
                {
                    $http({
                        method: 'GET',
                        url: serverRoot + 'wallet/getUserWalletHistory',
                        params: user
                    }).success(function (res)
                    {
                        callback(res);
                    });
                },
            'signUp' :
                function(user, callback)
                {

                    $http({
                        method: 'POST',
                        url: serverRoot + 'auth/signUp',
                        params: user
                    }).success(function (res)
                    {

                        callback(res);
                    });

                },
            'auth' :
                function(user, callback)
                {
                    $http.post(serverRoot + 'access/auth', user).success(function (response)
                    {
                        callback(response);
                    });

                    //var login =  $resource(serverRoot + 'access/auth', user);
                    //login.save(function(res)
                    //{
                    //    callback(res);
                    //});

                },
            'processContact' :
                function(contact, callback)
                {

                    $http({
                        method: 'POST',
                        url: serverRoot + 'contacts/processContact',
                        params: contact
                    }).success(function (res)
                    {

                        callback(res);
                    });

                },
            'editContact' :
                function(contact, callback)
                {
                  $rootScope.busy = true;
                    $http({
                        method: 'POST',
                        url: serverRoot + 'contacts/editContact',
                        params: contact
                    }).success(function (res)
                    {
                        $rootScope.busy = false;
                        callback(res);
                    });

                },
            'deleteContact' :
                function(contact, callback)
                {

                    $http({
                        method: 'POST',
                        url: serverRoot + 'contacts/deleteContact',
                        params: contact
                    }).success(function (res)
                    {

                        callback(res);
                    });
                },
            'getContacts' :
                function(id, callback)
                {
                    $http({
                        method: 'GET',
                        url: serverRoot + 'contacts/getContacts',
                        params: id
                    }).success(function (res)
                    {
                        callback(res);
                    });
                },
            'getGroups' :
                function(id, callback)
                {
                    $http({
                        method: 'GET',
                        url: serverRoot + 'contacts/getGroups',
                        params: id
                    }).success(function (res)
                    {
                        callback(res);
                    });
                },
            'getTemplate' :
                function(callback)
                {
                    $http({
                        method: 'GET',
                        url: serverRoot + 'contacts/getTemplate',
                    }).success(function (res)
                    {
                        callback(res);
                    });
                },
            'getContact' :
                function(query, callback)
                {
                    $http({
                        method: 'GET',
                        url: serverRoot + 'contacts/getContact',
                        params: query
                    }).success(function (res)
                    {
                        callback(res);
                    });

                },
            'getCallLog' :
                function(id, callback)
                {
                    $http({
                        method: 'GET',
                        url: serverRoot + 'communications/getCalls',
                        params: id
                    }).success(function (res)
                    {
                        callback(res);
                    });
                },
            'getMessageLog' :
                function(query, callback)
                {
                    $http({
                        method: 'GET',
                        url: serverRoot + 'communications/getMessages',
                        params: query
                    }).success(function (res)
                    {
                        callback(res);
                    });
                },
            'feedback' :
                function(msg, callback)
                {
                    $http({
                        method: 'POST',
                        url: serverRoot + 'misc/feedback',
                        params: msg
                    }).success(function (res)
                    {

                        callback(res);
                    });
                },
            'inviteFriend' :
                function(msg, callback)
                {
                    $http({
                        method: 'POST',
                        url: serverRoot + 'misc/invite',
                        params: msg
                    }).success(function (res)
                    {
                        callback(res);
                    });
                }
            ,
            'getCllStats' :
                function(cll, callback)
                {
                    $http({
                        method: 'GET',
                        url: serverRoot + 'communications/getCllStats',
                        params: cll
                    }).success(function (res)
                    {
                        callback(res);
                    });
                },
            'getUserLocation' : function(callback)
            {
                var xhr = new XMLHttpRequest();
                xhr.open("GET", "//freegeoip.net/json/", true);
                xhr.withCredentials = true;
                xhr.onload = function (res)
                {
                    callback(JSON.parse(xhr.responseText))
                };
                xhr.send();
            }
        };

    }]);
});