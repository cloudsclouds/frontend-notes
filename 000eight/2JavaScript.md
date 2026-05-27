# JavaScript
## 1. JavaScript 执行机制
### 1.1. 事件循环模型（Event Loop）
JavaScript 是单线程语言，这意味着它只有一个主线程（执行栈）来处理所有任务，如何让js在单线程环境下处理多个任务不会阻塞线程，这就用事件循环模型来解决，同步代码由js引擎直接执行，异步代码交给宿主环境（浏览器/node.js）处理。
#### 1.1.0. JavaScript 为什么是单线程？如何实现异步编程？
1. 避免 DOM 操作冲突
如果多线程同时操作 DOM，会导致不可预知的结果
例如：线程 A 删除节点，线程 B 修改该节点
2. 简化编程模型
单线程无需考虑锁、死锁、竞态条件等并发问题
代码执行顺序确定，易于理解和调试
3. 历史原因
JavaScript 最初设计用于浏览器表单验证等简单操作
单线程足以满足早期需求
如何实现异步编程？
// 1. 回调函数（Callback）- 最早的方式
function fetchData(callback) {
  setTimeout(() => {
    callback('data');
  }, 1000);
}

// 2. Promise - ES6
function fetchDataPromise() {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      resolve('data');
    }, 1000);
  });
}

fetchDataPromise()
  .then(data => console.log(data))
  .catch(err => console.error(err));

// 3. async/await - ES2017（Promise 的语法糖）
async function getData() {
  try {
    const data = await fetchDataPromise();
    console.log(data);
  } catch (err) {
    console.error(err);
  }
}

// 4. Generator + 自动执行器
function* gen() {
  const data = yield fetchDataPromise();
  console.log(data);
}

// 5. 事件监听/DOM 事件
button.addEventListener('click', () => {
  console.log('clicked');
});
#### 1.1.1. 执行栈与任务队列
- 执行栈（Call Stack）：用于存储同步任务的执行上下文，遵循LIFO（后进先出）原则，函数执行时会被推入栈顶。
function a() { b(); }
function b() { c(); }
function c() { console.log('c'); }
a();
// 执行栈流程：a入栈 → b入栈 → c入栈 → 执行c → c出栈 → b出栈 → a出栈
- 任务队列（Task Queue）：存储异步任务回调，分为宏任务队列和微任务队列，优先级不同
- 事件循环流程：
  - 执行同步代码，执行栈中的任务依次执行
  - 遇到异步任务，将回调放入对应任务队列
  - 同步代码执行完毕，检查微任务队列是否有微任务，如果有，依次执行所有微任务
  - 微任务队列清空后，检查宏任务队列，如果有则从宏任务队列中取出执行一个宏任务并执行
  - 执行完宏任务之后，浏览器会更新渲染/重新绘制页面，这包括布局计算、绘制等操作。
  - 完成上述步骤，重复步骤3-4继续处理微任务，...
实际应用：利用微任务高优先级，处理用户高频交互（如点击、输入），保证响应优先于渲染 / 异步请求；React 的 fiber 架构也借助事件循环拆分任务，避免主线程阻塞。
#### 1.1.2. 宏任务与微任务分类
暂时无法在飞书文档外展示此内容
#### 1.1.3. 浏览器与Node环境差异
- 浏览器环境：
  - 微任务队列优先级：Promise > MutationObserver > queueMicrotask
  - 典型案例：
console.log('同步代码');
setTimeout(() => console.log('宏任务1'), 0);
Promise.resolve().then(() => {
  console.log('微任务1');
  setTimeout(() => console.log('宏任务2'), 0);
});
Promise.resolve().then(() => console.log('微任务2'));
// 输出顺序：同步代码 → 微任务1 → 微任务2 → 宏任务1 → 宏任务2
- Node环境：
  - 事件循环阶段：timers → pending callbacks → idle, prepare → poll → check → close callbacks
  - process.nextTick优先级高于所有微任务
  - 典型案例：
setTimeout(() => console.log('timer'), 0);
setImmediate(() => console.log('immediate'));
// 在I/O回调中，setImmediate优先；在顶层代码中，顺序不确定
### 1.2. 闭包（Closure）深度解析
#### 1.2.1. 对作用域、作用域链的理解
作用域，是一个变量或函数的可访问范围，作用域控制着变量或函数的可见性和生命周期。
我们一般将作用域分为全局作用域、函数作用域、块级作用域。
1. 全局作用域：任何不在函数中或是大括号中声明的变量，都是在全局作用域下，全局作用域下声明的变量可以在程序的任意位置访问。
2. 函数作用域：通过 var 声明变量，如果一个变量是在函数内部声明的它就在一个函数作用域下面。这些变量只能在函数内部访问，不能在函数以外去访问。内层作用域可以访问外层，外层不能访问内层作用域。
3. ES6中的块级作用域：ES6引入了let和const关键字，在大括号中使用let和const声明的变量存在于块级作用域中。在大括号之外不能访问这些变量：
  - let、const声明的变量不会变量提升，也不能重复申明
  - 块级作用域主要用来解决由变量提升导致的变量覆盖问题
// 场景1：同一作用域内的覆盖
var a = 10;
if (true) {
  var a = 20; // 因为var是函数作用域，这里的a会覆盖外层的a
}
console.log(a); // 输出20（而不是预期的10）

// 场景2：循环中的覆盖（更隐蔽）
for (var i = 0; i < 3; i++) {
  setTimeout(() => {
    console.log(i); // 预期输出0、1、2，实际输出3、3、3
  }, 100);
}
// 原因：var声明的i是函数作用域（整个外部作用域共享一个i）
// 循环结束后i已经变成3，定时器回调读取的是同一个i

// 在这两个例子中，变量提升导致 var 声明的变量作用域过大（穿透了代码块），最终引发了非预期的覆盖。

// 解决1
let a = 10;
if (true) {
  let a = 20; // 块级作用域，与外层a完全独立
}
console.log(a); // 输出10（符合预期，没有被覆盖）

// 解决2
for (let i = 0; i < 3; i++) { // let声明的i是块级作用域
  setTimeout(() => {
    console.log(i); // 输出0、1、2（符合预期）
  }, 100);
}
// 原因：每次循环都会创建一个独立的块级作用域，每个i都是“新变量”
// 定时器回调读取的是各自块内的i，不会被后续循环覆盖
// 立即执行函数（IIFE）
for (var i = 0; i < 3; i++) {
  (function(i) {  // 👈 关键：形成作用域
    setTimeout(() => {
      console.log(i);
    }, 100);
  })(i); // 👈 把当前 i 传进去
}
词法作用域的核心：作用域在写代码时就定死了，变量查找只看 “定义时的嵌套关系”，不看 “执行时的调用位置”。
var a = 2;
function foo(){
    console.log(a) // 2
}
function bar(){
    var a = 3;
    foo();
}
bar()
作用域链： 当在JavaScript中使用一个变量的时候，首先Javascript引擎会尝试在当前作用域下去寻找该变量，如果没找到，再到它的上层作用域寻找，以此类推直到找到该变量或是已经到了全局作用域。这个查找的过程被称为作用域链。
#### 1.2.2. 闭包形成原理
闭包：函数与其词法环境的组合，即使函数在其词法环境之外执行，也能访问该环境中的变量。
- 闭包定义：当一个内部函数被定义在外部函数中，且内部函数引用了外部函数的变量，同时内部函数被传递到外部函数作用域之外执行时，就形成了闭包。此时内部函数依然能通过作用域链访问外部函数的变量，即使外部函数已经执行完毕。
- 形成条件：
  - 函数嵌套
  - 内部函数引用外部函数变量
  - 内部函数在外部函数作用域外被调用
function outer() {
  let a = 10; // 外部函数变量
  function inner() {
    console.log(a); // 引用外部变量（条件2）
  }
  return inner; // 内函数被带出（条件3）
}
const fn = outer(); // 函数嵌套（条件1）
fn(); // 输出10（在outer作用域外调用，闭包生效）
#### 1.2.3. 内存模型与生命周期
当执行上下文遇到闭包时，函数执行结束后本该销毁的变量环境不会被回收，因为内部函数inner()仍然引用这个词法环境。
JS 引擎会把外层函数的变量环境保存在内部函数的 [[Environment]] 中，从而形成闭包。
因此即使外层执行上下文已经出栈，这些变量依然可以被访问，这本质上是作用域链的延长。
同时，这也意味着如果使用不当可能导致内存无法释放，从而产生内存泄漏问题。
#### 1.2.4. 经典应用场景
闭包的价值在于创建私有变量和延长变量的生命周期，以下场景充分体现了这一点：
1. 数据私有化：
通过闭包将变量隐藏在外部函数中，只暴露有限接口，避免全局污染和意外修改。
如用户提供的计数器示例，count变量无法被外部直接修改（counter.count会返回undefined），只能通过increment/decrement等方法操作，保证了数据安全性。
function createCounter() {
  let count = 0; // 私有变量
  return {
    increment: () => ++count,
    decrement: () => --count,
    getCount: () => count
  };
}
const counter = createCounter();
console.log(counter.getCount()); // 0
counter.increment();
console.log(counter.getCount()); // 1
2. 函数工厂：
根据不同参数生成具有特定行为的函数，避免重复代码。
例如createAdder(5)生成的add5函数，会 "记住" 参数5，每次调用时都用这个值参与计算，本质是闭包保留了value变量。
function createAdder(value) {
  return function(num) {
    return value + num;
  };
}
const add5 = createAdder(5);
console.log(add5(3)); // 8
3. 防抖节流实现：
这两个高频面试题的实现核心依赖闭包保存状态（如计时器 ID）。
防抖中，timer变量被闭包保留，每次触发事件时都能清除上一次的计时器，确保只有最后一次触发delay毫秒后，才会执行目标函数； （如搜索输入、表单验证）
节流中，闭包会保留 "是否在冷却中" 的状态，控制函数执行频率。首次触发会立即执行，之后在间隔时间内不再执行，直到时间到。
// 防抖
function debounce(fn, delay) {
  let timer = null; // 闭包保存定时器ID
  return function(...args) {
    clearTimeout(timer);  // 清除之前的定时器
    timer = setTimeout(() => { // 重新设置定时器
      fn.apply(this, args);  // 绑定正确的this和参数,this 由 调用防抖函数时的方式 决定
    }, delay);
  };
}

// 节流函数实现（时间戳+定时器结合版）
function throttle(fn, interval) {
  let lastTime = 0; // 上次执行时间

  return function(...args) {
    const now = Date.now();
    if (now - lastTime >= interval) {
      fn.apply(this, args);
      lastTime = now;
    }
  };
}
#### 1.2.5. 内存泄漏风险与优化
内存泄漏（Memory leak）是在计算机科学中，由于疏忽或错误造成程序未能释放已经不再使用的内存。
闭包本身不会导致内存泄漏，但不当使用会让不需要的变量长期驻留内存，造成性能问题。
- 常见泄漏场景：
  - 意外的全局变量
var a = 1;  // 挂在 window 上
  - 闭包过度使用：若闭包引用了大对象（如 DOM 元素、大型数组）且长期不释放，会导致这些对象无法被垃圾回收；
  - 未清除定时器：setInterval(...)
  - DOM事件未移除：组件卸载时，若闭包创建的事件回调未移除，会导致组件实例和 DOM 元素被长期引用。
- 优化方案：
  - 不滥用全局变量
  - 及时解除引用：不再需要闭包时，将其赋值为null，如 timer = null;
  - 使用 WeakMap/WeakSet：存储临时数据时，这两种结构的键是弱引用，不会阻止垃圾回收（适合存储非必需的缓存数据）；
  - 组件生命周期清理：在 React/Vue 等框架中，组件卸载时（如componentWillUnmount、onUnmounted），手动移除事件监听（removeEventListener）。
