var when = require("when");
var when_parallel = require("when/parallel");
var du = require("./dev-util");
var runCmd = du.runCmdDeferred;

function determineUnreleasedChanges(projects) {
    return when_parallel(projects.map(function (project) {
        return function () {
            return getGitLogForProject(project).then(function (stdout) {
                var posHeadMaster = stdout.search(/commit [^\n]*HEAD,[^\n]* master/);
                var posLastTag = stdout.search(/commit [^\n]*tag:/);
                if (posHeadMaster === posLastTag) {
                    console.log(project.name + ": nothing to release");
                } else {
                    var changes = stdout.substring(posHeadMaster, posLastTag);
                    changes = changes.replace(/Merge:[^\n]*\n/g, "");
                    changes = changes.replace(/commit[^\n]*\n/g, "");
                    changes = changes.replace(/Author:[^\n]*\n/g, "");
                    changes = changes.replace(/Date:[^\n]*\n/g, "");
                    changes = changes.replace(/\n\n\n/g, "\n\n");
                    console.log(project.name + ": " + changes);
                }
            });
        }
    }));
}

function getGitLogForProject(project) {
    return runCmd("git log origin master --decorate -100", project);
}

determineUnreleasedChanges.label = "Checking for not released changes.";

module.exports = {
    determineUnreleasedChanges: determineUnreleasedChanges
};
