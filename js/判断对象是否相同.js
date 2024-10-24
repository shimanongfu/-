//简单比较
const o1 = { a: 1, b: { c: 2 } };
const o2 = { a: 1, b: { c: 2 } };

console.log(JSON.stringify(o1) === JSON.stringify(o1)); // true

//深度比较
function deepEqual(obj1, obj2) {
  // 如果两个对象相同引用，直接返回 true
  if (obj1 === obj2) return true;

  // 如果两个不是对象类型，直接比较值
  if (
    typeof obj1 !== 'object' ||
    typeof obj2 !== 'object' ||
    obj1 === null ||
    obj2 === null
  ) {
    return obj1 === obj2;
  }

  // 获取对象的键
  const keys1 = Object.keys(obj1);
  const keys2 = Object.keys(obj2);

  // 如果两个对象的键数量不同，返回 false
  if (keys1.length !== keys2.length) return false;

  // 递归检查每个键的值是否相等
  for (let key of keys1) {
    if (!deepEqual(obj1[key], obj2[key])) {
      return false;
    }
  }

  return true;
}

const obj1 = { a: 1, b: { c: 2 } };
const obj2 = { a: 1, b: { c: 2 } };
const obj3 = { a: 1, b: { c: 3 } };

console.log(deepEqual(obj1, obj2)); // true，内容相同
console.log(deepEqual(obj1, obj3)); // false，内容不同
