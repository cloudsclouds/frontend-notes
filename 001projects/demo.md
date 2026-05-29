# BioNova AI 代码 Demo

下面把项目里的几个核心亮点，整理成更像“面试时能讲、也能快速看懂”的代码 demo。每一段都尽量补全了“为什么这样做、核心难点是什么、上线时怎么考虑”的信息，方便你直接拿去讲。

## 1. 多人实时协同编辑（Yjs + WebSocket）

```ts
import * as Y from 'yjs';

type SyncMessage =
  | { type: 'update'; payload: Uint8Array }
  | { type: 'awareness'; payload: { userId: string; cursor: { from: number; to: number } } };

// 一个文档对应一个 CRDT 实例，所有本地操作都先落到 Yjs
const doc = new Y.Doc();
const text = doc.getText('content');

function applyLocalInsert(index: number, value: string) {
  // 本地编辑只改共享文档，Yjs 会自动生成增量 update
  text.insert(index, value);
}

function bindCollaboration(ws: WebSocket) {
  // 1) 本地变更 -> 发给服务端广播
  doc.on('update', (update: Uint8Array, origin: unknown) => {
    if (origin === 'remote') return; // 避免远端回流
    const msg: SyncMessage = { type: 'update', payload: update };
    ws.send(JSON.stringify(msg));
  });

  // 2) 收到远端更新 -> 合并到本地文档
  ws.addEventListener('message', (event) => {
    const msg = JSON.parse(event.data) as SyncMessage;
    if (msg.type === 'update') {
      Y.applyUpdate(doc, msg.payload);
    }
  });
}

function restoreOfflineState(localUpdates: Uint8Array[]) {
  // 离线期间产生的 update 先存在本地，重连后一次性补齐
  localUpdates.forEach((update) => Y.applyUpdate(doc, update));
}
```

这个 demo 可以这样讲：

- 传统协同编辑如果同步全文，很容易出现冲突、丢光标、覆盖别人输入的问题；
- 这里的思路是只同步 CRDT 的增量 update，让每个客户端都维护一份最终可收敛的共享状态；
- `awareness` 这类消息不进入正文，只用于同步在线状态、光标位置和选区，避免把“协同信息”和“业务内容”混在一起；
- 真正上线时通常还会补上：断线重连补差量、用户身份映射、编辑权限控制、在线人数展示、操作频率限制等能力。

可以重点强调的难点是：
1. 文本内容要能收敛；
2. 协作状态要能实时传播；
3. 离线后回来要能自动恢复。

## 2. 大文件上传链路（切片 + 断点续传 + 秒传 + 任务恢复）

```ts
const CHUNK_SIZE = 2 * 1024 * 1024;

type UploadStatus = 'instant' | 'uploading' | 'done';

function splitFile(file: File) {
  const chunks: Blob[] = [];
  for (let start = 0; start < file.size; start += CHUNK_SIZE) {
    chunks.push(file.slice(start, start + CHUNK_SIZE));
  }
  return chunks;
}

async function uploadLargeFile(file: File): Promise<UploadStatus> {
  const fileHash = await calcHash(file); // 文件指纹，用于秒传和任务恢复

  // 1) 秒传判断：服务端如果已有完整文件，直接跳过上传
  const check = await fetch('/api/upload/check', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fileHash, size: file.size, name: file.name }),
  }).then((r) => r.json());

  if (check.hit) return 'instant';

  // 2) 查询已完成分片，做断点续传
  const uploadedParts = new Set<number>(
    await fetch(`/api/upload/progress?fileHash=${fileHash}`).then((r) => r.json()),
  );

  const chunks = splitFile(file);
  for (let i = 0; i < chunks.length; i++) {
    if (uploadedParts.has(i)) continue;

    const form = new FormData();
    form.append('fileHash', fileHash);
    form.append('index', String(i));
    form.append('chunk', chunks[i]);

    await fetch('/api/upload/chunk', { method: 'POST', body: form });
  }

  // 3) 合并分片：服务端完成完整性校验后落库
  await fetch('/api/upload/merge', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fileHash, chunkCount: chunks.length }),
  });

  return 'done';
}
```

这个 demo 可以拆成 4 层来讲：

- **文件指纹**：先算 hash，保证“同一个文件”能被准确识别；
- **秒传**：如果服务端已经有完整文件，就不用再传，提高体验和带宽利用率；
- **断点续传**：前端先查已经上传过哪些分片，只补传缺失部分；
- **合并收口**：所有分片上传完后，由服务端统一校验、合并、落库，确保文件完整性。

这里最容易踩坑的地方是：
- 分片顺序和 index 必须稳定；
- 断网后重试要能接着传，而不是重新开始；
- 合并时要校验分片数量、hash、一致性，防止脏数据进入最终文件。

如果你要进一步讲得更像真实项目，可以补一句：前端还会配合并发控制、上传进度、失败重试、取消上传、恢复草稿任务等能力。

