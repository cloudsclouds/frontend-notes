# HTML CSS

## 行内元素、块级元素

在HTML中，元素可以分为块级元素和行类元素。在CSS规范规定中，每个元素都有display属性，确定该元素的类型，每个元素都有默认的display值，比如div默认值为“block”，成为“块级”元素；span默认display属性值为“inline”，是“行内“元素。

- **块级元素（block）有**`<div></div> <h1></h1>~<h6></h6> <p></p> <ul></ul> <ol></ol> <li></li> <dl></dl> <dt><dt> <dd></dd>`
- **行内元素（inline）有**`<span></span> <a></a> <img></img> <input></input> <select></select> <strong></strong>`
- **block** 元素会**独占一行**，默认 `width: 100%`，**可以设置** `width / height`，可以设置 `margin / padding`
- **inline** 元素不会换行，**宽高由内容决定**，不能设置 width 和 height。
- `inline-block`既有块级元素**可以设置宽高**的特点，也有行内元素**默认不换行**的特点；**既想让元素横向排列（不换行），又想控制宽高、内外边距**，还可受 `vertical-align` 控制（可用于**行内对齐，设置元素的中线对齐到父元素行盒的中线**）。
- **Display 样式转换：**
行内元素转换为块级元素 `display:block`
块级元素转化为行内元素 `display:inline`
将元素转化为内联元素 `display:inline-block`
- `display:inline-block` 典型使用场景：按钮横向排列；图片 + 文本水平居中对齐。
```CSS
button {
  display: inline-block;
  width: 100px;
  height: 40px;
}
// [按钮1] [按钮2] [按钮3]

<span>文字 <img src="a.png"> 文字</span>
img {
  vertical-align: middle;
}
// 让图片在这一行里垂直居中
```

## src 和 href 的区别

`src`和`href`都是用来加载外部资源，区别如下

- `href`：**用于建立当前文档与外部资源的关联关系，常见于** `<a>、<link>` 等。它表示“链接到”某资源，不把资源内容立即替换到当前位置。
- `src`：把外部资源「下载并插入/执行/渲染」**到当前文档，例如 `<img>`**、`**<script>**`、`**<iframe>**`、`**<video>**`。**
- 浏览器处理差异：
  - 浏览器在**解析 HTML 时**，遇到 src（`<script src=...>`） 会暂停 DOM 解析，**下载并执行资源**，因此会阻塞；
  - 浏览器**解析 href** `<link href="style.css">`不会阻塞 DOM 解析，但是页面渲染会等 CSS。
  - 这就是官方建议使用 link 引入而不是 @ import 的原因。`@import url('style.css')` 下载主 CSS，解析到 @import，再请求 style.css，是串行加载；link 写法 浏览器可以并行下载 CSS，提前开始构建 CSSOM，性能更好。

## defer 和 async 的区别

**src 一定会阻塞吗？**不一定。

- 如果没有defer或async属性，浏览器会**立即加载并执行相应**的**脚本**。它不会等待后续加载的文档元素，读取到就会开始加载和执行，这样就阻塞了后续文档的加载。 现代优化方式： `defer` 和 `async` ：可以并行加载JS文件，让 JS 下载不阻塞 HTML 解析，提高首屏性能。
- defer：`<script src="main.js" defer></script>`。defer 不阻塞 HTML 解析，JS 并行下载，JS会等待整个页面全部加载完成了（DOM解析完成后）再执行，按script 标签出现顺序 执行
- async：不阻塞 HTML 解析，JS 并行下载，下载完成立即执行，不保证顺序。

## Preload 和 prefetch

- preload：用于**当前页面关键资源**，浏览器会**高优先级立即加载。preload 解决首屏性能**
- prefetch：用于**未来可能访问的资源**，浏览器会在**空闲时低优先级加载。prefetch 优化页面跳转体验**

## flex 布局理解

`flex`布局是`CSS3`新增的一种布局方式，**能够根据不同屏幕尺寸的变化来自适应大小**。

`display: flex;`

 **flex 父容器的常用属性：**

1. **flex-direction**：决定**主轴方向**
  1. `row`（默认）：适合水平排列的元素
  2. `column`：适合垂直排列的元素
  3. `row-reverse`/`column-reverse`：适合需要反向排列的场景
2. **justify-content**：**主轴**上的对齐方式
  1. `flex-start`（默认）：从主轴起点开始排列
  2. `center`：主轴居中对齐
  3. `space-between`：两端对齐，中间间距相等（常用于导航栏左右分布）
  4. `space-around`：元素两侧间距相等，整体居中（适合均匀分布的标签栏）
3. **align-items**：**交叉轴上**的**单行对齐方式**
  1. `center`：交叉轴居中（如让文字在按钮里垂直居中）
  2. `stretch`（默认）：子元素高度自动拉伸，填满交叉轴（如卡片高度自适应父容器）
  3. `baseline`：按文字基线对齐（适合多元素文字对齐）
4. **flex-wrap**：控制**子元素是否换行**
  1. `nowrap`（默认）：不换行，可能导致子元素被挤压
  2. `wrap`：空间不足时换行（适合响应式网格布局，如商品列表）
5. **align-content**：交叉轴上的多行对齐
  1. 仅当 `flex-wrap: wrap` 且子元素换行时生效
  2. 类似 `justify-content`，但作用于多行整体（如多行卡片在容器中垂直居中）
  3. 值：flex-start（所有行靠近头部）、flex-end、center、space-between、space-around

**子元素的主要属性：**

1. **flex-grow:** 定义子级元素的“放大”比例，**当子级元素占不满父级元素的宽度时，对剩余空间的处理**。
  1. 默认值是0，**即使父容器存在剩余空间，也不会放大**。
  2. 比如设置`flex-grow: 1`，就表示**可以占用剩余空间**。
2. **flex-shrink:** 定义子级元素的“缩小”比例，**当子级元素设置的总宽度超过了父级元素的宽度，对超出宽度的处理**
  1. 默认为 1，即**空间不足时，元素会按比例进行缩小。**
  2. 如果设为0，则不会缩小。
3. **flex-basis:** 定义元素**在分配剩余空间之前的“初始占位宽度”**。
  1. 默认值为 auto，根据自身尺寸 + 剩余空间平分扩展。
  2. 0，完全忽略原本宽度，直接平均分配剩余空间。
  3. 如果设置了具体数值，比如 `flex-basis: 200px`，就会以这个尺寸作为起点
4. **align-self:**  允许单个子元素**覆盖 align-items**，实现个别元素不同的对齐方式。

父元素

```JavaScript
.container{
    display:flex;
    height:200px;
    align-items:flex-start;
}
```

默认所有元素：顶部对齐

某个元素：

```JavaScript
.item2{
  align-self:center;
}
```

效果 item1  item3   在顶部；item2  在中间

`flex: 1` 等价于 `flex: 1 1 0%`，即：

- `flex-grow: 1`：允许元素放大，**占剩余空间。**
- `flex-shrink: 1`：**空间不足时允许收缩**。
- `flex-basis: 0%`：完全不考虑原始尺寸，从0开始计算空间分配。

`flex: auto` 等价于 `flex: 1 1 auto`，即：

- `flex-grow: 1`：同样允许放大
- `flex-shrink: 1`：空间不足时同样允许缩小
- `flex-basis: auto`：元素的「基准尺寸」为 **自身内容的原始尺寸**，先保留自身原始尺寸大小，再分配剩余空间。

