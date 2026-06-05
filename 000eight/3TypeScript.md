# TypeScript

这份文档按“高频问题 + 面试逐字稿 + 关键代码笔记”整理。
目标是两件事：

1. 面试时能直接说出口
2. 复习时保留关键类型写法和代码示例

---

## 1. TypeScript 是什么？为什么前端项目要用它？

### 面试逐字稿

TypeScript 是 JavaScript 的超集，本质上是在 JavaScript 基础上增加了静态类型系统。

它的核心价值主要有几个：
- 在编译阶段发现类型错误，减少运行时问题
- 提供更好的代码提示、自动补全和重构能力
- 更适合大型项目和多人协作
- 能把接口、数据结构、函数输入输出描述得更清楚

如果一句话总结，我会说：TypeScript 不是为了让代码“更复杂”，而是为了让复杂项目更可控。

---

## 2. TypeScript 在前端项目中的优缺点是什么？

### 面试逐字稿

优点方面，最重要的是类型安全和可维护性。它能在开发阶段提前暴露很多问题，比如接口字段写错、函数参数传错、状态类型不一致。再加上 IDE 提示更强，所以在 React、Vue 这类大型项目里收益很明显。

缺点主要有几个：
- 有学习成本，尤其是泛型、条件类型、类型体操这些内容
- 需要编译和配置，工程复杂度会略高
- 写类型会增加一定代码量
- 遇到没有类型声明的第三方库时，可能需要自己补类型

所以我的理解是，小项目不是必须上 TypeScript，但只要项目规模上来、团队协作变复杂，TypeScript 基本都会带来正收益。

---

## 3. 类型推断和类型注解的区别是什么？

### 面试逐字稿

类型推断是 TypeScript 根据上下文自动推出来变量类型，比如你写 `let num = 10`，它会自动推断成 `number`。

类型注解是你显式告诉 TypeScript 这个值应该是什么类型，比如 `let num: number = 10`。

一般来说：
- 简单场景优先用类型推断，让代码更简洁
- 对外暴露的函数参数、返回值、接口结构，最好写清楚类型注解，让可读性和稳定性更强

### 关键代码笔记

```ts
// 类型推断
let num = 10;      // number
let str = "hello"; // string

// 类型注解
let count: number = 10;
let name: string = "Tom";
```

---

## 4. `any` 和 `unknown` 有什么区别？

### 面试逐字稿

`any` 表示“我不做类型检查了”，它会直接绕过 TypeScript 的类型系统，所以虽然灵活，但很容易把错误放到运行时。

`unknown` 也表示“不确定类型”，但它更安全，因为你不能直接拿它当成别的类型用，必须先做类型收窄。

一句话总结：
- `any` 是放弃检查
- `unknown` 是先保守接收，再逐步判断

### 关键代码笔记

```ts
let value: any = 10;
value = "hello";
let num: number = value; // 不安全，但不报错
```

```ts
let value2: unknown = 10;
value2 = "hello";

if (typeof value2 === "string") {
  console.log(value2.length);
}
```

---

## 5. `void` 和 `never` 有什么区别？

### 面试逐字稿

`void` 表示函数没有返回值，或者说返回值我们不关心。

`never` 表示函数根本不会正常返回，比如它总是抛错，或者一直死循环。

所以：
- `void` 是“返回空”
- `never` 是“不会返回”

### 关键代码笔记

```ts
function logMessage(message: string): void {
  console.log(message);
}
```

```ts
function throwError(message: string): never {
  throw new Error(message);
}

function infiniteLoop(): never {
  while (true) {}
}
```

---

## 6. 联合类型和交叉类型有什么区别？

### 面试逐字稿

联合类型用 `|`，表示“这个值可以是多种类型之一”。

交叉类型用 `&`，表示“这个值要同时满足多个类型”。

所以：
- 联合类型更像“或”
- 交叉类型更像“且”

### 关键代码笔记

```ts
let value: string | number;
value = "hello";
value = 10;
```

```ts
interface Person {
  name: string;
}

interface Employee {
  jobTitle: string;
}

type EmployeePerson = Person & Employee;

const employee: EmployeePerson = {
  name: "John",
  jobTitle: "Developer"
};
```

---

## 7. `interface` 和 `type` 有什么区别？怎么选？

### 面试逐字稿

这题面试非常高频，我一般会从四点回答。

第一，`interface` 更适合描述对象结构，支持 `extends` 继承，也支持声明合并。

第二，`type` 更灵活，不只是对象，还可以表示联合类型、交叉类型、函数类型、元组这些更复杂的类型表达。

第三，类可以 `implements interface`，而 `type` 更多是类型别名层面的抽象。

第四，从团队规范角度看，如果是描述对象形状，很多团队会优先用 `interface`；如果是复杂类型组合，优先用 `type`。

