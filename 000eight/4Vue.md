# Vue 核心语法与面试笔记

## 1. Vue 的生命周期
Vue 的生命周期分为创建、挂载、更新、销毁四个阶段。

创建阶段有 beforeCreate 和 created，beforeCreate 时 data 和 methods 还未初始化，created 时已初始化，可以访问响应式数据，但是页面 DOM 还没有生成。

挂载阶段有 beforeMount 和 mounted，beforeMount 模板已经编译成虚拟 DOM，但真实 DOM 还没有挂载到页面；mounted 是 DOM 挂载完成，适合操作 DOM。

更新阶段有 beforeUpdate 和 updated，beforeUpdate 是数据更新前，updated 是 DOM 更新后。

销毁阶段有 beforeDestroy 和 destroyed，beforeDestroy 可清除定时器，移除事件监听，destroyed 时组件完全销毁。

Vue3 还的名字有变化，比如
beforeDestroy → beforeUnmount
destroyed → unmounted
，还新增了 setup、onBeforeMount 等 Composition API 生命周期钩子。

## 2. 父子组件生命周期顺序
父组件先创建，子组件先挂载，最后父组件挂载完成；因为父组件要等子组件渲染结束之后，自己才算真正挂载完成。

父组件销毁时，会先销毁子组件，最后再销毁父组件；父组件先进入销毁流程，但会先把自己的子组件全部销毁掉，最后自己才真正销毁完成。

## 1. Vue 核心概览

### 1.2 Setup 的作用与优势

`setup` 是 Vue3 中新增的配置项，组件中用到的：数据、方法、计算属性、监听器、生命周期组合逻辑等，通常都在这里定义。

特点：

- `setup` 会在 `beforeCreate` 之前执行。
- `setup` 中的 `this` 是 `undefined`。
- `setup` 中定义的普通变量默认不是响应式的。
- `setup` 返回的内容可以直接在模板中使用。

```ts
setup(){
    console.log(this) //setup中的this是undefined，Vue3在弱化this了
    // 数据，原来是写在data中的，此时的name、age、tel都不是响应式的数据
    let name = '张三'
    let age = 18
    let tel = '13888888888'

    // 方法
    function changeName() {
      name = 'zhang-san' //注意：这样修改name，页面是没有变化的
      console.log(name) //name确实改了，但name不是响应式的
    }
    function changeAge() {
      age += 1 //注意：这样修改age，页面是没有变化的
      console.log(age) //age确实改了，但age不是响应式的
    }
    function showTel() {
      alert(tel)
    }

    // 将数据、方法交出去，模板中才可以使用
    return {name,age,tel,changeName,changeAge,showTel}
  }
```

`setup` 的返回值有两种常见形式：

1. **返回对象**：对象中的属性和方法可以直接在模板中使用。
2. **返回函数**：可以自定义渲染内容，例如：

```ts
setup() {
  return () => '你好啊！'
}
```

### `setup` 与 Options API 的关系

- `setup` 可以访问到后续 Options API 中暴露到模板的内容的使用场景有限，实际开发中更常见的是组合式逻辑独立管理。
- Vue2 的 `data`、`methods` 等在 `setup` 中不能直接访问。
- 如果与 Vue2 配置冲突，通常 `setup` 优先。
- `setup` 内不能使用 `this`。

### `script setup` 语法糖

`setup` 是 Vue3 组合式 API 的入口，执行时机早于 `beforeCreate`，里面没有 `this`。它最大的作用是把相关逻辑集中组织起来，而且返回的变量可以直接给模板用。`<script setup>` 则是更简洁的写法，它把 `setup` 中需要写的返回逻辑省略掉了，模板中可直接使用脚本内声明的变量和函数。

```html
<template>
  <div class="person">
    <h2>姓名：{{name}}</h2>
    <h2>年龄：{{age}}</h2>
    <button @click="changName">修改名字</button>
    <button @click="changAge">年龄+1</button>
    <button @click="showTel">点我查看联系方式</button>
  </div>
</template>

<script lang="ts">
  export default {
    name:'Person',
  }
</script>

<!-- 下面的写法是setup语法糖 -->
<script setup lang="ts">
  console.log(this) //undefined

  // 数据（注意：此时的name、age、tel都不是响应式数据）
  let name = '张三'
  let age = 18
  let tel = '13888888888'

  // 方法
  function changName(){
    name = '李四'//注意：此时这么修改name页面是不变化的
  }
  function changAge(){
    console.log(age)
    age += 1 //注意：此时这么修改age页面是不变化的
  }
  function showTel(){
    alert(tel)
  }
</script>
```

### 1.3 Vue2 与 Vue3 的区别

- **响应式系统**：Vue2 使用 `Object.defineProperty`，无法监听新增/删除属性，性能稍低；Vue3 改用 `Proxy`，支持深层对象和数组监听。
- **Options API vs Composition API**：
  - Vue2 的主要写法是 Options API，按照 data、methods、watch 等选项来组织代码，但当组件变大时，相关逻辑会被拆散；
  - Vue3 提供更灵活的代码组织方式，替代 Options API 的逻辑分散问题，通过 setup 函数按功能逻辑组织代码。
- **性能优化**：Vue2 Diff 算法优化有限；Vue3 通过静态提升（Static Hoisting）和 Patch Flag 减少虚拟 DOM 对比开销。
- **TypeScript 支持**：Vue3 的类型推导和工程化体验更好。

---

## 2. 组合式 API、响应式基础与原理

### 2.1 `ref`

`ref` 用于创建响应式数据，既可以包基本类型，也可以包对象类型。

