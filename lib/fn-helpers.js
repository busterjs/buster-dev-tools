var util = require("util");

/* Internal helpers --------------------------------------------- */

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

/* Exports ------------------------------------------------------ */

module.exports = {
    toArray:                toArray,
    assert1stArgIsFunction: assert1stArgIsFunction,
    partialApply:           partialApply,
};