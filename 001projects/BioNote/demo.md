# BioNote AI 代码 Demo
## 1. 多人实时协同编辑（Yjs + WebSocket）
### 前端
```ts
/**
 * `useYjsEditor` 是一个把 TipTap + Yjs + WebSocket 协作服务串起来的 React Hook。
 *
 * 1. 创建并维护一个本地 `Y.Doc`，作为协作文档的真实数据源
 * 2. 通过 WebSocket 与服务端同步文档更新、在线状态和协作光标信息
 * 3. 把 Yjs 文档接入 TipTap 的 `Collaboration` 扩展，让编辑器自动感知远端变更
 * 4. 将连接状态、在线人数、协作者信息暴露给业务层，用于 UI 展示
 */
export function useYjsEditor({
  extensions = [],
  editorProps = {},
  onContentChange,
  documentId,
  userName = `Anonymous-${Math.random().toString(36).slice(2, 9)}`,
  initialContent = { type: 'doc', content: [] },
}: {
  extensions?: any[];
  editorProps?: Record<string, any>;
  onContentChange?: (content: any) => void;
  documentId?: string | number;
  userName?: string;
  initialContent?: any;
} = {}) {
  // `Y.Doc` 需要在多个渲染周期之间保持同一个引用，否则协作状态会被重置。
  const ydocRef = useRef<Y.Doc | null>(null);

  // WebSocket 连接同样必须保留引用，便于在编辑器扩展和清理逻辑中复用。
  const socketRef = useRef<WebSocket | null>(null);

  // 离线期间产生的本地 update 先缓存起来，等网络恢复后统一补发。
  const offlineUpdatesRef = useRef<Uint8Array[]>([]);

  // 每个用户在协作中会分配一个随机颜色，用于光标和在线用户列表展示。
  const userColorRef = useRef(generateRandomColor());

  // 下面三个状态主要服务于 UI：在线人数、连接状态、协作者列表。
  const [connectedClients, setConnectedClients] = useState(0);
  const [isConnected, setIsConnected] = useState(false);
  const [collaborators, setCollaborators] = useState<Record<string, any>>({});

  const roomId = useMemo(() => (documentId ? String(documentId) : ''), [documentId]);

  useEffect(() => {
    if (!roomId) return;

    // 为当前房间创建一个全新的 Yjs 文档实例。
    const ydoc = new Y.Doc();
    ydocRef.current = ydoc;

    // 建立 WebSocket 连接，并把文档 ID / token 作为查询参数传给服务端。
    const socket = new WebSocket(
      `${WS_URL}?docId=${encodeURIComponent(roomId)}&token=${encodeURIComponent(localStorage.getItem('token') || '')}`
    );
    socket.binaryType = 'arraybuffer';
    socketRef.current = socket;

    // 发送 JSON 消息的统一方法，比如 sync、awareness 等协议控制类消息。
    const sendJson = (message: Record<string, any>) => {
      if (socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify(message));
      }
    };

    // 发送二进制 Yjs update 的统一方法，用来发 Yjs 协议的核心数据，也就是 update。
    const sendBinary = (buffer: Uint8Array) => {
      if (socket.readyState === WebSocket.OPEN) {
        socket.send(buffer);
      }
    };

    // snapshot 用于首屏初始化，对应 SQL 数据库中文档表里的 latestSnapshot / snapshot 字段，这里只负责接收、解析并校验 snapshot，为后续文档恢复做初始化准备。
    const applySnapshot = (snapshot: any) => {
      if (!snapshot) return;
      try {
        const content = typeof snapshot === 'string' ? JSON.parse(snapshot) : snapshot;
        if (!content) return;

        // 目前只在文档类型明确时继续处理，避免把无关 payload 误当成文档内容。
        if (content.type === 'doc') {
          ydoc.transact(() => {
            // 触发 fragment 访问，确保协作文档结构被初始化。
            ydoc.getXmlFragment(DOC_FRAGMENT_NAME);
          }, 'snapshot');
        }
      } catch {
      }
    };

    // 本地文档一旦产生 update，就把变更同步给服务端。
    // Uint8Array 是二进制字节数组，表示文档的变更增量。
    // `origin === 'remote'` 表示这次变更来自远端同步，避免回环回发。
    // 如果当前没有连上服务端，就先把增量缓存到本地，等重连后再统一恢复。
    const updateHandler = (update: Uint8Array, origin: unknown) => {
      if (origin === 'remote') return;
      if (socket.readyState === WebSocket.OPEN) {
        sendBinary(update);
        return;
      }
      offlineUpdatesRef.current.push(update);
    };

    // 订阅 Yjs 更新事件，确保本地编辑会实时发送到服务端。
    ydoc.on('update', updateHandler);

    // WebSocket 建连后，先同步状态向量，再主动上报一次自己的协作状态。
    // 状态向量可以帮助服务端判断双方需要交换哪些增量更新。
    socket.onopen = () => {
      setIsConnected(true);

      // 重连成功后，先把离线期间缓存的本地增量补回 Y.Doc，再继续走正常同步流程。
      if (offlineUpdatesRef.current.length > 0) {
        offlineUpdatesRef.current.forEach((update) => {
          try {
            Y.applyUpdate(ydoc, update, 'local-offline');
          } catch {
            // ignore malformed offline update
          }
        });
        offlineUpdatesRef.current = [];
      }

      sendJson({
        type: 'sync',
        docId: roomId,
        payload: {
          stateVector: uint8ArrayToBase64(Y.encodeStateVector(ydoc)),
        },
      });
      sendJson({
        type: 'awareness',
        docId: roomId,
        payload: {
          userId: ydoc.clientID,
          nickname: userName,
          color: userColorRef.current,
          active: true,
          lastSeenAt: Date.now(),
        },
      });
    };

    socket.onclose = () => {
      setIsConnected(false);
    };

    socket.onerror = () => {
      setIsConnected(false);
    };

    // 统一处理服务端推送消息：
    // - ArrayBuffer：Yjs binary update
    // - JSON 字符串：sync / update / awareness / onlineCount / error
    socket.onmessage = (event) => {
      try {
        // 二进制消息直接交给 Yjs 应用。
        if (event.data instanceof ArrayBuffer) {
          try {
            Y.applyUpdate(ydoc, new Uint8Array(event.data), 'remote');
          } catch {
            // ignore malformed binary update
          }
          return;
        }

        // 文本消息按 JSON 协议解析。
        const data = JSON.parse(event.data);

        // sync 消息通常用于首次拉取快照、增量更新以及在线人数。
        if (data?.type === 'sync') {
          const payload = data.payload || {};
          if (payload.snapshot) {
            applySnapshot(payload.snapshot);
          }
          if (payload.latestSnapshot) {
            applySnapshot(payload.latestSnapshot);
          }
          if (payload.update && typeof payload.update === 'string') {
            try {
              Y.applyUpdate(ydoc, base64ToUint8Array(payload.update), 'remote');
            } catch {
              // ignore malformed update
            }
          }
          if (payload.count != null) {
            setConnectedClients(Number(payload.count) || 0);
          }
          return;
        }

        // update 消息表示服务端广播的某个协作者更新，需要应用到本地文档。
        if (data?.type === 'update' && data.payload?.update) {
          try {
            if (typeof data.payload.update === 'string') {
              Y.applyUpdate(ydoc, base64ToUint8Array(data.payload.update), 'remote');
            }
          } catch {
            // ignore malformed update
          }
          return;
        }

        // awareness 用于同步“谁在线、光标在哪里、颜色是什么”等临时协作状态。
        if (data?.type === 'awareness') {
          const payload = data.payload || {};
          const key = String(payload.userId ?? payload.clientId ?? payload.nickname ?? 'anonymous');
          setCollaborators((current) => ({
            ...current,
            [key]: {
              user: payload.nickname || payload.user || `用户${payload.userId ?? ''}`,
              color: payload.color || '#999999',
              cursor: payload.cursor || null,
              active: payload.active !== false,
              lastSeenAt: payload.lastSeenAt || Date.now(),
            },
          }));
          return;
        }

        // onlineCount 作为轻量统计值，通常用于展示房间人数。
        if (data?.type === 'onlineCount') {
          const count = Number(data.payload?.count);
          if (Number.isFinite(count)) {
            setConnectedClients(count);
          }
          return;
        }

        if (data?.type === 'error') {
          console.warn('Collaboration error:', data.payload?.message || 'unknown error');
        }
      } catch (error) {
        console.warn('WebSocket message parse failed', error);
      }
    };

    // 定时上报在线心跳。
    const awarenessTimer = window.setInterval(() => {
      sendJson({
        type: 'awareness',
        docId: roomId,
        payload: {
          userId: ydoc.clientID,
          nickname: userName,
          color: userColorRef.current,
          active: true,
          lastSeenAt: Date.now(),
        },
      });
    }, 3000);

    // 清理逻辑非常重要：
    // - 清除心跳定时器
    // - 移除 Yjs 事件订阅
    // - 关闭 WebSocket
    // - 销毁 Y.Doc，释放协作文档占用的内存
    return () => {
      window.clearInterval(awarenessTimer);
      ydoc.off('update', updateHandler);
      socket.close();
      ydoc.destroy();
      socketRef.current = null;
    };
  }, [roomId, userName]);

  // TipTap 编辑器实例，通过 `useEditor` 将协作文档、协作光标、业务扩展和自定义属性统一装配起来。
  const editor = useEditor(
    {
      // SSR / 首屏场景下避免立即渲染，减少环境不一致导致的问题。
      immediatelyRender: false,
      editorProps: {
        ...editorProps,
        attributes: {
          'data-testid': 'editor-collaborative',
          ...(editorProps?.attributes ?? {}),
        },
      },
      extensions: [
        // Collaboration 扩展让 TipTap 直接读写 Y.Doc 的指定 fragment。
        Collaboration.configure({
          document: ydocRef.current || new Y.Doc(),
          field: DOC_FRAGMENT_NAME,
        }),
        // CollaborationCursor 用于显示其他协作者的光标/选区和昵称颜色。
        CollaborationCursor.configure({
          provider: socketRef.current as any,
          user: {
            name: userName,
            color: userColorRef.current,
          },
        }),
        ...extensions,
      ],
      content: initialContent,
      // 编辑器内容变化后，通过回调把 JSON 结构暴露给上层业务。
      onUpdate: ({ editor: nextEditor }) => {
        if (typeof onContentChange === 'function') {
          onContentChange(nextEditor.getJSON());
        }
      },
    },
    // 依赖项变化时，TipTap 会重新评估配置。
    // 注意：这里传入的是 ref.current，而不是 ref 本身。
    [ydocRef.current, socketRef.current, extensions, initialContent]
  );

  return {
    editor,
    ydoc: ydocRef.current,
    provider: socketRef.current,
    isConnected,
    connectedClients,
    collaborators,
  };
}
```
### 后端
```java
/**
 * 把“多人同时编辑同一篇文档”拆成几个稳定的步骤：
 * 1. 客户端连进来时，先校验身份，再确定他属于哪个文档房间；
 * 2. 连接建立后，服务端先把最新快照和房间状态发给前端；
 * 3. 编辑过程中，Yjs 产生的增量以二进制形式广播给其他协作者；
 * 4. 光标、昵称、在线状态这类临时协作信息，通过 awareness 单独同步；
 * 5. 服务端定期把文档快照落库，避免每一次按键都直接写数据库。
 */

@Component
public class CollabWebSocketHandler extends BinaryWebSocketHandler {

  // Jackson 用来处理文本消息中的 JSON 协议字段。
  private final ObjectMapper objectMapper = new ObjectMapper();
  // 文档仓储：负责读写文档快照。
  private final DocumentRepository documentRepository;
  // Yjs 服务：负责 stateVector、diff、snapshot 等协作核心逻辑。
  private final YjsService yjsService;

  // rooms：内存中的房间映射，key 是 docId，value 是该文档对应的协作状态。
  private final Map<String, RoomState> rooms = new ConcurrentHashMap<>();
  // sessionDocMap：通过 WebSocket sessionId 反查所属文档，方便断开时清理。
  private final Map<String, String> sessionDocMap = new ConcurrentHashMap<>();

  public CollabWebSocketHandler(DocumentRepository documentRepository, YjsService yjsService) {
    this.documentRepository = documentRepository;
    this.yjsService = yjsService;
  }

  @Override
  public void afterConnectionEstablished(WebSocketSession session) throws Exception {
    // 从连接 URL 中读取协作房间参数，比如 /ws/collab?docId=123&userName=alice&token=xxx
    String docId = getQueryParam(session, "docId");
    String userName = Optional.ofNullable(getQueryParam(session, "userName")).orElse("Anonymous");
    String token = getQueryParam(session, "token");

    // 1) 鉴权
    if (!AuthService.verify(token)) {
      session.close(CloseStatus.POLICY_VIOLATION);
      return;
    }

    // 2) 加入房间，如果房间不存在，就创建一个新的 RoomState；否则复用已有房间的在线状态。
    RoomState room = rooms.computeIfAbsent(docId, RoomState::new);
    room.sessions.put(session.getId(), new SessionState(session.getId(), userName, session));
    sessionDocMap.put(session.getId(), docId);

    // 3) 首包同步，先查数据库里的最新 snapshot，确保新来的用户从正确基线开始。
    String snapshot = documentRepository.findLatestSnapshot(docId)
        .orElse("{\"type\":\"doc\",\"content\":[]}");
    room.latestSnapshot = snapshot;

    // 给前端发 sync 消息：
    // - snapshot / latestSnapshot：文档初始内容
    // - count：当前在线人数
    // - stateVector：让前端知道服务端侧的协作状态版本
    sendJson(session, Map.of(
        "type", "sync",
        "payload", Map.of(
            "snapshot", snapshot,
            "latestSnapshot", snapshot,
            "count", room.onlineCount(),
            "stateVector", Base64.getEncoder().encodeToString(yjsService.encodeStateVector(docId))
        )
    ));

    // 单独再发一次 onlineCount，便于前端 UI 直接更新人数。
    sendJson(session, Map.of(
        "type", "onlineCount",
        "payload", Map.of("count", room.onlineCount())
    ));

    // 4) awareness 广播，告诉房间里的其他人：有新用户加入了。
    broadcastAwareness(room, session.getId(), userName, true, null);
  }

  @Override
  protected void handleTextMessage(WebSocketSession session, TextMessage message) throws Exception {
    // 文本消息承载协议控制类信息：sync / awareness / ping
    String docId = sessionDocMap.get(session.getId());
    if (docId == null) return;

    RoomState room = rooms.get(docId);
    if (room == null) return;

    // 解析 JSON 协议包。
    JsonNode root = objectMapper.readTree(message.getPayload());
    String type = root.path("type").asText();
    JsonNode payload = root.path("payload");

    // 按消息类型分发。
    // sync：用于补齐状态；awareness：同步临时协作信息；ping：心跳保活。
    switch (type) {
      case "sync" -> handleSync(session, room, payload);
      case "awareness" -> handleAwareness(session, room, payload);
      case "ping" -> room.touch(session.getId());
      default -> sendJson(session, Map.of("type", "error", "payload", Map.of("message", "unknown message type")));
    }
  }

  @Override
  protected void handleBinaryMessage(WebSocketSession session, BinaryMessage message) throws Exception {
    // 文档内容增量走 BinaryMessage，二进制消息一般就是 Yjs 的 update。
    String docId = sessionDocMap.get(session.getId());
    if (docId == null) return;

    RoomState room = rooms.get(docId);
    if (room == null) return;

    byte[] update = message.getPayload().array();
    // 合法性校验，防止空包、脏包污染协作文档。
    if (!yjsService.isValidUpdate(update)) {
      sendJson(session, Map.of("type", "error", "payload", Map.of("message", "invalid yjs update")));
      return;
    }

    // 1) 缓存 update，保存下来是为了重连补发、新用户进房时补齐历史变更。
    room.pendingUpdates.add(update);
    room.updatedAt = System.currentTimeMillis();

    // 2) 广播给其他协作者，只发给同房间的其他人，不回发给当前发送者，避免循环回路。
    for (SessionState peer : room.sessions.values()) {
      if (peer.sessionId.equals(session.getId())) continue;
      if (peer.session.isOpen()) {
        peer.session.sendMessage(new BinaryMessage(update));
      }
    }

    // 3) 异步持久化，实际项目里是批量、定时或者按阈值写快照。
    persistSnapshotAsync(docId, room);
  }

  @Override
  public void afterConnectionClosed(WebSocketSession session, CloseStatus status) {
    // 连接关闭后，要从两个地方清理：
    // 1. sessionDocMap 中移除 session -> docId 的映射；
    // 2. 对应 room 中移除 session 信息。
    String docId = sessionDocMap.remove(session.getId());
    if (docId == null) return;

    RoomState room = rooms.get(docId);
    if (room == null) return;

    SessionState removed = room.sessions.remove(session.getId());
    if (removed != null) {
      // 通知其他人这个用户离开了。
      broadcastAwareness(room, session.getId(), removed.userName, false, null);
    }
  }

  private void handleSync(WebSocketSession session, RoomState room, JsonNode payload) throws Exception {
    // 前端在首次连接或重连时，会带上 stateVector。
    // 服务端根据 stateVector 计算“客户端缺少哪些增量”，只返回缺失部分，减少流量。
    String stateVectorBase64 = payload.path("stateVector").asText("");
    byte[] stateVector = stateVectorBase64.isBlank()
        ? new byte[0]
        : Base64.getDecoder().decode(stateVectorBase64);

    // 让 Yjs 服务计算差量 update。
    byte[] update = yjsService.diff(room.docId, stateVector);

    // 返回给前端的 sync 响应里，既有快照，也有增量。
    Map<String, Object> responsePayload = new LinkedHashMap<>();
    responsePayload.put("snapshot", room.latestSnapshot);
    responsePayload.put("latestSnapshot", room.latestSnapshot);
    responsePayload.put("count", room.onlineCount());
    if (update != null && update.length > 0) {
      responsePayload.put("update", Base64.getEncoder().encodeToString(update));
    }

    sendJson(session, Map.of("type", "sync", "payload", responsePayload));
    sendJson(session, Map.of("type", "onlineCount", "payload", Map.of("count", room.onlineCount())));

    // 4) 补发离线期间积累的增量。
    for (byte[] pendingUpdate : room.pendingUpdates) {
      if (session.isOpen()) {
        session.sendMessage(new BinaryMessage(pendingUpdate));
      }
    }
  }

  private void handleAwareness(WebSocketSession session, RoomState room, JsonNode payload) throws Exception {
    // awareness 是临时协作状态，通常只用于展示在线用户、光标位置、活跃状态等 UI 信息。
    String userName = payload.path("nickname").asText("Anonymous");
    boolean active = payload.path("active").asBoolean(true);
    JsonNode cursor = payload.path("cursor");
    broadcastAwareness(room, session.getId(), userName, active, cursor.isMissingNode() ? null : cursor);
  }

  private void broadcastAwareness(RoomState room, String fromSessionId, String userName, boolean active, JsonNode cursor) throws Exception {
    // awareness 消息一般很轻，直接发 JSON 即可，把昵称、在线状态、光标位置一起广播给其他人。
    Map<String, Object> awarenessPayload = new LinkedHashMap<>();
    awarenessPayload.put("nickname", userName);
    awarenessPayload.put("active", active);
    awarenessPayload.put("lastSeenAt", System.currentTimeMillis());
    awarenessPayload.put("cursor", cursor);

    for (SessionState peer : room.sessions.values()) {
      if (peer.sessionId.equals(fromSessionId)) continue;
      sendJson(peer.session, Map.of("type", "awareness", "payload", awarenessPayload));
    }
  }

  private void persistSnapshotAsync(String docId, RoomState room) {
    // 用 CompletableFuture 模拟异步持久化，真正生产环境可以换成线程池、消息队列或者定时任务批处理。
    CompletableFuture.runAsync(() -> {
      String latest = yjsService.encodeSnapshot(docId);
      room.latestSnapshot = latest;
      documentRepository.saveLatestSnapshot(docId, latest, room.version.incrementAndGet(), System.currentTimeMillis());
    });
  }

  // 统一封装 JSON 输出
  private void sendJson(WebSocketSession session, Object body) throws Exception {
    session.sendMessage(new TextMessage(objectMapper.writeValueAsString(body)));
  }

  //  从 WebSocket 握手 URL 中读取 query 参数。
  private String getQueryParam(WebSocketSession session, String key) {
    UriComponents uri = UriComponentsBuilder.fromUri(session.getUri()).build();
    return uri.getQueryParams().getFirst(key);
  }

  static class RoomState {
    // docId 是房间唯一标识，一个文档对应一个协作房间。
    final String docId;
    // sessions 保存当前房间内所有在线连接。
    final Map<String, SessionState> sessions = new ConcurrentHashMap<>();
    // pendingUpdates 保存最近一段时间的 Yjs 增量，便于断线补发。
    final List<byte[]> pendingUpdates = new CopyOnWriteArrayList<>();
    // version 用于标记文档版本，方便落库、排查和快照更新。
    final AtomicInteger version = new AtomicInteger(0);
    // latestSnapshot 保存当前房间最新的完整快照。
    volatile String latestSnapshot;
    // updatedAt 记录最近一次变更时间，用于定时任务判断是否要落库。
    volatile long updatedAt = System.currentTimeMillis();

    RoomState(String docId) {
      this.docId = docId;
    }

    int onlineCount() {
      // 在线人数就是当前 session 数量。
      return sessions.size();
    }

    void touch(String sessionId) {
      // 心跳包到达时，刷新这个连接的最后活跃时间。
      SessionState state = sessions.get(sessionId);
      if (state != null) {
        state.lastSeenAt = System.currentTimeMillis();
      }
    }
  }

  static class SessionState {
    // WebSocket sessionId，用来唯一识别一个连接。
    final String sessionId;
    // 用户名，用于 awareness 展示。
    final String userName;
    // 当前 WebSocket 会话对象，后续发消息都靠它。
    final WebSocketSession session;
    // 最后活跃时间，用于心跳超时判断。
    volatile long lastSeenAt = System.currentTimeMillis();

    SessionState(String sessionId, String userName, WebSocketSession session) {
      this.sessionId = sessionId;
      this.userName = userName;
      this.session = session;
    }
  }

  @Service
  static class YjsService {
    // encodeStateVector：把服务端当前协作状态压缩成 stateVector，供客户端 diff 使用。
    byte[] encodeStateVector(String docId) {
      return new byte[] { 1, 2, 3 };
    }

    // diff：根据客户端 stateVector 计算缺失的 update。
    // 客户端拿到后，只需要补这些增量即可，不必重新拉全量文档。
    byte[] diff(String docId, byte[] stateVector) {
      return new byte[] { 4, 5, 6 };
    }

    // 校验 update 是否合理，避免空包或非法数据写入协作状态。
    boolean isValidUpdate(byte[] update) {
      return update != null && update.length > 0;
    }

    // encodeSnapshot：把当前文档编码成完整快照，用于持久化和新用户初始化。
    String encodeSnapshot(String docId) {
      return "{\"type\":\"doc\",\"content\":[{\"type\":\"paragraph\",\"content\":[{\"type\":\"text\",\"text\":\"BioNova 协同文档\"}]}]}";
    }
  }

  @Repository
  interface DocumentRepository {
    // 查询文档的最新快照。
    Optional<String> findLatestSnapshot(String docId);
    // 保存新的快照版本，通常会连带版本号和更新时间一起存储。
    void saveLatestSnapshot(String docId, String snapshot, int version, long updatedAt);
  }
}
```

