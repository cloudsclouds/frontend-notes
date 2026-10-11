class EventBus {
    constructor() {
        this.events = {};
    }

    on(eventName, callback) {
        if (!this.events[eventName]) {
            this.events[eventName] = [];
        }
        this.events[eventName].push(callback);
    }

    emit(eventName, ...args) {
        const subscribers = this.events[eventName];
        if (subscribers) {
            subscribers.forEach((item) => item(...args));
        }
    }

    off(eventName, callback) {
        const subscribers = this.events[eventName];
        if (subscribers) {
            this.events[eventName] = this.events[eventName].filter((item) => item !== callback);
        }
    }

    once(eventName, callback) {
        const fn = (...args) => {
            this.off(eventName, fn);
            callback(...args); 
        }

        this.on(eventName, fn);
    }
}

const bus = new EventBus();
const fn = (num) => {
    console.log(num);
}

bus.on('callback', fn);
bus.emit('callback', 1);
bus.emit('callback', 2);
bus.off('callback', fn);

bus.once('callback1', fn);
bus.emit('callback1', 3);
bus.emit('callback1', 4); // 不输出