- **基本类型**：如字符串、数字、布尔值等。
- **对象类型**：内部本质上也是调用了`reactive`函数，也会转成响应式对象。

特点：

- JS 中访问需要 `.value`。
- 模板中会自动解包，直接写变量名即可。
- `ref` 的核心是它返回一个带 `value` 属性的响应式对象。

适用场景：

- 单值数据。
- 表单字段。
- 需要整体替换的数据。

### 2.2 `reactive`

`reactive` 用于创建对象类型的响应式数据，本质上是通过 `Proxy` 返回一个代理对象。

特点：

- 只能接收对象类型，基本类型不能直接用 `reactive`。
- 支持深层次响应式。
- 直接通过属性访问，不需要 `.value`。
- 重新赋值一个新对象时会失去响应式，需要用 `Object.assign` 做整体替换。

适用场景：

- 表单对象。
- 结构较深的数据。
- 多字段对象状态。

### 2.3 `ref` 与 `reactive` 对比

1. `ref` 可以定义基本类型，也可以定义对象类型，本质是一个对象；通`Object.defineProperty` 的 `getter/setter` 拦截 `.value`，需要通过 `.value` 访问。使用场景：单值、简单类型。
2. `reactive` 只能定义对象类型，通过 **Proxy 拦截属性访问**；reactive 可以直接访问属性。使用场景：对象/数组。
3. **重新赋值**：`reactive` 重新赋值会丢失响应式；`ref` 不会。
  **解构传参**：`reactive` 解构或传参会丢失响应式；`ref` 传递整个容器时保持响应式。

使用原则：

1. 基本类型必须使用 `ref`。
2. 响应式对象且层级不深时，`ref` 和 `reactive` 都可以。
3. 响应式对象且层级较深时，推荐使用 `reactive`。
4. 表单相关数据推荐使用 `reactive`。

### 2.4 `toRef` 与 `toRefs`

`toRef` 和 `toRefs` 的作用，是把响应式对象中的属性转换成独立的 `ref` 对象。

- `toRef`：一次转换一个属性。
- `toRefs`：可以批量转换多个属性。

常见用途：

- 解构响应式对象时，避免丢失响应式。
- 把响应式对象中的部分字段单独拿出来使用。

示例理解：

- `toRefs(person)` 会把 `person` 里的每个键值对都转成 `ref`。
- `toRef(person, 'age')` 则只把 `age` 这个属性转成 `ref`。

```js
// 数据
let person = reactive({name:'张三', age:18, gender:'男'})

// 通过toRefs将person对象中的n个属性批量取出，且依然保持响应式的能力
let {name,gender} =  toRefs(person)

// 通过toRef将person对象中的gender属性取出，且依然保持响应式的能力
let age = toRef(person,'age')
```

### 2.5 `computed` 计算属性

`computed` 是用来根据已有数据计算新数据的，而且它有缓存。只要依赖不变，多次访问也不会重复算。它更适合做派生值，而不是副作用逻辑。

底层借助了object.defineproperty方法提供的getter和setter

特点：

- 有缓存机制。
- 依赖不变时不会重复计算。
- 只有依赖变化后才会重新求值。
- 可以是只读，也可以通过 `get` / `set` 进行读写。

两种写法：

1. **只读计算属性**
2. **可读可写计算属性**

`computed` 的本质是基于依赖追踪和缓存机制实现的。

**computed 内部通过一个 lazy 的 effect 来管理**

  1️⃣ 依赖收集（track）

  2️⃣ dirty 标记（是否需要重新计算）

  3️⃣ lazy effect（懒执行）

### 2.6 `watch` 监听

`watch` 是明确监视某个数据的变化，适合做副作用，比如请求接口。它可以监视 `ref`、`reactive`、getter 函数和数组，支持深度监听和立即执行。

Vue3 中 `watch` 主要可以监视四类数据：

1. `ref` 定义的数据
2. `reactive` 定义的数据
3. 函数返回的值（getter）
4. 包含上述内容的数组

`watch` 的参数一般包括：

- 第一个参数：被监视的数据
- 第二个参数：回调函数
- 第三个参数：配置对象，如 `deep`、`immediate`

### 2.7  `watch` 与 `computed` 的区别

### `computed`

- 作用：生成派生值
- 有缓存
- 只有依赖变化后才重新计算
- 适合模板展示或逻辑判断

### `watch`

- 作用：监听变化并执行副作用
- 没有缓存
- 适合请求接口、异步处理、联动逻辑
- 支持立即执行和深度监听

### 2.8 监视 `ref` 定义的基本类型

#### 详细解答版

监视 `ref` 基本类型时，直接写变量名即可，监视的是其 `value` 的变化。

特点：

- 不需要写 `.value`
- 可通过返回的停止函数停止监听
- 适合简单状态变化监控

### 2.9 监视 `ref` 定义的对象类型

#### 详细解答版

监视 `ref` 对象类型时，直接写变量名，默认监视的是整个对象的地址值。

注意：

- 修改对象内部属性时，需要手动开启深度监听。
- 若修改的是对象内部属性，`newValue` 和 `oldValue` 可能是同一个对象。
- 若整体替换对象，`newValue` 和 `oldValue` 才是不同对象。

### 2.10 监视 `reactive` 定义的对象类型

`reactive` 定义的对象默认就是深度监视的，不能像 `ref` 那样直接关闭深度监听。

特点：

- 修改对象内部属性时会被直接监听到。
- 适合复杂对象状态追踪。
- 重新赋值新对象会丢失响应式，需要用 `Object.assign` 做整体替换。

### 2.11 监视对象中的某个属性

