# HQD 子域名恢复迁移观察记录

观察窗口：2026-10-26 至 2026-11-01

自动化 ID：`cinkr-hqd-7`

通知策略：仅在异常、有意义的状态变化或需要用户操作时通知；正常运行时静默。

## 2026-10-26 基线

- `https://hqd.cinkr.com/` 由 `cinkr-hqd` Pages 直接提供，Production
  Deployment 为 `e428c32b-7d21-44dc-baa2-d689d20c8e49`，源码
  `9c286a8`。
- `hqd.cinkr.com` 与 `www.hqd.cinkr.com` 均为 active Pages Custom Domain。
- `cinkr.com/hqd`、`/hqd/*`、`www.cinkr.com/hqd/*` 和
  `www.hqd.cinkr.com/*` 均为单跳 `301` 到 `hqd.cinkr.com` 同路径，
  保留 query。
- `/hqd-other/` 未被 HQD 前缀误匹配。
- HQD 生产验收：64 页、133 资源、6 条重定向、1 个品牌 404。
- Cinkr 主站回归：8 页、29 资源、16 条重定向、3 个 404。
- Kinco 回归：83 页、47 资源、9 条重定向、1 个 404。
- RichAuto 回归：48 页、50 资源、6 条重定向、1 个 404。
- GSC 新 HQD sitemap 成功，发现 64 页；首页已收录；`gdz-23` 已发现，
  已于 2026-10-26 请求编入索引。
- GSC 旧 `cinkr.com/hqd/sitemap-index.xml` 仍成功并发现 64 页，保留至少
  十二个月。
- Bing 仅导入 `hqd.cinkr.com`。新 sitemap 已成功抓取，发现 64 页，零错误、
  零警告。首页实时 URL 测试可抓取、可编入索引，索引请求已提交；当前仍为
  已发现、尚未进入索引。
