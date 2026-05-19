# TypeScript

## extends 在 TypeScript 中的作用及使用场景
### 类继承
extends 用于类的继承，表示一个类继承了另一个类的属性和方法。通过继承，子类可以重用父类的功能，并且可以扩展或重写父类的方法。
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

const dog = new Dog();
dog.eat();  // Eating...
dog.bark(); // Barking...
### 接口继承
接口可以通过 extends 继承另一个接口，合并其属性。这使得接口可以更好地复用，并且可以灵活地扩展。
interface Animal {
  name: string;
  eat(): void;
}

interface Dog extends Animal {
  breed: string;
}

const dog: Dog = {
  name: "Max",
  breed: "Labrador",
  eat() {
    console.log("Eating...");
  }
};
### 泛型约束
在泛型中，extends 用来限制泛型类型必须是某个类型或接口的子类型。这可以保证传入的类型具备一定的结构，从而提高代码的安全性。
function getLength<T extends { length: number }>(arg: T): number {
  return arg.length;
}

getLength("hello"); // 5
getLength([1, 2, 3]); // 3
这里，T extends { length: number } 表示传入的类型 T 必须拥有 length 属性。
### 条件类型
extends 也用于 TypeScript 中的条件类型，通过 extends 来判断类型并进行相应的处理。这使得类型判断更加灵活，能够根据类型的不同作出不同的行为。
type IsString = T extends string ? "Yes" : "No";

type Result1 = IsString; // "Yes"
type Result2 = IsString; // "No"
在这里，T extends string 用于判断类型是否为 string，如果是，结果为 "Yes"，否则为 "No"。
## 如何在 TypeScript 中避免 IDE 报错
在 TypeScript 中，IDE 可能会因为类型不匹配或类型推导失败而报错。以下是避免 IDE 报错的一些常用技巧：
### 开启严格模式
确保在 tsconfig.json 中开启严格模式，可以大大减少类型错误的机会。
{
  "compilerOptions": {
    "strict": true
  }
}
开启严格模式后，TypeScript 会强制进行更多类型检查，确保代码更安全。
### 类型注解
通过显式地指定类型，避免 IDE 无法推导类型的问题。
let num: number = 10;
let str: string = "hello";
### 使用类型断言
当你确定某个值的类型时，可以使用类型断言来告诉 TypeScript 这就是你想要的类型。
let value: any = "hello";
let strLength: number = (value as string).length; // 类型断言
### 自定义类型保护
通过自定义类型保护函数来缩小类型范围，使得类型推导更加准确。
function isString(value: any): value is string {
  return typeof value === "string";
}

let value: any = "hello";
if (isString(value)) {
  console.log(value.length); // TypeScript 知道 value 是 string
}
在这个例子中，isString 是一个类型保护函数，帮助 TypeScript 判断 value 是否为 string，从而避免类型错误
### 使用 unknown 替代 any
any 会绕过 TypeScript 的类型检查，而 unknown 类型则会强制进行类型检查，减少潜在的错误。
let value: unknown = "hello";

// 需要做类型检查才能使用
if (typeof value === "string") {
  console.log(value.length); // 安全访问
}
## 类型推断与类型注解的区别
TypeScript 会根据变量的初始值自动推断出变量的类型，这叫做类型推断。然而，在某些情况下，我们需要明确指定变量的类型，称为类型注解。类型推断使得代码更简洁，但类型注解可以确保代码更具可读性和可靠性。
### 类型推断
let num = 10;  // 推断为 number 类型
let str = "hello";  // 推断为 string 类型
### 类型注解
let num: number = 10;  // 明确指定类型为 number
let str: string = "hello";  // 明确指定类型为 string
## 联合类型和交叉类型的区别
### 联合类型 (Union Types)
联合类型允许一个变量是多种类型之一，用 | 分隔不同类型。
let value: string | number;
value = "hello";  // 合法
value = 10;       // 合法
value = true;     // 错误，boolean 不在联合类型中
### 交叉类型 (Intersection Types)
交叉类型允许一个变量同时具备多个类型的属性，用 & 连接不同类型。
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
交叉类型会将多个类型的属性合并成一个类型，变量必须同时具备所有类型的属性。
## 如何理解 never 类型
never 是 TypeScript 中的一个特殊类型，表示值永远不应该出现，常用于以下几种情况：