当监视 `ref` 或 `reactive` 中某个属性时，通常推荐写成函数形式。

规则：

- 若被监视属性是基本类型，必须写函数，如 `() => person.name`
- 若被监视属性本身还是对象类型，可以直接写，也可以写函数，但推荐写函数
- 如果想监听对象内部变化，需要开启深度监听

### 2.12 监视多个数据

`watch` 支持数组形式，同时监视多个来源。

可以监视：

- 多个 `ref`
- `getter` + `reactive`
- 多个属性组合

适用于多个数据共同决定同一个副作用的场景。

### 2.13 `watchEffect`

`watchEffect` 是立即执行一个函数，并自动追踪函数中用到的所有响应式依赖，依赖变化时自动重新执行。

与 `watch` 的区别：

- `watch`：要明确指定监视什么
- `watchEffect`：不用明确指定，函数里用了什么就监听什么
- `watch` 更适合明确的数据监听
- `watchEffect` 更适合依赖自动收集的副作用场景

### 2.14 `watch` 与 `watchEffect` 的区别

`watch` 需要明确指定监听目标；`watchEffect` 不需要明确指定，函数里用到的响应式数据都会被自动收集。

区别：

- `watch`：更精确，能拿到新旧值
- `watchEffect`：更省事，自动追踪依赖

---

## 3. 模板引用、组件暴露与组件通信

### 3.1 模板引用：`ref` 属性

`ref` 属性用于注册模板引用，可以用在普通 DOM 标签上，也可以用在组件标签上。

### 用在普通 DOM 标签上

- 获取的是 DOM 节点
- 常用于操作焦点、取值、尺寸、文本内容等

### 用在组件标签上

- 获取的是子组件实例对象
- 需要配合 `defineExpose` 暴露子组件中的数据或方法

`defineExpose` 的作用就是把子组件内部指定的内容暴露给父组件使用。

### 3.2 `props` 与 `emit` 组件通信

父子组件通信是 Vue 中最常见的通信方式。

### 父传子：`props`

父组件通过属性向子组件传值，子组件通过 `defineProps` 接收。

注意：

- `props` 是单向数据流
- 子组件不应该直接修改 `props`
- 如果需要修改，应该通过 `emit` 通知父组件修改，或者本地拷贝一份

### 子传父：`emit`

子组件通过 `defineEmits` 注册事件，然后用 `emit('事件名', 参数)` 通知父组件。

这种模式遵循“数据自上而下，事件自下而上”的原则。

### 3.3 组件间通信

Vue 常见组件通信方式包括：

1. **父子通信**：`props` / `emit`
2. **兄弟通信**：状态提升到共同父组件，或使用事件总线（Vue2 常见）
3. **跨层级通信**：`provide` / `inject`
4. **全局状态管理**：Pinia / Vuex
5. **直接访问子组件**：`ref` + `defineExpose`

### 3.4 兄弟组件通信、跨层级通信与全局状态

#### 兄弟通信

- 通过共同父组件中转状态
- 或使用 EventBus（Vue2 中常见）

#### 跨层级通信

- 通过 `provide` 提供数据，后代用 `inject` 注入
- 注意：若要响应式，建议传递 `ref` 或 `reactive`

#### 全局状态管理

- Vue3 推荐 Pinia
- Vue2 常用 Vuex

#### 直接访问子组件

- 父组件通过 `ref` 获取子组件实例
- 子组件通过 `defineExpose` 暴露方法与状态

### 3.5 动态组件与异步组件

### 动态组件

使用 `<component :is="componentName">` 动态渲染不同组件。

使用场景：

- Tab 切换
- 步骤表单
- 条件渲染不同子模块

### 异步组件

使用 `defineAsyncComponent` 或动态 `import` 按需加载组件。

优点：

- 减少首屏包体积
- 提高加载效率
- 更适合大型页面、弹窗、路由懒加载

### 3.6 插槽（Slots）

插槽用于内容分发，让父组件向子组件传递模板结构，而不是只传数据。

### 默认插槽

- 子组件中使用 `<slot>`接收父组件内容
- 父组件传入默认内容

### 具名插槽

- 用 `name` 区分不同插槽位置
- 父组件通过 `#header`、`#footer` 等指定内容，适用于**组件内部有多个插入区域**

### 作用域插槽

- 子组件把数据暴露给父组件
- 父组件自定义渲染方式
- 常用于表格、列表等场景

---

## 4. 生命周期与自定义 Hook

### 4.1 生命周期

生命周期是 Vue 组件从创建到卸载过程中经历的一系列阶段。

整体分为四类：

1. 创建：组件实例建立，响应式数据与配置开始初始化
2. 挂载：模板渲染到真实 DOM，页面首次可见
3. 更新：数据变化导致虚拟 DOM 和真实 DOM 更新
4. 销毁 / 卸载：组件退出页面，清理副作用、事件、定时器等资源

### Vue2 生命周期

- 创建阶段：`beforeCreate`、`created`
- 挂载阶段：`beforeMount`、`mounted`
- 更新阶段：`beforeUpdate`、`updated`
- 销毁阶段：`beforeDestroy`、`destroyed`

### Vue3 生命周期

- 创建阶段：`setup`
- 挂载阶段：`onBeforeMount`、`onMounted`
- 更新阶段：`onBeforeUpdate`、`onUpdated`
- 卸载阶段：`onBeforeUnmount`、`onUnmounted`

常用钩子：

- `onMounted`：挂载完毕后
- `onUpdated`：更新完毕后
- `onBeforeUnmount`：卸载之前

Vue3 保留了生命周期的核心逻辑，但做了以下调整：