```CSS
容器 800px

.A { flex: 1 1 200px; }
.B { flex: 2 1 100px; }
.C { flex: 1 1 100px; }
基础尺寸总和：200 + 100 + 100 = 400
剩余：800 - 400 = 400
grow 比例：1 2 1:
最终：
A = 200 + 100 = 300
B = 100 + 200 = 300
C = 100 + 100 = 200

.A { flex: 1; }        /* 内容 400px */
.B { flex: auto; }     /* 内容 100px */
总基础尺寸：0 + 100 = 100
剩余：800 - 100 = 700px
grow 分配：1:1
最终：0 + 350 = 350px
100 + 350 = 450px

```

**为什么 flex 子元素设置 width 不生效？**因为：**flex-basis** 优先级更高

## Grid 布局

#### Grid 布局与 Flex 布局有什么区别？适用场景分别是什么？


|      |           |             |
| ---- | --------- | ----------- |
| 特性   | Flexbox   | Grid        |
| 维度   | 一维布局（行或列） | 二维布局（行和列同时） |
| 内容驱动 | 内容决定布局    | 容器决定布局      |
| 对齐方式 | 单轴对齐      | 双轴对齐        |
| 适用场景 | 组件级布局、导航栏 | 页面级布局、复杂网格  |


**适用场景：**

- **Flexbox**：导航栏、按钮组、卡片列表、居中布局
- **Grid**：整体页面布局、复杂表单、图片画廊、仪表盘

#### 使用 Grid 实现以下布局：

1. 九宫格：把容器切成：3列 × 3行

```C++

.grid-nine {
  display: grid;
  grid-template-columns: repeat(3, 1fr);  /* 3列等分 */
  /* 等于 grid-template-columns: 1fr 1fr 1fr; 1fr 是 Grid 最核心单位，表示 fraction（剩余空间比例） */
  grid-template-rows: repeat(3, 1fr);     /* 3行等分 */
  gap: 10px;
}
```

1. 圣杯布局

```
┌────────────────────┐
│             header              │
├──────┬──────┬──────┤
│     left │   center │   right  │
├──────┴──────┴──────┤
│             footer              │
└────────────────────┘
```

`auto`：内容需要多大，我就多大，自适应内容尺寸

`1fr`：剩余空间，我来分，吃掉剩余所有空间

```CSS
.grid-holy-grail {
  display: grid;
  grid-template-columns: 200px 1fr 200px;  /* 左 中 右 */
  grid-template-rows: auto 1fr auto;       /* 头 内容 尾 */
  grid-template-areas:
    "header header header"
    "left center right"
    "footer footer footer";
  min-height: 100vh;
}
.grid-holy-grail header { grid-area: header; }
.grid-holy-grail .left { grid-area: left; }
.grid-holy-grail .center { grid-area: center; }
.grid-holy-grail .right { grid-area: right; }
.grid-holy-grail footer { grid-area: footer; }
```

1. 不规则网格（部分单元格跨行列）

```CSS
.grid-irregular {
  display: grid;
  grid-template-columns: repeat(4, 1fr);   /* 4 列会产生 5根列线 */
  grid-template-rows: repeat(3, 100px);
  gap: 10px;
}
.grid-irregular .item1 {
  grid-column: 1 / 3;  /* 跨2列， 从列线1 到列线3 */
  grid-row: 1 / 3;     /* 跨2行 */
}
.grid-irregular .item2 {
  grid-column: 3 / 5;  /* 跨2列 */
}
```

Grid 为什么适合跨端？

```css
.grid {
  display: grid;
  grid-template-columns:
    repeat(auto-fit, minmax(240px, 1fr));
  gap: 16px;
}
```

自动生成尽可能多的列，每列最少 240px，多余空间平均分，卡片之间间隔 16px，屏幕缩小时自动换行。
它的特点：自动换行；自动计算列数；自动适配宽度

## 两栏 / 三栏布局方式

一般两栏布局指的是**左边一栏宽度固定，右边一栏宽度自适应**，两栏布局的具体实现：

**左侧浮动 + 右侧 margin-left，宽度设置为auto**

**左侧浮动 + 右侧 BFC（利用 BFC 避免重叠）**：左侧元素设置固定宽度并左浮动，右侧元素设置`overflow: hidden`触发BFC，BFC区域不会与浮动元素发生重叠，从而实现左右布局。

1. **缺点：**
  1. `overflow: hidden`可能隐藏右侧超出容器的内容（如下拉菜单）；
  2. 左侧浮动可能导致**父容器高度塌陷**（若父容器没有其他文档流元素，高度会变为 0），最常用的是「clearfix 清除浮动法」，通过**伪元素强制父容器识别浮动元素**，结果： 左右栏的高度互不影响，父容器高度由非浮动内容 + clearfix 共同决定，最终等于左右两栏中“最高的那一个”。

```CSS
.outer {
   border: 1px solid #000;
}

.outer::after {
  content: ""; /* 伪元素必须有content */
  display: block; /* 转为块级元素 */
  clear: both; /* 清除左右两侧浮动 */
}

.left {
  float: left;
  width: 100px;
  height: 200px;
  background: red;
}
.right {
  height: 300px; /* 高度可超过左侧，父容器会被撑开 */
  background: blue;
  overflow: hidden; /* 触发BFC，BFC 区域会自动在布局中避开浮动元素的空间 */
}
/* or */
.right {
  background: blue;
  margin-left: 100px;
}
```

**利用flex布局**， 父容器设置 `display: flex`，左侧元素固定宽度，右侧设置 `flex: 1` 实现自适应。沿主轴（默认水平方向）排列。

```CSS
.outer {
  display: flex;
  height: 100px;
}
.left {
  width: 200px;
  background: tomato;
}
.right {
  flex: 1;
  background: gold;
}
```

**利用绝对定位**，将父级元素设置为相对定位。左侧通过设置`position: absolute`固定在左侧，并设置宽度，不占据文档流空间。右侧默认会占据整个父容器宽度，通过`margin-left: 200px`在左侧预留空间，避免与`.left`重叠，形成两栏。

1. 缺点：
  1. 若父容器未设置固定高度`height: auto`，`.left` 如果比 `.right` 高 → **父容器不会被撑开**，会出现“溢出”现象。解决方案：手动同步父容器高度

```CSS
.outer {
  position: relative;
  border: 1px solid #000;
  height: 300px;
}
.left {
  position: absolute; /* 完全脱离文档流 */
  left: 0;  top: 0;
  width: 200px; height: 200px;
  background: tomato;
}
.right {
  margin-left: 200px; /* 预留左侧宽度，避免重叠 */
  height: 300px;
  background: gold;
}
```

**三栏布局一般指的是页面中一共有三栏，左右两栏固定，中间自适应的布局，三栏布局的具体实现L:L:**

1. **两边浮动 + 中间 margin（基础浮动方案）**：左右列分别左浮动、右浮动，脱离文档流并固定在两侧；中间列通过`margin-left: 200px`和`margin-right: 200px`在左右两侧预留空间，自身宽度自动填充剩余区域。**缺点**：中间列必须写在左右列之后（否则右列会被挤到下一行），无法实现 “中间列优先加载”；

```CSS
.left, .right {
  width: 200px;
  float: left;
}

.center {
  margin: 0 200px;
}
```

1. **两边绝对定位 + 中间 margin / 定位（定位方案）**：父容器相对定位，左右列通过`position: absolute`脱离文档流，分别固定在父容器左侧和右侧；中间列通过margin或定位属性留出空间。**缺点：**左右列脱离文档流，若高度超过父容器会溢出（需手动控制高度）；
2. **Flex 布局（现代推荐方案）**：父容器`display: flex`后，子元素沿主轴（默认水平）排列；**左右列固定宽度，中间列通过flex:1**自适应填充剩余空间。

```CSS
.container {
  display: flex;
}
.left, .right {
  width: 200px;
}
.center {
  flex: 1;
}
```

