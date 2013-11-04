'use strict';

angular.module('myApp.controllers', []);

angular.module('myApp').controller('AuthCtrl',['$scope','$auth', function($scope, $auth) {
  $scope.auth = $auth;
  $scope.failed = false;
  $scope.login = function() {
    console.log("login() in controller.",$scope.userNameInput,$scope.passwordInput);
    var res = $auth.login($scope.userNameInput,$scope.passwordInput);
    $scope.passwordInput = '';
    res.then(function(succeeded) {
      console.log("res.then succeeded:",succeeded);
      if (succeeded) {
        $scope.failed = false;
        $scope.userNameInput = '';
      } else {
        $scope.failed = true;
      }
    });
  };
  $scope.logout = $auth.logout;

}]);
