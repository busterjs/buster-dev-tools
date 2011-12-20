var projects = require("./project-list");
var f = require("./functions");

var argv = process.argv.slice(2);
var tasks = [];

if (argv.indexOf("--skip-update") > -1) {
    tasks.push(f.updateProject);
}

tasks.push(f.symlinkProjectDependencies);
tasks.push(f.npmLinkProject);
tasks.push(f.symlinkProjectDependencies);
tasks.push(f.updateProjectSubmodules);

f.withProjects(projects, tasks);