1. **grid 布局**: 左右两栏固定宽度，中间自适应宽度

```JavaScript
.container {
  display: grid;
  grid-template-columns: 200px auto 200px;
}
```

## 解释一下浮动及清除浮动？

浮动元素**会脱离正常文档流**（但不完全脱离，会影响周围元素的排列），向左 / 右移动，直到碰到父容器边缘或其他浮动元素。

浮动元素 **不再占据原来的块级空间，**后面的 **块级元素会“当它不存在”；**

但注意：**文字和行内元素** 会环绕浮动元素，这是浮动最初的设计目的（图文环绕）

**浮动元素引起的问题——父容器高度塌陷**（最常见）
当父容器没有设置固定高度，且所有子元素都浮动时，父容器会失去高度（高度为 0），导致后续元素可能 “钻” 到浮动元素下方，破坏布局。

**如何清除浮动？**

清除浮动的核心目的是**让父容器重新包裹浮动子元素**，或**让后续元素不受浮动影响。**

1. **父元素触发 BFC（块格式化上下文）：**BFC 是 CSS 中的一种渲染机制，具有 **“包裹内部浮动元素”** 的特性。通过给父元素添加`overflow: hidden`，父元素形成新的 BFC，自动包裹浮动子元素。
2. **伪元素清除法（推荐）：**通过父元素的`::after`伪元素模拟 “空元素”，既不增加冗余标签，又能清除浮动：

```JavaScript
.parent::after {
  content: "";
  display: block;
  clear: both;
}
```

## 对BFC的理解，如何创建BFC

**BFC是块级格式上下文**（Block Formatting Context，BFC），**是一个独立的布局环境，只有块级盒子参与，在BFC布局里面的元素不受外面元素影响，也不会影响外部元素。**

++***规则1：BFC 是一个独立布局环境***++

++***规则2：BFC 计算高度时会包含浮动元素***++

**创建BFC条件**

- **设置浮动：**`float`**为left、right**
- **设置绝对定位：** `position（absolute、fixed）`
- `overflow`值为：`hidden`**、**`auto`**、**`scroll`。overflow 属性规定当内容溢出元素框时发生的事情。这个属性定义溢出元素内容区的内容会如何处理。`overflow` **的值除了** `visible`**，都会触发 BFC，BFC 会 包含浮动元素，让父容器撑开高度。**
- `display`值为：`inline-block`、`table-cell`、`table-caption`、`flex`等

**BFC的特性、作用**：

- **清除浮动（解决父元素高度塌陷）**：当父元素的子元素设置浮动（`float: left/right`）时，子元素会脱离文档流，导致父元素无法识别其高度，从而出现「高度塌陷」（父元素高度为 0，无法包裹子元素）。

```CSS
.clearfix {        /* 给父元素添加该类 */
  overflow: hidden; /* 触发BFC，包含浮动子元素 */
}
.parent {
  border: 2px solid red;
}
.child {
  float: left;
  width: 100px;
  height: 100px;
  background: blue;
}
```

> 当父元素没有 border、padding 或 BFC 时，子元素的 margin-top 会与父元素发生 **margin collapse**，导致这个 margin 作用在父元素上，使父元素整体向下移动，而不是子元素在父元素内部产生间距。

- **阻止margin合并（重叠）**：相邻的块级元素（或嵌套元素）在垂直方向上的 **margin 会自动「合并」**（取较大值而非相加），但如果它们处在不同的 BFC 中则不会合并。

1. 相邻兄弟元素之间
2. 父元素与第一个/最后一个子元素之间
3. 空块级元素的上下 margin

```CSS
/* 即使父元素触发了 BFC，兄弟元素之间仍会 margin collapse，需要让其中一个元素形成 BFC*/
.container {
  overflow: hidden; /* BFC */
  background: #eee;
}

.box1 {
  height: 100px;
  background: pink;
  margin-bottom: 20px;
}

.box2 {
  height: 100px;
  background: skyblue;
  margin-top: 30px;
}

/*child 在 parent 内部下移 50px，parent 自己不会被顶下去*/
.parent {
  overflow: hidden; /* 触发 BFC */
  background: #eee;
}

.child {
  height: 100px;
  background: pink;
  margin-top: 50px;
}
```

## 元素的水平&垂直居中

1. **行内元素水平居中：**`text-align: center;`(常用于子元素为行内元素或inline-block)
2. **块级元素水平居中：**`margin: 0 auto;`（常用于固定宽度的块级元素）

```CSS
.center {
  width: 300px;
  margin: 0 auto;
}
```

1. **垂直居中：**`line-height`等于高度（适用于单行文字）

```CSS
.center-text {
  height: 50px;
  line-height: 50px;
}
```

1. 水平+垂直居中（核心场景）
  1. **使用flex实现双向居中**（最推荐，兼容性好，响应式强）

```CSS
.center {
  display:flex;
  jusity-content: center;
  align-items: center;
}
```

1. **Grid 布局实现居中**

```JavaScript
.container {
  display: grid;
  place-items: center; /* 等价于 justify + align 同时居中 */
}
```

1. **position + transform** （兼容性好，经典）

```CSS
.center {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%)
}
```

1. **position + margin** （仅限固定大小元素，不适应动态内容或响应式）

```CSS
.center {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 200px;
  height: 100px;
  /* 负 margin（值为自身宽高的一半）*/
  margin-left: -100px;
  margin-right: -50px;
}
```

## 对盒子模型的理解

CSS 盒子模型（CSS Box Model）是 **CSS 布局的核心概念**，它将所有 HTML 元素都抽象为一个 “盒子”，用于控制元素的尺寸、间距、边框以及与其他元素的位置关系。

盒模型都是由四个部分组成的，分别是`margin`、`border`、`padding`和`content`。

通过修改元素的`box-sizing`属性来改变元素的盒模型

- `box-sizing: content-box`表示W3C标准盒模型（默认值）。**width 和 height 指的是内容区域的宽度和高度**。**增加 padding、border 会增加元素框的总尺寸。**
- `box-sizing: border-box`表示IE怪异盒模型。**width 和 height 指的是内容区域+padding+border**的宽度和高度，设置 `width` 后，无论如何调整 `padding` 和 `border`，元素总宽度都不会超出设置值（避免布局错乱）。**内容区域会自动缩小以适应 padding 和 border**

## CSS 选择器和优先级

CSS选择器的优先级，它决定了当多条CSS规则冲突时，哪些规则将被应⽤到HTML元素上。

**选择器**

CSS选择器的优先级由三个主要部分组成，通常表⽰为⼀个四元组（a, b, c, d）：


|                                           |        |
| ----------------------------------------- | ------ |
| **选择器**                                   | **权重** |
| 内联选择器（样式是在HTML元素的 style 属性中定义的）           | 1000   |
| id选择器 #id                                 | 100    |
| 类选择器 .classname                           | 10     |
| 属性选择器 div[class="foo"]                    | 10     |
| 伪类选择器 div:last-child、:nth-child(n)、:hover | 10     |
| 元素选择器 div                                 | 1      |
| 伪元素选择器 div::after、div::before             | 1      |
| 兄弟选择器 div+span                            | 0      |
| 子选择器 ui>li                                | 0      |
| 后代选择器 div span                            | 0      |
| 并集选择器 element,element                     | 0      |
| 通配符选择器 p ~ img                            | 0      |


**优先级**

计算遵循以下规则：

- ⽐较规则从左到右进⾏，先⽐较a，如果a相同，则⽐较b，依此类推。
- 如果某⼀级别相同，则继续向右⽐较下⼀级别。
- 较⾼优先级的CSS规则将覆盖其他较低优先级的规则

## CSS伪类与CSS伪元素的区别

