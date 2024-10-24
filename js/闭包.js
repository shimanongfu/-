//闭包定义：函数嵌套函数，内部函数可以访问外部函数的变量，参数和函数
//闭包作用：延长变量的生命周期，保护私有变量
//闭包缺点：内存泄漏，内存占用过多，容易造成内存泄漏

//闭包示例
function outer() {
    var a = 1;
    function inner() {
        console.log(a);
    }
    return inner;
}

var fn = outer();
fn(); //输出1


//闭包应用场景
//1.封装私有变量
function Counter() {
    var count = 0;
    return {
        increment: function () {
            count++;
            console.log(count);
        },
        decrement: function () {
            count--;
            console.log(count);
        }
    }
}

var counter1 = Counter(); //创建一个计数器  
counter1.increment(); //输出1
counter1.decrement(); //输出0

var counter2 = Counter(); //创建另一个计数器
counter2.increment(); //输出1


//2.实现柯里化
function add(a, b) {
    return a + b;
}

function curry(fn) {
    return function (a) {
        return function (b) {
            return fn(a, b);
        }
    }
}

var add5 = curry(add)(5); 
console.log(add5(10)); //输出15
console.log(add5(20)); //输出25
console.log(add5(30)); //输出35
//柯里化：将一个多参数的函数转换成一系列使用一个参数的函数
//柯里化作用：提高函数的复用性，减少代码冗余
//柯里化缺点：代码可读性降低，函数嵌套过多
//柯里化示例：将add函数转换成add5函数，add5函数只接受一个参数，add5函数内部再调用add函数，add函数接受两个参数

//3.实现防抖和节流
//防抖：在事件被触发n秒后再执行回调，如果在这n秒内又被触发，则重新计时
//节流：在规定时间内只执行一次回调，如果在这规定时间内又被触发，则不执行回调
//防抖和节流的作用：防止事件频繁触发，提高性能
//防抖和节流的缺点：代码可读性降低，函数嵌套过多
//防抖和节流示例：
//防抖示例：
function debounce(fn, delay) {
    let timer = null;
    return function () {
        clearTimeout(timer);
        timer = setTimeout(() => {
            fn.apply(this, arguments);
        }, delay);
    }
}

//节流示例：
function throttle(fn, delay) {
    let timer = null;
    return function () {
        if (!timer) {
            timer = setTimeout(() => {
                fn.apply(this, arguments);
                timer = null;
            }, delay);
        }
    }
}

//闭包总结：闭包是一种编程技巧，可以延长变量的生命周期，保护私有变量，提高函数的复用性，减少代码冗余，但是容易造成内存泄漏，内存占用过多，代码可读性降低，函数嵌套过多。
//闭包应用场景：封装私有变量，实现柯里化，实现防抖和节流。
//闭包优点：延长变量的生命周期，保护私有变量，提高函数的复用性，减少代码冗余。