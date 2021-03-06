var path = require("path");
var util = require("util");
var when = require("when");
var when_sequence = require("when/sequence");
var when_parallel = require("when/parallel");

var du = require("./dev-util");
var pr = require("./pull-requests");
var ur = require("./unreleased-changes");
var directoryExists = du.directoryExists,
    quote           = du.quote;

var runCmd = du.runCmdDeferred;

function doOperations(projects, operations) {
    when_sequence(operations.map(function (operation) {
        return function () {
            console.log(operation.label);
            return operation(projects).then(function () {
                util.print("\n");
            });
        }
    })).then(function () {
    }, function (err) {
        process.nextTick(function () { throw err });
    });
}

function pull(projects) {
    return when_parallel(projects.map(function (project) {
        return function () {
            return pullProject(project).then(function () {
                util.print(".");
            });
        }
    }))
};
pull.label = "Pulling repositories";

function pullProject(project) {

    if (project.skip()) {
        console.log("\n  Note: skipped buster project " + project.name);
        return when.resolve();
    }

    if (directoryExists(project.localPath)) {
        var cmd = "git pull";
    } else {
        var cmd = "git clone "
            + quote(project.gitUrl) + " "
            + quote(project.localPath);
    }

    return runCmd(cmd, project);
}

function installDeps(projects, project) {
    return when_sequence(projects.map(function (project) {
        return function () {
            return installProjectDeps(projects, project).then(function () {
                util.print(".");
            });
        }
    }))
};
installDeps.label = "Installing non-buster deps";

function installProjectDeps(projects, project) {
    if (project.skip())
        return when.resolve();

    var pkgJsonPath = path.join(project.localPath, "package.json");
    var pkg = require(pkgJsonPath);
    var depKinds = du.dependencyKinds;
    var depName, depStr, dep;
    var deps = [];

    for (kind in depKinds) {
        var prop = depKinds[kind]; // extracts property name in package.json for dependency kind
        for (depName in pkg[prop]) {
            if (isInternalProject(projects, depName) && depName !== "buster")
                continue;
            dep = { kind: kind, name: depName, version: pkg[prop][depName] };
            depStr = dep.name + "@" + dep.version;
            if (project.skipDep(dep)) {
                if (du.isOptionalDep(dep)) {
                    console.log("\n  Note: skipped npm install of " + kind + " dependency " + depStr + " of " + project.name);
                } else {
                    console.warn("\n  Warning: skipped npm install of " + kind + " dependency " + depStr + " of " + project.name);
                }
            } else {
                deps = deps.concat(depStr);
            }
        }
    }

    if (deps.length == 0) return when.resolve();

    var cmd = "npm install " + deps.join(" ");
    return runCmd(cmd, project);
}

function submodules(projects, project) {
    return when_parallel(projects.map(function (project) {
        return function () {
            return updateProjectSubmodule(project).then(function () {
                util.print(".");
            });
        }
    }))
}
submodules.label = "Updating git submodules";

function updateProjectSubmodule(project) {
    if (project.skip())
        return when.resolve();

    var cmd = "git submodule update --init";
    return runCmd(cmd, project);
}

function isInternalProject(projects, projectName) {
    return projects.some(function (p) {
        return p.name === projectName;
    });
}

function clearAllDeps(projects) {
    return when_parallel(projects.map(function (project) {
        return function () {
            return clearAllProjectDeps(project).then(function () {
                util.print(".");
            });
        }
    }));
}
clearAllDeps.label = "Remove node_modules folder of all projects (except for project buster-dev-tools)";

function clearAllProjectDeps(project) {
	if ("buster-dev-tools" === project.name) {
		return when.resolve();
	}

	if (directoryExists(path.join(project.localPath, "node_modules"))) {
	    var cmd = "rm -r node_modules";
	    return runCmd(cmd, project);
	}

	return when.resolve();
}

function npmTest(projects) {
    return when_sequence(projects.map(function (project) {
        return function () {
            return testProject(project).then(function (stdout) {
                stdout && console.log(stdout);
            });
        }
    }));
}
npmTest.label = "Calling 'npm test' for all projects";

function testProject(project) {

    if ("buster-dev-tools" === project.name) {
        return when.resolve();
    }

    console.log("\n\n\n\n\n\n=======> RUNNING TESTS FOR [" + project.name + "]");
    return runCmd("npm test", project);
}


module.exports = {
    doOperations: doOperations,
    pull: pull,
    installDeps: installDeps,
    clearAllDeps: clearAllDeps,
    submodules: submodules,
    npmTest: npmTest,
    changed: ur.determineUnreleasedChanges,
    pullRequests: pr.determineNumberOfPullRequests
}