## 3. SSE 流式问答（fetch + ReadableStream + 逐 token 渲染）

```ts
type StreamHandle = { abort: () => void };

async function streamAnswer(
  payload: Record<string, unknown>,
  onDelta: (text: string) => void,
): Promise<StreamHandle> {
  const controller = new AbortController();

  const res = await fetch('/api/chat/stream', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    signal: controller.signal,
  });

  const reader = res.body!.getReader();
  const decoder = new TextDecoder('utf-8');
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    // 注意 stream: true，避免中文多字节字符被截断
    buffer += decoder.decode(value, { stream: true });

    // SSE 可能半包/粘包，所以需要手动按事件分隔符切分
    let splitIndex = buffer.indexOf('\n\n');
    while (splitIndex !== -1) {
      const packet = buffer.slice(0, splitIndex);
      buffer = buffer.slice(splitIndex + 2);

      const dataLine = packet
        .split('\n')
        .find((line) => line.startsWith('data:'));

      if (dataLine) {
        const data = dataLine.replace(/^data:\s*/, '');
        if (data !== '[DONE]') {
          onDelta(JSON.parse(data).content);
        }
      }

      splitIndex = buffer.indexOf('\n\n');
    }
  }

  return { abort: () => controller.abort() };
}
```

这个 demo 可以从“体验”和“工程实现”两方面讲：

- **体验层面**：用户不需要等整段回答生成完才看到内容，而是边生成边展示，感知更快；
- **工程层面**：`fetch + ReadableStream` 让前端可以自己掌控流的读取节奏，不依赖浏览器自动处理；
- **协议层面**：SSE 的事件是按 `\n\n` 分隔的，所以前端必须处理半包和粘包，否则容易出现 JSON 解析错误；
- **控制层面**：`AbortController` 让用户可以中途停止生成，避免无效请求继续消耗资源。

如果要再往深一点讲，还可以补充：
- 需要考虑网络抖动和重连；
- 如果流中返回的是工具调用结果，前端要区分展示内容和结构化指令；
- 对长回答来说，前端还会做节流渲染，避免每个 token 都触发高频重绘。

## 4. L1 / L2 / L3 三层记忆

```ts
type MemoryItem = {
  content: string;
  confidence: number;
  sourceTurn: number;
  updatedAt: number;
};

class MemoryManager {
  // L1：最近窗口，保留最靠近当前任务的原文
  private l1: string[] = [];
  // L2：滚动摘要，压缩长上下文
  private l2 = '';
  // L3：长期记忆，只存稳定偏好和事实
  private l3 = new Map<string, MemoryItem>();

  appendTurn(turn: string) {
    this.l1.push(turn);

    // 超过窗口后，把滑出的信息压缩进 L2，并尝试写入 L3
    if (this.l1.length > 6) {
      const overflow = this.l1.shift()!;
      this.l2 = this.rollSummary(this.l2, overflow);
      this.maybeWriteLongTerm(overflow);
    }
  }

  private rollSummary(summary: string, delta: string) {
    return `${summary}\n- 新增信息：${delta}`;
  }

  private maybeWriteLongTerm(delta: string) {
    // 只写入长期稳定信息，避免错误记忆污染
    const shouldStore = /偏好|长期|习惯|确认/.test(delta);
    if (!shouldStore) return;

    this.l3.set(delta, {
      content: delta,
      confidence: 0.92,
      sourceTurn: Date.now(),
      updatedAt: Date.now(),
    });
  }

  buildPrompt() {
    const longTerm = [...this.l3.values()].map((m) => m.content).join('\n');
    // 生成时按 L1 -> L2 -> L3 组合，而不是简单拼接全部历史
    return [this.l1.join('\n'), this.l2, longTerm].filter(Boolean).join('\n\n');
  }
}
```

这个 demo 可以这样解释：

- **L1** 是短期上下文，保留最近几轮的原始对话，保证当前任务的连贯性；
- **L2** 是滚动摘要，用来把历史逐步压缩，解决上下文长度有限的问题；
- **L3** 是长期记忆，只保存稳定偏好、身份信息、长期需求等内容，避免把临时信息错误写入。

为什么要分三层：
1. 直接存全量历史，成本高而且上下文会越来越长；
2. 只做摘要会损失细节，容易影响最近任务判断；
3. 所以要把“最近细节”和“长期稳定事实”拆开管理。

真正落地时，通常还要补：
- 记忆写入白名单/黑名单；
- 记忆过期和清理策略；
- 多租户隔离，避免不同用户的记忆混用；
- 记忆召回时的权重排序。

## 5. RAG 检索增强问答（BM25 + 向量混合召回 + 重排 + 来源回填）

