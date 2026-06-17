# Vue 核心语法与面试笔记

## 1. Vue 的生命周期
Vue 的生命周期分为创建、挂载、更新、销毁四个阶段。
- 创建阶段有 beforeCreate 和 created，beforeCreate 时 data 和 methods 还未初始化，created 时已初始化，可以访问响应式数据，但是页面 DOM 还没有生成。
- 挂载阶段有 beforeMount 和 mounted，beforeMount 模板已经编译成虚拟 DOM，但真实 DOM 还没有挂载到页面；mounted 是 DOM 挂载完成，适合操作 DOM。在 mounted 中发请求，主要是因为此时组件已经完成挂载，DOM 已可用，适合进行依赖页面状态的初始化操作。
- 更新阶段有 beforeUpdate 和 updated，beforeUpdate 是数据更新前，updated 是 DOM 更新后。
- 销毁阶段有 beforeDestroy 和 destroyed，beforeDestroy 可清除定时器，移除事件监听，destroyed 时组件完全销毁。

Vue3 保留了生命周期的核心逻辑，但做了以下调整：
1. `beforeCreate` 和 `created` 被 `setup` 函数替代；
2. 部分钩子名称前缀改为 `on`：onBeforeMount、onMounted、onBeforeUpdate、onUpdated 等 Composition API 生命周期钩子。
3. `beforeDestroy` → `beforeUnmount`、`destroyed` → `unmounted`，更直观表达 “卸载” 含义

### 1.1 父子组件生命周期顺序
创建时，父组件先创建实例，然后创建子组件，
挂载时，父组件触发更新（父 beforeMount 先执行），子组件先完成 mounted，最后父组件 mounted。
更新阶段，父组件触发更新（父 beforeUpdate 先执行），然后子组件更新完成（子updated 先完成），最后父组件 updated；
销毁时，父 beforeDestroy 先执行，子 destroyed 先完成，父组件最后 destroyed。

本质原因是子组件依赖父组件的渲染结果，必须等子组件完成后父组件才算真正完成。

## 2. `script setup` `data`
### 2.1 Setup
`setup` 是 Vue3 新增的配置项，组件中用到的：数据、方法、计算属性、监听器、生命周期组合逻辑等，通常都在这里定义。

特点：
- `setup` 会在 `beforeCreate` 之前执行。
- `setup` 中的 `this` 是 `undefined`。
- `setup` 中定义的普通变量默认不是响应式的。
- `setup` 返回的内容可以直接在模板中使用。

`<script setup>` 则是更简洁的写法，它把 `setup` 中需要写的返回逻辑省略掉了，模板中可直接使用脚本内声明的变量和函数。

### 2.2 为什么 `data` 要写成函数
`data` 必须写成函数，原因是避免组件实例之间共享同一个对象引用。

如果直接写成对象：
- 多个组件实例会共用同一份数据
- 一个实例修改后，其他实例也会受影响

如果写成函数：
- 每次创建组件实例都会返回一个新的对象
- 每个实例数据相互独立

## 3. Vue2 vs Vue3
- 响应式系统：Vue2 使用 `Object.defineProperty`，无法监听新增/删除属性，性能稍低；Vue3 改用 `Proxy`，支持深层对象和数组监听。
- Options API vs Composition API：
  - Vue2 的主要写法是 Options API，按照 data、methods、watch 等选项来组织代码，但当组件变大时，相关逻辑会被拆散；
  - Vue3 提供更灵活的代码组织方式，替代 Options API 的逻辑分散问题，通过 setup 函数按功能逻辑组织代码。
- 性能优化：Vue2 Diff 算法优化有限；Vue3 通过静态提升（Static Hoisting）和 Patch Flag 减少虚拟 DOM 对比开销。
- TypeScript 支持：Vue3 的类型推导和工程化体验更好。

