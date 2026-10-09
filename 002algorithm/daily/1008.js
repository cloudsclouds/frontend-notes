class Pool {
    constructor(limit) { 
        this.limit = limit;
        this.current = 0;
        this.queue = [];
    }

    add (task) {
        if (this.current < this.limit) {
            this.current++;
            task().then(() => {
                this.current--;
                if (this.queue.length > 0) {
                    const nextTask = this.queue.shift();
                    this.add(nextTask);
                }
            });
        } else {
            this.queue.push(task);
        }
    }   
}

const pool = new Pool(2);   
const tasks = [
    () => new Promise(resolve => setTimeout(() => { console.log('Task 1 done'); resolve(); }, 1000)),
    () => new Promise(resolve => setTimeout(() => { console.log('Task 2 done'); resolve(); }, 500)),
    () => new Promise(resolve => setTimeout(() => { console.log('Task 3 done'); resolve(); }, 2000)),
    () => new Promise(resolve => setTimeout(() => { console.log('Task 4 done'); resolve(); }, 1500)),
];

tasks.forEach(task => pool.add(task));