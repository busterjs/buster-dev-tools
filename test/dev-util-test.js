var buster = require("buster-node");
var assert = buster.assert;
var refute = buster.refute;

//var domain = require("domain");  // domains is a new feature in node v0.8, omit for now
var fs = require("fs");
var path = require("path");

var du = require("../lib/dev-util");
var quote               = du.quote,
    directoryExists     = du.directoryExists,
    fileExists          = du.fileExists,
    itMatches           = du.itMatches,
    isOptionalDep       = du.isOptionalDep,
    installNpmDummy     = du.installNpmDummy,
    devDir              = du.devDir,
    runCmd              = du.runCmd
;

buster.testCase("dev-utils", {

    "onWindows, onMacOS, onLinux - there must be exactly one!": function() {
        var results = [du.onWindows(), du.onMacOS(), du.onLinux()];
        var trueCount  = results.reduce( function(acc, v) { return acc + (v ? 1 : 0); }, 0 );
        var falseCount = results.reduce( function(acc, v) { return acc + (v ? 0 : 1); }, 0 );
        assert.equals(trueCount, 1,                 "trueCount, [" + results.join(",") + "]");
        assert.equals(falseCount, results.length-1, falseCount + "falseCount, [" + results.join(",") + "]");
    },

    "quote": {

        "just adds double-quotes around (stringified) arg": function() {
            assert.equals(quote(),              '"undefined"');
            assert.equals(quote(null),          '"null"');
            assert.equals(quote(""),            '""');
            assert.equals(quote('""'),          '""""');
            assert.equals(quote(7),             '"7"');
            assert.equals(quote(__filename),    '"' + __filename + '"');
            assert.equals(quote(__dirname),     '"' + __dirname + '"');
        },

    },

    "directoryExists": {

        "returns true on existent directory": function() {
            assert(directoryExists(__dirname));
        },

        "returns false on existent file": function() {
            refute(directoryExists(__filename));
        },

        "returns false on non-existent directory or file": function() {
            refute(directoryExists(path.join(__dirname, "i", "should", "not", "exist")));
        },

    },

    "fileExists": {

        "returns false on existent directory": function() {
            refute(fileExists(__dirname));
        },

        "returns true on existent file": function() {
            assert(fileExists(__filename));
        },

        "returns false on non-existent file or directory": function() {
            refute(fileExists(path.join(__dirname, "i", "should", "not", "exist")));
        },

    },

    "devDir": {
    
        "is non-empty": function() {
            refute.equals(devDir, "");
        },
    
        "exists": function() {
            assert(directoryExists(devDir), '"' + devDir + '" should exist');
        },
        
        "is an absolute path": function() {
            assert.equals(path.resolve("/foo", devDir), devDir);
        },
        
    },

    "itMatches": {

        "throws if less than 2 args": function() {
            assert.exception( function() { itMatches()      },  "Error", "when called with no arg");
            assert.exception( function() { itMatches("foo") },  "Error", "when called with 1 arg");
        },

        "throws if passed a non-dependency object as last arg": function() {
            assert.exception( function() { itMatches("foo", null)  },  "TypeError");
            assert.exception( function() { itMatches("foo", "bar") },  "TypeError");
        },

        "throws if property `kind` is missing from last arg": function() {
            var d = { name: "", version: "" };
            assert.exception( function() { itMatches("foo", d) },  "TypeError");
        },

        "throws if property `name` is missing from last arg": function() {
            var d = { kind: "", version: "" };
            assert.exception( function() { itMatches("foo", d)  },  "TypeError");
        },

        "throws if property `version` is missing from last arg": function() {
            var d = { kind: "", name: "" };
            assert.exception( function() { itMatches("foo", d)  },  "TypeError");
        },

        "returns false if name doesn't match exactly any arg": function() {
            var d = { kind: "", name: "foo", version: "*" };
            refute(itMatches("Foo", d));
        },

        "returns true if name matches first arg exactly": function() {
            var d = { kind: "", name: "foo", version: "*" };
            assert(itMatches("foo", "bar", d));
        },

        "returns true if name matches second arg exactly": function() {
            var d = { kind: "", name: "foo", version: "*" };
            assert(itMatches("bar", "foo", d));
        },

        "//does semver compliant match": function() {
        },

    },

    "isOptionalDep": {

        "returns true if prop `kind` has value 'opt'": function() {
            var d = { kind: "opt", name: "foo", version: "*" };
            assert(isOptionalDep(d));
        },

        "returns false if prop `kind` has value 'regular'": function() {
            var d = { kind: "regular", name: "foo", version: "*" };
            refute(isOptionalDep(d));
        },

        "returns false if prop `kind` has value 'dev'": function() {
            var d = { kind: "dev", name: "foo", version: "*" };
            refute(isOptionalDep(d));
        },

        "throws if property `kind` is missing from arg": function() {
            var d = { name: "foo", version: "*" };
            assert.exception( function() { isOptionalDep(d)  },  "TypeError");
        },

    },

    "installNpmDummy": {

        setUp: function() {
            this.projectDummy = { name: "dummy-project", localPath: path.join(__dirname, "fixtures") };
            this.dep = "foo";
            this.nonExistingSubDep = "bar";
            this.existingSubDep    = "baz";
            var nodeModules = path.join(this.projectDummy.localPath, "node_modules");
            this.nonExistingPackageFile = path.join(nodeModules, this.nonExistingSubDep, "package.json");
            this.existingPackageFile    = path.join(nodeModules, this.existingSubDep, "package.json");
            
            this.existingPackageFileContents = "asefdio{[%]}uzviubzizrene 7774$";

            this.purgeFixtures = function() {
                if (directoryExists(nodeModules)) { // delete node_modules and contents
                    if (directoryExists(path.join(nodeModules, this.existingSubDep))) {
                        if (fileExists(this.existingPackageFile)) {
                            fs.unlinkSync(this.existingPackageFile);
                        }
                        fs.rmdirSync(path.join(nodeModules, this.existingSubDep));
                    }
                    if (directoryExists(path.join(nodeModules, this.nonExistingSubDep))) {
                        if (fileExists(this.nonExistingPackageFile)) {
                            fs.unlinkSync(this.nonExistingPackageFile);
                        }
                        fs.rmdirSync(path.join(nodeModules, this.nonExistingSubDep));
                    }
                    fs.rmdirSync(nodeModules);
                }
            };

            // make sure projectDummy.localPath exists
            if (!directoryExists(this.projectDummy.localPath)) {
                fs.mkdirSync(this.projectDummy.localPath);
            }

            // start from clean
            this.purgeFixtures();

            // create "existing" package file
            fs.mkdirSync(nodeModules);
            fs.mkdirSync(path.join(nodeModules, this.existingSubDep));
            fs.writeFileSync(this.existingPackageFile, this.existingPackageFileContents);
        },

        tearDown: function() {
            this.purgeFixtures();
        },

        "creates valid package.json at correct location if it's not yet there": function() {
            installNpmDummy.call(this.projectDummy, this.nonExistingSubDep, this.dep);
            assert(fileExists(this.nonExistingPackageFile), this.nonExistingPackageFile + " should exist");

            var contents = require(this.nonExistingPackageFile);
            assert.equals(contents.name, this.nonExistingSubDep, "name field in package.json");
            refute.equals(contents.version, "", "version field in package.json non-empty");
        },

        "leaves existing package.json untouched": function() {
            installNpmDummy.call(this.projectDummy, this.existingSubDep, this.dep);
            assert(fileExists(this.existingPackageFile), this.existingPackageFile + " should exist");

            var contents = fs.readFileSync(this.existingPackageFile, "utf8");
            assert.equals(contents, this.existingPackageFileContents, "contents of existent file");

        },

    },
    
    "runCmd": {
    
        setUp: function() {
            this.fixturesPath = path.join(__dirname, "fixtures");
            this.testDirName = "someDir";
            this.testDirPath = path.join(this.fixturesPath, this.testDirName);
            this.purgeFixtures = function() {
                if (directoryExists(this.testDirPath)) {
                    fs.rmdirSync(this.testDirPath);
                }
            };
            // make sure folder fixtures exists
            if (!directoryExists(this.fixturesPath)) {
                fs.mkdirSync(this.fixturesPath);
            }
            // start from clean
            this.purgeFixtures();
            
            this.testWorkingDir = function(testDone, expectedDir, project, opts) {
                // IMPORTANT: command must be valid on both, Windows and Unixes
                var cmd = "echo %CD%`pwd`"; // trick is: %CD% works in Win Dosbox while `pwd` works on Unix and in Win Git Bash
                var cb = function(stdout, stderr) {
                    var out = stdout.toString().replace(/\r|\n/g,""); // cut off newline sequences
                    var dir = out.match(/^%CD%.+/) ? out.substr(4) : out.substr(0, out.length-5);
                    // let's use path.relative so we're not platform dependent:
                    assert.equals(path.relative(expectedDir, dir), "", 'relative path from "' + expectedDir + '" to "' + dir + '"');
                    testDone();
                };
                if (arguments.length == 4) {
                    runCmd(cmd, project, opts, cb);
                } else {
                    runCmd(cmd, project, cb);
                }
            };
        },
        
        tearDown: function() {
            this.purgeFixtures();
        },
        
        "calls callback with stdout and stderr when done": function(testDone) {
            var s = "foo";
            var c = "echo " + s; // IMPORTANT: command must be valid on both, Windows and Unixes
            var p = { name: "dummyProject" };
            var o = { cwd: null };

            runCmd(c, p, o, function(stdout, stderr) {
                assert.equals(stdout.toString().replace(/\r|\n/g,""), s); // up to newline sequences
                assert.equals(stderr.toString().replace(/\r|\n/g,""), ""); // up to newline sequences
                testDone();
            });
        },

        "does in fact run command in given cwd": function(testDone) {
            var c = "mkdir \"" + this.testDirName + "\""; // IMPORTANT: command must be valid on both, Windows and Unixes
            var p = { name: "dummyProject" };
            var o = { cwd: this.fixturesPath };
            var d = this.testDirPath; // Attention: do NOT use "this" in the callback, it's something else than here!
            
            runCmd(c, p, o, function() {
                assert(directoryExists(d), "cmd: '" + c + "' ~> folder " + d + " should have been created");
                testDone();
            });
        },
        
        "executes in": {
            "given opts.cwd": { // should always execute there, the ifs below are just some cases
                "if project.localPath is missing": function(testDone) {
                    var p = { name: "dummyProject" };
                    var o = { cwd: this.fixturesPath };
                    this.testWorkingDir(testDone, o.cwd, p, o);
                },
            
                "even if project.localPath exists": function(testDone) {
                    var p = { name: "dummyProject", localPath: devDir };
                    var o = { cwd: this.fixturesPath };
                    this.testWorkingDir(testDone, o.cwd, p, o);
                },
            
                "even if project.localPath does not exist": function(testDone) {
                    var p = { name: "dummyProject", localPath: "qumbl/no-such-folder" };
                    var o = { cwd: this.fixturesPath };
                    this.testWorkingDir(testDone, o.cwd, p, o);
                },
            
            },
            
            "devDir": {
                "if project.localPath doesn't exist and arg opts": {
                    "is omitted": function(testDone) {
                        var p = { name: "dummyProject", localPath: "qumbl/no-such-folder" };
                        this.testWorkingDir(testDone, devDir, p);
                    },
                
                    "is null": function(testDone) {
                        var p = { name: "dummyProject", localPath: "qumbl/no-such-folder" };
                        this.testWorkingDir(testDone, devDir, p, null);
                    },
                    
                    "is undefined": function(testDone) {
                        var p = { name: "dummyProject", localPath: "qumbl/no-such-folder" };
                        this.testWorkingDir(testDone, devDir, p, undefined);
                    },
                    
                    "doesn't have property cwd": function(testDone) {
                        var p = { name: "dummyProject", localPath: "qumbl/no-such-folder" };
                        this.testWorkingDir(testDone, devDir, p, {});
                    },
                    
                    "has property cwd = null": function(testDone) {
                        var p = { name: "dummyProject", localPath: "qumbl/no-such-folder" };
                        this.testWorkingDir(testDone, devDir, p, { cwd: null });
                    },
                },
            },
        
            "project.localPath": {
                "if project.localPath exists and arg opts": {
                    "is omitted": function(testDone) {
                        var p = { name: "dummyProject", localPath: this.fixturesPath };
                        this.testWorkingDir(testDone, p.localPath, p);
                    },
                    
                    "is null": function(testDone) {
                        var p = { name: "dummyProject", localPath: this.fixturesPath };
                        this.testWorkingDir(testDone, p.localPath, p, null);
                    },
                    
                    "is undefined": function(testDone) {
                        var p = { name: "dummyProject", localPath: this.fixturesPath };
                        this.testWorkingDir(testDone, p.localPath, p, undefined);
                    },
                    
                    "doesn't have property cwd": function(testDone) {
                        var p = { name: "dummyProject", localPath: this.fixturesPath };
                        this.testWorkingDir(testDone, p.localPath, p, {});
                    },
                    
                    "has property cwd = null": function(testDone) {
                        var p = { name: "dummyProject", localPath: this.fixturesPath };
                        this.testWorkingDir(testDone, p.localPath, p, { cwd: null });
                    },
                    
                },
            },
        },

        // domains is a new feature in node v0.8, CAUTION: buster currently is not working reliably with it
        "//re-throws exception from cmd invocation": function(testDone) {
            var c = "some-invalid-command";
            var p = { name: "dummyProject" };
            var o = { cwd: null };
            var d = domain.create();
            d.on("error", function (err) {
                d.dispose();
                assert.match(err.message, c);
                testDone();
                /*
                testDone(function () {
                    assert.match(err.message, c);
                });
                */
            });
            d.run(function() {
                runCmd(c, p, o, function() {});
            });
        },

    },

});
