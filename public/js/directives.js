'use strict';

angular.module('myApp.directives', []).

  directive('modalLayout', function(){
    return {
      transclude: true,
      templateUrl: 'partials/modal-layout.html',
    }
  }).

  directive('titleCaps', function(){
    return {
      link: function(scope, element, attrs){
        var text = element.text();
        var el = angular.element('<div></div>');
        for (var i=0; i < text.length; i++) {
          var ch = text.charAt(i);
          if (ch.toUpperCase() == ch) {
            el.append($('<span style="font-size: 130%"></span>').text(ch));
          } else {
            el.append($('<span></span>').text(ch.toUpperCase()));
          }
        }
        element.empty();
        element.append(el);
      }
    };
  }).

  directive('xhrModal', ['$compile','$timeout','$document','$http',function($compile,$timeout,$document,$http){
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
            modalScope.currentModalScope = modalScope; // so nested scopes can get a handle on it
            modalScope.hideCloseButton = attrs.hideCloseButton;
            modalScope.suppressBgClose = false; // nested scopes can access this and set true
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
            modalScope.closeModal = function(via) {
              if (via == 'bg-click') {
                if (modalScope.suppressBgClose) {
                  console.log("modal not closing on bg-click");
                  return;
                }
              }
              if (modalScope.activeModal) {
                console.log("better xhr close modal stage 1");
                modalScope.activeModal = false;
                $timeout(function(){
                  console.log("better xhr close modal stage 2");
                  modalScope.inModal = false;
                  modalScope.$destroy();
                  modalDomEl.remove();
                  if (modalScope.modalDidClose) { modalScope.modalDidClose(); }
                }, 200);
                if (modalScope.setModalCloseFunction) {
                  modalScope.setModalCloseFunction(null);
                }
              }
            };
            if (modalScope.setModalCloseFunction) {
              // wacky, but this is how the parent scope closes the modal. they
              // cant just delete the node because of the css transition. they
              // need an actual handle to the functionality to trigger the
              // animation. once the modal is finally closed, then the parent
              // scope's modalDidClose function will be called.
              // todo: perhaps move this to an attribute that watches a boolean
              // to determine when to close, like close-on="foo"?
              modalScope.setModalCloseFunction(modalScope.closeModal);
            }
            var body = $document.find('body').eq(0); // todo: use root app element instead?
            body.append(modalDomEl);
            modalScope.openIt();
            spinner.stop();
            element.removeClass('cleartext');
          }, function(error){
            spinner.stop();
            element.removeClass('cleartext');
            console.log("better xhr modal failed to get modal content", error);
            //... eventually i want the modal directive to implement error handling with a specific error modal
          })
        }
        if (attrs.immediate) {
          loadModal();
        } else {
          element.bind('click',function(e) {
            e.preventDefault();
            e.stopPropagation();
            loadModal();
          });
        }
      }
    }
  }])

;

