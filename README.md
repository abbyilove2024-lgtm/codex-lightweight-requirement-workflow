# Codex 轻量需求撰写流程

面向 Codex 团队的可安装 Plugin。它把需求探讨、文档套件、SVG 线框、离线 HTML 原型、需求自检和可选知识库回写组织成可恢复的确认流程。

## 核心约束

- 先探讨并确认摘要，再生成文档。
- 文档、SVG、视觉方向、HTML、自检均有独立确认门槛。
- 文件存在不等于用户已确认；状态以 `.workflow/state.json` 为准。
- 知识库先生成草案，只有再次明确确认后才回写。
- HTML 原型默认离线可运行，不依赖 CDN 或远程图片。

## 仓库结构

```text
.agents/plugins/marketplace.json
plugins/lightweight-requirement-workflow/
  .codex-plugin/plugin.json
  skills/lightweight-requirement-workflow/
tests/
scripts/validate-repo.mjs
```

## 从 GitHub 安装

仓库上传后，团队成员可直接添加 GitHub marketplace。将示例中的组织名替换为实际值：

```bash
codex plugin marketplace add your-org/codex-lightweight-requirement-workflow --ref main
codex plugin add lightweight-requirement-workflow@team-product
```

也可以克隆到本地进行开发或审查：

```bash
git clone <your-github-repository-url>
cd codex-lightweight-requirement-workflow
codex plugin marketplace add /absolute/path/to/codex-lightweight-requirement-workflow
codex plugin add lightweight-requirement-workflow@team-product
```

安装后开启一个新的 Codex 任务，让新 Skill 进入上下文。

## 使用

推荐显式调用：

```text
使用 $lightweight-requirement-workflow 开始一个新需求：……
```

续做或修改：

```text
使用 $lightweight-requirement-workflow 继续 user_login
使用 $lightweight-requirement-workflow 修改 user_login，增加微信登录
```

默认需求产物位于：

```text
documents/product_requirements/{requirement_name}/
```

首次使用时，Skill 会先说明并初始化工作区模板。团队自己的知识库和需求产物保存在业务仓库，不写回本 Plugin 仓库。

## 更新

使用 GitHub marketplace 的成员执行：

```bash
codex plugin marketplace upgrade team-product
codex plugin add lightweight-requirement-workflow@team-product
```

使用本地克隆的成员先执行 `git pull`，再重新运行 `codex plugin add`。更新后开启新任务。开发阶段若同一版本需要强制刷新，使用 Codex `plugin-creator` 提供的 cachebuster 更新流程；正式发布应正常递增语义版本。

## 验证

```bash
node scripts/validate-repo.mjs
node --test tests/*.test.mjs
```

发布前还应在安装了 Codex 创建工具的维护环境中运行官方 Skill 和 Plugin 校验器。
