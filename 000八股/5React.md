# React

## 1. Vue vs React

从设计思想上看
1. Vue 更偏向渐进式框架，上手相对简单，模板和逻辑结合紧密，适合中小型项目。
2. React 则强调组件化和函数式编程，使用 JSX 模板，更灵活，适合大型应用。

数据绑定上
1. Vue 默认双向绑定，基于依赖收集的响应式系统（Vue3 使用 Proxy），在组件渲染过程中追踪哪些响应式属性被使用，然后只在这些属性变化时触发最小化更新。
2. React 是单向数据流，需要手动处理更新，本质是“状态驱动重新渲染”，不是像 Vue 那样的细粒度响应式。

## React 核心概念

## 2. React 的特点是什么？

- 组件化（Component-Based）
React 将界面拆分成 独立的组件，每个组件负责一部分 UI，并可以重复使用。

- 声明式（Declarative）
开发者只需要描述 界面在某个状态下应该是什么样子，React 会根据状态变化自动更新界面，而不需要手动操作 DOM。

- 跨平台能力（Learn Once, Write Anywhere）
React 本身只负责 描述 UI 结构，具体的渲染由不同的渲染器完成，因此可以支持 Web、Native 等多平台开发。

## 3. JSX 的本质是什么？

JSX 本质上是 JavaScript 的语法扩展，用于在 JavaScript 中描述 UI 结构。

它最终会被编译成 普通的 JavaScript 函数调用。

在 React 中，JSX 会被 Babel 编译为 React.createElement() 调用，从而生成 React 元素对象，会被用于构建 虚拟 DOM。

## 4. Fiber 的实现原理是什么？ React 的构建流程。
Fiber 是 React 16 引入的新架构。

它的核心思想是把渲染任务拆分成一个个很小的执行单元，每个单元都可以被中断、恢复，并且可以按照优先级调度。每个 React Element 都会对应到一个 Fiber 节点，Fiber 节点通过类似链表的结构把整棵组件树串起来，包含类型、属性、子节点、兄弟节点、返回节点等信息。

React 的渲染流程可以分成两个阶段：
1. **render / 协调阶段**：遍历 Fiber 树，进行 diff，计算出需要更新的内容，这一阶段可以中断，React 会根据调度策略拆分任务，避免长时间阻塞主线程。
2. **commit / 提交阶段**：把变更一次性应用到真实 DOM，这一阶段不可中断，保证 UI 一致性。

React 16 之后通过 Fiber 架构配合调度机制，尽量把耗时任务分片执行，利用浏览器空闲时间处理更新，从而避免长时间阻塞主线程。

### 解决了 React 之前的什么问题？
之前 React 使用递归渲染，一旦开始就不能中断。如果组件树很大，就会长时间占用主线程，导致页面卡顿、交互不流畅。Fiber 把任务拆分后，可以优先响应用户操作，改善大任务渲染带来的卡顿问题。

### 补充
- Fiber 不是简单的虚拟 DOM，而是 React 内部用于描述和调度更新的数据结构。
- 它的优势不仅是“可中断”，还包括任务优先级、增量渲染和更好的用户体验。

### 完整流程如下：
1. 触发更新 setState dispatch
2. 进入调度阶段，确定优先级
3. render 阶段构建 workInProgress Fiber 树
4. 收集副作用 effect list
5. commit 阶段执行 DOM 更新和副作用

## 5. 虚拟 DOM 的原理

作用：减少直接操作真实 DOM 的开销，通过 Diff 算法找出差异后批量更新。

原理：
- 将真实 DOM 树转换为 JS 对象树（Virtual DOM）
- 当组件状态变化时，React 会重新渲染组件，生成 新的 虚拟 DOM 树.
- 通过 Diff 算法 比较新旧虚拟 DOM 树，找出最小变化部分:
- React 根据 Diff 结果，只更新 发生变化的部分 DOM，而不是整个页面。

React 的 Diff 有几个重要策略：
  - 同层比较：只比较在同一层级的节点，不跨层比较，降低了时间复杂度。
  - 不同类型节点直接替换：如果新旧节点类型不同，会直接销毁重建。
  - 通过 key 优化列表更新：列表元素需设置唯一 key 标识，当列表变化时，通过 key 匹配找到可复用节点，减少不必要的销毁和创建。
- 将变化部分批量更新到真实DOM：