### 1.3. this指向
#### 1.3.1. 解释 JavaScript 中 this 的指向规则
this 的指向取决于函数的调用方式：
- 默认绑定：独立函数调用，this 指向全局对象（严格模式下为 undefined）
function foo() {
  console.log(this); // 浏览器中为 window
}
foo();
- 隐式绑定：作为对象方法调用，this 指向调用对象
const obj = {
  name: 'Alice',
  sayName: function() {
    console.log(this.name);
  }
};
obj.sayName(); // "Alice"
- 显式绑定：通过 call、apply、bind 指定 this
function greet() {
  console.log(
    Hello, ${this.name}
  );
}
const person = { name: 'Bob' };
greet.call(person); // "Hello, Bob"
- new 绑定：构造函数调用，this 指向新创建的对象
function Person(name) {
  this.name = name;
}
const p = new Person('Charlie');
console.log(p.name); // "Charlie"
- 箭头函数：没有自己的 this，继承外层作用域的 this
const obj = {
  name: 'Dave',
  sayName: () => {
    console.log(this.name); // 取决于外层作用域
  }
};
obj.sayName(); // 可能不是 "Dave"，在浏览器中，全局作用域的 this 是 window 对象
#### 1.3.2. 如何指定this的值，bind/apply/call区别
1. 调用时指定
  1. call方法 func.call(thisArg, 参数1, 参数2 ...)，强制func函数里的this指向thisArg对象：第一个参数是 this 要指向的对象（thisArg）；后续参数是函数的参数列表，需逐个传入；
  2. apply方法 func.call(thisArg, [参数1, 参数2 ...])，强制func函数里的this指向thisArg对象：第一个参数同样是 this 要指向的对象（thisArg）；第二个参数是数组或类数组对象，包含函数的所有参数；
2. 创建时指定
  1. bind绑定 const bindFunc = func.bind(thisArg, 绑定参数1, 绑定参数2 ...)，返回新函数（不立即执行）
对箭头函数用  apply / call / bind ，改不了它的this，但能正常传参数。
#### 1.3.3. 其他内置函数的绑定
setTimeout(function(){
  console.log(this);        //window
},1000)

var names = ["abc", "cba", "mba"];
var obj = {name: "why"};
names.forEach(function(item){
  console.log(this);        //三次obj对象
}, obj)

var box = document.querySelector(".box");
box.onclick = function(){
  console.log(this === box);
}
#### 1.3.4. 箭头函数 arrow function
箭头函数是 ES6 引入的一种简写函数形式，适合用于回调函数和需要固定 this 的场景，但不适合用于对象方法或需要动态 this 的场景
- ①箭头函数没有自己的this，继承外层作用域的this；
- ②不能通过 call/apply/bind 修改this指向；
- ③没有arguments对象，可用 rest 参数替代；
- ④不能作为构造函数，不能用new调用；
- ⑤没有原型对象prototype。
#### 1.3.5 this 优先级从高到低
// 1. new 绑定（最高优先级）
function Person(name) {
  this.name = name;  // this 指向新创建的实例
}
const person = new Person('Tom');

// 2. 显式绑定（call/apply/bind）
function greet() {
  console.log(this.name);
}
greet.call({ name: 'Tom' });  // this 指向传入的对象

// 3. 隐式绑定（对象方法调用）
const user = {
  name: 'Tom',
  greet() {
    console.log(this.name);  // this 指向 user
  }
};
user.greet();

// 4. 默认绑定（直接调用）
function sayHi() {
  console.log(this);  // 严格模式：undefined；非严格模式：window/global
}
sayHi();

// 5. 箭头函数（没有自己的 this，继承外层 this）
const obj = {
  name: 'Tom',
  regularFunc: function() {
    console.log(this.name);  // Tom
  },
  arrowFunc: () => {
    console.log(this.name);  // undefined（继承全局 this）
  }
};
优先级验证
// new 绑定 > 显式绑定
function Foo() {
  this.name = 'Foo';
}

const obj = { name: 'obj' };
const foo = new Foo.call(obj);  // 报错，不能同时使用

// 显式绑定 > 隐式绑定
function greet() {
  console.log(this.name);
}

const obj1 = { name: 'obj1', greet };
const obj2 = { name: 'obj2' };

obj1.greet.call(obj2);  // obj2（显式绑定胜）
常见陷阱
// 1. 方法作为回调函数
const user = {
  name: 'Tom',
  greet() {
    console.log(this.name);
  }
};

setTimeout(user.greet, 100);  // undefined（this 丢失）

// 解决
setTimeout(() => user.greet(), 100);  // Tom
setTimeout(user.greet.bind(user), 100);  // Tom

// 2. 嵌套函数
const obj = {
  name: 'Tom',
  outer() {
    console.log(this.name);  // Tom

    function inner() {
      console.log(this.name);  // undefined（默认绑定）
    }
    inner();

    // 解决
    const arrow = () => {
      console.log(this.name);  // Tom（继承 outer 的 this）
    };
    arrow();
  }
};
## 2. 异步编程体系
### 2.1. Promise深度解析
Promise对象是异步编程的一种解决方案，表示一个异步操作的最终完成或失败。Promise 构造函数接收一个回调函数（我们称之为executor），该函数包含 resolve和 reject 两个参数，分别用于控制异步操作的成功与失败状态。
一个Promise的实例有三个状态：Pending（初始状态）、Fulfilled（成功状态）、Rejected（失败状态）。实例的状态只能由pending 转变为 fulfilled 或者 rejected，并且一旦从进行状态变成为其他状态就永远不能更改状态了，其过程是不可逆的。其中，resolve 的作用是将状态从 Pending 转为 Fulfilled，并传递异步操作的成功结果；reject 则将状态从 Pending 转为 Rejected，传递失败信息。
状态的改变是通过传入的 resolve() 和 reject() 函数来实现的，当我们调用resolve回调函数时，会执行Promise对象的then方法传入的回调函数； 当我们调用reject回调函数时，会执行Promise对象的catch方法传入的回调函数。
- 情况一：如果resolve传入一个普通的值或者对象，那么这个值会作为then回调的参数；
- 情况二：如果resolve中传入的是另外一个Promise，那么这个新Promise会决定原Promise的状态：
- 情况三：如果resolve中传入的是一个对象，并且这个对象有实现then方法，那么会执行该then方法，并且根据then方法的结 果来决定Promise的状态：
静态方法中，all () 可并行处理多个 Promise，只有全部成功才返回结果数组，任一失败则整体失败；race () 同样处理并行任务，但以第一个完成的 Promise 结果为准；allSettled () 则会等待所有 Promise 完成（无论成功或失败），返回包含每个任务详细结果的数组。
不过 Promise 也存在局限：一旦创建即会执行，无法中途取消；若未设置回调，内部抛出的错误不会暴露到外部；处于 Pending 状态时，无法获知异步操作的当前进展阶段。
#### 2.1.1. 状态机模型
- 三种状态：
  - Pending：初始状态，可转换为Fulfilled或Rejected
  - Fulfilled：操作成功，不可再变，拥有value
  - Rejected：操作失败，不可再变，拥有reason
- 状态转换：
Pending → Fulfilled（通过resolve）
Pending → Rejected（通过reject）
#### 2.1.2. 方法：
1. Promise.resolve() - 返回一个 resolved 状态的 Promise
2. Promise.reject() - 返回一个 rejected 状态的 Promise
3. Promise.all() - 所有 Promise 都成功时返回结果数组
4. Promise.race() - 第一个完成的 Promise 的结果
5. Promise.allSettled() - 所有 Promise 完成后返回结果
6. Promise.prototype.then() - 添加成功回调
7. Promise.prototype.catch() - 添加失败回调
8. Promise.prototype.finally() - 无论成功失败都执行
const promise1 = Promise.resolve(3);
const promise2 = new Promise((resolve, reject)=>{
  setTimeout(resolve, 100, 'foo');
})
const promise3 = Promise.reject('error');
Promise.all([promise1, promise2])
  .then(values => console.log(values)) // [3, "foo"]
  .catch(error => console.error(error));
Promise.race([promise1, promise2])
  .then(value => console.log(value)); // 3 (更快完成)

// 实现 Promise.all
Promise.myAll = function(promises) {
  return new Promise((resolve, reject) => {
    const results = [];
    let count = 0;

    promises.forEach((promise, index) => {
      Promise.resolve(promise)
        .then(value => {
          results[index] = value;
          count++;
          if (count === promises.length) {
            resolve(results);
          }
        })
        .catch(reject);
    });
  });
};
#### 2.1.3. 链式调用原理
- 核心机制：每个then/catch/finally返回新的Promise实例
- 实现逻辑：
class MyPromise {
  constructor(executor) {
    this.state = 'pending'; // 初始状态
    this.value = undefined;         // Promise的值
    this.reason = undefined;  // 拒绝的原因
    this.onFulfilledCallbacks = [];
    this.onRejectedCallbacks = [];

    const resolve = (value) => {
      if (this.state === 'pending') {
        this.state = 'fulfilled';
        this.value = value;
        this.onFulfilledCallbacks.forEach(cb => cb(value));
      }
    };

    const reject = (reason) => {
      if (this.state === 'pending') {
        this.state = 'rejected';
        this.reason = reason;
        this.onRejectedCallbacks.forEach(cb => cb(reason));
      }
    };

    try {
      executor(resolve, reject);
    } catch (e) {
      reject(e);
    }
  }

  then(onFulfilled, onRejected) {
    return new MyPromise((resolve, reject) => {
      if (this.state === 'fulfilled') {
        setTimeout(() => {
          try {
            const result = onFulfilled(this.value);
            resolve(result instanceof MyPromise ? result : MyPromise.resolve(result));
          } catch (e) {
            reject(e);
          }
        }, 0);
      }

      if (this.state === 'rejected') {
        setTimeout(() => {
          try {
            const result = onRejected(this.reason);
            resolve(result instanceof MyPromise ? result : MyPromise.resolve(result));
          } catch (e) {
            reject(e);
          }
        }, 0);
      }

      if (this.state === 'pending') {
        this.onFulfilledCallbacks.push(() => {
          setTimeout(() => {
            try {
              const result = onFulfilled(this.value);
              resolve(result instanceof MyPromise ? result : MyPromise.resolve(result));
            } catch (e) {
              reject(e);
            }
          }, 0);
        });

        this.onRejectedCallbacks.push(() => {
          setTimeout(() => {
            try {
              const result = onRejected(this.reason);
              resolve(result instanceof MyPromise ? result : MyPromise.resolve(result));
            } catch (e) {
              reject(e);
            }
          }, 0);
        });
      }
    });
  }

  static resolve(value) {
    return new MyPromise(resolve => resolve(value));
  }
}
Promise.resolve = function(value){
  return new Promise((resolve, reject)=>{
    if (value instanceof Promise){
      value.then(v=>{
        resolve(v);
      }, r=>{
        reject(r);
      })
    }else{
      resolve(value);
    }
  });
}

Promise.reject = function(value){
  return new Promise((resolve, reject)=>{
    reject(value)
  });
}

Promise.all = function(promises){
  return new Promise((resolve, reject)=>{
    let count = 0;
    let arr = [];
    for (let i = 0; i < promises.length; i++){
      promises[i].then(v=>{
        count++;
        arr[i] = v;
      }, r=>{
        reject(r)
      })
    }
    if (count === promises.length){
      resolve(arr);
    }
  });
}

Promise.race = function(promises){
  return new Promise((resolve, reject)=>{
    for (let i = 0; i < promises.length; i++){
      promises[i].then(v=>{
        resolve(v);
      },r=>{
        reject(r);
      })
    }
  })
}
#### 2.1.3 错误处理机制
- 错误冒泡：链式调用中，错误会一直向后传递直到被捕获
- 捕获方式：
  - then的第二个参数
  - catch方法（推荐）
  - try/catch（仅async/await）
