# 私有访问记录：IP 和停留时长

2026-09-26 已创建 `homepage-visits` 数据表、部署 Cloudflare Worker，并在本地网站配置中填入接口地址。网站发布本次代码后才会开始记录；不能补录部署之前的访问。

当前接口：`https://homepage-visit-collector.homepage-visit-collector.workers.dev/collect`。已通过本机配置的代理完成真实写入验证，并清理测试记录。本机直连该域名未通过，因此无法访问该域名的访客仍会漏记。下列步骤保留供重新部署或维护使用。

网站继续托管在 GitHub Pages。Cloudflare Worker 接收访问上报，D1 数据库保存记录。网页不显示计数器、访客名单或统计面板，采集接口也不提供日志查询。查看数据需要登录你的 Cloudflare 账号。

## 费用与准备

注册 [Cloudflare 免费账号](https://dash.cloudflare.com/sign-up)，使用 Workers Free 即可开始，无需购买服务器或自定义域名。

2026-09-26 核对的免费额度：Workers 每天 100,000 次请求；D1 每天 100,000 行写入、5,000,000 行读取、账号合计 5 GB 存储。一次浏览会产生多次心跳请求，数据库索引更新也会计入写入量，所以请求数和写入行数都不等于访客数。普通个人主页通常可以使用免费额度，实际用量可在 Cloudflare 控制台查看。[Workers 价格](https://developers.cloudflare.com/workers/platform/pricing/) · [D1 价格与超额说明](https://developers.cloudflare.com/d1/platform/pricing/)

本地需安装 Node.js 22.13 或更高版本。下面的命令适用于 Windows PowerShell，除特别说明外都在 `analytics-worker` 目录运行。

## 1. 安装工具并登录

```powershell
cd 'D:\个人信息\YiboZhao624.github.io\analytics-worker'
npm.cmd ci
npx.cmd wrangler login --device
```

登录命令会显示验证网址和短验证码，并打开浏览器。请登录自己的账号，确认验证码并授权；保持终端开启，直到显示 `Successfully logged in`。此设备授权方式不依赖 `localhost:8976` 回调。无需把密码或 API Token 写入仓库。

如果先前运行普通 `wrangler login` 后卡在 `http://localhost:8976/oauth/callback`，先在原终端按 `Ctrl+C`，再执行上面的 `--device` 登录命令。不要继续刷新旧回调链接。如果浏览器没有自动打开，用终端本次打印的验证网址和验证码完成授权。授权后运行 `npx.cmd wrangler whoami` 检查登录状态。[Cloudflare 设备授权说明](https://developers.cloudflare.com/changelog/post/2026-08-04-wrangler-login-device-flow/)

如果设备授权的浏览器页面出现 `request_forbidden`，并提示 `The CSRF value from the token does not match the CSRF value from the data store`，说明该请求的会话校验值不一致，可能涉及旧授权页面或浏览器会话。先在原终端按 `Ctrl+C`，关闭旧授权页面；新开无痕窗口并登录 Cloudflare 控制台，然后在终端执行 `npx.cmd wrangler login --device --browser=false`。将本次输出的验证网址复制到同一个无痕窗口，用本次验证码在有效期内完成授权；保持终端运行，不要刷新或重用先前的授权链接。若全新会话仍报相同错误，需要继续排查 Cloudflare 授权服务，或改用其支持的 API Token 认证。

## 2. 创建私有数据库

```powershell
npx.cmd wrangler d1 create homepage-visits
```

复制命令输出中的 `database_id`，替换 `analytics-worker/wrangler.jsonc` 里的 `REPLACE_WITH_YOUR_D1_DATABASE_ID`。若命令询问是否自动追加数据库绑定，选择 No，直接修改已有项即可。保留 `binding` 为 `DB`、`database_name` 为 `homepage-visits`。

同一配置中的 `ALLOWED_ORIGINS` 已填写 `https://yibozhao624.github.io`。如以后使用自定义域名，在这里添加完整来源地址，以英文逗号分隔，不带末尾斜杠或页面路径。

创建数据表：

```powershell
npx.cmd wrangler d1 execute homepage-visits --remote --file=./schema.sql
```

## 3. 部署记录接口

```powershell
npm.cmd run deploy
```

首次使用时按提示设置免费的 `workers.dev` 子域名。部署成功会得到类似 `https://homepage-visit-collector.你的子域名.workers.dev` 的地址。

在项目根目录的 `_config.yml` 中填写实际地址，并在末尾加上 `/collect`：

```yaml
visit_tracking_endpoint : "https://homepage-visit-collector.你的子域名.workers.dev/collect"
```

然后通过你原有的 GitHub Pages 发布流程提交并推送本次代码和配置，等待网站构建完成。仅部署 Worker 不会自动更新 GitHub Pages。直接用浏览器打开 `/collect` 显示空白或返回 403/405 是正常的，它只接收网站的 POST 上报。

## 4. 验证并查看记录

打开正式网站，停留约 20 秒，再切换到其他标签页。登录 Cloudflare 控制台，进入 D1 数据库 `homepage-visits`，在 SQL Console 中执行：

```sql
SELECT
  ip,
  path,
  datetime(first_seen_at / 1000, 'unixepoch', '+8 hours') AS first_seen_beijing,
  datetime(last_seen_at / 1000, 'unixepoch', '+8 hours') AS last_report_beijing,
  round(duration_ms / 1000.0, 1) AS visible_seconds
FROM visits
ORDER BY last_seen_at DESC
LIMIT 200;
```

也可以在已登录的本地终端查询：

```powershell
npx.cmd wrangler d1 execute homepage-visits --remote --command="SELECT ip, path, round(duration_ms / 1000.0, 1) AS visible_seconds FROM visits ORDER BY last_seen_at DESC LIMIT 50"
```

按 IP 汇总数据库中仍保留的访问：

```sql
SELECT ip, count(*) AS page_visits,
       round(sum(duration_ms) / 1000.0, 1) AS total_visible_seconds
FROM visits
GROUP BY ip
ORDER BY page_visits DESC;
```

如需导出，可保存到已被 Git 忽略的目录：

```powershell
New-Item -ItemType Directory -Force exports | Out-Null
npx.cmd wrangler d1 export homepage-visits --remote --output=./exports/visits.sql
```

导出的文件含完整 IP，请保存在私人位置，不要放进公开仓库。Worker 源码和数据库 ID 不是读取凭据，公开它们不会开放数据库；不要将 Cloudflare 登录凭据提交到 Git。

## 记录口径

- 每次页面加载是一条记录；刷新或打开另一个页面会生成新记录。浏览器前进/后退缓存恢复时续计原记录。
- IP 由 Cloudflare 请求头 `CF-Connecting-IP` 提供，记录该次访问第一次成功上报时的网络出口 IP。VPN、代理、校园网和共享网络可能让多人共用一个 IP；它不能识别具体的人。[Cloudflare 请求头说明](https://developers.cloudflare.com/fundamentals/reference/http-request-headers/)
- 时长是页面处于可见状态的累计秒数，不等于用户实际阅读或操作的时间。切换标签页或最小化后暂停；每 15 秒上报，隐藏或离开页面时尝试补报。不使用 Cookie 或持久访客标识。
- 重复、乱序上报保留最大的累计时长，不会重复累加。保存页面路径，不保存 URL 查询参数、锚点或表单输入。
- 浏览器强制退出、网络中断、广告拦截或不执行 JavaScript 的爬虫会造成漏报；最后一次补报失败时只能保留此前成功上报的时长。该系统不记录 PDF 文件本身的阅读时间。[sendBeacon 生命周期说明](https://developer.mozilla.org/en-US/docs/Web/API/Navigator/sendBeacon)
- 公共采集接口的来源检查能过滤其他网站的普通浏览器请求，但不能验证真人或阻止脚本伪造来源，因此数据适合参考统计。
- 单页累计时长上限为 7 天。数据默认保留到最后上报后的 90 天，每天北京时间 03:00 清理过期记录。可修改 `RETENTION_DAYS` 后重新部署；备份的保存周期由 Cloudflare 平台管理。
- “静默”指页面没有统计 UI；访问者仍可在浏览器网络面板看到上报请求。

## 停用和排查

将 `_config.yml` 中的 `visit_tracking_endpoint` 改回空字符串并重新发布，即可停止新打开页面的记录。已有记录仍保留至过期；已经打开的旧页面会继续上报到关闭为止。

无记录时依次检查：网站是否已重新发布、接口地址是否以 `/collect` 结尾、`ALLOWED_ORIGINS` 是否与正式网站的 `location.origin` 一致、数据库是否执行过建表、浏览器能否访问 Worker 域名。返回 204 表示该次写入成功，403 表示来源未允许，503 表示数据库写入失败。国内访客需特别验证所用 `workers.dev` 域名的实际连通性；无法访问接口的访客不会被记录。

本地验证代码（不会部署）：

```powershell
npm.cmd test
npm.cmd run check
```

网站根目录可运行 `bundle exec jekyll build` 检查静态构建。`analytics-worker` 已从 Jekyll 输出排除，本地依赖、登录环境文件和导出目录已加入 Git 忽略列表。

参考：[Cloudflare D1 部署教程](https://developers.cloudflare.com/d1/get-started/)。
