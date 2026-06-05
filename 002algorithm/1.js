var LRUCache = function(capacity) {
    this.capacity = capacity;
    this.map = new Map();
};

LRUCache.prototype.get = function(key) {
    if (!this.map.has(key)) return -1;
    const value = this.map.get(key);
    this.map.delete(key);
    this.map.set(key, value);
    return value;
};

LRUCache.prototype.put = function(key, value) {
    if (this.map.has(key)) {
        this.map.delete(key);
    }
    if (this.map.size >= this.capacity) {
        this.map.delete(this.map.keys().next().value);
    }
    this.map.set(key, value);
};