1. **命名调整**：部分钩子名称前缀改为 `on`，如 `mounted` → `onMounted`，`destroyed` → `onUnmounted`（更直观表达 “卸载” 含义）。
2. **合并钩子**：`beforeCreate` 和 `created` 被 `setup` 函数替代（`setup` 在组件初始化时执行，相当于这两个钩子的合并）。`setup` 是 Composition API 的核心入口函数，会在 **组件实例初始化后、**`props` **解析完成**，且 `beforeCreate` **生命周期钩子之前** 执行。
3. **使用方式**：需从 `vue` 中显式导入，配合 Composition API 使用，例如：

### 父子组件生命周期执行顺序

创建时，父组件先创建实例，然后创建子组件，
挂载时，子组件先完成 mounted，最后父组件 mounted。
更新阶段，父组件触发更新（父 beforeUpdate 先执行），然后子组件更新完成（子updated 先完成），最后父组件 updated；
销毁时，父 beforeDestroy 先执行，子 destroyed 先完成，父组件最后 destroyed。
本质原因是**子组件依赖父组件的渲染结果**，必须等**子组件完成后父组件才算真正完成。**

```HTML
父 beforeCreate
父 created
子 beforeCreate
子 created
子 beforeMount
子 mounted
父 beforeMount
父 mounted
父 beforeDestroy
子 beforeDestroy
子 destroyed
父 destroyed
```

### 4.2 `mounted` 发请求的原因

在 `mounted` 中发请求，主要是因为此时组件已经完成挂载，DOM 已可用，适合进行依赖页面状态的初始化操作，例如：

- 首屏接口请求
- 获取尺寸信息
- 绑定需要 DOM 的第三方库

### 4.3 `unmounted` 时如何清理副作用

组件卸载时常见的清理包括：

- 清理定时器
- 取消事件监听
- 取消未完成的异步请求
- 清除第三方库实例

目的是避免内存泄漏和无效更新。

### 4.4 自定义 Hook

自定义 Hook 本质上是一个函数，它把 `setup` 中使用的 Composition API 封装起来，类似 Vue2 中的 `mixin`，但更清晰、更灵活。

优势：

- 复用逻辑
- 提高 `setup` 的可读性
- 让业务功能拆分更清楚

例如：

- `useSum` 用于管理加减逻辑
- `useDog` 用于封装请求逻辑和数据状态

---

## 5. 指令、渲染与模板机制

### 7.1 常用 Vue 指令

常用指令包括：

- `v-if` / `v-else-if` / `v-else`：条件渲染
- `v-show`：控制显示隐藏
- `v-for`：列表渲染
- `v-on` / `@`：事件绑定
- `v-bind` / `:`：属性绑定
- `v-model`：双向绑定

### 7.2 `v-if` 与 `v-show` 的区别

### `v-if`

- 条件成立才渲染
- 切换时会创建或销毁 DOM
- 初次渲染开销较小
- 适合不频繁切换的场景

### `v-show`

- 元素始终渲染在 DOM 中
- 通过 `display: none` 控制显示隐藏
- 切换成本低
- 适合频繁切换场景

补充：

- v-show 是通过设置display: none 来控制元素显示隐藏，因此元素不会占据布局空间。当切换时会触发重排和重绘。
- 而 visibility: hidden 只是让元素不可见，但仍然占据原有布局空间，只会触发重绘，不会触发重排，因此切换成本更低。

### 7.3 `v-for` 为什么要 `key`

`key` 的作用是唯一标识节点身份，帮助 Diff 算法准确复用节点。

如果没有 `key`：

- Vue 会采用就地复用策略
- 列表插入、删除、排序时可能复用错节点
- 容易导致输入框、checkbox、组件状态错位

如果使用唯一且稳定的 `key`：

- 可准确判断新增、删除、移动
- 提高 Diff 效率
- 保证节点状态稳定

### 7.4 v-on / @ 绑定事件

编译时绑定事件，原生 DOM 事件直接绑定，自定义事件通过emit调用事件派发器触发。常见事件修饰符：

- .stop：阻止冒泡
- .prevent：阻止默认行为
- .self：仅自身触发
- .once：只触发一次

### 7.5 模板渲染流程

Vue 模板渲染过程大致分为：

1. **解析**：将模板字符串解析成 AST（抽象语法树）
2. **优化**：标记静态节点，方便后续 Diff 直接跳过。
3. **生成代码**：把 AST 生成可执行的 render 函数。
4. **执行 render**：再由 render 函数生成虚拟 DOM（VNode）。
5. **Diff 更新**：对比新旧 VNode，将差异更新到真实 DOM。

### 7.6 虚拟 DOM 与 Diff 算法的作用

1. **虚拟 DOM**：用 JavaScript 对象描述真实 DOM 结构；更新数据时先在虚拟 DOM 上操作，最后批量更新真实 DOM，减少直接操作 DOM，提高性能。
2. **Diff 算法**：在每次数据发生变化前，虚拟 dom 都会缓存一份；当数据变化时，对比新旧虚拟 DOM 树；只更新变化的节点，避免整个树重渲染。
3. **Diff 的核心优化点**：同级节点优先比较；通过 key 唯一标识节点；复用已有节点。
  1. **同级对比**：只比较**同一层级**的节点（比如 div 的子节点只和 div 的子节点比，不跨层级比较父节点和子节点），把复杂度从 **O (n³) 降到 O (n)**（n 是节点数量），效率极大提升。tag 和 key 两者都相同，则认为是相同节点，不再深度比较。
  2. **Key 的作用**：列表渲染时，**key 是给每一个 vnode 的唯一 id**。Diff 算法通过 Key 判断节点是否是同一个：
    - 若 Key 相同，**说明是同一个节点，只需更新内容（如文本、属性）**，无需销毁重建（比如列表项顺序变化时，复用节点而不是重新创建）。
    - 若 Key 不同，**才会销毁旧节点、创建新节点**。
    - 但会产生一些隐藏的副作用，比如可能不会产生过渡效果，或者在某些节点有绑定数据（表单）状态，会出现状态错位）。
