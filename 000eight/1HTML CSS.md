# HTML CSS
## 1. `meta` 标签有什么作用？
`meta` 标签主要是给浏览器、搜索引擎和其他平台提供页面元信息，本身不会直接显示在页面里。

最常见的用途有几个：
- 设置字符编码 `charset`，避免乱码
- 设置移动端视口 `viewport`，保证页面在手机上正常缩放
- 设置 SEO 相关的描述和关键词 `description`
- 控制页面刷新、跳转、兼容模式等

```html
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta name="description" content="页面描述">
<meta http-equiv="X-UA-Compatible" content="IE=edge">
```

## 2. 行内元素、块级元素、`inline-block` 有什么区别？

- 块级元素默认会独占一行，宽度通常会撑满父容器，可以设置宽高，也可以设置 `margin` 和 `padding`。像 `div`、`p`、`ul` 这些都比较典型。
- 行内元素默认不会换行，宽高由内容决定，通常不能直接设置宽高，像 `span`、`a` 这些比较典型。
- `inline-block` 兼具两者特点：它默认不换行，但又可以设置宽高，所以很适合按钮横向排列、图片和文字同行对齐这种场景。

```css
.btn {
  display: inline-block;
  width: 100px;
  height: 40px;
}

img {
  vertical-align: middle;
}
```

## 3. `src` 和 `href` 有什么区别？

- `src` 更强调“把资源真正加载进来并参与当前文档”，比如 `<img>`、`<script>`、`<iframe>`。
- `href` 更强调“建立当前文档和外部资源之间的关联”，比如 `<a>` 和 `<link>`。它表示页面和某个资源之间有链接关系。
- 浏览器处理它们的方式也不一样。`<script src>` 在默认情况下会阻塞解析，而 `<link href>` 不阻塞 DOM 解析，但会影响渲染。

## 4. `defer` 和 `async` 有什么区别？
如果 `<script>` 没有加 `defer` 或 `async`，浏览器解析到它时会暂停 HTML 解析，先下载并执行脚本。

`defer` 和 `async` 都能让脚本并行下载，但执行时机不同：
- `defer`：不会阻塞 HTML 解析，等 DOM 解析完成后再按顺序执行
- `async`：不会阻塞 HTML 解析，但下载完成就立即执行，不保证顺序

所以如果脚本之间有依赖，优先考虑 `defer`；如果是独立脚本，比如埋点、广告、统计，更适合 `async`。

## 5. `preload` 和 `prefetch` 有什么区别？

- `preload` 是为当前页面马上要用到的关键资源做预加载，它优先级高，目标是优化当前页面首屏。
- `prefetch` 是为用户接下来可能访问的资源提前准备，它优先级更低，通常在浏览器空闲时加载，目标是优化下一跳体验。

```html
<link rel="preload" href="/main.css" as="style">
<link rel="prefetch" href="/next-page-data.json">
```

## 6. HTML 语义化怎么理解？
HTML 语义化的核心是用合适的标签表达合适的内容结构，而不是只为了样式去堆 `div`。

- 对 SEO 更友好，搜索引擎更容易理解页面结构
- 对可访问性更友好，读屏软件更容易识别内容层级
- 对开发维护更友好，代码结构更清晰

比如头部用 `header`，导航用 `nav`，主体内容用 `main`，文章用 `article`，分区用 `section`，页脚用 `footer`。

## 7. HTML5 新增了哪些常用能力？

- 语义化标签，比如 `header`、`nav`、`article`
- 多媒体标签，比如 `audio`、`video`
- 本地存储，比如 `localStorage`、`sessionStorage`
- 新的 DOM 查询方式，比如 `querySelector`
- 后台线程能力，比如 `Web Worker`
- 地理位置、通知等浏览器能力

## 8. `Web Worker` 怎么理解？

`Web Worker` 是浏览器提供的多线程能力，允许把耗时 JS 逻辑放到后台线程执行，避免阻塞主线程。

主线程负责 UI 渲染和 DOM 操作，Worker 线程适合做计算密集型任务，比如大数据处理、图像处理、复杂解析。

