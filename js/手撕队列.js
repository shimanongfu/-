class Queue {
  constructor() {
    this.queue = [];
  }

  push(item) {
    this.queue.push(item);
  }

  shift() {
    return this.queue.shift();
  }

  isEmpty() {
    return this.queue.length === 0;
  }
}
