let EE = require('events').EventEmitter;

class myEE {
  #events = [];

  on(name, fn) {
    this.#events.push({ name, fn });
  }

  emit(name, ...args) {
    this.#events.forEach((cb) => {
      if (cb.name === name) {
        cb.fn(...args);
        if (cb.once) {
          this.off(name, cb.fn);
        }
      }
    });
  }

  off(name, fn) {
    this.#events = this.#events.filter((cb) => {
      return cb.name !== name || cb.fn !== fn;
    });
  }

  once(name, fn) {
    this.#events.push({ name, fn, once: true });
  }
}

let ee = new myEE();

ee.once('a', (a, b) => {
  console.log(a, b);
});

ee.on('a', (a, b) => {
  console.log(a + b);
});

ee.emit('a', 1, 2);
ee.emit('a', 2, 2);
