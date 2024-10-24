// Function 是所有函数的构造函数,所有函数继承自Function.prototype；
// 掌握Function.prototype的方法，call、apply、bind；

// 1） call方法 ：调用一个函数，并且可以指定this的值和参数；
// 语法：function.call(thisArg, arg1, arg2, ...)
// 例子：
function sum(a, b) {
  return a + b;
}

console.log(sum.call(null, 1, 2)); // 3

// 2） apply方法 ：调用一个函数，并且可以指定this的值和参数，参数以数组或类数组的形式传入；
// 语法：function.apply(thisArg, [argsArray])
// 例子：
function sum(a, b) {
  return a + b;
}

console.log(sum.apply(null, [1, 2])); // 3

// 3） bind方法 ：创建一个新的函数，并且可以指定this的值和参数；
// 语法：function.bind(thisArg, arg1, arg2, ...)
// 例子：
function sum(a, b) {
  return a + b;
}

const newSum = sum.bind(null, 1);
