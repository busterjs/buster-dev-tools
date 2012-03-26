var path   = require("path");
var fs     = require("fs");
var util   = require("util"); // Node utilities

var fh = require("./fn-helpers");
var partialApply = fh.partialApply,
    toArray      = fh.toArray;

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

// Puts a minimal package.json into this.localPath/node_modules/subDep s.t. npm will skip installation of the sub-dependency subDep
function installNpmDummy(subDep, dep) {
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
        console.log("Note: skipped" + whatWeDo + " - already exists.");
    }
    return false; // indicate to NOT skip parent dependency
}


/* Exports ------------------------------------------------------ */

module.exports = {
    devDir:          path.resolve(__dirname, "../../"), // dev env is two folders up from here, independent of current working dir
    quote:           quote,
    directoryExists: directoryExists,
    fileExists:      fileExists,
//    platformIs:      platformIs, // no, better use one of the below instead (or add your own here)
    onWindows:       partialApply(platformIs, ["win32"]),
    onMaxOS:         partialApply(platformIs, ["darwin"]),
    onLinux:         partialApply(platformIs, ["linux2"]), // TODO: not sure about this one (see http://nodejs.org/api/process.html#process_process_platform)
    itMatches:       itMatches,
    installNpmDummy: installNpmDummy,
};