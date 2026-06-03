# JavaScript
## 1. JS 事件循环
JS 事件循环是单线程运行时的任务调度机制，分为同步任务和异步任务。同步任务直接在主线程执行，异步任务会进入任务队列。主线程执行完同步任务后，会从任务队列取异步任务执行，异步任务又分宏任务和微任务，微任务优先级更高，会先清空微任务队列，再执行一个宏任务，最后浏览器更新渲染/重新绘制页面，如此循环。常见微任务有 Promise.then、async/await，宏任务有 setTimeout、DOM 事件、AJAX。

### 1.1 JavaScript 为什么是单线程？如何实现异步编程？
JS 单线程是为避免多线程操作 DOM 冲突。

实现异的方式：
最早用回调函数，通过函数嵌套处理异步流程，但会形成 “回调地狱”；
事件监听是绑定事件处理函数，事件触发时执行异步逻辑，适合用户交互场景；
Promise 用 then/catch 链式调用解决回调嵌套，异步结果通过 resolve/reject 传递，支持并行和串行；
async/await 是 Promise 的语法糖，async 函数返回 Promise，await 暂停等待 Promise 结果。

### 1.2 事件循环在实际开发中的应用
利用微任务高优先级，处理用户高频交互（如点击、输入），保证响应优先于渲染 ；
React Fiber 把虚拟 DOM 更新拆成小任务，通过 requestIdleCallback 在浏览器空闲时执行，就是利用事件循环的空闲时间分片处理。
异步请求数据后，用 then 的微任务更新状态，能比 setTimeout 更早触发组件重绘。

## 2. webworker 优势、劣势；如何新建和通信 
优势是能在后台线程处理复杂计算，不阻塞主线程，提升页面响应速度。
劣势是不能访问 DOM、window 对象，只能用部分 JS API；数据通信是拷贝，大数据会有性能损耗；有同源限制，且会增加线程开销，不适合大量创建。

新建时用 new Worker，主线程和 Worker 通过 postMessage 传数据，onmessage 接收数据。

## 3. 对作用域、作用域链的理解
作用域，是一个变量或函数能被访问的范围，JS 有全局作用域、函数作用域和块级作用域。
全局作用域里的变量在整个程序都能访问；函数作用域里的变量只能在函数内部访问，通过 var 声明变量；块级作用域用 let/const 声明的变量只在 {} 内有效。

作用域链是当访问一个变量时，JS 会先在当前作用域找，找不到就去外层作用域找，一直找到全局作用域，这个链式查找的过程就是作用域链。

### 3.1 词法作用域的核心规则
作用域在代码定义时就确定了，和函数调用位置无关。
比如在函数 A 里定义函数 B，B 的作用域链会包含 A 的作用域，不管 B 在哪里被调用，它访问变量时都会先从 B 自身作用域开始，再到 A，最后到全局，不会因为调用位置变了而改变查找规则。

### 3.2 对闭包的理解、应用场景、危害
闭包是函数与其词法环境的组合，
具体定义是当一个内部函数被定义在外部函数中，且内部函数引用了外部函数的变量，同时内部函数被传递到外部函数作用域之外执行时，就形成了闭包。此时内部函数依然能通过作用域链访问外部函数的变量，即使外部函数已经执行完毕。

1. 数据私有化：
闭包能让变量长期保存在内存中，比如用闭包实现计数器，每次调用函数都能累加；也能避免全局变量污染，把变量封装在函数内部。

2. 防抖节流实现：
防抖中，计时器变量被闭包保留，每次触发事件时都能清除上一次的计时器，确保只有最后一次触发delay毫秒后，才会执行目标函数； （如搜索输入、表单验证）

节流中，闭包会保留 "是否在冷却中" 的状态，控制函数执行频率。首次触发会立即执行，之后在间隔时间内不再执行，直到时间到。

但闭包如果滥用，可能会导致内存泄漏，需要注意及时清理不需要的变量引用。在 React 中，useEffect 的依赖数组如果依赖了函数，可能会因为闭包导致获取到旧的状态值，这时候可以用 useCallback 包裹函数来解决。

