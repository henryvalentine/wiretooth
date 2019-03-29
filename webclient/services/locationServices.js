
define(['wireTooth'], function (app)
{
    app.register.service('locationService', ['$http', function ($http)
    {
        return {'getUserLocation' : function(callback)
        {
            $http({
                method: 'GET',
                url: '//freegeoip.net/json'
            }).success(function (res)
            {
                callback(res);
            });
        }};

    }]);
});