4. **性能优化实践**：
  - 静态节点提升（hoistStatic）
  - 异步组件（defineAsyncComponent + Suspense）
  - keep-alive 缓存组件
  - v-once、v-memo 等静态标记。
5. **Vue3 Diff 进一步优化**：通过双端比较和最长递增子序列算法，减少 DOM 移动，提高性能。

### 7.7 Vue3 静态提升与 Block Tree

### 静态提升

静态提升是把静态节点提升到 render 函数外，只创建一次，后续更新直接复用，不再重复创建。

作用：

- 减少内存开销
- 降低重复创建静态节点的成本

### Block Tree

Block Tree 会给动态节点打上 Patch Flag，在 Diff 时只比对动态内容，跳过静态节点。

作用：

- 缩小 Diff 范围
- 提高更新效率
- 更有针对性地处理动态内容

### 7.8 异步更新队列与 `nextTick`

Vue 的数据更新不是同步直接改 DOM，而是先进入异步更新队列，统一批量刷新。

这带来两个特点：

- 同一事件循环内多次修改数据，最终可能只更新一次视图
- 修改完数据后立刻读取 DOM，往往拿不到最新结果

此时就需要 `nextTick`：

- 在 DOM 更新完成后执行回调
- 确保拿到最新 DOM 状态

使用场景：

- 数据修改后立即读取 DOM
- 需要等待页面渲染完成再执行逻辑
- 表单、滚动、测量尺寸等场景

### 7.9 Vue2 响应式原理与更新流程

Vue 的响应式系统核心更准确地说是 **观察者模式**，并融合了 **发布-订阅思想** 来做依赖管理。

#### 1. 观察者模式在 Vue 中的体现

Vue2 的响应式核心是 **数据劫持 + 依赖收集 + 触发更新**。在创建 Vue 实例时，会遍历 `data` 中的属性，并使用 `Object.defineProperty` 给每个属性定义 `getter` 和 `setter`。

- **被观察者（Subject）**：响应式数据
- **观察者（Observer）**：`Watcher`
- **通知者**：数据变化时触发 `setter`，再通知对应的 `Watcher` 更新视图

#### 2. 发布-订阅思想在 Vue 中的体现

Vue2 里的 `Dep` 更像一个中间调度中心，负责收集依赖并统一通知更新：

- 数据变化可以理解为“发布”
- `Watcher` 可以理解为“订阅者”
- `Dep` 负责把两者连接起来

但要注意：

- **观察者模式**：观察者通常是直接依赖被观察者，关系更直接
- **发布-订阅模式**：发布者和订阅者之间通常隔着事件中心/消息中心，解耦更强

#### 3. Vue 中两者的区别理解

- 从实现本质看，Vue2 的响应式更偏向 **观察者模式**
- 从依赖管理结构看，`Dep` 又带有 **发布-订阅模式** 的思想
- 所以面试时可以说：**Vue 响应式原理核心是观察者模式，同时借鉴了发布-订阅模式的设计思想**

#### 核心流程

#### 核心流程

1. 组件初始化时，Vue 会把 `data` 里的属性转换成可监听的响应式属性。
2. 组件渲染时访问这些属性，会触发 `getter`。
3. `getter` 内部会做依赖收集，把当前的 `Watcher` 收集到 `Dep` 中。
4. 当数据发生变化时，会触发 `setter`。
5. `setter` 会通知 `Dep` 中依赖这个数据的 `Watcher` 重新执行。
6. `Watcher` 重新渲染组件，最终更新视图。

#### 关键词理解

- `Dep`：依赖收集器，负责保存“谁在用这个数据”。
- `Watcher`：观察者，负责在数据变化后重新执行渲染或回调。
- `getter`：读取时收集依赖。
- `setter`：修改时触发更新。

#### Vue2 的局限性

- 不能监听 **属性新增 / 删除**。
- 不能直接监听 **数组下标修改**。
- 初始化阶段需要 **递归遍历对象**，性能开销较大。

原因在于 `Object.defineProperty` 是基于“已有属性”做劫持的，只能在初始化时给属性添加 `getter` / `setter`。后续新增属性不会自动被拦截，`delete` 删除属性也不会触发 `setter`。

对于数组，Vue2 通过重写 `push`、`pop`、`splice` 等方法来实现响应式，因此直接通过索引修改数组，不一定能触发更新。

#### 双向绑定本质

Vue 的双向绑定本质上是：**响应式系统 + 事件监听**。

- 数据到视图：依赖响应式系统自动更新。
- 视图到数据：通过事件监听，比如 `v-model` 本质上是 `:value` + `@input`。

所以双向绑定并不是“魔法”，而是响应式和事件机制的组合。

### 7.10 Vue3 响应式原理、依赖跟踪与对比总结

Vue3 使用 **Proxy + Reflect** 重构了响应式系统。

#### Proxy 和 Reflect

- `Proxy`：拦截对象任意属性的读取、修改、添加、删除。
- `Reflect`：以函数方式操作原对象，通常配合 `Proxy` 使用，保证默认行为和 `this` 绑定正确。

#### Vue3 的核心流程

