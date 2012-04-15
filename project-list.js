var path = require("path"),
    cn = require("./lib/connectives");
    du = require("./lib/dev-util");
var yes = cn.yes, no = cn.no, when = cn.when;
    onWindows = du.onWindows, onMacOS= du.onMacOS, onLinux = du.onLinux,
    isOptionalDep   = du.isOptionalDep,
    itMatches       = du.itMatches,
    installNpmDummy = du.installNpmDummy,
    devDir          = du.devDir;

function defaultGitUrl(projectName) {
    return "https://github.com/busterjs/" + projectName + ".git";
}

var projects = [
    { name: "buster-jstestdriver", skip: when(onWindows) }, // skip entire project on Windows; depends on buster-html-doc
    { name: "buster-bayeux-emitter"
        ,skipDep: when(onWindows).and(itMatches, "faye", "foobar") // skip npm install of dependency faye (and possibly foobar) on Windows
    },
    { name: "buster-html-doc"
        // Here's a more complex workaround: on Windows, jsdom fails because npm can't install it's dependency contextify
        // So what we do is put in a dummy contextify s.t. npm will not try to install it
        // Note that we do NOT entirely skip the installation of jsdom
        ,skipDep: when(onWindows).and(itMatches, "jsdom").then(installNpmDummy, "contextify@0.1.1")
    },
    { name: "buster-docs", skip: yes },  // just for demo, entire project will be skipped
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
    "buster-dev-tools"
];

// Pull in additional projects listed in ./local, same format as above.
try { projects = require("./local").concat(projects) } catch(e){};

// Default values defined here:
function initProject(project) {
    if (typeof project == "string") {
        project = { name: project };
    }
    project.localPath = path.join(devDir, project.name);
    project.gitUrl    = project.gitUrl || defaultGitUrl(project.name);
    project.skip      = project.skip || no; // do not skip entire projects by default
    project.skipDep   = project.skipDep || when(isOptionalDep); // npm install regular and dev deps but no optional deps by default
    return project;
}

module.exports = projects
    .map(initProject)
    .filter(function(p) { return !p.skip(); })
;
