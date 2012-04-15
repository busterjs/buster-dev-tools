var testCase = require("buster").testCase;
var assert = buster.assert;
var refute = buster.refute;

var fs = require("fs");
var path = require("path");

var du = require("../lib/dev-util");
var quote               = du.quote,
    directoryExists     = du.directoryExists,
    fileExists          = du.fileExists,
    itMatches           = du.itMatches,
    isOptionalDep       = du.isOptionalDep,
    installNpmDummy     = du.installNpmDummy
;

testCase("dev-utils", {

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
            assert.exception( function() { itMatches("foo", { name: "", version: "" })  },  "TypeError");
        },

        "throws if property `name` is missing from last arg": function() {
            assert.exception( function() { itMatches("foo", { kind: "", version: "" })  },  "TypeError");
        },

        "throws if property `version` is missing from last arg": function() {
            assert.exception( function() { itMatches("foo", { kind: "", name: "" })  },  "TypeError");
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

            var contents = fs.readFileSync(this.existingPackageFile);
            assert.equals(contents, this.existingPackageFileContents, "contents of existent file");

        },

    },

});