## 2. 大文件上传链路（切片 + 断点续传 + 秒传 + 任务恢复）

### 前端
```ts
/**
 * 设计目标：
 * 1. 先把大文件切成多个小分片，降低单次请求失败成本。
 * 2. 先请求后端拿到“哪些分片已经上传过”，再只补传缺失分片，支持断点续传。
 * 3. 用文件指纹（hash）做秒传判断，避免重复上传已经存在的文件。
 * 4. 上传任务状态持久化到后端，刷新页面后可以继续之前的任务。
 * 5. 后端如果接 MinIO，前端上传逻辑基本不变，依旧只需要和上传接口交互。
 */

const CHUNK_SIZE = 5 * 1024 * 1024; // 5MB：分片大小。
const MAX_CONCURRENCY = 4; // 同时上传的分片数

type UploadTaskStatus = 'idle' | 'hashing' | 'checking' | 'uploading' | 'paused' | 'done' | 'error';

type UploadTask = {
  taskId: string;
  fileHash: string;
  fileName: string;
  fileSize: number;
  totalChunks: number;
  uploadedChunks: number[];
  status: UploadTaskStatus;
};

/**
 * 生成文件指纹。
 * - 真正生产里，hash 计算建议放到 Web Worker，避免阻塞主线程。
 * - 这里为了 demo 简洁，直接用切片内容做简单哈希演示。
 * - 文件名不可靠，因为同名文件可能内容不同，所以应该尽量依赖内容 hash。
 */
async function createFileHash(file: File): Promise<string> {
  const slice = file.slice(0, Math.min(file.size, 2 * 1024 * 1024));
  const buffer = await slice.arrayBuffer();

  // 真实场景建议使用更稳定的 MD5 / SHA-256 实现
  let hash = 0;
  const view = new Uint8Array(buffer);
  for (let i = 0; i < view.length; i++) {
    hash = (hash * 31 + view[i]) >>> 0;
  }

  return `${file.name}-${file.size}-${hash}`;
}

/**
 * 按固定大小切片，每个分片都会带上 chunkIndex，服务端后续靠这个序号判断：
 * 1. 哪些分片已经上传过
 * 2. 缺哪些分片
 * 3. 合并时按什么顺序处理
 */
function sliceFile(file: File) {
  const chunks: { index: number; blob: Blob }[] = [];
  const totalChunks = Math.ceil(file.size / CHUNK_SIZE);

  for (let index = 0; index < totalChunks; index++) {
    const start = index * CHUNK_SIZE;
    const end = Math.min(file.size, start + CHUNK_SIZE);
    chunks.push({
      index,
      blob: file.slice(start, end),
    });
  }

  return { chunks, totalChunks };
}

/**
 * 上传前先向后端查询：
 * 1. 这个文件是否已经存在（秒传）
 * 2. 如果没完整上传，哪些 chunk 已经上传过（断点续传）
 */
async function prepareUpload(file: File): Promise<{
  taskId: string;
  alreadyUploadedChunks: number[];
  shouldSkip: boolean;
}> {
  const fileHash = await createFileHash(file);

  const res = await fetch('/api/upload/prepare', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      fileName: file.name,
      fileSize: file.size,
      fileHash,
    }),
  });

  if (!res.ok) {
    throw new Error('预检上传任务失败');
  }

  return res.json();
}

/**
 * 上传单个分片。
 * - 用 FormData 传输，兼容性更好。
 * - chunkIndex / taskId / fileHash 都要带上，方便服务端做幂等控制。
 * - 如果同一个分片被重复请求，服务端应该识别为同一条数据，不要重复落库。
 */
async function uploadChunk(params: {
  taskId: string;
  fileHash: string;
  fileName: string;
  chunkIndex: number;
  totalChunks: number;
  blob: Blob;
}) {
  const formData = new FormData();
  formData.append('taskId', params.taskId);
  formData.append('fileHash', params.fileHash);
  formData.append('fileName', params.fileName);
  formData.append('chunkIndex', String(params.chunkIndex));
  formData.append('totalChunks', String(params.totalChunks));
  formData.append('chunk', params.blob);

  const res = await fetch('/api/upload/chunk', {
    method: 'POST',
    body: formData,
  });

  if (!res.ok) {
    throw new Error(`分片 ${params.chunkIndex} 上传失败`);
  }

  return res.json();
}

/**
 * 完成上传，如果后端接 MinIO，这一步常见语义是：
 * - 通知服务端完成 multipart upload
 * - 服务端把最终 objectKey / url 写入数据库
 * - 服务端把任务状态切成 done
 */
async function completeUpload(taskId: string) {
  const res = await fetch('/api/upload/complete', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ taskId }),
  });

  if (!res.ok) {
    throw new Error('完成上传失败');
  }

  return res.json();
}

/**
 * 一个最小可理解的上传器类。
 * - 好管理“任务状态、并发、暂停、恢复”这些上传过程中的状态
 * - 在 demo 里更容易把逻辑组织清楚
 * - 实际项目也可以改成 Hook / Zustand store / Redux slice
 */
class LargeFileUploader {
  private task: UploadTask | null = null;
  private abortController: AbortController | null = null;

  constructor(private readonly onProgress?: (task: UploadTask) => void) {}

  private emit() {
    if (this.task && this.onProgress) {
      this.onProgress({ ...this.task, uploadedChunks: [...this.task.uploadedChunks] });
    }
  }

  /**
   * 启动上传。
   *
   * 整个流程是：
   * 1. 计算 hash
   * 2. 调后端预检
   * 3. 如果后端说文件已存在，直接秒传成功
   * 4. 否则拿到已上传分片列表，只传缺失分片
   * 5. 全部分片完成后通知后端收尾
   */
  async start(file: File) {
    const { chunks, totalChunks } = sliceFile(file);

    this.task = {
      taskId: '',
      fileHash: '',
      fileName: file.name,
      fileSize: file.size,
      totalChunks,
      uploadedChunks: [],
      status: 'hashing',
    };
    this.emit();

    const fileHash = await createFileHash(file);
    this.task.fileHash = fileHash;
    this.task.status = 'checking';
    this.emit();

    const prepared = await prepareUpload(file);

    this.task.taskId = prepared.taskId;

    // 秒传分支：后端发现文件已完整存在，直接返回成功即可。
    if (prepared.shouldSkip) {
      this.task.status = 'done';
      this.task.uploadedChunks = chunks.map((chunk) => chunk.index);
      this.emit();
      return;
    }

    // 断点续传分支：服务端返回已经上传的分片，前端只补传缺失部分。
    const uploadedSet = new Set(prepared.alreadyUploadedChunks);
    this.task.uploadedChunks = [...uploadedSet].sort((a, b) => a - b);
    this.task.status = 'uploading';
    this.emit();

    const queue = chunks.filter((chunk) => !uploadedSet.has(chunk.index));
    const running: Promise<void>[] = [];

    const next = async () => {
      const chunk = queue.shift();
      if (!chunk || this.task?.status === 'paused') return;

      const promise = uploadChunk({
        taskId: prepared.taskId,
        fileHash,
        fileName: file.name,
        chunkIndex: chunk.index,
        totalChunks,
        blob: chunk.blob,
      }).then(() => {
        this.task!.uploadedChunks.push(chunk.index);
        this.task!.uploadedChunks.sort((a, b) => a - b);
        this.emit();
      });

      running.push(promise);
      promise.finally(() => {
        const index = running.indexOf(promise);
        if (index >= 0) running.splice(index, 1);
      });

      // 并发池：保持 MAX_CONCURRENCY 个任务同时进行
      if (running.length < MAX_CONCURRENCY) {
        return next();
      }

      await Promise.race(running);
      return next();
    };

    // 启动并发上传
    const starters = Array.from({ length: Math.min(MAX_CONCURRENCY, queue.length) }, () => next());
    await Promise.all(starters);
    await Promise.all(running);

    // 等所有分片上传完成后，通知后端进行最终收尾
    await completeUpload(prepared.taskId);

    this.task.status = 'done';
    this.emit();
  }

  pause() {
    this.task = this.task ? { ...this.task, status: 'paused' } : null;
    this.abortController?.abort();
    this.emit();
  }

  resume(file: File) {
    if (!this.task?.taskId) {
      throw new Error('没有可恢复的任务');
    }
    return this.start(file);
  }
}

// 使用示例：
// const uploader = new LargeFileUploader((task) => setState(task));
// await uploader.start(file);
```

