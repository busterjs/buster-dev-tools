var path = require("path");
var cp = require("child_process");
var util = require("util");
var fs = require("fs");
var when = require("when");
var when_sequence = require("when/sequence");
var when_parallel = require("when/parallel");

var du = require("./dev-util");
var directoryExists = du.directoryExists,
    quote           = du.quote
;


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

function pull (projects) {
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
    var deferred = when.defer();

    if (project.skip()) {
        console.log("\n  Note: skipped buster project " + project.name);
        return when.resolve();
    }

    var opts = {};
    if (directoryExists(project.localPath)) {
        var cmd = "git pull";
        opts.cwd = project.localPath;
    } else {
        var cmd = "git clone "
            + quote(project.gitUrl) + " "
            + quote(project.localPath);
    }

    runCmd(cmd, project, opts, deferred);

    return deferred;
}

function installDeps (projects, project) {
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
            if (isInternalProject(projects, depName))
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

    var deferred = when.defer();
    var cmd = "npm install " + deps.join(" ");
    runCmd(cmd, project, {cwd: project.localPath}, deferred);

    return deferred;
}

function submodules (projects, project) {
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

    var deferred = when.defer();

    var cmd = "git submodule update --init";
    runCmd(cmd, project, {cwd: project.localPath}, deferred);

    return deferred;
}
submodules.label = "Updating git submodules";


function isInternalProject (projects, projectName) {
    return projects.some(function (p) {
        return p.name === projectName;
    });
}

function runCmd(cmd, project, opts, deferred) {
    cp.exec(cmd, opts, function (err, stdout, stderr) {
        if (err) {
            console.log("Error occurred when running cmd for " + project.name);
            console.log("Command: ", cmd);
            console.log("Opts: ", opts);
            console.log("Throwing error as exception.");
            throw err;
        }
        deferred.resolve();
    });
}

module.exports = {
    doOperations: doOperations,
    pull: pull,
    installDeps: installDeps,
    submodules: submodules
}
