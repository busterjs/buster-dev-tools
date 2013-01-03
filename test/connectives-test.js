var buster = require("buster-node");
var assert = buster.assert;
var refute = buster.refute;

var cn = require("../lib/connectives");
var yes  = cn.yes, 
    no   = cn.no, 
    when = cn.when;

buster.testCase("Connectives", {
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

    "Boolean constants yes and no": {

        "yes should always return true, no matter what args / `this`": function() {
            this.callingItAlwaysYields(yes, true);
        },

        "no should always return false, no matter what args / `this`": function() {
            this.callingItAlwaysYields(no, false);
        },

        "yes properties": function() {
            var f = yes;
            var props = "[" + Object.keys(f).sort().join(",") + "]";
            assert.equals(props, "[]");
        },

        "no properties": function() {
            var f = no;
            var props = "[" + Object.keys(f).sort().join(",") + "]";
            assert.equals(props, "[]");
        },

    },

    "`when`, wrapper for boolean expressions": {

        "'Truth table": {
            "when(yes)": function() { this.callingItAlwaysYields(when(yes), true ); },
            "when(no)":  function() { this.callingItAlwaysYields(when(no),  false); },
        },

        "`when` called with non-function arg should throw TypeError": function() {
            this.nonFunctionArgTest(cn, "when");
        },

        "`when(function)` should pass over arguments, thisValue and returnValue": function() {
            this.passOverTest(cn, "when");
        },

        "`when` properties": function() {
            var f = when;
            var props = "[" + Object.keys(f).sort().join(",") + "]";
            assert.equals(props, "[]");
        },

        "`when(function)` properties": function() {
            var f = when(this.spyId);
            var props = "[" + Object.keys(f).sort().join(",") + "]";
            assert.equals(props, "[and,then]"); //  "[and,otherwise,then,unless]"); //  
        },

    },

    "`and` boolean connective": {

        "Truth table": {
            "yes and yes": function() { this.callingItAlwaysYields(when(yes).and(yes), true ); },
            "yes and no":  function() { this.callingItAlwaysYields(when(yes).and(no ), false); },
            "no and yes":  function() { this.callingItAlwaysYields(when(no ).and(yes), false); },
            "no and no":   function() { this.callingItAlwaysYields(when(no ).and(no ), false); },
        },

        "`and` called with non-function arg should throw TypeError": function() {
            var f = this.spyId; // just some function
            // several ways to get to an and
            this.nonFunctionArgTest(when(yes),          "and");
            this.nonFunctionArgTest(when(no),           "and");
            this.nonFunctionArgTest(when(f),            "and");
            this.nonFunctionArgTest(when(yes).and(yes), "and");
            this.nonFunctionArgTest(when(no).and(yes),  "and");
            this.nonFunctionArgTest(when(f).and(yes),   "and");
            this.nonFunctionArgTest(when(yes).and(no),  "and");
            this.nonFunctionArgTest(when(no).and(no),   "and");
            this.nonFunctionArgTest(when(f).and(no),    "and");
            this.nonFunctionArgTest(when(yes).and(f),   "and");
            this.nonFunctionArgTest(when(no).and(f),    "and");
            this.nonFunctionArgTest(when(f).and(f),     "and");
        },

        "`and(function)` should pass over arguments, thisValue and returnValue": function() {
            // make sure that argument passed to `and` is always called (short-circuit!)
            // several ways to get to an `and`
            this.passOverTest(when(yes),                   "and");
            this.passOverTest(when(yes).and(yes),          "and");
            this.passOverTest(when(yes).and(yes).and(yes), "and");
        },

        "`and` should be short-circuit": function() {
            var spyId = this.spyId;
            var spyT = this.spy(yes);
            var spyF = this.spy(no);

            var yesAndX = when(spyT).and(spyId);
            var noAndX  = when(spyF).and(spyId);

            var testCalls = [
                function(f) { return f();                   },
                function(f) { return f(7);                  },
                function(f) { return f("foo", 23);          },
                function(f) { return f.call({});            },
                function(f) { return f.call({}, 42);        },
                function(f) { return f.call({}, "bar", 77); },
            ];

            testCalls.forEach(function(c) { c(yesAndX); });
            assert.equals(spyT.callCount,  testCalls.length, "left conjunct callCount");
            assert.equals(spyId.callCount, testCalls.length, "right conjunct callCount");

            testCalls.forEach(function(c) { c(noAndX); });
            assert.equals(spyF.callCount,  testCalls.length, "left conjunct callCount");
            assert.equals(spyId.callCount, testCalls.length, "right conjunct should not have been called any more");
        },

        "`when(..).and` properties": function() {
            var f = when(yes).and;
            var props = "[" + Object.keys(f).sort().join(",") + "]";
            assert.equals(props, "[]");
        },

        "`when(..).and(function)` properties": function() {
            var f = when(yes).and(this.spyId);
            var props = "[" + Object.keys(f).sort().join(",") + "]";
            assert.equals(props, "[and,then]"); //  "[and,otherwise,then,unless]"); //  
        },

    },

    "`then` wrapper for boolean expressions and side-effects": {

        "'Truth table' for then": {
            "when(yes).then(yes)": function() { this.callingItAlwaysYields(when(yes).then(yes), true ); },
            "when(yes).then(no)":  function() { this.callingItAlwaysYields(when(yes).then(no),  false); },
            "when(no).then(yes)":  function() { this.callingItAlwaysYields(when(no).then(yes),  false); },
            "when(no).then(no)":   function() { this.callingItAlwaysYields(when(no).then(no),   false); },
        },

        "`then` called with non-function arg should throw TypeError": function() {
            var f = this.spyId; // just some function
            this.nonFunctionArgTest(when(yes),          "then");
            this.nonFunctionArgTest(when(no),           "then");
            this.nonFunctionArgTest(when(f),            "then");
            this.nonFunctionArgTest(when(yes).and(yes), "then");
            this.nonFunctionArgTest(when(no).and(yes),  "then");
            this.nonFunctionArgTest(when(f).and(yes),   "then");
            this.nonFunctionArgTest(when(yes).and(no),  "then");
            this.nonFunctionArgTest(when(no).and(no),   "then");
            this.nonFunctionArgTest(when(f).and(no),    "then");
            this.nonFunctionArgTest(when(yes).and(f),   "then");
            this.nonFunctionArgTest(when(no).and(f),    "then");
            this.nonFunctionArgTest(when(f).and(f),     "then");
        },

        "`then`(function)` should pass over arguments, thisValue and returnValue": function() {
            // make sure that argument passed to `then` is always called (short-circuit!)
            // several ways to get to a `then`
            this.passOverTest(when(yes),                   "then");
            this.passOverTest(when(yes).and(yes),          "then");
            this.passOverTest(when(yes).and(yes).and(yes), "then");
        },

        "function passed to `then` should be called if and only if condition is true": function() {
            var f = this.spy(function(x) { return x; }); // IMPORTANT: fresh function, don't use this.spyId

            when(yes).then(f)();
            assert(f.calledOnce, "when(yes).then(f)");

            when(no).then(f)();
            assert(f.calledOnce, "when(no).then(f)");

            when(yes).and(no).then(f)();
            assert(f.calledOnce, "when(yes).and(no).then(f)");

            when(no).and(no).then(f)();
            assert(f.calledOnce, "when(no).and(no).then(f)");

            when(yes).and(yes).then(f)();
            assert(f.calledTwice, "when(yes).and(yes).then(f)");

            when(no).and(yes).then(f)();
            assert(f.calledTwice, "when(yes).and(yes).then(f)");
        },

        "`when(..).then` properties": function() {
            var f = when(yes).then;
            var props = "[" + Object.keys(f).sort().join(",") + "]";
            assert.equals(props, "[]");
        },

        "`when(..).then(function)` properties": function() {
            var f = when(yes).then(this.spyId);
            var props = "[" + Object.keys(f).sort().join(",") + "]";
            assert.equals(props, "[]"); // "[otherwise,unless"]  //  
        },
    },


});