## 6. 组件key的作用及缺失的问题

作用：
- key 的租用是给列表中的每个元素一个唯一标识，帮助 React 在 Diff 时 快速识别元素变化、是否可复用。

缺失key的问题：
- 如果缺失 key， React 会默认使用索引作为 key， 当列表增删或排序时，可能导致元素错位更新，比如删除第一个元素，后面元素的索引会变，React 可能误判为 元素内容变化而非位置变化，从而重新创建 DOM。

## 7. 合成事件 SyntheticEvent
React 合成事件是对浏览器原生事件的封装，让事件处理在不同浏览器上表现一致。

它会把所有事件委托到 document 上，统一管理事件监听和移除，避免直接在 DOM 上绑定大量事件。

当事件触发时，React 会生成一个合成事件对象，这个对象和原生事件类似，但有统一的 API，如 stopPropagation、preventDefault。处理完，React 会统一阻止原生事件冒泡，或者根据需要手动调用。

比如列表中大量元素的点击事件，通过委托只需要一个监听。如果不使用合成事件，直接使用原生事件，可能还需要自己处理跨浏览器兼容，还可能因为频繁绑定解绑而导致内存泄漏。

**实现方式**： 在父组件定义事件处理函数，通过 props 传递给子组件，子组件触发事件时调用该函数并传递数据。


## 组件与生命周期

## 8. 类组件与函数组件的区别

组件主要分为 类组件和 函数组件。它们都可以用来构建 UI，但实现方式和使用方式有所不同。

类组件是通过 class 继承 React.Component 定义的，使用 this.state 和 setState 管理状态，并通过生命周期方法管理组件行为。

函数组件是 普通函数，通过 Hooks（如 useState、useEffect） 来管理状态和生命周期，直接接收 props 作为参数，代码更加简洁。

在现代 React 开发中，官方更推荐使用 函数组件 + Hooks。
Component。

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

```ts
import { useState } from "react";
import { useEffect } from "react";


function Counter() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    console.log("组件挂载完成");
  }, []);

  return (
    <button onClick={() => setCount(count + 1)}>
      {count}

  );
}
```

## 9. React 类组件生命周期

1. **初始渲染阶段**：
  - constructor：初始化 state 和绑定方法
  - render：渲染 UI
  - componentDidMount：在组件挂载后执行，适合做数据请求或订阅。
2. **更新阶段**：组件 state 或 props 变化时，会触发更新。
  - shouldComponentUpdate：判断是否需要更新
  - render：重新渲染
  - componentDidUpdate：在更新完后执行，可处理 DOM 更新后的逻辑。
3. **卸载阶段**：
  - componentWillUnmount：在组件卸载前执行，用于清除定时器、取消订阅、移除事件监听，避免内存泄漏。

## 10. 受控组件与非受控组件

在 React 中，表单元素（如 input、textarea、select）可以通过 两种方式管理数据：

- 受控组件
- 非受控组件

区别主要在于：数据由谁管理。

受控组件指的是：表单数据由 React 的 state 完全控制。
输入框的 value 由 state 决定，用户输入时通过 onChange 更新 state。

非受控组件指的是：表单数据由 DOM 自己管理，而不是 React state。
React 通过 ref 获取 DOM 中的值。

一般情况下，React 更推荐使用 受控组件，因为数据更可控，更方便进行表单验证和逻辑处理。
使用非受控组件适合：简单表单、文件上传、不需要实时控制输入

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



## 11. Hooks

是 React 16.8 提供的一组函数，本质上 让函数组件也能使用状态和生命周期等特性。

常用的 Hooks 有 useState，用于声明状态变量和更新函数；

1. useEffect，替代类组件的生命周期，用于处理副作用，比如数据请求、订阅等，可指定依赖项控制时机；

2. useContecxt，方便获取 Context 的值，避免层层传递 props；

3. useReducer，用于复杂状态管理；

4. useCallback 和 useMemo，用于性能优化，缓存函数和计算结果；

5. useRef，获取 DOM 元素或 保存跨渲染周期的变量。

## 11.1 Hooks的规则

  只能在函数组件或自定义 Hooks 的顶层调用（不可在条件、循环中），因为 Hooks 的调用顺序必须固定，这样 React 才能正确匹配每个 Hook 节点。

  在函数组件执行时，React 会维护一个 hooks 链表，每调用一个 Hook，就按顺序取出或创建对应的状态节点。如果 Hooks 写在条件语句中，会导致执行顺序不一致，从而出现状态错位问题。