- 伪类：伪类的**操作对象是文档树（**`HTML文档树被解析之后，转化为DOM树`**）中已有的元素。**例如：`:link > :visited > :hover > :active`、 `:first-child :focus`等；

`:link`：未被访问过的链接（仅对 `<a>` 标签有效，且需设置 `href` 属性）。

`:visited`：已被访问过的链接。

`:hover`：鼠标悬停在链接上时的状态。

`:active`：链接被点击（激活）的瞬间状态（比如鼠标按下但未松开时）。

- **伪元素**：用于创建**不在 DOM 中的虚拟元素**，或选择元素的**特定部分**（如首字母、第一行等），本质是对元素的某部分进行样式化。例如：在元素内容前插入虚拟内容`::before`、`::first-line` 伪元素用于向文本的首行设置特殊样式等。

## 隐藏元素的方式

- `display：none`：元素在文档中不存在，不会占据位置。**元素节点仍然存在于 DOM 中，但它** **不参与页面渲染**，**不会占据任何位置。**
- `visibility： hidden`：**元素在文档中的位置还保留**，仍然占据空间。
- `opacity：0`：**将透明度设置为0，和visibility的效果类似**，但是该属性修饰的元素可以使用transition和animate设置动画效果。
- `z-index`：负值：直接将元素放置在最下层，利用其他元素来遮盖。
- `position：absolute`：将元素定位到可视区域以外。

## Z-index

`z-index` 用于 **控制元素在 z 轴（前后）方向的堆叠顺序**

**只对定位元素生效**：`position` 必须是 `relative | absolute | fixed | sticky`

**z-index 不生效的几种常见情况**

1. ++**元素没有定位（position 默认 static）**++
2. ++**当父元素创建了堆叠上下文时，子元素的 z-index 只在父元素内部有效。**++
  +**即使子元素的 z-index 比其他上下文中的元素高，也不能覆盖父元素之外的元素。**++

```HTML
<div class="parent">
  <div class="child"></div>
</div>

<div class="other"></div>

.parent {
  position: relative;
  z-index: 1;   /* 形成堆叠上下文 */
}

.child {
  position: absolute;
  z-index: 9999;  /* 很大 */
}

.other {
  position: relative;
  z-index: 2;
}
```

`.other` **在** `.child` **上面 ❗**

### 第一步：比较“父级上下文”

- `.parent` → z-index = 1
- `.other` → z-index = 2

👉 所以：

.other 整体 > .parent 整体

### 第二步：child 再高也没用

虽然：

.child z-index = 9999

但：

👉 它 **只能在 parent 这块玻璃内部排第一**

👉 但整个 parent 这块玻璃：

还是在 .other 下面 ❗

**触发堆叠上下文的情况**

- `position` + `z-index`（除 auto 外）
- `opacity` < 1

 元素被 `opacity < 1`、`transform`、`filter` 等创建了堆叠上下文

## display的属性和作用


|              |                               |
| ------------ | ----------------------------- |
| 属性           | 作用                            |
| none         | 隐藏元素                          |
| block        | 块类型。默认宽度为父元素宽度，可设置宽高，换行显示。    |
| inline       | 行内元素类型。默认宽度为内容宽度，不可设置宽高，同行显示。 |
| inline-block | 行内块级元素，默认宽度为内容宽度，可以设置宽高，同行显示  |
| table        | 块级表格                          |
| flex         | flex容器布局                      |
| grid         | 网格布局                          |


## position 常用属性 默认值是什么

- `static` 默认值，没有定位，元素正常在文档流中显示
- `relative` 元素的位置相对于自身进行了调整，而没有更改布局（因此，如果没有放置元素，将为元素留出一定的空隙）。你可以使用 `top`, `bottom`, `left`, `right` 属性来微调它的位置，但这个偏移是 **相对于元素原本在页面中的位置** 来计算的。换句话说，如果你给一个元素加上 `relative` 并偏移它，它会“漂浮”在自己的原位置上，**但原位置仍然存在**，**这和** `position: absolute` **或** `position: fixed` **不同，后者会脱离文档流，原位置会被其他元素占用**。
- `absolute` 元素从页面文档流中删除，并且**相对于其最接近的（非static）祖先**（如果有）或相对于初始包含块而定位在指定的位置。绝对定位的盒子可以有边距，并且不会与其他任何边距一起折叠。这些元素不会影响其他元素的位置。
- `fixed` 将元素从页面流中移除，并将其放置在**相对于视口的指定位置**，并且在滚动时不会移动。
- `sticky` 粘性定位，它基本上是**相对位置和固定位置的混合体**，它允许被定位的元素表现得像相对定位一样，直到它滚动到某个阈值点（例如，从视口顶部起 10 像素）为止，此后它就变得固定了。例如，它可用于使导航栏随页面滚动直到特定点，然后粘贴在页面顶部。

## requestAnimationFrame

浏览器提供的一种用于**实现高性能动画的原**生 API，其主要作用是在**浏览器下一次重绘前执行一个回调函数**，从而实现与**浏览器刷新率同步**的动画效果。

它的回调函数会在**每一帧执行（通常是 60 次每秒）**，并接收一个高精度时间戳作为参数，方便开发者计算动画的执行进度。同时，`requestAnimationFrame` **在页面不可见时会自动暂停调用**，从而节省资源，非常适合用于动画、游戏渲染、滚动监听等高频任务。

相比于传统的 `setTimeout` 和 `setInterval`，它在动画流畅性、性能优化和资源管理方面有明显优势。**传统方式的问题**是：**JS 执行时间不稳定、页面可能卡顿、浏览器不保证精确 16ms**。`requestAnimationFrame` 具有更高的时间精度、自动匹配当前屏幕刷新率、自动调节执行频率、**自动在后台暂停**。

通过配合 `cancelAnimationFrame`，开发者也可以灵活控制动画的开启和终止。

## HTML

## HTML5 新增特性

- 新的选择器 `document.querySelector`、`document.querySelectorAll`
- 媒体播放的 `video` 和 `audio` 标签
  - 以前用的 flash 实现
- 本地存储 `localStorage` 和 `sessionStorage`
- 浏览器通知 `Notifications`
- ++**语义化标签，例如**++ `header`++**，**++`nav`++**，**++`footer`++**，**++`section`++**，**++`article` ++**等标签**++
- 地理位置 `Geolocation`
- 多任务处理 `web worker`

运行在后台的JS，独立于其他脚本，不影响性能

## 对HTML语义化理解

- **有利于SEO优化**，让**页面和搜索引擎**建立良好的沟通，爬虫依赖于标签来确定上下文和各个关键词的权重，有助于爬虫抓取更多的有效信息；
- 一个语义元素能够清楚的描述其意义给浏览器和开发者，即使在去掉或丢失样式的时候，也能够让页面呈现出清晰的结构；
- 语义化标签 ： header footer main aside article section

## img标签title、alt、srcset

`alt`：图片加载失败时，显示alt的内容，利于SEO

`title`：鼠标移动到图片上时，显示title的内容

响应式页面中经常用到根据屏幕密度设置不同的图片。这时就用到了 img 标签的srcset属性。srcset属性用于设置不同屏幕密度下，img 会自动加载不同的图片。

srcset属性用于指定不同分辨率的图像

## iframe

iframe 元素 **可以在一个网站里面嵌入另一个网站内容**

优点

1. 实现一个窗口同时**加载多个第三方域名下内容**
2. 增加代码复用性

缺点：

1. 搜索引擎无法识别、不利于SEO
2. 影响首页首屏加载时间
3. 兼容性差
4. 阻塞主页面的 onload 事件

## title与h1的区别、b与strong的区别、i与em的区别？