- 注意事项：
// 错误不会被捕获的情况
Promise.resolve().then(() => {
  throw new Error('error');
}, () => {
  // 不会执行，因为第一个回调抛出错误
});
// 正确捕获方式
Promise.resolve().then(() => {
  throw new Error('error');
}).catch(err => {
  console.log(err); // 捕获到错误
});
### 2.2 async/await 语法糖
ES7提出的关于异步的终极解决方案
async/await 是Generator的语法糖
- 内置执行器：Generator函数的执行必须靠执行器，不能一次执行完成
- 可读性更好：async和 await，比起使用 *号和 yield，语义清晰明了
async/await其实是Generator 的语法糖，它能实现的效果都能用then链来实现，它是为优化then链而开发出来的。
通过async关键字声明一个异步函数， await用于等待一个异步方法执行完成，并且会阻塞执行。 await 返回 Promise 的 resolve 值，rejected 怎么继续执行？try catch
 async 函数返回的是一个 Promise 对象，如果在函数中 return 一个变量，async 会把这个直接量通过 Promise.resolve() 封装成 Promise 对象。如果没有返回值，返回 Promise.resolve(undefined)
async/await对比Promise的优势：
- 代码可读性高，Promise虽然摆脱了回调地狱，但自身的链式调用会影响可读性。
- 对错误处理友好，可以通过try/catch捕获，Promise的错误捕获⾮常冗余
// 模拟异步请求：获取用户信息
function fetchUser(userId) {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({ id: userId, name: "张三", age: 25 });
    }, 1000);
  });
}

// 模拟异步请求：根据用户ID获取订单
function fetchOrders(userId) {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve([
        { orderId: "1001", goods: "手机" },
        { orderId: "1002", goods: "电脑" }
      ]);
    }, 1500);
  });
}

// 模拟异步请求：根据订单ID获取物流信息
function fetchLogistics(orderId) {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({ orderId, status: "已发货", address: "北京市" });
    }, 1000);
  });
}

// 使用 async/await 处理依赖的异步操作
async function getUserLogisticsInfo(userId) {
  try {
    // 步骤1：获取用户信息
    const user = await fetchUser(userId);
    console.log("用户信息：", user);

    // 步骤2：用用户ID获取订单（依赖步骤1的结果）
    const orders = await fetchOrders(user.id);
    console.log("用户订单：", orders);

    // 步骤3：用第一个订单的ID获取物流（依赖步骤2的结果）
    const logistics = await fetchLogistics(orders[0].orderId);
    console.log("物流信息：", logistics);

    return { user, orders, logistics };
  } catch (error) {
    // 统一捕获所有异步操作的错误
    console.error("获取数据失败：", error);
    return null;
  }
}

// 执行异步函数
getUserLogisticsInfo(123);
如果不使用async/await的话，Promise需要通过链式调用执行then之后的代码
Promise搭配async/await的使用才是正解！
async/await基于Promise。async把promise包装了一下，async函数更简洁，不需要像promise一样需要写then，不需要写匿名函数处理promise的resolve值。
async是Generator函数的语法糖，async函数返回值是promise对象，比generator函数返回值 iterator对象更方便，可使用 await 代替then 指定下一步操作(await==promise.then)
#### 2.2.1 与Generator的关系
Generator 函数是 ES6 提供的一种异步编程解决方案，语法行为与传统函数完全不同。
执行 Generator 函数会返回一个遍历器对象，可以依次遍历 Generator 函数内部的每一个状态
形式上，Generator函数是一个普通函数，但是有两个特征：
- function关键字与函数名之间有一个星号
- 函数体内部使用yield表达式，定义不同的内部状态
通过next方法才会遍历到下一个内部状态，其运行逻辑如下：
- 遇到yield表达式，就暂停执行后面的操作，并将紧跟在yield后面的那个表达式的值，作为返回的对象的value属性值。
- 下一次调用next方法时，再继续往下执行，直到遇到下一个yield表达式
- 如果没有再遇到新的yield表达式，就一直运行到函数结束，直到return语句为止，并将return语句后面的表达式的值，作为返回的对象的value属性值。
- 如果该函数没有return语句，则返回的对象的value属性值为undefined
hw.next()
function* helloWorldGenerator() {
  yield 'hello';
  yield 'world';
  return 'ending';
}
- Generator函数：返回迭代器，通过yield暂停执行
- async函数：Generator的语法糖，自带执行器
- 对比：
// Generator版本
function* fetchData() {
  const data1 = yield fetch('/api/data1');
  const data2 = yield fetch('/api/data2');
  return [data1, data2];
}
// async/await版本
async function fetchData() {
  const data1 = await fetch('/api/data1');
  const data2 = await fetch('/api/data2');
  return [data1, data2];
}
#### 2.2.2 并发控制高级模式
1. Promise.all优化：
// 带超时的Promise.all
function promiseAllWithTimeout(promises, timeout) {
  return Promise.all(promises.map(p =>
    Promise.race([
      p,
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Timeout')), timeout)
      )
    ])
  ));
}
1. 分批并发执行：
// 限制最大并发数
async function batchRequest(urls, limit) {
  const results = [];
  const executing = [];

  for (const url of urls) {
    const promise = fetch(url).then(res => res.json());
    results.push(promise);

    if (urls.length >= limit) {
      const e = promise.then(() => executing.splice(executing.indexOf(e), 1));
      executing.push(e);
      if (executing.length >= limit) {
        await Promise.race(executing);
      }
    }
  }

  return Promise.all(results);
}
## 3. 原型与继承体系
### 3.1. 原型链基础
原型：每个函数都有一个 prototype 属性，该属性指向的就是显式原型对象，这个对象包含了可以由该构造函数的所有实例共享的属性和方法，每个实例对象有一个proto 属性，该属性指向的就是隐式原型对象。
原型链：原型链的本质是实例、构造函数、原型对象三者的关联关系，以及基于这种关系的属性查找规则。查找一个属性先在自身查找，如果找不到，就沿着proto属性在原型对象上进行查找，如果还找不到，就沿着原型对象的proto属性进行查找，直到找到Object的原型对象，如果还没有找到就会返回undefined，沿着proto查找属性(方法)的这条链就是原型链。
原型链终点是Object.prototype.proto
使用hasOwnProperty()方法来判断属性是否属于原型链的属性：
每个实例对象都有私有属性（__proto__）指向它构造函数的原型对象。
每个构造函数都有 prototype 原型对象
prototype原型对象的constructor指向构造函数本身
有默认constructor属性，记录实例由哪个构造函数创建。
[图片]
#### 3.1.1. 原型对象与构造函数
- 构造函数：用于创建对象的函数，通过new关键字调用
- 原型对象（prototype）：构造函数的属性（Constructor.prototype），存储实例共享的方法和属性
- 实例：通过new 构造函数()创建的对象，其内部有一个隐式原型（[[Prototype]]，可通过Object.getPrototypeOf(obj)获取），指向构造函数的prototype属性。
实例与原型关系：
function Person(name) {
  this.name = name; // 实例私有属性（每个实例单独拥有）
}

// 实例共享方法（所有Person实例共用这一个函数）
Person.prototype.sayHello = function() {
  console.log(`Hello, ${this.name}`);
};
const person = new Person('Alice');
person.sayHello(); // 通过原型链访问方法
// 关系链：person → Person.prototype → Object.prototype → null

console.log(person.__proto__ === Person.prototype); // true
console.log(Person.prototype.__proto__ === Object.prototype); // true
console.log(Object.prototype.__proto__); // null
#### 3.1.2. 原型链查找规则
当访问一个对象的属性 / 方法时，JavaScript 会遵循严格的查找顺序，直到找到目标或到达链末端：
1. 优先查找自身属性：检查对象本身是否直接定义了该属性
2. 沿原型链向上查找：若自身没有，通过.__Prototype__找到父原型对象，重复查找。p.__proto__ === Person.prototype、Person.prototype.__proto__ === Object.prototype
3. 终止条件：找到属性则返回其值；若查到Object.prototype仍没有，继续查null（Object.prototype的[[Prototype]]是null），最终返回undefined。
4. 示例：
const obj = { a: 1 };
Object.prototype.b = 2;
console.log(obj.a); // 1（自身属性）
console.log(obj.b); // 2（原型链查找）
console.log(obj.c); // undefined（未找到）
#### 3.1.3. 关键方法解析
- Object.create(proto)：创建以proto为原型的新对象
- Object.getPrototypeOf(obj)：获取对象的[[Prototype]]
- Object.setPrototypeOf(obj, proto)：设置对象的[[Prototype]]
- obj.hasOwnProperty(prop)：检查属性是否为对象自身属性
### 3.2. Object / Function
Object 是 Function 构造出来的，Object 是函数
Object instanceof Function // true
Object.__proto__ === Function.prototype  // true
Function 是自己构造的，它的构造函数是它自己
Function instanceof Function // true（JS 最魔幻的地方）
Function.__proto__ === Function.prototype

Object
│
└─ __proto__ ──► Function.prototype

Function
│
├─ __proto__ ──► Function.prototype
                 │
                 └─ __proto__ ──► Object.prototype
                                      │
                                      └─ __proto__ → null

foo
│
└─ __proto__ ──► Function.prototype
### 3.3. 继承实现方式详解
继承的核心需求是子类实例能复用父类的属性和方法，同时避免重复代码和异常共享。JavaScript 的继承实现经历了多个阶段，最终 “寄生组合继承” 成为 ES5 的最优方案，ES6 class则是其语法糖封装。

---
JavaScript 的继承方式经历了多个阶段：
- 原型链继承：让子类原型（Child.prototype）指向父类实例（new Parent()），可以访问父类属性和方法，但引用类型会被所有实例共享。
- 构造函数继承：在子类构造函数中调用父类构造函数（通过修改父类构造函数this实现的继承），避免了引用共享，但是只能继承父类的实例属性和方法，不能继承原型属性或者方法。
- 组合继承：两者结合，既能继承方法又能独立属性，但父类构造函数会执行两次。
- 寄生组合继承：优化版，只调用一次父类构造函数，避免浪费，解决了前面的问题，被认为是 ES5 最优解。
- ES6 class extends：就是寄生组合继承的语法糖，写法更简洁，支持 super 和静态方法。
总结：ES5 最佳实践是寄生组合继承，ES6 用 class extends 就行。

---
#### 3.2.1. 原型链继承：最基础但有明显缺陷
JavaScript中的原型继承是如何⼯作的？
JavaScript是基于原型的语⾔，意味着对象可以从另⼀个对象继承属性。每个对象都有⼀个原型对象，它从中继承⽅法和属性。
原型继承的核⼼是 prototype 属性。当你访问⼀个对象的属性或⽅法时，如果当前对象上不存在， 解释器就会查找对象的原型链，直到找到该属性或⽅法或到达原型链的末端。
例如，你可以为JavaScript的 Array 对象添加新的⽅法：
Array.prototype.myCustomFeature = function() {// implementation
};
所有的数组都将⾃动获得这个新⽅法，因为它们从 Array.prototype 继承。

---
- 实现：让子类的原型（Child.prototype）指向父类的一个实例（new Parent()），从而让子类实例通过原型链访问父类的属性和方法。
- 代码：
function Parent() {
  this.name = 'Parent'; // 父类实例属性（会被子类原型共享）
  this.colors = ['red', 'blue']; // 引用类型属性
}
Parent.prototype.getName = function() { // 父类共享方法（所有实例都能用）
  return this.name;
};

// 子类：需要继承父类
function Child() {}
// 核心操作：子类的原型指向父类的实例
Child.prototype = new Parent();
// 修复constructor指向（否则Child.prototype.constructor会指向Parent）
Child.prototype.constructor = Child;

