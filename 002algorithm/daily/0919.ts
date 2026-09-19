async function runTasks(
  tasks: Array<() => Promise<any>>, 
  limit: number
): Promise<any[]>{
  const results: any[] = [];
  let index = 0;
  
  async function worker() {
    while (index < tasks.length) {
      const currentIndex = index++;
      results[currentIndex] = await tasks[currentIndex]();
    }
  }

  const workers: Promise<void>[] = [];

  for (let i = 0; i < Math.min(tasks.length, limit); i++) {
    workers.push(worker());
  }

  await Promise.all(workers);

  return results;
}

const request = (time: number) => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      console.log(`任务 ${time} 完成`);
      resolve(time);
    }, time);
  })
}

const tasks = [
  () => request(1000),
  () => request(500),
  () => request(2000),
  () => request(700)
]

runTasks(tasks, 2).then((result) => {
  console.log(result);
})
