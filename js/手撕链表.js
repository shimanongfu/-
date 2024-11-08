class linkedList {
  constructor() {
    this.head = null;
    this.tail = null;
    this.next = null;
  }

  addNode(value) {
    let node = new Object(value);
    if (this.head === null) {
      this.head = node;
      this.tail = node;
    } else {
      this.tail.next = node;
      this.tail = node;
    }
  }
}
