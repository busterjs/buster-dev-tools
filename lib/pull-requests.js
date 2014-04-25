var when_parallel = require("when/parallel");
var https = require("https");

function determineNumberOfPullRequests(projects) {
    return when_parallel(projects.map(function (project) {
        return function () {
            determineNumberOfPullRequestsOfProject(project.name);
        }
    }));
}

function determineNumberOfPullRequestsOfProject(projectName) {

    https.get("https://github.com/busterjs/" + projectName, function(res) {
        
        var data = "";
        res.on("data", function(chunk) {
            data += chunk;
        });
        res.on("end", function() {
            var startPos = data.search('<span +class *= *["\']full-word["\'] *>Pull Requests</span>');
            data = data.substr(startPos);
            startPos = data.search('<span +class *= *["\']counter["\'] *>');
            data = data.substr(startPos);
            var counterStr = data.match('<span +class *= *["\']counter["\'] *>')[0];
            data = data.substr(counterStr.length)
            var count = parseInt(data);
            var nameToPrint = projectName;
            for (var targetedlength = 25; nameToPrint.length < targetedlength;) {
                nameToPrint += ".";
            }
            console.log(nameToPrint + ": " + count);
        });
    }).on('error', function(e) {
        console.log("Got error: " + e.message);
    });
}

determineNumberOfPullRequests.label = "Determining the number of open pull requests for all projects.";

module.exports = {
    determineNumberOfPullRequests: determineNumberOfPullRequests
};
