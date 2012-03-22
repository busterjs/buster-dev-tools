var path = require("path");
var cp = require("child_process");
var util = require("util");
var fs = require("fs");

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
    var pkgJsonPath = path.join(project.localPath, "package.json");
    var pkg = require(pkgJsonPath);
    var deps = [];
    var depName, depVersion;

    // Deliberately not installing optional dependencies
    ["dependencies",
     "devDependencies"].forEach(function (prop) {
        if (!(prop in pkg)) return;
        for (depName in pkg[prop]) {
            depVersion = pkg[prop][depName];
            if (isInternalProject(projects, depName)) continue;
            if (project.skipDep(depName, depVersion)) continue;
            deps = deps.concat(depName + "@" + depVersion);
        }
    });

    if (deps.length == 0) return done();

    var cmd = "npm install " + deps.join(" ");
    cp.exec(cmd, {cwd: project.localPath}, function (err, stdout, stderr) {
        if (err) throw err;
        done();
    });
}
installDeps.label = "Installing non-buster deps";

function submodules (projects, project, done) {
    var cmd = "git submodule update --init";
    cp.exec(cmd, {cwd: project.localPath}, function (err, stdout, stderr) {
        if (err) throw err;
        done();
    });
}
submodules.label = "Updating git submodules";


function quote (path) {
    return '"' + path + '"';
}

function isInternalProject (projects, projectName) {
    return projects.some(function (p) {
        return p.name === projectName;
    });
}

function directoryExists (p) {
    if (!path.existsSync(p)) return false;
    var stat = fs.statSync(p);
    return stat.isDirectory();
}

module.exports = {
    doOperations: doOperations,
    pull: pull,
    installDeps: installDeps,
    submodules: submodules
}