### 后端
```java
/**
 * 后端职责：
 * 1. 创建上传任务，记录文件指纹、任务状态、总分片数等元信息。
 * 2. 接收分片并记录“已上传分片”。
 * 3. 支持秒传：如果文件已经存在，直接返回已完成。
 * 4. 支持断点续传：前端只传缺失分片。
 * 5. 完成上传后，把任务状态、文件元信息、MinIO 对象地址落到 MySQL。
 */
@RestController
@RequestMapping("/api/upload")
@RequiredArgsConstructor
public class UploadController {

    private final UploadTaskService uploadTaskService;
    private final MinioStorageService minioStorageService;

    /**
     * 上传前预检：
     * 1. 根据 fileHash 查询 MySQL，看文件是否已经完整存在（秒传）。
     * 2. 如果任务存在但未完成，返回已上传分片列表，支持断点续传。
     * 3. 如果任务不存在，则创建一个新的上传任务记录。
     */
    @PostMapping("/prepare")
    public UploadPrepareResponse prepare(@RequestBody UploadPrepareRequest request) {
        return uploadTaskService.prepareTask(request);
    }

    /**
     * 分片上传接口，用 multipart/form-data 接收文件分片。
     * 常见做法是：
     * - 先把分片上传到 MinIO 的临时路径/临时 bucket
     * - 再在 MySQL 里记录该分片已经成功
     * - 同一个 taskId + chunkIndex 重复上传时，服务端直接返回幂等成功
     */
    @PostMapping(value = "/chunk", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public UploadChunkResponse uploadChunk(
            @RequestParam("taskId") String taskId,
            @RequestParam("fileHash") String fileHash,
            @RequestParam("fileName") String fileName,
            @RequestParam("chunkIndex") Integer chunkIndex,
            @RequestParam("totalChunks") Integer totalChunks,
            @RequestPart("chunk") MultipartFile chunk
    ) {
        return uploadTaskService.uploadChunk(taskId, fileHash, fileName, chunkIndex, totalChunks, chunk);
    }

    /**
     * 完成上传接口。
     * 1. 校验数据库里是否已经收齐全部分片。
     * 2. 如果使用 MinIO multipart upload，就在这里完成最终提交。
     * 3. 把最终 objectKey / url / 文件元信息写入 MySQL。
     * 4. 更新任务状态为 DONE。
     */
    @PostMapping("/complete")
    public UploadCompleteResponse complete(@RequestBody UploadCompleteRequest request) {
        return uploadTaskService.completeTask(request.getTaskId());
    }

    /**
     * 前端刷新后恢复任务状态：
     * 通过 taskId 查询当前任务进度、已上传分片列表、对象地址等信息。
     */
    @GetMapping("/task/{taskId}")
    public UploadTaskDetailResponse getTask(@PathVariable String taskId) {
        return uploadTaskService.getTaskDetail(taskId);
    }
}

@Data
class UploadPrepareRequest {
    private String fileName;
    private Long fileSize;
    private String fileHash;
}

@Data
class UploadPrepareResponse {
    private String taskId;
    private boolean shouldSkip;
    private List<Integer> alreadyUploadedChunks;
}

@Data
class UploadChunkResponse {
    private boolean ok;
    private String message;
    private List<Integer> uploadedChunks;
}

@Data
class UploadCompleteRequest {
    private String taskId;
}

@Data
class UploadCompleteResponse {
    private String taskId;
    private String status;
    private String objectKey;
}

@Data
class UploadTaskDetailResponse {
    private String taskId;
    private String fileName;
    private Long fileSize;
    private String fileHash;
    private String status;
    private List<Integer> uploadedChunks;
    private String objectKey;
    private LocalDateTime updatedAt;
}

/**
 * 上传任务服务
 * - upload_task：记录文件的整体任务
 * - upload_chunk：记录每个分片的上传状态
 * - file_asset：记录最终文件元信息和 MinIO 地址
 */
@Service
@RequiredArgsConstructor
class UploadTaskService {

    private final UploadTaskRepository uploadTaskRepository;
    private final UploadChunkRepository uploadChunkRepository;
    private final FileAssetRepository fileAssetRepository;
    private final MinioStorageService minioStorageService;

    public UploadPrepareResponse prepareTask(UploadPrepareRequest request) {
        // 1. 先查 MySQL 中是否存在相同 fileHash 且已完成的文件。
        //    如果存在，直接秒传。
        Optional<FileAssetEntity> existedAsset = fileAssetRepository.findByFileHash(request.getFileHash());
        if (existedAsset.isPresent()) {
            FileAssetEntity asset = existedAsset.get();
            UploadPrepareResponse response = new UploadPrepareResponse();
            response.setTaskId(asset.getTaskId());
            response.setShouldSkip(true);
            response.setAlreadyUploadedChunks(Collections.emptyList());
            return response;
        }

        // 2. 如果有未完成任务，复用该任务，返回已上传分片列表。
        Optional<UploadTaskEntity> existedTask = uploadTaskRepository.findByFileHash(request.getFileHash());
        if (existedTask.isPresent() && !"DONE".equals(existedTask.get().getStatus())) {
            UploadTaskEntity task = existedTask.get();
            UploadPrepareResponse response = new UploadPrepareResponse();
            response.setTaskId(task.getTaskId());
            response.setShouldSkip(false);
            response.setAlreadyUploadedChunks(uploadChunkRepository.findUploadedChunkIndexes(task.getTaskId()));
            return response;
        }

        // 3. 创建新任务，写入 MySQL。
        String taskId = UUID.randomUUID().toString().replace("-", "");
        UploadTaskEntity task = new UploadTaskEntity();
        task.setTaskId(taskId);
        task.setFileName(request.getFileName());
        task.setFileSize(request.getFileSize());
        task.setFileHash(request.getFileHash());
        task.setStatus("PENDING");
        task.setCreatedAt(LocalDateTime.now());
        task.setUpdatedAt(LocalDateTime.now());
        uploadTaskRepository.save(task);

        UploadPrepareResponse response = new UploadPrepareResponse();
        response.setTaskId(taskId);
        response.setShouldSkip(false);
        response.setAlreadyUploadedChunks(Collections.emptyList());
        return response;
    }

    public UploadChunkResponse uploadChunk(String taskId, String fileHash, String fileName, Integer chunkIndex, Integer totalChunks, MultipartFile chunk) {
        // 1. 查任务是否存在，防止非法上传。
        UploadTaskEntity task = uploadTaskRepository.findByTaskId(taskId)
                .orElseThrow(() -> new IllegalArgumentException("task not found"));

        // 2. 幂等判断：同一个 taskId + chunkIndex 重复上传时，直接按“已成功”处理。
        Optional<UploadChunkEntity> existed = uploadChunkRepository.findByTaskIdAndChunkIndex(taskId, chunkIndex);
        if (existed.isPresent()) {
            UploadChunkResponse response = new UploadChunkResponse();
            response.setOk(true);
            response.setMessage("chunk already exists");
            response.setUploadedChunks(uploadChunkRepository.findUploadedChunkIndexes(taskId));
            return response;
        }

        // 3. 把分片传到 MinIO。
        //    这里可以上传到临时 bucket 或临时目录，等全部分片完成后再完成最终对象组装。
        String chunkObjectKey = minioStorageService.uploadChunk(taskId, chunkIndex, chunk);

        // 4. 写入分片表，MySQL 记录这个 chunk 已成功。
        UploadChunkEntity chunkEntity = new UploadChunkEntity();
        chunkEntity.setTaskId(taskId);
        chunkEntity.setChunkIndex(chunkIndex);
        chunkEntity.setTotalChunks(totalChunks);
        chunkEntity.setChunkObjectKey(chunkObjectKey);
        chunkEntity.setChunkSize(chunk.getSize());
        chunkEntity.setCreatedAt(LocalDateTime.now());
        uploadChunkRepository.save(chunkEntity);

        // 5. 更新任务状态。
        task.setStatus("UPLOADING");
        task.setUpdatedAt(LocalDateTime.now());
        uploadTaskRepository.save(task);

        UploadChunkResponse response = new UploadChunkResponse();
        response.setOk(true);
        response.setMessage("chunk uploaded");
        response.setUploadedChunks(uploadChunkRepository.findUploadedChunkIndexes(taskId));
        return response;
    }

    public UploadCompleteResponse completeTask(String taskId) {
        UploadTaskEntity task = uploadTaskRepository.findByTaskId(taskId)
                .orElseThrow(() -> new IllegalArgumentException("task not found"));

        List<UploadChunkEntity> chunks = uploadChunkRepository.findAllByTaskIdOrderByChunkIndex(taskId);
        if (chunks.isEmpty()) {
            throw new IllegalStateException("no chunks uploaded");
        }

        // 1. 校验是否收齐全部分片。
        if (!uploadChunkRepository.isTaskComplete(taskId)) {
            throw new IllegalStateException("chunks not complete");
        }

        // 2. 在 MinIO 中完成最终对象生成。
        //    如果使用 multipart upload，这一步就是 complete multipart upload。
        String objectKey = minioStorageService.completeMultipartUpload(taskId, task.getFileName(), chunks);

        // 3. 写入最终文件元信息表。
        FileAssetEntity asset = new FileAssetEntity();
        asset.setTaskId(taskId);
        asset.setFileName(task.getFileName());
        asset.setFileSize(task.getFileSize());
        asset.setFileHash(task.getFileHash());
        asset.setObjectKey(objectKey);
        asset.setStatus("READY");
        asset.setCreatedAt(LocalDateTime.now());
        fileAssetRepository.save(asset);

        // 4. 更新任务状态为完成。
        task.setStatus("DONE");
        task.setUpdatedAt(LocalDateTime.now());
        uploadTaskRepository.save(task);

        UploadCompleteResponse response = new UploadCompleteResponse();
        response.setTaskId(taskId);
        response.setStatus("DONE");
        response.setObjectKey(objectKey);
        return response;
    }

    public UploadTaskDetailResponse getTaskDetail(String taskId) {
        UploadTaskEntity task = uploadTaskRepository.findByTaskId(taskId)
                .orElseThrow(() -> new IllegalArgumentException("task not found"));

        UploadTaskDetailResponse response = new UploadTaskDetailResponse();
        response.setTaskId(task.getTaskId());
        response.setFileName(task.getFileName());
        response.setFileSize(task.getFileSize());
        response.setFileHash(task.getFileHash());
        response.setStatus(task.getStatus());
        response.setUploadedChunks(uploadChunkRepository.findUploadedChunkIndexes(taskId));
        response.setObjectKey(fileAssetRepository.findByTaskId(taskId).map(FileAssetEntity::getObjectKey).orElse(null));
        response.setUpdatedAt(task.getUpdatedAt());
        return response;
    }
}

/**
 * MinIO 存储服务。
 *
 * 这里不展开具体 SDK 代码，但要体现出：
 * - 上传分片到 MinIO
 * - 最后完成 multipart upload
 * - 返回最终 objectKey
 */
@Service
class MinioStorageService {

    @Value("${minio.bucket}")
    private String bucket;

    public String uploadChunk(String taskId, Integer chunkIndex, MultipartFile chunk) {
        // 真实实现里：调用 MinIO SDK，把分片对象上传到临时位置。
        // 例如：bucket/tasks/{taskId}/chunks/{chunkIndex}
        return bucket + "/tasks/" + taskId + "/chunks/" + chunkIndex;
    }

    public String completeMultipartUpload(String taskId, String fileName, List<UploadChunkEntity> chunks) {
        // 真实实现里：根据 chunks 的顺序，调用 MinIO multipart complete。
        // 返回最终对象 key，比如：bucket/files/{taskId}/{fileName}
        return bucket + "/files/" + taskId + "/" + fileName;
    }
}

/**
 * 下面是 MySQL 对应的实体和仓储接口。
 * 真实项目里一般会配合 JPA / MyBatis / MyBatis-Plus 使用。
 */

@Data
class UploadTaskEntity {
    private Long id;
    private String taskId;
    private String fileName;
    private Long fileSize;
    private String fileHash;
    private String status;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}

@Data
class UploadChunkEntity {
    private Long id;
    private String taskId;
    private Integer chunkIndex;
    private Integer totalChunks;
    private String chunkObjectKey;
    private Long chunkSize;
    private LocalDateTime createdAt;
}

@Data
class FileAssetEntity {
    private Long id;
    private String taskId;
    private String fileName;
    private Long fileSize;
    private String fileHash;
    private String objectKey;
    private String status;
    private LocalDateTime createdAt;
}

@Repository
interface UploadTaskRepository {
    Optional<UploadTaskEntity> findByFileHash(String fileHash);
    Optional<UploadTaskEntity> findByTaskId(String taskId);
    UploadTaskEntity save(UploadTaskEntity entity);
}

@Repository
interface UploadChunkRepository {
    Optional<UploadChunkEntity> findByTaskIdAndChunkIndex(String taskId, Integer chunkIndex);
    List<Integer> findUploadedChunkIndexes(String taskId);
    List<UploadChunkEntity> findAllByTaskIdOrderByChunkIndex(String taskId);
    boolean isTaskComplete(String taskId);
    UploadChunkEntity save(UploadChunkEntity entity);
}

@Repository
interface FileAssetRepository {
    Optional<FileAssetEntity> findByFileHash(String fileHash);
    Optional<FileAssetEntity> findByTaskId(String taskId);
    FileAssetEntity save(FileAssetEntity entity);
}
```

## 3. SSE 流式问答（fetch + ReadableStream + 逐 token 渲染）

### 前端
```tsx
// src/types/chat.ts
export type ChatMessage = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  status?: 'streaming' | 'done' | 'error' | 'cancelled';
};

// src/api/chat.ts
export async function streamChat(
  prompt: string,
  onChunk: (chunk: string) => void,
  signal: AbortSignal
) {
  const res = await fetch('/api/chat/stream', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${localStorage.getItem('token') ?? ''}`,
    },
    body: JSON.stringify({ prompt }),
    signal,
  });

  if (!res.ok || !res.body) {
    throw new Error('流式接口请求失败');
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder('utf-8');
  let buffer = '';

  // fetch + ReadableStream 的关键点：持续读流、持续解析、持续渲染。
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });

    // SSE 数据可能一个 chunk 里包含多个事件，所以要按事件分隔符切片。
    let boundaryIndex = buffer.indexOf('\n\n');
    while (boundaryIndex !== -1) {
      const rawEvent = buffer.slice(0, boundaryIndex).trim();
      buffer = buffer.slice(boundaryIndex + 2);
      boundaryIndex = buffer.indexOf('\n\n');

      if (!rawEvent) continue;
      if (rawEvent.includes('data: [DONE]')) return;

      const dataLine = rawEvent
        .split('\n')
        .filter((line) => line.startsWith('data:'))
        .map((line) => line.replace(/^data:\s?/, ''))
        .join('');

      if (dataLine) onChunk(dataLine);
    }
  }
}

// src/hooks/useStreamChat.ts
import { useMemo, useRef, useState } from 'react';
import { streamChat } from '../api/chat';
import type { ChatMessage } from '../types/chat';

export function useStreamChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const controllerRef = useRef<AbortController | null>(null);
  const streamingIdRef = useRef('');

  const appendAssistantChunk = (chunk: string) => {
    setMessages((prev) =>
      prev.map((msg) =>
        msg.id === streamingIdRef.current
          ? { ...msg, content: msg.content + chunk, status: 'streaming' }
          : msg
      )
    );
  };

  const send = async (prompt: string) => {
    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;

    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: prompt,
      status: 'done',
    };

    const assistantMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'assistant',
      content: '',
      status: 'streaming',
    };

    streamingIdRef.current = assistantMsg.id;
    setMessages((prev) => [...prev, userMsg, assistantMsg]);
    setLoading(true);

    try {
      await streamChat(prompt, appendAssistantChunk, controller.signal);
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === assistantMsg.id ? { ...msg, status: 'done' } : msg
        )
      );
    } catch (error) {
      const isAbort = error instanceof DOMException && error.name === 'AbortError';
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === assistantMsg.id
            ? { ...msg, status: isAbort ? 'cancelled' : 'error' }
            : msg
        )
      );
    } finally {
      setLoading(false);
    }
  };

  const stop = () => controllerRef.current?.abort();

  return useMemo(() => ({ messages, loading, send, stop }), [messages, loading]);
}
```

## 4. L1 / L2 / L3 三层记忆

### 统一记忆实体：承载 L1 / L2 / L3 三类记忆
```java
/**
 * - L1 表示最近原文窗口，偏短期、频繁写入；
 * - L2 表示滚动摘要，承载阶段性上下文；
 * - L3 表示长期语义记忆，保存稳定偏好、事实与项目背景。
 *
 * 通过 level、scope、confidence、ttlAt 和 sourceType 等字段，
 * 可以区分记忆层级、适用范围、来源可信度以及生命周期。
 */