- `<title>` 是**给浏览器和搜索引擎**看的页面标题；`<h1>` 是**给用户和搜索引擎**看的页面内容主标题。
- `strong` 标签有**语义**，表示语气或重要性上的强调；`b` 标签仅仅是**样式上的加粗**，不表达任何语义。
- `em` **表示语义上的强调，**语音阅读时会有语调变化；`i` **只是视觉上的斜体展示。**

## 对 web worker 的理解

Web Worker 是浏览器提供的**多线程机制**，它允许在后台线程中运行 JS 脚本，从而避免阻塞主线程。**主线程负责 UI 渲染和 DOM 操作**，**Worker 线程负责耗时计算，两者通过 postMessage 进行通信。**

它适用于 CPU 密集型任务，如大数据计算、图像处理等，但不能操作 DOM，也不能访问 window。

## 表格相关标签（`table`）

- `<table>`：表格容器
- `<thead>`：表头区域（列标题）
- `<tbody>`：表格主体数据
- `<tr>`：表格行
- `<th>`：表头单元格（自带加粗、居中、语义）
- `<td>`：普通单元格

## 常见表单控件

- **单选框**：`<input type="radio">`：同一组选项需 **name 相同**
- **复选框**：`<input type="checkbox">`：可多选
- **下拉选择**：

```HTML
<select>
  <option>选项</option>
</select>
```

- **多行文本**：`<textarea>`：用于输入长文本

## CSS

## 常用的布局方案有哪些

- 传统布局（float）：盒模型、清除浮动、居中、BFC 等问题；
- Flexbox:一维布局，居中、响应式等问题;
- position 布局:relative 相对谁，居中问题。

## CSS3新增特性

- 新增CSS选择器、伪类选择器如 `:nth-child()`、`:nth-of-type()`、`:not()` 等。
- flex / grid  布局
- 特效：`text-shadow`、`box-shadow`、`border-radius`
- 线性渐变: `gradient`，如渐变背景: `background: linear-gradient(to right, red, blue);`
- 旋转过渡：`transform`、`transtion`
- 动画: `animation`

## CSS 怎么添加到网页中

1. 行内样式：`<p style="font-size: 12px; ">行内样式：</p>`
2. 嵌入样式：`<style type="text/css"> h1 {font-size:16px;} </style>`
3. 链接样式：`<link href="styles.css" rel="stylesheet" type="text/css" />`
4. @import 导入指令: `@import url(css/styles2.css)`

link vs import

- link属于HTML，通过标签中的href属性来引入外部文件，而@import 属于CSS，所以导入语句应该写在CSS中，要注意的是导入语句应写在样式表的开头，否则无法正确导入外部文件
- @import是CSS2.1才出现的概念，会有兼容性的问题

## 常见的CSS单位

**绝对单位**

绝对单位的值是固定的，不随其他元素或视口尺寸变化而变化。常见的绝对单位包括：

- **像素（px）**：最常用的单位之一，表示屏幕上的一个点。

**相对单位**

相对单位的值是相对于其他元素的尺寸或视口尺寸而言的，它们可以提供更灵活的布局方式。常见的相对单位包括：

- **em**：**相对于当前元素的字体大小。**1em等于当前元素的字体大小，例如如果当前元素的字体大小为16px，则1em等于16px。

```CSS
html { font-size: 16px; }

.parent {
  font-size: 20px;
  padding: 2em;      /* 40px (相对于自身 20px) */
}

.child {
  font-size: 1.5rem; /* 24px (相对于 html 16px) */
  margin: 1em;       /* 24px (相对于自身 24px) */
}
```

- **rem**：相对于**根元素（即**`html`**元素）**的字体大小。rem单位避免了em单位在嵌套元素中可能出现的缩放问题，因此适合用于全局布局的尺寸控制。

```JavaScript
// 根据视口宽度动态设置 html font-size
function setRem() {
  const designWidth = 375;  // 设计稿宽度
  const baseFontSize = 100; // 1rem = 100px
  const scale = document.documentElement.clientWidth / designWidth;
  document.documentElement.style.fontSize = baseFontSize * scale + 'px';
}
window.addEventListener('resize', setRem);
setRem();
```

- **百分比%**，作用于父元素， 当浏览器的宽度或者高度发生变化时，当前元素依据比例发生变化。
- `vw`：根据视口宽度调整，适合响应式布局。
- `vh`：根据视口高度调整，适合适应屏幕的元素高度。

## CSS可继承属性和不可继承属性

**可继承**

主要文本相关属性，如文字颜色与大小（`color`、`font-size`等），列表样式（`list-style`），可见性（`visibility`）；

```CSS
/* 字体相关 */
font-family, font-size, font-weight, font-style, line-height

/* 文本相关 */
color, text-align, text-indent, text-transform, letter-spacing, word-spacing

/* 其他 */
visibility, cursor, list-style
```

**不可继承**

大多数 CSS 属性是不可继承的，比如宽高、定位，背景相关属性（`background`）

```CSS
/* 盒模型 */
width, height, margin, padding, border

/* 背景 */
background, background-color, background-image

/* 定位 */
position, top, left, right, bottom

/* 显示 */
display, float, clear, overflow
```

## CSS 变量

**CSS 变量（自定义属性）有什么优势？如何使用？**

```CSS
/* 定义变量 */
:root {
  --primary-color: #1890ff;
  --text-color: #333;
  --border-radius: 4px;
  --spacing-unit: 8px;
}

/* 使用变量 */
.button {
  background-color: var(--primary-color);
  color: var(--text-color);
  border-radius: var(--border-radius);
  padding: calc(var(--spacing-unit) * 2);
}

/* 提供默认值 */
.button {
  background-color: var(--primary-color, #1890ff);
}
```

**优势：**

1. **动态修改**：通过 JS 实时更新主题
2. **作用域**：支持局部变量覆盖全局
3. **计算支持**：配合 calc() 使用
4. **语义化**：变量名表达意图

**JS 操作：**

```JavaScript
// 获取变量
const primaryColor = getComputedStyle(document.documentElement)
  .getPropertyValue('--primary-color');

// 修改变量
document.documentElement.style.setProperty('--primary-color', '#ff4d4f');

// 切换主题
function switchTheme(theme) {
  const root = document.documentElement;
  if (theme === 'dark') {
    root.style.setProperty('--bg-color', '#141414');
    root.style.setProperty('--text-color', '#fff');
  } else {
    root.style.setProperty('--bg-color', '#fff');
    root.style.setProperty('--text-color', '#333');
  }
}
```

## 为什么要初始化CSS样式

因为浏览器的兼容问题，不同浏览器对有些标签的默认值是不同的，如果没有初始化CSS，往往会出现浏览器之间的页面显示差异（比如布局错位、间距不一致）；

- `body`标签在 Chrome 中默认`margin: 8px`，而某些旧浏览器可能是`margin: 0`；
- `ul`/`ol`默认带有左侧缩进（`padding-left`）和项目符号，不同浏览器的缩进值不同；
- `h1-h6`的默认字体大小、`p`标签的默认行高、`button`的默认边框和背景色等，浏览器间均存在差异。

## 解释下 CSS sprites 原理，及优缺点？

CSS sprites 其实就是把网页中的一些背景图片整合到一张图片文件中，在利用CSS的 background-image，background-repeat，background-position的组合进行背景定位，background-position可以用数字精确的定位出背景图片的位置。

优点：

- 减少网页的http请求
- 减少图片的字节
- 解决网页设计师在图片命名上的困扰，只需要对一张集合的图片上命名就可以了，不需要对每一个小元素进行命名
- 更换风格方便，只需要在一张或少张图片上修改图片的颜色或样式，整个网页的风格就可以改变了