它的限制也很明确：不能直接操作 DOM，也不能直接访问 `window`，通常通过 `postMessage` 和主线程通信。

```js
// main.js
const worker = new Worker('worker.js');
worker.postMessage({ num: 100000 });
worker.onmessage = (e) => {
  console.log(e.data);
};
```

## 9. 常见表单控件有哪些？
- 单选框 `radio`
- 复选框 `checkbox`
- 输入框 `input`
- 下拉框 `select + option`
- 多行文本 `textarea`
- 按钮 `button`

## 10. Flex 布局怎么理解？
Flex 是一维布局，核心是沿主轴分配空间，适合做导航栏、按钮组、列表、居中布局这些组件级排版。

父容器常用属性有：
- `flex-direction`：决定主轴方向：`row`、`row-reverse`、`column`、`column-reverse`
- `justify-content`：主轴对齐：`flex-start`、`flex-end`、`center`、`space-between`、`space-around`、`space-evenly`
- `align-items`：交叉轴对齐：`flex-start`、`flex-end`、`center`、`baseline`、`stretch`
- `flex-wrap`：是否换行

子元素常用属性有：
- `flex-grow`：当父容器有剩余空间时，子元素如何分配剩余空间
- `flex-shrink`：当父容器空间不足时，子元素如何缩小
- `flex-basis`：子元素在分配空间前的基础尺寸
- `align-self`：单独覆盖对齐方式

面试里经常会追问 `flex: 1` vs `flex: auto`：
`flex: 1` 等价于 `flex: 1 1 0%`，表示可以放大、可以缩小、基础尺寸按 0 算。
`flex: auto` 等价于 `flex: 1 1 auto`，表示可以放大、可以缩小、基础尺寸按内容算。

```css
.container {
  display: flex;
  justify-content: center;
  align-items: center;
}

.left {
  width: 200px;
}

.right {
  flex: 1;
}
```

```css
/* flex: 1 和 flex: auto 的区别 */
.a { flex: 1; }    /* 1 1 0% */
.b { flex: auto; } /* 1 1 auto */
```

## 11. Grid 布局和 Flex 有什么区别？

Flex 是一维布局，适合控制一行或者一列里的排列关系。
Grid 是二维布局，适合同时控制行和列，更适合页面级布局、复杂网格、仪表盘、画廊这类场景。

```css
.grid-nine {
  display: grid;
  grid-template-columns: repeat(3, 1fr); // 3列，每列宽度为1fr
  grid-template-rows: repeat(3, 1fr); // 3行，每行高度为1fr
  gap: 10px;
}
```

```css
.grid-holy-grail {
  display: grid;
  grid-template-columns: 200px 1fr 200px; // 左侧宽度200px，中间自适应，右侧宽度200px
  grid-template-rows: auto 1fr auto; // 顶部高度自适应，中间自适应，底部高度自适应
  grid-template-areas:
    "header header header"
    "left center right"
    "footer footer footer";
  min-height: 100vh; // 最小高度为视口高度
}
```

```css
.grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); // 自动适应，最小宽度240px，最大宽度1fr
  gap: 16px;
}
```

## 12. 两栏 / 三栏布局怎么实现？

两栏布局通常是左侧固定、右侧自适应。可以使用以下方式：
- 浮动 + `margin-left`：左侧元素浮动，右侧元素使用 `margin-left` 撑开
- 浮动 + BFC：左侧元素浮动，右侧元素使用 BFC 撑开
- Flex：使用 Flex 布局，左侧元素固定宽度，右侧元素 flex: 1
- 绝对定位：左侧元素绝对定位，右侧元素使用 `left` 属性撑开

三栏布局通常是左右固定、中间自适应。可以用：
- 浮动 + 中间 `margin`：左右元素浮动，中间元素使用 `margin` 撑开
- 绝对定位：左侧元素绝对定位，右侧元素使用 `left` 属性撑开
- Flex：使用 Flex 布局，左侧元素固定宽度，右侧元素 flex: 1
- Grid：使用 Grid 布局，左侧元素固定宽度，右侧元素宽度自适应