1. `reactive` 返回一个代理对象 `Proxy`。
2. 组件渲染或 `effect` 执行时，会读取响应式数据。
3. 读取时触发 `get`，执行 `track` 收集依赖。
4. 数据变化时触发 `set` 或 `deleteProperty`，执行 `trigger` 派发更新。
5. 依赖这个属性的 `effect` / 组件渲染函数重新执行，视图更新。

#### 简化版依赖结构

Vue3 常用下面的结构存储依赖关系：

- `WeakMap`：以对象为维度保存依赖。
- `Map`：以属性 key 为维度保存依赖。
- `Set`：保存依赖这个属性的副作用函数 `effect`。

#### 简化示例

```ts
let person = {
  name: '张三',
  age: 18
}

const bucket = new WeakMap()
let activeEffect = null

function effect(fn) {
  activeEffect = fn
  fn()
  activeEffect = null
}

function track(target, key) {
  if (!activeEffect) return

  let depsMap = bucket.get(target)
  if (!depsMap) {
    depsMap = new Map()
    bucket.set(target, depsMap)
  }

  let dep = depsMap.get(key)
  if (!dep) {
    dep = new Set()
    depsMap.set(key, dep)
  }

  dep.add(activeEffect)
}

function trigger(target, key) {
  const depsMap = bucket.get(target)
  if (!depsMap) return

  const dep = depsMap.get(key)
  if (!dep) return

  dep.forEach(fn => fn())
}

const p = new Proxy(person, {
  get(target, propName) {
    track(target, propName)
    return Reflect.get(target, propName)
  },
  set(target, propName, value) {
    const result = Reflect.set(target, propName, value)
    trigger(target, propName)
    return result
  },
  deleteProperty(target, propName) {
    const result = Reflect.deleteProperty(target, propName)
    trigger(target, propName)
    return result
  }
})
```

#### Vue3 的优点

- 可以监听 **新增 / 删除属性**。
- 更好支持 **数组操作**。
- 采用 **惰性代理**，性能更好。
- 依赖收集更加完整、实现更统一。

#### `Proxy` vs `Object.defineProperty`

- `Object.defineProperty`
  - 只能拦截已有属性
  - 无法监听新增 / 删除
  - 数组处理不够完善
  - 需要递归遍历对象

- `Proxy`
  - 可以代理整个对象
  - 可以监听新增、删除、修改
  - 能更好支持数组
  - 按需代理，性能更优

#### 响应式的完整理解

Vue2 和 Vue3 的核心思路其实一致，都是：

- 读取数据时收集依赖
- 数据变化时触发更新

区别只是在于实现方式不同：

- Vue2 用 `Object.defineProperty` + `Watcher` + `Dep`
- Vue3 用 `Proxy` + `effect` + `track` + `trigger`

#### 视图自动更新与双向绑定

视图自动更新流程可以概括为：

1. 初始化时解析模板并建立依赖。
2. 数据变化时触发更新。
3. 更新通过虚拟 DOM Diff 反映到真实 DOM。
4. 通过事件监听把视图输入同步回数据。

因此，`v-model` 本质上是：**`value` 绑定 + 输入事件监听 + 响应式更新**。

### 7.11 响应式原理小结

- Vue2 依赖 `Object.defineProperty`，本质是对“已有属性”做劫持。
- Vue3 依赖 `Proxy`，可以对整个对象做更完整的代理。
- 响应式系统的本质都是依赖收集和派发更新。
- `track` 负责收集依赖，`trigger` 负责触发更新。
- `effect` 是真正执行副作用逻辑的函数，组件渲染函数可以看作一种特殊的 `effect`。

---

## 8. 路由相关知识

### 8.1 Vue Router 的导航守卫

Vue Router 的导航守卫分为三类：

1. **全局守卫**
  - `beforeEach`
  - `beforeResolve`
  - `afterEach`
2. **路由独享守卫**
  - `beforeEnter`
3. **组件内守卫**
  - `beforeRouteEnter`
  - `beforeRouteUpdate`
  - `beforeRouteLeave`

### 使用场景

- 登录校验、权限控制、白名单：`beforeEach`
- 依赖最终路由状态的处理：`beforeResolve`
- 埋点、页面标题、收尾逻辑：`afterEach`
- 某个路由特殊控制：`beforeEnter`
- 进入 / 更新 / 离开页面时做特定处理：组件内守卫

### 8.2 路由监听

Vue3 中可以通过 `watch` 监听 `router.currentRoute`，也可以通过 `onBeforeRouteUpdate` 监听路由变化。

适用场景：

- 路由参数变化时重新请求数据
- 监听同组件复用下的路由更新
- 记录路由变化日志

### 8.3 `$route` 和 `$router` 的区别

- `$router`：路由实例对象，用于跳转和控制导航，如 `push`、`replace`、`go`
- `$route`：当前激活路由信息对象，用于读取路由参数、路径、查询等信息，不能直接跳转

### 8.4 页面跳转的三种方式

常见有三种方式：

1. 直接修改地址栏
2. 编程式导航：`router.push()`、`router.replace()`
3. 声明式导航：`<router-link to="...">`

### 8.5 路由懒加载

路由懒加载通过动态 `import` 将组件拆成独立代码块，访问路由时再加载。

优点：

- 减少首屏体积
- 提升首屏加载速度
- 适合页面较多的项目

### 8.6 路由导航钩子

Vue Router 提供三类导航钩子：