缺点：

- 在宽屏，高分辨率的屏幕下的自适应页面，如果背景图不够宽，很容易出现背景断裂
- CSS sprites 在开发的时候，需要通过Photoshop或其他工具测量计算每一个背景单元的精确位置
- 在维护的时候比较麻烦，如果页面背景有少许改动，一般就要修改这张合并的图片

## CSS如何实现响应式设计的关键点是什么？

响应式⽹⻚设计（Responsive Web Design, RWD）是⼀种**⽹⻚设计⽅法论**，⽬的是为了让设计在不同的设备（从桌⾯电脑显⽰器到移动电话或其他移动产品的屏幕）上浏览时都能⾃动适应屏幕⼤⼩，为 ⽤⼾提供⽅便的浏览⽅式。

关键技术包括：

- **媒体查询（Media Queries）：**CSS技术， 根据**不同的屏幕尺寸、分辨率，**应用不同的样式。

```CSS
/* 宽度 */
@media (min-width: 768px) { }    /* >= 768px */
@media (max-width: 768px) { }    /* <= 768px */
@media (width: 768px) { }        /* = 768px */

/* 范围 */
@media (768px <= width <= 1200px) { }  /* 现代浏览器 */

/* 方向 */
@media (orientation: portrait) { }   /* 竖屏 */
@media (orientation: landscape) { }  /* 横屏 */

/* 其他 */
@media (hover: hover) { }           /* 支持悬停 */
@media (prefers-color-scheme: dark) { } /* 深色模式 */

/* 当屏幕宽度 大于1200px：大屏布局，侧边栏.sidebar正常显示 */
@media (min-width: 1200px) {
  .sidebar { display: block; }
}

/* 当屏幕宽度 小于768px：隐藏侧边栏、改为单列 */
@media (max-width: 768px) {
  .sidebar { display: none; }
  .content { width: 100%; }
}
```

**移动端优先 (Mobile First)：**

```CSS
/* 基础样式：移动端 */
.container {
  width: 100%;
  padding: 10px;
}

/* 平板 */
@media (min-width: 768px) {
  .container {
    width: 750px;
    margin: 0 auto;
  }
}

/* 桌面 */
@media (min-width: 1200px) {
  .container {
    width: 1170px;
  }
}
```

**桌面端优先 (Desktop First)：**

```CSS
/* 基础样式：桌面端 */
.container {
  width: 1170px;
  margin: 0 auto;
}

/* 平板 */
@media (max-width: 1199px) {
  .container {
    width: 750px;
  }
}

/* 移动端 */
@media (max-width: 767px) {
  .container {
    width: 100%;
    padding: 10px;
  }
}
```

- **流式布局：**
- 使用**百分比** `%` **or** `calc()`来代替固定 `px`，让元素宽度随父容器或视口缩放。

```CSS
.container {
  width: 90%;   /* 随屏幕变化 */
  max-width: 1200px; /* 保持合理上限 */
}
```

- **弹性布局或网格布局：**
  - 使用 `flex` **或** `grid` **布局**，让元素在不同屏幕宽度下自动分配空间：

```CSS
.nav {
  display: flex;
  justify-content: space-between;
}
```

- **视口单位(vw/vh/vmin/vmax) 与** `clamp()`

#### 移动端适配有哪些方案？各有什么优缺点？


|             |                   |             |            |
| ----------- | ----------------- | ----------- | ---------- |
| 方案          | 原理                | 优点          | 缺点         |
| Viewport 缩放 | 固定宽度，缩放适配         | 简单，1:1还原设计稿 | 字体/线条可能模糊  |
| Rem 适配      | 根字体动态计算           | 精确控制，兼容性好   | 需要 JS 支持   |
| Vw/Vh 适配    | 视口百分比             | 原生支持，无需 JS  | 兼容性稍差，小数像素 |
| Flexible 方案 | 动态 viewport + rem | 综合优势        | 复杂度较高      |


**Viewport 设置：**

```HTML
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
```

**现代推荐方案（vw）：**

```CSS
/* 设计稿 375px，1vw = 3.75px */
.container {
  width: 100vw;
  padding: 2.6667vw;  /* 10px / 3.75 */
  font-size: 4.2667vw; /* 16px / 3.75 */
}

/* 使用 CSS 预处理器简化 */
@function vw($px) {
  @return ($px / 375) * 100vw;
}

.container {
  padding: vw(10);
  font-size: vw(16);
}
```

## 性能优化与渲染机制

**触发重排的属性：**

```CSS
/* 几何属性 */
width, height, padding, margin, border
position, top, left, right, bottom
display, float, clear
overflow, overflow-x/y
```

**触发重绘的属性：**

```CSS
/* 外观属性 */
color, background-color, background-image
border-color, border-radius
box-shadow, text-shadow
visibility, opacity
```

**优化策略：**

```JavaScript
// 1. 批量修改样式（使用 cssText 或 class）
const el = document.getElementById('box');

// 不好：触发3次重排
el.style.width = '100px';
el.style.height = '100px';
el.style.margin = '10px';

// 好：只触发1次
el.style.cssText = 'width: 100px; height: 100px; margin: 10px;';
// 或
el.className = 'new-class';

// 2. 离线操作（DocumentFragment）
const fragment = document.createDocumentFragment();
for (let i = 0; i < 100; i++) {
  const li = document.createElement('li');
  fragment.appendChild(li);
}
document.getElementById('list').appendChild(fragment);

// 3. 使用 transform 代替位置属性
// 不好
box.style.left = '100px';

// 好（不会触发重排，使用 GPU 加速）
box.style.transform = 'translateX(100px)';

// 4. 避免强制同步布局
// 不好
const width = box.offsetWidth;  // 读取
box.style.width = width + 10 + 'px';  // 写入
const height = box.offsetHeight;  // 再次读取（强制同步布局）

// 好：先读后写
const width = box.offsetWidth;
const height = box.offsetHeight;
box.style.width = width + 10 + 'px';
box.style.height = height + 10 + 'px';
```

#### CSS 性能优化有哪些常用手段？

1. **选择器优化**

```CSS
/* 避免过深的选择器 */
/* 不好 */
.header .nav ul li a span { }

/* 好 */
.nav-link span { }

/* 避免通配符 */
/* 不好 */
* { margin: 0; }

/* 好 */
body, h1, h2, p { margin: 0; }
```

1. **减少重排重绘**

```CSS
/* 使用 transform 和 opacity（GPU 加速） */
.animated {
  will-change: transform;  /* 提前告知浏览器 */
  transform: translateZ(0); /* 开启硬件加速 */
}

/* 使用 contain 隔离 */
.module {
  contain: layout style paint;  /* 限制影响范围 */
}
```

1. **资源加载优化**

```CSS
/* 关键 CSS 内联 */
<style>
  /* 首屏关键样式 */
</style>
/* 非关键 CSS 异步加载 */
<link rel="preload" href="non-critical.css" as="style" onload="this.rel='stylesheet'">

/* 字体优化 */
@font-face {
  font-family: 'MyFont';
  src: url('font.woff2') format('woff2');
  font-display: swap;  /* 先显示后备字体 */
}
```

1. **其他优化**

```CSS
/* 使用 CSS 变量减少重复 */
:root {
  --primary: #1890ff;
}

/* 使用 content-visibility 延迟渲染 */
.card {
  content-visibility: auto;
  contain-intrinsic-size: 0 500px;
}
```

## **transition 和 animation**


|      |            |              |
| ---- | ---------- | ------------ |
| 特性   | Transition | Animation    |
| 触发方式 | 需要事件触发     | 自动播放         |
| 关键帧  | 只有开始和结束    | 支持多关键帧       |
| 循环播放 | 不支持        | 支持           |
| 播放控制 | 有限         | 完整控制（暂停、播放等） |
| 适用场景 | 简单状态变化     | 复杂动画效果       |


