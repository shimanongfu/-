// 链表节点
class Node {
  constructor(value) {
    this.value = value;
    this.next = null;
  }
}

// 链表
class LinkedList {
  constructor() {
    this.head = null;
    this.tail = null;
  }

  // 添加节点
  addNode(value) {
    let node = new Node(value);
    if (this.head === null) {
      this.head = node;
      this.tail = node;
    } else {
      this.tail.next = node;
      this.tail = node;
    }
  }

  // 删除节点
  removeNode(value) {
    if (this.head === null) {
      return;
    }
    if (this.head.value === value) {
      this.head = this.head.next;
      return;
    }
    let prev = this.head;
    let current = this.head.next;
    while (current !== null) {
      if (current.value === value) {
        prev.next = current.next;
        if (current === this.tail) {
          this.tail = prev;
        }
        return;
      }
      prev = current;
      current = current.next;
    }
  }
}
