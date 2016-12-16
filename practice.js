(function(){
var app = angular.module("jsVizPractice", ["jsViz"]);
app.controller("main", function($scope, $interval, jsvizSync, $rootScope, practiceSetLoader) {
    $scope.variables = {};
    $scope.isSolved = isSolved;
    window.next = $scope.next = nextProblem;
    
    var syncer = jsvizSync.buildSyncFunction(window, $scope.variables);
    $interval(syncer.sync, 300);

    var fullSet = [];
    $rootScope.$on("$locationChangeSuccess", function() {
        practiceSetLoader().then(function(allProblems) {
            fullSet = allProblems;
            nextProblem();
        });
    });

    var currentProblemIndex = Infinity;
    function nextProblem() {
        if (currentProblemIndex >= fullSet.length) {
            currentProblemIndex = 0;
            _.shuffle(fullSet);
        }
        var next = fullSet[currentProblemIndex++];
        syncer.clear();
        $scope.goalVariables = next;
    }

    function isSolved() {
        var solved = true;
        _.forOwn($scope.goalVariables, function(value, key) {
            if (!_.isEqual(value, $scope.variables[key])) {
                solved = false;
                return false;
            }
        });
        return solved;
    }
});

app.factory("practiceSetLoader", function($location, $http) {
    return function() {
        var setIds = _.filter($location.path().split(/[\/,]/));
        return $http.get("practice.json").then(function(response) {
            var sets = response.data;
            var practiceProblems = [];
            var availableSets = {};
            _.forOwn(sets, function(set, setId) {
                var included = _.includes(setIds, setId);
                availableSets[setId] = included;
                if (included) {
                    practiceProblems = practiceProblems.concat(set);
                }
            });
            return practiceProblems;
        });
    }
});

}());
