# 部署与 ACM 模板

## 1. 容器化的理解

- Docker 不是传统虚拟机，而是轻量级容器化技术，用来打包应用及其运行依赖。
- 容器启动快、资源占用低、环境一致性强，适合前后端项目部署。

## 2. 常见操作经验

- 拉取镜像：`docker pull`
- 构建镜像：`docker build`
- 启动容器：`docker run`
- 端口映射与卷挂载：`-p`、`-v`
- 多容器编排：`Docker Compose`

## 3. 镜像部署流程

### 3.1 登录服务器

1. 注册云服务器并配置登录密码。
2. 本地通过 `ssh` 登录服务器。

```bash
ssh root@47.96.179.16
```

### 3.2 本地构建镜像

在项目根目录执行：

```bash
docker build -t vue-python-app .

# 确认镜像构建成功
docker images | findstr vue-python-app
```

### 3.3 导出镜像

```bash
docker save vue-python-app:latest -o vue-python-app.tar

# 确认导出成功
dir vue-python-app.tar
```

### 3.4 上传到服务器

```bash
scp vue-python-app.tar root@47.96.179.16:/root/
```

### 3.5 服务器加载镜像并启动

```bash
sudo su -

docker load < vue-python-app.tar

docker run -d \
  -p 80:3001 \
  --name vue-python-app \
  vue-python-app:latest
```

### 3.6 更新容器常用命令

```bash
# 停止旧容器
docker stop vue-python-app

# 删除旧容器
docker rm vue-python-app

# 重新启动新容器
docker run -d -p 80:3001 --name vue-python-app vue-python-app:latest
```

## 4. 前端 CI/CD（Continuous Integration / Continuous Delivery）流程

> 开发者提交代码后，系统自动完成检查、构建、部署、发布、监控的一整套流水线。

1. 代码提交（git commit / push）：代码被推送到仓库，CI/CD流水线开始触发。
2. Git Hook：Git 在某些时机自动执行的脚本

```
  git commit
     ↓
  husky 拦截
     ↓
  eslint 检查
     ↓
  prettier 格式化
     ↓
  通过才允许 commit
```

3. Lint / Test：第二层质量保障，通常在 CI 中执行，检查代码规范；做 TS 类型检查；Unit Test （单元测试）；E2E Test（端到端测试）

4. CI Pipeline（核心流水线）：代码一提交，自动构建验证。
**构建前端项目，生成生产环境静态文件 dist/**

```
拉代码
  ↓
安装依赖
  ↓
缓存 node_modules
  ↓
Lint
  ↓
Test
  ↓
Build
  ↓
生成产物
```

5. Docker Build：保证“开发环境、测试环境、生产环境”一致，把Node、Nginx、构建产物、依赖全部打包，形成镜像。
**上传：dist/、deploy/ 到服务器的部署目录**

**登录服务器，执行服务器端脚本：构建 Docker 镜像；启动容器；映射端口；用 Nginx 对外提供服务**。

6. Artifact Upload：上传构建产物

7. CDN Upload：静态资源：JS、CSS、图片适合全球加速。

8. 灰度发布，逐步放量。

9. 监控告警，JS Error、白屏、接口异常、性能


## 5. ACM 输入模板

### 5.1 第一行给出测试组数

```javascript
const lines = require('fs').readFileSync(0, 'utf8').trim().split('\n');

const n = Number(lines[0]);
for (let i = 1; i <= n; i++) {
  const [a, b] = lines[i].split(' ').map(Number);
  console.log(a + b);
}
```

### 5.2 读到 `0 0` 结束

```javascript
const lines = require('fs').readFileSync(0, 'utf8').trim().split('\n');

for (const line of lines) {
  const [a, b] = line.split(' ').map(Number);
  if (a === 0 && b === 0) break;
  console.log(a + b);
}
```

### 5.3 每组先给 `n`，再给一行数组

```javascript
const lines = require('fs').readFileSync(0, 'utf8').trim().split('\n');

let index = 0;
const t = Number(lines[index++]);

for (let i = 0; i < t; i++) {
  const n = Number(lines[index++]);
  const arr = lines[index++].split(' ').map(Number);
  const sum = arr.reduce((a, b) => a + b, 0);
  console.log(sum);
}
```