// 问题：引用类型属性会被所有实例共享
const child1 = new Child();
const child2 = new Child();
child1.colors.push('green');
console.log(child2.colors); // ['red', 'blue', 'green']
为什么能实现继承？
当创建子类实例（比如const child1 = new Child()）时：
- 访问child1.name：会先找自身属性，找不到就去Child.prototype（也就是父类实例）里找，所以能拿到'Parent'。
- 调用child1.getName()：自身和Child.prototype都没有，就去Parent.prototype里找，所以能调用父类方法。
缺点：
父类构造函数中的引用类型（比如对象/数组），会被所有子类实例共享。其中一个子类实例进行修改，会导致所有其他子类实例的这个值都会改变。具体来说，因为Child.prototype指向的是同一个父类实例（new Parent()只执行一次）。child1和child2的colors属性，其实都是从这个 “唯一的父类实例” 上拿的 —— 它们共享同一个数组的引用。
#### 3.2.2. 构造函数继承
构造函数继承其实就是通过修改父类构造函数this实现的继承。我们在子类构造函数中执行父类构造函数，同时修改父类构造函数的this为子类的this。
我们直接看如何实现：
function Parent() {
  this.name = ['fedaily']
}

Parent.prototype.getName = function () {
    return this.name;
}

function Child() {
  Parent.call(this)
}

var child = new Child()
child.name.push('fe')

var child2 = new Child() // child2.name === ['fedaily']

console.log(child.getName());  // 会报错
相比第一种原型链继承方式，父类的引用属性不会被共享，优化了第一种继承方式的弊端；
但是只能继承父类的实例属性和方法，不能继承原型属性或者方法
#### 3.2.3. 组合继承
同时结合原型链继承、构造函数继承就是组合继承了。
function Parent() {
  this.name = 'fedaily';
  this.play = [1, 2, 3];
}

Parent.prototype.getName = function() {
  return this.name
}

function Child() {
  // 第二次调用 Parent()
  Parent.call(this)
  this.topic = 'fe'
}

// 第一次调用 Parent()
Child.prototype = new Parent()
// 需要重新设置子类的constructor，
// Child.prototype = new Parent() 相当于子类的原型对象完全被覆盖了
Child.prototype.constructor = Child

var s1 = new Child();
var s2 = new Child();
s1.play.push(4);
console.log(s1.play, s2.play);  // 不互相影响
console.log(s1.getName()); // 正常输出'fedaily'
console.log(s2.getName()); // 正常输出'fedaily'
缺点:父类构造函数被调用了两次。
#### 3.2.4. 原型式继承
这里主要借助Object.create方法实现普通对象的继承
let parent4 = {
  name: "parent4",
  friends: ["p1", "p2", "p3"],
  getName: function() {
    return this.name;
  }
};

let person4 = Object.create(parent4);
person4.name = "tom";
person4.friends.push("jerry");

let person5 = Object.create(parent4);
person5.friends.push("lucy");

console.log(person4.name); // tom
console.log(person4.name === person4.getName()); // true
console.log(person5.name); // parent4
console.log(person4.friends); // ["p1", "p2", "p3","jerry","lucy"]
console.log(person5.friends); // ["p1", "p2", "p3","jerry","lucy"]
这种继承方式的缺点也很明显，因为Object.create方法实现的是浅拷贝，多个实例的引用类型属性指向相同的内存，存在篡改的可能
#### 3.2.5. 寄生式继承
寄生式继承在上面继承基础上进行优化，利用这个浅拷贝的能力再进行增强，添加一些方法
let parent5 = {
  name: "parent5",
  friends: ["p1", "p2", "p3"],
  getName: function() {
    return this.name;
  }
};

function clone(original) {
  let clone = Object.create(original);
  clone.getFriends = function() {
    return this.friends;
  };
  return clone;
}

let person5 = clone(parent5);

console.log(person5.getName()); // parent5
console.log(person5.getFriends()); // ["p1", "p2", "p3"]
其优缺点也很明显，跟上面讲的原型式继承一
#### 3.2.6. 寄生组合继承（最优方案）
- 实现：结合构造函数继承（解决引用类型共享问题）和 寄生式继承（优化原型链，只继承父类的方法，不重复创建父类实例（避免浪费））
- 代码：
function Parent(name) {
  this.name = name; // 每个实例应独立拥有的属性
  this.colors = ['red', 'blue']; // 引用类型（这次要让每个实例单独拥有）
}
// 父类的共享方法（放在原型上，所有实例共用）
Parent.prototype.getName = function() {
  return this.name;
};

// 子类：需要自己的属性（比如age）
function Child(name, age) {
  // 关键1：调用父类构造函数，并且强制让父类的this指向当前子类实例
  Parent.call(this, name);
  // 这样，每个Child实例都会执行一次Parent构造函数，创建自己的name和colors
  this.age = age;
}

// 关键2：优化原型链（只继承父类的方法，不共享属性）
function inheritPrototype(Child, Parent) {
  // 这里改用 Object.create 就可以减少组合继承中多进行一次构造的过
  // 子类原型指向父类原型的副本
  Child.prototype = Object.create(Parent.prototype);
  // 修复constructor指向（确保子类实例知道自己是Child创建的）
  Child.prototype.constructor = Child;
}
// 执行继承：让Child继承Parent的方法
inheritPrototype(Child, Parent);
// 优点：避免原型链继承的引用类型共享问题，同时保持原型链完整
#### 3.2.3 ES6 class继承
- 语法糖：本质是寄生组合继承的语法封装
- 代码：
// 父类（对应ES5的构造函数+prototype）
class Parent {
  constructor(name) {
    this.name = name;
    this.colors = ['red', 'blue'];
  }

  getName() {  // 对应Parent.prototype.getName（共享方法）
    return this.name;
  }

  static staticMethod() { // 静态方法（挂载在Parent类上，而非prototype）
    return 'static method';
  }
}

// 子类继承（对应ES5的寄生组合继承）
class Child extends Parent {
  constructor(name, age) {
    super(name); // 调用父类构造函数
    this.age = age;
  }

  getAge() { // 子类共享方法（挂载在Child.prototype上）
    return this.age;
  }
}
// 继承关系验证
const child = new Child('Alice', 20);
console.log(child instanceof Child); // true
console.log(child instanceof Parent); // true
console.log(Child.staticMethod()); //    static method（继承静态方法）
## 4. 函数式编程
### 4.1. 高阶函数应用
#### 4.1.1. 函数柯里化（Currying）
函数柯里化 = 把一个接收多个参数的函数，拆成多个接收一个参数的函数。
- 定义：柯里化是一种函数的转换，是指把接收多个参数的函数变换成接收单一参数的函数，嵌套返回直到所有参数都被使用并返回最终结果。它是指将一个函数从可调用的 f(a, b, c) 转换为可调用的 f(a)(b)(c)。柯里化不会调用函数。它只是对函数进行转换。
- 实现：
// 基础版
function curry(fn) {
  return function curried(...args) {
    if (args.length >= fn.length) {
      // 当参数接收的数量达到了函数fn的形参个数，即所有参数已经都接收完毕则进行最终的调用
      return fn.apply(this, args);
    }
    // 参数还未完全接收完毕，递归返回judge，将新的参数传入
    return function(...nextArgs) {
      return curried.apply(this, [...args, ...nextArgs]);
    };
  };
}
// 应用
function add(a, b, c) {
  return a + b + c;
}
const curriedAdd = curry(add);
console.log(curriedAdd(1)(2)(3)); // 6
console.log(curriedAdd(1, 2)(3)); // 6
- 高级版（支持占位符）：
function curryWithPlaceholder(fn) {
  return function curried(...args) {
    // 检查是否有足够参数且没有占位符
    const hasPlaceholder = args.some(arg => arg === curryWithPlaceholder.placeholder);
    if (args.length >= fn.length && !hasPlaceholder) {
      return fn.apply(this, args);
    }

    // 替换占位符
    return function(...nextArgs) {
      const newArgs = args.map(arg =>
        arg === curryWithPlaceholder.placeholder && nextArgs.length ? nextArgs.shift() : arg
      ).concat(nextArgs);
      return curried.apply(this, newArgs);
    };
  };
}
curryWithPlaceholder.placeholder = Symbol('placeholder');
// 应用
const _ = curryWithPlaceholder.placeholder;
const add = curryWithPlaceholder((a, b, c) => a + b + c);
console.log(add(1, _, 3)(2)); // 6
#### 4.1.2. 函数组合（Composition）
- 定义：是将多个简单的函数，组合成一个更复杂的函数的行为或机制。每个函数的执行结果，作为参数传递给下一个函数，最后一个函数的执行结果就是整个函数的结果。
- 实现：
// 基础版（从右到左执行）
function compose(...fns) {
  return function composed(result) {
    return fns.reduceRight((acc, fn) => fn(acc), result);
  };
}
// 应用
const toUpper = str => str.toUpperCase();
const exclaim = str => `${str}!`;
const first = arr => arr[0];
const process = compose(exclaim, toUpper, first);
console.log(process(['hello', 'world'])); // HELLO!
- 管道函数（从左到右执行）：
function pipe(...fns) {
  return function piped(result) {
    return fns.reduce((acc, fn) => fn(acc), result);
  };
}
// 应用
const add = (a, b) => a + b;
const multiply = (a, b) => a * b;
const subtract = (a, b) => a - b;
const calculate = pipe(
  (x) => add(x, 2),
  (x) => multiply(x, 3),
  (x) => subtract(x, 5)
);
console.log(calculate(10)); // (10+2)*3-5 = 31
### 4.2. 手写核心API
#### 4.2.1. 数组方法实现
1. Array.prototype.reduce：
Array.prototype.myReduce = function(callback, initialValue) {
  const arr = this; // 当前数组（this指向调用myReduce的数组）

  // 初始化累加器：有初始值则用初始值，否则用数组第一个元素
  let accumulator = initialValue === undefined ? arr[0] : initialValue;
  // 初始化遍历起始索引：有初始值从0开始，否则从1开始（跳过已用的第一个元素）
  const startIndex = initialValue === undefined ? 1 : 0;

  // 遍历数组，执行回调函数
  for (let i = startIndex; i < arr.length; i++) {
    // 回调函数参数：累加器、当前元素、索引、原数组
    accumulator = callback(accumulator, arr[i], i, arr);
  }

  return accumulator;
};
1. Array.prototype.flat：
// 递归版
Array.prototype.myFlat = function(depth = 1) {
  const arr = this;
  if (depth <= 0) return [...arr];

  return arr.reduce((acc, val) => {
    if (Array.isArray(val)) {
      acc.push(...val.myFlat(depth - 1));
    } else {
      acc.push(val);
    }
    return acc;
  }, []);
};
// 迭代版（无限深度）
function flattenDeep(arr) {
  const stack = [...arr];
  const result = [];

  while (stack.length) {
    const item = stack.pop();
    if (Array.isArray(item)) {
      stack.push(...item);
    } else {
      result.push(item);
    }
  }

  return result.reverse();
}
#### 4.2.2. 深拷贝实现
  浅拷贝：指的是创建新的数据，这个数据有着原始数据属性值的一份精确拷贝。如果属性是基本类型，拷贝的就是基本类型的值。如果属性是引用类型，拷贝的就是内存地址；即只复制对象的第⼀层属性，如果属性值是引⽤类型，浅拷⻉将复制引⽤⽽不是实际对象。
