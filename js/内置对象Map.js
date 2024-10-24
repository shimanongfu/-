// Map是构造函数，用来生成新的Map对象，Map对象是新的数据结构，类似于对象，也是键值对的集合，但是“键”的范围不限于字符串，各种类型的值（包括对象）都可以当作键。
// 主要掌握实例方法

// set(key, value)：设置键名key对应的键值value，然后返回整个Map对象，如果key已经有值，则键值会被更新，否则就新生成该键。
let m1 = new Map();
m1.set('edition', 6);

// get(key)：读取key对应的键值，如果找不到key，返回undefined。
let m2 = new Map();
m2.set('edition', 6);
m2.get('edition'); // 6

// has(key)：返回一个布尔值，表示某个键是否在Map数据结构中。
let m3 = new Map();
m3.set('edition', 6);

// delete(key)：删除某个键，返回true。如果删除失败，返回false。
let m4 = new Map();
m4.set('edition', 6);
m4.delete('edition'); // true

// clear()：清除所有成员，没有返回值。
let m5 = new Map();
m5.set('edition', 6);
m5.clear(); // undefined

// size：返回Map结构的成员总数。
let m6 = new Map();
m6.set('edition', 6);
m6.size; // 1

// keys()：返回键名的遍历器。
let m7 = new Map();
m7.set('edition', 6);
m7.set(262, 'standard');
m7.set(undefined, 'nah');
for (let key of m7.keys()) {
  console.log(key);
}

// values()：返回键值的遍历器。
let m8 = new Map();
m8.set('edition', 6);
m8.set(262, 'standard');
m8.set(undefined, 'nah');
for (let value of m8.values()) {
  console.log(value);
}

// entries()：返回所有成员的遍历器。
let m9 = new Map();
m9.set('edition', 6);
m9.set(262, 'standard');
m9.set(undefined, 'nah');
for (let [key, value] of m9.entries()) {
  console.log(key, value);
}

// forEach()：遍历Map的所有成员。
let m10 = new Map();
m10.set('edition', 6);
m10.set(262, 'standard');
m10.set(undefined, 'nah');
m10.forEach(function (value, key, map) {
  console.log(key, value);
});

// Map转为数组
let myMap = new Map().set(true, 7).set({ foo: 3 }, ['abc']);
[...myMap]; // [[true, 7], [{foo: 3}, ['abc']]]

// 数组转为Map
new Map([
  [true, 7],
  [{ foo: 3 }, ['abc']],
]);