### 3.1 Vue2 响应式原理
Vue 的响应式系统核心更准确地说是 观察者模式，并融合了 发布-订阅思想 来做依赖管理。
在创建 Vue 实例时，会遍历 `data` 中的属性，并使用 `Object.defineProperty` 给每个属性定义 `getter` 和 `setter`。
组件渲染时访问这些属性，会触发 `getter`，内部会做依赖收集，把当前的 `Watcher` 收集到 `Dep` 依赖收集器中。
当数据发生变化时，会触发 `setter`，通知 `Dep` 中依赖这个数据的 `Watcher` 重新执行，渲染组件，最终更新视图。

Vue2 的局限性在于：
- 不能监听 属性新增 / 删除。
- 不能监听 数组下标修改。
- 初始化阶段需要 递归遍历对象，性能开销较大。

Vue2 中能直接新增对象属性吗？
不能。因为 `Object.defineProperty` 不能监听属性新增，不能保证响应式。需要使用 `Vue.set` 方法来新增属性。

### 3.2 Vue3 响应式原理
Vue3 使用 `Proxy` 替代了 `Object.defineProperty`，可以对整个对象做更完整的代理。使用 `effect` 代替 `watcher`。
`effect` 是真正执行副作用逻辑的函数，组件渲染函数可以看作一种特殊的 `effect`。
读取时触发 `get`，执行 `track` 收集依赖。数据变化时触发 `set` 或 `deleteProperty`，执行 `trigger` 派发更新。依赖这个属性的 `effect` / 组件渲染函数重新执行，视图更新。

Vue3 常用下面的结构存储依赖关系：
- `WeakMap`：以对象为维度保存依赖。
- `Map`：以属性 key 为维度保存依赖。
- `Set`：保存依赖这个属性的副作用函数 `effect`。

### 3.3 双向绑定本质与视图自动更新
Vue 的双向绑定本质上是：响应式系统 + 事件监听。
- 数据到视图：依赖响应式系统自动更新。
- 视图到数据：通过事件监听，比如 `v-model` 本质上是 `:value` + `@input`。

视图自动更新流程可以概括为：

1. 初始化时解析模板并建立依赖。
2. 数据变化时触发更新。
3. 更新通过虚拟 DOM Diff 反映到真实 DOM。
4. 通过事件监听把视图输入同步回数据。

### 3.4 ref vs reactive
ref 和reactive 都是 Vue3 用来创建响应式数据的 API
- `ref` 
 - 可以接收基本数据类型，也可以接收对象类型。
 - ref 底层本质还是调用了 reactive，会使用 `Object.defineProperty` 的 `getter/setter` 拦截 `.value`，把传入的值包裹成一个 {value: 数据} 的对象，所以使用时必须通过 `.value` 取值和修改。
 - ref 解构后依然保持响应式。

- `reactive` 
  - 用于创建对象类型的响应式数据。
  - 本质上是通过 `Proxy` 返回一个代理对象，支持深层次响应式。
  - reactive直接解构会丢失响应式，需要用 toRefs 转换。

### 3.5 `toRef` 与 `toRefs`
`toRef` 和 `toRefs` 的作用，是把响应式对象中的属性转换成独立的 `ref` 对象，解构响应式对象时，避免丢失响应式。

- `toRef`：一次转换一个属性。
- `toRefs`：可以批量转换多个属性。

```js
// 数据
let person = reactive({name:'张三', age:18, gender:'男'})

// 通过toRefs将person对象中的n个属性批量取出，且依然保持响应式的能力
let {name,gender} =  toRefs(person)

// 通过toRef将person对象中的gender属性取出，且依然保持响应式的能力
let age = toRef(person,'age')
```

### 3.6 Vue 的 MVVM 模式
MVVM（Model-View-ViewModel）是一种软件架构设计模式。
- Model：数据层，对应 Vue 中的数据对象，通常是 `data` 选项中定义的数据（或响应式数据）。
- View：视图层，对应 Vue 的模板，即用户看到的UI 层，仅负责展示数据和接收用户交互。
- ViewModel：视图模型层，双向绑定桥梁，一方面，ViewModel 会监听 Model 的数据变化，当数据改变时，自动更新 View。另一方面，ViewModel 会监听 View 的用户操作，当视图发生交互时，自动同步修改 Model 中的数据。

