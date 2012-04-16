function partialApply(f) {
    if (typeof f != 'function') // Note: also covers no arg case
        throw new TypeError("first argument must be of type function! got '" + f + "' of type " + (typeof f));
    var args = [].slice.call(arguments, 1);
    if (args.length == 0)
        return f; // no point in partially applying nothing - it's just the same function
    return function() {
        return f.apply(
            this, // leave "this" dynamically scoped
            args.concat([].slice.call(arguments)) // pass args from partial application plus those from actual invocation
        );
    };
}

/* Exports ------------------------------------------------------ */

module.exports = {
    partialApply: partialApply
};