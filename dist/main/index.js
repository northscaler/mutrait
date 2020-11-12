"use strict";

const _appliedTrait = Symbol('_appliedTrait');
/**
 * A function that returns an empty or non-empty subclass of its argument.
 *
 * @example
 * const T = (superclass) => class extends superclass {
 *   getMessage() {
 *     return "Hello";
 *   }
 * }
 *
 * @typedef {Function} TraitFunction
 * @param {Function} superclass If falsey, the superclass is literally `class {}`
 * @return {Function} A subclass of `superclass`
 */

/**
 * Applies `trait` to `superclass`.
 *
 * `apply` stores a reference from the trait application to the unwrapped trait
 * to make `isTraitificationOf` and `expresses` work.
 *
 * This function is useful for trait wrappers that want to automatically enable
 * {@link expresses} support.
 *
 * @example
 * const Applier = trait => wrap(trait, superclass => apply(superclass, trait));
 *
 * // T now works expressing `expresses` and `isTraitificationOf`
 * const T = Applier(superclass => class extends superclass {});
 *
 * class C extends T(class {}) {}
 * let i = new C();
 * expresses(i, T); // true
 *
 * @function
 * @param {Function} superclass A class or constructor function or a falsey value
 * @param {TraitFunction} trait The trait to apply
 * @return {Function} A subclass of `superclass` produced by `trait`
 */


const apply = (superclass, trait) => {
  const application = trait(superclass);
  application.prototype[_appliedTrait] = unwrap(trait);
  return application;
};
/**
 * Returns `true` iff `proto` is a prototype created by the application of
 * `trait` to a superclass.
 *
 * `isTraitificationOf` works by checking that `proto` has a reference to `trait`
 * as created by `apply`.
 *
 * @function
 * @param {Object} proto A prototype object created by {@link apply}.
 * @param {TraitFunction} trait A trait function used expressing {@link apply}.
 * @return {boolean} whether `proto` is a prototype created by the application of
 * `trait` to a superclass
 */


const isTraitificationOf = (proto, trait) => Object.prototype.hasOwnProperty.call(proto, _appliedTrait) && proto[_appliedTrait] === unwrap(trait);
/**
 * Returns `true` iff `o` has an application of `trait` on its prototype
 * chain.
 *
 * @function
 * @param {Object} it An object
 * @param {TraitFunction} trait A trait applied expressing {@link apply}
 * @return {boolean} whether `o` has an application of `trait` on its prototype
 * chain
 */


const expresses = (it, trait) => {
  while (it != null) {
    if (isTraitificationOf(it, trait)) return true;
    it = Object.getPrototypeOf(it);
  }

  return false;
}; // used by wrap() and unwrap()


const _wrappedTrait = Symbol('_wrappedTrait');
/**
 * Sets up the function `trait` to be wrapped by the function `wrapper`, while
 * allowing properties on `trait` to be available via `wrapper`, and allowing
 * `wrapper` to be unwrapped to get to the original function.
 *
 * `wrap` does two things:
 *   1. Sets the prototype of `trait` to `wrapper` so that properties set on
 *      `trait` inherited by `wrapper`.
 *   2. Sets a special property on `trait` that points back to `trait` so that
 *      it can be retreived from `wrapper`
 *
 * @function
 * @param {TraitFunction} trait A trait function
 * @param {TraitFunction} wrapper A function that wraps {@link trait}
 * @return {TraitFunction} `wrapper`
 */


const wrap = (trait, wrapper) => {
  Object.setPrototypeOf(wrapper, trait);

  if (!trait[_wrappedTrait]) {
    trait[_wrappedTrait] = trait;
  }

  return wrapper;
};
/**
 * Unwraps the function `wrapper` to return the original function wrapped by
 * one or more calls to `wrap`. Returns `wrapper` if it's not a wrapped
 * function.
 *
 * @function
 * @param {TraitFunction} wrapper A wrapped trait produced by {@link wrap}
 * @return {TraitFunction} The originally wrapped trait
 */


const unwrap = wrapper => wrapper[_wrappedTrait] || wrapper;

const _cachedApplications = Symbol('_cachedApplications');
/**
 * Decorates `trait` so that it caches its applications. When applied multiple
 * times to the same superclass, `trait` will only create one subclass, memoize
 * it and return it for each application.
 *
 * Note: If `trait` somehow stores properties in its class's constructor (static
 * properties), or on its class's prototype, it will be shared across all
 * applications of `trait` to a superclass. It's recommended that `trait` only
 * access instance state.
 *
 * @function
 * @param {TraitFunction} trait The trait to wrap expressing caching behavior
 * @return {TraitFunction} a new trait function
 */


const Cached = trait => wrap(trait, superclass => {
  // Get or create a symbol used to look up a previous application of trait
  // to the class. This symbol is unique per trait definition, so a class will have N
  // applicationRefs if it has had N traits applied to it. A trait will have
  // exactly one _cachedApplicationRef used to store its applications.
  let cachedApplications = superclass[_cachedApplications];

  if (!cachedApplications) {
    cachedApplications = superclass[_cachedApplications] = new Map();
  }

  let application = cachedApplications.get(trait);

  if (!application) {
    application = trait(superclass);
    cachedApplications.set(trait, application);
  }

  return application;
});
/**
 * Decorates `trait` so that it only applies if it's not already on the
 * prototype chain.
 *
 * @function
 * @param {TraitFunction} trait The trait to wrap expressing deduplication behavior
 * @return {TraitFunction} a new trait function
 */


