var path = require("path");
var util = require("./lib/util");
var IfOnWin = util.IfOnWin,
    True    = util.True,
    False   = util.False
;

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
    { name: "buster-bayeux-emitter", skipDep: IfOnWin.AndNameIn("faye", "blahatest") },
    "buster-configuration",
    "buster-client",
    "buster-args",
    "buster-stdio-logger",
    "buster-cli",
    "buster-test-cli",
    "buster-static",
    "buster",
    { name: "buster-jstestdriver", skip: IfOnWin }, // not really necessary; depends on buster-html-doc
    { name: "buster-html-doc"    , skip: IfOnWin }, // not really necessary; depends on contextify (through jsdom) which makes problems on Win
    { name: "buster-docs"        , skip: True    }  // for demo, will be left out completely
];

// Pull in additional projects listed in ./local, same format as above.
try { projects = require("./local").concat(projects) } catch(e){};

// Default values defined here:
function initProject(project) {
    if (typeof project == "string") {
        project = { name: project };
    }
    project.localPath = path.join(util.devDir, project.name);
    project.gitUrl    = project.gitUrl || defaultGitUrl(project.name);
    project.skip      = project.skip || False; // do not skip entire projects by default
    project.skipDep   = project.skipDep || False; // install any (external) deps by default
    return project;
}

module.exports = projects
    .map(initProject)
    .filter(function(p) { return !p.skip(); })
;
