// 被观察者
class Subject {
  constructor() {
    this.observers = [];
  }
  add(observer) {
    this.observers.push(observer);
  }
  notify() {
    this.observers.forEach((observer) => {
      observer.update();
    });
  }
}

// 观察者
class Observer {
  constructor(name) {
    this.name = name;
  }
  update() {
    console.log(`${this.name}收到通知`);
  }
}

let subject = new Subject();
let observer1 = new Observer('观察者1');
let observer2 = new Observer('观察者2');

subject.add(observer1);
subject.add(observer2);

subject.notify();
