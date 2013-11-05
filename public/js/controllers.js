'use strict';

angular.module('myApp.controllers', []);

angular.module('myApp').controller('RootCtrl',['$scope','$auth', '$choices', function($scope, $auth, $choices) {
  $scope.auth = $auth;
  $scope.choices = $choices;
  $scope.quote = getDuneQuote(); // duneQuotes.js

  $scope.format_date = function(unix_timestamp) {
    return moment.unix(unix_timestamp).calendar();
  };

}]);

angular.module('myApp').controller('LoginCtrl',['$scope','$auth', function($scope, $auth) {
  $scope.auth = $auth;
  $scope.failed = false;
  $scope.quote = getDuneQuote();
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
}]);

angular.module('myApp').controller('TaskListCtrl',['$scope','$auth', '$http', '$location', '$timeout', '$rootScope', function($scope, $auth, $http, $location, $timeout, $rootScope) {

  var self = this;
  $scope.quote = getDuneQuote();

  // task data loading
  $scope.tasks = [];
  $scope.loading = false;
  $scope.errors = [];
  $scope.loadTasks = function() {
    $scope.loading = true;
    $http.get('/tasks').then(function(result){
      if (result && result.data) {
        console.log("got tasks",result.data);
        $scope.quote = getDuneQuote();
        $scope.tasks = result.data;
        $scope.doSort();
        $scope.loading = false;
        $scope.errors = [];
      } else {
        $scope.errors = ['there was a problem loading the task list'];
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

  // filtering and sorting
  console.log("location.search:",$location.search());
  $scope.filterStatus = $location.search()['status'];
  $scope.filterOwner = $location.search()['owner'];
  $scope.sortBy = $location.search()['sort'] || 'rank';
  $scope.sortOrder = $location.search()['order'] || 1;
  console.log("filterStatus:",$scope.filterStatus);
  console.log("filterOwner:",$scope.filterOwner);
  $scope.filterFunc = function(task) {
    if ($scope.filterStatus && task.status != $scope.filterStatus) return false;
    if ($scope.filterOwner) {
      if ($scope.filterOwner == 'nobody' && task.owner) return false;
      if ($scope.filterOwner != 'nobody' && task.owner != $scope.filterOwner) return false;
    }
    if ($scope.filterTags) {
      var tags = $scope.filterTags.split(/\s+/);
      var found = false;
      for (var i=0; i<task.tags.length; i++) {
        if (tags.indexOf(task.tags[i]) >= 0) found = true;
      }
      if (!found) return false;
    }
    return true;
  };
  $scope.$watch('filterStatus',function(newValue,oldValue){
    if (newValue != oldValue) {
      console.log("filterStatus watch updating location", $scope.filterStatus);
      $location.search('status',$scope.filterStatus);
    }
  });
  $scope.$watch('filterOwner',function(newValue,oldValue){
    if (newValue != oldValue) {
      console.log("filterOwner watch updating location", $scope.filterOwner);
      $location.search('owner',$scope.filterOwner);
    }
  });
  $scope.$watch('filterTags',function(newValue,oldValue){
    if (newValue != oldValue) {
      console.log("filterTags watch updating location", $scope.filterTags);
      $location.search('tags',$scope.filterTags);
    }
  });
  $scope.doSort = function() {
    var self = this;
    self.tasks.sort(function(a,b){
      if (a[self.sortBy] > b[self.sortBy]) return self.sortOrder;
      if (a[self.sortBy] < b[self.sortBy]) return (-1 * self.sortOrder);
      return 0;
    });
  }
  $scope.sortByProp = function(prop) {
    if ($scope.sortBy == prop) {
      $scope.sortOrder = -1 * $scope.sortOrder;
    } else {
      $scope.sortBy = prop;
    }
    $scope.doSort();
    $location.search('sort',$scope.sortBy);
    $location.search('order',$scope.sortOrder);
  }
  $scope.doSort();

  // reranking
  $scope.taskById = function(taskId) {
    for (var i=0; i<$scope.tasks.length; i++) {
      if ($scope.tasks[i].id == taskId) return $scope.tasks[i];
    }
    return null;
  };
  $scope.moveRowId = null;
  $scope.startMoveRow = function(taskId) {
    if (!$scope.moveRowId) {
      $scope.moveRowId = taskId;
    } else {
      $scope.moveRowId = null;
    }
  };
  $scope.endMoveRow = function(taskId,placement) {
    var movingTaskId = $scope.moveRowId;
    $scope.moveRowId = null;
    var movingTask = $scope.taskById(movingTaskId);
    var oldRank = movingTask.rank;
    var newRank = $scope.taskById(taskId).rank;
    if (oldRank < newRank) {
      if (placement == 'above') newRank--;
      for (var i=0; i<$scope.tasks.length; i++) {
        if ($scope.tasks[i].rank >= oldRank && $scope.tasks[i].rank <= newRank) {
          $scope.tasks[i].rank--;
        }
      }
    } else {
      if (placement == 'below') newRank++;
      for (var i=0; i<$scope.tasks.length; i++) {
        if ($scope.tasks[i].rank >= newRank && $scope.tasks[i].rank <= oldRank) {
          $scope.tasks[i].rank++;
        }
      }
    }
    movingTask.rank = newRank;
    $scope.doSort();
    var params = {
      'move_id' : movingTaskId,
      'other_id' : taskId,
      'placement' : placement,
    };
    $http.post('/rerank', params).then(function(result){
      if (result && result.data) {
        if (result.data.success) {
          console.log("reranked task",result.data);
          $scope.errors = null;
          $scope.fullTask = result.data.task;
          //$scope.$emit('loadTasks');
        } else {
          console.log("failed to rerank task",result.data);
          $scope.errors = result.data.errors;
        }
      } else {
        console.log("failed to rerank task - no result data");
        $scope.errors = ['there was a problem communicating with the server'];
      }
    });
  };

  // task focusing (modal)
  $scope.hasFocusedTask = false;
  $scope.pendingFocusedTaskId = null;
  $scope.focusedTaskId = $location.search()['taskId'];
  if ($scope.focusedTaskId) $scope.hasFocusedTask = true;
  console.log("focusedTaskId=",$scope.focusedTaskId);
  $scope.focusTask = function(taskId) {
    console.log("focusTask:",taskId);
    if (!$scope.hasFocusedTask) {
      $scope.focusedTaskId = taskId;
      $scope.pendingFocusedTaskId = null;
      $scope.hasFocusedTask = true;
      console.log("setting location taskId",taskId);
      $location.search('taskId',taskId);
    } else {
      $scope.pendingFocusedTaskId = taskId;
      if ($scope.modalCloseFunction) { $scope.modalCloseFunction(); }
    }
  };
  $scope.setModalCloseFunction = function(closeFunction) {
    $scope.modalCloseFunction = closeFunction;
  }
  $scope.closeTask = function() {
    // this just triggers the modal close. the job gets finished on modalDidClose
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
    console.log("setting location taskId to null");
    $location.search('taskId',null);
    if ($scope.pendingFocusedTaskId) {
      $timeout(function(){
        console.log("modalDidClose opening pending task", $scope.pendingFocusedTaskId);
        $scope.focusTask($scope.pendingFocusedTaskId);
      });
    }
  };

}]);

angular.module('myApp').controller('TaskDetailCtrl',['$scope','$auth', '$http','$location', function($scope, $auth, $http, $location) {

  $scope.fullTask = null;
  $scope.originalTask = null;
  $scope.loaded = false;
  $scope.errors = null;

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

  $scope.$on('$destroy',function(){
    console.log("detail controller destroyed");
  });

  $scope.update = function() {
    console.log("scope newNoteText",$scope.fullTask.newNoteText);
    var params = {
      'title' : $scope.fullTask.title,
      'owner' : $scope.fullTask.owner,
      'status' : $scope.fullTask.status,
      'priority' : $scope.fullTask.priority,
      'raw_tags' : $scope.fullTask.raw_tags,
      'note' : $scope.fullTask.newNoteText,
    };
    $http.post('/task?id='+$scope.focusedTaskId, params).then(function(result){
      if (result && result.data) {
        if (result.data.success) {
          console.log("updated task",result.data);
          $scope.errors = null;
          $scope.fullTask = result.data.task;
          $scope.$emit('gotTask',result.data.task);
          $scope.loaded = true;
          $scope.closeModal('complete');
        } else {
          console.log("failed to update task",result.data);
          $scope.errors = result.data.errors;
        }
      } else {
        console.log("failed to update task - no result data");
        $scope.errors = ['there was a problem communicating with the server'];
      }
    });
  };

}]);

angular.module('myApp').controller('NewTaskCtrl',['$scope','$auth', '$http', function($scope, $auth, $http) {

  var defaults = {
    'status' : 'inbox',
    'owner' : 'nobody',
  };

  $scope.newTask = $.extend({},defaults);

  var contentChanged = function() {
    var checkProperties = ['title','owner','priority','status','newNoteText','raw_tags'];
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
      'raw_tags' : $scope.newTask.raw_tags,
    };
    $http.post('/new_task', params).then(function(result){
      if (result && result.data) {
        if (result.data.success) {
          $scope.errors = null;
          console.log("saved new task",result.data);
          $scope.closeModal('complete');
          $scope.$emit('gotTask',result.data.task);
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

