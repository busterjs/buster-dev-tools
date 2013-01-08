var path = require("path");
var fs = require("fs");
var util = require("util"); // Node utilities
var cp = require("child_process");
var fh = require("./fn-helpers");

/* Internal helpers --------------------------------------------- */

function dirEntryStatSync(p) { // well, this ain't exported...
    return (fs.existsSync(p)) ? fs.statSync(p) : null;
}

// returns object with properties 'name' and 'version' taken from 'dep' (param defaultVersion or '*' is used if necessary)
// there'll be a property 'kind' as well (see dependencyKinds) but the value of that will always be the empty string.
function splitDependencyDef(dep, defaultVersion) {
    var values = (dep + '@' + (defaultVersion || '*')).split('@').slice(0,2);  // TODO: use semver for this
    return { kind: "", name: values[0], version: values[1] };
}

function platformIs(platformName) {
    if (typeof platformName != "string") throw new TypeError("invalid argument platformName: " + platformName);
    if (platformName == "") throw new Error("argument platformName must not be empty!");
    return process.platform == platformName;
}

function assertIsDependencyObject(dep) {
    if ((typeof dep !== "object") || !('kind' in dep) || !('name' in dep) || !('version' in dep))
        throw new TypeError("expected dependency object but got " + dep);
}

/* Exported helpers --------------------------------------------- */

function quote(path) {
    return '"' + path + '"';
}

function directoryExists(p) {
    var stat = dirEntryStatSync(p);
    return stat && stat.isDirectory();
}

function fileExists(p) {
    var stat = dirEntryStatSync(p);
    return stat && stat.isFile();
}

function isOptionalDep(dep) {
    assertIsDependencyObject(dep);
    return dep.kind == "opt";
}

// matches *last* argument against previous arguments, true iff there's at least one match;
function itMatches() {
    var args = [].slice.call(arguments);
    if (args.length < 2) throw new Error("at least 2 arguments expected");
    var m = args.pop();
    assertIsDependencyObject(m);
    if (args.some(function(a) { return typeof a != 'string'; })) {
        throw new TypeError("all but last argument must be strings! (" + args.concat(m).join(",") + ")");
    }
    return args.some(function(a) {
        a = splitDependencyDef(a);
        return m.name == a.name;    // TODO: take version into account, use semver for this
    });
}

// Puts a minimal package.json into this.localPath/node_modules/subDep s.t. npm will skip installation of the sub-dependency subDep
function installNpmDummy(subDep, dep) {
    subDep = splitDependencyDef(subDep);
    var nodeModules = path.join(this.localPath, "node_modules");
    if (!directoryExists(nodeModules))
        fs.mkdirSync(nodeModules);
    var subDepDir = path.join(nodeModules, subDep.name);
    if (!directoryExists(subDepDir))
        fs.mkdirSync(subDepDir);
    var packageJson = path.join(subDepDir, "package.json");
    var whatWeDo =  " dummy npm install of " + subDep.kind + " dependency " + subDep.name + " for " + this.name + " -> " + dep.name + "@" + dep.version + " -> ... -> " + subDep.name + "@" + subDep.version;
    if (!fileExists(packageJson)) {
        fs.writeFileSync(packageJson, '{"name":"' + subDep.name + '","version":"' + subDep.version + '"}');
        console.warn("\n  Warning:" + whatWeDo);
    } else {
        console.log("\n  Note: skipped" + whatWeDo + " - already exists.");
    }
    return false; // indicate to NOT skip parent dependency
}

function runCmd(cmd, project, opts, done) {
    if (!done) {
        done = opts;
        opts = {};
    }
    opts.cwd = opts.cwd || (directoryExists(project.localPath) ? project.localPath : module.exports.devDir);
    cp.exec(cmd, opts, function (err, stdout, stderr) {
        if (err) {
            console.log("Error occurred when running cmd for " + project.name);
            console.log("Command: ", cmd);
            console.log("Opts: ", opts);
            console.log("Throwing error as exception.");
            throw err;
        }
        done(stdout, stderr);
    });
}

/* Exports ------------------------------------------------------ */

module.exports = {
    devDir:          path.resolve(__dirname, "../../"), // dev env is two folders up from here, independent of current working dir
    dependencyKinds: { regular: "dependencies", dev: "devDependencies", opt: "optionalDependencies" },
    quote:           quote,
    directoryExists: directoryExists,
    fileExists:      fileExists,
//    platformIs:      platformIs, // no, better use one of the below instead (or add your own here)
// platform strings as per see http://nodejs.org/api/process.html#process_process_platform
    onWindows:       fh.partialApply(platformIs, "win32"),
    onMacOS:         fh.partialApply(platformIs, "darwin"),
    onLinux:         fh.partialApply(platformIs, "linux"),
    itMatches:       itMatches,
    isOptionalDep:   isOptionalDep,
    installNpmDummy: installNpmDummy,
    runCmd:          runCmd,
};