const Dedupe = trait => wrap(trait, superclass => expresses(superclass.prototype, trait) ? superclass : trait(superclass));
/**
 * Adds [Symbol.hasInstance] (ES2015 custom instanceof support) to `trait`.
 * If the trait already has a [Symbol.hasInstance] property, then that is called firstName.
 * If it return a truey value, then that truey value is returned, else the return value of {@link expresses} is returned.
 *
 * @function
 * @param {TraitFunction} trait The trait to add [Symbol.hasInstance] to
 * @return {TraitFunction} the given trait function
 */


const HasInstance = trait => {
  if (Symbol && Symbol.hasInstance) {
    const priorHasInstance = trait[Symbol.hasInstance];
    Object.defineProperty(trait, Symbol.hasInstance, {
      value(it) {
        return priorHasInstance(it) || expresses(it, trait);
      }

    });
  }

  return trait;
};
/**
 * A basic trait decorator that applies the trait expressing {@link apply} so that it
 * can be used expressing {@link isTraitificationOf}, {@link expresses} and the other
 * trait decorator functions.
 *
 * @function
 * @param {TraitFunction} trait The trait to wrap
 * @return {TraitFunction} a new trait function
 */


const BareTrait = trait => wrap(trait, superclass => apply(superclass, trait));
/**
 * Decorates a trait function to add deduplication, application caching and
 * instanceof support.
 *
 * @function
 * @param {TraitFunction} trait The trait to wrap
 * @return {TraitFunction} a new trait function
 */


const Trait = trait => HasInstance(Dedupe(Cached(BareTrait(trait))));
/**
 * A fluent interface to apply a list of traits to a superclass.
 *
 * ```javascript
 * class X extends superclass(Superclass).expressing(A, B, C) {}
 * ```
 *
 * The traits are applied in order to the superclass, so the prototype chain
 * will be: X->C'->B'->A'->Superclass.
 *
 * This is purely a convenience function. The above example is equivalent to:
 *
 * ```javascript
 * class X extends C(B(A(Superclass || class {}))) {}
 * ```
 *
 * @function
 * @param {Function} [superclass=(class {})]
 * @return {TraitBuilder}
 */


const superclass = superclass => new TraitBuilder(superclass);
/**
 * A convenient syntactical shortcut to handle the case when a class extends
 * no other class, instead of having to call
 * ```javascript
 * superclass().expressing(M1, M2, ...)
 * ```
 * which avoids confusion over whether someone should or shouldn't pass a
 * superclass argument and so that it reads more naturally.
 *
 * @param ts {TraitFunction[]} vararg array of traits
 * @returns {Function}
 */


const traits = (...ts) => superclass().expressing(...ts);
/**
 * A convenient singular form of {@link traits} only for readability when expressing a single trait.
 *
 * @see traits
 */


const trait = traits;

class TraitBuilder {
  constructor(superclass) {
    this.superclass = superclass || class {};
  }
  /**
   * Applies `traits` in order to the superclass given to `superclass()`.
   *
   * @param {TraitFunction[]} traits
   * @return {Function} a subclass of `superclass` expressing `traits`
   */


  expressing(...traits) {
    return traits.reduce((it, t) => t(it), this.superclass);
  }

}

