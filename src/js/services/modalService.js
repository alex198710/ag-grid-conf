'use strict';

angular.module('agGridConf')
  .factory('modalService', ['$uibModal', function ($uibModal) {
    // The global service variable to return
    var modalService = {};

    var ModalInstanceCtrl = function ($scope, $uibModalInstance) {
      $scope.ok = function () {
        $uibModalInstance.close();
      };

      $scope.cancel = function () {
        $uibModalInstance.dismiss('cancel');
      };
    };

    modalService.confirm = function (msg, callback, callbackCancel) {
      modalService.confirmWithMsgBody(msg, null, callback, callbackCancel);
    };

    /**
     *
     * @param message
     * @param moment
     */
    modalService.confirmWithMsgBody = function (msg, msgBody, callback, callbackCancel) {
      var message = msg || "Are you sure ?";
      var messageBody = msgBody || "Are you sure ?";

      var modalHtml = '<div class="modal-header">' + message + '</div>';
      if (msgBody !== undefined && msgBody !== null) {
        modalHtml += '<div class="modal-body">' + messageBody + '</div>';
      }
      modalHtml += '<div class="modal-footer"><button class="btn btn-primary" ng-click="ok()">OK</button><button class="btn btn-warning" ng-click="cancel()">Cancel</button></div>';

      var modalInstance = $uibModal.open({
        template: modalHtml,
        controller: ModalInstanceCtrl
      });

      modalInstance.result.then(function() {
        callback();
      }, function() {
          if (callbackCancel) {
              callbackCancel();
          }
      });
    };

    return modalService;
  }]);