- 函数总是抛出错误，永远不会正常返回。
- 函数存在死循环，永远不会结束。
function throwError(message: string): never {
throw new Error(message);
}

function infiniteLoop(): never {
  while (true) {}
}
never 类型常常用来确保代码逻辑的正确性，表示某些代码路径是无法到达的。
## 类型守卫（Type Guards）
类型守卫是 TypeScript 中的一种机制，允许开发者在运行时检查类型，并缩小类型范围。常见的类型守卫方法包括 typeof、instanceof 和自定义类型守卫。
### typeof 类型守卫
function isNumber(value: any): value is number {
  return typeof value === "number";
}

let value: any = 42;
if (isNumber(value)) {
  console.log(value.toFixed(2));  // TypeScript 知道 value 是 number
}
### instanceof 类型守卫
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

let animal: Animal = new Dog("Rex");
if (isDog(animal)) {
  animal.bark();  // TypeScript 知道 animal 是 Dog 类型
}
## 异步编程中的类型
在处理异步操作时，TypeScript 提供了多种方法来确保类型的正确性。Promise 是处理异步操作的基本方式，通常配合 async 和 await 使用。
async function fetchData(): Promise {
  return "Data loaded";
}

async function handleData() {
  const data = await fetchData();
  console.log(data);  // TypeScript 知道 data 是 string 类型
}
## 模块化与命名空间的区别
TypeScript 中，模块和命名空间都用于组织代码，但它们有明显的区别。
### 模块（Modules）
模块通过文件来组织，通常使用 import 和 export 语法。每个文件都可以视为一个模块。
// math.ts
export function add(a: number, b: number): number {
  return a + b;
}

// app.ts
import { add } from './math';
console.log(add(1, 2));
### 命名空间（Namespaces）
命名空间通过 namespace 关键字来组织代码，通常在单一文件中使用，避免全局变量污染。
namespace MathUtil {
  export function add(a: number, b: number): number {
    return a + b;
  }
}

console.log(MathUtil.add(1, 2));
模块化常常用于更大的项目，而命名空间在较小的项目中更为常见，但随着 TypeScript 和 ES6 模块的普及，命名空间的使用逐渐减少。
## 泛型的高级用法
泛型是 TypeScript 的强大特性之一，可以在函数、类和接口中使用，提供类型的复用。
泛型是给函数、类或接口 定义一个“类型占位符”，可以在使用时再指定具体类型。
它的好处是既保证类型安全，又提高复用性。
### 限制泛型类型
通过 extends 关键字，限制泛型类型必须是某个类型的子类。
function identity<T extends string | number>(arg: T): T {
  return arg;
}

identity("hello");  // 合法
identity(10);        // 合法
identity(true);      // 错误，boolean 不符合类型约束
### 默认类型参数
泛型类型可以具有默认类型，方便开发者在使用时不指定类型。
function wrap<T = string>(value: T): T {
  return value;
}

wrap("hello");  // 默认使用 string 类型
wrap(42);       // 可以传入其他类型
## interface 和 type 的区别

1. 扩展（扩展类型的能力）

- interface 支持继承（通过 extends）其他接口或类，且可以通过声明合并的方式扩展。
- type 也可以继承其他类型，但不支持声明合并。
// interface 的扩展
interface Animal {
name: string;
}

interface Dog extends Animal {
  breed: string;
}

// type 的扩展
type AnimalType = {
  name: string;
}

type DogType = AnimalType & {
  breed: string;
}
2. 声明合并

- interface 支持声明合并：如果定义了相同名称的多个接口，它们会自动合并为一个接口。
interface Person {
name: string;
}

interface Person {
  age: number;
}

const person: Person = { name: "John", age: 30 }; // 合并后的接口

