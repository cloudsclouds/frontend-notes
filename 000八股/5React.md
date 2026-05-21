# React

## Vue vs React

Vue 是渐进式框架，模板驱动，双向绑定，方便快速开发中小型项目。
React 是组件化 UI 库，基于 JSX 和 Hooks，单向数据流更可控，适合复杂、大型应用和跨平台开发。
渐进式框架（Progressive Framework）

- 定义：框架设计上可以逐步使用，你可以只用它的一部分，也可以用它的全部功能。
模板驱动（Template-driven）
- 定义：前端页面结构通过模板语言描述，逻辑和 HTML 分开
组件化 UI 库（Component-based UI Library）
- 定义：UI 界面由可复用组件组成，每个组件封装自己的状态、逻辑和样式
单向数据流（One-way Data Flow）
- 定义：数据只能从父组件 → 子组件流动，子组件不直接修改父组件状态
响应式与渲染机制
- Vue：基于依赖收集的响应式系统（Vue3 使用 Proxy），在组件渲染过程中追踪哪些响应式属性被使用，然后只在这些属性变化时触发最小化更新（fine-grained reactivity + effect tracking）。这让某些场景下无需手动 memo 就能获得高效更新。
- React：以组件为更新单元，状态改变会触发组件重新渲染（React 在内部通过 Fiber 调度、批处理和调度优先级来优化）。需要靠 React.memo、useMemo、useCallback 等来避免不必要的子组件重渲染或昂贵计算。**React 的本质是“状态驱动重新渲染”，不是像 Vue 那样的细粒度响应式**

## React 核心概念

## 1. React 的特点是什么？

- 声明式（Declarative）
开发者只需要描述 界面在某个状态下应该是什么样子，React 会根据状态变化自动更新界面，而不需要手动操作 DOM。
- 组件化（Component-Based）
React 将界面拆分成 独立的组件，每个组件负责一部分 UI，并可以重复使用。
- 跨平台能力（Learn Once, Write Anywhere）
React 本身只负责 描述 UI 结构，具体的渲染由不同的渲染器完成，因此可以支持 Web、Native 等多平台开发。

## 2. JSX 的本质是什么？

JSX 本质上是 JavaScript 的语法扩展，用于在 JavaScript 中描述 UI 结构。
它最终会被编译（转译）成 普通的 JavaScript 函数调用。
在 React 中，JSX 会被 Babel 编译为 React.createElement() 调用，从而生成 React 元素对象（React Element），会被用于构建 虚拟 DOM。

## 3. Fiber

### 1. Fiber的实现原理

Fiber是React 16引入的新架构，将渲染任务分解为多个小任务单元：

- 实现增量渲染，支持任务的中断与恢复
- 给不同任务赋予不同优先级
- 类似使用requestIdleCallback API（React内部polyfill）实现时间切片，但不是使用requestIdleCallback
- 将虚拟DOM树转换为Fiber链表结构（child、sibling、return属性）

### 2. Reconciliation（协调）过程

- 将虚拟DOM转换为Fiber节点的过程
- 采用深度优先搜索（DFS）遍历节点
- 通过Diff算法找出变化的部分
- 可中断，优先级高的任务可先执行

### 3. Render和Commit阶段

  **Render阶段**：

- 执行beginWork：创建子Fiber节点
- 执行completeWork：处理DOM节点创建和属性设置
- 标记副作用（effectTag）
**Commit阶段**：
- before mutation：执行getSnapshotBeforeUpdate和调度useEffect
- mutation：执行DOM操作
- layout：更新ref和执行useLayoutEffect回调

## 五、Redux

在 Fiber 架构中，React 通过时间切片将渲染任务拆分为多个小任务，并结合优先级调度机制，优先处理用户交互等高优任务，从而避免主线程阻塞。

1. 产生更新（setState）
2. React 给任务打优先级
3. 调度器（Scheduler）决定何时执行
4. 按优先级 + 时间片执行 Fiber
5. 最终进入 commit 阶段更新 DOM

## 4. 虚拟 DOM 的原理

作用：减少直接操作真实DOM的开销，通过Diff算法找出差异后批量更新。
原理：

- 将真实 DOM 树转换为 JS 对象树（Virtual DOM）
- 当 state 或 props 变化时，React 会重新执行组件函数，生成 新的 Virtual DOM 树.
- 通过 Diff算法 比较新旧 VDOM 树，找出最小变化部分:
React 的 Diff 有几个重要策略：
  - 同层比较（不跨层）
  - 不同类型节点直接替换：若类型不同直接销毁重建。
  - 通过 key 优化列表更新：列表元素用唯一key标识，减少不必要的重渲染。
- 将变化部分批量更新到真实DOM：
React 根据 Diff 结果：
  - 只更新 发生变化的部分 DOM，而不是整个页面。
  - 最终通过 React DOM 更新浏览器中的真实 DOM。

## 5. 组件key的作用及缺失的问题

作用：

- 帮助React识别列表中哪些元素被修改、添加或删除
- 提高Diff算法效率，减少不必要的重渲染
缺失key的问题：
- 无法正确引用组件（ref可能指向错误实例）
- 非受控组件input重排时可能出现值混乱
- React无法准确识别元素变化，导致性能下降和状态错误

## 6. 合成事件 SyntheticEvent