### 3.3 内存泄漏风险与优化
内存泄漏是指未能释放已经不再使用的内存。

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


## 4. this指向
this 的指向取决于函数的调用方式：
- 默认绑定：独立函数调用，this 指向全局对象（严格模式下为 undefined）
- 隐式绑定：作为对象方法调用，this 指向调用对象
- 显式绑定：通过 call、apply、bind 指定 this
- new 绑定：构造函数调用，this 指向新创建的对象
- 箭头函数：没有自己的 this，继承外层作用域的 this

### 4.1 call/apply/bind区别
1. 调用时指定
  1. call 方法：第一个参数是 this 要指向的对象；后续参数是函数的参数列表，需逐个传入；
  2. apply方法：第一个参数同样是 this 要指向的对象；第二个参数是数组或类数组对象，包含函数的所有参数；

2. 创建时指定
  1. bind绑定 const bindFunc = func.bind(thisArg, 绑定参数1, 绑定参数2 ...)，返回新函数（不立即执行）

### 4.2 箭头函数 arrow function
箭头函数适合用于回调函数和需要固定 this 的场景。
- 箭头函数没有自己的this，继承外层作用域的this；
- 不能通过 call/apply/bind 修改this指向；
- 没有arguments对象，可用 rest 参数替代；
- 不能作为构造函数，不能用new调用；
- 没有原型对象prototype。

## 5. Promise 
Promise 对象是异步编程的一种解决方案，表示一个异步操作的最终完成或失败。Promise 构造函数接收一个回调函数，该函数包含 resolve和 reject 两个参数，分别用于控制异步操作的成功与失败状态。

一个Promise的实例有三个状态：Pending（初始状态）、Fulfilled（成功状态）、Rejected（失败状态）。实例的状态只能由pending 转变为 fulfilled 或者 rejected，并且一旦从进行状态变成为其他状态就永远不能更改状态了，其过程是不可逆的。

状态的改变是通过传入的 resolve() 和 reject() 函数来实现的，当我们调用resolve回调函数时，会执行Promise对象的then方法传入的回调函数； 当我们调用reject回调函数时，会执行Promise对象的catch方法传入的回调函数。

### 5.1 静态方法
静态方法中，all () 可并行处理多个 Promise，只有全部成功才返回结果数组，任一失败则整体失败；
race () 同样处理并行任务，但以第一个完成的 Promise 结果为准；
allSettled () 则会等待所有 Promise 完成（无论成功或失败），返回包含每个任务详细结果的数组。

### 5.2 链式调用原理
- 核心机制：每个then/catch/finally返回新的Promise实例
Promise 的链式调用是通过 then 方法返回一个新的 Promise 实现的。第一个 then 的回调返回的值，会作为第二个 then 的回调的参数；如果返回的是 Promise，第二个 then 会等待它 resolved 后再执行。这样就能把异步操作按顺序串起来，避免回调地狱。

### 5.3 async/await 语法糖
async/await 能实现的效果都能用 then 链来实现，它是为优化 then 链而开发出来的。
通过async关键字声明一个异步函数， await用于等待一个异步方法执行完成，并且会阻塞执行。 

## 6. 原型与继承体系
原型：每个函数都有一个 prototype 属性，该属性指向的就是显式原型对象，这个对象包含了可以由实例共享的属性和方法，每个实例对象有一个proto 属性，该属性指向的就是隐式原型对象。

原型链：原型链的本质是实例、构造函数、原型对象三者的关联关系，以及基于这种关系的属性查找规则。查找一个属性先在自身查找，如果找不到，就沿着proto属性在原型对象上进行查找，如果还找不到，就沿着原型对象的proto属性进行查找，直到找到Object的原型对象，如果还没有找到就会返回undefined，沿着proto查找属性(方法)的这条链就是原型链。
原型链终点是 Object.prototype.proto。

### 6.1 Object / Function
Object 是 Function 构造出来的，Object 是函数
```js
Object instanceof Function // true
Object.__proto__ === Function.prototype  // true
```
Function 是自己构造的，它的构造函数是它自己
```js
Function instanceof Function // true（JS 最魔幻的地方）
Function.__proto__ === Function.prototype
```

