'use strict';

class TaskQueue {
  constructor(maxQueueSize = 1000, timeout = 20) {
    this.queue = [];
    this.maxQueueSize = maxQueueSize;
    this.timeout = timeout * 1000;
  }

  put(task) {
    // Add a task to queue
    if (this.queue.length > this.maxQueueSize) {
      throw new Error('Queue is full');
    }

    return new Promise((resolve, reject) => {
      const createdAt = Date.now();
      this.queue.push({ task, resolve, reject, createdAt });
    });
  }

  async process() {
    while (true) {
      if (this.queue.length > 0) {
        const { task, resolve, reject, createdAt } = this.queue.pop();
        if (Date.now() - createdAt > this.timeout) {
          throw new Error('Task timed out');
        }

        try {
          const result = await task();
          resolve(result);
        } catch (err) {
          reject(err);
        }
      }
      await new Promise((resolve) => setTimeout(resolve, 20));
    }
  }
}

module.exports = TaskQueue;