React 为了兼容不同浏览器、统一行为所创建的一种事件包装。它模拟了 DOM 原生事件的所有接口（例如 stopPropagation, preventDefault 等），但其行为是由 React 自己实现的。
React 会将所有事件 统一绑定到根元素（如 #root） 上，然后通过事件冒泡捕获事件，再根据事件的目标去触发对应组件的事件回调。
React17+ 的变动：事件绑定位置优化
在 React 17 之前：

- 所有事件统一绑定到 document
React 17 开始：
- 事件绑定在组件挂载的根容器（如 #root）上，而不是 document，全称“事件委托局部化”
- 避免多个 React 应用嵌套时事件冲突
- 更适配 Shadow DOM / 微前端等新场景

```ts
// 列表中大量事件绑定（性能问题）
// 错误方式: 每个 render 都创建新函数
// 优化方案：事件委托
// 列表中大量事件绑定（性能问题）
// 错误方式: 每个 render 都创建新函数
// 优化方案：事件委托
<div onClick={handleCardClick}>
  {items.map(item => (
    <div key={item.id} data-id={item.id} className="card">{item.name}</div>
  ))}
</div>

function handleCardClick(e) {
  const id = e.target.dataset.id;
  if (id) {
    // 根据 id 做交互处理
  }
}

// 阻止冒泡
e.stopPropagation();

// 阻止默认行为
e.preventDefault();

// 事件捕获（Capture）
事件捕获（Capture）
```

## 组件与生命周期

## 1. 类组件与函数组件的区别

组件主要分为 类组件（Class Component） 和 函数组件（Function Component）。它们都可以用来构建 UI，但实现方式和使用方式有所不同。
类组件是通过 class 继承 React.Component 定义的，使用 this.state 和 setState 管理状态，并通过生命周期方法管理组件行为。
函数组件是 普通函数，通过 Hooks（如 useState、useEffect） 来管理状态和生命周期，代码更加简洁。
在现代 React 开发中，官方更推荐使用 函数组件 + Hooks。
类组件：类组件是通过 ES6 class 定义的，需要继承 React.Component。

```ts
import React from "react";

class Hello extends React.Component {
  render() {
    return # Hello World;
  }
}
```

类组件 使用 this.state 和 this.setState() 管理状态。

```ts
class Counter extends React.Component {
  state = { count: 0 };

  add = () => {
    this.setState({ count: this.state.count + 1 });
  };

  render() {
    return {this.state.count};
  }
}
```

类组件：通过 生命周期方法管理组件行为，例如：

- componentDidMount
- componentDidUpdate
- componentWillUnmount
函数组件：是 普通 JavaScript 函数，直接返回 JSX。

```ts
function Hello() {
return # Hello World;
}
```

函数组件 使用 Hooks（例如 useState）管理状态。

```ts
import { useState } from "react";

function Counter() {
  const [count, setCount] = useState(0);

  return (
    <button onClick={() => setCount(count + 1)}>
      {count}

  );
}
```

函数组件：使用 Hook useEffect 实现生命周期功能。

```ts
import { useEffect } from "react";

useEffect(() => {
  console.log("组件挂载完成");
}, []);
```

## 2. React 类组件生命周期

1. **初始渲染阶段**：
  - constructor：初始化state和绑定事件
  - getDerivedStateFromProps：根据props派生state
  - render：渲染UI
  - componentDidMount：组件挂载后执行
2. 更新阶段：组件 state 或 props 变化时，会触发更新。
  - shouldComponentUpdate：判断是否需要更新
  - render
  - componentDidUpdate【异步请求、订阅事件、DOM 操作】
3. 卸载阶段：
  - componentWillUnmount【清除定时器、取消订阅、移除事件监听】

## 3. 受控组件与非受控组件

在 React 中，表单元素（如 input、textarea、select）可以通过 两种方式管理数据：

- 受控组件（Controlled Component）
- 非受控组件（Uncontrolled Component）
区别主要在于：数据由谁管理。
受控组件：
受控组件指的是：
表单数据由 React 的 state 完全控制。
输入框的 value 由 state 决定，用户输入时通过 onChange 更新 state。

```ts
import { useState } from "react";

function Form() {
  const [value, setValue] = useState("");

  function handleChange(e) {
    setValue(e.target.value);
  }

  return (

  );
}
```

非受控组件：
非受控组件指的是：
表单数据由 DOM 自己管理，而不是 React state。
React 通过 ref 获取 DOM 中的值。

```ts
import { useRef } from "react";

function Form() {
  const inputRef = useRef(null);

  function handleSubmit() {
    console.log(inputRef.current.value);
  }

  return (
    <>
      <input type="text" ref={inputRef} />
      <button onClick={handleSubmit}>Submit</button>
    </>
  );
}
```

一般情况下，React 更推荐使用 受控组件，因为数据更可控，更方便进行表单验证和逻辑处理。
使用非受控组件适合：简单表单、文件上传、不需要实时控制输入

## 4. React 事件委托机制

React的事件委托是将事件处理逻辑从子组件传递到父组件，通过单一事件监听器处理多个子组件的相似事件。

**与原生JS事件委托的区别**：

