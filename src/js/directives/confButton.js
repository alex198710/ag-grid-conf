/**
 * Created by fischera on 07/07/2017.
 */
'use strict';

angular.module('agGridConf')
  .directive('confButton', function($rootScope, confService, modalService, agGridConfService, confButtonService){
    return {
      restrict: "E",
      transclude: true,
      template: '<div class=\"btn-group\" uib-dropdown>\n ' +
      '<ng-transclude></ng-transclude>\n ' +
      '<button type=\"button\" class=\"btn btn-success btn-lg\" uib-dropdown-toggle>\n ' +
      '  <span class=\"caret\"></span>\n ' +
      '  <span class=\"sr-only\">Split button!</span>\n ' +
      '</button>\n ' +
      '<ul class=\"dropdown-menu\" uib-dropdown-menu role=\"menu\" aria-labelledby=\"split-button\">\n ' +
      '  <li role=\"menuitem\" ng-repeat=\"conf in confs\" ng-if=\"confs\" class=\"list-item-conf\">\n ' +
      '	<a href=\"#\" ng-click=\"loadConf($event, conf)\">{{ conf.confName }}</a>\n ' +
      '	<i class=\"fa fa-times\" title=\"delete conf\" ng-click=\"deleteConf($event, conf)\"></i>\n ' +
      '  </li>\n ' +
      '  <li role=\"separator\" class=\"divider\"></li>\n ' +
      '  <li role=\"menuitem\"><a href=\"#\" ng-click=\"saveConf($event)\">Save Query</a></li>\n ' +
      '</ul>\n ' +
      '</div>',
      scope: false,
      link: function($scope, $element, $attrs, ctrl, transclude){

        angular.element("ng-transclude").replaceWith(transclude());

        $scope.loadConf = function(event, conf) {
          event.preventDefault();
          $.extend(true, $scope.query , JSON.parse(conf.conf));
          if ($scope.query.startDate) {
            $scope.query.startDate = moment($scope.query.startDate).toDate();
          }
          if ($scope.query.endDate) {
            $scope.query.endDate = moment($scope.query.endDate).toDate();
          }
          confButtonService.setLoadedConf($scope.viewName, conf.confGrid);
          $rootScope.$broadcast('refreshData');
        };

        // After refreshing data, load conf grid because of dynamic columns
        $rootScope.$on('afterRefreshData', function() {
          if (!confButtonService.isListenToEvents()) return;
          var conf = confButtonService.getLoadedConf($scope.viewName);
          // several events fired, so we only consider the one with api set
          if (conf && $scope.agGrid.gridOptions.columnApi) {
            confButtonService.setListenToEvents(false);
            agGridConfService.loadConfGrid($scope.agGrid.gridOptions, conf.conf);
            confButtonService.setListenToEvents(true);
          }
        });

        $scope.deleteConf = function(event, conf) {
          event.preventDefault();
          var idConf = conf.idConf;
          var callback = function() {
            confService.delete({idConf: idConf}, function(response) {
              $rootScope.$broadcast('success', {items: 'Query deleted'});
              $scope.loadConfs();
            }, function(response) {
              $rootScope.$broadcast('error', {items: 'Cannot delete query: ' + response.statusText});
            });
          };

          var html='<h1 class="text-center">Do you really want to delete this query ?</h1>';
          var title = 'Confirm delete query';
          modalService.confirmWithMsgBody(title, html, callback);
        };

        $scope.saveConf = function(event) {
          event.preventDefault();
          var callback = function() {
            var newConf = {
              confName: angular.element('#label').scope().selected.confName,
              viewName: $scope.viewName,
              conf: JSON.stringify($scope.query),
              saveConfGrid: angular.element('#saveConfGrid').scope().selected.saveConfGrid
            };
            confService.save(newConf, function(response) {
              $rootScope.$broadcast('success', {items: 'Query saved'});
              $scope.loadConfs();
            }, function(response) {
              $rootScope.$broadcast('error', {items: 'Cannot save query: ' + response.responseText});
            });
          };

          var html='<div class="form-horizontal">' +
              '<div class="row">' +
                '<div class="col-sm-3">' +
                  '<label for="label" class="text-right control-label">Query name: </label>' +
                '</div>' +
                '<div class="col-sm-9">' +
                  '<input id="label" name="confName" type="text" class="form-control" maxlength="250" ' +
                  'ng-model="selected.confName" ng-minlength="2" ng-maxlength="250" autofocus/>' +
                '</div>' +
              '</div>' +
              '<div class="row">' +
                '<div class="col-sm-3">' +
                  '<label for="saveConfGrid" class="text-right control-label">Save columns state: </label>' +
                '</div>' +
                '<div class="col-sm-9">' +
                  '<input id="saveConfGrid" name="saveConfGrid" type="checkbox" ' +
                  'ng-model="selected.saveConfGrid" />' +
                '</div>' +
              '</div>' +
            '</div>';
          var title = 'Save query';

          modalService.confirmWithMsgBody(title, html, callback);
        };

        $scope.loadConfs = function() {
          confService.get({viewName: $scope.viewName}, function(data) {
            $scope.confs = data.list;
          });
        };

        $scope.loadConfs();
      }
    }
  }).factory('confButtonService', ['$rootScope', 'confService', function ($rootScope, confService) {
    var service = {};
    var loadedConfs = {};
    var listenToEvents = true;

    service.setListenToEvents = function(listenOrNot) {
      listenToEvents = listenOrNot;
    };

    service.isListenToEvents = function() {
    return listenToEvents;
  };

    service.getLoadedConf = function(viewName) {
      return loadedConfs[viewName];
    };

    service.setLoadedConf = function(viewName, conf) {
      if (conf) {
        loadedConfs[viewName] = conf;
      } else {
        delete loadedConfs[viewName];
      }
    };

    return service;
  }]);
