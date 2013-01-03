var path = require("path"),
    cn = require("./lib/connectives");
    du = require("./lib/dev-util");
var yes = cn.yes, no = cn.no, when = cn.when;
    onWindows = du.onWindows, onMacOS= du.onMacOS, onLinux = du.onLinux,
    isOptionalDep   = du.isOptionalDep,
    itMatches       = du.itMatches,
    installNpmDummy = du.installNpmDummy,
    devDir          = du.devDir,
    fileExists      = du.fileExists;

function defaultGitUrl(projectName) {
    return "https://github.com/busterjs/" + projectName + ".git";
}

var projects = [
    // Temporarily disabled - not ready for 0.7 yet
    // {
    //     name: "buster-jstestdriver",

    //     // 'skip: no' means 'do NOT skip this' (default).
    //     // 'skip: yes' would skip the entire project, 
    //     // just as 'skip: when(onWindows)' would but only on Windows
    //     skip: no
    // },        
    {
        name: "buster-html-doc",
        // Here's a more complex workaround: on Windows, jsdom fails because npm
        // can't install it's dependency contextify. So what we do is put in a
        // dummy contextify s.t. npm will not try to install it. Note that we do
        // NOT entirely skip the installation of jsdom (because installNpmDummy
        // returns false).
        skipDep: when(onWindows).
            and(itMatches, "jsdom").
            then(installNpmDummy, "contextify@0.1.1")
    },
    "ansi-colorizer",
    "bane",
    "buster-analyzer",
    "buster-autotest",
    "buster-cli",
    "buster-configuration",
    "buster-core",
    "buster-dev-tools",
    "buster-lint",
    "buster-node",
    "buster-server-cli",
    "buster-sinon",
    "buster-syntax",
    "buster-test",
    "buster-test-cli",
    "evented-logger",
    "formatio",
    "fs-watch-tree",
    "multi-glob",
    "posix-argv-parser",
    "prefsink",
    "ramp",
    "ramp-resources",
    "referee",
    "referee-sinon",
    "samsam",
    "stack-filter",
    "stream-logger"
];

// Pull in additional projects listed in ./local.js, same format as above.
var localList = "./local.js";
if (fileExists(localList)) {
    projects = require(localList).concat(projects);
}

// Default values defined here:
function initProject(project) {
    if (typeof project == "string") {
        project = { name: project };
    }
    project.localPath = path.join(devDir, project.name);
    project.gitUrl = project.gitUrl || defaultGitUrl(project.name);
    // do not skip entire projects by default
    project.skip = project.skip || no;
    // npm install regular and dev deps but no optional deps by default
    project.skipDep = project.skipDep || when(isOptionalDep);
    return project;
}

module.exports = projects.map(initProject);