- 原生JS利用事件冒泡机制，在父元素上设置监听器，[通过event.target](http://通过event.target)判断事件源
- React使用合成事件系统，事件处理在document级别统一处理，而非直接绑定在DOM元素上

**实现方式**： 在父组件定义事件处理函数，通过props传递给子组件，子组件触发事件时调用该函数并传递数据。

## Hooks

是 React 提供的一组函数，本质上 把类组件中的 state 和生命周期抽象成函数，让函数组件也能管理状态和副作用。

## 1. Hooks的规则

  a. 只能在函数组件或自定义Hook的顶层调用（不可在条件、循环中）。
  b. 命名以use开头（如useState）。

### Hooks的实现原理

- Hooks数据保存在Fiber节点的memoizedState属性中
- 通过单向链表结构存储多个Hooks，每个Hook通过next属性连接
- 首次渲染时调用mount函数，更新时调用update函数
- 不能在条件语句中声明Hooks，否则会破坏链表结构

### 自定义Hook的编写

自定义Hook是函数代码逻辑的抽取，需遵循以下规则：

- 名称以"use"开头
- 内部可以调用其他Hooks
- 用于复用状态逻辑
示例：定时器Hook

```ts
function useTimer(initialDelay) {
  const [delay, setDelay] = useState(initialDelay);
  const timerRef = useRef(null);

  useEffect(() => {
    timerRef.current = setInterval(() => {
      // 定时器逻辑
    }, delay);

    return () => clearInterval(timerRef.current);
  }, [delay]);

  return [delay, setDelay];
}
```

## 2. useState

  useState：管理组件状态，返回状态值和更新函数（const [count, setCount] = useState(0)）。

```ts
import { useState } from "react";

function Counter() {
  const [count, setCount] = useState(0); // 初始化为 0

  return <button onClick={() => setCount(count + 1)}>{count};
}
```

  setState 可能是异步的，尤其在 事件处理器中 或 批量更新 时。
  因此，如果需要依赖前一状态更新，必须使用 函数形式：setCount(prevCount => prevCount + 1);
  setState 之所以推荐函数形式，是因为 React 会对 state 更新进行批量处理，在同一个事件循环中多次调用 setState 时，组件拿到的是同一个旧 state 快照。如果直接使用 state 计算，会导致结果错误。而函数形式的 setState 会在执行时接收最新的 state，从而保证每一次更新都是基于最新值计算的。
  每次 useState 调用 顺序必须固定，不能在条件或循环中调用。
  错误示例：

```ts
if (show) {
  const [count, setCount] = useState(0); // ❌ 可能导致 Hook 顺序错误
}
```

  正确示例：

```ts
  const [count, setCount] = useState(0);
  const [text, setText] = useState("");
  if (show) {
    // 使用 count 或 text，但不要再调用 useState
  }
```

## 3. useEffect

  useEffect：处理副作用（数据请求、DOM操作），可模拟生命周期

```ts
useEffect(() => {
  // 副作用逻辑
  fetchData();

  // 可选清理函数（模拟 componentWillUnmount）
  return () => {
    cleanup();
  };
}, [dependency]); // 依赖数组，控制副作用执行时机
```

依赖数组作用：依赖数组 [dep1, dep2] 决定副作用函数执行时机：

| 写法       | 执行时机      | 类比生命周期                                 |
| -------- | --------- | -------------------------------------- |
| 不写依赖     | 每次渲染都执行   | componentDidMount + componentDidUpdate |
| 空数组 `[]` | 只在挂载时执行一次 | componentDidMount                      |
| `[dep]`  | dep 改变时执行 | componentDidUpdate（依赖变化时）              |

模拟生命周期写法：

- componentDidMount：`useEffect(() => { ... }, [])`
- componentDidUpdate：`useEffect(() => { ... }, [dep1, dep2])`
- componentWillUnmount：`useEffect(() => { return () => { ... } }, [])`
- componentDidMount + componentDidUpdate + componentWillUnmount：`useEffect(() => { ...; return () => { ... } }, [deps])`
- 不要滥用 state/props 作为依赖
- 缓存函数/对象
- 使用函数式更新

useEffect中setState的问题及解决
问题：在useEffect中使用setState可能导致无限循环
原因：

- 如果useEffect没有依赖数组，每次渲染后都会执行
- 执行setState会触发重新渲染，导致useEffect再次执行
解决方法：
- 添加依赖数组，指定effect的依赖项
- 依赖数组为空时，effect只在组件挂载和卸载时执行一次
- 正确设置依赖项，确保只在必要时更新

## 4. useRef

用于创建可变引用对象，常用于获取 DOM 节点或保存跨渲染的值而不触发组件重渲染。它与 state 的主要区别是 ref 不会触发渲染，适合保存不直接影响 UI 的数据或引用。

1. 保持变量不变：如果你希望某个变量在每次重新渲染时都保持不变，可以使用useRef。例如，你需要保存一个计时器的ID，而不希望它在组件重新渲染时被重置：

```ts
const timerId = useRef(null);
useEffect(() => {
    timerId.current = setInterval(() => {
        console.log('计时中...');  }, 1000);
    return () => clearInterval(timerId.current);
    }, []);
```

1. 操作DOM：当你需要直接操作DOM元素时，useRef也非常有用。例如，你需要在组件加载后自动聚焦一个输入框：

```ts
const inputRef = useRef(null);
useEffect(() => {
    inputRef.current.focus();
}, []);
return ;
```

## 5. useMemo与useCallback的区别

useMemo用于优化组件性能，确保只有在依赖项变化时才重新计算某个值。它可以帮助你避免每次渲染时都进行耗时的计算。
例如，你有一个计算密集型的函数，它依赖于某些输入数据，你可以使用useMemo来缓存其计算结果：

```ts
const expensiveCalculation = (num) => {
    console.log('计算中...');
    return num * 2;
};
const MyComponent = ({ number }) => {
    const calculatedValue = useMemo(() =>
        expensiveCalculation(number), [number]);
    return 计算结果：{calculatedValue};
};
```

useCallback的作用与useMemo类似，但它是用于缓存函数的。它确保只有在依赖项变化时才重新创建函数，从而避免子组件不必要的重新渲染。
例如，你有一个子组件需要依赖一个回调函数，你可以使用useCallback来优化性能：

```ts
const MyComponent = ({ onButtonClick }) => {
    return 点击我;};
    const ParentComponent = () => {
        const handleClick = useCallback(() => {
        console.log('按钮被点击了');
    }, []);
/*    如果在这不使用useCallback，
handleClick函数将在每次ParentComponent重新渲染时被重新创建，
导致传递给MyComponent的onButtonClick属性变化，
从而使MyComponent重新渲染。    */
    return ;
};
```

## 6. useMemo React.Memo

useMemo 用于缓存计算结果，避免重复计算；React.memo 用于缓存组件渲染，避免不必要的重新渲染。

```ts
const expensiveValue = useMemo(() => {
  return heavyCompute(a, b);
}, [a, b]);
const Child = React.memo(function Child({ count }) {
  console.log("render");
  return {count};
});
```

## 7. useContext

用于 跨组件共享数据，避免层层传 props
可以替代轻量状态管理方案（如 Redux）

```ts
import { createContext, useContext, useState } from "react";

// 创建 Context 对象
const ThemeContext = createContext("light");

function Parent() {
  const [theme, setTheme] = useState("dark");

  return (
   // 提供 value 给子组件
    <ThemeContext.Provider value={theme}>
    </ThemeContext.Provider>

  );
}

function Child() {
  const theme = useContext(ThemeContext); // 在子组件中获取 value，获取共享数据
  return 当前主题: {theme};
}
```

如何避免 value 频繁变化导致子组件重复渲染？

- value 发生变化 → 所有依赖该 context 的子组件会重新渲染
- 解决方案：
  - 使用 useMemo 缓存 value
- const value = useMemo(() => ({ theme, toggleTheme }), [theme]);
  - 尽量拆分多个 context，减少不必要的渲染

## 8. useReducer

管理 复杂状态逻辑
比 useState 更适合状态之间有依赖关系或多种更新操作的场景

```ts
import { useReducer } from "react";

const initialState = { count: 0 };

// reducer 函数：接收 state 和 action，返回新 state
function reducer(state, action) {
  switch (action.type) {
    case "increment":
      return { count: state.count + 1 };
    case "decrement":
      return { count: state.count - 1 };
    default:
      return state;
  }
}

function Counter() {
  const [state, dispatch] = useReducer(reducer, initialState);

  return (
    <>
      {state.count}
      <button onClick={() => dispatch({ type: "increment" })}>+
      <button onClick={() => dispatch({ type: "decrement" })}>-
    </>
  );
}
```

## 状态管理与通信

## 1. React组件间通信方式

1. 父 → 子：通过props传递。
2. 子 → 父：父组件通过props传递回调函数。
3. 兄弟组件：状态提升到共同父组件，或使用Context/Redux。
4. 深层嵌套：Context API或状态管理库（Redux）。

## 2. Redux的核心概念与流程

1. 三大原则：
  1. **单一数据源**：整个应用的state存储在唯一的store中
  2. **State是只读的**：只能通过触发action改变state
  3. **使用纯函数修改**：通过reducer处理action，返回新的state
2. 核心组成：

- Store：全局状态容器。
- Action：描述状态变化的普通对象（如{ type: 'ADD' }）。
- Reducer：纯函数，接收旧状态和Action，返回新状态。

### Redux数据流动过程

1. 用户通过View触发Action（使用dispatch方法）
2. Store调用Reducer，传入当前State和Action
3. Reducer返回新的State
4. Store通知View更新

### Redux Toolkit的使用

  Redux Toolkit是官方推荐的Redux工具集，简化Redux开发：

- **createSlice**：自动生成action creator和reducer
- **configureStore**：封装createStore，默认包含中间件
- **createAsyncThunk**：处理异步操作

## 3. Context API的使用场景

1. 跨层级组件共享状态（如主题、用户信息），避免逐层传递props。

## 4. Zustand

Zustand 就是一个用 Hook 使用的全局状态管理工具，比 Redux 更简单、比 Context 更高效。
Zustand 是一个轻量级的 React 状态管理库，基于 Hook 和发布订阅模式实现，不需要 Provider，支持按需订阅，从而避免不必要的组件重渲染，相比 Redux 更简洁、相比 Context 性能更好。

```ts
import { create } from 'zustand'

const useStore = create((set) => ({
  count: 0,
  increment: () => set((state) => ({ count: state.count + 1 }))
}))
```

```ts
function Counter() {
  const count = useStore(state => state.count)
  const increment = useStore(state => state.increment)

  return (
    {count}
  )
}
```

## 性能优化

## 1. 如何避免不必要的重渲染？

  a. 类组件：shouldComponentUpdate或继承PureComponent。
  b. 函数组件：React.memo()包裹组件，结合useMemo/useCallback缓存值和函数。

## 2. React.lazy与Suspense的作用

  a. React.lazy：动态导入组件，实现代码分割。
  b. Suspense：包裹懒加载组件，提供加载中的UI（如loading动画）。

### 3. React性能优化方法

- 使用React.memo包装组件，避免不必要的重渲染
- 实现shouldComponentUpdate生命周期方法
- 使用PureComponent
- 合理使用key属性
- 代码分割（Code Splitting）

### 4. useMemo与useCallback的应用

**useMemo**：缓存计算结果

```
const result = useMemo(() => expensiveCalculation(a, b), [a, b]);
```

**useCallback**：缓存函数引用

```jsx
const handleClick = useCallback(() => {
  doSomething(a, b);
}, [a, b]);
```

**使用useMemo模拟useCallback**：

```jsx
const handleClick = useMemo(() => () => {
  doSomething(a, b);
}, [a, b]);
```

## 进阶问题

## 1. React Fiber架构的改进

  a. 目标：实现可中断的异步渲染，解决同步递归更新导致的卡顿问题。
  b. 原理：将渲染任务拆分为多个小任务（Fiber节点），利用浏览器的空闲时间分片执行。

## 2. React 18新特性

  a. 并发模式（Concurrent Mode）：支持优先级调度（如startTransition标记非紧急更新）。
  b. 自动批处理：多个状态更新合并为一次渲染。
  c. 新的Root API：createRoot替代ReactDOM.render。

### 3. React 16、17、18的主要区别

- **React 16**：引入Fiber架构、错误边界、Portals、Fragment等
- **React 17**：改进事件委托机制，便于版本迁移，无重大架构变化
- **React 18**：引入并发渲染、自动批处理、Transitions API等

## 其他重要概念

### 1. Context API

用于组件间共享数据，避免props drilling：

- createContext：创建Context对象
- Provider：提供数据
- Consumer：消费数据

### 2. Error Boundary

捕获子组件树中的JavaScript错误，避免整个应用崩溃：

- componentDidCatch：捕获错误
- static getDerivedStateFromError：渲染备用UI

### 3. setState的同步与异步

- 在组件生命周期和React合成事件中是异步的
- 在setTimeout或原生DOM事件中是同步的
- React 18后统一为异步处理## 补充内容

### 一、Redux源码结构

Redux暴露的核心API包括：

```
import createStore from './createStore';
import combineReducers from './utils/combineReducers';
import bindActionCreators from './utils/bindActionCreators';
import applyMiddleware from './utils/applyMiddleware';
import compose from './utils/compose';

export { createStore, combineReducers, bindActionCreators, applyMiddleware, compose };
```

### 二、高阶组件（HOC）

**定义**：高阶组件是接收组件并返回新组件的函数。 **作用**：复用组件逻辑、修改组件props、包装组件。 **实现方式**：

```
function withLogging(WrappedComponent) {
  return class extends React.Component {
    componentDidMount() {
      console.log('Component mounted');
    }
    render() {
      return <WrappedComponent {...this.props} />;
    }
  };
}
```

### 三、React合成事件实现差异

**React 16**：事件委托到document，统一处理合成事件。 **React 17**：事件委托到应用根节点，不再依赖document，便于多个React版本共存。

### 四、useImperativeHandle

自定义暴露给父组件的实例值，需与forwardRef配合使用：

```
const FancyInput = React.forwardRef((props, ref) => {
  const inputRef = useRef();
  useImperativeHandle(ref, () => ({
    focus: () => {
      inputRef.current.focus();
    }
  }));
  return <input ref={inputRef} />;
});
```

### 五、Redux数据范式化

将嵌套数据转换为扁平结构，便于更新和查询：

```
// 范式化前
{
  posts: [{
    id: 1,
    title: 'Hello World',
    author: { id: 1, name: 'John' }
  }]
}

// 范式化后
{
  posts: { byId: { 1: { id: 1, title: 'Hello World', authorId: 1 } }, allIds: [1] },
  users: { byId: { 1: { id: 1, name: 'John' } }, allIds: [1] }
}
```

### 六、React架构演进

- **React 15**：仅有Reconciler和Renderer，递归更新不可中断
- **React 16**：引入Scheduler，Reconciler基于Fiber重构
- **React 17**：稳定Concurrent Mode，重构优先级算法
- **React 18**：引入自动批处理，Transitions API，并发渲染

### 七、StrictMode

React 16.3新增的开发模式，用于检测不符合最佳实践的代码：

- 识别不安全的生命周期方法
- 检测意外的副作用
- 检测过时的API用法

```
<React.StrictMode>
  <App />
</React.StrictMode>
```

### 八、事件循环与React

- React利用事件循环机制，将更新任务放入宏任务队列
- 使用requestIdleCallback（近似的，真实实现你得看源码）实现时间切片
- 微任务在当前宏任务执行完毕后立即执行
- 高优先级任务可中断低优先级任务执行

### 九、虚拟DOM转Fiber流程

1. 从根节点开始DFS遍历
2. 为每个虚拟DOM节点创建对应的Fiber节点
3. 通过child、sibling、return属性构建Fiber链表
4. 标记需要更新的节点（effectTag）
5. 生成effectList链表，用于commit阶段

## 全都背完还想背看这个 React

## 一、Hooks 原理 & 使用

1. Hooks 的整体执行入口是什么？renderWithHooks 做了什么？
2. Hooks 在 Fiber 上是如何存储的？数据结构是什么？
3. 为什么 Hooks 必须按固定顺序调用？
4. 为什么 Hooks 不能写在条件语句中？
5. Hooks 链表是在什么时候构建的？
6. Hooks 的数据最终存在哪里？
7. currentHook 和 workInProgressHook 分别是什么？
8. mount 和 update 阶段 Hooks 的执行流程有什么不同？
9. useState 的实现原理是什么？
10. useState 的更新队列是如何设计的？
11. setState 做了什么？dispatch 的本质是什么？
12. useEffect 的实现原理是什么？
13. useEffect 是什么时候执行的？
14. useEffect 的依赖数组是如何比较的？
15. useEffect 的清理函数什么时候执行？
16. useEffect 和 useLayoutEffect 的区别是什么？
17. useEffect 中调用 setState 会有什么问题？
18. 什么是闭包陷阱？如何解决？
19. useRef 的原理是什么？
20. useRef 为什么修改不会触发重新渲染？
21. useMemo 的实现原理是什么？
22. useCallback 和 useMemo 的关系是什么？
23. 如何用 useMemo 模拟 useCallback？
24. useReducer 的使用场景是什么？
25. useImperativeHandle 的作用是什么？
26. 自定义 Hook 的本质是什么？
27. 你写过什么样的自定义 Hook？
28. Hooks 相比类组件的优势是什么？
29. React 何时清除 effect？

## 二、Fiber 架构原理

1. 为什么 React 16 要引入 Fiber？
2. Fiber 架构解决了什么问题？
3. Fiber 节点的数据结构是什么？
4. current Fiber Tree 和 workInProgress Fiber Tree 的区别是什么？
5. 双缓存（双 Fiber 树）机制是如何工作的？
6. alternate 指针的作用是什么？
7. FiberRootNode 的作用是什么？
8. React 的 render 和 commit 两个阶段分别做什么？
9. beginWork 做什么？
10. completeWork 做什么？
11. effectList 是什么？如何构建？
12. commit 阶段分为哪几个子阶段？
13. before mutation、mutation、layout 阶段分别做什么？
14. render 阶段为什么可中断？
15. commit 阶段为什么不可中断？
16. performSyncWorkOnRoot 和 performConcurrentWorkOnRoot 的区别？
17. flags（effectTag）的作用是什么？
18. Scheduler 在 Fiber 架构中负责什么？
19. Reconciler 在做什么？
20. Renderer 在做什么？
21. 时间切片（Time Slice）是如何实现的？
22. shouldYield 的作用是什么？
23. 优先级调度是如何实现的？
24. Lanes 模型是什么？

## 三、Reconciliation & Diff

1. 什么是 Reconciliation？
2. Diff 算法的核心策略有哪些？
3. 为什么 Diff 只进行同层比较？
4. 不同 type 的节点会如何处理？
5. key 在 Diff 中起什么作用？
6. 不设置 key 会有什么问题？
7. 为什么不能使用 index 作为 key？
8. 列表更新时 React 如何判断移动、新增、删除？
9. VM（虚拟节点）的比较维度有哪些？
10. VDOM 和 Fiber 的区别是什么？
11. VDOM 转 Fiber 的流程是什么？

## 四、VDOM 原理

1. 什么是 Virtual DOM？
2. 为什么需要 VDOM？
3. VDOM 的优势是什么？
4. React 更新流程的整体步骤是什么？
5. React 为什么不做细粒度更新？
6. React 如何实现多平台渲染？

## 五、React 版本差异

1. React 15、16、17、18 架构演进有什么变化？
2. React 18 的自动批处理机制是什么？
3. startTransition 和 useTransition 是什么？
4. React 18 为什么必须使用 createRoot？
5. React 17 事件系统做了什么调整？
6. React 18 为什么不再支持 IE？
7. StrictMode 的作用是什么？
8. Concurrent Mode 是什么？

## 六、React 事件机制

1. 什么是 React 事件委托？
2. React 合成事件是什么？
3. React 16 和 17 事件机制的区别？
4. React 事件系统如何配合批量更新？
5. 原生事件和 React 事件的区别？

## 七、setState 机制

1. setState 是同步还是异步？
2. 为什么 setState 在不同场景下表现不同？
3. React 18 中 setState 有什么变化？
4. setState 触发更新的流程是什么？

## 八、高阶组件 HOC

1. 什么是高阶组件（HOC）？
2. HOC 和普通组件的区别？
3. HOC 的实现原理是什么？
4. HOC 的常见使用场景？
5. HOC 和 Render Props 的区别？
6. HOC 和 Hooks 的关系？
7. HOC 的缺点有哪些？
8. 如何解决 HOC 的 ref 丢失问题？
9. 如何解决 HOC 静态方法丢失问题？

## 九、Redux 原理

1. Redux 的三大原则是什么？
2. Redux 的数据流是怎样的？
3. Reducer 的作用是什么？
4. Store 的作用是什么？
5. Action 的作用是什么？
6. Redux 的核心 API 有哪些？
7. Redux Toolkit 解决了什么问题？
8. createSlice 做了什么？
9. createAsyncThunk 是干什么的？
10. 如何实现范式化 state？

## 十、生命周期 & 组件模式

1. React 组件生命周期分为哪几个阶段？
2. 类组件的生命周期方法有哪些？
3. Hooks 如何替代生命周期？
4. 受控组件和非受控组件的区别？
5. React 中如何获取表单数据？
6. 什么是 getSnapshotBeforeUpdate？

## 十一、React 思想 & 综合认知题

1. 说说你对 React 的理解。
2. React 的核心特点是什么？
3. React 为什么使用 JSX？
4. React 和 Vue 更新机制的核心差异？
5. React 为什么要从递归架构演进到 Fiber？
6. React 为什么引入优先级调度？
7. React 为什么可以支持多端渲染？
8. React 的整体更新流程是什么？

#### react 不可变数据

在React中，不可变数据（Immutable Data）是指数据一旦创建后，就不能再被直接修改或改变其值。任何对不可变数据的修改都会返回一个新的数据副本，而不是在原有数据上进行修改。

React鼓励使用不可变数据的概念，因为它带来了一些重要的优势：

1. **性能优化：** 使用不可变数据可以帮助React更高效地进行虚拟DOM的比较，从而减少不必要的渲染操作，提升性能。
2. **跟踪变化：** 在React中，通过对比前后两个不同的数据副本，React可以轻松地跟踪数据的变化，从而在需要时精确更新DOM。
3. **数据稳定性：** 不可变数据可以确保数据在多个组件之间传递时保持稳定，不被意外修改。
4. **撤销与重做：** 不可变数据可以方便地实现撤销与重做功能，因为你可以简单地保存历史数据副本。

在JavaScript中，可以通过多种方式实现不可变数据，比如使用Object.assign、展开运算符（...）、数组的map和filter方法等。此外，还可以使用第三方的不可变数据库（如Immutable.js）来处理不可变数据。

示例代码，展示了如何使用展开运算符来创建新的不可变数据：

```jsx
// 不可变数据示例
const originalData = { name: 'John', age: 30 };
// 创建一个新的不可变数据副本
const newData = { ...originalData, age: 31 };
```

#### 介绍hooks

在函数组件中，可以使用useState来定义函数组件的状态。使用useState来创建状态

- 接收一个参数作为初始值
- 返回一个数组，第一个值为状态，第二个值为改变状态的函数

useEffect又称副作用hooks。作用：给没有生命周期的组件，添加结束渲染的信号。执行时机：在渲染结束之后执行 layouteff是渲染结束之前

使用useMemo可以传递一个创建函数和依赖项 复杂计算逻辑的优化

useMemo对比。

- 可以简单这样看作，useMemo(() => Fn,deps)相当于useCallback(Fn,deps)

useCallback是对传过来的回调函数优化，返回的是一个函数；useMemo返回值可以是任何，函数，对象等都可以

useRef就是返回一个子元素索引，此索引在整个生命周期中保持不变。作用也就是：长久保存数据。注意事项，保存的对象发生改变，不通知。属性变更不会重新渲染

#### Fiber 实现原理

Fiber 把一个渲染任务分解为多个渲染任务，而不是一次性完成，把每一个分割得很细的任务视作一个"执行单元"，React 就会检查现在还剩多少时间，如果没有时间就将控制权让出去，故任务会被分散到多个帧里面，中间可以返回至主进程控制执行其他任务，最终实现更流畅的用户体验。

即是实现了"增量渲染"，实现了可中断与恢复，恢复后也可以复用之前的中间状态，并给不同的任务赋予不同的优先级，其中每个任务更新单元为 React Element 对应的 Fiber 节点。

实现的方式是requestIdleCallback这一 API，但 React 团队 polyfill 了这个 API，使其对比原生的浏览器兼容性更好且拓展了特性。

React团队polyfill了requestIdleCallback API，并将其命名为requestIdleCallbackPolyfill，在原生API的基础上做了一些拓展，增加了以下几个特性：

1. 支持快速回调：原生的requestIdleCallback API中，回调函数只会在空闲时间内执行一次。而React团队的polyfill增加了一个名为startRendering的方法，用于在需要立即执行回调函数时，使其**立即执行**。
2. 支持**取消**回调：React团队的polyfill增加了一个名为cancelIdleCallback的方法，用于取消尚未执行的回调函数。
3. 支持多个回调函数：React团队的polyfill增加了一个名为requestIdleCallbackUntil的方法，用于在空闲时间内执行多个回调函数，直到某个回调函数返回false为止。
4. 支持超时：React团队的polyfill增加了一个名为requestIdleCallbackWithTimeout的方法，用于在空闲时间内执行回调函数，并设置一个超时时间，在超时时间内未能执行完回调函数时，自动取消回调函数的执行。

这些拓展特性使得React团队的requestIdleCallback polyfill更加实用和方便，可以在实际开发中更加灵活地应用空闲时间执行一些任务，例如后台数据同步、图片加载等。同时，React团队的polyfill也兼容了原生API的所有主要浏览器，并提供了更加稳定和可靠的性能表现。


本文基于多家中大厂前端暑期实习面试整理，仅聚焦 React 本身，从核心机制、Hooks、渲染流程、性能优化、事件系统、状态管理六个维度进行系统总结。内容按“面试可复述”的标准组织，强调原理 + 为什么 + 实现方式。
一、React 渲染机制
1. React 渲染流程是什么
React 的渲染流程可以拆分为两个阶段：render 阶段和 commit 阶段。
render 阶段的核心是构建 Fiber 树并进行 diff，这一阶段是可中断的，React 会根据调度策略拆分任务，避免长时间阻塞主线程。
commit 阶段负责将变更应用到真实 DOM，这一阶段是不可中断的同步执行，保证 UI 一致性。
完整流程如下：
1.  触发更新 setState dispatch 
2.  进入调度阶段，确定优先级 
3.  render 阶段构建 workInProgress Fiber 树 
4.  收集副作用 effect list 
5.  commit 阶段执行 DOM 更新和副作用 
需要注意的是，React 通过这种“可中断 + 同步提交”的设计，在保证性能的同时确保 UI 不出现中间态。
2. Fiber 架构为什么出现
在 React 早期版本中，diff 过程是递归执行的，一旦组件树较大，会长时间占用主线程，导致页面卡顿。
Fiber 架构的核心目标是解决这个问题。
Fiber 本质上是一个链表结构的虚拟 DOM，每个节点包含组件信息、状态、副作用标记等。相比递归结构，链表可以被中断和恢复，从而实现任务拆分。
Fiber 的核心能力包括：
●  支持任务中断与恢复 
●  支持优先级调度 
●  支持增量渲染 
这也是 React 能实现时间切片和并发特性的基础。
3. React diff 算法原理
React 的 diff 算法核心是“在可接受的性能下完成 UI 更新”，因此采用了一些工程化假设来降低复杂度。
主要策略包括：
第一，只对同一层级节点进行比较，不做跨层移动
第二，不同类型节点直接替换
第三，通过 key 标识节点稳定性
在理想情况下，diff 的复杂度从传统算法的 O(n³) 降低到 O(n)。
key 的作用非常关键，它用于标识节点的唯一性。如果 key 不稳定，比如使用 index，在列表重排时会导致节点错误复用，产生性能问题甚至状态错乱。
二、Hooks 原理
1. Hooks 为什么不能写在条件语句中
Hooks 的本质是通过“调用顺序”来绑定状态的。
在函数组件执行时，React 会维护一个 hooks 链表，每调用一个 Hook，就按顺序取出或创建对应的状态节点。
如果 Hooks 写在条件语句中，会导致执行顺序不一致，从而出现状态错位问题。
因此 Hooks 必须保证：
●  只在函数组件顶层调用 
●  调用顺序稳定 
2. Hooks 的底层实现机制
每个函数组件对应一个 Fiber 节点，其中有一个 memoizedState 字段，指向 hooks 链表。
执行流程如下：
1.  组件首次渲染，创建 hooks 链表 
2.  后续更新时，按顺序复用 hooks 
3.  每个 Hook 节点存储自身状态和更新队列 
这种设计使得 React 可以在函数组件中模拟“实例状态”。
3. useEffect 的执行机制
useEffect 用于处理副作用，其执行时机与依赖数组相关。
常见情况：
●  不传依赖：每次渲染后执行 
●  空数组：只在首次渲染执行 
●  指定依赖：依赖变化时执行 
执行顺序：
1.  render 完成 
2.  浏览器完成绘制 
3.  执行 useEffect 
4. useEffect 清理函数的执行时机
useEffect 可以返回一个函数用于清理副作用。
执行时机有两个：
●  下一次 effect 执行前 
●  组件卸载时 
常见用于：
●  取消订阅 
●  清除定时器 
●  中断请求 
5. useEffect 和 useLayoutEffect 的区别
两者的核心区别在于执行时机：
useEffect 在浏览器绘制之后执行，不会阻塞渲染
useLayoutEffect 在 DOM 更新后、绘制前执行，会阻塞渲染
因此：
●  涉及 DOM 测量使用 useLayoutEffect 
●  普通副作用使用 useEffect 
三、状态更新机制
1. setState 是同步还是异步
这个问题本质是“是否批处理”。
在 React 中：
●  在事件处理函数中，setState 是批量更新的 
●  在异步环境中，可能是同步执行 
在 React 18 中，引入了自动批处理机制，即使在 Promise 或 setTimeout 中也会合并更新。
2. 为什么要使用函数式 setState
当状态更新依赖上一次状态时，必须使用函数式写法：
setCount(prev => prev + 1)
原因是 React 可能会合并多次更新，直接使用旧值会产生错误结果。
四、React 性能优化
1. React 如何避免不必要渲染
常见手段包括：
●  React.memo 控制组件是否重新渲染 
●  useMemo 缓存计算结果 
●  useCallback 缓存函数引用 
核心思想是：
通过浅比较避免重复渲染
2. useMemo 和 useCallback 的区别
useMemo 缓存的是“值”
useCallback 缓存的是“函数”
本质上 useCallback 是 useMemo 的语法糖。
3. key 为什么重要
key 用于标识节点是否可复用。
如果 key 不稳定：
●  会导致组件重新挂载 
●  会丢失内部状态 
●  会增加 DOM 操作 
4. React 长列表优化
常见方案：
●  虚拟列表 
●  分片渲染 
●  懒加载 
核心思想是减少真实 DOM 数量，从而降低渲染成本。
五、React 事件机制
1. React 合成事件是什么
React 并没有直接绑定原生事件，而是封装了一层“合成事件”。
特点：
●  统一浏览器行为 
●  通过事件委托绑定在根节点 
●  提供跨浏览器一致性 
2. 为什么使用事件委托
原因：
●  减少事件绑定数量 
●  提高性能 
●  方便统一管理 
3. 合成事件和原生事件区别
●  React 事件是封装对象 
●  原生事件是浏览器对象 
●  React 通过事件池复用对象（早期版本） 
六、组件与架构设计
1. 函数组件 vs 类组件
函数组件特点：
●  更轻量 
●  使用 Hooks 管理状态 
●  更符合函数式编程 
类组件特点：
●  有生命周期 
●  this 绑定复杂 
当前主流是函数组件。
2. 组件通信方式
常见方式：
●  props 父子通信 
●  context 跨层级 
●  状态管理库 
3. Context 的问题
Context 虽然可以跨层级传递数据，但存在问题：
●  任意值变化会导致所有子组件渲染 
●  不适合高频更新场景 
七、面试高频总结
从面经可以明确当前 React 面试重点集中在：
第一，渲染机制和 Fiber 原理必须能讲清
第二，Hooks 机制必须能解释底层逻辑
第三，useEffect 执行时机是必考点
第四，性能优化要结合实际场景
第五，不能只背概念，必须能解释设计原因