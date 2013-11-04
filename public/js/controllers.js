'use strict';

angular.module('myApp.controllers', []);

angular.module('myApp').controller('RootCtrl',['$scope','$auth', '$choices', function($scope, $auth, $choices) {
  $scope.auth = $auth;
  $scope.atLocation = ''; // nested scopes set their own atLocation, this is how i preserve location "breadcrumbs"
  $scope.choices = $choices;
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

angular.module('myApp').controller('TaskListCtrl',['$scope','$auth', '$http', '$location', '$timeout', '$rootScope', function($scope, $auth, $http, $location, $timeout, $rootScope) {

  $scope.tasks = [];
  $scope.hasFocusedTask = false;
  $scope.focusedTaskId = null;
  $scope.pendingFocusedTaskId = null;

  $scope.loadTasks = function() {
    $http.get('/tasks').then(function(result){
      if (result && result.data) {
        console.log("got tasks",result.data);
        $scope.tasks = result.data;
        $scope.doSort();
      }
    });
  }
  $scope.loadTasks();

  $rootScope.$on('loadTasks',$scope.loadTasks);

  $rootScope.$on('gotTask',function(e,task){
    console.log('gotTask',task);
    for (var i=0; i<$scope.tasks.length; i++) {
      if ($scope.tasks[i].id == task.id) {
        $scope.tasks[i] = task;
        $scope.doSort();
        return;
      }
    }
    $scope.tasks.push(task);
    $scope.doSort();
  });

  $scope.sortOrder = -1;
  $scope.sortBy = 'priority';

  $scope.doSort = function() {
    var self = this;
    self.tasks.sort(function(a,b){
      if (a[self.sortBy] > b[self.sortBy]) return self.sortOrder;
      if (a[self.sortBy] < b[self.sortBy]) return (-1 * self.sortOrder);
      return 0;
    });
    var props = ['id','status','priority','owner','name','title'];
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

  $scope.focusTask = function(taskId) {
    console.log("focusTask:",taskId);
    if (!$scope.hasFocusedTask) {
      $scope.focusedTaskId = taskId;
      $scope.pendingFocusedTaskId = null;
      $scope.hasFocusedTask = true;
      $scope.atLocation = 'task-'+taskId;
      $location.hash($scope.atLocation);
    } else {
      $scope.pendingFocusedTaskId = taskId;
      if ($scope.modalCloseFunction) { $scope.modalCloseFunction(); }
    }
  };

  $scope.setModalCloseFunction = function(closeFunction) {
    $scope.modalCloseFunction = closeFunction;
  }

  $scope.closeTask = function() {
    console.log("closeTask");
    if ($scope.hasFocusedTask) {
      console.log("closeTask hasFocusedTask");
      if ($scope.modalCloseFunction) { $scope.modalCloseFunction(); }
    }
  }

  $scope.modalDidClose = function() {
    console.log("modalDidClose");
    $scope.focusedTaskId = null;
    $scope.hasFocusedTask = false;
    delete $scope.atLocation; // restore atLocation to parent scope's value
    $location.hash($scope.atLocation);
    if ($scope.pendingFocusedTaskId) {
      $timeout(function(){
        console.log("modalDidClose opening pending task", $scope.pendingFocusedTaskId);
        $scope.focusTask($scope.pendingFocusedTaskId);
      });
    }
  };

  $scope.$watch(function(){return $location.hash()},function(){
    var matches = ('' + $location.hash()).match(/^task-(\d+)/);
    if (matches) {
      console.log("location watch match",matches);
      var id = matches[1];
      if (id != $scope.focusedTaskId) {
        console.log("location watch sees new task id, opening",id);
        $scope.focusTask(id);
      }
    } else {
      console.log("location watch does not match");
      if ($scope.hasFocusedTask) {
        console.log("location watch closeTask");
        $scope.closeTask();
      }
    }
  });

}]);

angular.module('myApp').controller('TaskDetailCtrl',['$scope','$auth', '$http', function($scope, $auth, $http) {

  $scope.fullTask = null;
  $scope.originalTask = null;
  $scope.loaded = false;

  if ($scope.focusedTaskId) {
    $http.get('/task?id='+$scope.focusedTaskId).then(function(result){
      if (result && result.data) {
        console.log("got task",result.data);
        $scope.fullTask = result.data;
        $scope.fullTask.newNoteText = '';
        $scope.originalTask = $.extend(true, {}, result.data);
        $scope.loaded = true;
      }
    });
  }

  var contentChanged = function() {
    if (!$scope.fullTask || !$scope.originalTask) { return false; }
    var checkProperties = ['title','owner','priority','status','newNoteText'];
    for (var i=0; i < checkProperties.length; i++) {
      var prop = checkProperties[i];
      if ($scope.fullTask[prop] != $scope.originalTask[prop]) {
        return true;
      }
    }
    return false;
  };
  $scope.$watch(contentChanged,function(){
    $scope.currentModalScope.suppressBgClose = contentChanged();
  });

  $scope.update = function() {
    console.log("scope newNoteText",$scope.fullTask.newNoteText);
    var params = {
      'title' : $scope.fullTask.title,
      'owner' : $scope.fullTask.owner,
      'status' : $scope.fullTask.status,
      'priority' : $scope.fullTask.priority,
      'note' : $scope.fullTask.newNoteText,
    };
    $http.post('/task?id='+$scope.focusedTaskId, params).then(function(result){
      if (result && result.data) {
        console.log("updated task",result.data);
        $scope.fullTask = result.data;
        $scope.$emit('gotTask',result.data);
        $scope.loaded = true;
        $scope.closeModal('complete');
      }
    });
  };

}]);

angular.module('myApp').controller('NewTaskCtrl',['$scope','$auth', '$http', function($scope, $auth, $http) {

  var defaults = {
    'status' : 'inbox',
  };

  $scope.newTask = $.extend({},defaults);

  var contentChanged = function() {
    var checkProperties = ['title','owner','priority','status','newNoteText'];
    for (var i=0; i < checkProperties.length; i++) {
      var prop = checkProperties[i];
      if ($scope.newTask[prop] != defaults[prop]) {
        return true;
      }
    }
    return false;
  };
  $scope.$watch(contentChanged,function(){
    $scope.currentModalScope.suppressBgClose = contentChanged();
  });

  $scope.save = function() {
    console.log("new task save",$scope.newTask);
    var params = {
      'title' : $scope.newTask.title,
      'owner' : $scope.newTask.owner,
      'status' : $scope.newTask.status,
      'priority' : $scope.newTask.priority,
      'note' : $scope.newTask.newNoteText,
    };
    $http.post('/new_task', params).then(function(result){
      if (result && result.data) {
        if (result.data.success) {
          $scope.errors = null;
          console.log("saved new task",result.data);
          $scope.closeModal('complete');
          $scope.$emit('gotTask',result.data.task);
          //$scope.$emit('loadTasks');
          return;
        } else {
          console.log("failed to save new task",result.data);
          $scope.errors = result.data.errors;
        }
      } else {
        console.log("failed to save new task - no result");
        $scope.errors = ['there was a problem communicating with the server'];
      }
    });
  };

}]);

