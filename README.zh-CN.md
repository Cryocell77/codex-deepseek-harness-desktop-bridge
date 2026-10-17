# DSH Desktop MCP Bridge

[English](README.md) · [官方源码核实](docs/UPSTREAM-AUDIT.md) · [安全说明](SECURITY.md) · [验证记录](docs/VALIDATION.md)

一套**非官方、主动启用**的 TypeScript MCP Bridge，让 Codex Desktop/CLI 把任务委派给**已经运行的官方 DeepSeek Harness Desktop**。桥接不会启动 `dsh`、独立 CLI Agent、Web 实例或另一套 Harness Runtime；Codex 仅启动 MCP stdio 服务进程。

**状态：实验性 v0.1。** 适配器针对本机已安装的 macOS 官方 **`0.2.0-rc.2`**。审查时官方主分支已经是 `0.2.1-rc.1`，不能因此声称兼容新版本。其他核心版本会被明确拒绝。已准备自动化测试；**尚未在用户的真实 Desktop 中安装激活插件，也未执行付费/真实模型任务**。实际测试结果见[验证记录](docs/VALIDATION.md)。

## 连接机制与边界

```text
Codex Desktop / CLI
  → MCP stdio 服务
  → Unix socket + 桥接自己的本地认证令牌
  → 当前 Desktop Host 内的 Cordis 插件
  → 官方 Agent/Preset 服务
  → 当前模型配置、Skills、获准 Tools
  → 独立会话与独立目录/worktree
```

官方 Desktop 的本地 Host 具有应用专用认证流程；审查的文档和源码未提供外部 MCP 配对/直接接入协议。本项目使用官方插件机制与公开服务方法；**socket 协议属于本项目，不是假称存在的官方 MCP API**。不会提取桌面认证 cookie、启动密钥、模型 API Key 或账户凭据。

## 构建

需要 macOS、官方 DSH Desktop `0.2.0-rc.2`、Node >=22.19、npm；仓库隔离还需要 Git。Linux 可以测试本地传输，但不宣称官方 Linux Desktop 兼容；暂不支持 Windows named pipe。

```sh
npm ci
npm run check
npm pack
```

未发布到 npm/GitHub。`dist/` 是构建产物；`npm pack` 生成可本地安装的压缩包。开发依赖中的官方 DSH 包仅用于类型检查与测试，不会启动 DSH。测试均无需模型密钥。

## macOS 安装与连接

### 1. 生成私有配置

选择两个**不存在**、父目录已经存在的绝对路径，替换示例里的用户名。使用真实规范路径，避免 `/var`→`/private/var` 等软链接别名。完整 socket 路径最多 100 个 UTF-8 字节。

```sh
node /absolute/path/to/bridge/dist/cli.js init \
  --state-dir /Users/you/.dsh-mcp-state \
  --workspace-root /Users/you/.dsh-mcp-work
```

配置与 token 权限为 0600；状态目录与任务根目录权限为 0700。初始化拒绝复用已有目录，也不会悄悄替换现有凭据。

### 2. 审查权限

编辑生成的 `config.json`。默认 `allowedTools: []` 表示允许模型对话，但**拒绝全部模型工具调用**。仅在核对工具真实权限后逐项填写工具名。

- `allowedPresets`：允许的已安装 Preset，默认 `standard`。
- `repositories`：允许创建 worktree 的 Git 顶层目录，必须是规范绝对路径。
- `workspaceRoot`：必须在所有源仓库之外。
- `maxSessions` / `maxTasks`：并发会话与保留任务的上限。
- `maxPromptBytes` / `maxOutputBytes`：输入、文本结果的字节限制。
- `taskTimeoutMs`：任务截止时间，超时请求协作取消。

配置在插件加载时读取；改动后需要重新加载插件/重启 Desktop。v0.1 拒绝 `run_code` 及已知委派、插件管理、调度、工作流、目标自治类工具；优先使用原生工具 Preset。**工具名白名单和独立工作目录不是操作系统沙箱。** 一旦允许 shell/通用文件工具，它们可能访问目录之外的文件。仓库 worktree 创建也可能执行该可信仓库的 Git checkout hook。

### 3. 配置 Desktop 插件

在 Desktop 的 Plugins 设置里把插件的 `configFile` 设为生成的完整路径；或者在 Desktop 会继承的登录 shell 环境中设置：

```sh
export DSH_DESKTOP_BRIDGE_CONFIG=/Users/you/.dsh-mcp-state/config.json
```

macOS Desktop 在应用启动时读取登录 shell 环境，因此之后需完全退出再打开。也可在 Desktop Profile 的 `cordis.patch.yml` 中增加：

```yaml
- id: desktop-mcp-bridge
  config:
    configFile: /Users/you/.dsh-mcp-state/config.json
```

官方 patch 对匹配行的整个 config 做替换。未提供明确配置路径时，插件保持关闭并输出本地诊断。

### 4. 安装到官方 Desktop

通过官方 Desktop 的 **Plugins** 页面安装本地归档/包路径。也可以先打开 Desktop 初始化一次 Profile，再**完全退出**，使用 **Desktop 自带的 `dsh` 命令**：

```sh
dsh plugin --profile desktop add /absolute/path/to/dsh-desktop-mcp-bridge-0.1.0.tgz
```

重新打开 Desktop 并确认插件真实激活。不要用 npm 单独安装的 CLI 修改 Desktop Profile，也不要通过 CLI 启动该 Profile；不要用版本豁免绕过兼容性检查。官方插件管理器决定激活/重启状态。本项目没有自动修改你的 Desktop 配置。