```ts
type Chunk = {
  id: string;
  text: string;
  bm25Score?: number;
  vectorScore?: number;
};

function rrfScore(rank: number) {
  return 1 / (rank + 60);
}

function rrfRank(bm25List: Chunk[], vectorList: Chunk[]) {
  const scoreMap = new Map<string, { chunk: Chunk; score: number }>();

  bm25List.forEach((chunk, index) => {
    const prev = scoreMap.get(chunk.id)?.score ?? 0;
    scoreMap.set(chunk.id, {
      chunk,
      score: prev + rrfScore(index + 1),
    });
  });

  vectorList.forEach((chunk, index) => {
    const prev = scoreMap.get(chunk.id)?.score ?? 0;
    scoreMap.set(chunk.id, {
      chunk,
      score: prev + rrfScore(index + 1),
    });
  });

  return [...scoreMap.values()].sort((a, b) => b.score - a.score).map((x) => x.chunk);
}

async function retrieve(question: string) {
  const [bm25List, vectorList] = await Promise.all([
    fetch('/api/search/bm25', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question }),
    }).then((r) => r.json()),
    fetch('/api/search/vector', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question }),
    }).then((r) => r.json()),
  ]);

  // 先混合召回，再重排，最后只保留少量高相关证据
  return rrfRank(bm25List, vectorList).slice(0, 5);
}

async function answerWithRAG(question: string) {
  const chunks = await retrieve(question);
  const context = chunks.map((c) => `【来源:${c.id}】${c.text}`).join('\n\n');

  return fetch('/api/llm/answer', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ question, context }),
  });
}
```

这个 demo 可以按“检索链路”来讲：

- **召回层**：BM25 更擅长关键词命中，向量检索更擅长语义匹配，两者结合能兼顾精确和泛化；
- **重排层**：把两个召回源混合后，再做统一排序，避免某一个检索源权重过大；
- **生成层**：把检索结果作为上下文喂给模型，减少幻觉；
- **可解释性**：把来源一起带回去，回答里能说明“这句话依据哪段资料得到的”。

如果你要面试里讲得更完整，可以补一句：
- 召回的 chunk 还会做去重、截断、片段清洗；
- 长文档通常要先切块，再做索引更新；
- 线上还会增加命中率、引用准确率、召回耗时等监控指标。

## 6. 文档内 AI 辅助创作（多智能体编排 + Reflection Loop）

```ts
type Task = 'rewrite' | 'translate' | 'summary' | 'mermaid';

type AgentResult = {
  content: string;
  ops?: Array<{ type: 'replace' | 'insert'; from?: number; to?: number; value: string }>;
};

type ReviewResult = {
  pass: boolean;
  content: string;
  feedback?: string;
};

class Orchestrator {
  async run(task: Task, input: string): Promise<AgentResult> {
    const complexity = this.score(input);

    // 简单任务走 Fast，复杂任务走 Swarm
    if (complexity < 0.4) {
      return this.routeFast(task, input);
    }

    return this.routeSwarm(task, input);
  }

  private score(text: string) {
    return Math.min(text.length / 2000, 1);
  }

  private async routeFast(task: Task, input: string) {
    return workerMap[task](input);
  }

  private async routeSwarm(task: Task, input: string) {
    const plan = await planner(input); // Planner：拆任务
    const draft = await Promise.all(plan.steps.map((step) => worker(step, input))); // Worker：并行执行
    const reviewed = await critic(draft.join('\n')); // Critic：检查质量

    if (!reviewed.pass) {
      // Reflection Loop：避免无限反思，实际项目里会设置阈值
      return reflector(reviewed.feedback ?? 'format error');
    }

    return merger(reviewed.content); // Merger：统一聚合，并返回结构化回填协议
  }
}

const workerMap: Record<Task, (input: string) => Promise<AgentResult>> = {
  rewrite: async (input) => ({ content: `润色后的内容：${input}` }),
  translate: async (input) => ({ content: `Translated: ${input}` }),
  summary: async (input) => ({ content: `摘要：${input.slice(0, 80)}...` }),
  mermaid: async () => ({ content: 'graph TD; A-->B;' }),
};
```

这个 demo 的重点是“多智能体流水线”，可以按下面的逻辑讲：

- **路由**：先判断任务复杂度，简单的直接走快路径，复杂的才进入多智能体流程；
- **Planner**：负责拆分任务，决定每一步该做什么；
- **Worker**：并行执行子任务，提高效率；
- **Critic**：对结果做质量检查，避免低质量内容直接返回；
- **Reflector**：在结果不通过时进行反思和修正；
- **Merger**：把各个子结果汇总成最终输出。

它背后的核心价值是：
1. 不把所有问题都丢给一个 Prompt；
2. 把“生成”和“审核”解耦；
3. 让复杂任务具备可控性、可扩展性和更高成功率。

如果继续扩展，还可以补：任务队列、失败重试、并发限制、上下文缓存、结果可追踪日志、工具调用协议等。

---

如果你愿意，我下一步可以继续帮你做两种版本：

1. **面试讲解版**：每个 demo 再补 3~5 句“我会怎么讲”
2. **简历精简版**：把每个点压成更短的高密度描述，适合直接贴到简历里
