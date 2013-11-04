'use strict';

angular.module('myApp.services', []).

  service('$choices',[function(){
    var self = this;
    self.allUserNames = [];
    self.allUserNamesAndNobody = [];
    self.allStatuses = [];
  }]).

  service('$auth',['$http','$q','$choices',function($http,$q,$choices){
    var self = this;

    self.userName = '';
    self.bootstrapped = false;
    self.loggedIn = false;

    self.loadWhoami = function() {
      console.log('whoami post');
      var fetchPromise = $http.post('/whoami');
      fetchPromise.success(function(result){
        console.log('whoami result:',result);
        if (result && result.success) {
          self.userName = result.user_name;
          if (self.userName) {
            self.loggedIn = true;
          } else {
            self.loggedIn = false;
          }
          $choices.allUserNames = result.all_user_names;
          $choices.allUserNamesAndNobody = ['nobody'].concat(result.all_user_names);
          $choices.allStatuses = result.all_statuses;
        } else {
          self.userName = '';
          self.loggedIn = false;
        }
        self.bootstrapped = true;
      });
    }
    self.loadWhoami();

    self.login = function(aUserName,aPassword) {
      console.log('login post');
      var deferred = $q.defer();
      var fetchPromise = $http.post('/login',{'user_name':aUserName,'password':aPassword});
      fetchPromise.success(function(result){
        console.log('login result:',result);
        if (result && result.success) {
          self.userName = result.user_name;
          self.loggedIn = true;
          deferred.resolve(true);
        } else {
          deferred.resolve(false);
        }
      });
      fetchPromise.error(function(result){
        console.log('login result:',result);
        deferred.resolve(false);
      });
      return deferred.promise;
    };

    self.logout = function() {
      console.log('logout post');
      var deferred = $q.defer();
      var fetchPromise = $http.post('/logout');
      fetchPromise.success(function(result){
        console.log('logout result:',result);
        if (result && result.success) {
          self.userName = '';
          self.loggedIn = false;
          deferred.resolve(true);
        } else {
          deferred.resolve(false);
        }
      });
      fetchPromise.error(function(result){
        console.log('logout result:',result);
        deferred.resolve(false);
      });
      return deferred.promise;
    };

  }])

  ;
