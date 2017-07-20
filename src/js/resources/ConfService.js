var app = angular.module('agGridConf');

app.factory('confService', function ($resource, context) {
    return $resource(context+'/conf/:idConf');
});

app.factory('confGridService', function ($resource, context) {
    return $resource(context+'/conf-grid/:gridName', {}, {
      updateColumns: {
        method: 'GET', params: {}, isArray: false,
        url: context+'/conf-grid/updateColumns'
      },
      removeSort: {
        method: 'GET', params: {}, isArray: false,
        url: context+'/conf-grid/removeSort'
      }
    });
});
