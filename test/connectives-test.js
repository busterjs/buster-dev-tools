var testCase = require("buster").testCase;
var assert = buster.assert;
var refute = buster.refute;

var cn = require("../lib/util");
var True = cn.True, False = cn.False, If = cn.If;

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
            //   ,function() { outer.call("bar", "foo"); } // only equal, not same
            //   ,function() { outer.call(0, baz);       } // only equal, not same
            //   ,function() { outer();                  } // undefined vs. some big thing
            //   ,function() { outer.call(null, 42);     } // null vs. some big thing
            ].forEach(function(t) {
                t();
                assert.equals(inner.callCount, outer.callCount, "exact same call counts");
                assert.equals(inner.lastCall.args, outer.lastCall.args, "should pass over arguments");
                assert.same(inner.lastCall.thisValue, outer.lastCall.thisValue, "should pass over thisValue");
                assert.same(inner.lastCall.returnValue, outer.lastCall.returnValue, "should pass over returnValue");
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

        "True should NOT expose any properties": {
            ".Then should NOT be exposed":      function() { refute.defined(True.Then); },
            ".And should NOT be exposed":       function() { refute.defined(True.And);  },
            ".Or should NOT be exposed":        function() { refute.defined(True.Or);   },
            ".If should NOT be exposed":        function() { refute.defined(True.If);   },
            ".Not should NOT be exposed":       function() { refute.defined(True.Not);  },
        },

        "False should NOT expose any properties": {
            ".Then should NOT be exposed":      function() { refute.defined(False.Then); },
            ".And should NOT be exposed":       function() { refute.defined(False.And);  },
            ".Or should NOT be exposed":        function() { refute.defined(False.Or);   },
            ".If should NOT be exposed":        function() { refute.defined(False.If);   },
            ".Not should NOT be exposed":       function() { refute.defined(False.Not);  },
        },

    },

    "`If`, wrapper for boolean expressions": {

        "'Truth table' for `If`": function() {
            this.callingItAlwaysYields(If(True),  true,  "If(True)");
            this.callingItAlwaysYields(If(False), false, "If(False)");
        },

        "`If` called with non-function arg should throw TypeError": function() {
            this.nonFunctionArgTest(cn, "If");
        },

        "`If(function)` should pass over arguments, thisValue and returnValue": function() {
            this.passOverTest(cn, "If");
        },

        "`If` properties": {
            ".Then should NOT be exposed":      function() { refute.defined(If.Then);   },
            ".And should NOT be exposed":       function() { refute.defined(If.And);    },
            ".Or should NOT be exposed":        function() { refute.defined(If.Or);     },
            ".If should NOT be exposed":        function() { refute.defined(If.If);     },
            "//.Not should be exposed":           function() { assert.defined(If.Not);    },
            ".Else should NOT be exposed":      function() { refute.defined(If.Else);   },
            ".ElseIf should NOT be exposed":    function() { refute.defined(If.ElseIf); },
        },

        "`If(function)` properties": {
            ".Then should be exposed":      function() { assert.defined(If(this.spyId).Then); },
            ".And should be exposed":       function() { assert.defined(If(this.spyId).And);  },
            "//.Or should be exposed":        function() { assert.defined(If(this.spyId).Or);   },
            ".If should NOT be exposed":    function() { refute.defined(If(this.spyId).If);   },
            ".Not should NOT be exposed":   function() { refute.defined(If(this.spyId).Not);  },
            "//.Else should be exposed":      function() { assert.defined(If.Else);             },
            "//.ElseIf should be exposed":    function() { assert.defined(If.ElseIf);           },
        },

    },

    "`And` boolean connective": {

        "Truth table for And": function() {
            this.callingItAlwaysYields(If(True) .And(True),  true,  "T And T");
            this.callingItAlwaysYields(If(True) .And(False), false, "T And F");
            this.callingItAlwaysYields(If(False).And(True),  false, "F And T");
            this.callingItAlwaysYields(If(False).And(False), false, "F And F");
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

        "`If(..).And` properties": {
            ".Then should NOT be exposed":      function() { refute.defined(If(True).And.Then); },
            ".And should NOT be exposed":       function() { refute.defined(If(True).And.And);  },
            ".Or should NOT be exposed":        function() { refute.defined(If(True).And.Or);   },
            ".If should NOT be exposed":        function() { refute.defined(If(True).And.If);   },
            "//.Not should be exposed":           function() { assert.defined(If(True).And.Not);  },
            ".Else should NOT be exposed":      function() { refute.defined(If(True).And.Else);   },
            ".ElseIf should NOT be exposed":    function() { refute.defined(If(True).And.ElseIf); },
        },

        "`If(..).And(function)` properties": {
            ".Then should be exposed":      function() { assert.defined(If(True).And(this.spyId).Then);   },
            ".And should be exposed":       function() { assert.defined(If(True).And(this.spyId).And);    },
            "//.Or should be exposed":        function() { assert.defined(If(True).And(this.spyId).Or);   },
            ".If should NOT be exposed":    function() { refute.defined(If(True).And(this.spyId).If);     },
            ".Not should NOT be exposed":   function() { refute.defined(If(True).And(this.spyId).Not);    },
            "//.Else should be exposed":      function() { assert.defined(If(True).And(this.spyId).Else);   },
            "//.ElseIf should be exposed":    function() { assert.defined(If(True).And(this.spyId).ElseIf); },
        },

    },

    "`Then` wrapper for boolean expressions and side-effects": {

        "'Truth table' for Then": function() {
            this.callingItAlwaysYields(If(True).Then(True),   true,  "If(True).Then(True)");
            this.callingItAlwaysYields(If(True).Then(False),  false, "If(True).Then(False)");
            this.callingItAlwaysYields(If(False).Then(True),  false, "If(False).Then(True)");
            this.callingItAlwaysYields(If(False).Then(False), false, "If(False).Then(False)");
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

        "`If(..).Then` properties": {
            ".Then should NOT be exposed":      function() { refute.defined(If(True).Then.Then);   },
            ".And should NOT be exposed":       function() { refute.defined(If(True).Then.And);    },
            ".Or should NOT be exposed":        function() { refute.defined(If(True).Then.Or);     },
            ".If should NOT be exposed":        function() { refute.defined(If(True).Then.If);     },
            ".Not should NOT be exposed":       function() { refute.defined(If(True).Then.Not);    },
            ".Else should NOT be exposed":      function() { refute.defined(If(True).Then.Else);   },
            ".ElseIf NOT should be exposed":    function() { refute.defined(If(True).Then.ElseIf); },
        },

        "`If(..).Then(function)` properties": {
            ".Then should NOT be exposed":  function() { refute.defined(If(True).Then(this.spyId).Then);   },
            ".And should NOT be exposed":   function() { refute.defined(If(True).Then(this.spyId).And);    },
            ".Or should NOT be exposed":    function() { refute.defined(If(True).Then(this.spyId).Or);     },
            ".If should NOT be exposed":    function() { refute.defined(If(True).Then(this.spyId).If);     },
            ".Not should NOT be exposed":   function() { refute.defined(If(True).Then(this.spyId).Not);    },
            "//.Else should be exposed":      function() { assert.defined(If(True).Then(this.spyId).Else);   },
            "//.ElseIf should be exposed":    function() { assert.defined(If(True).Then(this.spyId).ElseIf); },
        },
    },


});

