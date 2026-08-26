# 贡献规范

## 修改原则

- 状态机、目录和确认门槛是公共契约，避免无迁移方案的破坏性修改。
- 主 `SKILL.md` 只保留流程和路由；阶段细节放入 `references/`。
- 确定性操作放入 `scripts/`，不得依赖团队成员机器上的私有路径。
- 工作区模板只提供空结构，不携带真实业务资料。

## 版本规则

- PATCH：文案、提示词和模板的小修，不改变文件契约。
- MINOR：增加非破坏性阶段、检查项或可选产物。
- MAJOR：修改状态结构、目录、门槛语义或安装方式。

同时更新 Plugin `version`、Skill 中的 `WORKFLOW_VERSION` 和 `CHANGELOG.md`。

## 提交前

```bash
node scripts/validate-repo.mjs
node --test tests/*.test.mjs
```

至少人工试跑：新需求、断点续做、修改已有需求、不回写知识库。不要用含预期答案的测试提示词掩盖流程缺陷。

## 发布

1. 合并前通过 CI 和代码评审。
2. 更新语义版本和变更记录。
3. 创建 `vX.Y.Z` Git 标签与 GitHub Release。
4. 用全新 Codex 任务安装并执行冒烟测试。
5. 向团队说明是否需要状态文件迁移。