### 6.2 继承实现方式详解
---
JavaScript 的继承方式经历了多个阶段：
- 原型链继承：让子类原型（Child.prototype）指向父类实例（new Parent()），可以访问父类属性和方法，但引用类型会被所有实例共享。
- 构造函数继承：在子类构造函数中调用父类构造函数（通过修改父类构造函数this实现的继承），避免了引用共享，但是只能继承父类的实例属性和方法，不能继承原型属性或者方法。
- 组合继承：两者结合，既能继承方法又能独立属性，但父类构造函数会执行两次。
- 寄生组合继承：优化版，只调用一次父类构造函数，避免浪费，解决了前面的问题，被认为是 ES5 最优解。
- ES6 class extends：就是寄生组合继承的语法糖，写法更简洁，支持 super 和静态方法。

## 7. 函数式编程————函数柯里化
函数柯里化 = 把一个接收多个参数的函数，拆成多个接收一个参数的函数。

## 8. 深拷贝 vs 浅拷贝
浅拷贝：指的是创建新的数据，这个数据有着原始数据属性值的一份精确拷贝。如果属性是基本类型，拷贝的就是基本类型的值。如果属性是引用类型，拷贝的就是内存地址；即只复制对象的第⼀层属性，如果属性值是引⽤类型，浅拷⻉将复制引⽤⽽不是实际对象。

深拷贝：深拷贝开辟一个新的栈，复制对象的所有层，两个对象属完全相同，但是对应两个不同的地址，修改一个对象的属性，不会改变另一个对象的属性。


实现⽅法：
浅拷⻉ 可以使⽤ Object.assign() 或展开运算符... 。
```js
const obj1 = { a: 1, b: { c: 2 } };
var shallowCopy1 = Object.assign({}, obj);
const shallowCopy2 = { ...obj1 };
```
深拷贝 使用JSON.stringify() 将js对象序列化，再通过JSON.parse反序列；loadsh：__.cloneDeep()
```js
// JSON 方法（最简单，但有局限）
const obj = { a: 1, b: { c: 2 } };
const clone = JSON.parse(JSON.stringify(obj));
// 缺点：
// 1. 不能拷贝函数
// 2. 不能拷贝 Date（会变成字符串）
// 3. 不能拷贝 RegExp、Map、Set 等
// 4. 不能处理循环引用
// 5. 会忽略 undefined、Symbol

// structuredClone（现代浏览器）
const obj = { a: 1, b: new Date(), c: new Map() };
const clone = structuredClone(obj);
// 优点：原生支持，能处理大多数数据类型
// 缺点：
// 1. 不能克隆函数
// 2. 不能克隆 DOM 节点
// 3. 浏览器兼容性（IE 不支持）
// 1. 原对象作为键：每个对象在内存中有唯一地址，
// 用原对象作为键可以判断 “当前处理的对象是否已经被克隆过”。
// 2. 克隆体作为值：当再次遇到同一个原对象时（循环引用场景），
// 直接返回对应的克隆体，保证克隆对象内部的引用关系和原对象一致。
```

## 9. 数组方法全解析
改变原数组的方法：
1. 添加元素类（返回新的长度）
push( )：向数组尾部添加一个或多个元素
unshift( )：向数组头部添加一个或多个元素

2. 删除元素类（返回被删除的元素）
pop( )：移除数组最后一个元素
shift( )：删除数组第一个元素

3. 颠倒顺序：
reverse( )： 在原数组中颠倒元素的顺序

4. 插入、删除、替换元素（splice）
splice(a, b, c...n)：灵活操作数组（删除 / 添加 / 替换）
参数：a（起始索引，必填）、b（删除个数，必填，0 则不删）、c...n（要添加的元素，可选）
返回值：被删除元素组成的数组（若未删除则返回空数组）

5. 排序
- sort( )：对数组元素排序

### 不改变原数组的方法
这类方法不会修改原数组，而是返回一个新的结果（新数组 / 字符串 / 布尔值等）。
1. concat()：  连接两个或更多数组，返回结果