module.exports = {
  apply,
  isTraitificationOf,
  expresses,
  Cached,
  wrap,
  unwrap,
  Dedupe,
  HasInstance,
  BareTrait,
  Trait,
  superclass,
  trait,
  traits,
  TraitBuilder
};
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9tYWluL2luZGV4LmpzIl0sIm5hbWVzIjpbIl9hcHBsaWVkVHJhaXQiLCJTeW1ib2wiLCJhcHBseSIsInN1cGVyY2xhc3MiLCJ0cmFpdCIsImFwcGxpY2F0aW9uIiwicHJvdG90eXBlIiwidW53cmFwIiwiaXNUcmFpdGlmaWNhdGlvbk9mIiwicHJvdG8iLCJPYmplY3QiLCJoYXNPd25Qcm9wZXJ0eSIsImNhbGwiLCJleHByZXNzZXMiLCJpdCIsImdldFByb3RvdHlwZU9mIiwiX3dyYXBwZWRUcmFpdCIsIndyYXAiLCJ3cmFwcGVyIiwic2V0UHJvdG90eXBlT2YiLCJfY2FjaGVkQXBwbGljYXRpb25zIiwiQ2FjaGVkIiwiY2FjaGVkQXBwbGljYXRpb25zIiwiTWFwIiwiZ2V0Iiwic2V0IiwiRGVkdXBlIiwiSGFzSW5zdGFuY2UiLCJoYXNJbnN0YW5jZSIsInByaW9ySGFzSW5zdGFuY2UiLCJkZWZpbmVQcm9wZXJ0eSIsInZhbHVlIiwiQmFyZVRyYWl0IiwiVHJhaXQiLCJUcmFpdEJ1aWxkZXIiLCJ0cmFpdHMiLCJ0cyIsImV4cHJlc3NpbmciLCJjb25zdHJ1Y3RvciIsInJlZHVjZSIsInQiLCJtb2R1bGUiLCJleHBvcnRzIl0sIm1hcHBpbmdzIjoiOztBQUFBLE1BQU1BLGFBQWEsR0FBR0MsTUFBTSxDQUFDLGVBQUQsQ0FBNUI7QUFFQTs7Ozs7Ozs7Ozs7Ozs7O0FBZUE7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBd0JBLE1BQU1DLEtBQUssR0FBRyxDQUFDQyxVQUFELEVBQWFDLEtBQWIsS0FBdUI7QUFDbkMsUUFBTUMsV0FBVyxHQUFHRCxLQUFLLENBQUNELFVBQUQsQ0FBekI7QUFDQUUsRUFBQUEsV0FBVyxDQUFDQyxTQUFaLENBQXNCTixhQUF0QixJQUF1Q08sTUFBTSxDQUFDSCxLQUFELENBQTdDO0FBQ0EsU0FBT0MsV0FBUDtBQUNELENBSkQ7QUFNQTs7Ozs7Ozs7Ozs7Ozs7O0FBYUEsTUFBTUcsa0JBQWtCLEdBQUcsQ0FBQ0Ms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QSxLQURlO0FBRWZNLEVBQUFBLGtCQUZlO0FBR2ZLLEVBQUFBLFNBSGU7QUFJZlEsRUFBQUEsTUFKZTtBQUtmSixFQUFBQSxJQUxlO0FBTWZWLEVBQUFBLE1BTmU7QUFPZm1CLEVBQUFBLE1BUGU7QUFRZkMsRUFBQUEsV0FSZTtBQVNmSyxFQUFBQSxTQVRlO0FBVWZDLEVBQUFBLEtBVmU7QUFXZjlCLEVBQUFBLFVBWGU7QUFZZkMsRUFBQUEsS0FaZTtBQWFmK0IsRUFBQUEsTUFiZTtBQWNmRCxFQUFBQTtBQWRlLENBQWpCIiwic291cmNlc0NvbnRlbnQiOlsiY29uc3QgX2FwcGxpZWRUcmFpdCA9IFN5bWJvbCgnX2FwcGxpZWRUcmFpdCcpXG5cbi8qKlxuICogQSBmdW5jdGlvbiB0aGF0IHJldHVybnMgYW4gZW1wdHkgb3Igbm9uLWVtcHR5IHN1YmNsYXNzIG9mIGl0cyBhcmd1bWVudC5cbiAqXG4gKiBAZXhhbXBsZVxuICogY29uc3QgVCA9IChzdXBlcmNsYXNzKSA9PiBjbGFzcyBleHRlbmRzIHN1cGVyY2xhc3Mge1xuICogICBnZXRNZXNzYWdlKCkge1xuICogICAgIHJldHVybiBcIkhlbGxvXCI7XG4gKiAgIH1cbiAqIH1cbiAqXG4gKiBAdHlwZWRlZiB7RnVuY3Rpb259IFRyYWl0RnVuY3Rpb25cbiAqIEBwYXJhbSB7RnVuY3Rpb259IHN1cGVyY2xhc3MgSWYgZmFsc2V5LCB0aGUgc3VwZXJjbGFzcyBpcyBsaXRlcmFsbHkgYGNsYXNzIHt9YFxuICogQHJldHVybiB7RnVuY3Rpb259IEEgc3ViY2xhc3Mgb2YgYHN1cGVyY2xhc3NgXG4gKi9cblxuLyoqXG4gKiBBcHBsaWVzIGB0cmFpdGAgdG8gYHN1cGVyY2xhc3NgLlxuICpcbiAqIGBhcHBseWAgc3RvcmVzIGEgcmVmZXJlbmNlIGZyb20gdGhlIHRyYWl0IGFwcGxpY2F0aW9uIHRvIHRoZSB1bndyYXBwZWQgdHJhaXRcbiAqIHRvIG1ha2UgYGlzVHJhaXRpZmljYXRpb25PZmAgYW5kIGBleHByZXNzZXNgIHdvcmsuXG4gKlxuICogVGhpcyBmdW5jdGlvbiBpcyB1c2VmdWwgZm9yIHRyYWl0IHdyYXBwZXJzIHRoYXQgd2FudCB0byBhdXRvbWF0aWNhbGx5IGVuYWJsZVxuICoge0BsaW5rIGV4cHJlc3Nlc30gc3VwcG9ydC5cbiAqXG4gKiBAZXhhbXBsZVxuICogY29uc3QgQXBwbGllciA9IHRyYWl0ID0+IHdyYXAodHJhaXQsIHN1cGVyY2xhc3MgPT4gYXBwbHkoc3VwZXJjbGFzcywgdHJhaXQpKTtcbiAqXG4gKiAvLyBUIG5vdyB3b3JrcyBleHByZXNzaW5nIGBleHByZXNzZXNgIGFuZCBgaXNUcmFpdGlmaWNhdGlvbk9mYFxuICogY29uc3QgVCA9IEFwcGxpZXIoc3VwZXJjbGFzcyA9PiBjbGFzcyBleHRlbmRzIHN1cGVyY2xhc3Mge30pO1xuICpcbiAqIGNsYXNzIEMgZXh0ZW5kcyBUKGNsYXNzIHt9KSB7fVxuICogbGV0IGkgPSBuZXcgQygpO1xuICogZXhwcmVzc2VzKGksIFQpOyAvLyB0cnVlXG4gKlxuICogQGZ1bmN0aW9uXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBzdXBlcmNsYXNzIEEgY2xhc3Mgb3IgY29uc3RydWN0b3IgZnVuY3Rpb24gb3IgYSBmYWxzZXkgdmFsdWVcbiAqIEBwYXJhbSB7VHJhaXRGdW5jdGlvbn0gdHJhaXQgVGhlIHRyYWl0IHRvIGFwcGx5XG4gKiBAcmV0dXJuIHtGdW5jdGlvbn0gQSBzdWJjbGFzcyBvZiBgc3VwZXJjbGFzc2AgcHJvZHVjZWQgYnkgYHRyYWl0YFxuICovXG5jb25zdCBhcHBseSA9IChzdXBlcmNsYXNzLCB0cmFpdCkgPT4ge1xuICBjb25zdCBhcHBsaWNhdGlvbiA9IHRyYWl0KHN1cGVyY2xhc3MpXG4gIGFwcGxpY2F0aW9uLnByb3RvdHlwZVtfYXBwbGllZFRyYWl0XSA9IHVud3JhcCh0cmFpdClcbiAgcmV0dXJuIGFwcGxpY2F0aW9uXG59XG5cbi8qKlxuICogUmV0dXJucyBgdHJ1ZWAgaWZmIGBwcm90b2AgaXMgYSBwcm90b3R5cGUgY3JlYXRlZCBieSB0aGUgYXBwbGljYXRpb24gb2ZcbiAqIGB0cmFpdGAgdG8gYSBzdXBlcmNsYXNzLlxuICpcbiAqIGBpc1RyYWl0aWZpY2F0aW9uT2ZgIHdvcmtzIGJ5IGNoZWNraW5nIHRoYXQgYHByb3RvYCBoYXMgYSByZWZlcmVuY2UgdG8gYHRyYWl0YFxuICogYXMgY3JlYXRlZCBieSBgYXBwbHlgLlxuICpcbiAqIEBmdW5jdGlvblxuICogQHBhcmFtIHtPYmplY3R9IHByb3RvIEEgcHJvdG90eXBlIG9iamVjdCBjcmVhdGVkIGJ5IHtAbGluayBhcHBseX0uXG4gKiBAcGFyYW0ge1RyYWl0RnVuY3Rpb259IHRyYWl0IEEgdHJhaXQgZnVuY3Rpb24gdXNlZCBleHByZXNzaW5nIHtAbGluayBhcHBseX0uXG4gKiBAcmV0dXJuIHtib29sZWFufSB3aGV0aGVyIGBwcm90b2AgaXMgYSBwcm90b3R5cGUgY3JlYXRlZCBieSB0aGUgYXBwbGljYXRpb24gb2ZcbiAqIGB0cmFpdGAgdG8gYSBzdXBlcmNsYXNzXG4gKi9cbmNvbnN0IGlzVHJhaXRpZmljYXRpb25PZiA9IChwcm90bywgdHJhaXQpID0+XG4gIE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbChwcm90bywgX2FwcGxpZWRUcmFpdCkgJiYgcHJvdG9bX2FwcGxpZWRUcmFpdF0gPT09IHVud3JhcCh0cmFpdClcblxuLyoqXG4gKiBSZXR1cm5zIGB0cnVlYCBpZmYgYG9gIGhhcyBhbiBhcHBsaWNhdGlvbiBvZiBgdHJhaXRgIG9uIGl0cyBwcm90b3R5cGVcbiAqIGNoYWluLlxuICpcbiAqIEBmdW5jdGlvblxuICogQHBhcmFtIHtPYmplY3R9IGl0IEFuIG9iamVjdFxuICogQHBhcmFtIHtUcmFpdEZ1bmN0aW9ufSB0cmFpdCBBIHRyYWl0IGFwcGxpZWQgZXhwcmVzc2luZyB7QGxpbmsgYXBwbHl9XG4gKiBAcmV0dXJuIHtib29sZWFufSB3aGV0aGVyIGBvYCBoYXMgYW4gYXBwbGljYXRpb24gb2YgYHRyYWl0YCBvbiBpdHMgcHJvdG90eXBlXG4gKiBjaGFpblxuICovXG5jb25zdCBleHByZXNzZXMgPSAoaXQsIHRyYWl0KSA9PiB7XG4gIHdoaWxlIChpdCAhPSBudWxsKSB7XG4gICAgaWYgKGlzVHJhaXRpZmljYXRpb25PZihpdCwgdHJhaXQpKSByZXR1cm4gdHJ1ZVxuICAgIGl0ID0gT2JqZWN0LmdldFByb3RvdHlwZU9mKGl0KVxuICB9XG4gIHJldHVybiBmYWxzZVxufVxuXG4vLyB1c2VkIGJ5IHdyYXAoKSBhbmQgdW53cmFwKClcbmNvbnN0IF93cmFwcGVkVHJhaXQgPSBTeW1ib2woJ193cmFwcGVkVHJhaXQnKVxuXG4vKipcbiAqIFNldHMgdXAgdGhlIGZ1bmN0aW9uIGB0cmFpdGAgdG8gYmUgd3JhcHBlZCBieSB0aGUgZnVuY3Rpb24gYHdyYXBwZXJgLCB3aGlsZVxuICogYWxsb3dpbmcgcHJvcGVydGllcyBvbiBgdHJhaXRgIHRvIGJlIGF2YWlsYWJsZSB2aWEgYHdyYXBwZXJgLCBhbmQgYWxsb3dpbmdcbiAqIGB3cmFwcGVyYCB0byBiZSB1bndyYXBwZWQgdG8gZ2V0IHRvIHRoZSBvcmlnaW5hbCBmdW5jdGlvbi5cbiAqXG4gKiBgd3JhcGAgZG9lcyB0d28gdGhpbmdzOlxuICogICAxLiBTZXRzIHRoZSBwcm90b3R5cGUgb2YgYHRyYWl0YCB0byBgd3JhcHBlcmAgc28gdGhhdCBwcm9wZXJ0aWVzIHNldCBvblxuICogICAgICBgdHJhaXRgIGluaGVyaXRlZCBieSBgd3JhcHBlcmAuXG4gKiAgIDIuIFNldHMgYSBzcGVjaWFsIHByb3BlcnR5IG9uIGB0cmFpdGAgdGhhdCBwb2ludHMgYmFjayB0byBgdHJhaXRgIHNvIHRoYXRcbiAqICAgICAgaXQgY2FuIGJlIHJldHJlaXZlZCBmcm9tIGB3cmFwcGVyYFxuICpcbiAqIEBmdW5jdGlvblxuICogQHBhcmFtIHtUcmFpdEZ1bmN0aW9ufSB0cmFpdCBBIHRyYWl0IGZ1bmN0aW9uXG4gKiBAcGFyYW0ge1RyYWl0RnVuY3Rpb259IHdyYXBwZXIgQSBmdW5jdGlvbiB0aGF0IHdyYXBzIHtAbGluayB0cmFpdH1cbiAqIEByZXR1cm4ge1RyYWl0RnVuY3Rpb259IGB3cmFwcGVyYFxuICovXG5jb25zdCB3cmFwID0gKHRyYWl0LCB3cmFwcGVyKSA9PiB7XG4gIE9iamVjdC5zZXRQcm90b3R5cGVPZih3cmFwcGVyLCB0cmFpdClcbiAgaWYgKCF0cmFpdFtfd3JhcHBlZFRyYWl0XSkge1xuICAgIHRyYWl0W193cmFwcGVkVHJhaXRdID0gdHJhaXRcbiAgfVxuICByZXR1cm4gd3JhcHBlclxufVxuXG4vKipcbiAqIFVud3JhcHMgdGhlIGZ1bmN0aW9uIGB3cmFwcGVyYCB0byByZXR1cm4gdGhlIG9yaWdpbmFsIGZ1bmN0aW9uIHdyYXBwZWQgYnlcbiAqIG9uZSBvciBtb3JlIGNhbGxzIHRvIGB3cmFwYC4gUmV0dXJucyBgd3JhcHBlcmAgaWYgaXQncyBub3QgYSB3cmFwcGVkXG4gKiBmdW5jdGlvbi5cbiAqXG4gKiBAZnVuY3Rpb25cbiAqIEBwYXJhbSB7VHJhaXRGdW5jdGlvbn0gd3JhcHBlciBBIHdyYXBwZWQgdHJhaXQgcHJvZHVjZWQgYnkge0BsaW5rIHdyYXB9XG4gKiBAcmV0dXJuIHtUcmFpdEZ1bmN0aW9ufSBUaGUgb3JpZ2luYWxseSB3cmFwcGVkIHRyYWl0XG4gKi9cbmNvbnN0IHVud3JhcCA9IHdyYXBwZXIgPT4gd3JhcHBlcltfd3JhcHBlZFRyYWl0XSB8fCB3cmFwcGVyXG5cbmNvbnN0IF9jYWNoZWRBcHBsaWNhdGlvbnMgPSBTeW1ib2woJ19jYWNoZWRBcHBsaWNhdGlvbnMnKVxuXG4vKipcbiAqIERlY29yYXRlcyBgdHJhaXRgIHNvIHRoYXQgaXQgY2FjaGVzIGl0cyBhcHBsaWNhdGlvbnMuIFdoZW4gYXBwbGllZCBtdWx0aXBsZVxuICogdGltZXMgdG8gdGhlIHNhbWUgc3VwZXJjbGFzcywgYHRyYWl0YCB3aWxsIG9ubHkgY3JlYXRlIG9uZSBzdWJjbGFzcywgbWVtb2l6ZVxuICogaXQgYW5kIHJldHVybiBpdCBmb3IgZWFjaCBhcHBsaWNhdGlvbi5cbiAqXG4gKiBOb3RlOiBJZiBgdHJhaXRgIHNvbWVob3cgc3RvcmVzIHByb3BlcnRpZXMgaW4gaXRzIGNsYXNzJ3MgY29uc3RydWN0b3IgKHN0YXRpY1xuICogcHJvcGVydGllcyksIG9yIG9uIGl0cyBjbGFzcydzIHByb3RvdHlwZSwgaXQgd2lsbCBiZSBzaGFyZWQgYWNyb3NzIGFsbFxuICogYXBwbGljYXRpb25zIG9mIGB0cmFpdGAgdG8gYSBzdXBlcmNsYXNzLiBJdCdzIHJlY29tbWVuZGVkIHRoYXQgYHRyYWl0YCBvbmx5XG4gKiBhY2Nlc3MgaW5zdGFuY2Ugc3RhdGUuXG4gKlxuICogQGZ1bmN0aW9uXG4gKiBAcGFyYW0ge1RyYWl0RnVuY3Rpb259IHRyYWl0IFRoZSB0cmFpdCB0byB3cmFwIGV4cHJlc3NpbmcgY2FjaGluZyBiZWhhdmlvclxuICogQHJldHVybiB7VHJhaXRGdW5jdGlvbn0gYSBuZXcgdHJhaXQgZnVuY3Rpb25cbiAqL1xuY29uc3QgQ2FjaGVkID0gdHJhaXQgPT4gd3JhcCh0cmFpdCwgc3VwZXJjbGFzcyA9PiB7XG4gIC8vIEdldCBvciBjcmVhdGUgYSBzeW1ib2wgdXNlZCB0byBsb29rIHVwIGEgcHJldmlvdXMgYXBwbGljYXRpb24gb2YgdHJhaXRcbiAgLy8gdG8gdGhlIGNsYXNzLiBUaGlzIHN5bWJvbCBpcyB1bmlxdWUgcGVyIHRyYWl0IGRlZmluaXRpb24sIHNvIGEgY2xhc3Mgd2lsbCBoYXZlIE5cbiAgLy8gYXBwbGljYXRpb25SZWZzIGlmIGl0IGhhcyBoYWQgTiB0cmFpdHMgYXBwbGllZCB0byBpdC4gQSB0cmFpdCB3aWxsIGhhdmVcbiAgLy8gZXhhY3RseSBvbmUgX2NhY2hlZEFwcGxpY2F0aW9uUmVmIHVzZWQgdG8gc3RvcmUgaXRzIGFwcGxpY2F0aW9ucy5cblxuICBsZXQgY2FjaGVkQXBwbGljYXRpb25zID0gc3VwZXJjbGFzc1tfY2FjaGVkQXBwbGljYXRpb25zXVxuICBpZiAoIWNhY2hlZEFwcGxpY2F0aW9ucykge1xuICAgIGNhY2hlZEFwcGxpY2F0aW9ucyA9IHN1cGVyY2xhc3NbX2NhY2hlZEFwcGxpY2F0aW9uc10gPSBuZXcgTWFwKClcbiAgfVxuXG4gIGxldCBhcHBsaWNhdGlvbiA9IGNhY2hlZEFwcGxpY2F0aW9ucy5nZXQodHJhaXQpXG4gIGlmICghYXBwbGljYXRpb24pIHtcbiAgICBhcHBsaWNhdGlvbiA9IHRyYWl0KHN1cGVyY2xhc3MpXG4gICAgY2FjaGVkQXBwbGljYXRpb25zLnNldCh0cmFpdCwgYXBwbGljYXRpb24pXG4gIH1cblxuICByZXR1cm4gYXBwbGljYXRpb25cbn0pXG5cbi8qKlxuICogRGVjb3JhdGVzIGB0cmFpdGAgc28gdGhhdCBpdCBvbmx5IGFwcGxpZXMgaWYgaXQncyBub3QgYWxyZWFkeSBvbiB0aGVcbiAqIHByb3RvdHlwZSBjaGFpbi5cbiAqXG4gKiBAZnVuY3Rpb25cbiAqIEBwYXJhbSB7VHJhaXRGdW5jdGlvbn0gdHJhaXQgVGhlIHRyYWl0IHRvIHdyYXAgZXhwcmVzc2luZyBkZWR1cGxpY2F0aW9uIGJlaGF2aW9yXG4gKiBAcmV0dXJuIHtUcmFpdEZ1bmN0aW9ufSBhIG5ldyB0cmFpdCBmdW5jdGlvblxuICovXG5jb25zdCBEZWR1cGUgPSB0cmFpdCA9PiB3cmFwKHRyYWl0LCBzdXBlcmNsYXNzID0+IGV4cHJlc3NlcyhzdXBlcmNsYXNzLnByb3RvdHlwZSwgdHJhaXQpID8gc3VwZXJjbGFzcyA6IHRyYWl0KHN1cGVyY2xhc3MpKVxuXG4vKipcbiAqIEFkZHMgW1N5bWJvbC5oYXNJbnN0YW5jZV0gKEVTMjAxNSBjdXN0b20gaW5zdGFuY2VvZiBzdXBwb3J0KSB0byBgdHJhaXRgLlxuICogSWYgdGhlIHRyYWl0IGFscmVhZHkgaGFzIGEgW1N5bWJvbC5oYXNJbnN0YW5jZV0gcHJvcGVydHksIHRoZW4gdGhhdCBpcyBjYWxsZWQgZmlyc3ROYW1lLlxuICogSWYgaXQgcmV0dXJuIGEgdHJ1ZXkgdmFsdWUsIHRoZW4gdGhhdCB0cnVleSB2YWx1ZSBpcyByZXR1cm5lZCwgZWxzZSB0aGUgcmV0dXJuIHZhbHVlIG9mIHtAbGluayBleHByZXNzZXN9IGlzIHJldHVybmVkLlxuICpcbiAqIEBmdW5jdGlvblxuICogQHBhcmFtIHtUcmFpdEZ1bmN0aW9ufSB0cmFpdCBUaGUgdHJhaXQgdG8gYWRkIFtTeW1ib2wuaGFzSW5zdGFuY2VdIHRvXG4gKiBAcmV0dXJuIHtUcmFpdEZ1bmN0aW9ufSB0aGUgZ2l2ZW4gdHJhaXQgZnVuY3Rpb25cbiAqL1xuY29uc3QgSGFzSW5zdGFuY2UgPSB0cmFpdCA9PiB7XG4gIGlmIChTeW1ib2wgJiYgU3ltYm9sLmhhc0luc3RhbmNlKSB7XG4gICAgY29uc3QgcHJpb3JIYXNJbnN0YW5jZSA9IHRyYWl0W1N5bWJvbC5oYXNJbnN0YW5jZV1cbiAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkodHJhaXQsIFN5bWJvbC5oYXNJbnN0YW5jZSwge1xuICAgICAgdmFsdWUgKGl0KSB7XG4gICAgICAgIHJldHVybiBwcmlvckhhc0luc3RhbmNlKGl0KSB8fCBleHByZXNzZXMoaXQsIHRyYWl0KVxuICAgICAgfVxuICAgIH0pXG4gIH1cbiAgcmV0dXJuIHRyYWl0XG59XG5cbi8qKlxuICogQSBiYXNpYyB0cmFpdCBkZWNvcmF0b3IgdGhhdCBhcHBsaWVzIHRoZSB0cmFpdCBleHByZXNzaW5nIHtAbGluayBhcHBseX0gc28gdGhhdCBpdFxuICogY2FuIGJlIHVzZWQgZXhwcmVzc2luZyB7QGxpbmsgaXNUcmFpdGlmaWNhdGlvbk9mfSwge0BsaW5rIGV4cHJlc3Nlc30gYW5kIHRoZSBvdGhlclxuICogdHJhaXQgZGVjb3JhdG9yIGZ1bmN0aW9ucy5cbiAqXG4gKiBAZnVuY3Rpb25cbiAqIEBwYXJhbSB7VHJhaXRGdW5jdGlvbn0gdHJhaXQgVGhlIHRyYWl0IHRvIHdyYXBcbiAqIEByZXR1cm4ge1RyYWl0RnVuY3Rpb259IGEgbmV3IHRyYWl0IGZ1bmN0aW9uXG4gKi9cbmNvbnN0IEJhcmVUcmFpdCA9IHRyYWl0ID0+IHdyYXAodHJhaXQsIHN1cGVyY2xhc3MgPT4gYXBwbHkoc3VwZXJjbGFzcywgdHJhaXQpKVxuXG4vKipcbiAqIERlY29yYXRlcyBhIHRyYWl0IGZ1bmN0aW9uIHRvIGFkZCBkZWR1cGxpY2F0aW9uLCBhcHBsaWNhdGlvbiBjYWNoaW5nIGFuZFxuICogaW5zdGFuY2VvZiBzdXBwb3J0LlxuICpcbiAqIEBmdW5jdGlvblxuICogQHBhcmFtIHtUcmFpdEZ1bmN0aW9ufSB0cmFpdCBUaGUgdHJhaXQgdG8gd3JhcFxuICogQHJldHVybiB7VHJhaXRGdW5jdGlvbn0gYSBuZXcgdHJhaXQgZnVuY3Rpb25cbiAqL1xuY29uc3QgVHJhaXQgPSB0cmFpdCA9PiBIYXNJbnN0YW5jZShEZWR1cGUoQ2FjaGVkKEJhcmVUcmFpdCh0cmFpdCkpKSlcblxuLyoqXG4gKiBBIGZsdWVudCBpbnRlcmZhY2UgdG8gYXBwbHkgYSBsaXN0IG9mIHRyYWl0cyB0byBhIHN1cGVyY2xhc3MuXG4gKlxuICogYGBgamF2YXNjcmlwdFxuICogY2xhc3MgWCBleHRlbmRzIHN1cGVyY2xhc3MoU3VwZXJjbGFzcykuZXhwcmVzc2luZyhBLCBCLCBDKSB7fVxuICogYGBgXG4gKlxuICogVGhlIHRyYWl0cyBhcmUgYXBwbGllZCBpbiBvcmRlciB0byB0aGUgc3VwZXJjbGFzcywgc28gdGhlIHByb3RvdHlwZSBjaGFpblxuICogd2lsbCBiZTogWC0+QyctPkInLT5BJy0+U3VwZXJjbGFzcy5cbiAqXG4gKiBUaGlzIGlzIHB1cmVseSBhIGNvbnZlbmllbmNlIGZ1bmN0aW9uLiBUaGUgYWJvdmUgZXhhbXBsZSBpcyBlcXVpdmFsZW50IHRvOlxuICpcbiAqIGBgYGphdmFzY3JpcHRcbiAqIGNsYXNzIFggZXh0ZW5kcyBDKEIoQShTdXBlcmNsYXNzIHx8IGNsYXNzIHt9KSkpIHt9XG4gKiBgYGBcbiAqXG4gKiBAZnVuY3Rpb25cbiAqIEBwYXJhbSB7RnVuY3Rpb259IFtzdXBlcmNsYXNzPShjbGFzcyB7fSldXG4gKiBAcmV0dXJuIHtUcmFpdEJ1aWxkZXJ9XG4gKi9cbmNvbnN0IHN1cGVyY2xhc3MgPSBzdXBlcmNsYXNzID0+IG5ldyBUcmFpdEJ1aWxkZXIoc3VwZXJjbGFzcylcblxuLyoqXG4gKiBBIGNvbnZlbmllbnQgc3ludGFjdGljYWwgc2hvcnRjdXQgdG8gaGFuZGxlIHRoZSBjYXNlIHdoZW4gYSBjbGFzcyBleHRlbmRzXG4gKiBubyBvdGhlciBjbGFzcywgaW5zdGVhZCBvZiBoYXZpbmcgdG8gY2FsbFxuICogYGBgamF2YXNjcmlwdFxuICogc3VwZXJjbGFzcygpLmV4cHJlc3NpbmcoTTEsIE0yLCAuLi4pXG4gKiBgYGBcbiAqIHdoaWNoIGF2b2lkcyBjb25mdXNpb24gb3ZlciB3aGV0aGVyIHNvbWVvbmUgc2hvdWxkIG9yIHNob3VsZG4ndCBwYXNzIGFcbiAqIHN1cGVyY2xhc3MgYXJndW1lbnQgYW5kIHNvIHRoYXQgaXQgcmVhZHMgbW9yZSBuYXR1cmFsbHkuXG4gKlxuICogQHBhcmFtIHRzIHtUcmFpdEZ1bmN0aW9uW119IHZhcmFyZyBhcnJheSBvZiB0cmFpdHNcbiAqIEByZXR1cm5zIHtGdW5jdGlvbn1cbiAqL1xuY29uc3QgdHJhaXRzID0gKC4uLnRzKSA9PiBzdXBlcmNsYXNzKCkuZXhwcmVzc2luZyguLi50cylcblxuLyoqXG4gKiBBIGNvbnZlbmllbnQgc2luZ3VsYXIgZm9ybSBvZiB7QGxpbmsgdHJhaXRzfSBvbmx5IGZvciByZWFkYWJpbGl0eSB3aGVuIGV4cHJlc3NpbmcgYSBzaW5nbGUgdHJhaXQuXG4gKlxuICogQHNlZSB0cmFpdHNcbiAqL1xuY29uc3QgdHJhaXQgPSB0cmFpdHNcblxuY2xhc3MgVHJhaXRCdWlsZGVyIHtcbiAgY29uc3RydWN0b3IgKHN1cGVyY2xhc3MpIHtcbiAgICB0aGlzLnN1cGVyY2xhc3MgPSBzdXBlcmNsYXNzIHx8IGNsYXNzIHt9XG4gIH1cblxuICAvKipcbiAgICogQXBwbGllcyBgdHJhaXRzYCBpbiBvcmRlciB0byB0aGUgc3VwZXJjbGFzcyBnaXZlbiB0byBgc3VwZXJjbGFzcygpYC5cbiAgICpcbiAgICogQHBhcmFtIHtUcmFpdEZ1bmN0aW9uW119IHRyYWl0c1xuICAgKiBAcmV0dXJuIHtGdW5jdGlvbn0gYSBzdWJjbGFzcyBvZiBgc3VwZXJjbGFzc2AgZXhwcmVzc2luZyBgdHJhaXRzYFxuICAgKi9cbiAgZXhwcmVzc2luZyAoLi4udHJhaXRzKSB7XG4gICAgcmV0dXJuIHRyYWl0cy5yZWR1Y2UoKGl0LCB0KSA9PiB0KGl0KSwgdGhpcy5zdXBlcmNsYXNzKVxuICB9XG59XG5cbm1vZHVsZS5leHBvcnRzID0ge1xuICBhcHBseSxcbiAgaXNUcmFpdGlmaWNhdGlvbk9mLFxuICBleHByZXNzZXMsXG4gIENhY2hlZCxcbiAgd3JhcCxcbiAgdW53cmFwLFxuICBEZWR1cGUsXG4gIEhhc0luc3RhbmNlLFxuICBCYXJlVHJhaXQsXG4gIFRyYWl0LFxuICBzdXBlcmNsYXNzLFxuICB0cmFpdCxcbiAgdHJhaXRzLFxuICBUcmFpdEJ1aWxkZXJcbn1cbiJdfQ==