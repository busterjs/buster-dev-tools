var path = require("path"),
    util = require("./lib/util");
var True = util.True, False = util.False, If = util.If,
    onWindows = util.onWindows, onMacOS= util.onMacOS, onLinux = util.onLinux,
    itMatches    = util.itMatches,
    installDummy = util.installDummy;

function defaultGitUrl(projectName) {
    return "https://github.com/busterjs/" + projectName + ".git";
}

var projects = [
    { name: "buster-jstestdriver", skip: If(onWindows) }, // skip entire project on Windows; depends on buster-html-doc
    { name: "buster-bayeux-emitter"
        ,skipDep: If(onWindows).And(itMatches, "faye", "foobar") // skip npm install of dependency faye (and possibly foobar) on Windows
    },
    { name: "buster-html-doc"
        // Here's a more complex workaround: on Windows, jsdom fails because npm can't install it's dependency contextify
        // So what we do is put in a dummy contextify s.t. npm will not try to install it
        // Note that we do NOT entirely skip the installation of jsdom
        ,skipDep: If(onWindows).And(itMatches, "jsdom").Then(installDummy, "contextify@0.1.1")
    },
    { name: "buster-docs", skip: True },  // just for demo, entire project will be skipped
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
    "buster-configuration",
    "buster-client",
    "buster-args",
    "buster-stdio-logger",
    "buster-cli",
    "buster-test-cli",
    "buster-static",
    "buster",
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
