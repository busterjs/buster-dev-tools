var devDir = require("path").resolve(__dirname, "../../"); // dev env is two folders up from here, independent of current working dir


function platformIs(platformName) {
    if (typeof platformName != "string") throw new TypeError("invalid argument platformName: " + platformName);
    if (platformName == "") throw new Error("argument platformName must not be empty!");
    return process.platform == platformName;
}

function partialApply() {
    var f = arguments[0];
    if (typeof f != 'function') throw new TypeError("first argument must be of type function!");
    var args = Array.prototype.slice.call(arguments, 1);
    if (args.length == 0) throw new Error("missing arguments to bind to - result would be equivalent to original function");
    return function() {
        return f.apply(
            this, // leave "this" dynamically scoped
            args.concat(arguments) // pass args from partial application plus those from actual invocation
        );
    };
}

var IfOnWin = partialApply(platformIs, "win32");

function addPropositions(f) {
    f.AndNameIn = function() {
        var args = Array.prototype.slice.call(arguments, 0);
        var leftConjunct = this;
        return function (depName, depVersion) {
            if (leftConjunct.apply(this, args) && args.some(function(d) { return d == depName; })) {
                // could take alternative action here, e.g. getting it from somewhere else than thru npm
                console.warn("Warning: skipped dependency " + depName + "@" + depVersion + " of " + this.name);
                return true; // tell operation to skip it
            }
            return false;
        };
    };
    return f;
}

module.exports = {
    devDir:     devDir,
    platformIs: platformIs,
    True:       function() { return true; },
    False:      function() { return false; },
    IfOnWin:    addPropositions(IfOnWin),

};