@Data
public class MemoryRecord {
  /** 主键。 */
  private Long id;
  /** 所属用户。 */
  private Long userId;
  /** 所属会话，L1/L2 通常会用到。 */
  private Long conversationId;
  /** 层级：L1 / L2 / L3。 */
  private MemoryLevel level;
  /** 作用域：SESSION / USER / PROJECT。 */
  private MemoryScope scope;
  /** 原始内容，通常是原文或抽取出的短文本。 */
  private String content;
  /** 摘要，L2 滚动摘要或 L3 的结构化摘要。 */
  private String summary;
  /** 结构化事实内容，通常用 JSON 保存。 */
  private String factsJson;
  /** 来源类型，例如用户确认、自动抽取等。 */
  private String sourceType;
  /** 来源轮次或请求标识，用于追踪是从哪一轮产生的。 */
  private String sourceTurn;
  /** 置信度，数值越高表示越可信。 */
  private Double confidence;
  /** 命中次数，用于热度和去重合并参考。 */
  private Integer hitCount;
  /** 版本号，用于记录同一的演进。 */
  private Integer version;
  /** 状态，例如 ACTIVE / ARCHIVED / EXPIRED。 */
  private String status;
  /** 过期时间，到期后不再参与读取。 */
  private LocalDateTime ttlAt;
  /** 创建时间。 */
  private LocalDateTime createdAt;
  /** 更新时间。 */
  private LocalDateTime updatedAt;
}
```

### 写入记忆记录
```java
@Service
@RequiredArgsConstructor
public class DefaultMemoryStorageService implements MemoryStorageService {
  private final MemoryRecordMapper memoryRecordMapper;
  private final MemoryGatingPolicy gatingPolicy;
  private final MemoryConflictResolver conflictResolver;

  /**
   * 具体步骤如下：
   * 1. 先通过门控策略判断当前命令是否应该进入写库流程，避免无效写入；
   * 2. 将命令对象转换为 `MemoryRecord`，并补齐默认字段、时间戳和 TTL；
   * 3. 对 L3 记忆执行去重和冲突处理，避免同一知识点重复膨胀；
   * 4. 如果没有命中任何冲突规则，则直接插入新记录。
   */
  @Override
  public MemoryRecord write(MemoryWriteCommand command) {
    // 通过门控策略判断当前命令是否应该进入写库流程
    if (!gatingPolicy.shouldWrite(command)) {
      return null;
    }

    // 把命令对象转换成数据库实体，统一补齐默认值和时间字段。
    MemoryRecord candidate = toRecord(command);

    // 只有 L3 记忆需要做“同内容去重 + 冲突合并”处理。
    if (candidate.getLevel() == MemoryLevel.L3) {
      // 根据“同一用户 + 同一内容”找到可能重复的历史记录。
      MemoryRecord existing = memoryRecordMapper.selectByUserIdAndContent(command.getUserId(), command.getContent());
      if (existing != null) {
        // 交给冲突解决器决定：保留旧值、合并、覆盖还是忽略。
        switch (conflictResolver.resolve(existing, candidate)) {
          case KEEP_EXISTING:
            // 保留旧记录，但要更新命中次数和最近更新时间，表示该记忆再次被确认。
            existing.setHitCount((existing.getHitCount() == null ? 0 : existing.getHitCount()) + 1);
            existing.setUpdatedAt(LocalDateTime.now());
            memoryRecordMapper.update(existing);
            return existing;
          case MERGE:
            // 合并摘要和事实字段，同时用更高的置信度覆盖旧值，避免信息丢失。
            existing.setSummary(merge(existing.getSummary(), candidate.getSummary()));
            existing.setFactsJson(merge(existing.getFactsJson(), candidate.getFactsJson()));
            existing.setConfidence(Math.max(existing.getConfidence() == null ? 0D : existing.getConfidence(), candidate.getConfidence() == null ? 0D : candidate.getConfidence()));
            existing.setHitCount((existing.getHitCount() == null ? 0 : existing.getHitCount()) + 1);
            existing.setUpdatedAt(LocalDateTime.now());
            memoryRecordMapper.update(existing);
            return existing;
          case REPLACE:
            // 直接用新记录替换旧记录，但沿用旧 ID，确保更新的是同一条数据。
            candidate.setId(existing.getId());
            candidate.setVersion((existing.getVersion() == null ? 0 : existing.getVersion()) + 1);
            candidate.setHitCount((existing.getHitCount() == null ? 0 : existing.getHitCount()) + 1);
            memoryRecordMapper.update(candidate);
            return candidate;
          case IGNORE:
          default:
            // 不做任何改动，直接返回旧记录，表示本次写入不生效。
            return existing;
        }
      }
    }
    memoryRecordMapper.insert(candidate);
    return candidate;
  }

  /**
   * 查询某个会话下最近写入的记忆记录，默认按时间倒序取前 N 条。
   */
  @Override
  public List<MemoryRecord> recentByConversation(Long conversationId, int limit) {
    if (conversationId == null || limit <= 0) {
      return Collections.emptyList();
    }
    return memoryRecordMapper.selectRecentByConversationId(conversationId, limit);
  }

  /**
   * 按用户和关键词检索 L3 记忆。
   */
  @Override
  public List<MemoryRecord> searchL3(Long userId, String query, int limit) {
    if (userId == null || !StringUtils.hasText(query) || limit <= 0) {
      return Collections.emptyList();
    }
    return memoryRecordMapper.searchByUserId(userId, query.trim(), limit);
  }

  /**
   * 清理过期记忆的扩展入口，当前实现并不在这里直接执行删除，而是把过期判断交给 SQL 中的 `ttl_at` 条件来完成。
   */
  @Override
  public void cleanupExpired() {
    // 这里由 SQL 的 ttl_at 条件控制过期淘汰，保留定时钩子以便后续扩展物理清理。
  }

  /**
   * 定时触发过期清理。
   */
  @Scheduled(fixedDelay = 60_000L)
  public void scheduledCleanup() {
    cleanupExpired();
  }

  /**
   * 将写入命令转换为可持久化的记忆实体。
   *
   * 这个转换方法只做“字段映射 + 默认值补齐”，不承担业务判断逻辑。
   * 例如用户、会话、层级、内容、摘要、事实等直接从命令对象复制；
   * 命中次数、版本号、状态、创建时间、更新时间等则由这里统一初始化。
   *
   * TTL 的默认策略也在这里处理：如果调用方显式传入了天数，就优先使用；
   * 否则当记忆层级为 L3 时，默认给出一个较长的生存周期，体现长期记忆的特点。
   */
  private MemoryRecord toRecord(MemoryWriteCommand command) {
    LocalDateTime now = LocalDateTime.now();
    MemoryRecord record = new MemoryRecord();
    record.setUserId(command.getUserId());
    record.setConversationId(command.getConversationId());
    record.setLevel(command.getLevel());
    record.setScope(command.getScope());
    record.setContent(command.getContent());
    record.setSummary(command.getSummary());
    record.setFactsJson(command.getFactsJson());
    record.setSourceType(command.getSourceType() == null ? null : command.getSourceType().name());
    record.setSourceTurn(command.getSourceTurn());
    record.setConfidence(command.getConfidence());
    record.setHitCount(1);
    record.setVersion(1);
    record.setStatus("ACTIVE");
    record.setCreatedAt(now);
    record.setUpdatedAt(now);
    if (command.getTTLDays() != null && command.getTTLDays() > 0) {
      record.setTtlAt(now.plusDays(command.getTTLDays()));
    } else if (command.getLevel() == MemoryLevel.L3) {
      record.setTtlAt(now.plusDays(30));
    }
    return record;
  }

  /**
   * 合并两个文本字段，用于 L3 冲突处理中的“文本拼接”场景。
   * 同时避免重复内容不断累积。它的规则比较简单：
   * - 旧值为空时，直接采用新值；
   * - 新值为空时，保留旧值；
   * - 旧值已经包含新值时，不再重复拼接；
   * - 其他情况则用换行把两段内容连接起来，方便后续人工阅读。
   */
  private String merge(String oldValue, String newValue) {
    if (!StringUtils.hasText(oldValue)) {
      return newValue;
    }
    if (!StringUtils.hasText(newValue)) {
      return oldValue;
    }
    if (oldValue.contains(newValue)) {
      return oldValue;
    }
    return oldValue + "\n" + newValue;
  }
}
```

### 三层记忆的编排中心
```java
@Service
@RequiredArgsConstructor
public class DefaultMemoryOrchestratorService implements MemoryOrchestratorService {
  /**
   * 负责把记忆写入底层存储，并在写入前后处理去重、合并、版本推进和 TTL。
   */
  private final MemoryStorageService memoryStorageService;
  /**
   * 负责按会话与用户上下文检索当前生成需要的记忆。
   */
  private final MemoryRetrievalService memoryRetrievalService;
  /**
   * 负责把新增对话滚动成 L2 摘要。
   */
  private final MemorySummaryService memorySummaryService;

  /**
   * 构建当前生成所需的记忆上下文。
   */
  @Override
  public MemoryContext buildContext(Long userId, Long conversationId, String query) {
    return memoryRetrievalService.buildContext(userId, conversationId, query);
  }

  /**
   * 吸收一轮对话，把用户输入和模型输出分别沉淀到 L1 / L2 / L3。
   *
   * 写入规则：
   * - 用户原文优先进入 L1；
   * - 当前轮的新增内容滚动更新到 L2；
   * - 对长期稳定偏好或事实，按门控条件提升到 L3。
   */
  @Override
  public void ingestTurn(Long userId, Long conversationId, String requestId, String userMessage, String assistantMessage, String previousSummary) {
    if (userId == null || conversationId == null) {
      return;
    }
    // 用户原文优先进入 L1；
    if (StringUtils.hasText(userMessage)) {
      memoryStorageService.write(MemoryWriteCommand.builder()
          .userId(userId)
          .conversationId(conversationId)
          .level(MemoryLevel.L1)
          .scope(MemoryScope.SESSION)
          .content(userMessage)
          .sourceType(MemorySourceType.SYSTEM_MIGRATION)
          .sourceTurn(requestId)
          .confidence(1.0D)
          .ttlDays(2)
          .build());
    }
    String combined = String.join("\n", StringUtils.hasText(userMessage) ? userMessage : "", StringUtils.hasText(assistantMessage) ? assistantMessage : "");
    // 当前轮的新增内容滚动更新到 L2；
    String summary = memorySummaryService.updateRollingSummary(conversationId, previousSummary, combined, userId);
    memoryStorageService.write(MemoryWriteCommand.builder()
        .userId(userId)
        .conversationId(conversationId)
        .level(MemoryLevel.L2)
        .scope(MemoryScope.SESSION)
        .content(combined)
        .summary(summary)
        .sourceType(MemorySourceType.AGENT_EXTRACTION)
        .sourceTurn(requestId)
        .confidence(0.9D)
        .ttlDays(30)
        .build());
    // 对长期稳定偏好或事实，按门控条件提升到 L3。
    if (StringUtils.hasText(userMessage) && shouldPromoteToL3(userMessage)) {
      memoryStorageService.write(MemoryWriteCommand.builder()
          .userId(userId)
          .conversationId(conversationId)
          .level(MemoryLevel.L3)
          .scope(MemoryScope.USER)
          .content(normalize(userMessage))
          .summary(summary)
          .factsJson("{\"source\":\"turn\",\"type\":\"user_preference\"}")
          .sourceType(MemorySourceType.USER_CONFIRMATION)
          .sourceTurn(requestId)
          .confidence(0.95D)
          .ttlDays(30)
          .build());
    }
  }

  @Override
  public void write(MemoryWriteCommand command) {
    memoryStorageService.write(command);
  }

  /**
   * 判断是否有必要把当前用户输入提升为 L3 长期记忆，这里用的是轻量级关键词门控。
   */
  private boolean shouldPromoteToL3(String text) {
    String normalized = normalize(text);
    return normalized.contains("记住") || normalized.contains("偏好") || normalized.contains("以后") || normalized.contains("默认") || normalized.contains("不要再") || normalized.contains("一直") || normalized.contains("总是");
  }

  /**
   * 去掉首尾空白，避免重复存储时因为格式不同导致去重失败。
   */
  private String normalize(String text) {
    return text == null ? "" : text.trim();
  }
}

```

### 聊天入口和流式入口
```java
@Service
@RequiredArgsConstructor
public class AiChatServiceImpl implements AiChatService {

  private static final String REDIS_CONVERSATION_HISTORY_KEY_PREFIX = "ai:conversation:history:";
  private static final int REDIS_HISTORY_LIMIT = 20;
  private static final String REDIS_STOP_KEY_PREFIX = "ai:chat:stop:";
  private static final ConcurrentHashMap<Long, String> ACTIVE_REQUESTS = new ConcurrentHashMap<>();

  private final AiConversationMapper aiConversationMapper;
  private final AiConversationMessageMapper aiConversationMessageMapper;
  private final Generation generation;
  private final AiProperties aiProperties;
  private final StringRedisTemplate stringRedisTemplate;
  private final ObjectMapper objectMapper;
  private final KnowledgeArticleService knowledgeArticleService;
  private final KnowledgeArticleChunkService knowledgeArticleChunkService;
  private final MemoryContextBuilder memoryContextBuilder;
  private final MemoryOrchestratorService memoryOrchestratorService;

  /**
   * 聊天入口。
   * 先读取三层记忆上下文，再把最近消息、长期偏好和检索引用组装到 prompt 里，
   * 最后在模型生成完成后把本轮对话回写到 L1 / L2 / L3。
   */
  @Override
  public ChatResponse chat(ChatRequest request, Long userId) {
    // 先确认会话归属，避免越权访问别人的聊天记录。
    AiConversation conversation = verifyConversation(request.getConversationId(), userId);
    // 从缓存或数据库加载历史，保证模型拿到完整上下文。
    List<AiConversationMessage> history = loadConversationHistory(conversation.getId());
    // 先落库用户输入，确保这轮对话即使后续生成失败也不会丢失。
    AiConversationMessage userMessage = createMessage(conversation.getId(), "user", request.getMessage(), "COMPLETED", request.getRequestId());
    aiConversationMessageMapper.insert(userMessage);
    // 将本轮用户消息补进历史列表，供后续 prompt 组装使用。
    history.add(userMessage);
    // 把最新历史写回 Redis，方便流式接口和后续轮次快速复用。
    cacheHistoryToRedis(conversation.getId(), history);
    // 选择本轮是否启用 RAG：请求显式指定时优先使用请求值，否则沿用会话配置。
    Boolean useRag = request.getUseRag() != null ? request.getUseRag() : conversation.getUseRag();
    aiConversationMapper.updateUseRagById(conversation.getId(), userId, useRag);
    // 构建三层记忆上下文，向模型提供近期对话、摘要和长期偏好。
    MemoryContext memoryContext = memoryContextBuilder.build(userId, conversation.getId(), request.getMessage());
    // 根据当前问题检索知识库引用，供回答和溯源使用。
    List<ChatCitationDto> citations = buildCitations(useRag, request.getMessage(), request.getArticleId(), request.getTopK(), userId);
    String prompt = buildPrompt(request.getMessage(), citations, memoryContext);
    // 将历史消息、系统提示和检索上下文组装成模型输入。
    List<Message> messages = buildMessages(history, prompt);
    // 同步生成一次完整回答，适合非流式调用场景。
    String answer = generateOnce(messages);
    // 把这轮问答写回记忆层，形成从对话到记忆的闭环。
    memoryOrchestratorService.ingestTurn(userId, conversation.getId(), request.getRequestId(), request.getMessage(), answer, conversation.getSummary());
    // 返回最终回答和引用信息。
    return new ChatResponse(answer, citations, !citations.isEmpty());
  }