```css
/* 两栏：flex */
.outer {
  display: flex;
}
.left {
  width: 200px;
}
.right {
  flex: 1;
}
```

```css
/* 三栏：grid */
.container {
  display: grid;
  grid-template-columns: 200px auto 200px;
}
```

## 13. 浮动是什么？怎么清除浮动？

浮动会让元素脱离正常文档流，并向左或向右移动，直到碰到父容器边缘或者其他浮动元素。

最大的问题是父元素高度塌陷，因为子元素浮动后，父元素可能感知不到它的高度，从而导致父元素高度塌陷。

清除浮动的常见方式有两个：
- 触发父元素 BFC：通过 `overflow: hidden`、`display: inline-block`、`position: absolute`、`position: fixed` 等属性触发父元素 BFC
- 用伪元素 clearfix：通过伪元素 `::after` 触发 BFC，然后清除浮动

```css
.parent::after {
  content: "";
  display: block;
  clear: both;
}
```

## 14. BFC 是什么？有什么用？

BFC 全称是块级格式化上下文，可以把它理解成一个独立的布局环境。BFC 内部的元素不会影响外部，外部元素也不会轻易干扰内部布局。

它的作用有：
- 清除浮动导致的父元素高度塌陷
- 避免浮动元素和普通块元素重叠问题
- 阻止垂直 Margin 合并，父子元素或相邻元素的 margin 不再发生合并

常见触发方式有：
- `overflow: hidden/auto/scroll`
- `display: inline-block/flex/grid`
- `position: absolute/fixed`
- `float` 不为 `none`

## 15. 元素怎么水平垂直居中？
- 如果是单行文本垂直居中，也可以用 `line-height` 等于高度。
- 如果是兼容性更强的经典方案，可以用 `position + transform`。
- 最推荐使用 Flex 布局：
`display: flex; justify-content: center; align-items: center;`

```css
.center {
  display: flex;
  justify-content: center;
  align-items: center;
}
```

```css
.center {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}

.center {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-1/2宽度, -1/2高度);
}
```

## 16. 盒模型怎么理解？

所有 HTML 元素都可以看成一个盒子，盒模型由四部分组成：content、padding、border、margin。
默认是 `content-box`，也就是 `width` 和 `height` 只算内容区，不包含 `padding` 和 `border`。
如果设置成 `border-box`，那 `width` 和 `height` 就包含内容区、内边距和边框。

```css
* {
  box-sizing: border-box;
}
```

```css
/* 0.5px / 1px 细边框 */
.half-border {
  position: relative;
}

.half-border::after {
  content: "";
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  height: 1px;
  background: #000;
  transform: scaleY(0.5);
  transform-origin: 0 100%;
}
```

```css
/* 用 border 实现三角形 */
.triangle {
  width: 0;
  height: 0;
  border-left: 50px solid transparent;
  border-right: 50px solid transparent;
  border-bottom: 100px solid red;
}
```

```css
/* 圆形 / 椭圆 */
.circle {
  width: 100px;
  height: 100px;
  border-radius: 50%;
  background: #1890ff;
}

.ellipse {
  width: 160px;
  height: 100px;
  border-radius: 50%;
  background: #52c41a;
}
```

## 17. CSS 选择器优先级怎么计算？
优先级常见可以这样记：!important > 内联样式 > id > 类、属性、伪类 > 标签、伪元素
- 内联样式：1000
- `id`：100
- 类、属性、伪类：10
- 标签、伪元素：1

比较时从高位往低位比，谁大谁生效。如果权重一样，就看谁写在后面，`!important` 会强行提升优先级，但工程里不建议滥用。

## 18. 伪类和伪元素有什么区别？
- 伪类操作的是“已有元素的某种状态”，比如 `:hover`、`:focus`、`:first-child`。
- 伪元素操作的是“元素的某一部分”或者“虚拟出来的内容”，比如 `::before`、`::after`、`::first-line`。

```css
/* 纯 CSS Tooltip */
.tooltip {
  position: relative;
}

.tooltip:hover::after {
  content: attr(data-tip);
  position: absolute;
  left: 50%;
  bottom: 120%;
  transform: translateX(-50%);
  padding: 6px 10px;
  background: #000;
  color: #fff;
  white-space: nowrap;
  border-radius: 4px;
}
```

