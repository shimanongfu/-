const PENDING = 'pending';
const FULFILLED = 'fulfilled';
const REJECTED = 'rejected';

function myPromise(executor) {
  this.state = PENDING;
  this.value;
  let handlers = [];

  this.then = (onFulfilled, onRejected) => {
    return new myPromise((resolve, reject) => {
      let res;
      if (this.state === FULFILLED) {
        queueMicrotask(() => {
          res = onFulfilled(this.value);
          resolve(res);
        });
      }
      if (this.state === REJECTED) {
        queueMicrotask(() => {
          res = onRejected(this.value);
          reject(res);
        });
      }
      if (this.state === PENDING) {
        handlers.push(() => {
          if (this.state === FULFILLED) {
            res = onFulfilled(this.value);
            resolve(res);
          }
          if (this.state === REJECTED) {
            res = onRejected(this.value);
            reject(res);
          }
        });
      }
    });
  };

  function setState(state, val) {
    if (state !== PENDING) {
      this.state = state;
      this.value = val;
      handlers.length && handlers.forEach((handler) => handler());
      handlers = [];
    }
  }

  let resolve = (value) => {
    setState.call(this, FULFILLED, value);
  };
  let reject = (reason) => {
    setState.call(this, REJECTED, reason);
  };

  try {
    executor.call(this, resolve, reject);
  } catch (error) {
    reject(error);
  }

  return this;
}

let p1 = new myPromise((resolve, reject) => {
  // setTimeout(() => {
  reject('err');
  // }, 1000);
});

let p2 = p1
  .then(
    (res) => {
      console.log('success1==>', res);
      return 'success1';
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
  .then(
    (res) => {
      console.log('success111==>', res);
    },
    (err) => {
      console.log('err111==>', err);
    }
  );

console.log('阻塞了吗');
