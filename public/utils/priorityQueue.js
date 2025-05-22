export class BiDirectionalPriorityQueue {
  constructor() {
    this.items = [];
  }

  enqueue(item) {
    this.items.push(item);
  }

  dequeue() {
    if (this.isEmpty()) return null;
    return this.items.splice(0, 1)[0];
  }


  isEmpty() {
    return this.items.length === 0;
  }

  clear() {
    return this.items = [];
  }

}