2. slice ( )：截取数组片段，返回新数组
参数：start（起始索引，必填）、end（结束索引，可选，不包含 end 本身，默认到末尾）

3. join ( )：将数组元素拼接为字符串，返回字符串

4. reduce()：  累计计算

5. toString ()：将数组转为字符串（类似 join () 默认效果）

6. indexOf ( )：查找元素在数组中的索引，返回索引值（未找到返回 - 1）

6. filter ( )：筛选符合条件的元素，返回新数组

7. every ( )：检测是否所有元素都符合条件，返回布尔值（全符合则 true，否则 false）

8. some ( )：检测是否有至少一个元素符合条件，返回布尔值（有一个符合则 true，全不符合则 false）

### 其他迭代方法
1. forEach()：对数组每一项都运行传入的函数，没有返回值，对数据的操作会改变原数组。

2. map()：对数组每一项都运行传入的函数，返回由每次函数调用的结果构成的数组

## 10. JavaScript 有哪些数据类型？存储上的差异？
1. 基本数据类型分别是
- undefined：声明了变量但没有初始化时；
- null：表示一个空对象指针；

`console.log(null == undefined); // true`

- boolean：布尔值，类型有两个字面值： true 和false。
- number：数值最常见的整数类型格式则为十进制，还可以设置八进制（零开头）、十六进制（0x开头）
- string：字符串可以使用双引号（"）、单引号（'）或反引号（`）标示。字符串是不可变的，意思是一旦创建，它们的值就不能变了。
- Symbol(ES6)：Symbol （符号）是原始值，且符号实例是唯一、不可变的。符号的用途是确保对象属性使用唯一标识符，不会发生属性冲突的危险
- bigInt(ES2020)：Number 是双精度浮点数，最大安全整数为 2^53 - 1，超出后精度丢失。


2. 引用数据类型：object (包括数组 Array、函数 Function、日期等)。

判断方法：
1. typeof：基本数据类型除了 null 都能正确识别，null 识别成 object；所有引用数据类型除了函数都返回 object。

2. instanceof：判断原型链，判断对象是否属于某个构造函数；原理：基于原型链的查找，判断右侧构造函数的 prototype 是否在左侧对象的原型链上。instanceof 只能检测 “对象”，对于字符串、数字等基本类型（非对象），会直接返回 false。

3. toString() 是 Object 原型上的方法，它会返回一个字符串："[object 类型]"，更精确的判断，尤其适合区分null、数组、日期等typeof无法准确识别的类型
```js
Object.prototype.toString.call(null);     // "[object Null]"
Object.prototype.toString.call([]);       // "[object Array]"
```

4. Array.isArray

```js
const a = 123
a instanceof Number //false
// a是基本类型，不是对象，
// 包装类只是临时创建，用完就销毁
// 只有new Number(123),才是对象，才会 instanceof Number -> true

// 字符串用new Number 、parseInt转换会怎样
// new Number(str)    合法数字字符串，返回Number包装对象；否则返回Number{NaN}
// parseInt(str)    从左往右取数字，遇到非数字停止，空/无法解析返回NaN，类型是基本类型
```

基本数据类型存储在栈中；
引用类型的对象存储于堆中，每个堆内存对象都有对应的引用地址指向它，引用地址存放在栈中。


## 11. JavaScript字符串的常用方法有哪些？
concat：用于将一个或多个字符串拼接成一个新字符串
slice()、substring()、substr()
trim()、trimLeft()、trimRight()：删除前、后或前后所有空格符，再返回新的字符串。
toLowerCase()、 toUpperCase()：大小写转化
chatAt()、indexOf()、startWith()、includes()
split()：把字符串按照指定的分割符，拆分成数组中的每一项
match()：接收一个参数，可以是一个正则表达式字符串，也可以是一个RegExp对象，返回数组
replace()：接收两个参数，第一个参数为匹配的内容，第二个参数为替换的元素（可用函数）

## 12. “ ===”、“ ==” 的区别？
- 相等操作符（==）会做类型转换，再进行值的比较，全等运算符不会做类型转换；
- null 和 undefined 比较，相等操作符（==）为true，全等为false。
- 在比较null的情况的时候，我们一般使用相等操作符==

