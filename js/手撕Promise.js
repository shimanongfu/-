const PENDING = 'pending';
const FULFILLED = 'fulfilled';
const REJECTED = 'rejected';

// 根据运行环境定义queueMicrotask函数
function runMicroTasks(fn) {
  // 原生支持
  if (typeof queueMicrotask === 'function') {
    return queueMicrotask(fn);
  }
  // node环境
  if (typeof process !== 'undefined' && process.nextTick) {
    return process.nextTick(fn);
  }
  // 浏览器环境
  if (typeof MutationObserver !== 'undefined') {
    const text = document.createTextNode('');
    const observer = new MutationObserver(fn);
    observer.observe(text, { characterData: true });
    text.data = 0;
  }
  // 最后使用setTimeout
  return setTimeout(fn, 0);
}

class MyPromise {
  #state = PENDING;
  #value;
  #handlers = [];

  constructor(executor) {
    try {
      executor(this.#resolve.bind(this), this.#reject.bind(this));
    } catch (err) {
      this.#reject(err);
    }
  }

  then(onFulfilled, onRejected) {
    return new MyPromise((resolve, reject) => {
      this.#handlers.push(() => {
        runMicroTasks(() => {
          try {
            const cb = this.#state === FULFILLED ? onFulfilled : onRejected;
            const res = typeof cb === 'function' ? cb(this.#value) : this.#value;
            if (typeof res?.then === 'function') {
              res.then(resolve, reject);
            } else {
              resolve(res);
            }
          } catch (err) {
            reject(err);
          }
        });
      });
      this.#run();
    });
  }

  catch(onRejected) {
    return this.then(null, onRejected);
  }

  finally(onFinally) {
    return this.then(
      (value) => MyPromise.resolve(onFinally()).then(() => value),
      (reason) =>
        MyPromise.resolve(onFinally()).then(() => {
          throw reason;
        })
    );
  }

  #setState(state, val) {
    if (this.#state !== PENDING) return;
    this.#state = state;
    this.#value = val;
    this.#run();
  }

  #run() {
    if (this.#state !== PENDING) {
      this.#handlers.forEach((cb) => cb());
      this.#handlers = [];
    }
  }

  #resolve(value) {
    this.#setState(FULFILLED, value);
  }

  #reject(reason) {
    this.#setState(REJECTED, reason);
  }

  static resolve(value) {
    return new MyPromise((resolve, reject) => resolve(value));
  }

  static reject(reason) {
    return new MyPromise((resolve, reject) => reject(reason));
  }
}

let p1 = new MyPromise((resolve, reject) => {
  setTimeout(() => {
    resolve('success');
  }, 1000);
});

let p2 = p1
  .then(
    (res) => {
      // console.log('success1==>', res);
      // return 'success1';
      return new MyPromise((resolve, reject) => {
        setTimeout(() => {
          resolve('success1');
        });
      });
    },
    (err) => {
      console.log('err1==>', err);
      return 'err1';
    }
  )
  .then(
    (res) => {
      console.log('success11==>', res);
      return 'success11';
    },
    (err) => {
      console.log('err11==>', err);
      return 'err11';
    }
  )
  .catch((err) => {
    console.log('catch==>', err);
  })
  .finally(() => {
    console.log('finally==>');
  });

console.log('阻塞了吗?');

(async () => {
  console.log(p2);
  let res = await p2;
  console.log('await==>', res);
})();
