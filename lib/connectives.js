var partialApply = require("./fn-helpers").partialApply;


function id(x) { return x; }

var False = partialApply(id, false);
var True  = partialApply(id, true);

function Then() {
    var g = partialApply.apply(null, arguments); // first arg expected to be function; that's partially applied to the rest of args
    var condition = this;
    return function() {
        return condition.apply(this, arguments) ? g.apply(this, arguments) : false;
    };
};

function And() {
    var result = Then.apply(this, arguments);
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