`transition` **用来在 *两个状态之间* 平滑地过渡 CSS 属性。适用于** hover 动效、按钮点击反馈、展开收起、弹窗出现消失、类名切换动画

- **触发机制**：它不会主动执行，它必须满足两个条件：某个 CSS 属性发生变化；该属性在 transition 里被声明。

```CSS
.box {
  width: 100px;
  transition: width 0.5s;
}

.box:hover {
  width: 200px;
}

```

- **控制精度：** 只能 A → B

```CSS
opacity: 0 → 1
width: 100 → 200

```

`animation`  **= 自己定义运动过程（多个阶段）。适用于** 加载动画、进度条循环、复杂轨迹运动、呼吸灯效果、页面入场动画

- **触发机制：**animation 不需要状态变化，页面加载后自动执行。

```CSS
@keyframes slideIn {
  from {
    transform: translateX(-100%);
    opacity: 0;
  }
  50% {
    opacity: 0.5;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

.box {
  animation: slideIn 0.5s ease-out forwards;
  /* name duration timing-function fill-mode */
}
```

- **控制精度：** 可以定义多个关键帧

```CSS
@keyframes move {
  0%   { transform: translateX(0); }
  50%  { transform: translateX(100px); }
  100% { transform: translateX(0); }
}
```

## CSS 预处理器（Sass/Less/Stylus）

**优势：**

1. **变量**：可复用的值
2. **嵌套**：更清晰的层级结构
3. **混入 (Mixin)**：可复用的代码块
4. **继承**：代码复用
5. **运算**：数学计算
6. **函数**：复杂的逻辑处理
7. **模块化**：文件拆分与导入

**Sass 示例：**

```TypeScript
// 变量
$primary-color: #1890ff;
$spacing-unit: 8px;

// 嵌套
.nav {
  background: $primary-color;

  &__list {  // & 表示父选择器，编译为 .nav__list
    display: flex;
  }

  &__item {
    padding: $spacing-unit * 2;

    &:hover {
      background: darken($primary-color, 10%);
    }
  }
}

// Mixin
@mixin flex-center {
  display: flex;
  justify-content: center;
  align-items: center;
}

.box {
  @include flex-center;
}

// 带参数的 Mixin
@mixin button($bg-color, $text-color: white) {
  background: $bg-color;
  color: $text-color;
  padding: 8px 16px;
  border-radius: 4px;

  &:hover {
    background: darken($bg-color, 10%);
  }
}

.btn-primary {
  @include button(#1890ff);
}

.btn-danger {
  @include button(#ff4d4f);
}

// 继承
%clearfix {
  &::after {
    content: '';
    display: block;
    clear: both;
  }
}

.container {
  @extend %clearfix;
}

// 函数
@function rem($px) {
  @return $px / 16 * 1rem;
}

.title {
  font-size: rem(24);
}

// 条件与循环
@for $i from 1 through 12 {
  .col-#{$i} {
    width: percentage($i / 12);
  }
}

// 模块化
@import 'variables';
@import 'mixins';
@import 'components/button';
```

#### CSS Modules、BEM、CSS-in-JS 各有什么特点？如何选择？


|             |          |           |         |              |
| ----------- | -------- | --------- | ------- | ------------ |
| 方案          | 原理       | 优点        | 缺点      | 适用场景         |
| BEM         | 命名规范     | 简单，无构建依赖  | 类名冗长    | 传统项目         |
| CSS Modules | 构建时转换    | 局部作用域，无冲突 | 需要构建工具  | React/Vue 项目 |
| CSS-in-JS   | JS 运行时生成 | 动态样式，组件化  | 运行时开销   | React 项目     |
| Scoped CSS  | 属性选择器    | 原生支持      | 深度选择器问题 | Vue 项目       |


**BEM：**

```TypeScript
/* Block Element Modifier */
.card { }                    /* Block */
.card__title { }             /* Element */
.card__button { }
.card--large { }             /* Modifier */
.card__button--primary { }
```

**CSS Modules：**

```TypeScript
/* Button.module.css */
.button {
  background: blue;
}
.primary {
  composes: button;
  background: green;
}
```

```JavaScript
// Button.jsx
import styles from './Button.module.css';

function Button() {
  return <button className={styles.primary}>Click</button>;
  // 编译后: class="Button_primary__3d7x2"
}
```

**CSS-in-JS (Styled-components)：**

```JavaScript
import styled from 'styled-components';

const Button = styled.button`
  background: ${props => props.primary ? 'blue' : 'white'};
  color: ${props => props.primary ? 'white' : 'blue'};
  padding: 8px 16px;

  &:hover {
    opacity: 0.8;
  }
`;

// 使用
<Button primary>Primary</Button>
<Button>Default</Button>

```

**选择建议：**

- **Vue 项目**：Scoped CSS + BEM
- **React 项目**：CSS Modules 或 CSS-in-JS
- **大型项目**：CSS Modules（性能更好）
- **需要动态样式**：CSS-in-JS

### PostCSS 与现代 CSS

**PostCSS** 是用 JavaScript 工具和插件转换 CSS 的工具。

**常用插件：**


|                    |             |
| ------------------ | ----------- |
| 插件                 | 作用          |
| autoprefixer       | 自动添加浏览器前缀   |
| postcss-preset-env | 使用未来 CSS 特性 |
| postcss-nested     | 嵌套语法        |
| cssnano            | CSS 压缩      |
| postcss-import     | @import 处理  |
| tailwindcss        | 原子化 CSS 框架  |


**配置示例：**

```JavaScript
// postcss.config.js
module.exports = {
  plugins: [
    require('postcss-import'),
    require('tailwindcss'),
    require('postcss-preset-env')({
      stage: 1,  // 使用实验性特性
      features: {
        'nesting-rules': true,
      },
    }),
    require('autoprefixer'),
    require('cssnano')({
      preset: 'default',
    }),
  ],
};
```

**未来 CSS 特性：**

```SQL
/* 嵌套（原生支持） */
.card {
  background: white;

  &:hover {
    background: gray;
  }

  /* 等价于 .card .title */
  .title {
    font-size: 16px;
  }
}

/* 容器查询 */
@container (min-width: 400px) {
  .card {
    display: flex;
  }
}

/* 层叠层 */
@layer base, components, utilities;

@layer base {
  body { margin: 0; }
}

@layer components {
  .btn { padding: 8px; }
}

/* 作用域样式 */
@scope (.card) {
  .title { /* 只匹配 .card 内部的 .title */ }
}
```

## 其他写题

#### 实现一个三角形

```CSS
/* 等边三角形 */
/* border 的：50px其实就是边框厚度,就是“中心”顶点到边的距离 */
/* transparent 是存在，但是颜色透明 */

.triangle {
  width: 0;
  height: 0;
  border-left: 50px solid transparent;
  border-right: 50px solid transparent;
  border-bottom: 86.6px solid red;  /* 50 * 根号3 约等于 86.6 */
}

/* 直角三角形 */
.triangle-right {
  width: 0;
  height: 0;
  border-left: 50px solid transparent;
  border-bottom: 50px solid red;
}

/* 箭头 */
.arrow-up {
  width: 0;
  height: 0;
  border-left: 10px solid transparent;
  border-right: 10px solid transparent;
  border-bottom: 10px solid black;
}
```

#### 实现一个圆形进度条

```XML
<div class="progress-circle">
  <svg viewBox="0 0 100 100">
    <circle class="bg" cx="50" cy="50" r="45"></circle>
    <circle class="progress" cx="50" cy="50" r="45"></circle>
  </svg>
  <span class="text">75%</span>
</div>
```

