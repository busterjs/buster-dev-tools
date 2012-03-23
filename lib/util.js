var devDir = require("path").resolve(__dirname, "../../"); // dev env is two folders up from here, independent of current working dir
var util = require("util"); // Node utilities

function platformIs(platformName) {
    if (typeof platformName != "string") throw new TypeError("invalid argument platformName: " + platformName);
    if (platformName == "") throw new Error("argument platformName must not be empty!");
    return process.platform == platformName;
}

function toArray(a) {
    return util.isArray(a) ? a : Array.prototype.slice.call(a);
}

function assert1stArgIsFunction(f) {
    if (typeof f != 'function') {
        throw new TypeError("first argument must be of type function! got '" + f + "' of type " + (typeof f));
    }
}

function partialApply(f, args) {
    if (arguments.length != 2) throw new Error("expecting exactly 2 arguments, 1st a Function and 2nd an Array! got (" + args.join(',') + ")");
    assert1stArgIsFunction(f);
    if (!util.isArray(args)) throw new Error("second arg must be an Array! got '" + args + "' of type " + (typeof args));
    if (args.length == 0) throw new Error("missing arguments to bind to - result would be equivalent to original function");
    return function() {
        return f.apply(
            this, // leave "this" dynamically scoped
            args.concat(toArray(arguments)) // pass args from partial application plus those from actual invocation
        );
    };
}

var IfOnWin = partialApply(platformIs, ["win32"]);

// matches *last* argument against previous arguments, true iff there's at least one match;
function itMatches() {
    var args = toArray(arguments);
    if (args.length < 2) throw new Error("at least 2 arguments expected");
    if (args.some(function(a) { return typeof a != 'string'; })) {
        throw new TypeError("all arguments must be strings! (" + args.join(",") + ")");
    }
    var m = args.pop();
    m = (m + '@*').split('@').slice(0,2);  // TODO: use semver for this
    return args.some(function(a) {
        a = (a + '@*').split('@').slice(0,2);
        return m[0] == a[0];
    });
}

function dummyAction(subDep, dep) {
    console.log("Should take some action for " + subDep + " (" + this.name + " -> " + dep + " -> ... -> " + subDep + ")");
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
            var answer = condition.apply(this, arguments) ? g.apply(this, arguments) : false;
            console.log("DEBUG: Then'(" + args.concat(toArray(arguments)).join(",") + "), this.name=" + this.name + " => " + answer);
            return answer;
        };
    };
    And = function() {
        var args = toArray(arguments);
        var g = args.shift();
        assert1stArgIsFunction(g);
        g = (args.length > 0) ? partialApply(g, args) : g; // bind to any arguments given here
        var leftConjunct = this;
        var result = function() {
            var answer = leftConjunct.apply(this, arguments) && g.apply(this, arguments);
            console.log("DEBUG: And'(" + args.concat(toArray(arguments)).join(",") + "), this.name=" + this.name + " => " + answer);
            return answer;
        };
        result.And = And;
        result.Then = Then;
        return result;
    };
    f.Then = Then;
    f.And = And;
    return f;
}



module.exports = {
    devDir:      devDir,
    platformIs:  platformIs,
    True:        function() { return true; },
    False:       function() { return false; },
    IfOnWin:     addPropositions(IfOnWin),
    And:         And,
    itMatches:   itMatches,
    dummyAction: dummyAction

};