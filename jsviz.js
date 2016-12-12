(function(){
var app = angular.module("jsViz", []);
app.directive("jsviz", function() {
    return {
        scope: {
            variables: "="
        },
        template: '<div class="key-value" ng-repeat="(key, value) in variables">' +
            '<div class="key" title="Variable Name">{{key}}</div> ' +
            '<jsviz-value value="value">' +
        '</div>'
    }
});
app.directive("jsvizValue", function() {
    return {
        scope: {
            value: "=",
            depth: "@"
        },
        link: function(scope, element, attrs) {
            scope.type = function(value, depth) {
                if (depth && depth.length > 8) {
                    return 'depth-exceeded';
                }
                var type = typeof value;
                if (type === 'string' || type === 'number' || type === 'boolean' || type === 'function') {
                    return type;
                } else if (!value) {
                    return 'null';
                } else if (Array.isArray(value)) {
                    return 'array';
                } else if (type === 'object') {
                    return 'object';
                } else {
                    return 'null';
                }
            };
            scope.empty = function(value) {
                if (Array.isArray(value)) {
                    return value.length === 0;
                } else if (typeof value === 'object') {
                    return Object.keys(value).length === 0;
                } else {
                    return false;
                }
            };
        },
        replace: true,
        template: '<div class="value"><jsviz-string ng-if="type(value, depth) === \'string\'"/>' +
                  '<jsviz-number ng-if="type(value, depth) === \'number\'"/>' +
                  '<jsviz-boolean ng-if="type(value, depth) === \'boolean\'"/>' +
                  '<jsviz-object ng-if="type(value, depth) === \'object\'"/>' +
                  '<jsviz-function ng-if="type(value, depth) === \'function\'"/>' +
                  '<jsviz-array ng-if="type(value, depth) === \'array\'"/>' +
                  '<span class="null" ng-if="type(value, depth) === \'null\'">{{value === null ? "null" : "undefined"}}</span>' +
                  '<span class="depth-exceeded" ng-if="type(value, depth) === \'depth-exceeded\'">&lt;max depth&gt;</span></div>'
    };
});
app.directive("jsvizString", function() {
    return {
        replace: true,
        template: '<span class="string" title="Type: String">{{value}}</span>'
    };
});
app.directive("jsvizNumber", function() {
    return {
        replace: true,
        template: '<span class="number" title="Type: Number">{{value}}</span>'
    };
});
app.directive("jsvizBoolean", function() {
    return {
        replace: true,
        template: '<span class="boolean" title="Type: Boolean">{{value}}</span>'
    };
});
app.directive("jsvizArray", function() {
    return {
        replace: true,
        template: '<div class="array" title="Type: Array">' +
            '<span class="empty" ng-if="empty(value)">&lt;Empty Array&gt;</span>' +
            '<div class="element" ng-repeat="el in value track by $index">' +
                '<div class="index" title="Array Index: {{$index}}">{{$index}}</div> ' +
                '<jsviz-value value="el" depth="{{depth + \'*\'}}"/>' +
            '</div></div>'
    };
});
app.directive("jsvizObject", function() {
    return {
        replace: true,
        template: '<div class="object" title="Type: Object">' +
            '<span class="empty" ng-if="empty(value)">&lt;Empty Object&gt;</span>' +
            '<div class="key-value" ng-repeat="(key,val) in value track by $index">' +
                '<div class="key" title="Property Name (aka: key)">{{key}}</div> ' +
                '<jsviz-value value="val" depth="{{depth + \'*\'}}"/>' +
            '</div></div>'
    };
});
app.directive("jsvizFunction", function() {
    return {
        replace: true,
        template: '<div class="function" title="Type: Function">{{value.toString()}}</div>'
    };
});

app.service("jsvizSync", function() {
    /**
     * A function that syncs properties and values from a source object to a
     * target object. Optionally a third parameter specified an array of
     * properties that may be on the source but should not be on the target
     */
    var sync = this.sync = function(source, target, blacklist) {
        blacklist = blacklist || [];
        var sourceProps = [];
        // copy props from source to target
        for (var prop in source) {
            if (blacklist.indexOf(prop) === -1) {
                sourceProps.push(prop);
                target[prop] = source[prop];
            }
        }
        // remove and extra properties from target
        for (var prop in target) {
            if (sourceProps.indexOf(prop) === -1) {
                delete target[prop];
            }
        }
    }

    /**
     * Build and return a function that will sync all properties from the source
     * object to the target option. A blacklist will be used that includes all
     * the properties that are on the source when this builder function is
     * called.
     */
    this.buildSyncFunction = function(source, target) {
        // Initial list of properties of source object. These will be ignored.
        var blacklist = [];
        for (var prop in source) {
            blacklist.push(prop);
        }

        return function() {
            sync(source, target, blacklist);
        }
    }
    console.log(this);
});
}());
