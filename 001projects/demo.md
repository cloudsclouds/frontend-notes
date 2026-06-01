# BioNova AI 代码 Demo
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
