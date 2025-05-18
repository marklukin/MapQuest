'use strict';

const EventEmitter = require('node:events');

class TaskQueue extends EventEmitter {
  constructor(maxQueueSize = 1000, timeout = 20) {
    super();
    this.queue = [];
    this.maxQueueSize = maxQueueSize;
    this.isProcessing = false;
    this.timeout = timeout * 1000;
  }

  async put(task) {
    // Add a task to queue
    if (this.queue.length > this.maxQueueSize) {
      throw new Error('Queue is full');
    }

    return new Promise((resolve, reject) => {
      const createdAt = Date.now();
      this.queue.push({ task, resolve, reject, createdAt });
      this.emit('newTask');
    });
  }

  async process() {
    this.isProcessing = true;

    while (this.queue.length > 0) {
      const { task, resolve, reject, createdAt } = this.queue.shift();
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

    this.isProcessing = false;
  }

  start() {
    this.on('newTask', () => {
      if (!this.isProcessing) {
        this.process();
      }
    });
  }
}

module.exports = TaskQueue;
