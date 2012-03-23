var devDir = require("path").resolve(__dirname, "../../"); // dev env is two folders up from here, independent of current working dir
var util = require("util"); // Node utilities


/* Exported helpers --------------------------------------------- */

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


/* Internal helpers --------------------------------------------- */

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


/* Logic -------------------------------------------------------- */

function id(x) { return x; }

var False = partialApply(id, [false]);
var True  = partialApply(id, [true]);

function Then() {
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

function And() {
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

function If() {
    var args = toArray(arguments);
    var g = args.shift();
    assert1stArgIsFunction(g);
    g = (args.length > 0) ? partialApply(g, args) : g; // bind to any arguments given here
    var lhs = True; // lhs = Left Hand Side (i.e. left of '.'); for If this is vacouus => True
    var result = function() {
        var answer = g.apply(this, arguments);
        console.log("DEBUG: If'(" + args.concat(toArray(arguments)).join(",") + "), this.name=" + this.name + " => " + answer);
        return answer;
    };
    result.And = And;
    result.Then = Then;
    return result;
    
}


/* Exports ------------------------------------------------------ */

module.exports = {
    devDir:      devDir,
//    platformIs:  platformIs, // no, better use one of the below instead (or add your own here)
    onWindows:   partialApply(platformIs, ["win32"]),
    onMaxOS:     partialApply(platformIs, ["darwin"]),
    onLinux:     partialApply(platformIs, ["linux2"]), // TODO: not sure about this one
    itMatches:   itMatches,
    dummyAction: dummyAction,
    // Logic; only need to export the "base", you'll just "dot" your way through from there on:
    True:        True,
    False:       False,
    If:          If
};