- type 不支持声明合并，后声明的类型会覆盖前面声明的类型。

type Person = {
  name: string;
}

type Person = {
  age: number;
} // 错误，类型已被定义
3. 用于函数类型

- type 更适合用于定义复杂的函数类型或联合类型。
type Sum = (a: number, b: number) => number; // 定义函数类型

type UnionType = string | number; // 定义联合类型
interface 用于定义结构化的对象和类，但也可以用于函数类型的定义，但通常使用 type 更为简洁。
interface Sum {
  (a: number, b: number): number;
}
4. 赋值兼容性

- interface 更适合用于定义对象的结构，并且可以通过扩展实现复用。
- type 更灵活，可以定义联合类型、交叉类型等，因此可以更好地处理复杂的类型结构。
总结：如果需要定义对象的结构并且需要扩展，优先使用 interface。如果需要定义复杂的类型（如联合类型、交叉类型、函数类型等），则优先使用 type。
any 和 unknown 的区别
any 和 unknown 是 TypeScript 中两种特殊类型，它们都有绕过类型检查的特性，但二者的行为不同。

1. any 类型

any 表示“任何类型”，它允许你赋值任何类型的值，并且 TypeScript 不会进行任何类型检查。any 会关闭类型检查，因此会导致可能的运行时错误。
let value: any = 10;
value = "hello"; // 合法
value = true;    // 合法
value = {};      // 合法

let num: number = value;  // 可能出错，因为 `value` 的类型是 `any`
2. unknown 类型
unknown 也是一种表示“任何类型”的类型，但它比 any 更安全。unknown 不允许直接赋值给其他类型的变量，除非先做类型检查。
let value: unknown = 10;
value = "hello"; // 合法
value = true;    // 合法
value = {};      // 合法

let num: number = value;  // 错误，不能直接赋值，需要类型检查

if (typeof value === "number") {
  num = value;  // 合法，已做类型检查
}
总结：any 可以关闭类型检查，容易引发错误；unknown 提供了更多的类型安全性，必须经过类型检查后才能使用。
TypeScript 中的 void 与 never 的区别
void 和 never 是 TypeScript 中常见的返回类型，它们有显著的区别。

1. void 类型

void 表示函数没有返回值。通常用于函数类型中，表示该函数不返回任何值。
function logMessage(message: string): void {
  console.log(message);
}

let result: void = logMessage("Hello"); // result 不包含任何值
2. never 类型
never 表示该函数永远不会返回值，通常用于死循环或抛出错误的函数。
function throwError(message: string): never {
  throw new Error(message);
}

function infiniteLoop(): never {
  while (true) {}
}
总结：void 表示函数没有返回值，而 never 表示函数根本不返回（如抛出错误、死循环等）。
TypeScript 中的 this 类型
在 TypeScript 中，this 的类型是一个比较特殊的部分，尤其是在类方法、函数以及回调中，this 的类型常常会引起问题。

1. 类中的 this

在类的方法中，this 类型自动指向当前类的实例。
class Person {
  name: string;
  constructor(name: string) {
    this.name = name;
  }

  greet() {
    console.log(`Hello, my name is ${this.name}`);
  }
}

const person = new Person("John");
person.greet(); // Hello, my name is John
2. 函数中的 this
在普通函数中，this 指向全局对象（在浏览器中是 window，在严格模式下是 undefined）。
function showThis() {
  console.log(this);  // 在非严格模式下，指向 window
}

showThis();
3. 使用 this 的类型注解
可以通过类型注解来明确指定 this 的类型，确保它指向正确的对象。
function logName(this: Person) {
  console.log(this.name);
}

const person = new Person("Alice");
logName.call(person);  // Alice
总结：在 TypeScript 中，this 的类型通常是自动推导的，但在某些情况下，尤其是在回调函数和事件处理器中，可能需要显式地指定 this 的类型。
undefined 和 null 的区别
在 TypeScript 中，undefined 和 null 都表示缺少值，但它们有不同的用途和含义。

1. undefined

