(function(){
var app = angular.module("jsVizPractice", ["jsViz"]);
app.controller("main", function($scope, $interval, $rootScope, jsvizSync, problemSetService, configService) {
    $scope.variables = {};
    $scope.isSolved = isSolved;
    $scope.showInstructions = orDefault(localStorage.jvizShowInstructions, "true") === "true";
    $scope.next = window.next = nextProblem;
    $scope.reset = window.reset = reset;
    $scope.toggleInstructions = function() {
        $scope.showInstructions = !$scope.showInstructions;
        localStorage.jvizShowInstructions = $scope.showInstructions;
    }
    window.goal = function() {
        // Log the goal to the console.
        _.forOwn($scope.goalVariables, function(value, key) {
            console.log(key + " =", value);
        });
    }

    var syncer = jsvizSync.buildSyncFunction(window, $scope.variables);
    $interval(syncer.sync, 300);

    $rootScope.$on("$locationChangeSuccess", function() {
        configService.loadFromUrl();
        problemSetService
            .loadDataSets(configService.get('sourceUrl'), configService.get('setIds'))
            .then(nextProblem);
    });

    function nextProblem() {
        problemSetService.getNextProblem();
        reset();
    }

    function reset() {
        var problem = problemSetService.getCurrentProblem();
        syncer.clear();
        $scope.goalVariables = problem.goal;
        if (problem.start) {
            _.forOwn(problem.start, function(value, key) {
                window[key] = _.cloneDeep(value);
            });
        }
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

app.factory("problemSetService", function($http) {
    var fullSet = [];
    var currentProblemIndex = Infinity;
    var availableSets = {};
    var randomOrder = false;

    function loadDataSets(sourceUrl, setIds) {
        return $http.get(sourceUrl).then(function(response) {
            var includeAllSets = !setIds || _.isEmpty(setIds);
            var sets = response.data.problemSets;
            randomOrder = orDefault(response.data.randomOrder, false);

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

    function getCurrentProblem() {
        return fullSet[currentProblemIndex];
    }

    function getNextProblem() {
        currentProblemIndex++;
        if (currentProblemIndex >= fullSet.length) {
            currentProblemIndex = 0;
            if (randomOrder) {
                fullSet = _.shuffle(fullSet);
            }
        }
        return getCurrentProblem();
    }

    return {
        loadDataSets: loadDataSets,
        getCurrentProblem: getCurrentProblem,
        getNextProblem: getNextProblem
    }
});

app.factory("configService", function($location) {

    var config = {};

    function loadFromUrl() {
        set("setIds", parseArray($location.search().sets), []);
        set("sourceUrl", $location.search().sourceUrl, "practice.json");
    }

    function set(option, value, defaultValue) {
        value = orDefault(value, defaultValue);
        config[option] = value;
    }

    function parseArray(string) {
        if (!string) {
            return undefined;
        }
        return string.toString().split(/[\/,]/);
    }

    return {
        loadFromUrl: loadFromUrl,
        get: function(option) {
            return config[option];
        },
        set: set
    }
});

function orDefault(value, defaultValue) {
    if (typeof value === "undefined") {
        return defaultValue;
    } else {
        return value;
    }
}

}());
