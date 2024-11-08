Function.prototype.mycall = function (ctx, ...args) {
  ctx = ctx === null || ctx === undefined ? globalThis : Object(ctx);
  let fn = Symbol();
  ctx[fn] = this;
  Object.defineProperty(ctx, fn, {
    configurable: true,
    enumerable: false,
    writable: true,
  });
  return ctx[fn](...args);
};

Function.prototype.myapply = function (ctx, args) {
  ctx = ctx === null || ctx === undefined ? globalThis : Object(ctx);
  let fn = Symbol();
  ctx[fn] = this;
  Object.defineProperty(ctx, fn, {
    configurable: true,
    enumerable: false,
    writable: true,
  });
  return ctx[fn](...args);
};

Function.prototype.mybind = function (ctx, ...args) {
  ctx = ctx === null || ctx === undefined ? globalThis : Object(ctx);
  let fn = Symbol();
  ctx[fn] = this;
  Object.defineProperty(ctx, fn, {
    configurable: true,
    enumerable: false,
    writable: true,
  });
  return function (...args2) {
    return ctx[fn](...args, ...args2);
  };
};

function fn(a, b) {
  console.log(this);
  return a + b;
}

let r1 = fn.bind(1, 1);

let r2 = fn.mybind(1, 1);

console.log(r1(2), r2(2));
