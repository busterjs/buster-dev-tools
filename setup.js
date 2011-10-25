var projects = require("./project-list");
var f = require("./functions");

f.withProjects(projects, [f.cloneProject, f.symlinkProjectDependencies, f.npmLinkProject, f.symlinkProjectDependencies, f.initProjectSubmodules]);