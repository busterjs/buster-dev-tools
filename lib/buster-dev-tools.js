var path = require("path");
var cp = require("child_process");
var util = require("util");
var fs = require("fs");

var du = require("./dev-util");
var directoryExists = du.directoryExists,
    quote           = du.quote
;


function doOperations(projects, operations) {
    if (operations.length == 0) return;

    util.print(operations[0].label + ": ");
    doOperationsIter(projects, operations, 0);
}

function doOperationsIter(projects, operations, i, done) {
    if (i == projects.length) {
        util.print("\n");
        return doOperations(projects, operations.slice(1));
    }

    operations[0](projects, projects[i], function () {
        util.print(".");
        doOperationsIter(projects, operations, i + 1, done);
    });
}

function pull (projects, project, done) {
    if (project.skip()) {
        console.log("\n  Note: skipped buster project " + project.name);
        return done();
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

    cp.exec(cmd, opts, function (err, stdout, stderr) {
        if (err) throw err;
        done();
    });
}
pull.label = "Pulling repositories";

function installDeps (projects, project, done) {
    if (project.skip())
        return done();

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

    if (deps.length == 0) return done();

    var cmd = "npm install " + deps.join(" ");
    cp.exec(cmd, {cwd: project.localPath}, function (err, stdout, stderr) {
        if (err) throw err;
        done();
    });
}
installDeps.label = "Installing non-buster deps";

function submodules (projects, project, done) {
    if (project.skip())
        return done();

    var cmd = "git submodule update --init";
    cp.exec(cmd, {cwd: project.localPath}, function (err, stdout, stderr) {
        if (err) throw err;
        done();
    });
}
submodules.label = "Updating git submodules";


function isInternalProject (projects, projectName) {
    return projects.some(function (p) {
        return p.name === projectName;
    });
}

module.exports = {
    doOperations: doOperations,
    pull: pull,
    installDeps: installDeps,
    submodules: submodules
}