## 19. 隐藏元素有哪些方式？区别是什么？

常见方式有：
- `display: none`
- `visibility: hidden`
- `opacity: 0`
- 绝对定位移出视口
- `z-index` 遮挡

区别：
- `display: none`：不占空间，也不参与渲染
- `visibility: hidden`：占空间，但不可见
- `opacity: 0`：占空间，也可参与动画，且通常还能响应事件

## 20. `z-index` 为什么有时候不生效？

最常见原因有两个：
- 元素没有定位，`z-index` 只对定位元素生效
- 父元素形成了新的堆叠上下文，子元素再高也只能在父级上下文内部比较

```css
.parent {
  position: relative;
  z-index: 1;
}

.child {
  position: absolute;
  z-index: 9999;
}

.other {
  position: relative;
  z-index: 2;
}
```

## 21. `display` 和 `position` 常见值有哪些？

`display` 常见值：
- `none`
- `block`
- `inline`
- `inline-block`
- `flex`
- `grid`

`position` 常见值：
- `static`：默认值，不定位
- `relative`：相对自身原位置偏移，不会脱离文档流，保留原有的位置
- `absolute`：脱离文档流，相对最近定位祖先
- `fixed`：相对视口固定
- `sticky`：到达阈值前相对定位，之后像固定定位

```css
.sticky {
  position: sticky;
  top: 0;
  background: #fff;
}
```

## 22. `requestAnimationFrame` 和 `setTimeout` 有什么区别？

- `requestAnimationFrame` 的回调会在浏览器下一帧重绘前执行，天然和屏幕刷新节奏同步，所以更适合动画。

- `setTimeout` 是基于事件循环调度，不和渲染节奏绑定，主线程忙时可能延迟执行，因此更容易掉帧或产生抖动。

## 23. 常见 CSS 单位有哪些？`px`、`em`、`rem`、`vw/vh` 的区别？

- `px` 是绝对单位，最常见。
- `em` 相对于当前元素自身的字体大小，容易受嵌套影响。
- `rem` 相对于根元素 `html` 的字体大小，更适合做全局响应式尺寸体系。
- `vw`、`vh` 相对于视口宽高，适合响应式布局和移动端适配。

```css
html { font-size: 16px; }

.parent {
  font-size: 20px;
  padding: 2em;
}

.child {
  font-size: 1.5rem;
  margin: 1em;
}
```

```js
function setRem() {
  const designWidth = 375;
  const baseFontSize = 100;
  const scale = document.documentElement.clientWidth / designWidth;
  document.documentElement.style.fontSize = baseFontSize * scale + 'px';
}

window.addEventListener('resize', setRem);
setRem();
```

```css
/* 单行 / 多行文本溢出 */
.single-line {
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.multi-line {
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 3;
  overflow: hidden;
}
```

## 24. CSS 可继承属性和不可继承属性有哪些？

- 文本相关属性比较容易继承，比如 `color`、`font-size`、`font-family`、`line-height`。
- 盒模型、布局、定位相关通常不继承，比如 `width`、`height`、`margin`、`padding`、`border`、`position`、`display`。

## 25. CSS 变量有什么优势？

CSS 变量，也叫自定义属性，最大的价值有几个：
- 便于统一主题管理
- 支持作用域覆盖
- 支持运行时动态修改
- 可以和 `calc()` 组合使用

它非常适合做 Design Token，比如颜色、圆角、间距、字号体系。

```css
:root {
  --primary-color: #1890ff;
  --text-color: #333;
  --spacing-unit: 8px;
}

.button {
  background-color: var(--primary-color);
  color: var(--text-color);
  padding: calc(var(--spacing-unit) * 2);
}
```

```js
document.documentElement.style.setProperty('--primary-color', '#ff4d4f');
```

## 26. 为什么要初始化 CSS？
因为不同浏览器对很多标签有不同的默认样式，如果不做初始化，页面在不同浏览器里可能会出现间距、字号、列表样式不一致的问题。
所以初始化样式的目标是把这些默认差异先抹平，再在统一基础上写业务样式。