## 4. `computed` 计算属性 vs `watch` 监听 vs `watchEffect`
`computed` 是用来根据已有数据计算新数据的，底层借助了object.defineproperty方法提供的getter和setter实现依赖追踪，而且它有缓存机制。只要依赖不变，多次访问也不会重复算。它更适合做派生值，而不是副作用逻辑。

具体来说，computed 内部通过一个 lazy 的 effect 来管理。
- 依赖收集（track）
- dirty 标记（是否需要重新计算）
- lazy effect（懒执行）

`watch` 是明确监视某个数据的变化，适合做副作用，比如请求接口。它可以监视 `ref`、`reactive`、getter 函数和数组，支持深度监听和立即执行。

`watch` 的参数一般包括：
- 第一个参数：被监视的数据
- 第二个参数：回调函数
- 第三个参数：配置对象，如 `deep`、`immediate`

`watchEffect` 是立即执行一个函数，并自动追踪函数中用到的所有响应式依赖，依赖变化时自动重新执行，不用明确指定。

## 5. 组件通信
1. 父子组件通信是 Vue 中最常见的通信方式：
父组件通过`props`属性向子组件传值，子组件通过 `defineProps` 接收。
- `props` 是单向数据流
- 子组件不应该直接修改 `props`
- 如果需要修改，应该通过 `emit` 通知父组件修改

子组件通过 `defineEmits` 注册事件，然后用 `emit('事件名', 参数)` 通知父组件。

2. 兄弟通信：状态提升到共同父组件，或使用事件总线（Vue2 常见）：
3. 跨层级通信：`provide` / `inject`
4. 全局状态管理：Pinia / Vuex
5. 直接访问子组件：`ref` + `defineExpose`

## 6. 动态组件与异步组件
动态组件：使用 `<component :is="componentName">` 动态渲染不同组件。
异步组件：使用 `defineAsyncComponent` 或动态 `import` 按需加载组件。

## 7. 插槽（Slots）
插槽用于内容分发，让父组件向子组件传递模板结构，而不是只传数据。

1. 默认插槽
- 子组件中使用 `<slot>`接收父组件内容
- 父组件传入默认内容

2. 具名插槽
- 用 `name` 区分不同插槽位置
- 父组件通过 `#header`、`#footer` 等指定内容，适用于组件内部有多个插入区域

3. 作用域插槽
- 子组件把数据暴露给父组件
- 父组件自定义渲染方式
- 常用于表格、列表等场景

## 8. 指令、渲染与模板机制
### 8.1 `v-if` 与 `v-show` 的区别
`v-if`
- 条件成立才渲染
- 切换时会创建或销毁 DOM
- 初次渲染开销较小
- 适合不频繁切换的场景

`v-show`
- 元素始终渲染在 DOM 中
- 通过 `display: none` 控制显示隐藏，因此元素不会占据布局空间。当切换时会触发重排和重绘。
- 切换成本低
- 适合频繁切换场景

visibility: hidden 只是让元素不可见，但仍然占据原有布局空间，只会触发重绘，不会触发重排，因此切换成本更低。

### 8.2 `v-for` 为什么要 `key`
`key` 的作用是唯一标识节点身份，帮助 Diff 算法准确复用节点。

如果没有 `key`：
- Vue 会采用就地复用策略
- 列表插入、删除、排序时可能复用错节点
- 容易导致输入框、checkbox、组件状态错位

### 8.3 v-on / @ 绑定事件
编译时绑定事件，原生 DOM 事件直接绑定，自定义事件通过 emit 调用事件派发器触发。常见事件修饰符：
- .stop：阻止冒泡
- .prevent：阻止默认行为
- .self：仅自身触发
- .once：只触发一次