## 13. 解释 var、let 和 const 的区别
1. 块级作用域： 块作用域由 { }包裹，var不存在块级作用域，let和const具有块级作用域。
2. 变量提升与暂时性死区：var存在变量提升，let和const不存在变量提升，即在变量只能在声明之后使用，否则会报错。var不存在暂时性死区，let和const存在暂时性死区，只有等到声明变量的那一行代码出现，才可以获取和使用该变量。
3. 重复声明：var声明变量时，可以重复声明变量，后声明的同名变量会覆盖之前声明的变量。const和let在同一块级作用域内不允许重复声明变量。
4. 初始值设置： 在变量声明时，var和let可以不用设置初始值。而const声明变量必须设置初始值

## 14. Rest 剩余参数 vs 扩展运算符
Rest 剩余参数：把调用这个函数时传入的 所有参数收集成一个数组 args

扩展运算符：把一个数组 / 可迭代对象 / 对象展开成独立元素
1. 复制数组：创建新数组并复制原数组的元素值，避免直接赋值导致的引用关联。
2. 合并数组：比 concat() 更简洁地合并多个数组。
3. 将类数组 / 可迭代对象转为真正的数组：类数组或可迭代对象（如 Set、Map）可通过扩展运算符转为数组，方便使用数组方法。
4. 数组解构赋值的补充：在解构时，用扩展运算符收集剩余元素。

## 15. 列举 10 个 ES6+ 的重要新特性
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

## 16. Ajax、Axios、Fetch 的对比
1. AJAX 是通过 XmlHttpRequest 对象来向服务器发异步请求，从服务器获得数据，然后用JavaScript来操作DOM而更新页面。多个请求之间如果有先后关系的话，就会出现回调地狱；
2. axios：
- 支持PromiseAPI
- 从浏览器中创建XMLHttpRequest
- 从 node.js 创建 http 请求
- 支持请求拦截和响应拦截
- 自动转换JSON数据
- 客服端支持防止CSRF/XSRF
3. fetch 是浏览器原生实现的请求方式，ajax的替代品
- 基于标准 Promise 实现，支持async/await
- fetchtch只对网络请求报错，对400，500都当做成功的请求，需要封装去处理
- 默认不会带cookie，需要添加配置项
- fetch没有办法原生监测请求的进度，而XHR可以。


## 17. 内存管理、自动垃圾回收机制GC
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

## 18. DOM常见的操作有哪些？
文档对象模型 (DOM) 是 HTML 和 XML 文档的编程接口。
它提供了对文档的结构化的表述，并定义了一种方式可以使从程序中对该结构进行访问，从而改变文档的结构，样式和内容。
任何 HTML或XML文档都可以用 DOM表示为一个由节点构成的层级结构
1. 获取元素：document.getElementById('id')
2. 操作元素内容：el.innerHTML
3. 操作属性
4. 操作样式：el.style.color = 'red' el.classList.add('active')
5. 操作结构（增删改节点）：const div = document.createElement('div') parent.appendChild(child)  node.cloneNode(true) // 深拷贝
6. 事件操作：el.addEventListener('click', fn)

## 19. 说说你对BOM的理解，常见的BOM对象你了解哪些？
BOM (Browser Object Model)，浏览器对象模型，提供了独立于内容与浏览器窗口进行交互的对象。
其作用就是跟浏览器做一些交互效果,比如如何进行页面的后退，前进，刷新，浏览器的窗口发生变化，滚动条的滚动，以及获取客户的一些信息如：浏览器品牌版本，屏幕分辨率。
Bom的核心对象是window，它表示浏览器的一个实例。
history 是 window 的属性（即 window.history），专门用于操作当前窗口的URL 历史记录栈，可以通过参数向前，向后，或者向指定URL跳转。

