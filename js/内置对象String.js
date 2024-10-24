// String是构造函数，用于创建一个新的String对象，String对象是字符串的包装对象，用于表示和操作字符串。
const str = new String('Hello, world!');

// 1.字符串的长度
str.length;

// 2.字符串的索引,通过索引可以访问字符串中的某个字符。
str[0];

// 3.字符串的拼接,concat方法用于将一个或多个字符串与原字符串连接合并，形成一个新的字符串并返回。
str.concat('!');

// 4.字符串的截取,slice方法用于截取字符串的一部分，并返回一个新的字符串。
str.slice(0, 5);
str.substring(0, 5);

// 5.字符串的查找,indexOf方法用于返回某个指定的字符串值在字符串中首次出现的位置，如果没有找到匹配的字符串则返回-1。
str.indexOf('world');
str.lastIndexOf('world');

// 6.字符串的替换,replace方法用于替换字符串中的指定值，并返回一个新的字符串。
str.replace('world', 'JavaScript');

// 7.字符串的分割,split方法用于将字符串分割成字符串数组，并返回该数组。
str.split(',');

// 8.字符串的转换,toUpperCase方法用于将字符串转换为大写，toLowerCase方法用于将字符串转换为小写。
str.toUpperCase();
str.toLowerCase();

// 9.字符串的判断,startsWith方法用于判断字符串是否以指定的子字符串开头，endsWith方法用于判断字符串是否以指定的子字符串结尾，includes方法用于判断字符串是否包含指定的子字符串，match方法用于在字符串中搜索指定的值，并返回一个包含该值的数组。
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
