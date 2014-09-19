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
    
    var options = {
        hostname: "api.github.com",
        path: "/repos/busterjs/" + projectName + "/pulls?state=open",
        headers: {
            "User-Agent": "Buster.JS"
        }
    }
    
    https.get(options, function(res) {
        var data = "";
        res.on("data", function(chunk) {
            data += chunk;
        });
        res.on("end", function() {
            var nameToPrint = projectName;
            for (var targetedlength = 25; nameToPrint.length < targetedlength;) {
                nameToPrint += ".";
            }
            
            if (res.statusCode === 200) {
                var pullRequests = JSON.parse(data);
                var count = pullRequests.length;
                console.log(nameToPrint + ": " + count);
            } else {
                console.log(nameToPrint + ": " + JSON.parse(data).message);
            }
        });
    }).on('error', function(e) {
        console.log("Got error: " + e.message);
    });
}

determineNumberOfPullRequests.label = "Determining the number of open pull requests for all projects.";

module.exports = {
    determineNumberOfPullRequests: determineNumberOfPullRequests
};