深拷贝：深拷贝开辟一个新的栈，复制对象的所有层，两个对象属完全相同，但是对应两个不同的地址，修改一个对象的属性，不会改变另一个对象的属性。
实现⽅法：
浅拷⻉ 可以使⽤ Object.assign() 或展开运算符... 。
const obj1 = { a: 1, b: { c: 2 } };
var shallowCopy1 = Object.assign({}, obj);
const shallowCopy2 = { ...obj1 };
深拷贝 使用JSON.stringify() 将js对象序列化，再通过JSON.parse反序列；loadsh：__.cloneDeep()
const obj = { a: 1, b: { c: 2 } };
const clone = JSON.parse(JSON.stringify(obj));
// JSON 方法（最简单，但有局限）
// 缺点：
// 1. 不能拷贝函数
// 2. 不能拷贝 Date（会变成字符串）
// 3. 不能拷贝 RegExp、Map、Set 等
// 4. 不能处理循环引用
// 5. 会忽略 undefined、Symbol

const obj = { a: 1, b: new Date(), c: new Map() };
const clone = structuredClone(obj);
// structuredClone（现代浏览器）
// 优点：原生支持，能处理大多数数据类型
// 缺点：
// 1. 不能克隆函数
// 2. 不能克隆 DOM 节点
// 3. 浏览器兼容性（IE 不支持）
// 1. 原对象作为键：每个对象在内存中有唯一地址，
// 用原对象作为键可以判断 “当前处理的对象是否已经被克隆过”。
// 2. 克隆体作为值：当再次遇到同一个原对象时（循环引用场景），
// 直接返回对应的克隆体，保证克隆对象内部的引用关系和原对象一致。

function deepClone(obj, map = new WeakMap()) {
  // 非对象类型直接返回
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }

  // 处理循环引用：非对象类型直接返回
  if (map.has(obj)) {
    return map.get(obj);
  }

  // 初始化克隆对象
  const clone = Array.isArray(obj) ? [] : {};
  map.set(obj, clone);  // 记录原对象与克隆对象的映射

  for (const key in obj) {
    if (obj.hasOwnProperty(key)) { // 只处理自身属性，跳过原型链上的属性
      clone[key] = deepClone(obj[key], map); // 递归克隆子属性
    }
  }

  return clone;
}
#### 4.2.3. apply、call、bind
Function.prototype.myCall = function (thisArg, ...args) {
        // 处理thisArg为null/undefined的情况，指向全局对象
        if (thisArg === null || thisArg === undefined) {
          thisArg = global;
        }
        // 生成唯一属性名，解决覆盖的问题
        const prop = Symbol();
        // 注意这里不能用.
        thisArg[prop] = this;
        // 运行这个方法，传入剩余参数，同样不能用.
        let result = thisArg[prop](...args);
        // 运行完删除属性
        delete thisArg[prop];
        // 因为call方法的返回值同fn
        return result;
      };

Function.prototype.myApply = function (thisArg, args) {
        thisArg = thisArg || global;
        // 判断是否接收参数，若未接收参数，替换为[]
        args = args || [];
        const prop = Symbol();
        thisArg[prop] = this;
        // 用...运算符展开传入
        let result = thisArg[prop](...args);
        delete thisArg[prop];
        return result;
      };

  /*
    为什么要在return前定义self来保存this？
    因为我们需要利用闭包将this（即fn）保存起来，
    使得myBind方法返回的函数在运行时的this值能够正确地指向fn
        */
      Function.prototype.myBind = function (thisArg, ...args) {
        // 1. 保存原函数（this 指向调用 myBind 的函数，即 fn）
        const self = this;

        // 2. 定义「绑定函数」（最终返回给用户的函数）
        const bound = function (...innerArgs) {
          // 1. 合并参数：预传参数（args） + 绑定函数调用时的参数（innerArgs）
          const finalArgs = [...args, ...innerArgs];
          // 2. 判断绑定函数是否被 new 调用（实例化）
          const isNew = this instanceof bound;

          // 3. 分情况执行原函数
          if (isNew) {
            // 场景2：new 调用 → 原函数的 this 指向新实例
            return new self(...finalArgs);
          } else {
            // 场景1：普通调用 → 原函数的 this 指向 thisArg
            return self.apply(thisArg, finalArgs);
          }
        };

        // 3. 返回绑定函数
        return bound;
      };
#### 4.2.4.  new
function mynew(Func, ...args) {
    // 1.创建一个新对象
    const obj = {}
    // 2.新对象原型指向构造函数原型对象
    obj.__proto__ = Func.prototype
    // 3.将构建函数的this指向新对象
    let result = Func.apply(obj, args)
    // 4.根据返回值判断
    return result instanceof Object ? result : obj
}

function Person(name, age) {
    this.name = name;
    this.age = age;
}
Person.prototype.say = function () {
    console.log(this.name)
}

let p = mynew(Person, "huihui", 123)
console.log(p) // Person {name: "huihui", age: 123}
p.say() // huihui
## 5. 数组方法全解析
数组的常用方法，包括改变原数组和不改变原数组的方法
### 5.1. 改变原数组的方法
1. 添加元素类（返回新的长度）
push( )：向数组尾部添加一个或多个元素
let arr = [1, 2, 3];
let len = arr.push(4, 5); // 向尾部添加4、5
console.log(arr); // 原数组被修改：[1, 2, 3, 4, 5]
console.log(len); // 返回新长度：5
unshift( )：向数组头部添加一个或多个元素
let arr = [1, 2, 3];
let len = arr.unshift(0, -1); // 向头部添加0、-1
console.log(arr); // 原数组被修改：[0, -1, 1, 2, 3]
console.log(len); // 返回新长度：5
2. 删除元素类（返回被删除的元素）
pop( )：移除数组最后一个元素
let arr = [1, 2, 3];
let del = arr.pop(); // 移除最后一个元素
console.log(arr); // 原数组被修改：[1, 2]
console.log(del); // 返回被删除的元素：3
shift( )：删除数组第一个元素
3. 颠倒顺序：
reverse( )： 在原数组中颠倒元素的顺序
let arr = [1, 2, 3];
arr.reverse(); // 颠倒顺序
console.log(arr); // 原数组被修改：[3, 2, 1]
4. 插入、删除、替换元素（splice）
splice(a, b, c...n)：灵活操作数组（删除 / 添加 / 替换）
参数：a（起始索引，必填）、b（删除个数，必填，0 则不删）、c...n（要添加的元素，可选）
返回值：被删除元素组成的数组（若未删除则返回空数组）
let arr = [1, 2, 3, 4];
let del = arr.splice(1, 2); // 从索引1开始，删除2个元素
console.log(arr); // 原数组被修改：[1, 4]
console.log(del); // 返回被删除的元素：[2, 3]

let arr = [1, 2, 3];
let del = arr.splice(1, 0, 4, 5); // 从索引1开始，删除0个，添加4、5
console.log(arr); // 原数组被修改：[1, 4, 5, 2, 3]
console.log(del); // 未删除元素，返回：[]

let arr = [1, 2, 3];
let del = arr.splice(1, 1, 6); // 从索引1开始，删除1个，添加6
console.log(arr); // 原数组被修改：[1, 6, 3]
console.log(del); // 返回被删除的元素：[2]
5. 排序
- sort( )：对数组元素排序
let arr = [10, 2, 21];
arr.sort((a, b) => a - b); // 传入比较函数：a - b 升序，b - a 降序
console.log(arr); // 原数组被修改：[2, 10, 21]
### 5.2. 不改变原数组的方法
这类方法不会修改原数组，而是返回一个新的结果（新数组 / 字符串 / 布尔值等）。
1. concat()：  连接两个或更多数组，返回结果
let arr1 = [1, 2];
let arr2 = [3, 4];
let newArr = arr1.concat(arr2, [5]); // 连接arr1、arr2和[5]
console.log(arr1); // 原数组不变：[1, 2]
console.log(newArr); // 返回新数组：[1, 2, 3, 4, 5]
2. slice ( )：截取数组片段，返回新数组
参数：start（起始索引，必填）、end（结束索引，可选，不包含 end 本身，默认到末尾）
let arr = [1, 2, 3, 4, 5];
let newArr1 = arr.slice(1, 3); // 截取索引1到2（不包含3）
let newArr2 = arr.slice(2); // 截取索引2到末尾
console.log(arr); // 原数组不变：[1, 2, 3, 4, 5]
console.log(newArr1); // [2, 3]
console.log(newArr2); // [3, 4, 5]
3. join ( )：将数组元素拼接为字符串，返回字符串
let arr = [1, 2, 3];
let str1 = arr.join(); // 默认用逗号分隔
let str2 = arr.join('-'); // 用横线分隔
console.log(arr); // 原数组不变：[1, 2, 3]
console.log(str1); // "1,2,3"
console.log(str2); // "1-2-3"
4. reduce()：  累计计算
const nums = [1, 2, 3, 4, 5];

const sum = nums.reduce((acc, curr) => acc + curr, 0);
// 计算过程：0+1=1 → 1+2=3 → 3+3=6 → 6+4=10 → 10+5=15
console.log(sum); // 输出：15
5. toString ()：将数组转为字符串（类似 join () 默认效果）
6. indexOf ( )：查找元素在数组中的索引，返回索引值（未找到返回 - 1）
let arr = [1, 2, 3, 2];
let index1 = arr.indexOf(2); // 查找第一个2的索引
let index2 = arr.indexOf(4); // 查找不存在的元素
console.log(arr); // 原数组不变：[1, 2, 3, 2]
console.log(index1); // 1
console.log(index2); // -1
6. filter ( )：筛选符合条件的元素，返回新数组
let arr = [1, 2, 3, 4, 5];
let evenArr = arr.filter(item => item % 2 === 0); // 条件：元素是偶数
console.log(arr); // 原数组不变：[1, 2, 3, 4, 5]
console.log(evenArr); // 返回新数组：[2, 4]
7. every ( )：检测是否所有元素都符合条件，返回布尔值（全符合则 true，否则 false）
let arr1 = [2, 4, 6];
let arr2 = [2, 3, 4];
let res1 = arr1.every(item => item % 2 === 0);
let res2 = arr2.every(item => item % 2 === 0);
console.log(arr1, arr2); // 原数组均不变
console.log(res1); // true（全是偶数）
console.log(res2); // false（有奇数3）
8. some ( )：检测是否有至少一个元素符合条件，返回布尔值（有一个符合则 true，全不符合则 false）
### 5.3. 其他迭代方法
1. forEach()：对数组每一项都运行传入的函数，没有返回值
let numbers = [1, 2, 3, 4, 5, 4, 3, 2, 1];
numbers.forEach((item, index, array) => {
  // 执行某些操作
});
2. map()：对数组每一项都运行传入的函数，返回由每次函数调用的结果构成的数组
let numbers = [1, 2, 3, 4, 5, 4, 3, 2, 1];
let mapResult = numbers.map((item, index, array) => item * 2);
console.log(mapResult) // 2,4,6,8,10,8,6,4,2
JavaScript 面试题与解答
JavaScript 有哪些数据类型？存储上的差异？
JavaScript共有八种数据类型
1. 基本数据类型分别是 undefined、null、boolean、number、string、Symbol(ES6)、bigInt(ES2020)。
2. 引用数据类型：object (包括数组、函数、日期等)。
判断方法：
typeof 42;                  // "number"
typeof 'str';               // "string"
typeof true;                // "boolean"
typeof undefined;           // "undefined"
typeof Symbol();            // "symbol"
typeof 123n;                // "bigint"
typeof null;                // "object" (历史遗留问题)
typeof {};                  // "object"
typeof [];                  // "object"
typeof function(){};        // "function"

// typeof:基本数据类型除了null都能正确识别，null识别成object
// 所有引用数据类型除了函数都返回object

// instanceof
// 判断原型链，判断对象是否属于某个构造函数
// 原理：判断右侧构造函数的 prototype 是否在左侧对象的原型链上

// 更精确的判断，
// 尤其适合区分null、数组、日期等typeof无法准确识别的类型
// toString() 是 Object 原型上的方法，它会返回一个字符串："[object 类型]"