  /**
   * 流式聊天入口。
   */
  @Override
  public SseEmitter streamChat(ChatStreamRequest request, Long userId) {
    // 创建一个不自动超时的 SSE 发送器，避免长回答被容器提前切断。
    SseEmitter emitter = new SseEmitter(0L);
    // 优先使用前端传入的 requestId，方便断线重连和停止请求精确对应。
    String requestId = StringUtils.hasText(request.getRequestId()) ? request.getRequestId() : UUID.randomUUID().toString();
    Long conversationId = request.getConversationId();
    // 标记当前会话的活跃请求，防止旧请求与新请求串台。
    ACTIVE_REQUESTS.put(conversationId, requestId);
    // 清理历史停止标记，避免上一次中断影响本次生成。
    stringRedisTemplate.delete(stopKey(conversationId));

    new Thread(() -> {
      try {
        // 校验会话归属后再开始写入，保证安全性。
        AiConversation conversation = verifyConversation(conversationId, userId);
        // 先保存用户消息，确保消息流开始之前就有持久化记录。
        AiConversationMessage userMessage = createMessage(conversation.getId(), "user", request.getMessage(), "COMPLETED", requestId);
        aiConversationMessageMapper.insert(userMessage);

        // 把最新用户消息合并进历史列表，用于后续 prompt 拼装。
        List<AiConversationMessage> history = loadConversationHistory(conversation.getId());
        history.add(userMessage);
        // 重新缓存最近消息，方便后续轮次和流式过程读取。
        cacheHistoryToRedis(conversation.getId(), history);

        // 计算本轮是否启用 RAG，并同步回会话配置。
        Boolean useRag = request.getUseRag() != null ? request.getUseRag() : conversation.getUseRag();
        aiConversationMapper.updateUseRagById(conversation.getId(), userId, useRag);
        // 构建三层记忆上下文，为模型提供近期上下文和长期偏好。
        MemoryContext memoryContext = memoryContextBuilder.build(userId, conversation.getId(), request.getMessage());
        // 检索知识库引用，供模型回答与前端展示。
        List<ChatCitationDto> citations = buildCitations(useRag, request.getMessage(), request.getArticleId(), request.getTopK(), userId);
        String prompt = buildPrompt(request.getMessage(), citations, memoryContext);
        // 组合成最终送入模型的消息列表。
        List<Message> messages = buildMessages(history, prompt);

        // 先发送 RAG 开始事件，让前端知道正在准备引用。
        emitter.send(SseEmitter.event().name("rag-start").data(jsonEvent("rag-start", "", conversationId, requestId, null, null, List.of())));
        // 把引用结果单独发给前端，方便先展示来源再开始生成正文。
        emitter.send(SseEmitter.event().name("rag-result").data(jsonEvent("rag-result", "", conversationId, requestId, null, null, citations)));

        // 创建一条助手消息占位，后续在流式完成时补齐内容和状态。
        AiConversationMessage assistantMessage = createMessage(conversation.getId(), "assistant", "", "GENERATING", requestId);
        aiConversationMessageMapper.insert(assistantMessage);
        emitter.send(SseEmitter.event().name("message-start").data(jsonEvent("message-start", "", conversationId, requestId, null, null, citations)));

        StringBuilder assistantContent = new StringBuilder();
        AtomicBoolean stopped = new AtomicBoolean(false);
        AtomicBoolean completed = new AtomicBoolean(false);
        CountDownLatch latch = new CountDownLatch(1);
        GenerationParam param = buildGenerationParam(messages);

        generation.streamCall(param, new ResultCallback<GenerationResult>() {
          @Override
          public void onEvent(GenerationResult result) {
            try {
              // 如果收到停止信号，立即结束本轮流式处理。
              if (isStopped(conversationId, requestId)) {
                stopped.set(true);
                onComplete();
                return;
              }
              // 从模型返回值中提取当前增量文本。
              String chunk = extractContent(result);
              if (!StringUtils.hasText(chunk)) {
                return;
              }
              String delta = chunk;
              String current = assistantContent.toString();
              // 某些 SDK 会重复返回累计内容，这里只取新增片段。
              if (chunk.startsWith(current)) {
                delta = chunk.substring(current.length());
              }
              if (!StringUtils.hasText(delta)) {
                assistantContent.setLength(0);
                assistantContent.append(chunk);
                return;
              }
              // 将增量持续写入本地缓冲，并同步推送给前端。
              assistantContent.append(delta);
              emitter.send(SseEmitter.event().name("message-delta").data(jsonEvent("message-delta", delta)));
            } catch (Exception e) {
              onError(e);
            }
          }

          @Override
          public void onComplete() {
            if (completed.getAndSet(true)) {
              return;
            }
            try {
              // 完成后统一回填助手消息内容、状态和引用。
              assistantMessage.setContent(assistantContent.toString());
              assistantMessage.setStatus(stopped.get() ? "STOPPED" : "COMPLETED");
              assistantMessage.setCitations(serializeCitations(citations));
              assistantMessage.setUpdatedAt(LocalDateTime.now());
              aiConversationMessageMapper.updateById(assistantMessage);
              // 把助手回答写回记忆系统，供下一轮对话继续使用。
              memoryOrchestratorService.ingestTurn(userId, conversation.getId(), requestId, request.getMessage(), assistantContent.toString(), conversation.getSummary());
              String eventType = stopped.get() ? "message-stop" : "message-end";
              String status = stopped.get() ? "STOPPED" : "COMPLETED";
              emitter.send(SseEmitter.event().name(eventType)
                  .data(jsonEvent(eventType, "", conversationId, requestId, assistantMessage.getId(), status, citations)));
              emitter.complete();
            } catch (IOException e) {
              emitter.completeWithError(e);
            } finally {
              // 无论成功还是停止，都必须清理活跃请求和停止标记。
              cleanupActiveRequest(conversationId, requestId);
              stringRedisTemplate.delete(stopKey(conversationId));
              latch.countDown();
            }
          }

          @Override
          public void onError(Exception e) {
            if (completed.getAndSet(true)) {
              return;
            }
            try {
              // 发生错误时尽量保留已生成内容，方便排查和前端展示。
              assistantMessage.setContent(assistantContent.toString());
              assistantMessage.setStatus("FAILED");
              assistantMessage.setCitations(serializeCitations(citations));
              assistantMessage.setUpdatedAt(LocalDateTime.now());
              aiConversationMessageMapper.updateById(assistantMessage);
              emitter.send(SseEmitter.event().name("message-error").data(jsonEvent("message-error", e.getMessage())));
            } catch (IOException ignored) {
            } finally {
              cleanupActiveRequest(conversationId, requestId);
              stringRedisTemplate.delete(stopKey(conversationId));
              latch.countDown();
            }
            emitter.completeWithError(e);
          }
        });

        // 等待流式任务结束，避免线程过早退出。
        latch.await(60, TimeUnit.SECONDS);
      } catch (IOException | ApiException | NoApiKeyException | InputRequiredException e) {
        try {
          emitter.send(SseEmitter.event().name("message-error").data(jsonEvent("message-error", e.getMessage())));
        } catch (IOException ignored) {
        } finally {
          cleanupActiveRequest(conversationId, requestId);
          stringRedisTemplate.delete(stopKey(conversationId));
        }
        emitter.completeWithError(e);
      } catch (Exception e) {
        try {
          emitter.send(SseEmitter.event().name("message-error").data(jsonEvent("message-error", e.getMessage())));
        } catch (IOException ignored) {
        } finally {
          cleanupActiveRequest(conversationId, requestId);
          stringRedisTemplate.delete(stopKey(conversationId));
        }
        emitter.completeWithError(e);
      }
    }).start();

    return emitter;
  }

  @Override
  public void stopGeneration(Long conversationId, Long userId) {
    AiConversation conversation = aiConversationMapper.selectById(conversationId);
    if (conversation == null || !conversation.getUserId().equals(userId)) {
      throw new IllegalArgumentException("会话不存在或无权限停止生成");
    }
    stringRedisTemplate.opsForValue().set(stopKey(conversationId), "1", Duration.ofMinutes(10));
  }

  /**
   * 校验会话是否存在且属于当前用户。
   *
  **/
  private AiConversation verifyConversation(Long conversationId, Long userId) {
    AiConversation conversation = aiConversationMapper.selectById(conversationId);
    if (conversation == null || !conversation.getUserId().equals(userId)) {
      throw new IllegalArgumentException("会话不存在或无权限访问");
    }
    return conversation;
  }

  /**
   * 判断文章对当前用户是否可见。
   */
  private boolean isArticleVisible(Long articleId, Long userId) {
    if (articleId == null) {
      return false;
    }
    var articleResponse = knowledgeArticleService.getArticle(articleId, userId);
    return articleResponse != null && articleResponse.isSuccess() && articleResponse.getData() != null;
  }

  /**
   * 解析本轮可用于 RAG 的文章 ID 列表。
   *
   * <p>如果前端指定了单篇文章，就优先使用该文章；如果没有指定，则默认检索当前用户
   * 的全部可用文章，从而支持“全库问答”和“单文档问答”两种模式。
  **/
  private List<Long> resolveRagArticleIds(Long articleId, Long userId) {
    if (articleId != null) {
      return isArticleVisible(articleId, userId) ? List.of(articleId) : List.of();
    }
    return knowledgeArticleService.listArticles(userId).getData().stream()
        .filter(article -> article.getStatus() == null || article.getStatus() == 0)
        .map(article -> article.getArticleId())
        .toList();
  }

  /**
   * 构建引用。
   *
   * <p>只有在开启 RAG 时才会执行检索；这里会根据文章可见性筛选可用知识源，
   * 再按 query 从对应文章块中挑选最相关的内容，最终生成前端和 prompt 都能理解的引用列表。
   */
  private List<ChatCitationDto> buildCitations(Boolean useRag, String query, Long articleId, Integer topK, Long userId) {
    if (useRag == null || !useRag) {
      return List.of();
    }
    // 解析 RAG 文章 ID 
    List<Long> targetArticleIds = resolveRagArticleIds(articleId, userId);
    // 如果 RAG 文章 ID 为空，则返回空列表
    if (targetArticleIds.isEmpty()) {
      return List.of();
    }
    // 创建引用列表
    List<ChatCitationDto> citations = new ArrayList<>();
    // 剩余引用数
    int remaining = topK == null || topK <= 0 ? 5 : topK;
    // 遍历 RAG 文章 ID
    for (Long targetArticleId : targetArticleIds) {
      if (remaining <= 0) {
        break;
      }
      // 搜索文章块
      var searchResponse = knowledgeArticleChunkService.searchChunks(userId, query, targetArticleId, remaining);
      // 如果搜索响应为空，则跳过
      List<KnowledgeChunkSearchResponse> chunks = searchResponse == null ? List.of() : searchResponse.getData();
      // 如果文章块为空，则跳过
      if (chunks == null || chunks.isEmpty()) {
        continue;
      }
      // 遍历文章块
      for (KnowledgeChunkSearchResponse chunk : chunks) {
        // 如果文章块不可见，则跳过
        if (!isArticleVisible(chunk.getArticleId(), userId)) {
          continue;
        }
        String articleTitle = "知识库文章";
        var articleResponse = knowledgeArticleService.getArticle(chunk.getArticleId(), userId);
        if (articleResponse != null && articleResponse.isSuccess() && articleResponse.getData() != null) {
          articleTitle = articleResponse.getData().getTitle();
        }
        citations.add(new ChatCitationDto(
            "c" + (citations.size() + 1),
            chunk.getArticleId(),
            articleTitle,
            chunk.getChunkId(),
            chunk.getChunkIndex(),
            chunk.getChunkText(),
            chunk.getScore()));
        remaining--;
        if (remaining <= 0) {
          break;
        }
      }
    }
    return citations;
  }

  /**
   * 构建提示词。
   *
   * 这里负责把系统角色、三层记忆和知识库引用拼成一个可直接喂给模型的完整 prompt。
   * 其中对引用格式做了显式约束，目的是让模型输出稳定、可追踪，并尽量减少“看起来像引用但无法回溯”的情况。
   */
  private String buildPrompt(String question, List<ChatCitationDto> citations, MemoryContext memoryContext) {
    StringBuilder builder = new StringBuilder();
    builder.append("你是一个具备三层记忆的 AI 助手。\n");
    builder.append("请优先遵守记忆上下文中的约束和偏好，避免与长期记忆冲突。\n");
    if (memoryContext != null) {
      if (StringUtils.hasText(memoryContext.getRecentWindow())) {
        builder.append("L1 最近原文：\n").append(memoryContext.getRecentWindow()).append("\n");
      }
      if (StringUtils.hasText(memoryContext.getRollingSummary())) {
        builder.append("L2 滚动摘要：\n").append(memoryContext.getRollingSummary()).append("\n");
      }
      if (memoryContext.getLongTermMemories() != null && !memoryContext.getLongTermMemories().isEmpty()) {
        builder.append("L3 长期记忆：\n");
        for (var memory : memoryContext.getLongTermMemories()) {
          builder.append("- ")
              .append(StringUtils.hasText(memory.getSummary()) ? memory.getSummary() : memory.getContent())
              .append(" (confidence=").append(memory.getConfidence() == null ? "" : memory.getConfidence())
              .append(")\n");
        }
      }
    }
    if (citations != null && !citations.isEmpty()) {
      builder.append("知识库引用：\n");
      builder.append("引用编号格式必须严格使用 [c1]、[c2] 这种形式，不要输出其他格式的引用编号。\n");
      builder.append("如果回答中的某个结论或事实来自引用内容，必须在对应句子末尾追加相应引用编号，例如 [c1] 或 [c1][c3]。\n");
      builder.append("如果没有引用支撑，不要编造结论，直接说明无法从知识库中确认。\n");
      for (ChatCitationDto citation : citations) {
        builder.append("[").append(citation.getCitationId()).append("] ")
            .append(citation.getArticleTitle())
            .append(" - ")
            .append(citation.getChunkText())
            .append("\n");
      }
    }
    builder.append("请回答问题：").append(question);
    return builder.toString();
  }

  /**
   * 生成答案。
   */
  private String generateOnce(List<Message> messages) {
    StringBuilder answer = new StringBuilder();
    try {
      GenerationParam param = buildGenerationParam(messages);
      CountDownLatch latch = new CountDownLatch(1);
      generation.streamCall(param, new ResultCallback<GenerationResult>() {
        @Override
        public void onEvent(GenerationResult result) {
          answer.append(extractContent(result));
        }

        @Override
        public void onComplete() {
          latch.countDown();
        }

        @Override
        public void onError(Exception e) {
          latch.countDown();
          throw new RuntimeException(e);
        }
      });
      latch.await(60, TimeUnit.SECONDS);
      return answer.toString();
    } catch (Exception e) {
      throw new RuntimeException(e);
    }
  }

  /**
   * 构建生成参数。
   */
  private GenerationParam buildGenerationParam(List<Message> messages) {
    return GenerationParam.builder()
        .apiKey(aiProperties.getApiKey())
        .model(aiProperties.getModelName())
        .messages(messages)
        .temperature(aiProperties.getTemperature() == null ? null : aiProperties.getTemperature().floatValue())
        .maxTokens(aiProperties.getMaxTokens())
        .resultFormat(GenerationParam.ResultFormat.MESSAGE)
        .build();
  }

  /**
   * 判断当前生成是否应该停止。
   *
   * 这里同时检查“请求是否还是活跃请求”和“Redis 中是否存在停止标记”。
   * 前者防止旧请求串台，后者支持外部显式打断；两者任一命中都应终止生成。
   *
   * @param conversationId 会话 ID
   * @param requestId 请求 ID
   * @return 是否停止
   */
  private boolean isStopped(Long conversationId, String requestId) {
    String currentRequestId = ACTIVE_REQUESTS.get(conversationId);
    if (currentRequestId == null || !currentRequestId.equals(requestId)) {
      return true;
    }
    return Boolean.TRUE.equals(stringRedisTemplate.hasKey(stopKey(conversationId)));
  }

  /**
   * 清理当前会话的活跃请求标记。
   *
   * 使用带值校验的 remove，可以避免误删后来的新请求标记，
   * 从而减少并发场景下的串台风险。
   */
  private void cleanupActiveRequest(Long conversationId, String requestId) {
    ACTIVE_REQUESTS.remove(conversationId, requestId);
  }

  /**
   * 生成 Redis 中的停止标记 key。
   *
   * <p>将会话维度的停止状态集中存放到固定前缀下，便于统一管理和过期控制。

   */
  private String stopKey(Long conversationId) {
    return REDIS_STOP_KEY_PREFIX + conversationId;
  }

  /**
   * 创建一条会话消息实体。
   *
   * 这个方法只负责填充通用字段，不关心消息最终是否会成功完成，
   * 因此可以被用户消息、助手占位消息和异常场景复用。
   */
  private AiConversationMessage createMessage(Long conversationId, String role, String content, String status, String requestId) {
    AiConversationMessage message = new AiConversationMessage();
    message.setConversationId(conversationId);
    message.setRole(role);
    message.setContent(content);
    message.setStatus(status);
    message.setRequestId(requestId);
    message.setCreatedAt(LocalDateTime.now());
    message.setUpdatedAt(LocalDateTime.now());
    return message;
  }

  /**
   * 加载会话历史。
   *
   * 优先从 Redis 读取最近缓存的消息，这样可以减少数据库压力并提升响应速度；
   * 如果缓存不可用或为空，则回退到数据库查询，再把结果重新回填到 Redis，保证数据可恢复。
   */
  private List<AiConversationMessage> loadConversationHistory(Long conversationId) {
    String cacheKey = REDIS_CONVERSATION_HISTORY_KEY_PREFIX + conversationId;
    ListOperations<String, String> listOps = stringRedisTemplate.opsForList();
    List<String> cached = listOps.range(cacheKey, 0, -1);
    if (cached != null && !cached.isEmpty()) {
      List<AiConversationMessage> messages = new ArrayList<>();
      for (String item : cached) {
        try {
          messages.add(objectMapper.readValue(item, AiConversationMessage.class));
        } catch (JsonProcessingException ignored) {
        }
      }
      if (!messages.isEmpty()) {
        return messages;
      }
    }
    List<AiConversationMessage> dbHistory = aiConversationMessageMapper.selectByConversationId(conversationId);
    cacheHistoryToRedis(conversationId, dbHistory);
    return dbHistory;
  }

