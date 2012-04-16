var fh = require("./fn-helpers");


function id(x) { return x; }

var no  = fh.partialApply(id, false);
var yes = fh.partialApply(id, true);

function then() {
    var g = fh.partialApply.apply(null, arguments); // first arg expected to be function; that's partially applied to the rest of args
    var condition = this;
    return function() {
        return condition.apply(this, arguments)
            ? (g.apply(this, arguments) ? true : false) // return booleans, not just truthy/falsy
            : false;
    };
};

function and() {
    var result = then.apply(this, arguments);
    result.and = and;
    result.then = then;
    return result;
};

/* Exports ------------------------------------------------------ */

module.exports = {
    // Note: only need to export the "base", you'll just "dot" your way through from there on:
    yes:  yes,
    no:   no,
    when: and.bind(yes)
};