---
name: lightweight-requirement-workflow
description: Run a gated, resumable product-requirement workflow from discovery through document suite, SVG wireframes, offline clickable HTML prototype, self-review, and optional knowledge-base drafting. Use when users ask to start, continue, revise, complete, or review a product requirement, especially when every major artifact requires explicit confirmation before the next stage.
---

# 轻量需求撰写流程

把模糊想法推进成可评审的需求包。以文件和机器可读状态为准，不依赖对话记忆；每个关键阶段都等待用户明确确认。

## 工作区约定

默认输出：

```text
documents/product_requirements/{requirement_name}/
```

需求名使用英文 `snake_case`，正文可以使用中文。知识库默认位于 `documents/knowledge_base/`。

如果工作区尚未初始化，先说明将创建的目录，再运行：

```bash
node <skill-dir>/scripts/init-workspace.mjs --root <workspace-root>
```

新需求运行：

```bash
node <skill-dir>/scripts/init-requirement.mjs \
  --root <workspace-root> --name <requirement_name> --title <display_title>
```

不要覆盖已有文件。修改已有需求时，先读取当前状态和产物。

## 模式识别

| 用户意图 | 模式 |
| --- | --- |
| 开始、做一个新需求 | 新建：初始化后从上下文准备开始 |
| 继续、接着做 | 续做：先运行 `detect-stage.mjs` |
| 修改、增加、删除、调整 | 修改：先做影响分析并等待确认 |
| 跳过 SVG/HTML/知识库 | 跳过：记录决定后进入下一合法阶段 |
| 贴入会议纪要 | 整理：提炼共识、分歧、变更和待办，再进入摘要确认 |

## 状态与确认

需求目录中的 `.workflow/state.json` 是流程状态源，`decision_log.md` 是用户可读审计记录。不得仅因某个文件存在就假定用户已确认。

阶段顺序：

| 阶段 | 产物 | 进入下一阶段所需决定 |
| --- | --- | --- |
| 上下文准备 | 对话中的背景/相似需求摘要 | 无，继续需求探讨 |
| 需求探讨 | `requirement_summary.md` | `summary` confirmed |
| 文档套件 | `flowchart.md`、`prd.md`、`user_story.md`、`prototype.md`、`review.md` | `documents` confirmed |
| SVG 线框 | `prototypes/*.svg` | `wireframe` confirmed 或 skipped |
| 视觉方向 | `visual_direction.md` | `html_visual` confirmed；跳过 HTML 时可 skipped |
| HTML 原型 | `prototype_html/index.html` | `html` confirmed 或 skipped |
| 需求自检 | `self_review.md` | `self_review` confirmed |
| 知识库草案 | `knowledge_base_draft.md` | `knowledge_base_draft` confirmed 或 cancelled |
| 知识库回写 | 更新知识库文件 | `knowledge_base_write` confirmed；然后完成 |

只有用户明确确认后，才运行：

```bash
node <skill-dir>/scripts/record-gate.mjs \
  --requirement <requirement-dir> --gate <gate> --status confirmed --note <decision>
```

用户明确跳过时使用 `skipped`；跳过 HTML 时依次跳过 `html_visual` 和 `html`。明确取消知识库回写时使用 `cancelled`。不得代替用户确认。

## 执行流程

### 1. 准备上下文

读取存在的知识库文件，并搜索 `documents/product_requirements/` 中的相似需求。说明可复用、冲突和缺失信息。知识库为空时如实说明。

### 2. 探讨需求

完整读取 [discovery.md](references/discovery.md)。先探讨，不直接写 PRD。每轮聚焦一个维度，优先给出建议供用户修正。输出摘要后停止，等待确认。

### 3. 生成文档套件

仅在 `summary` 已确认后，完整读取 [document-suite.md](references/document-suite.md)。按依赖顺序生成五份文档，检查术语、功能编号、页面清单和交叉引用。完成后停止，等待确认。

### 4. 生成 SVG 线框

仅在 `documents` 已确认后，完整读取 [wireframe.md](references/wireframe.md)。SVG 用于结构校对，不代表最终视觉。完成后停止，等待确认。

### 5. 确认视觉并生成 HTML

SVG 确认后先询问视觉方向，不得硬猜。视觉方向确认后完整读取 [html-prototype.md](references/html-prototype.md)，生成离线可点击原型并进行桌面与移动端验证。完成后停止，等待确认。

### 6. 自检与修复

HTML 确认后完整读取 [self-review.md](references/self-review.md)。分别检查产品风险和产物一致性。FAIL 必须修复并重检；WARN 交给用户决定。修复循环最多三轮。报告确认后再处理知识库。

### 7. 知识库草案与回写

完整读取 [knowledge-base.md](references/knowledge-base.md)。只先生成草案。只有用户再次明确确认草案后才能修改知识库。用户说“不需要回写”时记录 `cancelled` 并结束，不再追问。

## 修改已有需求

1. 运行 `detect-stage.mjs` 并重新读取相关文件。
2. 列出变更影响的文档、SVG、HTML、自检和知识库草案。
3. 等待用户确认影响范围。
4. 只修改受影响产物，更新变更记录。
5. 重新执行自检；原知识库确认不自动沿用。

视觉变化只影响 HTML 时，不改 PRD。交互变化至少检查 `prototype.md`、SVG、HTML 和验收标准。

## 完成标准

交付前运行：

```bash
node <skill-dir>/scripts/validate-artifacts.mjs --requirement <requirement-dir>
```

未通过校验、存在未处理 FAIL、HTML 依赖外网、知识库未经确认被修改，均不得宣布流程完成。报告当前阶段、已确认门槛、跳过项、产物路径和剩余风险。

## 边界

- 默认不执行外部任务平台同步、消息发送、代码提交、部署或知识库外部写入。
- 用户要求公开部署时另行确认目标和权限，不能把本地原型称为已发布。
- 不把完整手机号、联系人、位置等真实敏感数据放进演示产物。
- 可以使用当前环境可用的浏览器验证能力，但不得为通过检查绕过浏览器安全策略。
