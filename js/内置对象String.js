// String是构造函数，用于创建一个新的String对象，String对象是字符串的包装对象，用于表示和操作字符串。
const str = new String('Hello, world!');

// 1.字符串的长度
str.length;

// 2.字符串的索引
str[0];

// 3.字符串的拼接
str.concat('!');

// 4.字符串的截取
str.slice(0, 5);
str.substring(0, 5);

// 5.字符串的查找
str.indexOf('world');
str.lastIndexOf('world');

// 6.字符串的替换
str.replace('world', 'JavaScript');

// 7.字符串的分割
str.split(',');

// 8.字符串的转换
str.toUpperCase();
str.toLowerCase();

// 9.字符串的判断
str.startsWith('Hello');
str.endsWith('world');
str.includes('world');
str.match(/world/);

// 10.字符串的遍历
for (const char of str) {
  console.log(char);
}
// 11.字符串的迭代器
const iterator = str[Symbol.iterator]();
iterator.next().value;
