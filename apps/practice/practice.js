(function(){
var app = angular.module("jsVizPractice", ["jsViz"]);
app.controller("main", function($scope, $interval, jsvizSync, problemSetService) {
    $scope.variables = {};
    $scope.isSolved = isSolved;
    $scope.showInstructions = orDefault(localStorage.jvizShowInstructions, "true") === "true";
    $scope.next = window.next = problemSetService.getNextProblem;
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

    $scope.problemSetService = problemSetService;

    var syncer = jsvizSync.buildSyncFunction(window, $scope.variables);
    $interval(syncer.sync, 300);

    $scope.$watch("problemSetService.getCurrentProblem()", reset, true);

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

app.controller("infoBar", function($scope, problemSetService, setsSource, configService) {
    window.cs = configService;

    $scope.problemSetService = problemSetService;
    $scope.config = configService.config;
    $scope.setsSource = setsSource;
    $scope.sets = [];

    $scope.$watch("config.setIds", rebuildSets, true);
    $scope.$watch("setsSource.getAllSetIds()", rebuildSets, true);

    function rebuildSets() {
        $scope.sets = [];
        var activeIds = _.includes(configService.get('setIds'));
        _.forEach(setsSource.getAllSetIds(), function(setId) {
            var active = _.includes(configService.get('setIds'), setId);
            $scope.sets.push({
                id: setId,
                active: active
            })
        });
    }

    $scope.toggleSet = function(setId, active) {
        var activeIds = configService.get('setIds');
        if (active && !_.includes(activeIds, setId)) {
            activeIds.push(setId);
        }
        if (!active) {
            activeIds = _.without(activeIds, setId);
        }
        configService.set('setIds', activeIds);
    }
});

app.factory("problemSetService", function($rootScope, setsSource, configService) {
    var EMPTY_SET = [{goal: {}}];
    var fullSet = EMPTY_SET;
    var currentProblemIndex = 0;
    var randomOrder;

    function buildSet() {
        var setIds = configService.get('setIds');
        var sets = setsSource.getAllSets();
        randomOrder = setsSource.isRandomOrder();

        var includeAllSets = !setIds || _.isEmpty(setIds);

        var practiceProblems = [];
        _.forOwn(sets, function(set, setId) {
            var included = includeAllSets || _.includes(setIds, setId);
            if (included) {
                practiceProblems = practiceProblems.concat(set);
            }
        });
        if (randomOrder) {
            practiceProblems = _.shuffle(practiceProblems);
        }
        if (_.isEmpty(practiceProblems)) {
            practiceProblems = EMPTY_SET;
        }
        fullSet = practiceProblems;
        currentProblemIndex = 0;
    }

    function getCurrentProblem() {
        return fullSet[currentProblemIndex];
    }

    function getCurrentProblemNumber() {
        return currentProblemIndex + 1;
    }

    function getProblemCount() {
        return fullSet.length;
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

    var scope = $rootScope.$new(true);
    scope.config = configService.config;
    scope.$watch("config.setIds", buildSet);
    scope.setsSource = setsSource;
    scope.$watch("setsSource.getAllSets()", buildSet, true);

    return {
        getCurrentProblem: getCurrentProblem,
        getCurrentProblemNumber: getCurrentProblemNumber,
        getNextProblem: getNextProblem,
        getProblemCount: getProblemCount
    }
});

app.factory("setsSource", function($rootScope, $http, configService) {
    var sourceUrl;
    var allSets = {};
    var randomOrder = false;

    function getAllSets() {
        return allSets;
    }

    function getAllSetIds() {
        return Object.keys(allSets);
    }

    function isRandomOrder() {
        return randomOrder;
    }

    function setSourceUrl(newSourceUrl) {
        console.log("a", newSourceUrl);
        if (newSourceUrl !== sourceUrl) {
            sourceUrl = newSourceUrl;
            if (sourceUrl) {
                $http.get(sourceUrl).then(function(response) {
                    allSets = response.data.problemSets;
                    randomOrder = orDefault(response.data.randomOrder, false);
                });
            }
        }
    }

    var scope = $rootScope.$new(true);
    scope.config = configService.config;
    scope.$watch("config.sourceUrl", setSourceUrl);

    return {
        getAllSets: getAllSets,
        getAllSetIds: getAllSetIds,
        isRandomOrder: isRandomOrder
    }
});

app.factory("configService", function($rootScope, $location) {

    var config = {};

    function loadFromUrl() {
        set("setIds", parseArray($location.search().sets), []);
        set("sourceUrl", $location.search().sourceUrl, "practice.json");
    }

    function set(option, value, defaultValue) {
        value = orDefault(value, defaultValue);
        config[option] = value;

        switch (option) {
        case "setIds":
            $location.search("sets", value.join(","));
            break;
        case "sourceUrl":
            $location.search("sourceUrl", value);
            break;
        }
    }

    function parseArray(string) {
        if (!string) {
            return undefined;
        }
        return string.toString().split(/[\/,]/);
    }

    $rootScope.$on("$locationChangeSuccess", function() {
        loadFromUrl();
    });

    return {
        get: function(option) {
            return config[option];
        },
        set: set,
        config: config
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
