/* global suite suiteSetup test */
'use strict';

const {
  assert
} = require('chai');

const {
  apply,
  isTraitificationOf,
  wrap,
  unwrap,
  expresses,
  BareTrait,
  Trait,
  Dedupe,
  HasInstance,
  superclass,
  trait,
  traits
} = require('../../main');

suite('mutrait', () => {
  suite('apply() and isTraitificationOf()', () => {
    test('apply() applies a trait', () => {
      const T = s => class extends s {
        test() {
          return true;
        }

      };

      class Test extends apply(Object, T) {}

      const i = new Test();
      assert.isTrue(i.test());
    });
    test('isApplication() returns true for a trait applied by apply()', () => {
      const T = s => class extends s {};

      assert.isTrue(isTraitificationOf(apply(Object, T).prototype, T));
    });
    test('isApplication() works expressing wrapped traits', () => {
      const T = s => class extends s {};

      const Wrapped = wrap(T, superclass => apply(superclass, T));
      assert.isTrue(isTraitificationOf(Wrapped(Object).prototype, Wrapped));
    });
    test('isApplication() returns false when it should', () => {
      const T = s => class extends s {};

      const U = s => class extends s {};

      assert.isFalse(isTraitificationOf(apply(Object, T).prototype, U));
    });
  });
  suite('expresses()', () => {
    test('expresses() returns true for a trait applied by apply()', () => {
      const T = s => class extends s {};

      assert.isTrue(expresses(apply(Object, T).prototype, T));
    });
  });
  suite('wrap() and unwrap()', () => {
    test('wrap() sets the prototype', () => {
      const f = x => x * x;

      f.test = true;

      const wrapper = x => f(x);

      wrap(f, wrapper);
      assert.isTrue(wrapper.test);
      assert.equal(f, Object.getPrototypeOf(wrapper));
    });
    test('unwrap() returns the wrapped function', () => {
      const f = x => x * x;

      const wrapper = x => f(x);

      wrap(f, wrapper);
      assert.equal(f, unwrap(wrapper));
    });
  });
  suite('BareTrait', () => {
    test('mixin application is on prototype chain', () => {
      const T = BareTrait(s => class extends s {});

      class C extends T(class {}) {}

      const i = new C();
      assert.isTrue(expresses(i, T));
    });
    test('methods on trait are present', () => {
      const T = BareTrait(s => class extends s {
        foo() {
          return 'foo';
        }

      });

      class C extends T(class {}) {}

      const i = new C();
      assert.deepEqual(i.foo(), 'foo');
    });
    test('fields on trait are present', () => {
      const T = BareTrait(s => class extends s {
        constructor() {
          super(...arguments);
          this.field = 12;
        }

        foo() {
          return this.field;
        }

      });

      class C extends T(class {}) {}

      const i = new C();
      assert.deepEqual(i.field, 12);
      assert.deepEqual(i.foo(), 12);
    });
    test('properties on trait are present', () => {
      const T = BareTrait(s => class extends s {
        constructor() {
          super(...arguments);
          this.field = 12;
        }

        get foo() {
          return this.field;
        }

      });

      class C extends T(class {}) {}

      const i = new C();
      assert.deepEqual(i.field, 12);
      assert.deepEqual(i.foo, 12);
    });
    test('fields on superclass are present', () => {
      const T = BareTrait(s => class extends s {
        constructor() {
          super(...arguments);
          this.superclassField = 12;
        }

      });

      class Super {
        foo() {
          return this.superclassField;
        }

      }

      class C extends T(Super) {}

      const i = new C();
      assert.deepEqual(i.superclassField, 12);
      assert.deepEqual(i.foo(), 12);
    });
    test('methods on subclass are present', () => {
      const T = BareTrait(s => class extends s {});

      class C extends T(class {}) {
        foo() {
          return 'foo';
        }

      }

      const i = new C();
      assert.deepEqual(i.foo(), 'foo');
    });
    test('fields on subclass are present', () => {
      const T = BareTrait(s => class extends s {});

      class C extends T(class {}) {
        constructor() {
          super(...arguments);
          this.field = 12;
        }

        foo() {
          return 12;
        }

      }

      const i = new C();
      assert.deepEqual(i.field, 12);
      assert.deepEqual(i.foo(), 12);
    });
    test('methods on trait override superclass', () => {
      const T = BareTrait(s => class extends s {
        foo() {
          return 'bar';
        }

      });

      class Super {
        foo() {
          return 'foo';
        }

      }

      class C extends T(Super) {}

      const i = new C();
      assert.deepEqual(i.foo(), 'bar');
    });
    test('fields on trait override superclass', () => {
      const T = BareTrait(s => class extends s {
        constructor() {
          super(...arguments);
          this.field = 12;
        }

        foo() {
          return this.field;
        }

      });

      class Super {
        constructor() {
          this.field = 13;
        }

        foo() {
          return this.field;
        }

      }

      class C extends T(Super) {}

      const i = new C();
      assert.deepEqual(i.field, 12);
      assert.deepEqual(i.foo(), 12);
    });
    test('methods on trait can call super', () => {
      const T = BareTrait(s => class extends s {
        foo() {
          return super.foo();
        }

      });

      class Super {
        foo() {
          return 'superfoo';
        }

      }

      class C extends T(Super) {}

      const i = new C();
      assert.deepEqual(i.foo(), 'superfoo');
    });
    test('methods on subclass override superclass', () => {
      const T = BareTrait(s => class extends s {});

      class Super {
        foo() {
          return 'superfoo';
        }

      }

      class C extends T(Super) {
        foo() {
          return 'subfoo';
        }

      }

      const i = new C();
      assert.deepEqual(i.foo(), 'subfoo');
    });
    test('fields on subclass override superclass', () => {
      const T = BareTrait(s => class extends s {});

      class Super {
        constructor() {
          this.field = 12;
        }

        foo() {
          return 12;
        }

      }

      class C extends T(Super) {
        constructor() {
          super(...arguments);
          this.field = 13;
        }

        foo() {
          return this.field;
        }

      }

      const i = new C();
      assert.deepEqual(i.field, 13);
      assert.deepEqual(i.foo(), 13);
    });
    test('methods on subclass override mixin', () => {
      const T = BareTrait(s => class extends s {
        foo() {
          return 'mixinfoo';
        }

      });

      class Super {}

      class C extends T(Super) {
        foo() {
          return 'subfoo';
        }

      }

      const i = new C();
      assert.deepEqual(i.foo(), 'subfoo');
    });
    test('fields on subclass override trait', () => {
      const T = BareTrait(s => class extends s {
        constructor() {
          super(...arguments);
          this.field = 12;
        }

        foo() {
          return this.field;
        }

      });

      class Super {}

      class C extends T(Super) {
        constructor() {
          super(...arguments);
          this.field = 13;
        }

        foo() {
          return this.field;
        }

      }

      const i = new C();
      assert.deepEqual(i.field, 13);
      assert.deepEqual(i.foo(), 13);
    });
    test('methods on subclass can call super to superclass', () => {
      const M = BareTrait(s => class extends s {});

      class S {
        foo() {
          return 'superfoo';
        }

      }

      class C extends M(S) {
        foo() {
          return super.foo();
        }

      }

      const i = new C();
      assert.deepEqual(i.foo(), 'superfoo');
    });
  });
  suite('Dedupe', () => {
    test('applies the trait the first time', () => {
      const T = Dedupe(BareTrait(s => class extends s {}));

      class C extends T(class {}) {}

      const i = new C();
      assert.isTrue(expresses(i, T));
    });
    test('doesn\'t apply the trait the second time', () => {
      let applicationCount = 0;
      const T = Dedupe(BareTrait(s => {
        applicationCount++;
        return class extends s {};
      }));

      class C extends T(T(Object)) {}

      const i = new C();
      assert.isTrue(expresses(i, T));
      assert.equal(1, applicationCount);
    });
  });
  suite('HasInstance', () => {
    let hasNativeHasInstance = false;
    suiteSetup(() => {
      // Enable the @@hasInstance patch in mixwith.HasInstance
      if (!Symbol.hasInstance) {
        Symbol.hasInstance = Symbol('hasInstance');
      }

      class Check {
        static [Symbol.hasInstance](o) {
          return true;
        }

      }

      hasNativeHasInstance = 1 instanceof Check;
    });
    test('subclasses implement traits', () => {
      const T = HasInstance(s => class extends s {});

      class C extends T(class {}) {}

      const i = new C();

      if (hasNativeHasInstance) {
        assert.instanceOf(i, C);
      } else {
        assert.isTrue(C[Symbol.hasInstance](i));
      }
    });
  });

  const nthPrototypeOf = (it, n) => {
    if (n < 1) throw new Error('n must be >= 1');
    const proto = Object.getPrototypeOf(it);
    return n === 1 ? proto : nthPrototypeOf(proto, n - 1);
  };

  suite('superclass().expressing()', () => {
    test('applies trait in order expressing superclass', () => {
      const T1 = BareTrait(s => class extends s {});
      const T2 = BareTrait(t => class extends t {});

      class Super {}

      class C extends superclass(Super).expressing(T1, T2) {}

      const i = new C();
      assert.isTrue(expresses(i, T1));
      assert.isTrue(expresses(i, T2));
      assert.isTrue(isTraitificationOf(nthPrototypeOf(i, 2), T2));
      assert.isTrue(isTraitificationOf(nthPrototypeOf(i, 3), T1));
      assert.equal(nthPrototypeOf(i, 4), Super.prototype);
    });
    test('applies traits in order expressing no superclass', () => {
      const T1 = BareTrait(s => class extends s {});
      const T2 = BareTrait(s => class extends s {});

      class C extends traits(T1, T2) {}

      const i = new C();
      assert.isTrue(expresses(i, T1));
      assert.isTrue(expresses(i, T2));
      assert.isTrue(isTraitificationOf(nthPrototypeOf(i, 2), T2));
      assert.isTrue(isTraitificationOf(nthPrototypeOf(i, 3), T1));
      assert.isNotNull(nthPrototypeOf(i, 4));
      assert.equal(nthPrototypeOf(i, 5), Object.prototype);
      assert.isTrue(nthPrototypeOf(i, 6) === null);
    });
    test('superclass() can omit the superclass', () => {
      const T = BareTrait(s => class extends s {
        static staticMixinMethod() {
          return 42;
        }

        foo() {
          return 'foo';
        }

        snafu() {
          return 'M.snafu';
        }

      });

      class C extends traits(T) {
        static staticClassMethod() {
          return 7;
        }

        bar() {
          return 'bar';
        }

        snafu() {
          return 'C.snafu';
        }

      }

      const i = new C();
      assert.isTrue(expresses(i, T), 'expresses');
      assert.isTrue(isTraitificationOf(nthPrototypeOf(i, 2), T), 'isTraitificationOf');
      assert.equal('foo', i.foo());
      assert.equal('bar', i.bar());
      assert.equal('C.snafu', i.snafu());
      assert.equal(42, C.staticMixinMethod());
      assert.equal(7, C.staticClassMethod());
    });
    test('class instanceof trait', () => {
      const T = Trait(c => class extends c {});
      const U = Trait(d => class extends d {});

      class C extends traits(T, U) {}

      const c = new C();
      assert.isTrue(c instanceof C);
      assert.isTrue(expresses(c, T));
      assert.isTrue(expresses(c, U));
      assert.isTrue(c instanceof T);
      assert.isTrue(c instanceof U);
    });
  });
  suite('supertraits', () => {
    test('single supertrait', () => {
      const Supertrait = Trait(s => class extends s {
        foo() {
          return 'foo';
        }

      });
      const Subtrait = Trait(s => class extends superclass(s).expressing(Supertrait) {
        bar() {
          return 'bar';
        }

      });

      class C extends trait(Subtrait) {
        snafu() {
          return 'snafu';
        }

      }

      const c = new C();
      assert.equal(c.foo(), 'foo');
      assert.equal(c.bar(), 'bar');
      assert.equal(c.snafu(), 'snafu');
    });
    test('multiple supertraits', () => {
      const Supertrait1 = Trait(s => class extends s {
        foo1() {
          return 'foo1';
        }

      });
      const Supertrait2 = Trait(s => class extends s {
        foo2() {
          return 'foo2';
        }

      });
      const Subtrait = Trait(s => class extends superclass(s).expressing(Supertrait1, Supertrait2) {
        bar() {
          return 'bar';
        }

      });

      class C extends trait(Subtrait) {
        snafu() {
          return 'snafu';
        }

      }

      const c = new C();
      assert.equal(c.foo1(), 'foo1');
      assert.equal(c.foo2(), 'foo2');
      assert.equal(c.bar(), 'bar');
      assert.equal(c.snafu(), 'snafu');
    });
    test('single supertrait with correct overrides', () => {
      const Supertrait = Trait(s => class extends s {
        foo() {
          return 'foo from Supertrait';
        }

        bar() {
          return 'bar from Supertrait';
        }

        snafu() {
          return 'snafu from Supertrait';
        }

      });
      const Subtrait = Trait(s => {
        return class extends superclass(s).expressing(Supertrait) {
          bar() {
            return 'bar from Subtrait';
          }

          snafu() {
            return 'snafu from Subtrait';
          }

        };
      });

      class C extends trait(Subtrait) {
        snafu() {
          return 'snafu from C';
        }

      }

      const c = new C();
      assert.equal(c.foo(), 'foo from Supertrait');
      assert.equal(c.bar(), 'bar from Subtrait');
      assert.equal(c.snafu(), 'snafu from C');
    });
    test('multiple supertraits with correct overrides', () => {
      const Supertrait1 = Trait(s => class extends s {
        bleep() {
          return 'bleep from Supertrait1';
        }

        foo() {
          return 'foo from Supertrait1';
        }

        bar() {
          return 'bar from Supertrait1';
        }

        snafu() {
          return 'snafu from Supertrait1';
        }

      });
      const Supertrait2 = Trait(s => class extends s {
        foo() {
          return 'foo from Supertrait2';
        }

        bar() {
          return 'bar from Supertrait2';
        }

        snafu() {
          return 'snafu from Supertrait2';
        }

      });
      const Subtrait = Trait(s => class extends superclass(s).expressing(Supertrait1, Supertrait2) {
        bar() {
          return 'bar from Subtrait';
        }

        snafu() {
          return 'snafu from Subtrait';
        }

      });

      class C extends trait(Subtrait) {
        snafu() {
          return 'snafu from C';
        }

      }

      const c = new C();
      assert.equal(c.bleep(), 'bleep from Supertrait1');
      assert.equal(c.foo(), 'foo from Supertrait2');
      assert.equal(c.bar(), 'bar from Subtrait');
      assert.equal(c.snafu(), 'snafu from C');
      assert.isTrue(c instanceof C);
      assert.isTrue(c instanceof Subtrait);
      assert.isTrue(c instanceof Supertrait2);
      assert.isTrue(c instanceof Supertrait1);
    });
  });
  suite('real-world-ish traits', () => {
    test('validation works', () => {
      const Nameable = Trait(superclass => class extends superclass {
        constructor() {
          super(...arguments);
          this._firstName = '';
          this._lastName = '';
        }

        get fullName() {
          return `${this._firstName} ${this._lastName}`;
        }

        set firstName(it) {
          this._firstName = this.checkFirstName(it);
        }

        get firstName() {
          return this._firstName;
        }

        checkFirstName(it) {
          return it;
        }

        set lastName(it) {
          this._lastName = this.checkLastName(it);
        }

        get lastName() {
          return this._lastName;
        }

        checkLastName(it) {
          return it;
        }

      });

      class Person extends trait(Nameable) {
        checkFirstName(it) {
          if (!it) throw new Error('nothing given');
          return it;
        }

        checkLastName(it) {
          if (!it) throw new Error('nothing given');
          return it;
        }

      }

      const first = 'Cheeky';
      const last = 'Monkey';
      const me = new Person();
      me.firstName = first;
      me.lastName = last;
      assert.equal(first, me._firstName);
      assert.equal(last, me._lastName);
      assert.equal(first, me.firstName);
      assert.equal(last, me.lastName);
      assert.equal(`${first} ${last}`, me.fullName);
      assert.throws(() => {
        me.firstName = null;
      });
      assert.throws(() => {
        me.lastName = null;
      });
    });
  });
});
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy90ZXN0L3VuaXQvaW5kZXguc3BlYy5qcyJdLCJuYW1lcyI6WyJhc3NlcnQiLCJyZXF1aXJlIiwiYXBwbHkiLCJpc1RyYWl0aWZpY2F0aW9uT2YiLCJ3cmFwIiwidW53cmFwIiwiZXhwcmVzc2VzIiwiQmFyZVRyYWl0IiwiVHJhaXQiLCJEZWR1cGUiLCJIYXNJbnN0YW5jZSIsInN1cGVyY2xhc3MiLCJ0cmFpdCIsInRyYWl0cyIsInN1aXRlIiwidGVzdCIsIlQiLCJzIiwiVGVzdCIsIk9iamVjdCIsImkiLCJpc1RydWUiLCJwcm90b3R5cGUiLCJXcmFwcGVkIiwiVSIsImlzRmFsc2UiLCJmIiwieCIsIndyYXBwZXIiLCJlcXVhbCIsImdldFByb3RvdHlwZU9mIiwiQyIsImZvbyIsImRlZXBFcXVhbCIsImNvbnN0cnVjdG9yIiwiYXJndW1lbnRzIiwiZmllbGQiLCJzdXBlcmNsYXNzRmllbGQiLCJTdXBlciIsIk0iLCJTIiwiYXBwbGljYXRpb25Db3VudCIsImhhc05hdGl2ZUhhc0luc3RhbmNlIiwic3VpdGVTZXR1cCIsIlN5bWJvbCIsImhhc0luc3RhbmNlIiwiQ2hlY2siLCJvIiwiaW5zdGFuY2VPZiIsIm50aFByb3RvdHlwZU9mIiwiaXQiLCJuIiwiRXJyb3IiLCJwcm90byIsIlQxIiwiVDIiLCJ0IiwiZXhwcmVzc2luZyIsImlzTm90TnVsbCIsInN0YXRpY01peGluTWV0aG9kIiwic25hZnUiLCJzdGF0aWNDbGFzc01ldGhvZCIsImJhciIsImMiLCJkIiwiU3VwZXJ0cmFpdCIsIlN1YnRyYWl0IiwiU3VwZXJ0cmFpdDEiLCJmb28xIiwiU3VwZXJ0cmFpdDIiLCJmb28yIiwiYmxlZXAiLCJOYW1lYWJsZSIsIl9maXJzdE5hbWUiLCJfbGFzdE5hbWUiLCJmdWxsTmFtZSIsImZpcnN0TmFtZSIsImNoZWNrRmlyc3ROYW1lIiwibGFzdE5hbWUiLCJjaGVja0xhc3ROYW1lIiwiUGVyc29uIiwiZmlyc3QiLCJsYXN0IiwibWUiLCJ0aHJv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bG9iYWwgc3VpdGUgc3VpdGVTZXR1cCB0ZXN0ICovXG4ndXNlIHN0cmljdCdcblxuY29uc3QgeyBhc3NlcnQgfSA9IHJlcXVpcmUoJ2NoYWknKVxuXG5jb25zdCB7XG4gIGFwcGx5LFxuICBpc1RyYWl0aWZpY2F0aW9uT2YsXG4gIHdyYXAsXG4gIHVud3JhcCxcbiAgZXhwcmVzc2VzLFxuICBCYXJlVHJhaXQsXG4gIFRyYWl0LFxuICBEZWR1cGUsXG4gIEhhc0luc3RhbmNlLFxuICBzdXBlcmNsYXNzLFxuICB0cmFpdCxcbiAgdHJhaXRzXG59ID0gcmVxdWlyZSgnLi4vLi4vbWFpbicpXG5cbnN1aXRlKCdtdXRyYWl0JywgKCkgPT4ge1xuICBzdWl0ZSgnYXBwbHkoKSBhbmQgaXNUcmFpdGlmaWNhdGlvbk9mKCknLCAoKSA9PiB7XG4gICAgdGVzdCgnYXBwbHkoKSBhcHBsaWVzIGEgdHJhaXQnLCAoKSA9PiB7XG4gICAgICBjb25zdCBUID0gKHMpID0+IGNsYXNzIGV4dGVuZHMgcyB7XG4gICAgICAgIHRlc3QgKCkge1xuICAgICAgICAgIHJldHVybiB0cnVlXG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgY2xhc3MgVGVzdCBleHRlbmRzIGFwcGx5KE9iamVjdCwgVCkge31cblxuICAgICAgY29uc3QgaSA9IG5ldyBUZXN0KClcbiAgICAgIGFzc2VydC5pc1RydWUoaS50ZXN0KCkpXG4gICAgfSlcblxuICAgIHRlc3QoJ2lzQXBwbGljYXRpb24oKSByZXR1cm5zIHRydWUgZm9yIGEgdHJhaXQgYXBwbGllZCBieSBhcHBseSgpJywgKCkgPT4ge1xuICAgICAgY29uc3QgVCA9IChzKSA9PiBjbGFzcyBleHRlbmRzIHMge31cbiAgICAgIGFzc2VydC5pc1RydWUoaXNUcmFpdGlmaWNhdGlvbk9mKGFwcGx5KE9iamVjdCwgVCkucHJvdG90eXBlLCBUKSlcbiAgICB9KVxuXG4gICAgdGVzdCgnaXNBcHBsaWNhdGlvbigpIHdvcmtzIGV4cHJlc3Npbmcgd3JhcHBlZCB0cmFpdHMnLCAoKSA9PiB7XG4gICAgICBjb25zdCBUID0gKHMpID0+IGNsYXNzIGV4dGVuZHMgcyB7fVxuICAgICAgY29uc3QgV3JhcHBlZCA9IHdyYXAoVCwgKHN1cGVyY2xhc3MpID0+IGFwcGx5KHN1cGVyY2xhc3MsIFQpKVxuICAgICAgYXNzZXJ0LmlzVHJ1ZShpc1RyYWl0aWZpY2F0aW9uT2YoV3JhcHBlZChPYmplY3QpLnByb3RvdHlwZSwgV3JhcHBlZCkpXG4gICAgfSlcblxuICAgIHRlc3QoJ2lzQXBwbGljYXRpb24oKSByZXR1cm5zIGZhbHNlIHdoZW4gaXQgc2hvdWxkJywgKCkgPT4ge1xuICAgICAgY29uc3QgVCA9IChzKSA9PiBjbGFzcyBleHRlbmRzIHMge31cbiAgICAgIGNvbnN0IFUgPSAocykgPT4gY2xhc3MgZXh0ZW5kcyBzIHt9XG4gICAgICBhc3NlcnQuaXNGYWxzZShpc1RyYWl0aWZpY2F0aW9uT2YoYXBwbHkoT2JqZWN0LCBUKS5wcm90b3R5cGUsIFUpKVxuICAgIH0pXG4gIH0pXG5cbiAgc3VpdGUoJ2V4cHJlc3NlcygpJywgKCkgPT4ge1xuICAgIHRlc3QoJ2V4cHJlc3NlcygpIHJldHVybnMgdHJ1ZSBmb3IgYSB0cmFpdCBhcHBsaWVkIGJ5IGFwcGx5KCknLCAoKSA9PiB7XG4gICAgICBjb25zdCBUID0gKHMpID0+IGNsYXNzIGV4dGVuZHMgcyB7fVxuXG4gICAgICBhc3NlcnQuaXNUcnVlKGV4cHJlc3NlcyhhcHBseShPYmplY3QsIFQpLnByb3RvdHlwZSwgVCkpXG4gICAgfSlcbiAgfSlcblxuICBzdWl0ZSgnd3JhcCgpIGFuZCB1bndyYXAoKScsICgpID0+IHtcbiAgICB0ZXN0KCd3cmFwKCkgc2V0cyB0aGUgcHJvdG90eXBlJywgKCkgPT4ge1xuICAgICAgY29uc3QgZiA9ICh4KSA9PiB4ICogeFxuICAgICAgZi50ZXN0ID0gdHJ1ZVxuICAgICAgY29uc3Qgd3JhcHBlciA9ICh4KSA9PiBmKHgpXG4gICAgICB3cmFwKGYsIHdyYXBwZXIpXG4gICAgICBhc3NlcnQuaXNUcnVlKHdyYXBwZXIudGVzdClcbiAgICAgIGFzc2VydC5lcXVhbChmLCBPYmplY3QuZ2V0UHJvdG90eXBlT2Yod3JhcHBlcikpXG4gICAgfSlcblxuICAgIHRlc3QoJ3Vud3JhcCgpIHJldHVybnMgdGhlIHdyYXBwZWQgZnVuY3Rpb24nLCAoKSA9PiB7XG4gICAgICBjb25zdCBmID0gKHgpID0+IHggKiB4XG4gICAgICBjb25zdCB3cmFwcGVyID0gKHgpID0+IGYoeClcbiAgICAgIHdyYXAoZiwgd3JhcHBlcilcbiAgICAgIGFzc2VydC5lcXVhbChmLCB1bndyYXAod3JhcHBlcikpXG4gICAgfSlcbiAgfSlcblxuICBzdWl0ZSgnQmFyZVRyYWl0JywgKCkgPT4ge1xuICAgIHRlc3QoJ21peGluIGFwcGxpY2F0aW9uIGlzIG9uIHByb3RvdHlwZSBjaGFpbicsICgpID0+IHtcbiAgICAgIGNvbnN0IFQgPSBCYXJlVHJhaXQoKHMpID0+IGNsYXNzIGV4dGVuZHMgcyB7fSlcblxuICAgICAgY2xhc3MgQyBleHRlbmRzIFQoY2xhc3Mge30pIHt9XG5cbiAgICAgIGNvbnN0IGkgPSBuZXcgQygpXG4gICAgICBhc3NlcnQuaXNUcnVlKGV4cHJlc3NlcyhpLCBUKSlcbiAgICB9KVxuXG4gICAgdGVzdCgnbWV0aG9kcyBvbiB0cmFpdCBhcmUgcHJlc2VudCcsICgpID0+IHtcbiAgICAgIGNvbnN0IFQgPSBCYXJlVHJhaXQoKHMpID0+IGNsYXNzIGV4dGVuZHMgcyB7XG4gICAgICAgIGZvbyAoKSB7IHJldHVybiAnZm9vJyB9XG4gICAgICB9KVxuXG4gICAgICBjbGFzcyBDIGV4dGVuZHMgVChjbGFzcyB7fSkge31cblxuICAgICAgY29uc3QgaSA9IG5ldyBDKClcbiAgICAgIGFzc2VydC5kZWVwRXF1YWwoaS5mb28oKSwgJ2ZvbycpXG4gICAgfSlcblxuICAgIHRlc3QoJ2ZpZWxkcyBvbiB0cmFpdCBhcmUgcHJlc2VudCcsICgpID0+IHtcbiAgICAgIGNvbnN0IFQgPSBCYXJlVHJhaXQoKHMpID0+IGNsYXNzIGV4dGVuZHMgcyB7XG4gICAgICAgIGNvbnN0cnVjdG9yICgpIHtcbiAgICAgICAgICBzdXBlciguLi5hcmd1bWVudHMpXG4gICAgICAgICAgdGhpcy5maWVsZCA9IDEyXG4gICAgICAgIH1cblxuICAgICAgICBmb28gKCkgeyByZXR1cm4gdGhpcy5maWVsZCB9XG4gICAgICB9KVxuXG4gICAgICBjbGFzcyBDIGV4dGVuZHMgVChjbGFzcyB7fSkge31cblxuICAgICAgY29uc3QgaSA9IG5ldyBDKClcbiAgICAgIGFzc2VydC5kZWVwRXF1YWwoaS5maWVsZCwgMTIpXG4gICAgICBhc3NlcnQuZGVlcEVxdWFsKGkuZm9vKCksIDEyKVxuICAgIH0pXG5cbiAgICB0ZXN0KCdwcm9wZXJ0aWVzIG9uIHRyYWl0IGFyZSBwcmVzZW50JywgKCkgPT4ge1xuICAgICAgY29uc3QgVCA9IEJhcmVUcmFpdCgocykgPT4gY2xhc3MgZXh0ZW5kcyBzIHtcbiAgICAgICAgY29uc3RydWN0b3IgKCkge1xuICAgICAgICAgIHN1cGVyKC4uLmFyZ3VtZW50cylcbiAgICAgICAgICB0aGlzLmZpZWxkID0gMTJcbiAgICAgICAgfVxuXG4gICAgICAgIGdldCBmb28gKCkgeyByZXR1cm4gdGhpcy5maWVsZCB9XG4gICAgICB9KVxuXG4gICAgICBjbGFzcyBDIGV4dGVuZHMgVChjbGFzcyB7fSkge31cblxuICAgICAgY29uc3QgaSA9IG5ldyBDKClcbiAgICAgIGFzc2VydC5kZWVwRXF1YWwoaS5maWVsZCwgMTIpXG4gICAgICBhc3NlcnQuZGVlcEVxdWFsKGkuZm9vLCAxMilcbiAgICB9KVxuXG4gICAgdGVzdCgnZmllbGRzIG9uIHN1cGVyY2xhc3MgYXJlIHByZXNlbnQnLCAoKSA9PiB7XG4gICAgICBjb25zdCBUID0gQmFyZVRyYWl0KChzKSA9PiBjbGFzcyBleHRlbmRzIHMge1xuICAgICAgICBjb25zdHJ1Y3RvciAoKSB7XG4gICAgICAgICAgc3VwZXIoLi4uYXJndW1lbnRzKVxuICAgICAgICAgIHRoaXMuc3VwZXJjbGFzc0ZpZWxkID0gMTJcbiAgICAgICAgfVxuICAgICAgfSlcblxuICAgICAgY2xhc3MgU3VwZXIge1xuICAgICAgICBmb28gKCkgeyByZXR1cm4gdGhpcy5zdXBlcmNsYXNzRmllbGQgfVxuICAgICAgfVxuXG4gICAgICBjbGFzcyBDIGV4dGVuZHMgVChTdXBlcikge31cblxuICAgICAgY29uc3QgaSA9IG5ldyBDKClcbiAgICAgIGFzc2VydC5kZWVwRXF1YWwoaS5zdXBlcmNsYXNzRmllbGQsIDEyKVxuICAgICAgYXNzZXJ0LmRlZXBFcXVhbChpLmZvbygpLCAxMilcbiAgICB9KVxuXG4gICAgdGVzdCgnbWV0aG9kcyBvbiBzdWJjbGFzcyBhcmUgcHJlc2VudCcsICgpID0+IHtcbiAgICAgIGNvbnN0IFQgPSBCYXJlVHJhaXQoKHMpID0+IGNsYXNzIGV4dGVuZHMgcyB7fSlcblxuICAgICAgY2xhc3MgQyBleHRlbmRzIFQoY2xhc3Mge30pIHtcbiAgICAgICAgZm9vICgpIHsgcmV0dXJuICdmb28nIH1cbiAgICAgIH1cblxuICAgICAgY29uc3QgaSA9IG5ldyBDKClcbiAgICAgIGFzc2VydC5kZWVwRXF1YWwoaS5mb28oKSwgJ2ZvbycpXG4gICAgfSlcblxuICAgIHRlc3QoJ2ZpZWxkcyBvbiBzdWJjbGFzcyBhcmUgcHJlc2VudCcsICgpID0+IHtcbiAgICAgIGNvbnN0IFQgPSBCYXJlVHJhaXQoKHMpID0+IGNsYXNzIGV4dGVuZHMgcyB7fSlcblxuICAgICAgY2xhc3MgQyBleHRlbmRzIFQoY2xhc3Mge30pIHtcbiAgICAgICAgY29uc3RydWN0b3IgKCkge1xuICAgICAgICAgIHN1cGVyKC4uLmFyZ3VtZW50cylcbiAgICAgICAgICB0aGlzLmZpZWxkID0gMTJcbiAgICAgICAgfVxuXG4gICAgICAgIGZvbyAoKSB7IHJldHVybiAxMiB9XG4gICAgICB9XG5cbiAgICAgIGNvbnN0IGkgPSBuZXcgQygpXG4gICAgICBhc3NlcnQuZGVlcEVxdWFsKGkuZmllbGQsIDEyKVxuICAgICAgYXNzZXJ0LmRlZXBFcXVhbChpLmZvbygpLCAxMilcbiAgICB9KVxuXG4gICAgdGVzdCgnbWV0aG9kcyBvbiB0cmFpdCBvdmVycmlkZSBzdXBlcmNsYXNzJywgKCkgPT4ge1xuICAgICAgY29uc3QgVCA9IEJhcmVUcmFpdCgocykgPT4gY2xhc3MgZXh0ZW5kcyBzIHtcbiAgICAgICAgZm9vICgpIHsgcmV0dXJuICdiYXInIH1cbiAgICAgIH0pXG5cbiAgICAgIGNsYXNzIFN1cGVyIHtcbiAgICAgICAgZm9vICgpIHsgcmV0dXJuICdmb28nIH1cbiAgICAgIH1cblxuICAgICAgY2xhc3MgQyBleHRlbmRzIFQoU3VwZXIpIHt9XG5cbiAgICAgIGNvbnN0IGkgPSBuZXcgQygpXG4gICAgICBhc3NlcnQuZGVlcEVxdWFsKGkuZm9vKCksICdiYXInKVxuICAgIH0pXG5cbiAgICB0ZXN0KCdmaWVsZHMgb24gdHJhaXQgb3ZlcnJpZGUgc3VwZXJjbGFzcycsICgpID0+IHtcbiAgICAgIGNvbnN0IFQgPSBCYXJlVHJhaXQoKHMpID0+IGNsYXNzIGV4dGVuZHMgcyB7XG4gICAgICAgIGNvbnN0cnVjdG9yICgpIHtcbiAgICAgICAgICBzdXBlciguLi5hcmd1bWVudHMpXG4gICAgICAgICAgdGhpcy5maWVsZCA9IDEyXG4gICAgICAgIH1cblxuICAgICAgICBmb28gKCkgeyByZXR1cm4gdGhpcy5maWVsZCB9XG4gICAgICB9KVxuXG4gICAgICBjbGFzcyBTdXBlciB7XG4gICAgICAgIGNvbnN0cnVjdG9yICgpIHtcbiAgICAgICAgICB0aGlzLmZpZWxkID0gMTNcbiAgICAgICAgfVxuXG4gICAgICAgIGZvbyAoKSB7IHJldHVybiB0aGlzLmZpZWxkIH1cbiAgICAgIH1cblxuICAgICAgY2xhc3MgQyBleHRlbmRzIFQoU3VwZXIpIHt9XG5cbiAgICAgIGNvbnN0IGkgPSBuZXcgQygpXG4gICAgICBhc3NlcnQuZGVlcEVxdWFsKGkuZmllbGQsIDEyKVxuICAgICAgYXNzZXJ0LmRlZXBFcXVhbChpLmZvbygpLCAxMilcbiAgICB9KVxuXG4gICAgdGVzdCgnbWV0aG9kcyBvbiB0cmFpdCBjYW4gY2FsbCBzdXBlcicsICgpID0+IHtcbiAgICAgIGNvbnN0IFQgPSBCYXJlVHJhaXQoKHMpID0+IGNsYXNzIGV4dGVuZHMgcyB7XG4gICAgICAgIGZvbyAoKSB7IHJldHVybiBzdXBlci5mb28oKSB9XG4gICAgICB9KVxuXG4gICAgICBjbGFzcyBTdXBlciB7XG4gICAgICAgIGZvbyAoKSB7IHJldHVybiAnc3VwZXJmb28nIH1cbiAgICAgIH1cblxuICAgICAgY2xhc3MgQyBleHRlbmRzIFQoU3VwZXIpIHt9XG5cbiAgICAgIGNvbnN0IGkgPSBuZXcgQygpXG4gICAgICBhc3NlcnQuZGVlcEVxdWFsKGkuZm9vKCksICdzdXBlcmZvbycpXG4gICAgfSlcblxuICAgIHRlc3QoJ21ldGhvZHMgb24gc3ViY2xhc3Mgb3ZlcnJpZGUgc3VwZXJjbGFzcycsICgpID0+IHtcbiAgICAgIGNvbnN0IFQgPSBCYXJlVHJhaXQoKHMpID0+IGNsYXNzIGV4dGVuZHMgcyB7fSlcblxuICAgICAgY2xhc3MgU3VwZXIge1xuICAgICAgICBmb28gKCkgeyByZXR1cm4gJ3N1cGVyZm9vJyB9XG4gICAgICB9XG5cbiAgICAgIGNsYXNzIEMgZXh0ZW5kcyBUKFN1cGVyKSB7XG4gICAgICAgIGZvbyAoKSB7IHJldHVybiAnc3ViZm9vJyB9XG4gICAgICB9XG5cbiAgICAgIGNvbnN0IGkgPSBuZXcgQygpXG4gICAgICBhc3NlcnQuZGVlcEVxdWFsKGkuZm9vKCksICdzdWJmb28nKVxuICAgIH0pXG5cbiAgICB0ZXN0KCdmaWVsZHMgb24gc3ViY2xhc3Mgb3ZlcnJpZGUgc3VwZXJjbGFzcycsICgpID0+IHtcbiAgICAgIGNvbnN0IFQgPSBCYXJlVHJhaXQoKHMpID0+IGNsYXNzIGV4dGVuZHMgcyB7fSlcblxuICAgICAgY2xhc3MgU3VwZXIge1xuICAgICAgICBjb25zdHJ1Y3RvciAoKSB7XG4gICAgICAgICAgdGhpcy5maWVsZCA9IDEyXG4gICAgICAgIH1cblxuICAgICAgICBmb28gKCkgeyByZXR1cm4gMTIgfVxuICAgICAgfVxuXG4gICAgICBjbGFzcyBDIGV4dGVuZHMgVChTdXBlcikge1xuICAgICAgICBjb25zdHJ1Y3RvciAoKSB7XG4gICAgICAgICAgc3VwZXIoLi4uYXJndW1lbnRzKVxuICAgICAgICAgIHRoaXMuZmllbGQgPSAxM1xuICAgICAgICB9XG5cbiAgICAgICAgZm9vICgpIHsgcmV0dXJuIHRoaXMuZmllbGQgfVxuICAgICAgfVxuXG4gICAgICBjb25zdCBpID0gbmV3IEMoKVxuICAgICAgYXNzZXJ0LmRlZXBFcXVhbChpLmZpZWxkLCAxMylcbiAgICAgIGFzc2VydC5kZWVwRXF1YWwoaS5mb28oKSwgMTMpXG4gICAgfSlcblxuICAgIHRlc3QoJ21ldGhvZHMgb24gc3ViY2xhc3Mgb3ZlcnJpZGUgbWl4aW4nLCAoKSA9PiB7XG4gICAgICBjb25zdCBUID0gQmFyZVRyYWl0KChzKSA9PiBjbGFzcyBleHRlbmRzIHMge1xuICAgICAgICBmb28gKCkgeyByZXR1cm4gJ21peGluZm9vJyB9XG4gICAgICB9KVxuXG4gICAgICBjbGFzcyBTdXBlciB7fVxuXG4gICAgICBjbGFzcyBDIGV4dGVuZHMgVChTdXBlcikge1xuICAgICAgICBmb28gKCkgeyByZXR1cm4gJ3N1YmZvbycgfVxuICAgICAgfVxuXG4gICAgICBjb25zdCBpID0gbmV3IEMoKVxuICAgICAgYXNzZXJ0LmRlZXBFcXVhbChpLmZvbygpLCAnc3ViZm9vJylcbiAgICB9KVxuXG4gICAgdGVzdCgnZmllbGRzIG9uIHN1YmNsYXNzIG92ZXJyaWRlIHRyYWl0JywgKCkgPT4ge1xuICAgICAgY29uc3QgVCA9IEJhcmVUcmFpdCgocykgPT4gY2xhc3MgZXh0ZW5kcyBzIHtcbiAgICAgICAgY29uc3RydWN0b3IgKCkge1xuICAgICAgICAgIHN1cGVyKC4uLmFyZ3VtZW50cylcbiAgICAgICAgICB0aGlzLmZpZWxkID0gMTJcbiAgICAgICAgfVxuXG4gICAgICAgIGZvbyAoKSB7IHJldHVybiB0aGlzLmZpZWxkIH1cbiAgICAgIH0pXG5cbiAgICAgIGNsYXNzIFN1cGVyIHt9XG5cbiAgICAgIGNsYXNzIEMgZXh0ZW5kcyBUKFN1cGVyKSB7XG4gICAgICAgIGNvbnN0cnVjdG9yICgpIHtcbiAgICAgICAgICBzdXBlciguLi5hcmd1bWVudHMpXG4gICAgICAgICAgdGhpcy5maWVsZCA9IDEzXG4gICAgICAgIH1cblxuICAgICAgICBmb28gKCkgeyByZXR1cm4gdGhpcy5maWVsZCB9XG4gICAgICB9XG5cbiAgICAgIGNvbnN0IGkgPSBuZXcgQygpXG4gICAgICBhc3NlcnQuZGVlcEVxdWFsKGkuZmllbGQsIDEzKVxuICAgICAgYXNzZXJ0LmRlZXBFcXVhbChpLmZvbygpLCAxMylcbiAgICB9KVxuXG4gICAgdGVzdCgnbWV0aG9kcyBvbiBzdWJjbGFzcyBjYW4gY2FsbCBzdXBlciB0byBzdXBlcmNsYXNzJywgKCkgPT4ge1xuICAgICAgY29uc3QgTSA9IEJhcmVUcmFpdCgocykgPT4gY2xhc3MgZXh0ZW5kcyBzIHt9KVxuXG4gICAgICBjbGFzcyBTIHtcbiAgICAgICAgZm9vICgpIHsgcmV0dXJuICdzdXBlcmZvbycgfVxuICAgICAgfVxuXG4gICAgICBjbGFzcyBDIGV4dGVuZHMgTShTKSB7XG4gICAgICAgIGZvbyAoKSB7IHJldHVybiBzdXBlci5mb28oKSB9XG4gICAgICB9XG5cbiAgICAgIGNvbnN0IGkgPSBuZXcgQygpXG4gICAgICBhc3NlcnQuZGVlcEVxdWFsKGkuZm9vKCksICdzdXBlcmZvbycpXG4gICAgfSlcbiAgfSlcblxuICBzdWl0ZSgnRGVkdXBlJywgKCkgPT4ge1xuICAgIHRlc3QoJ2FwcGxpZXMgdGhlIHRyYWl0IHRoZSBmaXJzdCB0aW1lJywgKCkgPT4ge1xuICAgICAgY29uc3QgVCA9IERlZHVwZShCYXJlVHJhaXQoKHMpID0+IGNsYXNzIGV4dGVuZHMgcyB7fSkpXG5cbiAgICAgIGNsYXNzIEMgZXh0ZW5kcyBUKGNsYXNzIHt9KSB7fVxuXG4gICAgICBjb25zdCBpID0gbmV3IEMoKVxuICAgICAgYXNzZXJ0LmlzVHJ1ZShleHByZXNzZXMoaSwgVCkpXG4gICAgfSlcblxuICAgIHRlc3QoJ2RvZXNuXFwndCBhcHBseSB0aGUgdHJhaXQgdGhlIHNlY29uZCB0aW1lJywgKCkgPT4ge1xuICAgICAgbGV0IGFwcGxpY2F0aW9uQ291bnQgPSAwXG4gICAgICBjb25zdCBUID0gRGVkdXBlKEJhcmVUcmFpdCgocykgPT4ge1xuICAgICAgICBhcHBsaWNhdGlvbkNvdW50KytcbiAgICAgICAgcmV0dXJuIGNsYXNzIGV4dGVuZHMgcyB7fVxuICAgICAgfSkpXG5cbiAgICAgIGNsYXNzIEMgZXh0ZW5kcyBUKFQoT2JqZWN0KSkge31cblxuICAgICAgY29uc3QgaSA9IG5ldyBDKClcbiAgICAgIGFzc2VydC5pc1RydWUoZXhwcmVzc2VzKGksIFQpKVxuICAgICAgYXNzZXJ0LmVxdWFsKDEsIGFwcGxpY2F0aW9uQ291bnQpXG4gICAgfSlcbiAgfSlcblxuICBzdWl0ZSgnSGFzSW5zdGFuY2UnLCAoKSA9PiB7XG4gICAgbGV0IGhhc05hdGl2ZUhhc0luc3RhbmNlID0gZmFsc2VcblxuICAgIHN1aXRlU2V0dXAoKCkgPT4ge1xuICAgICAgLy8gRW5hYmxlIHRoZSBAQGhhc0luc3RhbmNlIHBhdGNoIGluIG1peHdpdGguSGFzSW5zdGFuY2VcbiAgICAgIGlmICghU3ltYm9sLmhhc0luc3RhbmNlKSB7XG4gICAgICAgIFN5bWJvbC5oYXNJbnN0YW5jZSA9IFN5bWJvbCgnaGFzSW5zdGFuY2UnKVxuICAgICAgfVxuXG4gICAgICBjbGFzcyBDaGVjayB7XG4gICAgICAgIHN0YXRpYyBbU3ltYm9sLmhhc0luc3RhbmNlXSAobykgeyByZXR1cm4gdHJ1ZSB9XG4gICAgICB9XG5cbiAgICAgIGhhc05hdGl2ZUhhc0luc3RhbmNlID0gMSBpbnN0YW5jZW9mIENoZWNrXG4gICAgfSlcblxuICAgIHRlc3QoJ3N1YmNsYXNzZXMgaW1wbGVtZW50IHRyYWl0cycsICgpID0+IHtcbiAgICAgIGNvbnN0IFQgPSBIYXNJbnN0YW5jZSgocykgPT4gY2xhc3MgZXh0ZW5kcyBzIHt9KVxuXG4gICAgICBjbGFzcyBDIGV4dGVuZHMgVChjbGFzcyB7fSkge31cblxuICAgICAgY29uc3QgaSA9IG5ldyBDKClcblxuICAgICAgaWYgKGhhc05hdGl2ZUhhc0luc3RhbmNlKSB7XG4gICAgICAgIGFzc2VydC5pbnN0YW5jZU9mKGksIEMpXG4gICAgICB9IGVsc2Uge1xuICAgICAgICBhc3NlcnQuaXNUcnVlKENbU3ltYm9sLmhhc0luc3RhbmNlXShpKSlcbiAgICAgIH1cbiAgICB9KVxuICB9KVxuXG4gIGNvbnN0IG50aFByb3RvdHlwZU9mID0gKGl0LCBuKSA9PiB7XG4gICAgaWYgKG4gPCAxKSB0aHJvdyBuZXcgRXJyb3IoJ24gbXVzdCBiZSA+PSAxJylcbiAgICBjb25zdCBwcm90byA9IE9iamVjdC5nZXRQcm90b3R5cGVPZihpdClcbiAgICByZXR1cm4gbiA9PT0gMSA/IHByb3RvIDogbnRoUHJvdG90eXBlT2YocHJvdG8sIG4gLSAxKVxuICB9XG5cbiAgc3VpdGUoJ3N1cGVyY2xhc3MoKS5leHByZXNzaW5nKCknLCAoKSA9PiB7XG4gICAgdGVzdCgnYXBwbGllcyB0cmFpdCBpbiBvcmRlciBleHByZXNzaW5nIHN1cGVyY2xhc3MnLCAoKSA9PiB7XG4gICAgICBjb25zdCBUMSA9IEJhcmVUcmFpdCgocykgPT4gY2xhc3MgZXh0ZW5kcyBzIHt9KVxuICAgICAgY29uc3QgVDIgPSBCYXJlVHJhaXQoKHQpID0+IGNsYXNzIGV4dGVuZHMgdCB7fSlcblxuICAgICAgY2xhc3MgU3VwZXIge31cblxuICAgICAgY2xhc3MgQyBleHRlbmRzIHN1cGVyY2xhc3MoU3VwZXIpLmV4cHJlc3NpbmcoVDEsIFQyKSB7fVxuXG4gICAgICBjb25zdCBpID0gbmV3IEMoKVxuICAgICAgYXNzZXJ0LmlzVHJ1ZShleHByZXNzZXMoaSwgVDEpKVxuICAgICAgYXNzZXJ0LmlzVHJ1ZShleHByZXNzZXMoaSwgVDIpKVxuICAgICAgYXNzZXJ0LmlzVHJ1ZShpc1RyYWl0aWZpY2F0aW9uT2YobnRoUHJvdG90eXBlT2YoaSwgMiksIFQyKSlcbiAgICAgIGFzc2VydC5pc1RydWUoaXNUcmFpdGlmaWNhdGlvbk9mKG50aFByb3RvdHlwZU9mKGksIDMpLCBUMSkpXG4gICAgICBhc3NlcnQuZXF1YWwobnRoUHJvdG90eXBlT2YoaSwgNCksIFN1cGVyLnByb3RvdHlwZSlcbiAgICB9KVxuXG4gICAgdGVzdCgnYXBwbGllcyB0cmFpdHMgaW4gb3JkZXIgZXhwcmVzc2luZyBubyBzdXBlcmNsYXNzJywgKCkgPT4ge1xuICAgICAgY29uc3QgVDEgPSBCYXJlVHJhaXQoKHMpID0+IGNsYXNzIGV4dGVuZHMgcyB7fSlcbiAgICAgIGNvbnN0IFQyID0gQmFyZVRyYWl0KChzKSA9PiBjbGFzcyBleHRlbmRzIHMge30pXG5cbiAgICAgIGNsYXNzIEMgZXh0ZW5kcyB0cmFpdHMoVDEsIFQyKSB7fVxuXG4gICAgICBjb25zdCBpID0gbmV3IEMoKVxuICAgICAgYXNzZXJ0LmlzVHJ1ZShleHByZXNzZXMoaSwgVDEpKVxuICAgICAgYXNzZXJ0LmlzVHJ1ZShleHByZXNzZXMoaSwgVDIpKVxuICAgICAgYXNzZXJ0LmlzVHJ1ZShpc1RyYWl0aWZpY2F0aW9uT2YobnRoUHJvdG90eXBlT2YoaSwgMiksIFQyKSlcbiAgICAgIGFzc2VydC5pc1RydWUoaXNUcmFpdGlmaWNhdGlvbk9mKG50aFByb3RvdHlwZU9mKGksIDMpLCBUMSkpXG4gICAgICBhc3NlcnQuaXNOb3ROdWxsKG50aFByb3RvdHlwZU9mKGksIDQpKVxuICAgICAgYXNzZXJ0LmVxdWFsKG50aFByb3RvdHlwZU9mKGksIDUpLCBPYmplY3QucHJvdG90eXBlKVxuICAgICAgYXNzZXJ0LmlzVHJ1ZShudGhQcm90b3R5cGVPZihpLCA2KSA9PT0gbnVsbClcbiAgICB9KVxuXG4gICAgdGVzdCgnc3VwZXJjbGFzcygpIGNhbiBvbWl0IHRoZSBzdXBlcmNsYXNzJywgKCkgPT4ge1xuICAgICAgY29uc3QgVCA9IEJhcmVUcmFpdCgocykgPT4gY2xhc3MgZXh0ZW5kcyBzIHtcbiAgICAgICAgc3RhdGljIHN0YXRpY01peGluTWV0aG9kICgpIHtcbiAgICAgICAgICByZXR1cm4gNDJcbiAgICAgICAgfVxuXG4gICAgICAgIGZvbyAoKSB7XG4gICAgICAgICAgcmV0dXJuICdmb28nXG4gICAgICAgIH1cblxuICAgICAgICBzbmFmdSAoKSB7XG4gICAgICAgICAgcmV0dXJuICdNLnNuYWZ1J1xuICAgICAgICB9XG4gICAgICB9KVxuXG4gICAgICBjbGFzcyBDIGV4dGVuZHMgdHJhaXRzKFQpIHtcbiAgICAgICAgc3RhdGljIHN0YXRpY0NsYXNzTWV0aG9kICgpIHtcbiAgICAgICAgICByZXR1cm4gN1xuICAgICAgICB9XG5cbiAgICAgICAgYmFyICgpIHtcbiAgICAgICAgICByZXR1cm4gJ2JhcidcbiAgICAgICAgfVxuXG4gICAgICAgIHNuYWZ1ICgpIHtcbiAgICAgICAgICByZXR1cm4gJ0Muc25hZnUnXG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgY29uc3QgaSA9IG5ldyBDKClcbiAgICAgIGFzc2VydC5pc1RydWUoZXhwcmVzc2VzKGksIFQpLCAnZXhwcmVzc2VzJylcbiAgICAgIGFzc2VydC5pc1RydWUoaXNUcmFpdGlmaWNhdGlvbk9mKG50aFByb3RvdHlwZU9mKGksIDIpLCBUKSwgJ2lzVHJhaXRpZmljYXRpb25PZicpXG4gICAgICBhc3NlcnQuZXF1YWwoJ2ZvbycsIGkuZm9vKCkpXG4gICAgICBhc3NlcnQuZXF1YWwoJ2JhcicsIGkuYmFyKCkpXG4gICAgICBhc3NlcnQuZXF1YWwoJ0Muc25hZnUnLCBpLnNuYWZ1KCkpXG4gICAgICBhc3NlcnQuZXF1YWwoNDIsIEMuc3RhdGljTWl4aW5NZXRob2QoKSlcbiAgICAgIGFzc2VydC5lcXVhbCg3LCBDLnN0YXRpY0NsYXNzTWV0aG9kKCkpXG4gICAgfSlcblxuICAgIHRlc3QoJ2NsYXNzIGluc3RhbmNlb2YgdHJhaXQnLCAoKSA9PiB7XG4gICAgICBjb25zdCBUID0gVHJhaXQoYyA9PiBjbGFzcyBleHRlbmRzIGMge30pXG4gICAgICBjb25zdCBVID0gVHJhaXQoZCA9PiBjbGFzcyBleHRlbmRzIGQge30pXG5cbiAgICAgIGNsYXNzIEMgZXh0ZW5kcyB0cmFpdHMoVCwgVSkge31cblxuICAgICAgY29uc3QgYyA9IG5ldyBDKClcbiAgICAgIGFzc2VydC5pc1RydWUoYyBpbnN0YW5jZW9mIEMpXG4gICAgICBhc3NlcnQuaXNUcnVlKGV4cHJlc3NlcyhjLCBUKSlcbiAgICAgIGFzc2VydC5pc1RydWUoZXhwcmVzc2VzKGMsIFUpKVxuICAgICAgYXNzZXJ0LmlzVHJ1ZShjIGluc3RhbmNlb2YgVClcbiAgICAgIGFzc2VydC5pc1RydWUoYyBpbnN0YW5jZW9mIFUpXG4gICAgfSlcbiAgfSlcblxuICBzdWl0ZSgnc3VwZXJ0cmFpdHMnLCAoKSA9PiB7XG4gICAgdGVzdCgnc2luZ2xlIHN1cGVydHJhaXQnLCAoKSA9PiB7XG4gICAgICBjb25zdCBTdXBlcnRyYWl0ID0gVHJhaXQocyA9PiBjbGFzcyBleHRlbmRzIHMge1xuICAgICAgICBmb28gKCkgeyByZXR1cm4gJ2ZvbycgfVxuICAgICAgfSlcblxuICAgICAgY29uc3QgU3VidHJhaXQgPSBUcmFpdChzID0+IGNsYXNzIGV4dGVuZHMgc3VwZXJjbGFzcyhzKS5leHByZXNzaW5nKFN1cGVydHJhaXQpIHtcbiAgICAgICAgYmFyICgpIHsgcmV0dXJuICdiYXInIH1cbiAgICAgIH0pXG5cbiAgICAgIGNsYXNzIEMgZXh0ZW5kcyB0cmFpdChTdWJ0cmFpdCkge1xuICAgICAgICBzbmFmdSAoKSB7IHJldHVybiAnc25hZnUnIH1cbiAgICAgIH1cbiAgICAgIGNvbnN0IGMgPSBuZXcgQygpXG4gICAgICBhc3NlcnQuZXF1YWwoYy5mb28oKSwgJ2ZvbycpXG4gICAgICBhc3NlcnQuZXF1YWwoYy5iYXIoKSwgJ2JhcicpXG4gICAgICBhc3NlcnQuZXF1YWwoYy5zbmFmdSgpLCAnc25hZnUnKVxuICAgIH0pXG5cbiAgICB0ZXN0KCdtdWx0aXBsZSBzdXBlcnRyYWl0cycsICgpID0+IHtcbiAgICAgIGNvbnN0IFN1cGVydHJhaXQxID0gVHJhaXQocyA9PiBjbGFzcyBleHRlbmRzIHMge1xuICAgICAgICBmb28xICgpIHsgcmV0dXJuICdmb28xJyB9XG4gICAgICB9KVxuXG4gICAgICBjb25zdCBTdXBlcnRyYWl0MiA9IFRyYWl0KHMgPT4gY2xhc3MgZXh0ZW5kcyBzIHtcbiAgICAgICAgZm9vMiAoKSB7IHJldHVybiAnZm9vMicgfVxuICAgICAgfSlcblxuICAgICAgY29uc3QgU3VidHJhaXQgPSBUcmFpdChzID0+IGNsYXNzIGV4dGVuZHMgc3VwZXJjbGFzcyhzKS5leHByZXNzaW5nKFN1cGVydHJhaXQxLCBTdXBlcnRyYWl0Mikge1xuICAgICAgICBiYXIgKCkgeyByZXR1cm4gJ2JhcicgfVxuICAgICAgfSlcblxuICAgICAgY2xhc3MgQyBleHRlbmRzIHRyYWl0KFN1YnRyYWl0KSB7XG4gICAgICAgIHNuYWZ1ICgpIHsgcmV0dXJuICdzbmFmdScgfVxuICAgICAgfVxuICAgICAgY29uc3QgYyA9IG5ldyBDKClcbiAgICAgIGFzc2VydC5lcXVhbChjLmZvbzEoKSwgJ2ZvbzEnKVxuICAgICAgYXNzZXJ0LmVxdWFsKGMuZm9vMigpLCAnZm9vMicpXG4gICAgICBhc3NlcnQuZXF1YWwoYy5iYXIoKSwgJ2JhcicpXG4gICAgICBhc3NlcnQuZXF1YWwoYy5zbmFmdSgpLCAnc25hZnUnKVxuICAgIH0pXG5cbiAgICB0ZXN0KCdzaW5nbGUgc3VwZXJ0cmFpdCB3aXRoIGNvcnJlY3Qgb3ZlcnJpZGVzJywgKCkgPT4ge1xuICAgICAgY29uc3QgU3VwZXJ0cmFpdCA9IFRyYWl0KHMgPT4gY2xhc3MgZXh0ZW5kcyBzIHtcbiAgICAgICAgZm9vICgpIHsgcmV0dXJuICdmb28gZnJvbSBTdXBlcnRyYWl0JyB9XG4gICAgICAgIGJhciAoKSB7IHJldHVybiAnYmFyIGZyb20gU3VwZXJ0cmFpdCcgfVxuICAgICAgICBzbmFmdSAoKSB7IHJldHVybiAnc25hZnUgZnJvbSBTdXBlcnRyYWl0JyB9XG4gICAgICB9KVxuXG4gICAgICBjb25zdCBTdWJ0cmFpdCA9IFRyYWl0KHMgPT4ge1xuICAgICAgICByZXR1cm4gY2xhc3MgZXh0ZW5kcyBzdXBlcmNsYXNzKHMpLmV4cHJlc3NpbmcoU3VwZXJ0cmFpdCkge1xuICAgICAgICAgIGJhciAoKSB7IHJldHVybiAnYmFyIGZyb20gU3VidHJhaXQnIH1cbiAgICAgICAgICBzbmFmdSAoKSB7IHJldHVybiAnc25hZnUgZnJvbSBTdWJ0cmFpdCcgfVxuICAgICAgICB9XG4gICAgICB9KVxuXG4gICAgICBjbGFzcyBDIGV4dGVuZHMgdHJhaXQoU3VidHJhaXQpIHtcbiAgICAgICAgc25hZnUgKCkgeyByZXR1cm4gJ3NuYWZ1IGZyb20gQycgfVxuICAgICAgfVxuXG4gICAgICBjb25zdCBjID0gbmV3IEMoKVxuICAgICAgYXNzZXJ0LmVxdWFsKGMuZm9vKCksICdmb28gZnJvbSBTdXBlcnRyYWl0JylcbiAgICAgIGFzc2VydC5lcXVhbChjLmJhcigpLCAnYmFyIGZyb20gU3VidHJhaXQnKVxuICAgICAgYXNzZXJ0LmVxdWFsKGMuc25hZnUoKSwgJ3NuYWZ1IGZyb20gQycpXG4gICAgfSlcblxuICAgIHRlc3QoJ211bHRpcGxlIHN1cGVydHJhaXRzIHdpdGggY29ycmVjdCBvdmVycmlkZXMnLCAoKSA9PiB7XG4gICAgICBjb25zdCBTdXBlcnRyYWl0MSA9IFRyYWl0KHMgPT4gY2xhc3MgZXh0ZW5kcyBzIHtcbiAgICAgICAgYmxlZXAgKCkgeyByZXR1cm4gJ2JsZWVwIGZyb20gU3VwZXJ0cmFpdDEnIH1cbiAgICAgICAgZm9vICgpIHsgcmV0dXJuICdmb28gZnJvbSBTdXBlcnRyYWl0MScgfVxuICAgICAgICBiYXIgKCkgeyByZXR1cm4gJ2JhciBmcm9tIFN1cGVydHJhaXQxJyB9XG4gICAgICAgIHNuYWZ1ICgpIHsgcmV0dXJuICdzbmFmdSBmcm9tIFN1cGVydHJhaXQxJyB9XG4gICAgICB9KVxuXG4gICAgICBjb25zdCBTdXBlcnRyYWl0MiA9IFRyYWl0KHMgPT4gY2xhc3MgZXh0ZW5kcyBzIHtcbiAgICAgICAgZm9vICgpIHsgcmV0dXJuICdmb28gZnJvbSBTdXBlcnRyYWl0MicgfVxuICAgICAgICBiYXIgKCkgeyByZXR1cm4gJ2JhciBmcm9tIFN1cGVydHJhaXQyJyB9XG4gICAgICAgIHNuYWZ1ICgpIHsgcmV0dXJuICdzbmFmdSBmcm9tIFN1cGVydHJhaXQyJyB9XG4gICAgICB9KVxuXG4gICAgICBjb25zdCBTdWJ0cmFpdCA9IFRyYWl0KHMgPT5cbiAgICAgICAgY2xhc3MgZXh0ZW5kcyBzdXBlcmNsYXNzKHMpLmV4cHJlc3NpbmcoU3VwZXJ0cmFpdDEsIFN1cGVydHJhaXQyKSB7XG4gICAgICAgICAgYmFyICgpIHsgcmV0dXJuICdiYXIgZnJvbSBTdWJ0cmFpdCcgfVxuICAgICAgICAgIHNuYWZ1ICgpIHsgcmV0dXJuICdzbmFmdSBmcm9tIFN1YnRyYWl0JyB9XG4gICAgICAgIH0pXG5cbiAgICAgIGNsYXNzIEMgZXh0ZW5kcyB0cmFpdChTdWJ0cmFpdCkge1xuICAgICAgICBzbmFmdSAoKSB7IHJldHVybiAnc25hZnUgZnJvbSBDJyB9XG4gICAgICB9XG5cbiAgICAgIGNvbnN0IGMgPSBuZXcgQygpXG4gICAgICBhc3NlcnQuZXF1YWwoYy5ibGVlcCgpLCAnYmxlZXAgZnJvbSBTdXBlcnRyYWl0MScpXG4gICAgICBhc3NlcnQuZXF1YWwoYy5mb28oKSwgJ2ZvbyBmcm9tIFN1cGVydHJhaXQyJylcbiAgICAgIGFzc2VydC5lcXVhbChjLmJhcigpLCAnYmFyIGZyb20gU3VidHJhaXQnKVxuICAgICAgYXNzZXJ0LmVxdWFsKGMuc25hZnUoKSwgJ3NuYWZ1IGZyb20gQycpXG4gICAgICBhc3NlcnQuaXNUcnVlKGMgaW5zdGFuY2VvZiBDKVxuICAgICAgYXNzZXJ0LmlzVHJ1ZShjIGluc3RhbmNlb2YgU3VidHJhaXQpXG4gICAgICBhc3NlcnQuaXNUcnVlKGMgaW5zdGFuY2VvZiBTdXBlcnRyYWl0MilcbiAgICAgIGFzc2VydC5pc1RydWUoYyBpbnN0YW5jZW9mIFN1cGVydHJhaXQxKVxuICAgIH0pXG4gIH0pXG5cbiAgc3VpdGUoJ3JlYWwtd29ybGQtaXNoIHRyYWl0cycsICgpID0+IHtcbiAgICB0ZXN0KCd2YWxpZGF0aW9uIHdvcmtzJywgKCkgPT4ge1xuICAgICAgY29uc3QgTmFtZWFibGUgPSBUcmFpdChzdXBlcmNsYXNzID0+IGNsYXNzIGV4dGVuZHMgc3VwZXJjbGFzcyB7XG4gICAgICAgIGNvbnN0cnVjdG9yICgpIHtcbiAgICAgICAgICBzdXBlciguLi5hcmd1bWVudHMpXG4gICAgICAgICAgdGhpcy5fZmlyc3ROYW1lID0gJydcbiAgICAgICAgICB0aGlzLl9sYXN0TmFtZSA9ICcnXG4gICAgICAgIH1cblxuICAgICAgICBnZXQgZnVsbE5hbWUgKCkge1xuICAgICAgICAgIHJldHVybiBgJHt0aGlzLl9maXJzdE5hbWV9ICR7dGhpcy5fbGFzdE5hbWV9YFxuICAgICAgICB9XG5cbiAgICAgICAgc2V0IGZpcnN0TmFtZSAoaXQpIHtcbiAgICAgICAgICB0aGlzLl9maXJzdE5hbWUgPSB0aGlzLmNoZWNrRmlyc3ROYW1lKGl0KVxuICAgICAgICB9XG5cbiAgICAgICAgZ2V0IGZpcnN0TmFtZSAoKSB7XG4gICAgICAgICAgcmV0dXJuIHRoaXMuX2ZpcnN0TmFtZVxuICAgICAgICB9XG5cbiAgICAgICAgY2hlY2tGaXJzdE5hbWUgKGl0KSB7XG4gICAgICAgICAgcmV0dXJuIGl0XG4gICAgICAgIH1cblxuICAgICAgICBzZXQgbGFzdE5hbWUgKGl0KSB7XG4gICAgICAgICAgdGhpcy5fbGFzdE5hbWUgPSB0aGlzLmNoZWNrTGFzdE5hbWUoaXQpXG4gICAgICAgIH1cblxuICAgICAgICBnZXQgbGFzdE5hbWUgKCkge1xuICAgICAgICAgIHJldHVybiB0aGlzLl9sYXN0TmFtZVxuICAgICAgICB9XG5cbiAgICAgICAgY2hlY2tMYXN0TmFtZSAoaXQpIHtcbiAgICAgICAgICByZXR1cm4gaXRcbiAgICAgICAgfVxuICAgICAgfSlcblxuICAgICAgY2xhc3MgUGVyc29uIGV4dGVuZHMgdHJhaXQoTmFtZWFibGUpIHtcbiAgICAgICAgY2hlY2tGaXJzdE5hbWUgKGl0KSB7XG4gICAgICAgICAgaWYgKCFpdCkgdGhyb3cgbmV3IEVycm9yKCdub3RoaW5nIGdpdmVuJylcbiAgICAgICAgICByZXR1cm4gaXRcbiAgICAgICAgfVxuXG4gICAgICAgIGNoZWNrTGFzdE5hbWUgKGl0KSB7XG4gICAgICAgICAgaWYgKCFpdCkgdGhyb3cgbmV3IEVycm9yKCdub3RoaW5nIGdpdmVuJylcbiAgICAgICAgICByZXR1cm4gaXRcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICBjb25zdCBmaXJzdCA9ICdDaGVla3knXG4gICAgICBjb25zdCBsYXN0ID0gJ01vbmtleSdcbiAgICAgIGNvbnN0IG1lID0gbmV3IFBlcnNvbigpXG4gICAgICBtZS5maXJzdE5hbWUgPSBmaXJzdFxuICAgICAgbWUubGFzdE5hbWUgPSBsYXN0XG4gICAgICBhc3NlcnQuZXF1YWwoZmlyc3QsIG1lLl9maXJzdE5hbWUpXG4gICAgICBhc3NlcnQuZXF1YWwobGFzdCwgbWUuX2xhc3ROYW1lKVxuICAgICAgYXNzZXJ0LmVxdWFsKGZpcnN0LCBtZS5maXJzdE5hbWUpXG4gICAgICBhc3NlcnQuZXF1YWwobGFzdCwgbWUubGFzdE5hbWUpXG4gICAgICBhc3NlcnQuZXF1YWwoYCR7Zmlyc3R9ICR7bGFzdH1gLCBtZS5mdWxsTmFtZSlcblxuICAgICAgYXNzZXJ0LnRocm93cygoKSA9PiB7XG4gICAgICAgIG1lLmZpcnN0TmFtZSA9IG51bGxcbiAgICAgIH0pXG4gICAgICBhc3NlcnQudGhyb3dzKCgpID0+IHtcbiAgICAgICAgbWUubGFzdE5hbWUgPSBudWxsXG4gICAgICB9KVxuICAgIH0pXG4gIH0pXG59KVxuIl19