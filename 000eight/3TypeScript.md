# TypeScript
## 1. TypeScript 是什么？为什么前端项目要用它？
TypeScript 本质上是在 JavaScript 基础上增加了静态类型系统。

它的核心价值主要有：
- 在编译阶段发现类型错误，减少运行时问题
- 提供更好的代码提示、自动补全和重构能力
- 更适合大型项目和多人协作
- 能把接口、数据结构、函数输入输出描述得更清楚

## 2. 类型推断和类型注解的区别是什么？
类型推断是 TypeScript 根据上下文自动推出来变量类型，比如你写 `let num = 10`，它会自动推断成 `number`。
类型注解是你显式告诉 TypeScript 这个值应该是什么类型，比如 `let num: number = 10`。

一般来说：
- 简单场景优先用类型推断，让代码更简洁
- 对外暴露的函数参数、返回值、接口结构，最好写清楚类型注解，让可读性和稳定性更强

## 3. `any` 和 `unknown` 有什么区别？
`any` 表示“不做类型检查了”，它会直接绕过 TypeScript 的类型系统，所以虽然灵活，但很容易把错误放到运行时。
`unknown` 也表示“不确定类型”，但它更安全，因为不能直接拿它当成别的类型用，必须先做类型收窄。

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

## 4. `void` 和 `never` 有什么区别？
`void` 表示函数没有返回值，或者说返回值不重要。
`never` 表示函数根本不会正常返回，比如它总是抛错，或者一直死循环。

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

## 5. 联合类型和交叉类型有什么区别？
联合类型用 `|`，表示“这个值可以是多种类型之一”。
交叉类型用 `&`，表示“这个值要同时满足多个类型”。

## 6. `interface` 和 `type` 有什么区别？怎么选？
第一，`interface` 更适合描述对象结构，支持 `extends` 继承，也支持声明合并。
第二，`type` 更灵活，不只是对象，还可以表示联合类型、交叉类型、函数类型、元组这些更复杂的类型表达。
第三，类可以 `implements interface`，而 `type` 更多是类型别名层面的抽象。
第四，从团队规范角度看，如果是描述对象形状，会优先用 `interface`；如果是复杂类型组合，优先用 `type`。

## 7. `extends` 在 TypeScript 里有哪些作用？
`extends` 在 TypeScript 里不只是“继承类”，至少有四类常见用法。
第一类是类继承，表示子类继承父类属性和方法。
第二类是接口继承，表示一个接口扩展另一个接口。
第三类是泛型约束，表示某个泛型必须满足指定结构。
第四类是条件类型里做判断，比如 `T extends U ? X : Y`。

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


## 8. 泛型怎么理解？为什么泛型很重要？
泛型可以理解成“类型层面的参数化”。也就是先写一个通用函数或通用类型，具体用什么类型，等使用时再传进去。

它最大的价值是：
- 复用逻辑
- 保留类型信息
- 避免为了通用性退回到 `any`

```ts
function identity<T>(arg: T): T {
  return arg;
}

identity<string>("hello");
identity<number>(10);
```

## 9. 类型守卫是什么？常见方式有哪些？
类型守卫的作用是在运行时做判断，同时让 TypeScript 在类型层面缩小范围，也就是我们常说的类型收窄。

常见方式有：
- `typeof`
- `instanceof`
- `in`
- 自定义类型守卫函数

在实际项目里，类型守卫最常见的作用就是处理联合类型和 `unknown`。

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

## 10. TypeScript 里如何理解 `this` 类型？
在类方法里，`this` 通常会自动指向当前类实例。
但在普通函数、回调函数、事件处理器里，`this` 的类型可能不够明确，这时候可以通过 `this` 参数显式标注。

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

## 11. 模块化和命名空间有什么区别？
模块化是现代前端的主流方案，通常基于文件，通过 `import` 和 `export` 组织代码。
命名空间是 TypeScript 早期的一种组织方式，更适合单文件或老项目场景，现在使用频率已经明显下降。
新项目优先模块化，命名空间更多是历史方案。

## 12. 如何在 TypeScript 中减少 IDE 报错和类型不准的问题？
第一，打开严格模式，尤其是 `strict`、`noImplicitAny`、`strictNullChecks`。
第二，不要滥用 `any`，能用 `unknown`、联合类型、泛型的时候尽量用更精确的类型。
第三，对外部边界写清楚类型，比如接口响应、组件 Props、函数返回值。
第四，遇到复杂联合类型时，配合类型守卫做收窄，而不是直接断言糊过去。

类型断言不是不能用，但应该是最后手段，而不是默认手段。

```json
{
  "compilerOptions": {
    "strict": true
  }
}
```

```ts
let value2: any = "hello";
let strLength: number = (value2 as string).length;
```

## 13. TypeScript 在 React / Vue 项目里常见怎么用？
在 React 里，最常见的是给 Props、State、Hooks 返回值、事件对象和接口响应写类型。
在 Vue 里，最常见的是给 `props`、`ref`、`computed`、状态管理和 API 数据写类型。

## 14. 装饰器怎么理解？
装饰器本质上是一个函数，用来包装类、方法、属性或者参数，在不改原始核心逻辑的情况下增强它的行为。
如果从思想上讲，它和高阶函数很像，本质是“函数增强”。

实际场景里常见的用途有：
- 日志
- 权限控制
- 缓存
- 埋点

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

## 15. keyof 是做什么的？
keyof 是 TypeScript 中的一个操作符，获取对象类型所有属性名组成的联合类型。

```ts
type Person = {
  name: string;
  age: number;
}

type PersonKeys = keyof Person; // "name" | "age"
```

## 16. 说说 TypeScript 中的 Pick？
Pick 是 TypeScript 中的一个内置类型，用于从另一个类型中选择一组属性。

```ts
type Person = {
  name: string;
  age: number;
}

type PersonName = Pick<Person, "name">; // { name: string }
```