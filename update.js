var projects = require("./project-list");
var functions = require("./functions");

functions.withProjects(projects, [functions.symlinkProjectDependencies, functions.npmLinkProject, functions.updateProjectSubmodules]);