var projects = require("./project-list");
var functions = require("./functions");

functions.withProjects(projects, [functions.updateProject, functions.symlinkProjectDependencies, functions.npmLinkProject, functions.symlinkProjectDependencies, functions.updateProjectSubmodules]);