(function(){
var app = angular.module("jsViz");
app.controller("main", function($scope, $interval, jsvizSync) {
    $scope.variables = {};
    var syncFunction = jsvizSync.buildSyncFunction(window, $scope.variables);
    $interval(syncFunction, 300);
});


}());