## 20. 事件流与事件委托：机制与性能优化
1. 事件流（Event Flow）
事件流描述了一个事件从触发到被处理的传播顺序。根据 W3C 标准，事件流包含三个阶段：
1. 捕获阶段（Capture Phase）：事件从 document开始，依次向下传播到目标元素。 这个阶段可以“提前截获”事件，处理一些全局逻辑或拦截事件。
2. 目标阶段（Target Phase）：事件到达目标元素时触发。
3. 冒泡阶段（Bubble Phase）：事件从目标元素开始向上传播，逐级到父元素、祖先元素，直到 document。在这个阶段，父元素可以监听子元素的事件。

### 20.1 标准事件模型（addEventListener）
现代浏览器提供标准事件模型，使用 addEventListener 绑定事件：
第一个参数：type 表示事件类型；第2个参数：listener，是事件触发时执行的回调函数；
第3个参数：useCapture，表示事件在 捕获阶段还是冒泡阶段执行。
现在第三个参数可以写成对象：
```js
element.addEventListener('click', handler, {
  capture: true,  // 是否捕获阶段
  once: true,  // 只执行一次
  passive: true  // 不调用 preventDefault
})
element.addEventListener('click', handler, useCapture)
element.removeEventListener('click', handler)
```
优点：
- 同一事件类型可绑定多个监听器
- 可控制事件阶段（捕获 / 冒泡）， 默认 false（冒泡阶段）
- 灵活移除监听器，便于内存释放和逻辑控制

### 20.2 如何中断某个事件
1. stopPropagation()，阻止 事件冒泡 / 捕获继续传播。
2. stopImmediatePropagation()
阻止：
- 事件继续传播
- 同一元素上的其他监听函数
3. preventDefault()
阻止 默认行为。

### 20.3 事件委托/代理（Event Delegation）
事件委托是将子元素的事件统一绑定在父元素上的技术，核心依赖 事件冒泡机制。
为什么使用？
- 页面上大量重复元素（如 100 个 <li>），每个绑定事件增加内存开销
过程：
- 当子元素点击事件冒泡到父元素时，父元素通过事件对象的 event.target 就知道 真正触发事件的子元素。
- 父元素的统一事件处理函数就能处理所有子元素事件。


## 21. Javascript本地存储的方式有哪些？区别及应用场景？

- 存储大小：cookie数据大小不能超过4k，sessionStorage和localStorage虽然也有存储大小的限制，但比cookie大得多，可以达到5M或更大。

- 有效时间：localStorage存储持久数据，浏览器关闭后数据不丢失除非主动删除数据； sessionStorage数据在当前浏览器窗口关闭后自动删除；cookie设置的cookie过期时间之前一直有效，即使窗口或浏览器关闭。

- 数据与服务器之间的交互方式：cookie的数据浏览器会自动在 HTTP 请求头中携带； sessionStorage和localStorage不会自动把数据发给服务器，仅在本地保存。

- 存储格式：
  - Cookie 本质上是 键值对字符串。
`document.cookie = "username=tom; age=20; token=abc123";`
  - localStorage 也是 键值对形式，但 value 只能是字符串。
```js
localStorage.setItem("name", "tom");
localStorage.getItem("name");

const user = {
  name: "tom",
  age: 20
};
localStorage.setItem("user", JSON.stringify(user));
const data = JSON.parse(localStorage.getItem("user"));
```

应用场景：
- 标记用户与跟踪用户行为的情况，推荐使用cookie
- 适合长期保存在本地的数据（令牌），推荐使用localStorage
- 敏感账号一次性登录，推荐使用sessionStorage
- 存储大量数据的情况、在线文档（富文本编辑器）保存编辑历史的情况，推荐使用indexedDB。

## 22. for...in和for...of的区别
for...in 主要用于遍历对象的属性名，返回的是 key，并且会遍历对象原型链上的可枚举属性，因此不推荐用于遍历数组。需要使用 `obj.hasOwnProperty`

for...of 用于遍历可迭代对象，返回的是元素值，底层基于 Symbol.iterator 迭代器机制，适用于数组、字符串、Set、Map 等数据结构，是遍历数组更推荐的方式。


## 23. Set、Map、Object、WeakMap 的区别
- Set是类似数组的一种的数据结构，类似数组的一种集合，但在Set中没有重复的值。

- Map 是更强的键值对结构，key 可以是任意类型，并且支持 size 和遍历；