undefined 表示变量已声明但尚未赋值。
let x: number | undefined;
console.log(x);  // undefined

let obj = {};
console.log(obj.nonExistentProperty);  // undefined
2. null
null 表示缺少值或空对象。
let y: number | null = null;
console.log(y);  // null
总结：undefined 通常表示变量未被初始化，而 null 表示故意为空值。
TypeScript 在前端项目中的优缺点
优点

1. 类型安全

TypeScript 是静态类型语言，支持强类型检查，这有助于在开发阶段捕获类型错误，从而减少运行时错误。编译时的类型检查使得代码更具可靠性。
2. 更好的代码提示和自动补全
由于 TypeScript 提供了类型信息，IDE（如 VS Code）能提供更精确的自动补全、代码提示和错误提示，提升开发效率。
3. 增强的可维护性
TypeScript 通过强类型和接口系统帮助开发者更好地理解和维护代码，尤其是在团队合作时，其他开发人员可以清晰地了解每个变量和函数的预期类型和行为。
4. 兼容 JavaScript
TypeScript 是 JavaScript 的超集，支持现有的 JavaScript 代码，可以逐步迁移已有项目，也可以与现有的 JavaScript 库兼容使用。
5. 类型推导和类型推断
TypeScript 不仅允许手动定义类型，还会自动推导和推断类型，减少了类型注解的繁琐，提升开发体验。
6. 支持最新的 JavaScript 特性
TypeScript 支持最新的 JavaScript 特性（如 async/await、ES模块等），并且在转换为 JavaScript 时自动进行兼容性处理，保证代码在不同浏览器中的兼容性。
7. 面向对象编程支持
TypeScript 支持类、接口、继承和多态等面向对象的编程特性，使得代码结构更加清晰、易于扩展和维护。
8. 广泛的社区支持
TypeScript 拥有庞大的开发者社区和大量的第三方库的类型声明，几乎所有流行的前端框架（如 React、Vue、Angular）都提供了 TypeScript 支持和类型定义文件。
缺点

1. 学习曲线

对于没有使用过静态类型语言的开发者来说，TypeScript 的学习曲线可能稍陡，特别是在类型系统、泛型、接口和类型推断等概念上。
2. 编译过程
TypeScript 需要经过编译才能执行，而 JavaScript 是直接执行的。虽然 TypeScript 编译速度较快，但这个过程仍然需要时间，并且需要配置适当的构建工具。
3. 增加代码量
TypeScript 的类型注解会使代码比 JavaScript 更冗长，尤其是对于复杂的类型定义和泛型等，可能使得代码更加难以维护，尤其是项目初期没有正确使用类型定义时。
4. 与第三方库的兼容性问题
虽然大多数流行的库都有 TypeScript 类型定义文件，但一些小众库或没有类型定义的库可能会导致类型错误，甚至需要手动编写类型定义，增加了额外的工作量。
5. 调试困难
由于 TypeScript 会编译为 JavaScript，调试时需要源映射文件（source map），这有时可能导致调试过程中出现问题，特别是在开发过程中，开发者需要确保调试工具配置正确。
6. 过度类型化
TypeScript 的强类型系统可能导致一些开发者过度依赖类型注解，尤其是对于简单的逻辑和数据，过多的类型定义会导致冗余和代码复杂化。
TypeScript 在前端项目中的应用
在前端项目中，TypeScript 已经成为开发者的首选，尤其是在大型项目和团队合作中。以下是我在前端项目中使用 TypeScript 的一些常见场景：

1. React 项目

TypeScript 与 React 配合使用，可以显著提升开发体验。通过定义组件的 Props 和 State 类型，TypeScript 能帮助避免一些常见的类型错误。
interface ButtonProps {
  label: string;
  onClick: () => void;
}

const Button: React.FC = ({ label, onClick }) => (
  {label}
);
2. Vue 项目
在 Vue 3 中，TypeScript 也得到了很好的支持。Vue 3 的 Composition API 和 defineComponent 函数与 TypeScript 的结合非常自然，可以用来为组件定义精确的类型。
import { defineComponent, ref } from 'vue';

