export function memoize(func, maxSize = 10) {
  const cache = new Map();
  const order = [];
  
  const increasePriority = (key) => {
    const index = order.indexOf(key);
    
    if (index > -1) {
      order.splice(index, 1);
    }
    
    order.push(key);
  };
  
  return async function(...args) {
    const key = JSON.stringify(args);
    
    if (cache.has(key)) {
      const value = cache.get(key);
      increasePriority(key);
      return value;
    }
    
    if (cache.size >= maxSize) {
      const leastUsedKey = order.shift();
      cache.delete(leastUsedKey);
    }

    const result = await func.apply(this, args);
    cache.set(key, result);
    order.push(key);
    
    return result;
  };
}