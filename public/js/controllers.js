'use strict';

angular.module('myApp.controllers', []);

angular.module('myApp').controller('RootCtrl',['$scope','$auth', function($scope, $auth) {

}]);

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

angular.module('myApp').controller('TaskListCtrl',['$scope','$auth', '$http', function($scope, $auth, $http) {

  $scope.tasks = [];

  $http.get('/tasks').then(function(result){
    if (result && result.data) {
      console.log("got tasks",result.data);
      $scope.tasks = result.data;
    }
  });

  $scope.sortOrder = 1;
  $scope.sortBy = 'priority';

  $scope.doSort = function() {
    var self = this;
    self.tasks.sort(function(a,b){
      if (a[self.sortBy] > b[self.sortBy]) return self.sortOrder;
      if (a[self.sortBy] < b[self.sortBy]) return (-1 * self.sortOrder);
      return 0;
    });
    var props = ['status','priority','owner','name','title'];
    self.sortButtonValue = {};
    for (var i = 0; i < props.length; i++) {
      var prop = props[i];
      if (self.sortBy == prop) {
        self.sortButtonValue[prop] = (self.sortOrder > 0 ? "&darr;&darr;" : "&uarr;&uarr;");
      } else {
        self.sortButtonValue[prop] = "&darr;";
      }
    }
  }
  $scope.sortByProp = function(prop) {
    if ($scope.sortBy == prop) {
      $scope.sortOrder = -1 * $scope.sortOrder;
    } else {
      $scope.sortBy = prop;
    }
    $scope.doSort();
  }

  $scope.doSort();

}]);

angular.module('myApp').controller('TaskDetailCtrl',['$scope','$auth', '$http', function($scope, $auth, $http) {

  $scope.fullTask = null;

  $http.get('/task?id='+$scope.task.id).then(function(result){
    if (result && result.data) {
      console.log("got task",result.data);
      $scope.fullTask = result.data;
    }
  });

}]);


