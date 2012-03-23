var path  = require("path");
var devDir = path.resolve(__dirname, "../"); // dev env is one folder up from this file, independent of current working dir

function defaultGitUrl(projectName) {
    return "https://github.com/busterjs/" + projectName + ".git";
}

var projects = [
    { name: "sinon", gitUrl: "https://github.com/cjohansen/Sinon.JS.git" },
    "buster-util",
    "buster-user-agent-parser",
    "buster-terminal",
    "buster-analyzer",
    "buster-syntax",
    "buster-core",
    "buster-assertions",
    "buster-format",
    "buster-evented-logger",
    "buster-test",
    "sinon-buster",
    "buster-glob",
    "buster-resources",
    "buster-capture-server",
    { name: "buster-bayeux-emitter", skipDep: skipOnWindows("faye", "blahatest") },
    "buster-configuration",
    "buster-client",
    "buster-args",
    "buster-stdio-logger",
    "buster-cli",
    "buster-test-cli",
    "buster-static",
    "buster",
    { name: "buster-jstestdriver", skip: platformIsWindows }, // not really necessary; depends on buster-html-doc
    { name: "buster-html-doc"    , skip: platformIsWindows }  // not really necessary; depends on contextify (through jsdom) which makes problems on Win
];

// Pull in additional projects listed in ./local, same format as above.
try { projects = require("./local").concat(projects) } catch(e){};

function initProject(project) {
    if (typeof project == "string") {
        project = { name: project };
    }
    project.gitUrl    = project.gitUrl || defaultGitUrl(project.name);
    project.localPath = path.join(devDir, project.name);
    project.skip      = project.skip || function () { return false; }; // do not skip entire projects by default
    project.skipDep   = project.skipDep || function() { return false; }; // install any (external) deps by default
    return project;
}

function platformIsWindows() {
    return process.platform == "win32";
}

function skipOnWindows() {
    var toBeSkipped = Array.prototype.slice.call(arguments, 0);
    return function (depName, depVersion) {
        if (platformIsWindows() && toBeSkipped.some(function(d) { return d == depName; })) {
            // could take alternative action here, e.g. getting it from somewhere else than thru npm
            console.warn("Warning: skipped dependency " + depName + "@" + depVersion + " of " + this.name);
            return true; // tell operation to skip it
        }
        return false;
    };
}

module.exports = projects
    .map(initProject)
    .filter(function(p) { return !p.skip(); })
;
