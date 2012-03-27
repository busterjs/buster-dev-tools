var fh   = require("./fn-helpers");
var toArray                = fh.toArray,
    assert1stArgIsFunction = fh.assert1stArgIsFunction,
    partialApply           = fh.partialApply
;
var DEBUG = false;


function id(x) { return x; }

var False = partialApply(id, [false]);
var True  = partialApply(id, [true]);

function Then() {
    var args = toArray(arguments);
    var g = args.shift();
    g = partialApply(g, args); // partially apply to any arguments given here; partialApply checks that g is indeed a function
    var condition = this;
    return function() {
        var answer = condition.apply(this, arguments) ? g.apply(this, arguments) : false;
        if (DEBUG) console.log("DEBUG: Then'(" + args.concat(toArray(arguments)).join(",") + "), this.name=" + this.name + " => " + answer);
        return answer;
    };
};

function And() {
    var args = toArray(arguments);
    var g = args.shift();
    g = partialApply(g, args); // partially apply to any arguments given here; partialApply checks that g is indeed a function
    var leftConjunct = this;
    var result = function() {
        var answer = leftConjunct.apply(this, arguments) && g.apply(this, arguments);
        if (DEBUG) console.log("DEBUG: And'(" + args.concat(toArray(arguments)).join(",") + "), this.name=" + this.name + " => " + answer);
        return answer;
    };
    result.And = And;
    result.Then = Then;
    return result;
};

/* Exports ------------------------------------------------------ */

module.exports = {
    // Note: only need to export the "base", you'll just "dot" your way through from there on:
    True:            True,
    False:           False,
    If:              And.bind(True)
};