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
    // If the path already exists, don't do anything.
    if (directoryExists(project)) {
        cb();
        return;
    }

    cp.exec("git clone git@gitorious.org:buster/" + project + ".git", function (err, stdout, stderr) {
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
    var pkgNodeModules = pkgRoot + "/node_modules";
    if (!directoryExists(pkgNodeModules)) {
        fs.mkdirSync(pkgNodeModules, 0777);
    }

    var dependencies =  [];
    if ("dependencies" in pkg) {
        for (var dependency in pkg.dependencies) {
            dependencies.push(dependency);
        }
    }

    if ("devDependencies" in pkg) {
        for (var dependency in pkg.devDependencies) {
            dependencies.push(dependency);
        }
    }

    var operator = function () {
        if (dependencies.length == 0) {
            cb();
        } else {
            var dependency = dependencies.shift();
            if (isBusterModule(dependency)) {
                var symlinkTarget = pkgNodeModules + "/" + dependency;
                cp.exec("rm -rf " + symlinkTarget, function (error, stdout, stderr) {
                    if (error) {
                        throw new Error(error);
                    }

                    fs.symlinkSync(process.cwd() + "/" + dependency, symlinkTarget);
                    sys.print(".");;
                    operator();
                });
            } else {
                operator();
            }
        }
    }

    operator();
};
m.symlinkProjectDependencies.label = "Symlinking dependencies";


m.npmLinkProject = function(project, cb) {
    cp.exec("cd " + process.cwd() + "/" + project + "; npm link", function (err, stdout, stderr) {
        if (err) {
            console.log(project);
            throw err;
        }
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

m.removeSinon = function (project, cb) {
    cp.exec("rm -rf " + project + "/node_modules/sinon", function (error, stdout, stderr) {
        if (!error) sys.print(".");
        cb();
    });
}
m.removeSinon.label = "Removing stable Sinon.JS";

m.addSinon = function (project, cb) {
    var sinonPath = project + "/node_modules/sinon";
    if (directoryExists(sinonPath)) {
        cp.exec("rm -rf " + sinonPath + " && git clone git://github.com/cjohansen/Sinon.JS " + sinonPath, function (err, stdout, stderr) {
            sys.print(".");
            cb();
        });
    } else {
        cb();
    }
}
m.addSinon.label = "Adding Sinon.JS HEAD";


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