## 9. 模板渲染流程
Vue 模板渲染过程大致分为：
1. 解析：将模板字符串解析成 AST（抽象语法树）
2. 优化：标记静态节点，方便后续 Diff 直接跳过。
3. 生成代码：把 AST 生成可执行的 render 函数。
4. 执行 render：再由 render 函数生成虚拟 DOM（VNode）。
5. Diff 更新：对比新旧 VNode，将差异更新到真实 DOM。

## 10. 虚拟 DOM 与 Diff 算法的作用
- 虚拟 DOM：用 JavaScript 对象描述真实 DOM 结构。
- Diff 算法：在每次数据发生变化前，虚拟 dom 都会缓存一份；当数据变化时，对比新旧虚拟 DOM 树；只更新变化的节点，避免整个树重渲染。
- Diff 的核心优化点:
1. 同级对比：只比较同一层级的节点，不跨层级比较父节点和子节点，把复杂度从 O (n³) 降到 O (n)。
2. Key 的作用：列表渲染时，key 是给每一个 vnode 的唯一 id。Diff 算法通过 Key 判断节点是否是同一个：
3. Vue Diff 进一步优化：通过双端比较和最长递增子序列算法、Vue3 静态提升，减少 DOM 移动，提高性能。

### 10.1 静态提升与 Block Tree
静态提升是把静态节点提升到 render 函数外，只创建一次，后续更新直接复用，不再重复创建。
Block Tree 会给动态节点打上 Patch Flag，缩小 Diff 范围，在 Diff 时只比对动态内容，跳过静态节点。

## 11. 异步更新队列与 `nextTick`
Vue 的数据更新不是同步直接改 DOM，而是先进入异步更新队列，统一批量刷新。这会导致修改完数据后立刻读取 DOM，往往拿不到最新结果
此时就需要 `nextTick`：
- 在 DOM 更新完成后执行回调
- 确保拿到最新 DOM 状态

## 12. Vue Router 的导航守卫
Vue Router 的导航守卫分为三类：

1. 全局守卫
  - `beforeEach`：全局前置守卫，常用于鉴权
  - `beforeResolve`
  - `afterEach`：全局后置钩子
```js
// 全局前置守卫
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
2. 路由独享守卫：适合单页面特殊逻辑
  - `beforeEnter`
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
3. 组件内守卫：关注页面级生命周期和用户操作控制。
  - `beforeRouteEnter`
  - `beforeRouteUpdate`
  - `beforeRouteLeave`
```js
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
执行顺序：
beforeEach -> beforeEnter -> 组件内守卫 -> afterEach

### 12.1 路由监听
Vue3 中可以通过 `watch` 监听 `router.currentRoute`，也可以通过 `onBeforeRouteUpdate` 监听路由变化。

适用场景：
- 路由参数变化时重新请求数据
- 监听同组件复用下的路由更新
- 记录路由变化日志

### 12.2 `$route` 和 `$router` 的区别
- `$router`：路由实例对象，用于跳转和控制导航，如 `push`、`replace`、`go`
- `$route`：当前激活路由信息对象，用于读取路由参数、路径、查询等信息，不能直接跳转

### 12.3 页面跳转的三种方式
1. 直接修改地址栏
2. 编程式导航：`router.push()`、`router.replace()`
3. 声明式导航：`<router-link to="...">`

### 12.3 路由模式
hash 模式
- URL 中带 `#`
- 兼容性好
- 不需要后端额外配置

history 模式
- 基于 History API
- 更适合 SEO
- 刷新或直接访问深层路径时，需要服务器做兜底配置，否则可能 404

### 12.4 路由如何传参？
1. Query 参数
- 通过 `query` 参数传递
- 在路由配置中添加 `query` 参数
- 在组件中通过 `this.$route.query` 获取参数
```js
{
  path: '/user',
  component: User,
  props: (route) => ({ query: route.query })
}
```

2. Params 参数
- 通过 `params` 参数传递
- 在路由配置中添加 `params` 参数
- 在组件中通过 `this.$route.params` 获取参数
```js
{
  path: '/user/:id',
  component: User,
  props: (route) => ({ id: route.params.id })
}
```

