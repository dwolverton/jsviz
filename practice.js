(function(){
var app = angular.module("jsVizPractice", ["jsViz"]);
app.controller("main", function($scope, $interval, $rootScope, $location, jsvizSync, problemSetService) {
    $scope.variables = {};
    $scope.isSolved = isSolved;
    $scope.next = window.next = nextProblem;

    var syncer = jsvizSync.buildSyncFunction(window, $scope.variables);
    $interval(syncer.sync, 300);

    $rootScope.$on("$locationChangeSuccess", function() {
        var setIds = _.filter($location.path().split(/[\/,]/));
        problemSetService.loadDataSets(setIds).then(nextProblem);
    });

    function nextProblem() {
        var next = problemSetService.getNextProblem();
        syncer.clear();
        $scope.goalVariables = next;
    }

    function isSolved() {
        if (_.isEmpty($scope.goalVariables)) {
            return false;
        }
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

app.factory("problemSetService", function($location, $http) {
    var fullSet = [];
    var currentProblemIndex = Infinity;
    var availableSets = {};

    function loadDataSets(setIds) {
        return $http.get("practice.json").then(function(response) {
            var includeAllSets = !setIds || _.isEmpty(setIds);
            var sets = response.data;
            var practiceProblems = [];
            availableSets = {};
            _.forOwn(sets, function(set, setId) {
                var included = includeAllSets || _.includes(setIds, setId);
                availableSets[setId] = included;
                if (included) {
                    practiceProblems = practiceProblems.concat(set);
                }
            });
            return practiceProblems;
        }).then(function(practiceProblems) {
            fullSet = practiceProblems;
            currentProblemIndex = Infinity;
        });
    }

    function getNextProblem() {
        if (currentProblemIndex >= fullSet.length) {
            currentProblemIndex = 0;
            fullSet = _.shuffle(fullSet);
        }
        return fullSet[currentProblemIndex++];
    }

    return {
        loadDataSets: loadDataSets,
        getNextProblem: getNextProblem
    }
});

}());
