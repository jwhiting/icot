'use strict';

angular.module('myApp.directives', []).

  directive('modalLayout', function(){
    return {
      transclude: true,
      templateUrl: 'partials/modal-layout.html',
    }
  }).

  directive('xhrModal', ['$compile','$timeout','$document','$http','$location',function($compile,$timeout,$document,$http,$location){
    return {
      //scope: {
      //  context: "=", // provide an arbitrary object to the modal for context, such as the task for a task detail modal. 
      //},
      link: function(scope, element, attrs) {
        function loadModal() {
          var spinnerOpts = {
            lines: 9, // The number of lines to draw
            length: 0, // The length of each line
            width: 3, // The line thickness
            radius: 5, // The radius of the inner circle
            corners: 1, // Corner roundness (0..1)
            rotate: 0, // The rotation offset
            direction: 1, // 1: clockwise, -1: counterclockwise
            color: '#000', // #rgb or #rrggbb or array of colors
            speed: 1.5, // Rounds per second
            trail: 33, // Afterglow percentage
            shadow: false, // Whether to render a shadow
            hwaccel: false, // Whether to use hardware acceleration
            className: 'spinner', // The CSS class to assign to the spinner
            zIndex: 2e9, // The z-index (defaults to 2000000000)
            top: 'auto', // Top position relative to parent in px
            left: 'auto' // Left position relative to parent in px
          };
          var spinner = new Spinner(spinnerOpts).spin(element[0]);
          element.addClass('cleartext');
          var fetchPromise = $http.get(attrs.xhrModal);
          fetchPromise.then(function(result){
            console.log("better xhr modal got remote modal content",result);
            var content = result.data;
            var modalScope = scope.$new(); // XXX do i need to create a new 'modalScope'? can i just use 'scope'?
            var modalDomEl = $compile(angular.element('<div modal-layout></div>').html(content))(modalScope);
            modalScope.inModal = false;
            modalScope.activeModal = false;
            modalScope.openIt = function() {
              if (!modalScope.inModal) {
                console.log("better xhr open modal stage 1");
                modalScope.activeModal = false;
                modalScope.inModal = true;
                //modalScope.$apply();
                $timeout(function(){
                  console.log("better xhr open modal stage 2");
                  modalScope.activeModal = true;
                });
              }
            };
            modalScope.closeIt = function(noRestoreLocation) {
              if (modalScope.activeModal) {
                console.log("better xhr close modal stage 1");
                modalScope.activeModal = false;
                $timeout(function(){
                  console.log("better xhr close modal stage 2");
                  modalScope.inModal = false;
                  modalScope.$destroy();
                  modalDomEl.remove();
                }, 200);
                if (!noRestoreLocation && attrs.location) {
                  console.log("restoring location from",$location.hash(),"to",modalScope.oldLocation);
                  $location.hash(modalScope.oldLocation);
                }
              }
            };
            var body = $document.find('body').eq(0); // todo: use root app element instead?
            body.append(modalDomEl);
            modalScope.openIt();
            spinner.stop();
            element.removeClass('cleartext');
            if (attrs.location) {
              modalScope.oldLocation = $location.hash();
              console.log("location=",$location.hash());
              console.log("modalScope.oldLocation=",modalScope.oldLocation);
              $location.hash(attrs.location);
              scope.$watch(function(){ return $location.hash(); },function(){
                if ($location.hash() != attrs.location) {
                  modalScope.closeIt(true);
                }
              });
            }
          }, function(error){
            spinner.stop();
            element.removeClass('cleartext');
            console.log("better xhr modal failed to get modal content", error);
            //... eventually i want the modal directive to implement error handling with a specific error modal
          })
        }
        element.bind('click',function(e) {
          e.preventDefault();
          e.stopPropagation();
          loadModal()
        });
      }
    }
  }])

;