  /**
   * 缓存会话历史到 Redis。
   *
   * 这里会截取最近一段消息写入 Redis，避免历史过长导致缓存占用过高；
   * 同时设置过期时间，保证缓存可以自然失效，不需要额外的清理任务。
   */
  private void cacheHistoryToRedis(Long conversationId, List<AiConversationMessage> messages) {
    String cacheKey = REDIS_CONVERSATION_HISTORY_KEY_PREFIX + conversationId;
    ListOperations<String, String> listOps = stringRedisTemplate.opsForList();
    stringRedisTemplate.delete(cacheKey);
    List<AiConversationMessage> recentMessages = messages.size() > REDIS_HISTORY_LIMIT
        ? messages.subList(Math.max(0, messages.size() - REDIS_HISTORY_LIMIT), messages.size())
        : messages;
    for (AiConversationMessage message : recentMessages) {
      try {
        listOps.rightPush(cacheKey, objectMapper.writeValueAsString(message));
      } catch (JsonProcessingException ignored) {
      }
    }
    stringRedisTemplate.expire(cacheKey, Duration.ofHours(2));
  }

  /**
   * 把会话历史和系统提示词拼装成模型消息列表。
   *
   * 这里显式保留系统消息、用户消息和助手消息，过滤掉空内容或非对话角色，
   * 以确保送入模型的上下文尽量干净、可预测。
   */
  private List<Message> buildMessages(List<AiConversationMessage> history, String systemPrompt) {
    List<Message> messages = new ArrayList<>();
    messages.add(Message.builder().role(Role.SYSTEM.getValue()).content("You are a helpful assistant.").build());
    if (StringUtils.hasText(systemPrompt)) {
      messages.add(Message.builder().role(Role.SYSTEM.getValue()).content(systemPrompt).build());
    }
    for (AiConversationMessage message : history) {
      if (!StringUtils.hasText(message.getContent())) {
        continue;
      }
      if (!"user".equalsIgnoreCase(message.getRole()) && !"assistant".equalsIgnoreCase(message.getRole())) {
        continue;
      }
      messages.add(Message.builder().role(message.getRole()).content(message.getContent()).build());
    }
    return messages;
  }

  /**
   * 从模型流式结果中提取文本内容，这里做了多层空值保护，主要是为了兼容不同 SDK 返回结构和异常情况下的半成品结果，
   * 确保上层在任何情况下都能拿到一个安全的字符串，而不是因为字段缺失直接抛异常。
   */
  private String extractContent(GenerationResult result) {
    if (result == null || result.getOutput() == null || result.getOutput().getChoices() == null || result.getOutput().getChoices().isEmpty()) {
      return "";
    }
    if (result.getOutput().getChoices().get(0) == null || result.getOutput().getChoices().get(0).getMessage() == null) {
      return "";
    }
    String content = result.getOutput().getChoices().get(0).getMessage().getContent();
    return content == null ? "" : content;
  }

  /**
   * 组装一个不带额外业务字段的 SSE 事件 JSON，这个重载主要用于错误、简单状态通知等场景，避免调用方每次都手动传入一堆 null。
   */
  private String jsonEvent(String type, String message) {
    return jsonEvent(type, message, null, null, null, null, List.of());
  }

  private String jsonEvent(String type, String content, Long conversationId, String requestId, Long messageId, String status, List<ChatCitationDto> citations) {
    StringBuilder json = new StringBuilder("{");
    json.append("\"type\":").append(jsonString(type));
    json.append(",\"content\":").append(jsonString(content));
    if (conversationId != null) {
      json.append(",\"conversationId\":").append(conversationId);
    }
    if (requestId != null) {
      json.append(",\"requestId\":").append(jsonString(requestId));
    }
    if (messageId != null) {
      json.append(",\"messageId\":").append(messageId);
    }
    if (status != null) {
      json.append(",\"status\":").append(jsonString(status));
    }
    json.append(",\"citations\":[");
    if (citations != null && !citations.isEmpty()) {
      for (int i = 0; i < citations.size(); i++) {
        ChatCitationDto citation = citations.get(i);
        if (i > 0) {
          json.append(',');
        }
        json.append("{")
            .append("\"citationId\":").append(jsonString(citation.getCitationId())).append(',')
            .append("\"articleId\":").append(citation.getArticleId()).append(',')
            .append("\"articleTitle\":").append(jsonString(citation.getArticleTitle())).append(',')
            .append("\"chunkId\":").append(citation.getChunkId()).append(',')
            .append("\"chunkIndex\":").append(citation.getChunkIndex()).append(',')
            .append("\"chunkText\":").append(jsonString(citation.getChunkText())).append(',')
            .append("\"score\":").append(citation.getScore())
            .append("}");
      }
    }
    json.append(']');
    json.append('}');
    return json.toString();
  }

  /**
   * 把普通字符串编码成 JSON 字符串字面量。
   */
  private String jsonString(String value) {
    if (value == null) {
      return "null";
    }
    return '"' + escapeJson(value) + '"';
  }

  /**
   * 将引用列表序列化为 JSON。
   *
   * <p>如果序列化失败，直接退回空数组字符串，确保消息主体仍然可以正常落库和返回，
   * 不让引用序列化问题影响整体聊天流程。
   */
  private String serializeCitations(List<ChatCitationDto> citations) {
    try {
      return objectMapper.writeValueAsString(citations == null ? List.of() : citations);
    } catch (JsonProcessingException e) {
      return "[]";
    }
  }

  /**
   * 对 JSON 字符串中的特殊字符做最小转义。
   */
  private String escapeJson(String value) {
    return value.replace("\\", "\\\\")
        .replace("\"", "\\\"")
        .replace("\n", "\\n")
        .replace("\r", "\\r")
        .replace("\t", "\\t");
  }
}
```

### 同步和流式编辑器入口
```java
/**
 * 编辑器 AI 服务实现
 */
@Service
@RequiredArgsConstructor
public class EditorAiServiceImpl implements EditorAiService {
  private static final String STOP_KEY_PREFIX = "kb:ai:stop:";
  private static final ConcurrentHashMap<String, String> ACTIVE_REQUESTS = new ConcurrentHashMap<>();

  private final EditorAgentRouter router;
  private final KnowledgeArticleMapper articleMapper;
  private final KnowledgeArticleOperationLogMapper logMapper;
  private final StringRedisTemplate redisTemplate;
  private final ObjectMapper objectMapper;
  private final EditorMemoryService editorMemoryService;

  /**
   * 同步执行编辑器 AI。
   *
   * <p>同步接口适合前端需要立即拿到完整结果的场景，例如一次性润色、总结或翻译。
   * 这里先根据三层记忆构建编辑器上下文，再把上下文传给具体 agent，
   * 让续写 / 润色 / 翻译 / 总结都能继承当前会话的历史状态和长期偏好。
   */
  @Override
  public ApiResponse<EditorAiExecuteResponse> execute(EditorAiExecuteRequest request, Long userId) {
    verifyArticle(request.getArticleId(), userId);
    EditorTaskAgent agent = router.route(request);
    if (agent == null) {
      throw new IllegalArgumentException("不支持的编辑器 AI action: " + request.getAction());
    }
    EditorMemoryContext memoryContext = editorMemoryService.buildContext(userId, request);
    String output = agent.generate(request, memoryContext);
    saveLog(userId, request, agent, output, "SUCCESS", null, 0, request.getRequestId());
    return ApiResponse.success("执行成功", new EditorAiExecuteResponse(agent.intent(), agent.outputType(), output, agent.resultAction(), agent.meta(request)));
  }

  /**
   * 流式执行编辑器 AI。
   *
   * <p>与同步接口保持一致，区别只是把输出按事件推给前端；
   * 记忆上下文依然先构建再传入具体 agent，保证多轮编辑任务可以继承上下文。
   */
  @Override
  public SseEmitter stream(EditorAiStreamRequest request, Long userId) {
    verifyArticle(request.getArticleId(), userId);
    SseEmitter emitter = new SseEmitter(0L);
    String requestId = StringUtils.hasText(request.getRequestId()) ? request.getRequestId() : UUID.randomUUID().toString();
    String requestKey = requestKey(request.getArticleId(), requestId);
    ACTIVE_REQUESTS.put(requestKey, requestId);
    redisTemplate.delete(stopKey(request.getArticleId(), requestId));

    new Thread(() -> {
      try {
        EditorAiExecuteRequest executeRequest = new EditorAiExecuteRequest();
        executeRequest.setArticleId(request.getArticleId());
        executeRequest.setRequestId(requestId);
        executeRequest.setEntryPoint(request.getEntryPoint());
        executeRequest.setAction(request.getAction());
        executeRequest.setSelectedText(request.getSelectedText());
        executeRequest.setSurroundingContext(request.getSurroundingContext());
        executeRequest.setChatInput(request.getChatInput());
        EditorTaskAgent agent = router.route(executeRequest);
        EditorMemoryContext memoryContext = editorMemoryService.buildContext(userId, executeRequest);

        emitter.send(SseEmitter.event().name("message-start").data(json(Map.of("type", "message-start", "requestId", requestId, "articleId", request.getArticleId()))));
        String output = agent.generate(executeRequest, memoryContext);
        if (isStopped(request.getArticleId(), requestId)) {
          saveLog(userId, executeRequest, agent, output, "STOPPED", null, 0, requestId);
          emitter.send(SseEmitter.event().name("message-stop").data(json(Map.of("type", "message-stop", "requestId", requestId, "articleId", request.getArticleId()))));
          emitter.complete();
          return;
        }
        emitter.send(SseEmitter.event().name("message-delta").data(json(Map.of("type", "message-delta", "content", output, "requestId", requestId, "articleId", request.getArticleId()))));
        saveLog(userId, executeRequest, agent, output, "SUCCESS", null, 0, requestId);
        emitter.send(SseEmitter.event().name("message-end").data(json(Map.of("type", "message-end", "outputText", output, "requestId", requestId, "articleId", request.getArticleId()))));
        emitter.complete();
      } catch (Exception e) {
        try {
          emitter.send(SseEmitter.event().name("message-error").data(json(Map.of("type", "message-error", "message", e.getMessage(), "requestId", requestId, "articleId", request.getArticleId()))));
        } catch (Exception ignored) {
        }
        emitter.completeWithError(e);
      } finally {
        cleanup(request.getArticleId(), requestId);
        redisTemplate.delete(stopKey(request.getArticleId(), requestId));
      }
    }).start();

    return emitter;
  }

  @Override
  public ApiResponse<String> stop(Long articleId, String requestId, Long userId) {
    verifyArticle(articleId, userId);
    redisTemplate.opsForValue().set(stopKey(articleId, requestId), "1");
    return ApiResponse.success("已停止", null);
  }

  @Override
  public ApiResponse<List<KnowledgeArticleOperationLog>> listLogs(Long articleId, Long userId) {
    verifyArticle(articleId, userId);
    return ApiResponse.success("查询成功", List.of());
  }

  /**
   * 校验文章是否存在且属于当前用户。
   *
   * <p>编辑器 AI 的所有能力都依赖文章上下文，所以这里必须先做权限校验，
   * 防止用户越权访问或修改他人的知识库内容。
   */
  private void verifyArticle(Long articleId, Long userId) {
    var article = articleMapper.selectById(articleId);
    if (article == null || !userId.equals(article.getUserId())) {
      throw new IllegalArgumentException("文章不存在或无权访问");
    }
  }

  /**
   * 记录一次编辑器 AI 执行日志。
   *
   * <p>日志里会同时保存输入、输出、意图、状态、耗时和请求 ID，方便后续做问题排查、
   * 效果分析和行为审计。这里采用快照式记录，便于精确复盘每一次生成。
   */
  private void saveLog(Long userId, EditorAiExecuteRequest request, EditorTaskAgent agent, String outputText, String status, String errorMessage, Integer latencyMs, String requestId) {
    KnowledgeArticleOperationLog log = new KnowledgeArticleOperationLog();
    log.setUserId(userId);
    log.setArticleId(request.getArticleId());
    log.setRequestId(requestId);
    log.setOperationType("AI_GENERATE");
    log.setChangeMode("SNAPSHOT");
    log.setIntent(agent.intent());
    log.setEntryPoint(request.getEntryPoint());
    log.setInputText(buildInputText(request));
    log.setSelectedText(request.getSelectedText());
    log.setOutputText(outputText);
    log.setResultAction(agent.resultAction());
    log.setStatus(status);
    log.setErrorMessage(errorMessage);
    log.setLatencyMs(latencyMs);
    log.setCreatedAt(LocalDateTime.now());
    logMapper.insert(log);
  }

  /**
   * 把编辑器请求压缩成一个可审计的输入快照。
   *
   * <p>优先使用 JSON 结构保存关键字段，这样日志既便于机器分析，也便于人类排查；
   * 如果序列化失败，则退回到最基础的 action，保证日志流程不中断。
   */
  private String buildInputText(EditorAiExecuteRequest request) {
    try {
      return objectMapper.writeValueAsString(Map.of(
          "entryPoint", request.getEntryPoint(),
          "action", request.getAction(),
          "chatInput", request.getChatInput(),
          "surroundingContext", request.getSurroundingContext()));
    } catch (Exception e) {
      return request.getAction();
    }
  }

  /**
   * 判断当前编辑任务是否已被停止或串台。
   *
   * <p>一方面检查 Redis 停止标记，支持前端主动中断；另一方面检查活跃请求映射，
   * 防止同一文章下新的请求覆盖旧请求后，旧请求仍继续写回结果。
   */
  private boolean isStopped(Long articleId, String requestId) {
    return Boolean.TRUE.equals(redisTemplate.hasKey(stopKey(articleId, requestId)))
        || !requestId.equals(ACTIVE_REQUESTS.get(requestKey(articleId, requestId)));
  }

  /**
   * 清理活跃请求标记，释放当前文章请求的占用状态。
   *
   * <p>无论生成成功、停止还是异常退出，都应该尽量执行清理，避免残留状态影响后续请求。
   */
  private void cleanup(Long articleId, String requestId) {
    ACTIVE_REQUESTS.remove(requestKey(articleId, requestId));
  }

  /**
   * 生成活跃请求的本地键。
   *
   * <p>使用文章 ID + 请求 ID 的组合，可以把同一文章下不同生成任务区分开，
   * 同时也让停止和清理操作可以精确定位到某一次请求。
   */
  private String requestKey(Long articleId, String requestId) {
    return articleId + ":" + requestId;
  }

  /**
   * 生成 Redis 停止标记的键。
   *
   * <p>把停止状态和文章 + 请求绑定在一起，可以避免误伤其他并发任务，
   * 同时也方便设置短期过期时间，让停止状态自动失效。
   */
  private String stopKey(Long articleId, String requestId) {
    return STOP_KEY_PREFIX + articleId + ":" + requestId;
  }

