'use strict';

angular.module('agGridConf')
  .directive('agGridConf', function ($rootScope, confGridService, agGridConfService) {
    return {
      restrict: 'A',
      scope: false,
      link: function($scope, $element, $attrs) {
        $scope.agGrid.gridOptions.onColumnResized = function(event) {
          if (!agGridConfService.isListenToEvents()) return;
          if (event.finished) {
            agGridConfService.resizeColumns($scope.agGrid, event.column ? [event.column] : event.columns);
          }
        };

        $scope.agGrid.gridOptions.onSortChanged = function() {
          if (!agGridConfService.isListenToEvents()) return;
          agGridConfService.sortsColumns($scope.agGrid, $scope.agGrid.gridOptions.api.getSortModel());
        };

        $scope.columnMoved = null;
        $scope.columnMovedTo = null;
        $scope.agGrid.gridOptions.onColumnMoved = function(event) {
          if (!agGridConfService.isListenToEvents()) return;
          $scope.columnMoved = event.column;
          $scope.columnMovedTo = event.toIndex;
        };
        $scope.agGrid.gridOptions.onDragStarted = function(event) {
          $scope.columnMoved = event.column;
        };
        $scope.agGrid.gridOptions.onDragStopped = function() {
          if (!agGridConfService.isListenToEvents()) return;
          var col = $scope.columnMoved;
          var toIndex = $scope.columnMovedTo;
          if (col !== null && toIndex !== null) {
            agGridConfService.positionColumn($scope.agGrid.gridName, col.colId, toIndex);
            $scope.columnMoved = null;
            $scope.columnMovedTo = null;
          }
        };

        $scope.agGrid.gridOptions.onColumnVisible = function(event) {
          if (!agGridConfService.isListenToEvents()) return;
          // method used only if one column is hidden/visible, because too fast for a set of columns (server cannot handle it)
          // column dragged triggers this method so until the column has stopped to be dragged, we do not consider this event
          if (!event.column || $scope.columnMoved !== null) return;
          agGridConfService.showHideColumns($scope.agGrid, [event.column.colId], event.visible);
        };

        $rootScope.$on('confGridRemoved', function() {
          if ($scope.agGrid.gridOptions.columnApi) {
            $scope.agGrid.gridOptions.columnApi.resetColumnState();
          }
        });

        $scope.loadConfGrid = function() {
          agGridConfService.loadConfGridByGridName($scope.agGrid.gridOptions, $scope.agGrid.gridName);
        };
      }
    }
  }).factory('agGridConfService', ['$rootScope', 'confGridService', function ($rootScope, confGridService) {
    var service = {};
    var listenToEvents = true;

    service.setListenToEvents = function(listenOrNot) {
      listenToEvents = listenOrNot;
    };

    service.isListenToEvents = function() {
      return listenToEvents;
    };

    service.createColumnState = function(gridName, action, field, value) {
      var json = {
        'gridName': gridName,
        'action': action,
        'field': field
      };

      switch (action) {
        case 'columnResized':
          json['width'] = value;
          break;
        case 'columnSorted':
          json['sort'] = value;
          break;
        case 'columnMoved':
          json['position'] = value;
          break;
        case 'columnVisible':
          json['visible'] = value;
          break;
      }

      return json;
    };

    service.loadConfGridByGridName = function(gridOptions, gridName) {
      confGridService.get({'gridName': gridName}, function(data) {
          service.loadConfGrid(gridOptions, data.conf);
        },
        function () {
          console.log('No grid conf found for grid: ' + gridName);
        });
    };

    service.loadConfGrid = function(gridOptions, confs) {
      service.setListenToEvents(false);
      var sortModel = [];
      $.each(JSON.parse(confs), function(i, conf) {
        if (conf.width !== undefined) {
          gridOptions.columnApi.setColumnWidth(conf.field, conf.width);
        }
        if (conf.position !== undefined) {
          gridOptions.columnApi.moveColumn(conf.field, conf.position);
        }
        if (conf.visible !== undefined) {
          gridOptions.columnApi.setColumnVisible(conf.field, conf.visible);
        }
        if (conf.sort !== undefined) {
          sortModel.push({
            colId: conf.field,
            sort: conf.sort
          });
        }
      });
      if (sortModel.length > 0) {
        gridOptions.api.setSortModel(sortModel);
      }
      service.setListenToEvents(true);
    };

    service.saveColumnState = function(json) {
      service.setListenToEvents(false);
      confGridService.save(json, function() {
          console.log('A column has been updated: ' + JSON.stringify(json));
          service.setListenToEvents(true);
        },
        function (response) {
          console.log('An error occurred while updating column: ' + response.statusText + ' for grid: ' + json.gridName);
          service.setListenToEvents(true);
        }
      );
    };

    service.removeConfGrid = function(gridName) {
      confGridService.delete({'gridName': gridName}, function(data) {
          var msg = 'Conf for the grid ' + gridName + ' has been deleted';
          console.log(msg);
          $rootScope.$broadcast('success', {items: msg});
          $rootScope.$broadcast('confGridRemoved');
        },
        function (response) {
          console.log('No grid conf found to delete for grid: ' + gridName);
        });
    };

    service.showHideColumns = function(agGrid, columnList, visible) {
      var gridName = agGrid.gridName;
      var action = 'columnVisible';
      var columns = [];
      $.each(columnList, function (i, col) {
        columns.push(service.createColumnState(gridName, action, col, visible));
      });
      $.each(service.getSortedColumns(agGrid.gridOptions, gridName), function(i,e) {
        columns.push(e);
      });

      confGridService.updateColumns({'gridName': gridName, 'columns': columns}, function(data) {
          console.log(columns.length + ' column(s) for the grid ' + gridName + ' has been set to: ' + (visible ? 'visible' : 'hidden'));
        },
        function (response) {
          console.log('An error occurred while showing/hiding columns: ' + response.statusText + ' for grid: ' + gridName);
        }
      );
    };

    service.resizeColumns = function(agGrid, eventColumns) {
      service.setListenToEvents(false);
      var gridName = agGrid.gridName;
      var action = 'columnResized';
      var columns = [];
      $.each(eventColumns, function (i, col) {
        columns.push(service.createColumnState(gridName, action, col.colId, col.actualWidth));
      });
      $.each(service.getSortedColumns(agGrid.gridOptions, gridName), function(i,e) {
        columns.push(e);
      });

      confGridService.updateColumns({'gridName': gridName, 'columns': columns}, function(data) {
          console.log(columns.length + ' column(s) for the grid ' + gridName + ' has been resized');
          service.setListenToEvents(true);
        },
        function (response) {
          console.log('An error occurred while resizing columns: ' + response.statusText + ' for grid: ' + gridName);
          service.setListenToEvents(true);
        }
      );
    };

    service.removeSort = function(gridName) {
      confGridService.removeSort({'gridName': gridName}, function (data) {
          console.log('Sort have been removed for the grid ' + gridName);
          service.setListenToEvents(true);
        },
        function (response) {
          console.log('An error occurred while removing sorted columns: ' + response.statusText + ' for grid: ' + gridName);
          service.setListenToEvents(true);
        }
      );
    };

    service.sortsColumns = function(agGrid, eventSorts) {
      service.setListenToEvents(false);
      var gridName = agGrid.gridName;
      if (eventSorts.length == 0) {
        service.removeSort(gridName);
      } else {
        var columns = service.getSortedColumns(agGrid.gridOptions, gridName);
        if (columns.length > 0) {
          confGridService.updateColumns({'gridName': gridName, 'columns': columns}, function (data) {
              console.log(columns.length + ' column(s) for the grid ' + gridName + ' has been sorted');
              service.setListenToEvents(true);
            },
            function (response) {
              console.log('An error occurred while sorting columns: ' + response.statusText + ' for grid: ' + gridName);
              service.setListenToEvents(true);
            }
          );
        }
      }
    };

    service.getSortedColumns = function(gridOptions, gridName) {
      var sortedColumns = gridOptions.api.getSortModel();
      var columns = [];
      if (sortedColumns.length > 0) {
        var action = 'columnSorted';
        $.each(sortedColumns, function (i, col) {
          columns.push(service.createColumnState(gridName, action, col.colId, col.sort));
        });
      }
      return columns;
    };

    service.positionColumn = function(gridName, field, position) {
      var action = 'columnMoved';
      service.saveColumnState(service.createColumnState(gridName, action, field, position));
    };

    return service;
  }]);