- Object 是最基础的键值对结构，但 key 只能是字符串或 Symbol；

- WeakMap 是一种特殊的 Map，key 必须是对象，并且是弱引用，当对象没有其他引用时会被垃圾回收，常用于存储私有数据或避免内存泄漏。

## 24. 
如何判断一个对象是空对象？
Object 和其他数据类型的本质区别是什么？
Object.defineProperty 和 Proxy 的区别是什么？
JavaScript 模块化机制是什么？ESM 如何运行？
JS 模块导入时会不会执行 IIFE？
class 和 function 构造函数的区别是什么？
typeof null 为什么是 object？
toSorted 和 sort 的代码输出结果













## 其他 notes
## 1. 执行栈与任务队列
- 执行栈（Call Stack）：用于存储同步任务的执行上下文，遵循LIFO（后进先出）原则，函数执行时会被推入栈顶。
function a() { b(); }
function b() { c(); }
function c() { console.log('c'); }
a();
// 执行栈流程：a入栈 → b入栈 → c入栈 → 执行c → c出栈 → b出栈 → a出栈
- 任务队列（Task Queue）：存储异步任务回调，分为宏任务队列和微任务队列，优先级不同

## 2. 对作用域、作用域链的理解
```js
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
```
```js
var a = 2;
function foo(){
    console.log(a) // 2
}
function bar(){
    var a = 3;
    foo();
}
bar()
```

## 3. 闭包的经典应用场景
1. 数据私有化：
```js
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
```
2. 函数工厂：
根据不同参数生成具有特定行为的函数，避免重复代码。
例如createAdder(5)生成的add5函数，会 "记住" 参数5，每次调用时都用这个值参与计算，本质是闭包保留了value变量。
```js
function createAdder(value) {
  return function(num) {
    return value + num;
  };
}
const add5 = createAdder(5);
console.log(add5(3)); // 8
```

## 4. this 优先级从高到低
```js
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
```
优先级验证
```js
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
```
常见陷阱
```js
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
```

## 5. 继承实现方式详解

### 原型链继承：最基础但有明显缺陷
原型继承的核⼼是 prototype 属性。当你访问⼀个对象的属性或⽅法时，如果当前对象上不存在， 解释器就会查找对象的原型链，直到找到该属性或⽅法或到达原型链的末端。

- 实现：让子类的原型（Child.prototype）指向父类的一个实例（new Parent()），从而让子类实例通过原型链访问父类的属性和方法。
- 代码：
```js
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
```
为什么能实现继承？
当创建子类实例（比如const child1 = new Child()）时：
- 访问child1.name：会先找自身属性，找不到就去Child.prototype（也就是父类实例）里找，所以能拿到'Parent'。
- 调用child1.getName()：自身和Child.prototype都没有，就去Parent.prototype里找，所以能调用父类方法。
缺点：
父类构造函数中的引用类型（比如对象/数组），会被所有子类实例共享。其中一个子类实例进行修改，会导致所有其他子类实例的这个值都会改变。具体来说，因为Child.prototype指向的是同一个父类实例（new Parent()只执行一次）。child1和child2的colors属性，其实都是从这个 “唯一的父类实例” 上拿的 —— 它们共享同一个数组的引用。
### 构造函数继承
构造函数继承其实就是通过修改父类构造函数this实现的继承。我们在子类构造函数中执行父类构造函数，同时修改父类构造函数的this为子类的this。
我们直接看如何实现：
```js
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
```
相比第一种原型链继承方式，父类的引用属性不会被共享，优化了第一种继承方式的弊端；
但是只能继承父类的实例属性和方法，不能继承原型属性或者方法
### 组合继承
同时结合原型链继承、构造函数继承就是组合继承了。
```js
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
```
缺点:父类构造函数被调用了两次。

### 寄生组合继承（最优方案）
- 实现：结合构造函数继承（解决引用类型共享问题）和 寄生式继承（优化原型链，只继承父类的方法，不重复创建父类实例（避免浪费））
- 代码：
```js
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
```
### ES6 class继承
- 语法糖：本质是寄生组合继承的语法封装
- 代码：
```js
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
```