export default defineComponent({
  name: 'Counter',
  setup() {
    const count = ref(0);
    const increment = () => count.value++;
    return { count, increment };
  }
});
3. Vuex / Pinia 状态管理
在使用 Vuex 或 Pinia 进行状态管理时，TypeScript 可以帮助确保状态和 getters、actions 的类型正确，避免在处理应用状态时出错。
import { defineStore } from 'pinia';

export const useStore = defineStore('counter', {
  state: () => ({
    count: 0
  }),
  actions: {
    increment() {
      this.count++;
    }
  }
});
4. 表单处理
TypeScript 在处理复杂表单时尤其有用，可以帮助确保表单数据类型的正确性，并通过类型推导减少错误。
interface FormData {
  name: string;
  age: number;
}

const handleSubmit = (data: FormData) => {
  console.log(data.name, data.age);
};
5. API 请求和响应类型定义
TypeScript 可以用来定义 API 请求和响应的数据结构，确保后端返回的数据类型与前端的预期类型一致。
interface User {
  id: number;
  name: string;
}

async function fetchUser(id: number): Promise {
  const response = await fetch(`/api/user/${id}`);
  const data: User = await response.json();
  return data;
}
6. 工具库开发
TypeScript 适用于构建工具库，因为它能够提供明确的类型定义，减少了开发和使用这些库时可能出现的错误。
7. 单元测试和类型检查
在编写单元测试时，TypeScript 的类型检查可以帮助发现潜在的错误，确保测试代码和业务代码的一致性。

装饰器
原函数 = fn

新函数 = function() {
  // 加点东西
  fn()
  // 再加点东西
}

function logDecorator(fn) {
  return function (...args) {
    console.log('函数开始执行');
    const result = fn.apply(this, args);
    console.log('函数执行结束');
    return result;
  }
}

function add(a, b) {
  return a + b;
}

const newAdd = logDecorator(add);

newAdd(1, 2);

function log(target, key, descriptor) {
  const original = descriptor.value;

  descriptor.value = function (...args) {
    console.log(`调用方法 ${key}，参数:`, args);
    const result = original.apply(this, args);
    console.log(`方法 ${key} 执行结束`);
    return result;
  };

  return descriptor;
}

class Calculator {
  @log
  add(a, b) {
    return a + b;
  }
}
装饰器本质是一个函数，用来包装类或方法，通过修改 descriptor 来增强原有行为，比如添加日志、权限控制等，本质上是一种函数增强（高阶函数）的应用。
装饰器执行分为两个阶段：

1. 收集阶段从上到下
2. 执行阶段从下到上（类似函数嵌套）

同一位置的多个装饰器按“由下到上”执行；
 不同类型的装饰器执行顺序是：参数 → 方法 → 属性 → 类。

#### interface & type

1. **合并：**

- **interface** 可以多次声明，会自动合并成一个接口。这使得可以在不同地方扩展同一个接口。
- **type** 不能被多次声明合并，如果尝试合并多次相同名称的 **type** 会导致编译错误。

1. **可选属性：**

- 在 **interface** 中，你可以使用 **?** 来标记属性为可选。
- 在 **type** 中，你可以使用联合类型 **| undefined** 来标记属性为可选。

1. **扩展：**

- **interface** 可以扩展其他接口或类，通过 **extends** 关键字。
- **type** 可以使用交叉类型 **&** 来组合多个类型。

1. **类的实现：**

- **interface** 可以被类实现（使用 **implements** 关键字），以确保类拥有特定的结构。
- **type** 不能被类实现。

1. **类型声明与赋值：**

- **interface** 可以被用于声明函数、类、变量等，但不能直接赋值给一个变量。
- **type** 可以被用于声明函数、类、变量等，也可以直接赋值给一个变量。

1. **适用场景：**

- 使用 **interface** 来描述对象的形状、类的实现和拓展，以及合并多个接口。
- 使用 **type** 来定义复杂的类型，如联合类型、交叉类型、类型别名等。

