var testCase = require("buster").testCase;
var assert = buster.assert;
var refute = buster.refute;

var cn = require("../lib/connectives");
var True  = cn.True, 
    False = cn.False, 
    If    = cn.If;

testCase("Connectives", {
    setUp: function() {
        this.spyId = this.spy(function(x) { return x; });
        var obj = {};
        this.callingItAlwaysYields = function(fn, expected, msg) {
            msg = msg ? msg + "; " : "";
            assert.same(fn(),                  expected, msg + "when called with no args");
            assert.same(fn(23),                expected, msg + "when called with 23");
            assert.same(fn(0),                 expected, msg + "when called with 0");
            assert.same(fn.call(null),         expected, msg + "when called with no args, `this` being null");
            assert.same(fn.call(null, 2, '3'), expected, msg + "when called with 2 and '3', `this` being null");
            assert.same(fn.call([]),           expected, msg + "when called with no args, `this` being an array");
            assert.same(fn.call([], 2, '3'),   expected, msg + "when called with 2 and '3', `this` being an array");
            assert.same(fn.call(obj),          expected, msg + "when called with no args, `this` being an object");
            assert.same(fn.call(obj, 2, '3'),  expected, msg + "when called with 2 and '3', `this` being an object");
        };
        this.passOverTest = function(lhs, connectiveName) {
            var inner = this.spy(function(x) { return x; }) // IMPORTANT: all new function, must be sure that it's not somewhere nested in lhs
            var outer = this.spy(lhs[connectiveName](inner));
            var obj = new Object();
            obj.outer = outer;

            [   function() { outer.call(obj);          }
               ,function() { obj.outer();              }
               ,function() { obj.outer("y", 23, 77);   }
               ,function() { outer.call(this, 42);     }
            //   ,function() { outer.call("bar", "foo"); } // thisValue: only equal, not same
            //   ,function() { outer.call(0, baz);       } // thisValue: only equal, not same
            //   ,function() { outer();                  } // thisValue: undefined vs. some big thing
            //   ,function() { outer.call(null, 42);     } // thisValue: null vs. some big thing
            ].forEach(function(t) {
                t();
                assert.equals(inner.callCount, outer.callCount, "exact same call counts");
                assert.equals(inner.lastCall.args, outer.lastCall.args, "should pass over arguments");
                assert.same(inner.lastCall.thisValue, outer.lastCall.thisValue, "should pass over thisValue");
                assert.same(inner.lastCall.returnValue ? true : false, outer.lastCall.returnValue, "should pass over returnValue");
            });
        };
        this.nonFunctionArgTest = function(lhs, connectiveName) {
            var F = lhs[connectiveName];
            assert.exception( function() { F()            }, "TypeError");
            assert.exception( function() { F(null)        }, "TypeError");
            assert.exception( function() { F("blaha")     }, "TypeError");
            assert.exception( function() { F(27)          }, "TypeError");
            assert.exception( function() { F("foo", 4711) }, "TypeError");
        }
    },

    "Boolean constants True and False": {

        "True should always return true, no matter what args / `this`": function() {
            this.callingItAlwaysYields(True, true);
        },

        "False should always return false, no matter what args / `this`": function() {
            this.callingItAlwaysYields(False, false);
        },

        "True properties": function() {
            var f = True;
            var props = "[" + Object.keys(f).sort().join(",") + "]";
            assert.equals(props, "[]");
        },

        "False properties": function() {
            var f = False;
            var props = "[" + Object.keys(f).sort().join(",") + "]";
            assert.equals(props, "[]");
        },

    },

    "`If`, wrapper for boolean expressions": {

        "'Truth table": {
            "If(True)":  function() { this.callingItAlwaysYields(If(True),  true ); },
            "If(False)": function() { this.callingItAlwaysYields(If(False), false); },
        },

        "`If` called with non-function arg should throw TypeError": function() {
            this.nonFunctionArgTest(cn, "If");
        },

        "`If(function)` should pass over arguments, thisValue and returnValue": function() {
            this.passOverTest(cn, "If");
        },

        "`If` properties": function() {
            var f = If;
            var props = "[" + Object.keys(f).sort().join(",") + "]";
            assert.equals(props, "[]");
        },

        "`If(function)` properties": function() {
            var f = If(this.spyId);
            var props = "[" + Object.keys(f).sort().join(",") + "]";
            assert.equals(props, "[And,Then]"); //  "[And,Else,ElseIf,Then]"); //  
        },

    },

    "`And` boolean connective": {

        "Truth table": {
            "T And T": function() { this.callingItAlwaysYields(If(True ).And(True ), true ); },
            "T And F": function() { this.callingItAlwaysYields(If(True ).And(False), false); },
            "F And T": function() { this.callingItAlwaysYields(If(False).And(True ), false); },
            "F And F": function() { this.callingItAlwaysYields(If(False).And(False), false); },
        },

        "`And` called with non-function arg should throw TypeError": function() {
            var f = this.spyId; // just some function
            // several ways to get to an And
            this.nonFunctionArgTest(If(True),               "And");
            this.nonFunctionArgTest(If(False),              "And");
            this.nonFunctionArgTest(If(f),                  "And");
            this.nonFunctionArgTest(If(True).And(True),     "And");
            this.nonFunctionArgTest(If(False).And(True),    "And");
            this.nonFunctionArgTest(If(f).And(True),        "And");
            this.nonFunctionArgTest(If(True).And(False),    "And");
            this.nonFunctionArgTest(If(False).And(False),   "And");
            this.nonFunctionArgTest(If(f).And(False),       "And");
            this.nonFunctionArgTest(If(True).And(f),        "And");
            this.nonFunctionArgTest(If(False).And(f),       "And");
            this.nonFunctionArgTest(If(f).And(f),           "And");
        },

        "`And(function)` should pass over arguments, thisValue and returnValue": function() {
            // make sure that argument passed to And is always called (short-circuit!)
            // several ways to get to an And
            this.passOverTest(If(True),                     "And");
            this.passOverTest(If(True).And(True),           "And");
            this.passOverTest(If(True).And(True).And(True), "And");
        },

        "And should be short-circuit": function() {
            var spyId = this.spyId;
            var spyT = this.spy(True);
            var spyF = this.spy(False);

            var trueAndX = If(spyT).And(spyId);
            var falseAndX = If(spyF).And(spyId);

            var testCalls = [
                function(f) { return f();                   },
                function(f) { return f(7);                  },
                function(f) { return f("foo", 23);          },
                function(f) { return f.call({});            },
                function(f) { return f.call({}, 42);        },
                function(f) { return f.call({}, "bar", 77); },
            ];

            testCalls.forEach(function(c) { c(trueAndX); });
            assert.equals(spyT.callCount,  testCalls.length, "left conjunct callCount");
            assert.equals(spyId.callCount, testCalls.length, "right conjunct callCount");

            testCalls.forEach(function(c) { c(falseAndX); });
            assert.equals(spyF.callCount,  testCalls.length, "left conjunct callCount");
            assert.equals(spyId.callCount, testCalls.length, "right conjunct should not have been called any more");
        },

        "`If(..).And` properties": function() {
            var f = If(True).And;
            var props = "[" + Object.keys(f).sort().join(",") + "]";
            assert.equals(props, "[]");
        },

        "`If(..).And(function)` properties": function() {
            var f = If(True).And(this.spyId);
            var props = "[" + Object.keys(f).sort().join(",") + "]";
            assert.equals(props, "[And,Then]"); //  "[And,Else,ElseIf,Then]"); //  
        },

    },

    "`Then` wrapper for boolean expressions and side-effects": {

        "'Truth table' for Then": {
            "If(True).Then(True)":   function() { this.callingItAlwaysYields(If(True).Then(True),   true ); },
            "If(True).Then(False)":  function() { this.callingItAlwaysYields(If(True).Then(False),  false); },
            "If(False).Then(True)":  function() { this.callingItAlwaysYields(If(False).Then(True),  false); },
            "If(False).Then(False)": function() { this.callingItAlwaysYields(If(False).Then(False), false); },
        },

        "`Then` called with non-function arg should throw TypeError": function() {
            var f = this.spyId; // just some function
            this.nonFunctionArgTest(If(True),             "Then");
            this.nonFunctionArgTest(If(False),            "Then");
            this.nonFunctionArgTest(If(f),                "Then");
            this.nonFunctionArgTest(If(True).And(True),   "Then");
            this.nonFunctionArgTest(If(False).And(True),  "Then");
            this.nonFunctionArgTest(If(f).And(True),      "Then");
            this.nonFunctionArgTest(If(True).And(False),  "Then");
            this.nonFunctionArgTest(If(False).And(False), "Then");
            this.nonFunctionArgTest(If(f).And(False),     "Then");
            this.nonFunctionArgTest(If(True).And(f),      "Then");
            this.nonFunctionArgTest(If(False).And(f),     "Then");
            this.nonFunctionArgTest(If(f).And(f),         "Then");
        },

        "`Then`(function)` should pass over arguments, thisValue and returnValue": function() {
            // make sure that argument passed to Then is always called (short-circuit!)
            // several ways to get to a Then
            this.passOverTest(If(True),                     "Then");
            this.passOverTest(If(True).And(True),           "Then");
            this.passOverTest(If(True).And(True).And(True), "Then");
        },

        "Then(..) result should be called if and only if condition is true": function() {
            var f = this.spy(function(x) { return x; }); // IMPORTANT: fresh function, don't use this.spyId

            If(True).Then(f)();
            assert(f.calledOnce, "If(True).Then(f)");

            If(False).Then(f)();
            assert(f.calledOnce, "If(False).Then(f)");

            If(True).And(False).Then(f)();
            assert(f.calledOnce, "If(True).And(False).Then(f)");

            If(False).And(False).Then(f)();
            assert(f.calledOnce, "If(False).And(False).Then(f)");

            If(True).And(True).Then(f)();
            assert(f.calledTwice, "If(True).And(True).Then(f)");

            If(False).And(True).Then(f)();
            assert(f.calledTwice, "If(True).And(True).Then(f)");
        },

        "`If(..).Then` properties": function() {
            var f = If(True).Then;
            var props = "[" + Object.keys(f).sort().join(",") + "]";
            assert.equals(props, "[]");
        },

        "`If(..).Then(function)` properties": function() {
            var f = If(True).Then(this.spyId);
            var props = "[" + Object.keys(f).sort().join(",") + "]";
            assert.equals(props, "[]"); // "[Else,ElseIf"]  //  
        },
    },


});

