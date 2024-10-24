// Array时js数组的构造函数，继承自Function / Object，并通过Array.prototype实现数组相关操作函数。
// 主要掌握一些常用的实例方法即可。

// 1. Array.from() ,静态方法，将类数组对象或可迭代对象转换成数组；
Array.from('foo'); // ['f', 'o', 'o']
Array.from([1, 2, 3], (x) => x + x); // [2, 4, 6]
Array.from(new Set([1, 2, 3])); // [1, 2, 3]
Array.from(
  new Map([
    [1, 'one'],
    [2, 'two'],
    [3, 'three'],
  ])
); // [[1, 'one'], [2, 'two'], [3, 'three']]

// 2. Array.isArray() ,静态方法，判断是否为数组；
Array.isArray([1, 2, 3]); // true
Array.isArray({ foo: 123 }); // false
Array.isArray('foobar'); // false
Array.isArray(undefined); // false

// 3. arr.at() ,实例方法，返回指定索引位置的元素，支持负索引；
let arr1 = [1, 2, 3, 4, 5];
arr1.at(1); // 2
arr1.at(-1); // 5

// 4. arr.concat() ,实例方法，返回一个新数组，包含原数组中的所有元素，并包含调用concat()方法的一个或多个数组的元素；
let arr2 = [1, 2, 3, 4, 5];
arr2.concat([6, 7, 8], [9, 10]); // [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]

// 5. arr.push() ,实例方法，将一个或多个元素添加到数组的末尾，并返回新数组的长度；
let arr3 = [1, 2, 3, 4, 5];
arr3.push(6, 7, 8); // 8

// 6. arr.pop() ,实例方法，移除数组的最后一个元素，并返回该元素；
let arr4 = [1, 2, 3, 4, 5];
arr4.pop(); // 5

// 7. arr.shift() ,实例方法，移除数组的第一个元素，并返回该元素;
let arr5 = [1, 2, 3, 4, 5];
arr5.shift(); // 1

// 8. arr.unshift() ,实例方法，将一个或多个元素添加到数组的开头，并返回新数组的长度；
let arr6 = [1, 2, 3, 4, 5];
arr6.unshift(-1, 0); //7

// 9. arr.splice() ,实例方法，通过删除或替换现有元素或者原地添加新的元素来修改数组，并以数组形式返回被修改的内容。此方法会改变原数组；
let arr7 = [1, 2, 3, 4, 5];
arr4.splice(2, 0, 'a', 'b'); // [1, 2, 'a', 'b', 3, 4, 5]

// 10. arr.slice() ,实例方法，返回一个新数组，包含从开始到结束（不包括结束）选择的数组的一部分浅拷贝到一个新数组对象。原始数组不会被修改；
let arr8 = [1, 2, 3, 4, 5];
arr8.slice(1, 3); // [2, 3]

// 11. arr.fill() ,实例方法，用一个固定值填充一个数组中从起始索引到终止索引内的全部元素。不包括终止索引；
let arr9 = [1, 2, 3, 4, 5];
arr9.fill(0, 1, 3); // [1, 0, 0, 4, 5]

// 12. arr.includes() ,实例方法，判断一个数组是否包含一个指定的值，根据情况，如果包含则返回 true，否则返回 false；
let arr10 = [1, 2, 3, 4, 5];
arr10.includes(3); // true

// 13. arr.indexOf() ,实例方法，返回在数组中可以找到一个给定元素的第一个索引，如果不存在，则返回-1；
let arr11 = [1, 2, 3, 4, 5];
arr11.indexOf(3); // 2

// 14. arr.join() ,实例方法，将一个数组（或一个类数组对象）的所有元素连接成一个字符串并返回这个字符串。如果数组只有一个项目，那么将返回该项目而不使用分隔符；
let arr12 = [1, 2, 3, 4, 5];
arr12.join('-'); // "1-2-3-4-5"

// 15. arr.reverse() ,实例方法，将数组中元素的位置颠倒，并返回该数组。该方法会改变原数组；
let arr13 = [1, 2, 3, 4, 5];
arr13.reverse(); // [5, 4, 3, 2, 1]

// 16. arr.sort() ,实例方法，对数组的元素进行排序并返回数组。默认排序顺序是在将元素转换为字符串，然后比较它们的UTF-16代码单元值序列时构建的；
let arr14 = [1, 2, 3, 4, 5];
arr14.sort((a, b) => b - a); // [5, 4, 3, 2, 1]

// 17. arr.forEach() ,实例方法，对数组的每个元素执行一次提供的函数；
let arr15 = [1, 2, 3, 4, 5];
arr15.forEach((item, index, array) => {
  console.log(item, index, array);
});

// 18. arr.map() ,实例方法，创建一个新数组，其结果是该数组中的每个元素是调用一次提供的函数后的返回值；
let arr16 = [1, 2, 3, 4, 5];
arr16.map((item, index, array) => {
  return item * 2;
});

// 19. arr.filter() ,实例方法，创建一个新数组, 其包含通过所提供函数实现的测试的所有元素；
let arr17 = [1, 2, 3, 4, 5];
arr17.filter((item, index, array) => {
  return item > 3;
});

// 20. arr.values() ,实例方法，返回一个数组迭代器对象，该对象包含数组每个索引的值；
let arr18 = [1, 2, 3, 4, 5];
let iterator = arr18.values();
iterator.next(); // {value: 1, done: false}
for (let value of iterator) {
  console.log(value);
}
