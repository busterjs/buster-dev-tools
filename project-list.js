var path  = require("path");
var devDir = path.resolve(__dirname, "../"); // dev env is one folder up from this file, independent of current working dir

function defaultGitUrl(projectName) {
    return "https://github.com/busterjs/" + projectName + ".git";
}

var projects = [
    {name: "sinon", gitUrl: "https://github.com/cjohansen/Sinon.JS.git"},
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
    "buster-bayeux-emitter",
    "buster-configuration",
    "buster-client",
    "buster-args",
    "buster-stdio-logger",
    "buster-cli",
    "buster-test-cli",
    "buster-static",
    "buster"
//    ,"buster-jstestdriver"    // not really necessary; depends on buster-html-doc
//    ,"buster-html-doc"         // not really necessary; depends on contextify (through jsdom) which makes problems on Win
];

// Pull in additional projects listed in ./local, same format as above.
try { projects = require("./local").concat(projects) } catch(e){};

function initProject(project) {
    if (typeof project == "string") {
        project = { name: project };
    }
    project.gitUrl    = project.gitUrl || defaultGitUrl(project.name);
    project.localPath = path.join(devDir, project.name);
    return project;
}

module.exports = projects
    .map(initProject)
;