### 5. 验证连接

```sh
node /absolute/path/to/bridge/dist/cli.js doctor \
  --config /Users/you/.dsh-mcp-state/config.json
```

应返回 `runtime: "existing-desktop"`、协议号与适配版本。此操作不调用模型，不能证明模型凭据有效。

### 6. 配置 Codex Desktop / CLI

在 Codex 用户 `config.toml` 中添加，路径均换成真实绝对路径：

```toml
[mcp_servers.dsh_desktop]
command = "/absolute/path/to/node"
args = ["/absolute/path/to/bridge/dist/cli.js", "stdio", "--config", "/Users/you/.dsh-mcp-state/config.json"]
startup_timeout_sec = 10
tool_timeout_sec = 60
```

也可以通过 Codex CLI 注册：

```sh
codex mcp add dsh_desktop -- /absolute/path/to/node \
  /absolute/path/to/bridge/dist/cli.js stdio \
  --config /Users/you/.dsh-mcp-state/config.json
```

按当前 Codex 界面刷新/重连 MCP。桌面端未开启时，MCP 服务仍可启动，但工具调用会返回 `DESKTOP_UNAVAILABLE`。[官方 Codex MCP 文档](https://learn.chatgpt.com/docs/extend/mcp)。

## 使用流程

1. `dsh_connection_info` 检查连接与有效权限。
2. `dsh_create_session` 创建独立空目录，或从白名单仓库的指定 commit/ref 创建独立 detached worktree。
3. `dsh_submit_task` 提交任务，提供 UUID `requestId`，立即获得任务编号。
4. `dsh_get_task` 轮询；结束后 `dsh_get_result` 读取带可信度标签的有界文本。
5. 需要停止时 `dsh_cancel_task`，必须轮询至终态；完成后 `dsh_close_session`，文件保持原样供审查。
6. 同一空闲会话再次提交可继续对话；`dsh_list_sessions` 列出桥接会话；`dsh_forget_task` 释放已结束任务及其幂等键。

会话在创建时读取 **Desktop 的默认模型设置**，使用指定、获准的已安装 Preset。模型凭据和全局插件仍由现有 Host 管理；不会复制用户已有聊天、单会话模型覆盖、UI 状态或未发送文本。Skills 按 DSH 原有规则发现；新工作区没有的项目本地 Skills 不会自动出现，主仓库未提交/忽略的文件也不会复制。未授权的 Tools 仍可能对模型可见，但执行会被拒绝。

每个会话最多执行一个任务，不同会话可并行。取消不回滚副作用；不响应取消的工具会持续显示 `cancelling`，不会假称已经停止。只有实际结束后才报告 `cancelled` 或 `timed_out`。

重复请求使用**相同 `requestId` 与完全相同输入**，在任务保留期间只执行一次。忘记任务会释放该键。创建会话没有幂等键，响应不确定时先列出会话再决定是否重试。Desktop/插件重启会丢失桥接句柄和去重历史，不会自动重放提示；DSH 原有持久化配置可能仍保留自己的会话日志。

## 文件隔离与清理

每个会话使用 `workspaceRoot` 下独立 UUID 目录。Git 会话只复制指定提交的内容，主 checkout 的脏文件不带入；桥接不自动合并、提交或删除任务文件。worktree 共享 Git 对象库，因此解决常规文件冲突，不能阻止恶意跨目录访问。

关闭会话仍保留所有任务文件和失败创建留下的目录。先审查/归档结果，之后自行用 Git 常规 worktree remove 清理，空目录任务则自行删除。桥接没有能自动删除用户工作成果的清理工具。

## 限制与故障排查

- `UNSUPPORTED_VERSION`：版本不匹配，需要新增并测试适配器；不要绕过检查。
- `DESKTOP_UNAVAILABLE`：应用未开、插件未配置/未启用，或双方状态目录不一致。
- `ALREADY_RUNNING` / `STALE_SOCKET`：不要删除活跃锁。崩溃后先确认 Desktop/Host 完全退出，再只删除状态目录中的 `bridge.lock`、`bridge.sock`、`ready.json`，保留 token、配置和工作区。
- `UNSAFE_PATH`：检查所有者、权限与路径是否包含软链接；不要随意修改共享目录权限。
- `SESSION_BUSY`：先等待或取消当前任务。
- `CAPACITY`：关闭闲置会话或忘记已结束任务；不会自动丢弃未审查结果。
- `OUTCOME_UNKNOWN`：操作可能已经执行，先查询状态，不要盲目重放。
- 获准工具需要人工审批时继续走 DSH 原有流程，在 Desktop 中处理；本项目不提供自动同意工具。
- 当前只返回有界文本，不转发 reasoning、工具日志、媒体或二进制附件；取消后的部分文本可返回，超过限制会标记截断。返回内容属于不可信子 Agent 数据。
- 暂无持久任务恢复、远程访问、多用户隔离、Windows 传输、在线 token 轮换、热权限更新或任意附件转发。

## 开源准备

已提供 TypeScript 源码、锁文件、测试、CI、中英 README、MIT LICENSE、NOTICE、安全说明、贡献与发布检查表。发布流程为人工操作，需仓库所有者明确决定；没有自动发布 workflow，没有创建 GitHub 仓库或发布任何内容。

本项目原创代码使用 MIT。DSH 开源源码为 MIT；桌面应用二进制、模型服务、商标及第三方依赖各自受其条款约束。项目与 DeepSeek/OpenAI 无隶属或背书关系。