1. **全局前置守卫**：`router.beforeEach`
2. **全局后置钩子**：`router.afterEach`
```
// 全局前置守卫（常用于鉴权）
router.beforeEach((to, from, next) => {
  // to：要进入的目标路由对象
  // from：当前导航正要离开的路由
  // next：必须调用，决定是否放行
  next()
})

// 全局后置钩子（没有 next）
router.afterEach((to, from) => {
  // 例如：埋点、关闭 loading
})
```
3. **路由独享守卫**：`beforeEnter`
```
{
  path: '/about',
  component: About,
  beforeEnter: (to, from, next) => {
    console.log('进入 About 前触发')
    next()
  }
}
```
4. **组件内守卫**：`beforeRouteEnter`、`beforeRouteUpdate`、`beforeRouteLeave`
```
export default {
  beforeRouteEnter(to, from, next) {
    // 在渲染该组件的对应路由被 confirm 前调用
    // 注意：此时不能访问 this
    next()
  },
  beforeRouteUpdate(to, from, next) {
    // 路由改变、组件被复用时调用
    next()
  },
  beforeRouteLeave(to, from, next) {
    // 导航离开该组件对应路由时调用
    next()
  }
}
```

### 8.7 路由模式

Vue Router 常见路由模式有：

### hash 模式

- URL 中带 `#`
- 兼容性好
- 不需要后端额外配置
- 不利于 URL 美观

### history 模式

- 基于 History API
- URL 更美观
- 更适合 SEO
- 刷新或直接访问深层路径时，需要服务器做兜底配置，否则可能 404

### 8.8 Router 的导航守卫与监听总结

Vue Router 的守卫用于控制路由跳转流程，全局守卫适合通用的权限和登录控制，路由独享守卫适合单页面特殊逻辑，组件内守卫更关注页面级生命周期和用户操作控制。

Vue3 中也可以通过 `watch` 或 `onBeforeRouteUpdate` 监听路由变化，以便在参数变化时同步刷新数据。

---

## 9. 状态管理与全局数据

### 9.1 Vuex 的核心概念

Vuex 主要概念包括：

 - State：用于存储全局共享数据。
 - Mutations：同步修改状态（通过 commit 触发）。
 - Actions：负责处理业务逻辑和异步操作，在 Vuex 中最终通过 Mutation 修改状态（通过 dispatch 触发）。
 - Getters：用于派生状态（相当于 store 中的计算属性），用来获得共享变量的值

 ```ts
 // store.js
mutations: {
  increment(state) {
    state.count++
  }
}

actions: {
  incrementAsync({ commit }) {
    setTimeout(() => {
      commit('increment')
    }, 1000)
  }
}
 ```

### Vuex 与 Pinia

- Vuex 流程更严格，需要 mutation 修改 state
- Pinia 去掉 mutation，允许直接修改 state，更简洁
- Pinia 更贴近 Composition API，TypeScript 支持更好

### 9.2 Pinia 的特点

Pinia 是 Vue3 推荐的状态管理方案，它本质上基于 Vue3 的 `reactive` 实现全局状态共享。使用`defineStore`定义 `state` 状态和 `actions` 方法。

Pinia 本质是基于 Vue3 的 reactive 实现的全局状态管理，它把每个 store 做成一个响应式对象，并用 Map 缓存起来，保证全局只有一份，从而实现组件之间共享数据。

Pinia 的数据存在 浏览器运行时（JS 引擎）的内存里，因此在页面刷新后会丢失，如果需要持久化需要额外接入 localStorage 等方案。
特点：

- 轻量
- 模块化更强
- API 简洁
- TypeScript 友好
- 支持 Composition API 风格

注意：

- Store 数据存在运行时内存中
- 刷新页面后会丢失
- 如果要持久化，需要配合 `localStorage` 等方案

---

## 10. 响应式、模板机制、样式与工程实践

### 10.1 双向绑定与响应式总结

