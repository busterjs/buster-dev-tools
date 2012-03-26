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
    assert1stArgIsFunction(g);
    g = (args.length > 0) ? partialApply(g, args) : g; // bind to any arguments given here
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
    assert1stArgIsFunction(g);
    g = (args.length > 0) ? partialApply(g, args) : g; // bind to any arguments given here
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

function If() {
    var args = toArray(arguments);
    var g = args.shift();
    assert1stArgIsFunction(g);
    g = (args.length > 0) ? partialApply(g, args) : g; // bind to any arguments given here
    var lhs = True; // lhs = Left Hand Side (i.e. left of '.'); for If this is vacouus => True
    var result = function() {
        var answer = g.apply(this, arguments);
        if (DEBUG) console.log("DEBUG: If'(" + args.concat(toArray(arguments)).join(",") + "), this=" + this + " => " + answer);
        return answer;
    };
    result.And = And;
    result.Then = Then;
    return result;
    
}


/* Exports ------------------------------------------------------ */

module.exports = {
    // Note: only need to export the "base", you'll just "dot" your way through from there on:
    True:            True,
    False:           False,
    If:          If
};