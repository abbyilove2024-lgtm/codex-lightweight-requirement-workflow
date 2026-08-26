# SVG 线框原型

## 输入

完整读取 `prototype.md`，并核对 `prd.md`、`user_story.md` 和 `flowchart.md`。页面不一致时先修正文档，不在 SVG 中偷偷补需求。

## 输出

输出到 `prototypes/`。每个核心页面至少一个独立 SVG；明显不同的关键状态可以独立文件：

```text
{page_name}.svg
{page_name}_loading.svg
{page_name}_empty.svg
{page_name}_error.svg
```

## 规则

- 移动端默认画布 375x812，桌面端默认 1440x900；以已确认目标设备为准。
- 使用灰阶加一个结构强调色，避免把线框误当成最终视觉。
- 使用原生 SVG 元素；文字保留为 `<text>`，模块使用语义化 `<g id>`。
- 不依赖外部资源，不将图片或文字转成路径。
- 页面入口、返回、主操作、弹窗和关键状态必须可见。
- 不添加 PRD 未定义的新功能。

## 验证

确认 SVG XML 合法、浏览器可打开、画布无裁切、文字不重叠、页面与 `prototype.md` 一一对应。交付时列出文件、页面和状态，等待用户确认。
