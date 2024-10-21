const sum = (a, b, c) => a + b + c;

function curry(fn, ...args) {
  console.log('args', args);
  return function (...args2) {
    console.log('args2', args2);
    const allArgs = [...args, ...args2];
    if (allArgs.length >= fn.length) {
      return fn(...allArgs);
    }
    return curry(fn, ...allArgs);
  };
}

let _fn = curry(sum);

console.log(_fn(1)(2)(3));
