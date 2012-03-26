var testCase = require("buster").testCase;
var assert = buster.assert;
var refute = buster.refute;

var fs = require("fs");

var du = require("../lib/dev-util");
var quote               = du.quote,
    directoryExists     = du.directoryExists,
    fileExists          = du.fileExists,
    itMatches           = du.itMatches,
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

        "//returns false on non-existent directory": function() {
        },

        "//returns false on non-existent file": function() {
        },

    },

    "fileExists": {

        "returns false on existent directory": function() {
            refute(fileExists(__dirname));
        },

        "returns true on existent file": function() {
            assert(fileExists(__filename));
        },

        "//returns false on non-existent directory": function() {
        },

        "//returns false on non-existent file": function() {
        },

    },

    "itMatches": {

        "//does semver compliant match": function() {
        },

    },

    "installNpmDummy": {

        "//has expected side effect in file system": function() {
        },

    },

});