### 11.2 Hooks 的实现原理

Hooks 的实现依赖于 React 内部的 Fiber 架构和链表结构。

每个组件对应一个 Hooks 链表，每个 Hook 是链表中的一个节点，包含状态值、更新函数、依赖项等信息。

当组件渲染时， React 会按顺序遍历 Hooks 链表，读取或更新每个 Hook 的状态

## 12. useState

  useState：管理组件状态，返回状态值和更新函数（const [count, setCount] = useState(0)）。

```ts
import { useState } from "react";

function Counter() {
  const [count, setCount] = useState(0); // 初始化为 0

  return <button onClick={() => setCount(count + 1)}>{count};
}
```

setState 大多数情况下是异步的，比如在 React 合成事件、生命周期方法中调用时，React 会将多个 setState 合并成一次更新，避免频繁重渲染。

这时候，如果直接用当前 state 计算新的值，可能拿到的还是旧值。

但在原生事件、setTimeout 回调等非 React 控制的环境中，setState 是同步的，会立即更新 state 并触发冲渲染。

因此，如果需要依赖前一状态更新，必须使用 函数形式：setCount(prevCount => prevCount + 1);

在 React 18 中，引入了自动批处理机制，即使在 Promise 或 setTimeout 中也会合并更新。


正确示例：
```ts
  const [count, setCount] = useState(0);
  const [text, setText] = useState("");
  if (show) {
    // 使用 count 或 text，但不要再调用 useState
  }
```

## 13. useEffect

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

### 13.1 useEffect中setState的问题及解决

问题：在 useEffect 中使用 setState 可能导致无限循环

原因：

- 如果 useEffect 没有依赖数组，每次渲染后都会执行
- 执行 setState 会触发重新渲染，导致 useEffect 再次执行

解决方法：

- 添加依赖数组，指定 effect 的依赖项
- 依赖数组为空时，effect 只在组件挂载和卸载时执行一次

### 13.2 useEffect 和 useLayoutEffect 的区别

两者的核心区别在于执行时机：

- useEffect 在浏览器绘制之后执行，不会阻塞渲染
- useLayoutEffect 在 DOM 更新后、绘制前执行，会阻塞渲染

因此：
- 涉及 DOM 测量使用 useLayoutEffect 
- 普通副作用使用 useEffect 

## 14. useRef

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

2. 操作DOM：当你需要直接操作DOM元素时，useRef也非常有用。例如，你需要在组件加载后自动聚焦一个输入框：

```ts
const inputRef = useRef(null);
useEffect(() => {
    inputRef.current.focus();
}, []);
return ;
```

## 15. useMemo 与 useCallback 的区别

useMemo 用于优化组件性能，确保只有在依赖项变化时才重新计算某个值。它可以帮助避免每次渲染时都进行耗时的计算。

useCallback的作用是用于缓存函数的，它确保只有在依赖项变化时才重新创建函数，从而避免子组件不必要的重新渲染。

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

## 16. useMemo vs React.Memo

useMemo 用于缓存计算结果，避免重复计算，优化的是组件内部的计算；React.memo 用于缓存组件渲染，避免不必要的重新渲染，优化的是组件本身的重计算。

```ts
const expensiveValue = useMemo(() => {
  return heavyCompute(a, b);
}, [a, b]);
const Child = React.memo(function Child({ count }) {
  console.log("render");
  return {count};
});
```

## 17. useContext

用于 跨组件共享数据，避免层层传 props，可以替代轻量状态管理方案（如 Redux）

Context 虽然可以跨层级传递数据，但存在问题：

- 任意值变化会导致所有子组件渲染 

- 不适合高频更新场景 

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

### 17.1 如何避免 value 频繁变化导致子组件重复渲染？

- value 发生变化 → 所有依赖该 context 的子组件会重新渲染
- 解决方案：
  - 使用 useMemo 缓存 value
- const value = useMemo(() => ({ theme, toggleTheme }), [theme]);
  - 尽量拆分多个 context，减少不必要的渲染

## 18. useReducer

管理 复杂状态逻辑，比 useState 更适合状态之间有依赖关系或多种更新操作的场景

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

## 19. React组件间通信方式

