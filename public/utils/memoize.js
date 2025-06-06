export function memoize(func, ttlMinutes = 5, maxSize = 1000) {
  const cache = new Map();
  
  setInterval(() => {
    for (const [key, item] of cache.entries()) {
      if (Date.now() > item.expiry) cache.delete(key);
    }
  }, ttlMinutes * 60 * 1000);

  return async function(...args) {
    if (cache.size > maxSize) cache.clear();

    const key = JSON.stringify(args)
    const now = Date.now();
    const item = cache.get(key);
    
    if (item) { // Update expiry, if item is used
      item.expiry = now + (ttlMinutes/2 * 60 * 1000);
      return item.value;
    }

    const result = await func.apply(this, args);
    cache.set(key, { 
      value: result,
      expiry: now + (ttlMinutes * 60 * 1000)
    });
    
    return result;
  }
}