一句话总结：
- 对象结构优先 `interface`
- 联合、交叉、函数类型这类复杂组合优先 `type`

### 关键代码笔记

```ts
interface Animal {
  name: string;
}

interface Dog extends Animal {
  breed: string;
}
```

```ts
type AnimalType = {
  name: string;
};

type DogType = AnimalType & {
  breed: string;
};
```

```ts
// interface 支持声明合并
interface Person {
  name: string;
}

interface Person {
  age: number;
}

const person: Person = { name: "John", age: 30 };
```

```ts
// type 更适合函数类型和联合类型
type Sum = (a: number, b: number) => number;
type UnionType = string | number;
```

---

## 8. `extends` 在 TypeScript 里有哪些作用？

### 面试逐字稿

`extends` 在 TypeScript 里不只是“继承类”，它至少有四类常见用法。

第一类是类继承，表示子类继承父类属性和方法。

第二类是接口继承，表示一个接口扩展另一个接口。

第三类是泛型约束，表示某个泛型必须满足指定结构。

第四类是条件类型里做判断，比如 `T extends U ? X : Y`。

所以面试里如果只答“extends 就是继承”，其实是不够的。

### 关键代码笔记

```ts
// 类继承
class Animal {
  eat() {
    console.log("Eating...");
  }
}

class Dog extends Animal {
  bark() {
    console.log("Barking...");
  }
}
```

```ts
// 接口继承
interface AnimalInfo {
  name: string;
  eat(): void;
}

interface DogInfo extends AnimalInfo {
  breed: string;
}
```

```ts
// 泛型约束
function getLength<T extends { length: number }>(arg: T): number {
  return arg.length;
}
```

```ts
// 条件类型
type IsString<T> = T extends string ? "Yes" : "No";

type Result1 = IsString<string>; // "Yes"
type Result2 = IsString<number>; // "No"
```

---

## 9. 泛型怎么理解？为什么泛型很重要？

### 面试逐字稿

泛型可以理解成“类型层面的参数化”。也就是我们先写一个通用函数或通用类型，具体用什么类型，等使用时再传进去。

它最大的价值是：
- 复用逻辑
- 保留类型信息
- 避免为了通用性退回到 `any`

一句话总结：泛型就是“既通用，又不丢类型”。

### 关键代码笔记

```ts
function identity<T>(arg: T): T {
  return arg;
}

identity<string>("hello");
identity<number>(10);
```

```ts
// 泛型约束
function identity2<T extends string | number>(arg: T): T {
  return arg;
}
```

```ts
// 默认类型参数
function wrap<T = string>(value: T): T {
  return value;
}
```

---

## 10. 类型守卫是什么？常见方式有哪些？

### 面试逐字稿

类型守卫的作用是在运行时做判断，同时让 TypeScript 在类型层面缩小范围，也就是我们常说的类型收窄。

常见方式有：
- `typeof`
- `instanceof`
- `in`
- 自定义类型守卫函数

在实际项目里，类型守卫最常见的作用就是处理联合类型和 `unknown`。

### 关键代码笔记

```ts
function isNumber(value: unknown): value is number {
  return typeof value === "number";
}
```

```ts
class Animal {
  name: string;
  constructor(name: string) {
    this.name = name;
  }
}

class Dog extends Animal {
  bark() {
    console.log("Bark!");
  }
}

function isDog(animal: Animal): animal is Dog {
  return animal instanceof Dog;
}
```

---

## 11. TypeScript 里如何理解 `this` 类型？

### 面试逐字稿

在类方法里，`this` 通常会自动指向当前类实例，这部分比较自然。

但在普通函数、回调函数、事件处理器里，`this` 的类型可能不够明确，这时候可以通过 `this` 参数显式标注。

所以 TS 里的 `this` 问题，本质上不是 JS 的 `this` 机制变了，而是我们要把 `this` 的类型也描述清楚。

### 关键代码笔记

```ts
class Person {
  name: string;
  constructor(name: string) {
    this.name = name;
  }

  greet() {
    console.log(`Hello, my name is ${this.name}`);
  }
}
```

```ts
function logName(this: Person) {
  console.log(this.name);
}
```

---

## 12. TypeScript 里 `null` 和 `undefined` 怎么理解？

### 面试逐字稿

`undefined` 更偏“还没有值”，比如变量声明了但没赋值，或者对象访问不存在属性。

`null` 更偏“明确表示这里就是空值”。

在开启严格模式，尤其是 `strictNullChecks` 之后，`null` 和 `undefined` 不会再随便赋给别的类型，这也是 TypeScript 类型安全的重要一部分。

### 关键代码笔记

```ts
let x: number | undefined;
console.log(x); // undefined
```

```ts
let y: number | null = null;
console.log(y); // null
```

---

## 13. 模块化和命名空间有什么区别？

