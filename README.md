# Autional 安全中心

**域名**：[security.autional.cn](https://security.autional.cn)
**技术栈**：Vite + React 19 + TypeScript + Tailwind CSS + Ant Design
**仓库**：[github.com/autional-cn/security](https://github.com/autional-cn/security)

风险事件、登录审计与安全态势概览。

## 开发

```bash
pnpm install
pnpm dev      # http://localhost:13105
pnpm build    # 构建产物：apps/security-dashboard/dist/
pnpm test     # Vitest 单元测试
```

## 部署

推送至 `main` 分支后由 Vercel 自动部署。
