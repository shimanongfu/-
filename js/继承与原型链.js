// * js中函数与对象都是引用类型，函数是特殊的对象（一等公民，使用function类型，其他对象都是object类型）
// * js中对象通过原型链实现继承，__proto__是继承属性(所有对象都有这个属性，完成继承)，prototype是原型属性(只有函数才有这个属性，定义继承）。
// * __proto__指向其构造函数的prototype的一个引用，prototype也是一个对象，它也有__proto__属性，指向其构造函数的prototype的一个引用，以此类推，形成原型链。
// * 原型链的终点是Object.prototype，它的__proto__属性是null，表示没有原型。
// * 原型链的作用是，当访问一个对象的属性时，如果该对象内部不存在这个属性，那么它就会去它的原型对象里找这个属性，以此类推（.__proto__.proto__ ...），一直找到 Object.prototype 为止。

// Function 是所有函数的构造函数，所有函数（__proto__）都继承自 Function.prototype。
// Function.prototype 有点特殊，是Function自身的引用，Function是函数，所以它继承自Function.prototype，有点扯...
// Function.prototype 也有__proto__属性，指向其构造函数的Object.prototype。

// Object 是对象的构造函数，所以它（__proto__）继承自 Function.prototype。
// Object.prototype 也有点特殊，这个对象没有继承属性（即它的__proto__属性是 null），所以原型链到 Object.prototype 终止。

// 内置对象 Array、Number、String、Boolean、RegExp、Date、Map、Set、Promise等，都是使用new的构造函数，它们继承自 Function.prototype。
// 内置对象 Symbol、BigInt等也是函数，生成原始类型的值，不需要使用new，直接调用，它们继承自 Function.prototype。
// 内置对象 Math、JSON等是对象（object）,它们继承自 Object.prototype。

// 所有函数（普通函数、构造函数）都继承自 Function.prototype，函数的原型链是固定的：(函数).__proto__.__proto__ = Object.prototype。
// 所有对象（包括函数）继承的终点都是 Object.prototype，对象（object）的原型链不是固定的，可以无限继承。