Object.prototype.toString.call(null);     // "[object Null]"
Object.prototype.toString.call([]);       // "[object Array]"
Array.isArray([]);                        // true

const a = 123
a instanceof Number //false
// a是基本类型，不是对象，
// 包装类只是临时创建，用完就销毁
// 只有new Number(123),才是对象，才会 instanceof Number -> true

// 字符串用new Number 、parseInt转换会怎样
// new Number(str)    合法数字字符串，返回Number包装对象；否则返回Number{NaN}
// parseInt(str)    从左往右取数字，遇到非数字停止，空/无法解析返回NaN，类型是基本类型
基本数据类型存储在栈中；
引用类型的对象存储于堆中，每个堆内存对象都有对应的引用地址指向它，引用地址存放在栈中。
- Undefined：只有一个特殊值 undefined。当使用 var或 let声明了变量但没有初始化时，就相当于给变量赋予了 undefined值。包含undefined值的变量跟未定义变量是有区别的。
let message; // 这个变量被声明了，只是值为 undefined

console.log(message); // "undefined"
console.log(age); // 没有声明过这个变量，报错
- Null：Null类型同样只有一个值，即特殊值 null。逻辑上讲， null 值表示一个空对象指针，这也是给typeof传一个 null 会返回 "object" 的原因。undefined 值是由 null值派生而来
console.log(null == undefined); // true
只要变量要保存对象，而当时又没有那个对象可保存，就可用 null来填充该变量
- Boolean：Boolean（布尔值）类型有两个字面值： true 和false。通过Boolean可以将其他类型的数据转化成布尔值
- Number：数值最常见的整数类型格式则为十进制，还可以设置八进制（零开头）、十六进制（0x开头）
- BigInt：
Number 是双精度浮点数，最大安全整数为 2^53 - 1，超出后精度丢失。
BigInt 没有精度损失，适用于高精度计算（如金融、加密、大数运算），但运算速度较慢。
实际范围：由内存决定，通常可以处理数千位的整数
- String：字符串可以使用双引号（"）、单引号（'）或反引号（`）标示。字符串是不可变的，意思是一旦创建，它们的值就不能变了
- Symbol：Symbol （符号）是原始值，且符号实例是唯一、不可变的。符号的用途是确保对象属性使用唯一标识符，不会发生属性冲突的危险
let genericSymbol = Symbol();
let otherGenericSymbol = Symbol();
console.log(genericSymbol == otherGenericSymbol); // false

let fooSymbol = Symbol('foo');
let otherFooSymbol = Symbol('foo');
console.log(fooSymbol == otherFooSymbol); // false
- Object：创建object常用方式为对象字面量表示法，属性名可以是字符串或数值。
let person = {
    name: "Nicholas",
    "age": 29,
    5: true
};
- Array：JavaScript数组是一组有序的数据，但跟其他语言不同的是，数组中每个槽位可以存储任意类型的数据。并且，数组也是动态大小的，会随着数据添加而自动增长。
let colors = ["red", 2, {age: 20 }]
colors.push(2)
- Function：函数实际上是对象，每个函数都是 Function类型的实例，而 Function也有属性和方法，跟其他引用类型一样。函数存在三种常见的表达方式：
- 函数声明
function sum (num1, num2) {
    return num1 + num2;
}
- 函数表达式
let sum = function(num1, num2) {
    return num1 + num2;
};
- 箭头函数
函数声明和函数表达式两种方式
let sum = (num1, num2) => {
    return num1 + num2;
};
栈和堆的区别是什么？
暂时无法在飞书文档外展示此内容
// 1. 基本类型赋值是值复制
let a = 10;
let b = a;  // b 得到 10 的副本
b = 20;
console.log(a);  // 10（互不影响）

// 2. 引用类型赋值是地址复制
let obj1 = { x: 1 };
let obj2 = obj1;  // obj2 得到 obj1 的地址
obj2.x = 2;
console.log(obj1.x);  // 2（互相影响）

// 3. 函数参数传递
function changeValue(num, obj) {
  num = 100;      // 修改栈中的副本
  obj.x = 100;    // 修改堆中的对象
}

let n = 1;
let o = { x: 1 };
changeValue(n, o);
console.log(n);  // 1（不变）
console.log(o.x);  // 100（改变）
栈溢出
// 栈空间有限，递归过深会导致栈溢出
function infiniteRecursion() {
  infiniteRecursion();
}

infiniteRecursion();  // RangeError: Maximum call stack size exceeded

// 解决：尾递归优化（ES6）
function factorial(n, acc = 1) {
  if (n <= 1) return acc;
  return factorial(n - 1, n * acc);  // 尾调用
}
JavaScript字符串的常用方法有哪些？
concat：用于将一个或多个字符串拼接成一个新字符串
let stringValue = "hello world";
console.log(stringValue.slice(3)); // "lo world"
console.log(stringValue.substring(3)); // "lo world"
console.log(stringValue.substr(3)); // "lo world"
console.log(stringValue.slice(3, 7)); // "lo w"
console.log(stringValue.substring(3,7)); // "lo w"
console.log(stringValue.substr(3, 7)); // "lo worl"
trim()、trimLeft()、trimRight()：删除前、后或前后所有空格符，再返回新的字符串。
toLowerCase()、 toUpperCase()：大小写转化
chatAt()、indexOf()、startWith()、includes()
split()：把字符串按照指定的分割符，拆分成数组中的每一项
match()：接收一个参数，可以是一个正则表达式字符串，也可以是一个RegExp对象，返回数组
replace()：接收两个参数，第一个参数为匹配的内容，第二个参数为替换的元素（可用函数）
“ ===”、“ ==” 的区别？
==：
如果操作数相等，则会返回 true
两个都为简单类型，字符串和布尔值都会转换成数值，再比较
简单类型与引用类型比较，对象转化成其原始类型的值，再比较
两个都为引用类型，则比较它们是否指向同一个对象
null 和 undefined 相等
存在 NaN 则返回 false

===：
只有两个操作数在无需类型转换运算数就相等的情况下，才返回 true，需要检查数据类型
let result1 = ("55" === 55); // false，不相等，因为数据类型不同
let result2 = (55 === 55); // true，相等，因为数据类型相同值也相同
let result1 = (null === null)  //true
let result2 = (undefined === undefined)  //true
区别：
- 相等操作符（==）会做类型转换，再进行值的比较，全等运算符不会做类型转换；
- null 和 undefined 比较，相等操作符（==）为true，全等为false。
在比较null的情况的时候，我们一般使用相等操作符==
const obj = {};

if(obj.x == null){
  console.log("1");  //执行
}

// 等同于
if(obj.x === null || obj.x === undefined) {
    ...
}
所以，除了在比较对象属性为null或者undefined的情况下，我们可以使用相等操作符（==），其他情况建议一律使用全等操作符（===）。
解释 var、let 和 const 的区别
暂时无法在飞书文档外展示此内容
1. 块级作用域： 块作用域由 { }包裹，var不存在块级作用域，let和const具有块级作用域。
2. 变量提升与暂时性死区：var存在变量提升，let和const不存在变量提升，即在变量只能在声明之后使用，否则会报错。var不存在暂时性死区，let和const存在暂时性死区，只有等到声明变量的那一行代码出现，才可以获取和使用该变量。
3. 重复声明：var声明变量时，可以重复声明变量，后声明的同名变量会覆盖之前声明的变量。const和let在同一块级作用域内不允许重复声明变量。
// 1. if块级作用域
if (true) {
  let x = 100; // 块级作用域变量
  const y = 200;
  console.log(x); // 100（块内可访问）
}
console.log(x); // 报错：x is not defined（块外不可访问）
console.log(y); // 报错：y is not defined

// 2. for循环块级作用域（经典场景）
for (let i = 0; i < 3; i++) { // let声明的i属于每次循环的块级作用域
  console.log(i); // 0, 1, 2
}
console.log(i); // 报错：i is not defined（循环外不可访问）

// 对比var（函数作用域）：
for (var j = 0; j < 3; j++) {}
console.log(j); // 3（j泄露到外部，因为var是函数作用域）

// 3. 独立代码块
{
  let m = 5;
  const n = 10;
}
console.log(m); // 报错
console.log(n); // 报错
- 初始值设置： 在变量声明时，var和let可以不用设置初始值。而const声明变量必须设置初始值。
function example() {
  console.log(a); // undefined (变量提升)
  var a = 1;

  console.log(b); // ReferenceError (暂时性死区)
  let b = 2;

  const c = 3;
  c = 4; // TypeError
}
Rest 剩余参数的应用
function debounce(fn, delay) {
  let timer = null; // 闭包保存定时器ID
  return function(...args) {
    clearTimeout(timer);  // 清除之前的定时器
    timer = setTimeout(() => { // 重新设置定时器
      fn.apply(this, args);  // 绑定正确的this和参数,this 由 调用防抖函数时的方式 决定
    }, delay);
  };
}
这表示：把调用这个函数时传入的 所有参数收集成一个数组 args
扩展运算符的应用
把一个数组 / 可迭代对象 / 对象展开成独立元素
1. 复制数组：创建新数组并复制原数组的元素值，避免直接赋值导致的引用关联：
const arr = [1, 2, 3];
const copyArr = [...arr]; // 等价于 arr.slice()

copyArr.push(4);
console.log(arr); // [1, 2, 3]（原数组不受影响），
// 这里的 arr 和 copyArr 是两个不同的数组对象（它们的引用不同）。
// “浅拷贝” ≠ “只拷贝引用地址”，它会创建一个新的数组容器。
// 原始值会被复制，引用值会共享。
// 所以你看到 push 不影响原数组，是因为它们的容器本身已经分开了。
2. 合并数组：比 concat() 更简洁地合并多个数组：
const arr1 = [1, 2];
const arr2 = [3, 4];
const merged = [...arr1, ...arr2, 5]; // [1, 2, 3, 4, 5]
3. 将类数组 / 可迭代对象转为真正的数组：类数组（如 arguments、DOM 集合）或可迭代对象（如 Set、Map）可通过扩展运算符转为数组，方便使用数组方法：
// 1. 转换 DOM 集合（NodeList）
const divs = document.querySelectorAll('div'); // NodeList（类数组）
const divArr = [...divs]; // 转为数组，可使用 map/filter 等方法

// 2. 转换 Set（去重常用）
const set = new Set([1, 2, 2, 3]);
const uniqueArr = [...set]; // [1, 2, 3]

