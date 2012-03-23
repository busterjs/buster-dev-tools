var devDir = require("path").resolve(__dirname, "../../"); // dev env is two folders up from here, independent of current working dir
var util = require("util"); // Node utilities

function platformIs(platformName) {
    if (typeof platformName != "string") throw new TypeError("invalid argument platformName: " + platformName);
    if (platformName == "") throw new Error("argument platformName must not be empty!");
    return process.platform == platformName;
}

function toArray(a, start) {
    return util.isArray(a) ? a : Array.prototype.slice.call(a, start);
}

function assert1stArgIsFunction(f) {
    if (typeof f != 'function') throw new TypeError("first argument must be of type function!");
}

function partialApply() {
    var args = toArray(arguments);
    var f = args.shift();
    assert1stArgIsFunction(f);
    if (args.length == 0) throw new Error("missing arguments to bind to - result would be equivalent to original function");
    return function() {
        return f.apply(
            this, // leave "this" dynamically scoped
            args.concat(toArray(arguments)) // pass args from partial application plus those from actual invocation
        );
    };
}

var IfOnWin = partialApply(platformIs, "win32");

function dummyAction(subDepName, depName, depVersion) {
    console.log("Should take some action for " + subDepName + " (" + this.name + " -> " + depName + "@" + depVersion + " -> " + subDepName + ")");
    return false;
};

function addPropositions(f) {
    assert1stArgIsFunction(f);
    Then = function() {
        var args = toArray(arguments);
        var g = args.shift();
        assert1stArgIsFunction(g);
        g = (args.length > 0) ? partialApply(g, args) : g; // bind to any arguments given here
        var condition = this;
        return function() {
            //console.log("Then'(" + args.concat(toArray(arguments)).join(",") + "), this=" + this);
            var answer = condition.apply(this, arguments) ? g.apply(this, arguments) : false;
            return answer;
        };
    };
    AndNameIn = function() {
        var args = toArray(arguments);
        var leftConjunct = this;
        var result = function (depName, depVersion) {
            //console.log("AndNameIn'(" + args.concat(toArray(arguments)).join(",") + "), this=" + this);
            var answer = leftConjunct.apply(this, arguments) && args.some(function(d) { return d == depName; });
            return answer;
        };
        result.Then = Then;
        return result;
    };
    f.Then = Then;
    f.AndNameIn = AndNameIn;
    return f;
}



module.exports = {
    devDir:      devDir,
    platformIs:  platformIs,
    True:        function() { return true; },
    False:       function() { return false; },
    IfOnWin:     addPropositions(IfOnWin),
    dummyAction: dummyAction

};