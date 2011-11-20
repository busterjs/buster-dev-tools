var projects = require("./project-list");
var f = require("./functions");

f.withProjects(projects, [f.updateProject, f.removeSinon, f.symlinkProjectDependencies, f.npmLinkProject, f.symlinkProjectDependencies, f.updateProjectSubmodules, f.addSinon]);