// 3. 转换 arguments 对象
function fn() {
  const args = [...arguments]; // 将函数参数转为数组
  console.log(args); // 如调用 fn(1,2,3)，输出 [1,2,3]
}
4. 数组解构赋值的补充：在解构时，用扩展运算符收集剩余元素：
const [first, ...rest] = [1, 2, 3, 4];
console.log(first); // 1
console.log(rest);  // [2, 3, 4]（收集剩余元素）
检测数据类型有哪些方法
1. typeof：除了对象、数组、null 检测为object，其他可以正确检测其类型
2. instanceof：只能正确判断引用数据类型，而不能判断基本数据类型 （返回的是布尔值）
3. constructor：都可以正确判断其类型 （判断不了null、undefined）
typeof 42;                  // "number"
typeof 'str';               // "string"
typeof true;                // "boolean"
typeof undefined;           // "undefined"
typeof Symbol();            // "symbol"
typeof 123n;                // "bigint"
typeof null;                // "object" (历史遗留问题)
typeof {};                  // "object"
typeof [];                  // "object"
typeof function(){};        // "function"
// 更精确的判断
Object.prototype.toString.call(null);     // "[object Null]"
Object.prototype.toString.call([]);       // "[object Array]"
Array.isArray([]);                        // true
instanceof 运算符的实现原理及实现
instanceof 是 JavaScript 中另一种常用的类型判断运算符，主要用于检测某个对象是否是指定构造函数的实例
instanceof 运算符的原理是基于原型链的查找。它会沿着对象的 proto 链条向上查找，直到找到与构造函数的 prototype 匹配的对象，或者到达原型链的顶端（null）：
- 如果找到匹配的 prototype，返回 true；
- 如果查完整个原型链都没找到，返回 false。
instanceof 只能检测 “对象”，对于字符串、数字等基本类型（非对象），会直接返回 false：
匿名函数
匿名函数在声明时不用带上函数名 没有函数提升
匿名函数可以有效的保证在页面上写入Javascript，而不会造成全局变量的污染。
ES6+ 新特性
题目：列举 10 个 ES6+ 的重要新特性
解答：
1. let/const - 块级作用域变量声明
2. 箭头函数 - () => {} 简洁语法，无自己的 this
3. 模板字符串 - `Hello ${name}` 支持插值
4. 解构赋值 - const {a, b} = obj
5. 默认参数 - function(a = 1) {}
6. for...of 用于数组，for...in用于对象
7. 展开/剩余运算符 - ...arr / function(...args)
8. 类语法 - class 关键字：
JavaScript 本身是基于原型链实现继承的，class 是 ES6 引入的一种语法糖，本质还是基于 prototype。
相比原型链，class 写法更清晰，并且提供了更接近传统面向对象的语法，比如 constructor、extends、super 等。
同时 class 还有一些行为差异，比如不会提升、必须通过 new 调用、方法默认不可枚举，并且默认运行在严格模式下。
9. 模块化 - import/export
10. Promise - 异步编程解决方案
11. Symbol/Map/Set - 新的数据类型
12. async/await - 更优雅的异步处理
13. 可选链 - ?. 安全访问属性
14. 空值合并 - ?? 提供默认值
15. BigInt - 大整数支持
16. 全局对象标准化 - globalThis
Proxy
Proxy对象用于创建一个对象的代理， Proxy 可以用来 拦截对象的访问和操作，相当于在对象和外界之间加了一层“代理”（如属性查找、赋值、枚举、函数调用）。
target表示所要拦截的目标对象（任何类型的对象，包括原生数组，函数，甚至另一个代理）
handler通常以函数作为属性的对象，各属性中的函数分别定义了在执行各种操作时代理 p 的行为
const p = new Proxy(target, handler)

const obj = { a: 1 };
const proxy = new Proxy(obj, {
  get(target, prop) {
    console.log(`读取属性: ${prop}`);
    return target[prop];
  },
  set(target, prop, value) {
    console.log(`设置属性: ${prop} = ${value}`);
    target[prop] = value;
    return true;
  }
});
proxy.a;      // 输出: 读取属性: a
proxy.b = 99; // 输出: 设置属性: b = 99
CommonJs
CommonJS 是一套 Javascript 模块规范，用于服务端
其有如下特点：
- 所有代码都运行在模块作用域，不会污染全局作用域
- 模块是同步加载的，即只有加载完成，才能执行后面的操作
- 模块在首次执行后就会缓存，再次加载只返回缓存结果，如果想要再次执行，可清除缓存
- require返回的值是被输出的值的拷贝，模块内部的变化也不会影响这个值
ES6模块内部自动采用了严格模式，这里就不展开严格模式的限制，毕竟这是ES5之前就已经规定好
模块功能主要由两个命令构成：
- export：用于规定模块的对外接口
- import：用于输入其他模块提供的功能
Axios和Fetch对比
[图片]
内存管理、自动垃圾回收机制GC
JS 内存管理主要包括三部分：
1. 内存分配
JavaScript 在创建变量时自动分配内存。不同数据类型存储方式不同：
  1. 栈内存（Stack）：
  存储：基本类型（number、string、boolean、null、undefined、symbol、bigint），引用地址。
  特点：分配速度快，空间小，自动释放。
  2. 堆内存（Heap）
  存储：对象、数组、函数
  特点：空间大、动态分配、需要垃圾回收
2. 内存使用
3. 垃圾回收
Javascript 具有自动垃圾回收机制（GC：Garbage Collecation），也就是说，执行环境会负责管理代码执行过程中使用的内存。
原理：垃圾收集器会定期（周期性）找出那些不在继续使用的变量，然后释放其内存
通常情况下有两种实现方式：
- 标记清除：
  - 当变量进入执行环境（例如函数调用时），标记为“进入环境”。
  - 当变量离开执行环境（函数执行完毕或作用域结束），标记为“离开环境”。
  - 垃圾回收器运行时：
    - 从“根对象”开始（window / global），遍历内存中所有变量。
    - 对在当前上下文或被上下文引用的变量标记“可达对象”。
    - 剩下仍被标记的变量即为“不可达对象”，可被回收。
    - 执行内存清理，释放这些不可达对象占用的内存。
- 引用计数：
  - JS 引擎维护一个“引用表”，记录每个对象的引用次数。
  - 当一个对象的引用计数为 0 时，说明没有任何变量指向它，可以立即回收。
  - 如果一个值不再需要了，引用数却不为0，垃圾回收机制无法释放这块内存，从而导致内存泄漏。
- V8 引擎内存分代机制：
  - 将堆内存分为“新生代”和“老生代”，不同代使用不同的垃圾回收算法。
  - 新生代：存活时间短、回收频率高、空间较小。
  新生代采用的算法：Scavenge（复制算法）
  它把内存分成两块：From 空间  To 空间
  工作流程：
    1. 对象先分配到 From 空间
    2. 垃圾回收时
      - 复制“仍然存活”的对象到 To 空间
      - 清空 From 空间
    3. 交换 From / To 角色
  - 老生代：在新生代 GC 中存活多次，或 To 空间不足，会晋升到老生代。
  - 老生代使用的算法：标记清除、标记整理（ 将存活对象移动到一侧，整理出连续空间）
- 垃圾回收优化
  - 增量标记（Incremental Marking）
    - 将标记过程拆分成小步骤，穿插在 JS 执行中
    - 减少卡顿
  - 惰性清理（Lazy Sweeping）
    - 不立即清理所有垃圾
    - 按需清理，减少暂停时间
  - 并发标记（Concurrent Marking）
    - 辅助线程并行标记
    - 主线程继续执行 JS
DOM常见的操作有哪些？
文档对象模型 (DOM) 是 HTML 和 XML 文档的编程接口。
它提供了对文档的结构化的表述，并定义了一种方式可以使从程序中对该结构进行访问，从而改变文档的结构，样式和内容。
任何 HTML或XML文档都可以用 DOM表示为一个由节点构成的层级结构
1. 获取元素：document.getElementById('id')
2. 操作元素内容：el.innerHTML
3. 操作属性
4. 操作样式：el.style.color = 'red' el.classList.add('active')
5. 操作结构（增删改节点）：const div = document.createElement('div') parent.appendChild(child)  node.cloneNode(true) // 深拷贝
6. 事件操作：el.addEventListener('click', fn)
说说你对BOM的理解，常见的BOM对象你了解哪些？
BOM (Browser Object Model)，浏览器对象模型，提供了独立于内容与浏览器窗口进行交互的对象。
其作用就是跟浏览器做一些交互效果,比如如何进行页面的后退，前进，刷新，浏览器的窗口发生变化，滚动条的滚动，以及获取客户的一些信息如：浏览器品牌版本，屏幕分辨率。
Bom的核心对象是window，它表示浏览器的一个实例。
history 是 window 的属性（即 window.history），专门用于操作当前窗口的URL 历史记录栈，可以通过参数向前，向后，或者向指定URL跳转。
事件流与事件委托：机制与性能优化
1. 事件流（Event Flow）
事件流描述了一个事件从触发到被处理的传播顺序。根据 W3C 标准，事件流包含三个阶段：
1. 捕获阶段（Capture Phase）：事件从 document开始，依次向下传播到目标元素。 这个阶段可以“提前截获”事件，处理一些全局逻辑或拦截事件。
2. 目标阶段（Target Phase）：事件到达目标元素时触发。
3. 冒泡阶段（Bubble Phase）：事件从目标元素开始向上传播，逐级到父元素、祖先元素，直到 document。在这个阶段，父元素可以监听子元素的事件（这就是事件委托的基础）。
多数场景中使用冒泡阶段，因为它符合“事件从内部引发外部感知”的逻辑，浏览器和框架多基于冒泡设计，也便于实现事件委托。
2. 原始事件模型的局限
早期 DOM 编程中，为每个元素单独绑定事件处理函数：
<button onclick="handleClick()">Click</button>
问题：
-  同一个类型的事件只能绑定一次 ，后绑定会覆盖前绑定
- 只支持冒泡，不支持捕获阶段
- 不便于维护、复用和统一管理
3. 标准事件模型（addEventListener）
现代浏览器提供标准事件模型，使用 addEventListener 绑定事件：
第一个参数：type 表示事件类型；第2个参数：listener，是事件触发时执行的回调函数；
第3个参数：useCapture，表示事件在 捕获阶段还是冒泡阶段执行。
现在第三个参数可以写成对象：
element.addEventListener('click', handler, {
  capture: true,  // 是否捕获阶段
  once: true,  // 只执行一次
  passive: true  // 不调用 preventDefault
})
element.addEventListener('click', handler, useCapture)
element.removeEventListener('click', handler)
优点：
- 同一事件类型可绑定多个监听器
btn.addEventListener('click', show1, false);
btn.addEventListener('click', show2, false);
- 可控制事件阶段（捕获 / 冒泡）， 默认 false（冒泡阶段）
- 灵活移除监听器，便于内存释放和逻辑控制
如何中断某个事件
1 stopPropagation()，阻止 事件冒泡 / 捕获继续传播。
child.addEventListener("click", function(e){
  e.stopPropagation();
  console.log("child click");
});
2 stopImmediatePropagation()
阻止：
1️⃣ 事件继续传播
2️⃣ 同一元素上的其他监听函数
示例：
button.addEventListener("click", function(e){
  e.stopImmediatePropagation();
  console.log("handler1");
});