1. 父 → 子：通过 props 传递。
2. 子 → 父：父组件通过 props 传递回调函数。
3. 兄弟组件：状态提升到共同父组件，或使用 Context/Redux。
4. 深层嵌套：Context API或状态管理库（Redux）。

## 20. Redux 的核心概念与流程

### 核心组成：
- Action 是描述动作的普通对象，包含 type、payload。
- Reducer 是纯函数，接收旧 state 和 Action，返回新 state。
- Store 是存储 state 的对象，通过 createStore 创建，提供 getState、dispatch、subscribe 等方法。

### Redux数据流动过程

1. 组件通过 dispatch 触发Action；
2. Store 将当前的 state 和 action 传入 Reducer；
3. Reducer 计算并返回新的 State
4. Store 更新 state 后通知组件，组件重新渲染更新

## 21. Zustand

Zustand 是一个轻量级的 React 状态管理库，它就一个 create 函数，用来创建 store，里面放状态和修改状态的方法，组件里使用 useStore 钩子直接取状态或调用方法。

基于 Hook 和发布订阅模式实现，不需要 Provider，支持按需订阅，从而避免不必要的组件重渲染，相比 Redux 更简洁、相比 Context 性能更好。

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

## 22. 如何避免不必要的重渲染？React性能优化方法

  a. 函数组件：使用 React.memo()包裹函数组件，缓存组件渲染结果；结合 useMemo /useCallback 缓存计算结果和传递给子组件的函数，避免因引用变化导致子组件重渲染。

  b. 类组件：shouldComponentUpdate 手动判断是否更新 或继承 PureComponent 自动浅比较 props、state。

  c. 合理使用key属性
  
  d. 代码分割（Code Splitting）

## 23. React.lazy与Suspense的作用

  a. React.lazy：动态导入组件，实现代码分割。
  b. Suspense：包裹懒加载组件，提供加载中的UI（如loading动画）。

## 进阶问题

## 23. React Fiber架构的改进

  a. 目标：实现可中断的异步渲染，解决同步递归更新导致的卡顿问题。
  b. 原理：将渲染任务拆分为多个小任务（Fiber节点），利用浏览器的空闲时间分片执行。

## 24. React 18新特性

  a. 并发模式（Concurrent Mode）：支持优先级调度（如startTransition标记非紧急更新）。
  b. 自动批处理：多个状态更新合并为一次渲染。
  c. 新的Root API：createRoot替代ReactDOM.render。

## 25. React 16、17、18的主要区别

- **React 16**：引入Fiber架构、错误边界、Portals、Fragment等
- **React 17**：改进事件委托机制，便于版本迁移，无重大架构变化
- **React 18**：引入并发渲染、自动批处理、Transitions API等

## 26. Error Boundary

捕获子组件树中的JavaScript错误，避免整个应用崩溃：

- componentDidCatch：捕获错误
- static getDerivedStateFromError：渲染备用UI


## 27. 高阶组件（HOC）

**定义**：高阶组件是接收组件并返回新组件的函数。 

**作用**：复用组件逻辑、修改组件props、包装组件。 

**实现方式**：

```js
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

## 28. useImperativeHandle

自定义暴露给父组件的实例值，需与forwardRef配合使用：

```js
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

## 29. Redux数据范式化

将嵌套数据转换为扁平结构，便于更新和查询：

```js
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

## 30. StrictMode

React 16.3新增的开发模式，用于检测不符合最佳实践的代码：

- 识别不安全的生命周期方法
- 检测意外的副作用
- 检测过时的API用法

```
<React.StrictMode>
  <App />
</React.StrictMode>
```

## 31. 事件循环与React

- React利用事件循环机制，将更新任务放入宏任务队列
- 使用requestIdleCallback（近似的，真实实现你得看源码）实现时间切片
- 微任务在当前宏任务执行完毕后立即执行
- 高优先级任务可中断低优先级任务执行

## 32. 虚拟DOM转Fiber流程

1. 从根节点开始DFS遍历
2. 为每个虚拟DOM节点创建对应的Fiber节点
3. 通过child、sibling、return属性构建Fiber链表
4. 标记需要更新的节点（effectTag）
5. 生成effectList链表，用于commit阶段

## 33. react 不可变数据

在React中，不可变数据是指数据一旦创建后，就不能再被直接修改或改变其值。任何对不可变数据的修改都会返回一个新的数据副本，而不是在原有数据上进行修改。

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