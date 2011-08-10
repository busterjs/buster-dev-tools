var sys = require("sys");
var cp = require("child_process");
var fs = require("fs");
var path = require("path");
var projects = require("./project-list");


module.exports = {};
var m = module.exports;

m.withProjects = function(projects, handlers) {
    var handler = handlers.shift();
    if (handler == undefined) {
        console.log("DONE LOL");
        return;
    }

    sys.print(handler.label + ": ");
    m.withProject(projects, 0, handler, function () {
        m.withProjects(projects, handlers);
    });
}

m.withProject = function (projects, index, handler, finished) {
    var project = projects[index++];
    if (project == null) {
        console.log();
        finished();
        return;
    }

    handler(project, function () { m.withProject(projects, index, handler, finished) });
}


m.cloneProject = function (project, cb) {
    var stat;
    try {
        stat = fs.statSync(project);
    } catch(e) {}

    // If the path already exists, don't do anything.
    if (stat) {
        cb();
        return;
    };

    cp.exec("git clone git://gitorious.org/buster/" + project + ".git", function (err, stdout, stderr) {
        if (err) throw err;
        sys.print(".");
        cb();
    });
};
m.cloneProject.label = "Cloning projects";

m.updateProject = function (project, cb) {
    cp.exec("cd " + project + "; git pull origin master", function (err, stdout, stderr) {
        if (err) throw err;
        sys.print(".");
        cb();
    });
};
m.updateProject.label = "Updating projects";

m.symlinkProjectDependencies = function (project, cb) {
    var pkg = JSON.parse(fs.readFileSync(process.cwd() + "/" + project + "/package.json"));
    var pkgRoot = process.cwd() + "/" + project;
    if (!directoryExists(pkgRoot)) {
        fs.mkdirSync(pkgRoot + "/node_modules", 0777);
    }

    for (var dependency in pkg.dependencies) {
        var symlinkTarget = pkgRoot + "/node_modules/" + dependency;
        if (isBusterModule(dependency) && !symlinkExists(symlinkTarget)) {
            fs.symlinkSync(process.cwd() + "/" + dependency, symlinkTarget);
        }
    }

    sys.print(".");;
    cb();
};
m.symlinkProjectDependencies.label = "Symlinking dependencies";


m.npmLinkProject = function(project, cb) {
    cp.exec("cd " + process.cwd() + "/" + project + "; npm link", function (err, stdout, stderr) {
        if (err) throw err;
        sys.print(".");
        cb();
    });
}
m.npmLinkProject.label = "npm linking";

m.initProjectSubmodules = function(project, cb) {
    cp.exec("cd " + process.cwd() + "/" + project + "; git submodule update --init", function (err, stdout, stderr) {
        if (err) throw err;
        sys.print(".");
        cb();
    });
}
m.initProjectSubmodules.label = "Initializing submodules";


function isBusterModule(module) {
    for (var i = 0, ii = projects.length; i < ii; i++) {
        if (projects[i] == module) return true;
    }

    return false;
}

function directoryExists(path) {
    var stat;
    try {
        stat = fs.statSync(path);
    } catch(e) {
        return false;
    }

    if (stat.isDirectory()) {
        return true;
    } else {
        throw new Error("Expected '" + path + "' to be a directory.");
    }
}

function symlinkExists(path) {
    var stat;
    try {
        stat = fs.lstatSync(path);
    } catch(e) {
        return false;
    }

    if (stat.isSymbolicLink()) {
        return true;
    } else {
        throw new Error("Expected '" + path + "' to be a symlink.");
    }
}
