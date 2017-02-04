(function(){
var app = angular.module("jsVizScratch", ["jsViz"]);
app.controller("main", function($scope, $interval, jsvizSync) {
    $scope.variables = {};
    var syncer = jsvizSync.buildSyncFunction(window, $scope.variables);
    $interval(syncer.sync, 300);
});
app.filter('isEmpty', function () {
        return function (obj) {
            return !obj || Object.keys(obj).length === 0;
        };
    });
}());