button.addEventListener("click", function(){
  console.log("handler2");
});
点击按钮：handler1 执行，handler2 不执行。
3 preventDefault()
阻止 默认行为。
示例：
a.addEventListener("click", function(e){
  e.preventDefault();
});
点击链接：不会跳转
4. 事件委托/代理（Event Delegation）
事件委托是将子元素的事件统一绑定在父元素上的技术，核心依赖 事件冒泡机制。
为什么使用？
- 页面上大量重复元素（如 100 个 <li>），每个绑定事件增加内存开销
- 动态新增元素需要手动绑定事件
- 增加维护成本
示例：
// 父元素统一绑定
ul.addEventListener('click', e => {
  if (e.target.matches('li')) {
    console.log('点击了子元素', e.target.textContent)
  }
})
- 当子元素点击事件冒泡到父元素时，父元素通过事件对象的 event.target 就知道 真正触发事件的子元素。
- 父元素的统一事件处理函数就能处理所有子元素事件。
优势：
- 节省内存：只绑定一次
- 动态兼容：新创建的子节点无需额外绑定
- 提升性能、降低维护成本
注意事项：
- 委托的前提是事件必须支持冒泡（如 click、keydown、input）
- focus、blur 等不冒泡，不适合委托
- 使用 e.target 判断实际触发元素
5. 捕获 vs 冒泡
addEventListener 第三个参数 useCapture：
element.addEventListener('click', handler, true)  // 捕获阶段
element.addEventListener('click', handler, false) // 冒泡阶段（默认）
面试考点：
- 哪些事件适合在捕获阶段监听？
- 是否遇到过事件绑定顺序导致执行异常？
6. 实践优化策略
1. 事件委托 + data 属性分发
<button data-action="save">保存</button>
<button data-action="delete">删除</button>
container.addEventListener('click', e => {
  const action = e.target.dataset.action
  if (action === 'save') { ... }
  if (action === 'delete') { ... }
})
1. 事件节流 / 防抖：优化高频事件（滚动、拖拽、鼠标移动）
2. 统一事件管理模块化封装：集中管理注册和解绑，降低维护成本
浏览器渲染页面
解析 HTML 构建 DOM 树
解析 CSS 构建 CSSOM 树
合并 DOM 和 CSSOM 生成渲染树（Render Tree）
回流（计算元素几何位置）
重绘（绘制元素像素）
合成（展示到屏幕）。
回流与重绘
回流（Reflow，也叫重排）
当 DOM 元素的几何属性发生变化（如位置、大小、布局）时，浏览器需要重新计算元素的位置和尺寸，并重新构建渲染树的布局结构，这个过程称为回流。
重绘（Repaint）
当元素的外观属性发生变化（如颜色、背景、阴影），但不影响其几何结构（位置和大小不变）时，浏览器不需要重新计算布局，只需重新绘制元素的视觉表现，这个过程称为重绘。
null和undefined区别
Undefined 和 Null 都是基本数据类型，这两个基本数据类型分别都只有一个值，就是 undefined 和 null。
- undefined 代表的含义是未定义，一般变量声明了但还没有定义的时候会返回 undefined，typeof为undefined
- null 代表的含义是空对象，null主要用于赋值给一些可能会返回对象的变量，作为初始化，typeof为object
null == undefined // true
null === undefined //false
Javascript本地存储的方式有哪些？区别及应用场景？
关于cookie、sessionStorage、localStorage三者的区别主要如下：
- 存储大小：cookie数据大小不能超过4k，sessionStorage和localStorage虽然也有存储大小的限制，但比cookie大得多，可以达到5M或更大。
- 有效时间：localStorage存储持久数据，浏览器关闭后数据不丢失除非主动删除数据； sessionStorage数据在当前浏览器窗口关闭后自动删除；cookie设置的cookie过期时间之前一直有效，即使窗口或浏览器关闭。
- 数据与服务器之间的交互方式，cookie的数据会自动的传递到服务器，服务器端也可以写cookie到客户端； sessionStorage和localStorage不会自动把数据发给服务器，仅在本地保存。

应用场景：
- 标记用户与跟踪用户行为的情况，推荐使用cookie
- 适合长期保存在本地的数据（令牌），推荐使用localStorage
- 敏感账号一次性登录，推荐使用sessionStorage
- 存储大量数据的情况、在线文档（富文本编辑器）保存编辑历史的情况，推荐使用indexedDB。

一、cookie 的存储格式
Cookie 本质上是 键值对字符串。
示例：
document.cookie = "username=tom";
浏览器实际存储格式类似：
username=tom
如果有多个 cookie：
username=tom; age=20; token=abc123
特点：
- key=value 的字符串形式
- 多个 cookie 用 ; 分隔
- 浏览器会自动在 HTTP 请求头中携带
HTTP 请求头示例：
Cookie: username=tom; token=abc123
二、localStorage 的存储格式
localStorage 也是 键值对形式，但 value 只能是字符串。
存储示例：
localStorage.setItem("name", "tom");
实际存储：
key: "name"
value: "tom"
读取：
localStorage.getItem("name");
如果要存对象，需要转换：
const user = {
  name: "tom",
  age: 20
};

localStorage.setItem("user", JSON.stringify(user));
存储内容实际是：
'{"name":"tom","age":20}'
读取：
const data = JSON.parse(localStorage.getItem("user"));
cookie、localStorage 和 sessionStorage 存储的本质都是字符串。
cookie 以 key=value 的形式存储，并会在 HTTP 请求时自动携带到服务器。
localStorage 和 sessionStorage 以键值对形式存储，但 value 只能是字符串，如果需要存储对象或数组，需要使用 JSON.stringify 转换为字符串，读取时再使用 JSON.parse 还原。
for...in和for...of的区别
for...in 主要用于遍历对象的属性名，返回的是 key，并且会遍历对象原型链上的可枚举属性，因此不推荐用于遍历数组。for...of 用于遍历可迭代对象，返回的是元素值，底层基于 Symbol.iterator 迭代器机制，适用于数组、字符串、Set、Map 等数据结构，是遍历数组更推荐的方式。

for ... In 会遍历 可枚举属性 + 原型链属性。如果想避免，需要使用 obj.hasOwnProperty(key)
Array.prototype.test = "hello";

const arr = [1,2,3];

for (let key in arr) {
  console.log(key);
}

// 0 1 2 test
For ... Of   基于 迭代器（Iterator）机制。
1 调用对象的 Symbol.iterator
2 返回 iterator
3 不断调用 next()
4 获取 value
为什么 for...of 不能遍历对象
const obj = {a:1,b:2};

for (let value of obj) {}
会报错：TypeError: obj is not iterable
原因：for...of 只能遍历 可迭代对象。
可迭代对象必须有：Symbol.iterator，对象默认没有这个属性。
对AJAX的理解，实现一个AJAX请求
AJAX是 Asynchronous JavaScript and XML 的缩写，指的是通过 JavaScript 的 异步通信，从服务器获取 XML 文档从中提取数据，再更新当前网页的对应部分，而不用刷新整个网页。 创建AJAX请求的步骤：
- 创建一个 XMLHttpRequest 对象。
- 在这个对象上使用 open 方法创建一个 HTTP 请求，open 方法所需要的参数是请求的方法、请求的地址、是否异步和用户的认证信息。
- 在发起请求前，可以为这个对象添加一些信息和监听函数。比如说可以通过 setRequestHeader 方法来为请求添加头信息。还可以为这个对象添加一个状态监听函数。一个 XMLHttpRequest 对象一共有 5 个状态，当它的状态变化时会触发onreadystatechange 事件，可以通过设置监听函数，来处理请求成功后的结果。当对象的 readyState 变为 4 的时候，代表服务器返回的数据接收完成，这个时候可以通过判断请求的状态，如果状态是 2xx 或者 304 的话则代表返回正常。这个时候就可以通过 response 中的数据来对页面进行更新了。
- 当对象的属性和监听函数设置完成后，最后调用 send 方法来向服务器发起请求，可以传入参数作为发送的数据体。
const SERVER_URL = "/server";
let xhr = new XMLHttpRequest();
// 创建 Http 请求
xhr.open("GET", url, true);
// 设置状态监听函数
xhr.onreadystatechange = function() {
  if (this.readyState !== 4) return;
  // 当请求成功时
  if (this.status === 200) {
    handle(this.response);
  } else {
    console.error(this.statusText);
  }
};
// 设置请求失败时的监听函数
xhr.onerror = function() {
  console.error(this.statusText);
};
// 设置请求头信息
xhr.responseType = "json";
xhr.setRequestHeader("Accept", "application/json");
// 发送 Http 请求
xhr.send(null);
ajax、axios、fetch的区别
ajax
Ajax的原理简单来说通过XmlHttpRequest对象来向服务器发异步请求，从服务器获得数据，然后用JavaScript来操作DOM而更新页面。
function ajax(options) {
    //创建XMLHttpRequest对象
    const xhr = new XMLHttpRequest()

    //初始化参数的内容
    options = options || {}
    options.type = (options.type || 'GET').toUpperCase()
    options.dataType = options.dataType || 'json'
    const params = options.data

    //发送请求
    if (options.type === 'GET') {
        xhr.open('GET', options.url + '?' + params, true)
        xhr.send(null)
    } else if (options.type === 'POST') {
        xhr.open('POST', options.url, true)
        xhr.send(params)

    //接收请求
    xhr.onreadystatechange = function () {
        if (xhr.readyState === 4) {
            let status = xhr.status
            if (status >= 200 && status < 300) {
                options.success && options.success(xhr.responseText, xhr.responseXML)
            } else {
                options.fail && options.fail(status)
            }
        }
    }
}
- 基于原生XHR开发，XHR本身架构不清晰。
- 针对MVC编程，不符合现在前端MVVM的浪潮。
- 多个请求之间如果有先后关系的话，就会出现回调地狱
- 配置和调用方式非常混乱，而且基于事件的异步模型不友好。
axios
- 支持PromiseAPI
- 从浏览器中创建XMLHttpRequest
- 从 node.js 创建 http 请求
- 支持请求拦截和响应拦截
- 自动转换JSON数据
- 客服端支持防止CSRF/XSRF
fetch
- 浏览器原生实现的请求方式，ajax的替代品
- 基于标准 Promise 实现，支持async/await
- fetchtch只对网络请求报错，对400，500都当做成功的请求，需要封装去处理
- 默认不会带cookie，需要添加配置项
- fetch没有办法原生监测请求的进度，而XHR可以。
forEach和map方法有什么区别
两个方法都是用来遍历循环数组，区别如下：
- forEach()对数据的操作会改变原数组，该方法没有返回值；
- map()方法不会改变原数组的值，返回一个新数组，新数组中的值为原数组调用函数处理之后的值；
Set、Map的区别
Set
- 创建： new Set([1, 1, 2, 3, 3, 4, 2])
- add(value)：添加某个值，返回Set结构本身。
- delete(value)：删除某个值，返回一个布尔值，表示删除是否成功。
- has(value)：返回一个布尔值，表示该值是否为Set的成员。
- clear()：清除所有成员，没有返回值。
Map
- set(key, val): 向Map中添加新元素
- get(key): 通过键值查找特定的数值并返回
- has(key): 判断Map对象中是否有Key所对应的值，有返回true,否则返回false
- delete(key): 通过键值从Map中移除对应的数据
- clear(): 将这个Map中的所有元素删除
区别
- Map是一种键值对的集合，和对象不同的是，键可以是任意值
- Map可以遍历，可以和各种数据格式转换
- Set是类似数组的一种的数据结构，类似数组的一种集合，但在Set中没有重复的值
object、map、weakmap
Object 是最基础的键值对结构，但 key 只能是字符串或 Symbol；
Map 是更强的键值对结构，key 可以是任意类型，并且支持 size 和遍历；
WeakMap 是一种特殊的 Map，key 必须是对象，并且是弱引用，当对象没有其他引用时会被垃圾回收，常用于存储私有数据或避免内存泄漏。
Date() 的使用
const today = new Date();
const endYear = new Date(1995, 11, 31, 23, 59, 59, 999); // 设置日期和月份
endYear.setFullYear(today.getFullYear()); // 设置年份为今年
const msPerDay = 24 * 60 * 60 * 1000; // 一天时间的毫秒数
let daysLeft = (endYear.getTime() - today.getTime()) / msPerDay;
daysLeft = Math.round(daysLeft); // 返回今年剩余天数
requestAnimationFrame（RAF）问题
1. requestAnimationFrame 和 setTimeout/setInterval 的区别是什么？
  1. RAF 调度基于 浏览器渲染循环，和屏幕刷新率同步，能避免掉帧和累积误差；回调在 下一帧绘制前 执行，保证 DOM 更新马上能被渲染。
  2. setTimeout不和刷新绑定，可能导致丢帧或卡顿，不保证精准时间，调度基于 事件循环，主线程繁忙时会延后执行。
2. RAF 的调用栈是什么？为什么它比 setTimeout 更适合动画？
  - RAF 回调在 渲染之前 执行，保证 DOM 更新和重绘同步，避免中间状态被绘制；而 setTimeout 在事件循环里调度，不保证在绘制前执行，因此容易错过最佳渲染时机。
如何判断一个对象是空对象？
Object 和其他数据类型的本质区别是什么？
Object.defineProperty 和 Proxy 的区别是什么？
JavaScript 模块化机制是什么？ESM 如何运行？
JS 模块导入时会不会执行 IIFE？
class 和 function 构造函数的区别是什么？
typeof null 为什么是 object？
toSorted 和 sort 的代码输出结果