```CSS
.progress-circle {
  position: relative;
  width: 100px;
  height: 100px;
}

.progress-circle svg {
  transform: rotate(-90deg);
}

.progress-circle circle {
  fill: none;
  stroke-width: 8;
}

.bg {
  stroke: #e6e6e6;
}

.progress {
  stroke: #1890ff;
  stroke-linecap: round;
  stroke-dasharray: 283;  /* 2 * 3.14 * 45 约等于 283 */
  stroke-dashoffset: 70.75;  /* 283 * (1 - 0.75) */
  transition: stroke-dashoffset 0.5s;
}

.text {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 18px;
}
```

**实现文字渐变效果**

```CSS
.gradient-text {
  background: linear-gradient(45deg, #1890ff, #ff4d4f);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  font-size: 48px;
  font-weight: bold;
}
```

#### 实现毛玻璃效果

```CSS
.glass {
  background: rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 16px;
  padding: 20px;
}
```

#### 单行、多行文本溢出

**单行**

```Plain
.single-line {
  width: 200px;           /* 设置固定宽度 */
  overflow: hidden;       /* 内容溢出隐藏 */
  text-overflow: ellipsis;/* 溢出显示省略号 ... */
  white-space: nowrap;    /* 文本不换行 */
}
```

**多行**

```Plain
overflow:hidden
text-overflow: ellipsis;     // 溢出用省略号显示
display:-webkit-box;         // 作为弹性伸缩盒子模型显示。
-webkit-box-orient:vertical; // 设置伸缩盒子的子元素排列方式：从上到下垂直排列
-webkit-line-clamp:3;        // 显示的行数
```

#### **自适应正方形**

```CSS
/* 方式1: padding 百分比 */
.square {
  width: 50%;
  padding-bottom: 50%;  /* 相对于父元素宽度 */
  height: 0;
  position: relative;
}

.square-content {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}

/* 方式2: aspect-ratio (现代浏览器) */
.square-modern {
  width: 50%;
  aspect-ratio: 1 / 1;
}
```

#### 实现 0.5px 边框

```CSS
/* 方式1: 伪元素 + transform 缩放 */
.border-half {
  position: relative;
}

.border-half::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 200%;
  height: 200%;
  border: 1px solid #ccc;
  transform: scale(0.5);
  transform-origin: 0 0;
  pointer-events: none;
}

/* 方式2: 使用 box-shadow */
.border-shadow {
  box-shadow: 0 0 0 0.5px #ccc;
}

/* 方式3: 使用 viewport 单位 */
@media (min-resolution: 2dppx) {
  .border-device {
    border: 0.5px solid #ccc;
  }
}
```

#### 实现 Loading 动画

```XML
<div class="loading">
  <div class="dot"></div>
  <div class="dot"></div>
  <div class="dot"></div>
</div>

```

```CSS
.loading {
  display: flex;
  gap: 8px;
}

.dot {
  width: 12px;
  height: 12px;
  background: #1890ff;
  border-radius: 50%;
  animation: bounce 1.4s ease-in-out infinite both;
}

.dot:nth-child(1) {
  animation-delay: -0.32s;
}

.dot:nth-child(2) {
  animation-delay: -0.16s;
}

@keyframes bounce {
  0%, 80%, 100% {
    transform: scale(0);
  }
  40% {
    transform: scale(1);
  }
}

/* 旋转 Loading */
.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #1890ff;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
```

#### 实现一个三角形，圆，椭圆

通过设置不同方向边框来实现

```CSS
div {
  width: 0;
  height: 0;
  border-top: 50px solid red;
  border-right: 50px solid transparent;
  border-left: 50px solid transparent;
  border-bottom: 50px solid transparent;
}

#css3-circle {
  width:150px;
  height:150px;
  border-radius:50%;
  background-color:#232323;
}

#css3-elipse{
        width:200px;
        height:100px;
        border-radius:50%;
        background-color:#232323;
}
```

#### 旋转圆环

```CSS
.loading {
  width: 40px;
  height: 40px;
  border: 4px solid #ccc;
  border-top-color: #000;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
```

#### 三点跳动

```HTML
.dot {
  width: 10px;
  height: 10px;
  background: #000;
  border-radius: 50%;
  animation: bounce 1.4s infinite;
}

@keyframes bounce {
  0%, 80%, 100% {
    transform: scale(0);
  }
  40% {
    transform: scale(1);
  }
}
```

#### 弹窗实现（遮罩 + 居中）

```CSS
<div class="mask">
  <div class="modal"></div>
</div>
```

```CSS
.mask {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,.5);
}

.modal {
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
}
```

#### Sticky 吸顶

```CSS
.sticky-demo {
  height: 300px;
  overflow-y: auto;
  border: 1px solid #ddd;
}
.sticky-demo .sticky-header {
  position: sticky;
  top: 0;
  background: tomato;
  color: #fff;
  padding: 12px;
}
```

## 如何解决1px

1px 问题指的是：在一些 `Retina`屏幕 的机型上，移动端页面的 `1px` 会变得很粗，呈现出不止 `1px` 的效果。原因很简单——CSS 中的 `1px` 并不能和移动设备上的 `1px` 划等号。

- 直接写`0.5px`
- 利用伪元素，先放大再缩小
- 使用`viewport`缩放来解决

## 纯 CSS Tooltip

```JavaScript
<div class="tip">
  hover me
  <span class="content">提示内容</span>
</div>

.tip {
  position: relative;
}

.content {
  position: absolute;
  bottom: 100%;
  display: none;
}

.tip:hover .content {
  display: block;
}

```

## 其他问题

- Text-decoration：设置/取消字体上的文本装饰 (你将主要使用此方法在设置链接时取消设置链接上的默认下划线。)
- `calc()` —— 动态计算长度： `width: calc(100% - 80px);`
- `clamp()` —— 限制范围的响应式尺寸：`font-size: clamp(14px, 2vw, 18px);`
最小 14px，动态缩放，最大 18px
- `table-layout: fixed` 固定列宽、提升表格渲染性能，只由表格本身的 `width` 或者 第一行（或 `col`）的宽度决定，不再依赖内容长度。
- `border-collapse: collapse` 合并单元格边框，让表格线条更简洁。
- `overflow: visible` overflow: hidden`\`overflow: scroll`

#### H5 适配方案

UI 库自带、flex布局

sass/less中的自定义函数 pxToRem

```css
@base-font-size: 16px;

.pxToRem(@px) {
  @rem: unit(@px / @base-font-size, rem);
  return @rem;
}

body {
  font-size: @base-font-size;
}

h1 {
  font-size: .pxToRem(24px);
}
```

另外一种是直接写px，编译过程利用插件全部转成rem。这样 dom 中元素的大小，就会随屏幕宽度变化而变化了。

在vue-cli3 中装 postcss-pxtorem 插件就可以了，其他平台也是大致差不多的思路。

#### 吃透移动端 1px

**归根结底有两种方案，一种是利用 css 中的transfrom：scaleY(0.5)，另一种是设置 媒体查询根据不同 DPR 缩放**

**利用 css 的 伪元素::after + transfrom 进行缩放**

**为什么用伪元素？** 因为伪元素::after或::before是独立于当前元素，可以单独对其缩放而不影响元素本身的缩放

# 现代跨端方案：原子化 CSS

现在很多团队开始采用：

- TailwindCSS
- UnoCSS
- WindiCSS

核心原因：

响应式能力天然内置。

例如：

```html
<div class="
  grid
  grid-cols-1
  md:grid-cols-2
  lg:grid-cols-4
">
</div>
```