这一部分和前面的 [7.9 Vue2 响应式原理与更新流程](#79-vue2-响应式原理与更新流程)、
[7.10 Vue3 响应式原理依赖跟踪与对比总结](#710-vue3-响应式原理依赖跟踪与对比总结) 有明显重复，这里保留面试速答版：

- 双向绑定本质是 **响应式系统 + 事件监听**
- 数据到视图：Vue2 依赖 `Object.defineProperty`，Vue3 依赖 `Proxy`
- 视图到数据：`v-model` 本质上是 `:value` + `@input`
- 如果被追问实现细节，再展开回答 `Dep` / `Watcher` 或 `track` / `trigger`

### 10.5 为什么 `data` 要写成函数

`data` 必须写成函数，核心原因是避免组件实例之间共享同一个对象引用。

如果直接写成对象：

- 多个组件实例会共用同一份数据
- 一个实例修改后，其他实例也会受影响

如果写成函数：

- 每次创建组件实例都会返回一个新的对象
- 每个实例数据相互独立

### 10.7 Vue 的 MVVM 模式

MVVM（Model-View-ViewModel）是一种软件架构设计模式，通过**数据绑定机制**实现了**视图**与**数据**的自动同步。

- **Model**：数据层，对应 Vue 中的**数据对象**，通常是 `data` 选项中**定义的数据**（或通过 `reactive`、`ref` 等 API 创建的**响应式数据**），它仅负责存储业务数据（如用户信息、列表数据等）。
- **View**：视图层，对应 Vue 的模板，即用户看到的UI 层，仅负责展示数据和接收用户交互。
- **ViewModel**：视图模型层，**双向绑定桥梁**，一方面，ViewModel 会监听 Model 的数据变化，当数据改变时，自动更新 View。另一方面，ViewModel 会监听 View 的用户操作（如输入、点击等），当视图发生交互时，自动同步修改 Model 中的数据。

优点：

- 低耦合
- 可测试性更好
- 复用性更高
- 关注点分离清晰
- 数据动态更新更自然

---

### 10.8 Vue 性能优化手段

### 缓存静态内容

- `v-once`：渲染一次后不再响应数据变化，处理那些渲染一次后就不再响应数据变化的DOM元素.
- `v-memo`：缓存函数渲染结果，减少重复计算。

### 路由懒加载 / 组件异步加载

- 减少首屏加载体积，提高渲染速度。
- 异步加载组件可以按需加载，避免一次性加载全部。

### 避免深层响应式对象

- 深层对象响应式会增加依赖追踪开销。
- 对不需要响应的数据可以用 `Object.freeze()`  冻结。

### 其他优化

- 合理拆分组件，减少不必要的重渲染范围。
- 使用 computed 或 watch 替代频繁调用 methods。
- 渲染大列表时可以使用虚拟列表，减少 DOM 节点数量。

### 10.9 常见性能优化补充

可以把 Vue 性能优化概括为四类：

- 首屏优化：路由懒加载、异步组件、静态资源按需加载
- 渲染优化：合理拆分组件、缓存静态节点、控制更新范围
- 响应式优化：避免深层响应式、减少不必要的依赖追踪
- 列表优化：大列表配合虚拟滚动，减少真实 DOM 数量

---

### 10.10 `keep-alive`

`keep-alive` 是 Vue 内置抽象组件，用于缓存组件实例，避免组件在切换时被频繁销毁和重建。

特点：
- 不渲染真实 DOM
- 通过 VNode 缓存组件实例
- 再次访问时复用缓存，不重新执行完整初始化
- 被缓存组件会触发 `activated`、`deactivated`

其核心逻辑简化如下：
1. 在 render 阶段，判断当前子组件是否已缓存。
2. 若缓存存在，则直接从缓存中取出，并标记 keepAlive。
3. 若不存在，则正常渲染并存入缓存。
4. 在组件卸载时，不销毁实例，而是仅做“停用”标记。
这种机制使得组件实例及其状态在切换间得以保持，从而实现高性能的多视图切换体验。

常见场景：
- 多标签页
- 路由缓存
- 表单返回保留状态

使用方式
1. 路由配置：在需要缓存的页面路由meta信息中添加keepAlive: true标识：
```ts
{
  path: '/content/list',
    component: ContentList,
    meta: {
    keepAlive: true,      // 缓存标识
      cacheKey: 'list'      // 缓存唯一标识
  }
}
```

缓存容器组件:在布局文件中使用<keep-alive>包裹路由出口：
```vue
<router-view v-slot="{ Component }">
  <keep-alive :include="cachePages">
    <component :is="Component" :key="$route.meta.cacheKey || $route.path"/>
  </keep-alive>
</router-view>

<keep-alive :include="['User', 'Home']">
<!-- 可以控制缓存哪些组件。-->

<keep-alive :max="10">
<!-- 表示最多缓存 10 个组件。-->
```

### 10.11 `scoped` 样式

`scoped` 用于让组件样式只作用于当前组件，避免污染全局样式。

原理：

- 编译时给元素加唯一属性，如 `data-v-xxx`
- CSS 选择器也会被重写
- 最终实现样式隔离

---

## 11. Vue2 迁移、项目总结与高频面试表达

### 11.1 Vue2 迁移到 Vue3

Vue2 到 Vue3 的迁移通常采用渐进式方案：

1. 先通过兼容构建运行旧代码
2. 逐步替换全局 API、生命周期、`v-model` 等不兼容点
3. 引入 Composition API 优化逻辑复用
4. 最后移除兼容模式，完成迁移

迁移时重点关注：

- 生命周期变化
- `setup` 与组合式写法
- 响应式 API 替换
- 路由、状态管理、`v-model` 等细节差异

### 11.2 渐进式框架的理解
渐进式框架（Progressive Framework）的核心理念是允许开发者逐步增强或扩展应用程序的功能，而不是一次性提供一个全功能、一体化的解决方案。
这种框架设计具有以下特点：
模块化：渐进式框架通常将功能划分为多个独立的模块或组件，每个模块可以单独引入和使用，这样开发者可以根据项目需求选择性地集成所需的部分。
低侵入性：它不会强制要求开发者遵循严格的规则集或重构整个应用才能使用框架，而是尽可能地与现有代码库和第三方库无缝融合。
灵活性：开发者能够轻松地从小规模开始，仅使用框架的基本功能，并随着项目的复杂度增加逐步添加更高级的功能。
可扩展性：框架的设计支持自定义扩展，这意味着开发者可以在需要时构建自己的插件或模块来满足特定业务需求。
易于上手：渐进式框架往往有一个较小的学习曲线，因为开发者可以从简单用例入手，随着对框架理解加深再逐渐深入到更复杂的特性和最佳实践。
以 Vue.js 为例，作为渐进式 JavaScript 框架，它可以灵活地应用于各种场景，从简单的页面交互到大型单页应用。开发者可以只使用其模板引擎和数据绑定特性进行开发，或者进一步利用 Vue 生态中的路由管理、状态管理等工具来构建更为复杂的系统。Vue 的设计使得开发者能够在不违背既有代码结构的前提下，逐步将 Vue 的功能融入到项目中去。

### 11.3 如何在 Vue 应用中进行表单处理和验证
- 表单处理：可以使用 v - model 进行双向绑定。
- 表单验证：
  - 使用第三方库：如 VeeValidate 或 Vue - Form - Validation。
  - 手动编写验证逻辑：在提交前检查表单状态。
  - 利用 Vue 的计算属性和自定义指令来实现表单验证。
