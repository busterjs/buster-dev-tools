var path   = require("path");
var fs     = require("fs");
var devDir = path.resolve(__dirname, "../../"); // dev env is two folders up from here, independent of current working dir
var util   = require("util"); // Node utilities


/* Exported helpers --------------------------------------------- */

function quote (path) {
    return '"' + path + '"';
}

function dirEntryStatSync(p) { // well, this ain't exported...
    return (path.existsSync(p)) ? fs.statSync(p) : null;
}

function directoryExists(p) {
    var stat = dirEntryStatSync(p);
    return stat && stat.isDirectory();
}

function fileExists(p) {
    var stat = dirEntryStatSync(p);
    return stat && stat.isFile();
}

// matches *last* argument against previous arguments, true iff there's at least one match;
function itMatches() {
    var args = toArray(arguments);
    if (args.length < 2) throw new Error("at least 2 arguments expected");
    if (args.some(function(a) { return typeof a != 'string'; })) {
        throw new TypeError("all arguments must be strings! (" + args.join(",") + ")");
    }
    var m = args.pop();
    m = splitDependencyDef(m);  // TODO: use semver for this
    return args.some(function(a) {
        a = splitDependencyDef(a);
        return m[0] == a[0];
    });
}

function dummyAction(subDep, dep) {
    console.log("Should take some action for " + subDep + " (" + this.name + " -> " + dep + " -> ... -> " + subDep + ")");
    return false;
};

// Puts a minimal package.json into this.localPath/node_modules/subDep s.t. npm will skip installation of the sub-dependency subDep
function installDummy(subDep, dep) {
    var subDepParts = splitDependencyDef(subDep);
    var nodeModules = path.join(this.localPath, "node_modules");
    if (!directoryExists(nodeModules))
        fs.mkdirSync(nodeModules);
    var subDepDir = path.join(nodeModules, subDepParts[0]);
    if (!directoryExists(subDepDir))
        fs.mkdirSync(subDepDir);
    var packageJson = path.join(subDepDir, "package.json");
    var whatWeDo =  " dummy npm install of " + subDep + " for " + this.name + " -> " + dep + " -> ... -> " + subDep;
    if (!fileExists(packageJson)) {
        fs.writeFileSync(packageJson, '{"name":"' + subDepParts[0] + '","version":"' + subDepParts[1] + '"}');
        console.warn("Warning:" + whatWeDo);
    } else {
        console.log("Note: skipped" + whatWeDo + " - is already there.");
    }
    return false; // indicate to NOT skip parent dependency
}

/* Internal helpers --------------------------------------------- */

// returns two-element array with name of module as 1st and version as 2nd elem (defaultVersion or '*' is used if necessary)
function splitDependencyDef(dep, defaultVersion) {
    var result = (dep + '@' + (defaultVersion || '*')).split('@').slice(0,2);  // TODO: use semver for this
    return result;
}

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
    devDir:          devDir,
    quote:           quote,
    directoryExists: directoryExists,
    fileExists:      fileExists,
//    platformIs:      platformIs, // no, better use one of the below instead (or add your own here)
    onWindows:       partialApply(platformIs, ["win32"]),
    onMaxOS:         partialApply(platformIs, ["darwin"]),
    onLinux:         partialApply(platformIs, ["linux2"]), // TODO: not sure about this one (see http://nodejs.org/api/process.html#process_process_platform)
    itMatches:       itMatches,
    dummyAction:     dummyAction,
    installDummy:    installDummy,
    // Logic; only need to export the "base", you'll just "dot" your way through from there on:
    True:            True,
    False:           False,
    If:              If
};