'use strict';

angular.module('myApp.services', []).

  service('$auth',['$http','$q',function($http,$q){
    var self = this;

    self.userName = '';
    self.bootstrapped = false;

    console.log('whoami post');
    var fetchPromise = $http.post('/whoami');
    fetchPromise.success(function(result){
      console.log('whoami result:',result);
      if (result && result.success) {
        self.userName = result.user_name;
      } else {
        self.userName = '';
      }
      self.bootstrapped = true;
    });

    self.login = function(aUserName,aPassword) {
      console.log('login post');
      var deferred = $q.defer();
      var fetchPromise = $http.post('/login',{'user_name':aUserName,'password':aPassword});
      fetchPromise.success(function(result){
        console.log('login result:',result);
        if (result && result.success) {
          self.userName = result.user_name;
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
