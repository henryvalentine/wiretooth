'use strict';

define(['wireTooth','countryService','locationService','communicationsService',], function (app) {

  app.register.controller('walletUpdateController', ['$scope','$rootScope','$routeParams','communicationsService',function($scope, $rootScope, $routeParams, communicationsService)

  {

    $scope.getResParams = function()
    {
      var status =  false;
      if($routeParams.successful === 'true')
      {
        status = true;
      }
      $scope.transaction = {successful :  status, message :  $routeParams.message,totalBalance : $routeParams.totalBalance,
        date : $routeParams.date, error : $routeParams.error };

    };

  }
  ]);
});