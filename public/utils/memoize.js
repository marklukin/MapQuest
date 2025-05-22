export function memoize(func, ttlMinutes = 60) {
  const cache = new Map();

  return async function(...args) {
    const key = JSON.stringify(args);
    const now = Date.now();
    const item = cache.get(key);

    if (item && now < item.expiry) return item.value;

    if (item) cache.delete(key);

    const result = await func.apply(this, args);
    cache.set(key, { 
      value: result,
      expiry: now + (ttlMinutes * 60 * 1000)
    });
    return result;
  }
}