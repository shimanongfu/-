// Set是构造函数，用于创建一个新的Set对象，Set对象是新的数据结构，类似于数组，但是成员的值都是唯一的，没有重复的值。
const set = new Set([1, 2, 3, 4, 5]);

// Set对象的方法：
// add(value)：向Set对象中添加一个新元素，并返回Set对象本身。
set.add(6);
// delete(value)：从Set对象中删除指定的元素，并返回一个布尔值，表示是否成功删除。
set.delete(3);
// has(value)：判断Set对象中是否存在指定的元素，并返回一个布尔值。
set.has(2);
// clear()：清空Set对象中的所有元素。
set.clear();
// size：返回Set对象中元素的个数。
set.size;
// Set对象与数组之间的转换：
// Array.from(set)：将Set对象转换为数组。
Array.from(set);
// [...set]：使用扩展运算符将Set对象转换为数组。
[...set];
// Set对象与字符串之间的转换：
// new Set(string)：将字符串转换为Set对象，Set对象中的每个元素都是字符串的一个字符。
new Set('hello');
// Set对象与Map对象之间的转换：
// new Set(map)：将Map对象转换为Set对象，Set对象中的每个元素都是Map对象的一个键值对。
new Set(
  new Map([
    [1, 'a'],
    [2, 'b'],
  ])
);