## 27. CSS Sprites 原理和优缺点是什么？

CSS Sprites 就是把多个小图合并成一张大图，再通过 `background-position` 精确定位显示其中一部分。

优点：
- 减少 HTTP 请求
- 适合小图标集中管理

缺点：
- 维护麻烦
- 改动一张小图可能要重新生成整张图
- 对响应式和高清屏支持不太友好

## 28. 响应式设计怎么理解？移动端适配有哪些方案？

响应式设计的核心是让页面根据不同设备尺寸自动调整布局和展示方式。

关键点通常有：
- 媒体查询 `@media`
- Flex / Grid
- 视口单位 `viewport`
- `rem` / `vw` 适配

```html
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
```

```css
@media (max-width: 768px) {
  .sidebar { display: none; }
  .content { width: 100%; }
}
```

```css
.container {
  width: 90%;
  max-width: 1200px;
}
```

```css
.nav {
  display: flex;
  justify-content: space-between;
}
```

```css
/* 自适应正方形 */
.square {
  width: 30%;
  aspect-ratio: 1 / 1;
  background: #f0f0f0;
}
```

## 29. 回流、重绘、合成分别是什么？怎么做 CSS 性能优化？

回流，也叫重排，是几何属性变化后浏览器重新计算布局，比如宽高、位置、盒模型变化。

重绘是外观属性变化，比如颜色、背景、阴影变化，但不影响布局。

合成是图层已经准备好后做最终合并，通常像 `transform`、`opacity` 这种更容易只走合成层，性能最好。

优化原则一般是：
- 减少回流重绘
- 批量修改 DOM
- 优先用 `transform` 和 `opacity`
- 避免频繁读写布局属性交错
- 控制选择器复杂度

```js
// 不好：多次写样式
el.style.width = '100px';
el.style.height = '100px';
el.style.margin = '10px';

// 好：合并写入
el.style.cssText = 'width: 100px; height: 100px; margin: 10px;';
```

```js
const fragment = document.createDocumentFragment();
for (let i = 0; i < 100; i++) {
  const li = document.createElement('li');
  fragment.appendChild(li);
}
document.getElementById('list').appendChild(fragment);
```

```css
.animated {
  will-change: transform;
  transform: translateZ(0);
}

.module {
  contain: layout style paint;
}
```

## 30. `transition` 和 `animation` 有什么区别？

- `transition` 适合两个状态之间的平滑过渡，比如 hover、展开收起、显隐切换。
- `animation` 适合更复杂的关键帧动画，比如循环 loading、呼吸灯、入场动画。

```css
.box {
  width: 100px;
  transition: width 0.5s;
}

.box:hover {
  width: 200px;
}
```

```css
@keyframes slideIn {
  from {
    transform: translateX(-100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

.box {
  animation: slideIn 0.5s ease-out forwards;
}
```

```css
/* Loading 动画 */
.loader {
  width: 40px;
  height: 40px;
  border: 4px solid #ddd;
  border-top-color: #1890ff;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
```

```css
/* 三点跳动 */
.dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: #1890ff;
  animation: jump 0.6s infinite alternate;
}

@keyframes jump {
  from {
    transform: translateY(0);
  }
  to {
    transform: translateY(-10px);
  }
}
```

```css
/* 毛玻璃效果 */
.glass {
  background: rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
}
```

## 31. CSS 预处理器和 CSS 工程化怎么理解？

CSS 预处理器像 Sass、Less，主要是给 CSS 增强编程能力，比如变量、嵌套、混入、函数、模块拆分。

在现代工程里，还会结合：
- CSS Modules
- BEM
- CSS-in-JS
- PostCSS

它们解决的问题不完全一样：
- 预处理器更偏“写得更方便”
- CSS Modules / BEM 更偏“作用域和命名治理”
- PostCSS 更偏“编译和兼容性处理”

```scss
$primary-color: #1890ff;
$spacing-unit: 8px;

.nav {
  background: $primary-color;

  &__list {
    display: flex;
  }

  &__item {
    padding: $spacing-unit * 2;
  }
}
```