  /**
   * 将任意映射序列化为 JSON。
   *
   * <p>这是给 SSE 事件使用的通用兜底方法；如果标准序列化失败，就退回到 `toString()`，
   * 保证事件不会因为辅助结构出错而中断主流程。
   */
  private String json(Map<String, Object> payload) {
    try {
      return objectMapper.writeValueAsString(payload);
    } catch (Exception e) {
      return payload.toString();
    }
  }
}
```


## 5. RAG 检索增强问答（BM25 + 向量混合召回 + 重排 + 来源回填）

### 入库流程
```java
@Override
public ApiResponse<Map<String, Object>> ingestArticle(Long articleId, Long userId) {
  // 1. 先校验文章归属，避免用户把别人的文章重新入库。
  KnowledgeArticle article = articleMapper.selectById(articleId);
  if (article == null || !Objects.equals(article.getUserId(), userId)) {
    return ApiResponse.error("文章不存在或无权操作");
  }

  // 2. 重新入库前先清理旧 chunk，确保同一文章只保留一份最新切块结果。
  chunkMapper.deleteByArticleId(articleId);
  List<ArticleChunkPiece> pieces = splitContent(article.getContent());
  List<String> embeddingIds = new ArrayList<>();

  // 3. 将文章按语义/结构切分为多个 chunk，并为每个 chunk 生成稳定的 embeddingId。
  for (int i = 0; i < pieces.size(); i++) {
    ArticleChunkPiece piece = pieces.get(i);
    String embeddingId = buildEmbeddingId(articleId, i, piece.text());
    KnowledgeArticleChunk chunk = new KnowledgeArticleChunk();
    chunk.setArticleId(articleId);
    chunk.setChunkIndex(i + 1);
    chunk.setChunkText(piece.text());
    chunk.setChunkSummary(piece.summary());
    chunk.setEmbeddingId(embeddingId);
    chunk.setCreatedAt(LocalDateTime.now());
    chunkMapper.insert(chunk);
    // 4. 同步把 chunk 的向量、元数据写入 Redis，供后续召回和排序直接使用。
    persistVector(articleId, embeddingId, piece.text(), chunk);
    embeddingIds.add(embeddingId);
  }

  // 5. 返回入库统计信息，便于前端或调用方展示结果。
  Map<String, Object> data = new HashMap<>();
  data.put("articleId", articleId);
  data.put("chunkCount", pieces.size());
  data.put("embeddingIds", embeddingIds);
  return ApiResponse.success("入库成功", data);
}

private String buildEmbeddingId(Long articleId, int index, String chunkText) {
  return articleId + "-" + (index + 1) + "-" + hash(chunkText);
}

private String hash(String text) {
  try {
    MessageDigest digest = MessageDigest.getInstance("SHA-256");
    byte[] hashed = digest.digest(text.getBytes(StandardCharsets.UTF_8));
    return Base64.getUrlEncoder().withoutPadding().encodeToString(hashed).substring(0, 16);
  } catch (Exception ex) {
    return Integer.toHexString(text.hashCode());
  }
}
```

### 检索主流程
```java
@Override
public ApiResponse<List<KnowledgeChunkSearchResponse>> searchChunksAdvanced(Long userId, String query, Long articleId, Integer topK, boolean useDiagnostics) {
  // 统一处理 topK 默认值，避免调用方传入 null 或非正数时引发异常。
  int limit = topK == null || topK <= 0 ? DEFAULT_TOP_K : topK;
  if (!StringUtils.hasText(query)) {
    return ApiResponse.error("query 不能为空");
  }

  // 先解析可检索的文章范围：指定文章时只查单篇，否则查当前用户的全部可见文章。
  List<Long> targetArticleIds = resolveTargetArticleIds(userId, articleId);
  if (targetArticleIds.isEmpty()) {
    log.info("RAG search no target articles, userId={}, articleId={}, query={}", userId, articleId, query);
    return ApiResponse.success("查询成功", List.of());
  }

  // 召回阶段同时使用向量、关键词和 BM25，尽量扩大候选集合。
  List<KnowledgeChunkSearchResponse> result = new ArrayList<>();
  for (Long targetArticleId : targetArticleIds) {
    result.addAll(searchByArticle(targetArticleId, query, limit));
    result.addAll(bm25Service.search(query, targetArticleId, userId, Math.max(limit, RE_RANK_TOP_K)));
  }

  // 去重、冲突消解、过滤低分候选后，再进行最终重排。
  result = conflictResolver.resolve(query, deduplicateByChunkId(result));
  result.removeIf(item -> item.getScore() == null || item.getScore() < MIN_RELEVANCE_SCORE);
  result.sort((a, b) -> Double.compare(b.getScore(), a.getScore()));
  List<KnowledgeChunkSearchResponse> reranked = rerankService.rerank(query, result, RE_RANK_FINAL_TOP_K);
  return ApiResponse.success("查询成功", reranked.stream().limit(limit).toList());
}
```

#### 单篇文章内的混合召回
```java
private List<KnowledgeChunkSearchResponse> searchByArticle(Long articleId, String query, int limit) {
  // 先扩大召回范围，再通过后续重排压缩结果，提升召回率。
  int recallLimit = Math.max(limit, limit * HYBRID_RECALL_MULTIPLIER);
  List<String> vectorCandidates = searchVectorKeys(articleId, query, recallLimit);
  List<String> keywordCandidates = searchKeywordKeys(articleId, query, recallLimit);
  List<String> merged = mergeCandidates(vectorCandidates, keywordCandidates);
  List<KnowledgeChunkSearchResponse> result = new ArrayList<>();
  for (String key : merged) {
    String id = key.substring(RAG_VECTOR_KEY_PREFIX.length());
    KnowledgeArticleChunk chunk = chunkMapper.selectByEmbeddingId(id);
    if (chunk == null || !Objects.equals(chunk.getArticleId(), articleId)) {
      continue;
    }
    double vectorScore = similarity(query, chunk.getChunkText());
    double keywordScore = keywordScore(query, chunk.getChunkText());
    double hybridScore = VECTOR_WEIGHT * vectorScore + KEYWORD_WEIGHT * keywordScore;
    result.add(new KnowledgeChunkSearchResponse(
        chunk.getId(),
        chunk.getArticleId(),
        chunk.getChunkIndex(),
        chunk.getChunkText(),
        chunk.getChunkSummary(),
        chunk.getEmbeddingId(),
        hybridScore));
  }
  return result;
}
```

#### 标准 BM25 检索
```java
@Service
@RequiredArgsConstructor
public class KnowledgeBM25ServiceImpl implements KnowledgeBM25Service {
  // BM25 的核心参数：K1 控制词频增长的饱和速度，数值越大，词频对结果的影响越明显。
  private static final double K1 = 1.2d;
  
  // BM25 的核心参数：B 用于调节文档长度归一化的强度，越接近 1 越强调长文档惩罚。
  private static final double B = 0.75d;
  
  // 分词后的最小有效长度，过滤掉过短、噪声较大的 token。
  private static final int MIN_TOKEN_LENGTH = 2;

  private final KnowledgeArticleMapper articleMapper;
  private final KnowledgeArticleChunkMapper chunkMapper;

  @Override
  public List<KnowledgeChunkSearchResponse> search(String query, Long articleId, Long userId, int limit) {
    // 查询内容为空或返回数量非法时，直接返回空结果。
    if (!StringUtils.hasText(query) || limit <= 0) {
      return List.of();
    }

    // 先解析本次检索需要限定到哪些文章范围：指定 articleId 时，只查这篇文章；未指定时，默认查当前用户下的所有未删除文章。
    List<Long> targetArticleIds = resolveTargetArticleIds(articleId, userId);
    if (targetArticleIds.isEmpty()) {
      return List.of();
    }

    // 按文章拉取 chunk，并合并成一个候选集合。
    List<KnowledgeArticleChunk> chunks = new ArrayList<>();
    for (Long targetArticleId : targetArticleIds) {
      List<KnowledgeArticleChunk> articleChunks = chunkMapper.selectByArticleIdOrderByChunkIndex(targetArticleId);
      if (articleChunks != null) {
        chunks.addAll(articleChunks);
      }
    }
    if (chunks.isEmpty()) {
      return List.of();
    }

    // 将用户查询标准化为 token 列表，后续只对这些关键词进行 BM25 计算。
    List<String> queryTokens = tokenize(query);
    if (queryTokens.isEmpty()) {
      return List.of();
    }

    // 统计每个 token 的文档频次（document frequency），以及每个 chunk 的长度，
    // 这些都是 BM25 公式计算所需的基础数据。
    Map<String, Integer> docFreq = new HashMap<>();
    Map<Long, Integer> docLength = new HashMap<>();
    int totalLength = 0;
    for (KnowledgeArticleChunk chunk : chunks) {
      String text = fullText(chunk);
      List<String> tokens = tokenize(text);
      docLength.put(chunk.getId(), tokens.size());
      totalLength += tokens.size();

      // 一个 chunk 中同一个 token 只需要计入一次文档频次，因此这里先去重再累加。
      LinkedHashSet<String> uniqueTokens = new LinkedHashSet<>(tokens);
      for (String token : uniqueTokens) {
        docFreq.merge(token, 1, Integer::sum);
      }
    }

    // 计算所有候选 chunk 的平均长度，供 BM25 做长度归一化。
    double avgDocLength = chunks.isEmpty() ? 0d : (double) totalLength / (double) chunks.size();
    List<KnowledgeChunkSearchResponse> results = new ArrayList<>();
    for (KnowledgeArticleChunk chunk : chunks) {
      String text = fullText(chunk);

      // 对每个 chunk 逐个计算 BM25 分数，分数越高表示与查询越相关。
      double score = bm25(queryTokens, text, chunks.size(), avgDocLength, docFreq, docLength.getOrDefault(chunk.getId(), 0));
      results.add(new KnowledgeChunkSearchResponse(
          chunk.getId(),
          chunk.getArticleId(),
          chunk.getChunkIndex(),
          chunk.getChunkText(),
          chunk.getChunkSummary(),
          chunk.getEmbeddingId(),
          score));
    }

    // BM25 只保留有意义的匹配结果，避免返回 0 分噪声项。
    results.removeIf(item -> item.getScore() == null || item.getScore() <= 0d);
    // 按相关性分数从高到低排序，方便上层直接取前 N 条。
    results.sort(Comparator.comparingDouble(KnowledgeChunkSearchResponse::getScore).reversed());
    return results.stream().limit(limit).toList();
  }

  /**
   * 解析检索目标文章 ID。
   *
   * 优先级：
   * 1. 传入 articleId 时，仅允许当前用户访问该文章；
   * 2. 未传入 articleId 时，查询当前用户下的全部可检索文章。
   */
  private List<Long> resolveTargetArticleIds(Long articleId, Long userId) {
    if (articleId != null) {
      KnowledgeArticle article = articleMapper.selectById(articleId);
      // 文章不存在、归属不匹配、或文章处于删除/禁用状态时，都不允许继续检索。
      if (article == null || !Objects.equals(article.getUserId(), userId) || Objects.equals(article.getStatus(), 1)) {
        return List.of();
      }
      return List.of(articleId);
    }

    // 未指定文章时，返回当前用户所有未删除文章的 ID。
    return articleMapper.selectByUserId(userId).stream()
        .filter(article -> !Objects.equals(article.getStatus(), 1))
        .map(KnowledgeArticle::getId)
        .toList();
  }

  /**
   * 计算单个 chunk 相对于查询词的 BM25 相关性得分。
   *
   * 这里使用的是标准 BM25 公式：
   * - tf：词项在当前 chunk 中出现的频率；
   * - df：词项在全部候选 chunk 中出现的文档数；
   * - docLength：当前 chunk 的长度；
   * - avgDocLength：候选 chunk 的平均长度。
   */
  private double bm25(List<String> queryTokens, String text, int docCount, double avgDocLength, Map<String, Integer> docFreq, int docLength) {
    if (!StringUtils.hasText(text) || docCount <= 0 || avgDocLength <= 0d) {
      return 0d;
    }

    // 统计当前 chunk 内每个 token 的出现次数，后续直接按词频累加 BM25 分数。
    List<String> docTokens = tokenize(text);
    Map<String, Integer> termFreq = new HashMap<>();
    for (String token : docTokens) {
      termFreq.merge(token, 1, Integer::sum);
    }

    double score = 0d;
    for (String token : queryTokens) {
      Integer tf = termFreq.get(token);
      Integer df = docFreq.get(token);
      if (tf == null || df == null || df <= 0) {
        continue;
      }

      // idf 越大，说明该词越“稀有”，对区分结果的贡献越高。
      double idf = Math.log(1d + ((docCount - df + 0.5d) / (df + 0.5d)));
      double numerator = tf * (K1 + 1d);
      // 长文本会被适当归一化，避免仅凭内容更长就天然获得更高分。
      double denominator = tf + K1 * (1d - B + B * (docLength / avgDocLength));
      score += idf * (numerator / denominator);
    }
    return score;
  }

  /**
   * 将输入文本标准化为 token 列表。
   *
   * 处理流程：
   * 1. 全部转小写，统一英文大小写差异；
   * 2. 将非字母数字字符替换为空格；
   * 3. 按空白切分；
   * 4. 过滤过短 token，减少噪声。
   */
  private List<String> tokenize(String value) {
    if (!StringUtils.hasText(value)) {
      return List.of();
    }
    String normalized = value.toLowerCase(Locale.ROOT).replaceAll("[^\\p{L}\\p{N}]+", " ").trim();
    if (!StringUtils.hasText(normalized)) {
      return List.of();
    }
    String[] parts = normalized.split("\\s+");
    List<String> tokens = new ArrayList<>();
    for (String part : parts) {
      if (part.length() >= MIN_TOKEN_LENGTH) {
        tokens.add(part);
      }
    }
    return tokens;
  }

  /**
   * 拼接 chunk 的可检索正文。
   *
   * 这里优先把摘要和正文一起参与 BM25 评分，
   * 这样即使正文较长，也能利用摘要提升召回效果。
   */
  private String fullText(KnowledgeArticleChunk chunk) {
    if (chunk == null) {
      return "";
    }
    return (StringUtils.hasText(chunk.getChunkSummary()) ? chunk.getChunkSummary() + " " : "") + (chunk.getChunkText() == null ? "" : chunk.getChunkText());
  }
}
```

### 消除冲突
```java
@Service
@RequiredArgsConstructor
public class KnowledgeConflictResolverImpl implements KnowledgeConflictResolver {
  @Override
  public List<KnowledgeChunkSearchResponse> resolve(String query, List<KnowledgeChunkSearchResponse> candidates) {
    // 没有候选片段时，直接返回空列表，避免后续去重逻辑执行无效遍历。
    if (candidates == null || candidates.isEmpty()) {
      return List.of();
    }
    Map<Long, KnowledgeChunkSearchResponse> bestByChunkId = new HashMap<>();
    for (KnowledgeChunkSearchResponse candidate : candidates) {
      if (candidate == null || candidate.getChunkId() == null) {
        continue;
      }
      // 同一个 chunk 可能来自多个召回源，保留综合分更高的那个版本。
      KnowledgeChunkSearchResponse existing = bestByChunkId.get(candidate.getChunkId());
      if (existing == null || compareCandidate(query, candidate, existing) > 0) {
        bestByChunkId.put(candidate.getChunkId(), candidate);
      }
    }
    return new ArrayList<>(bestByChunkId.values()).stream()
        // 去重后按原始召回分数排序，保证输出结果仍然稳定可解释。
        .sorted(Comparator.comparingDouble((KnowledgeChunkSearchResponse item) -> item.getScore() == null ? 0d : item.getScore()).reversed())
        .toList();
  }

  private int compareCandidate(String query, KnowledgeChunkSearchResponse left, KnowledgeChunkSearchResponse right) {
    double leftScore = adjustedScore(query, left);
    double rightScore = adjustedScore(query, right);
    return Double.compare(leftScore, rightScore);
  }

  private double adjustedScore(String query, KnowledgeChunkSearchResponse candidate) {
    // 冲突消解时优先使用基础分，再叠加摘要与问题的轻量文本重合度。
    double base = candidate.getScore() == null ? 0d : candidate.getScore();
    double summaryBoost = StringUtils.hasText(candidate.getChunkSummary()) && StringUtils.hasText(query)
        ? overlap(query, candidate.getChunkSummary()) * 0.05d
        : 0d;
    return base + summaryBoost;
  }

  private double overlap(String query, String text) {
    if (!StringUtils.hasText(query) || !StringUtils.hasText(text)) {
      return 0d;
    }
    String[] queryParts = query.toLowerCase().split("\\s+");
    int hit = 0;
    for (String part : queryParts) {
      // 同样过滤过短 token，降低噪声词导致的误判。
      if (part.length() >= 2 && text.toLowerCase().contains(part)) {
        hit++;
      }
    }
    return queryParts.length == 0 ? 0d : (double) hit / (double) queryParts.length;
  }
}
```

### 重排
```java
@Service
@RequiredArgsConstructor
public class KnowledgeRerankServiceImpl implements KnowledgeRerankService {
  @Override
  public List<KnowledgeChunkSearchResponse> rerank(String query, List<KnowledgeChunkSearchResponse> candidates, int limit) {
    // 候选集为空或无需返回时，直接给出空结果，避免后续排序和打分开销。
    if (candidates == null || candidates.isEmpty() || limit <= 0) {
      return List.of();
    }
    List<KnowledgeChunkSearchResponse> sorted = new ArrayList<>(candidates);
    // 按综合得分从高到低排序，保留更适合大模型上下文的证据片段。
    sorted.sort(Comparator.comparingDouble((KnowledgeChunkSearchResponse item) -> score(query, item)).reversed());
    return sorted.stream().limit(limit).toList();
  }