## 13. 状态管理与全局数据
### 13.1 Vuex 的核心概念
- State：用于存储全局共享数据。
- Mutations：同步修改状态（通过 commit 触发）。
- Actions：负责处理业务逻辑和异步操作，在 Vuex 中最终通过 Mutation 修改状态（通过 dispatch 触发）。
- Getters：用于派生状态（相当于 store 中的计算属性），用来获得共享变量的值

### 13.2 Pinia 的核心概念
Pinia 是 Vue3 推荐的状态管理方案，它本质上基于 Vue3 的 `reactive` 实现全局状态共享。使用`defineStore`定义 `state` 状态和 `actions` 方法。
Pinia 它把每个 store 做成一个响应式对象，并用 Map 缓存起来，保证全局只有一份，从而实现组件之间共享数据。
Pinia 的数据存在 浏览器运行时（JS 引擎）的内存里，因此在页面刷新后会丢失，如果需要持久化需要额外接入 localStorage，设置 persistedstate 插件。

### 13.3  Vuex 与 Pinia
- Vuex 流程更严格，需要 mutation 修改 state
- Pinia 去掉 mutation，允许直接修改 state，更简洁
- Pinia 更贴近 Composition API，TypeScript 支持更好

## 14. Vue 性能优化手段
1. 缓存静态内容
- `v-once`：渲染一次后不再响应数据变化，处理那些渲染一次后就不再响应数据变化的DOM元素.
- `v-memo`：缓存函数渲染结果，减少重复计算。

2. 路由懒加载 / 组件异步加载
- 减少首屏加载体积，提高渲染速度。
- 异步加载组件可以按需加载，避免一次性加载全部。

3. 避免深层响应式对象
- 深层对象响应式会增加依赖追踪开销。
- 对不需要响应的数据可以用 `Object.freeze()`  冻结。

4. 其他优化
- 合理拆分组件，减少不必要的重渲染范围。
- 使用 computed 或 watch 替代频繁调用 methods。
- 渲染大列表时可以使用虚拟列表，减少 DOM 节点数量。

## 14.1 `keep-alive`
`keep-alive` 是 Vue 内置抽象组件，用于缓存组件实例，再次访问时复用缓存，避免组件在切换时被频繁销毁和重建。
被缓存组件会触发 `activated`、`deactivated`

使用方式
1. 路由配置：在需要缓存的页面路由meta信息中添加keepAlive: true标识。
2. 缓存容器组件:在布局文件中使用<keep-alive>包裹路由出口。

```html
<keep-alive :include="['User', 'Home']">
<!-- 可以控制缓存哪些组件。-->

<keep-alive :max="10">
<!-- 表示最多缓存 10 个组件。-->
```

## 15. `scoped` 样式
`scoped` 用于让组件样式只作用于当前组件，避免污染全局样式。
原理：编译时给元素加唯一属性，如 `data-v-xxx`

## 16. Vue2 迁移到 Vue3
Vue2 到 Vue3 的迁移通常采用渐进式方案：
1. 先通过兼容构建运行旧代码
2. 逐步替换全局 API、生命周期、`v-model` 等不兼容点
3. 引入 Composition API 优化逻辑复用
4. 最后移除兼容模式，完成迁移

## 17. 渐进式框架
渐进式框架的核心理念是允许开发者逐步增强或扩展应用程序的功能，而不是一次性提供一个全功能、一体化的解决方案。

## 18. 如何在 Vue 应用中进行表单处理和验证
- 表单处理：可以使用 v-model 进行双向绑定。
- 表单验证：
  - 使用第三方库：如 VeeValidate 或 Vue - Form - Validation。
  - 手动编写验证逻辑：在提交前检查表单状态。
  - 利用 Vue 的计算属性和自定义指令来实现表单验证。

## 19. Vue 中 h 函数（渲染函数）
h 函数是 Vue 中用于创建虚拟 DOM 的函数。
```js
const vnode = h('div', {
  class: 'container',
  style: {
    color: 'red'
  }
}, 'Hello, Vue!')

console.log(vnode)
```