// Object是对象的构造函数，是原型链的顶端
// 主要掌握Object的静态方法

// Object.create(proto, [propertiesObject])，创建一个新对象，使用现有的对象来提供新创建的对象的__proto__。第二个参数可选，用于指定要添加到新对象的可枚举属性（即其自身定义的属性，而不是其原型链上的枚举属性）。
const obj = Object.create(
  {},
  {
    p: {
      value: 42,
    },
  }
);

// Object.defineProperty(obj, prop, descriptor)，直接在一个对象上定义一个新属性，或者修改一个对象的现有属性，并返回这个对象。
Object.defineProperty(obj, 'p', {
  value: 42,
  writable: false,
  enumerable: true,
  configurable: true,
});

// Object.defineProperties(obj, props)，在一个对象上定义多个新属性或修改现有属性，并返回该对象。
Object.defineProperties(obj, {
  p1: {
    value: 42,
    writable: false,
  },
  p2: {
    value: 13,
    writable: false,
  },
});

// Object.getOwnPropertyDescriptor(obj, prop)，返回指定对象上一个自有属性对应的属性描述符。
Object.getOwnPropertyDescriptor(obj, 'p');

// Object.entries(obj)，返回一个给定对象自身可枚举属性的键值对数组，其排列与使用 for...in 循环遍历该对象时返回的顺序一致（区别在于 for...in 循环还会枚举其原型链中的属性）。
Object.entries(obj);

// Object.freeze(obj)，冻结一个对象，其他代码不能删除或更改任何属性。
Object.freeze(obj);

// Object.is(obj1, obj2)，判断两个值是否为同一个值。
Object.is('foo', 'foo'); // true

//Object.keys(obj)，返回一个给定对象自身的所有可枚举属性键的数组。
Object.keys(obj);

// Object.values(obj)，返回一个给定对象自身的所有可枚举属性值的数组。
Object.values(obj);

// Object.assign(target, ...sources)，将所有可枚举属性的值从一个或多个源对象复制到目标对象。它将返回目标对象。
Object.assign(target, source1, source2);

// Object.getPrototypeOf(obj)，返回指定对象的原型（即，内部的[[Prototype]]属性）。
Object.getPrototypeOf(obj);

// Object.hasOwn(obj, prop)，判断对象自身是否具有指定的属性。对于继承的属性，该方法会返回 false。
Object.hasOwn(obj, 'p');