  private double score(String query, KnowledgeChunkSearchResponse chunk) {
    // 基础分来自召回阶段，文本和摘要命中用于补充重排权重。
    double base = chunk.getScore() == null ? 0d : chunk.getScore();
    double textScore = StringUtils.hasText(chunk.getChunkText()) ? lexical(query, chunk.getChunkText()) : 0d;
    double summaryScore = StringUtils.hasText(chunk.getChunkSummary()) ? lexical(query, chunk.getChunkSummary()) * 0.25d : 0d;
    return base * 0.6d + textScore * 0.3d + summaryScore * 0.1d;
  }

  private double lexical(String query, String text) {
    if (!StringUtils.hasText(query) || !StringUtils.hasText(text)) {
      return 0d;
    }
    String normalizedQuery = query.toLowerCase();
    String normalizedText = text.toLowerCase();
    String[] parts = normalizedQuery.split("\\s+");
    int hit = 0;
    for (String part : parts) {
      // 过滤过短词，减少停用词或无意义 token 对排序的干扰。
      if (part.length() >= 2 && normalizedText.contains(part)) {
        hit++;
      }
    }
    return parts.length == 0 ? 0d : (double) hit / (double) parts.length;
  }
}
```

### 来源回填
```java
@Service
@RequiredArgsConstructor
public class SourceBackfillService {

  public String backfill(String answer, List<KnowledgeChunkSearchResponse> chunks) {
    if (!org.springframework.util.StringUtils.hasText(answer) || chunks == null || chunks.isEmpty()) {
      return answer;
    }

    Map<String, Integer> citationMap = buildCitationMap(chunks);
    String enriched = appendCitationMarkers(answer, citationMap);
    return appendReferences(enriched, chunks, citationMap);
  }

  private Map<String, Integer> buildCitationMap(List<KnowledgeChunkSearchResponse> chunks) {
    Map<String, Integer> citationMap = new LinkedHashMap<>();
    int index = 1;
    for (KnowledgeChunkSearchResponse chunk : chunks) {
      if (chunk == null || chunk.getChunkId() == null) {
        continue;
      }
      String key = String.valueOf(chunk.getChunkId());
      if (!citationMap.containsKey(key)) {
        citationMap.put(key, index++);
      }
    }
    return citationMap;
  }

  private String appendCitationMarkers(String answer, Map<String, Integer> citationMap) {
    String result = answer;
    for (Map.Entry<String, Integer> entry : citationMap.entrySet()) {
      // 这里可结合句子级对齐结果，把每个结论句后面补上对应引用编号。
      result = result.replace("{{cite_" + entry.getKey() + "}}", "[" + entry.getValue() + "]");
    }
    return result;
  }

  private String appendReferences(String answer, List<KnowledgeChunkSearchResponse> chunks, Map<String, Integer> citationMap) {
    StringBuilder builder = new StringBuilder(answer).append("\n\n参考来源\n");
    for (KnowledgeChunkSearchResponse chunk : chunks) {
      if (chunk == null || chunk.getChunkId() == null) {
        continue;
      }
      Integer citationId = citationMap.get(String.valueOf(chunk.getChunkId()));
      if (citationId == null) {
        continue;
      }
      builder.append('[').append(citationId).append("] ")
          .append(chunk.getChunkTitle() == null ? "未命名分片" : chunk.getChunkTitle())
          .append(" / chunkId=").append(chunk.getChunkId());
      if (org.springframework.util.StringUtils.hasText(chunk.getChunkSummary())) {
        builder.append(" / ").append(chunk.getChunkSummary());
      }
      builder.append('\n');
    }
    return builder.toString();
  }
}
```

## 6. 文档内 AI 辅助创作（多智能体编排 + Reflection Loop）
这部分的核心不是“让模型一次性写完”，而是把复杂任务拆成一条清晰的链路：
先做复杂度判断，再决定走 Fast 还是 Swarm；
Swarm 里由 Planner 拆任务、Worker 并行执行、Critic 做校验、Merger 做聚合，最后用 Reflection Loop 把容易出错的地方再修一轮。

前端拿到的也不只是纯文本，而是一份结构化结果，里面会带上替换位置、插入内容、Mermaid 块等信息，方便直接回填到编辑器里。

### 编排入口
```java
@Service
@RequiredArgsConstructor
public class AiWritingOrchestratorService {

  private final ComplexityScorer complexityScorer;
  private final PlannerAgent plannerAgent;
  private final WorkerAgent workerAgent;
  private final CriticAgent criticAgent;
  private final MergerAgent mergerAgent;
  private final ResponseAssembler responseAssembler;

  public AiWritingResult handle(AiWritingRequest request) {
    // 1. 空请求直接返回空结果，避免后面所有 Agent 都做无意义工作。
    if (request == null || !org.springframework.util.StringUtils.hasText(request.getContent())) {
      return AiWritingResult.empty();
    }

    // 2. 先做复杂度打分，低复杂度任务直接走 Fast 通道，减少编排开销和模型调用成本。
    int complexity = complexityScorer.score(request);
    if (complexity <= 3) {
      return handleFastPath(request);
    }

    // 3. 复杂任务进入 Swarm：先规划，再并行执行，再统一聚合。
    return handleSwarmPath(request);
  }

  private AiWritingResult handleFastPath(AiWritingRequest request) {
    // Fast 通道只需要一个 Worker，适合翻译、轻量润色、短文本摘要等低复杂度场景。
    String content = workerAgent.execute(request);
    return responseAssembler.assemble(request, content, "FAST", List.of(), new SharedWorkspace());
  }

  private AiWritingResult handleSwarmPath(AiWritingRequest request) {
    // Planner 先把任务拆成 DAG，节点之间的依赖关系会决定执行顺序。
    TaskPlan plan = plannerAgent.plan(request);

    // SharedWorkspace 就是黑板模式里的“共享工作区”：
    // 每个 Agent 都可以写入中间结果，但不直接互相通信，避免链路耦合。
    SharedWorkspace workspace = new SharedWorkspace(plan.getRequestId());
    workspace.put("request.content", request.getContent(), "ingest");

    // 按 DAG 顺序执行子任务。真正的实现里可以把“互不依赖”的节点并行化。
    for (TaskNode node : plan.getNodes()) {
      String partial = workerAgent.execute(node, workspace);
      workspace.put(node.getWorkspaceKey(), partial, node.getAgentName());
    }

    // Merger 负责把分散的中间结果拼成一个可交付的初稿。
    String merged = mergerAgent.merge(workspace);

    // Critic + Reflection Loop：先检查，再修正，直到通过或者达到阈值。
    String reflected = reflectUntilPass(request, merged, workspace, plan);

    // 最后把文本和结构化 patch 一起返回，前端才能知道“改哪儿、怎么改”。
    return responseAssembler.assemble(request, reflected, "SWARM", plan.getPatchHints(), workspace);
  }

  private String reflectUntilPass(AiWritingRequest request, String draft, SharedWorkspace workspace, TaskPlan plan) {
    String current = draft;
    int maxRounds = determineMaxRounds(request, plan);
    String previousSignature = "";

    for (int round = 0; round < maxRounds; round++) {
      CriticResult criticResult = criticAgent.review(request, current, workspace);

      // 1. 通过就直接返回，避免不必要的反复加工。
      if (criticResult.isPass()) {
        return current;
      }

      // 2. 如果连续两轮问题类型没变化、文本也没有明显改善，就提前停掉，避免死循环。
      String currentSignature = criticResult.signature();
      if (currentSignature.equals(previousSignature) && round > 0) {
        break;
      }
      previousSignature = currentSignature;

      // 3. Worker 根据 Critic 的问题清单做局部修正，而不是重写整篇内容。
      current = workerAgent.revise(request, current, criticResult.getIssues(), workspace);
    }

    // 达到阈值后停止反思，避免无效循环。
    return current;
  }

  private int determineMaxRounds(AiWritingRequest request, TaskPlan plan) {
    // Mermaid / 结构化输出对语法非常敏感，所以允许多一轮检查。
    if (request.getTaskType() == AiWritingTaskType.MERMAID) {
      return 3;
    }

    // 长文总结通常要做两轮以内的修正，平衡质量和时延。
    if (request.getTaskType() == AiWritingTaskType.SUMMARY) {
      return 2;
    }

    // 其它任务默认只做一轮反思，控制成本。
    return plan.requiresStrictValidation() ? 2 : 1;
  }
}
```

### 核心支撑对象
```java
/**
 * 复杂度打分器：先判断任务适不适合走 Fast，避免所有请求都进入多智能体编排。
 */
public interface ComplexityScorer {
  int score(AiWritingRequest request);
}

/**
 * 规划器：把复杂任务拆成多个可并行执行的子任务，形成任务 DAG。
 */
public interface PlannerAgent {
  TaskPlan plan(AiWritingRequest request);
}

/**
 * Worker：负责执行翻译、润色、总结、Mermaid 生成等具体子任务。
 * 在 Swarm 模式里，Worker 不直接修改最终结果，而是先把中间结果写回共享工作区。
 */
public interface WorkerAgent {
  String execute(AiWritingRequest request);
  String execute(TaskNode node, SharedWorkspace workspace);
  String revise(AiWritingRequest request, String draft, List<String> issues, SharedWorkspace workspace);
}

/**
 * Critic：负责检查内容是否偏题、格式是否正确、引用是否合法。
 * 这里给它加一个 signature，方便做“有没有实质变化”的收敛判断。
 */
public interface CriticAgent {
  CriticResult review(AiWritingRequest request, String draft, SharedWorkspace workspace);
}

/**
 * Merger：负责把多个 Worker 的中间结果聚合成最终可交付内容。
 */
public interface MergerAgent {
  String merge(SharedWorkspace workspace);
}

/**
 * ResponseAssembler：把最终文本包装成前端可执行的结构化协议。
 * 前端拿到这个结果后，不只是能展示，还能直接知道要替换哪个区间、是否是 Mermaid、有没有引用信息。
 */
public interface ResponseAssembler {
  AiWritingResult assemble(
      AiWritingRequest request,
      String content,
      String mode,
      List<DocumentPatch> patchHints,
      SharedWorkspace workspace
  );
}

/**
 * SharedWorkspace：黑板模式里的共享工作区。
 * 这里不只是一个 String Map，而是带版本号、来源、更新时间的可追踪数据结构，
 * 这样不同 Agent 写入时就能做冲突定位，也方便后续审计和回放。
 */
public class SharedWorkspace {
  private final String requestId;
  private final Map<String, WorkspaceCell> data = new java.util.concurrent.ConcurrentHashMap<>();
  private final java.util.concurrent.atomic.AtomicLong version = new java.util.concurrent.atomic.AtomicLong(0);

  public SharedWorkspace(String requestId) {
    this.requestId = requestId;
  }

  public String getRequestId() {
    return requestId;
  }

  public long put(String key, String value, String producer) {
    if (!org.springframework.util.StringUtils.hasText(key)) {
      return version.get();
    }
    long nextVersion = version.incrementAndGet();
    data.put(key, new WorkspaceCell(
        value == null ? "" : value,
        nextVersion,
        producer == null ? "unknown" : producer,
        java.time.Instant.now()
    ));
    return nextVersion;
  }

  public java.util.Optional<WorkspaceCell> get(String key) {
    return java.util.Optional.ofNullable(data.get(key));
  }

  public Map<String, WorkspaceCell> snapshot() {
    return java.util.Collections.unmodifiableMap(data);
  }
}

/**
 * 工作区里的单个数据格。
 * 版本号和 producer 这两个字段很关键：前者用于判断最新写入，后者用于定位是谁产出的中间结果。
 */
public record WorkspaceCell(
    String value,
    long version,
    String producer,
    java.time.Instant updatedAt
) {}

/**
 * 任务计划：规划器拆出来的结果。
 * nodes 表示子任务列表，patchHints 给前端提供回填建议，strictValidation 用来控制反思阈值。
 */
public class TaskPlan {
  private String requestId;
  private List<TaskNode> nodes = List.of();
  private List<DocumentPatch> patchHints = List.of();
  private boolean strictValidation;

  public String getRequestId() {
    return requestId == null ? java.util.UUID.randomUUID().toString() : requestId;
  }

  public List<TaskNode> getNodes() {
    return nodes == null ? List.of() : nodes;
  }

  public List<DocumentPatch> getPatchHints() {
    return patchHints == null ? List.of() : patchHints;
  }

  public boolean requiresStrictValidation() {
    return strictValidation;
  }
}

/**
 * 任务节点：用于描述子任务、依赖关系和目标类型。
 * 这里把 workspaceKey 一并带上，是为了明确每个 Worker 的结果写到哪里。
 */
public class TaskNode {
  private String taskId;
  private String workspaceKey;
  private String prompt;
  private AiWritingTaskType taskType;
  private List<String> dependsOn = List.of();
  private String agentName;

  public String getTaskId() {
    return taskId;
  }

  public String getWorkspaceKey() {
    return org.springframework.util.StringUtils.hasText(workspaceKey) ? workspaceKey : taskId;
  }

  public AiWritingTaskType getTaskType() {
    return taskType;
  }

  public List<String> getDependsOn() {
    return dependsOn == null ? List.of() : dependsOn;
  }

  public String getAgentName() {
    return org.springframework.util.StringUtils.hasText(agentName) ? agentName : "worker";
  }
}

/**
 * 反思结果：Critic 告诉 Worker 哪些地方需要修正。
 * signature 用来做收敛判断，避免同样的问题一直重复出现。
 */
public class CriticResult {
  private boolean pass;
  private List<String> issues;
  private String signature;

  public boolean isPass() {
    return pass;
  }

  public List<String> getIssues() {
    return issues == null ? List.of() : issues;
  }

  public String signature() {
    if (org.springframework.util.StringUtils.hasText(signature)) {
      return signature;
    }
    return String.join("|", getIssues());
  }
}

/**
 * 面向编辑器的结构化输出。
 * 不是只返回一段文本，而是返回“文本 + 操作建议”，这样前端才能知道该插入、替换还是生成 Mermaid。
 */
public class AiWritingResult {
  private final String content;
  private final String mode;
  private final List<DocumentPatch> patches;

  private AiWritingResult(String content, String mode, List<DocumentPatch> patches) {
    this.content = content;
    this.mode = mode;
    this.patches = patches == null ? List.of() : patches;
  }

  public static AiWritingResult empty() {
    return new AiWritingResult("", "EMPTY", List.of());
  }

  public static AiWritingResult success(String content, String mode) {
    return new AiWritingResult(content, mode, List.of());
  }

  public static AiWritingResult success(String content, String mode, List<DocumentPatch> patches) {
    return new AiWritingResult(content, mode, patches);
  }

  public String getContent() {
    return content;
  }

  public String getMode() {
    return mode;
  }

  public List<DocumentPatch> getPatches() {
    return patches;
  }
}

/**
 * 前端可以直接消费的编辑指令。
 * 比如：替换某个区间、插入一段内容、或者把这段内容当成 Mermaid 代码块渲染。
 */
public class DocumentPatch {
  private PatchType type;
  private int startOffset;
  private int endOffset;
  private String content;
  private Map<String, Object> meta = Map.of();

  public PatchType getType() {
    return type;
  }

  public int getStartOffset() {
    return startOffset;
  }

  public int getEndOffset() {
    return endOffset;
  }

  public String getContent() {
    return content;
  }

  public Map<String, Object> getMeta() {
    return meta == null ? Map.of() : meta;
  }
}

public enum PatchType {
  INSERT,
  REPLACE,
  APPEND,
  MERMAID
}

public enum AiWritingTaskType {
  TRANSLATE,
  POLISH,
  SUMMARY,
  MERMAID,
  REWRITE
}

public class AiWritingRequest {
  private String content;
  private String title;
  private AiWritingTaskType taskType;
  private boolean needKnowledgeBase;
  private String documentId;
  private String userId;
  private Integer maxReflectionRounds;

  public String getContent() {
    return content;
  }

  public String getTitle() {
    return title;
  }

  public AiWritingTaskType getTaskType() {
    return taskType == null ? AiWritingTaskType.POLISH : taskType;
  }

  public boolean isNeedKnowledgeBase() {
    return needKnowledgeBase;
  }

  public int getMaxReflectionRoundsOrDefault(int fallback) {
    return maxReflectionRounds == null ? fallback : Math.max(1, maxReflectionRounds);
  }
}
```