### 面试逐字稿

模块化是现代前端的主流方案，通常基于文件，通过 `import` 和 `export` 组织代码。

命名空间是 TypeScript 早期的一种组织方式，更适合单文件或老项目场景，现在使用频率已经明显下降。

所以如果面试官问怎么选，我会直接说：
- 新项目优先模块化
- 命名空间更多是历史方案，了解即可

### 关键代码笔记

```ts
// math.ts
export function add(a: number, b: number): number {
  return a + b;
}

// app.ts
import { add } from "./math";
console.log(add(1, 2));
```

```ts
namespace MathUtil {
  export function add(a: number, b: number): number {
    return a + b;
  }
}
```

---

## 14. 异步编程在 TypeScript 里怎么写类型？

### 面试逐字稿

异步函数最核心的是把返回值写清楚，一般就是 `Promise<T>`。

这样 `await` 之后拿到的值是什么类型，TypeScript 就能继续往下推断。

所以异步编程在 TS 里最重要的不是语法，而是把 Promise 的结果类型描述准确。

### 关键代码笔记

```ts
async function fetchData(): Promise<string> {
  return "Data loaded";
}

async function handleData() {
  const data = await fetchData();
  console.log(data); // string
}
```

```ts
interface User {
  id: number;
  name: string;
}

async function fetchUser(id: number): Promise<User> {
  const response = await fetch(`/api/user/${id}`);
  const data: User = await response.json();
  return data;
}
```

---

## 15. 如何在 TypeScript 中减少 IDE 报错和类型不准的问题？

### 面试逐字稿

这个问题我一般会从工程实践角度回答。

第一，打开严格模式，尤其是 `strict`、`noImplicitAny`、`strictNullChecks`。

第二，不要滥用 `any`，能用 `unknown`、联合类型、泛型的时候尽量用更精确的类型。

第三，对外部边界写清楚类型，比如接口响应、组件 Props、函数返回值。

第四，遇到复杂联合类型时，配合类型守卫做收窄，而不是直接断言糊过去。

类型断言不是不能用，但应该是最后手段，而不是默认手段。

### 关键代码笔记

```json
{
  "compilerOptions": {
    "strict": true
  }
}
```

```ts
let value: unknown = "hello";

if (typeof value === "string") {
  console.log(value.length);
}
```

```ts
let value2: any = "hello";
let strLength: number = (value2 as string).length;
```

---

## 16. TypeScript 在 React / Vue 项目里常见怎么用？

### 面试逐字稿

在 React 里，最常见的是给 Props、State、Hooks 返回值、事件对象和接口响应写类型。

在 Vue 里，最常见的是给 `props`、`ref`、`computed`、状态管理和 API 数据写类型。

如果是工程实践，我会更强调两类场景：
- 组件边界类型
- 接口数据类型

因为这两类地方一旦类型清楚，整个项目的稳定性会提升很多。

### 关键代码笔记

```ts
// React Props
interface ButtonProps {
  label: string;
  onClick: () => void;
}
```

```ts
// Vue 3
import { defineComponent, ref } from "vue";

export default defineComponent({
  name: "Counter",
  setup() {
    const count = ref(0);
    const increment = () => count.value++;
    return { count, increment };
  }
});
```

```ts
// Pinia
import { defineStore } from "pinia";

export const useStore = defineStore("counter", {
  state: () => ({
    count: 0
  }),
  actions: {
    increment() {
      this.count++;
    }
  }
});
```

---

## 17. 装饰器怎么理解？

### 面试逐字稿

装饰器本质上是一个函数，用来包装类、方法、属性或者参数，在不改原始核心逻辑的情况下增强它的行为。

如果从思想上讲，它和高阶函数很像，本质是“函数增强”。

实际场景里常见的用途有：
- 日志
- 权限控制
- 缓存
- 埋点

不过要注意，装饰器更偏语法层增强，不是所有项目都会默认启用。

### 关键代码笔记

```ts
function logDecorator(fn: Function) {
  return function (...args: unknown[]) {
    console.log("函数开始执行");
    const result = fn.apply(this, args);
    console.log("函数执行结束");
    return result;
  };
}
```

```ts
function log(target: unknown, key: string, descriptor: PropertyDescriptor) {
  const original = descriptor.value;

  descriptor.value = function (...args: unknown[]) {
    console.log(`调用方法 ${key}，参数:`, args);
    const result = original.apply(this, args);
    console.log(`方法 ${key} 执行结束`);
    return result;
  };

  return descriptor;
}
```

---

## 18. 快速收尾模板

如果面试官问的是开放题，可以这样收尾：

“这个问题我一般会从类型系统的目标、核心概念、工程实践和常见取舍四个角度回答。TypeScript 题最好不要只讲概念，最好顺带给一个类型定义或者代码例子，这样更像真的用过。” 
