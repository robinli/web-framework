\# Codex Development Workflow



\## 1. Repo 結構邊界

\- 允許修改：

&nbsp; - apps/api/\*\*

&nbsp; - apps/web/\*\*

&nbsp; - packages/shared/\*\*

&nbsp; - docs/\*\*

&nbsp; - package.json

&nbsp; - pnpm-lock.yaml

&nbsp; - .env.example

&nbsp; - README.md

\- 禁止修改：

&nbsp; - 任何未在本清單列出的路徑（需要新增路徑時，先更新本文件再動手）



\## 2. 指令入口（根目錄）

\- 必須可執行且不可互動：

&nbsp; - pnpm dev

&nbsp; - pnpm build

&nbsp; - pnpm test

&nbsp; - pnpm lint

\- 新增任何 package / app 後，仍需維持上述四個指令在根目錄可跑。



\## 3. 環境與設定

\- 禁止硬編碼 secret / connection string。

\- 所有環境變數必須列在 .env.example。

\- 任何新增 env key 必須同步更新 .env.example 與 README 的設定段落。



\## 4. 變更流程（每個 Ticket 的固定節奏）

1\) 先產出計畫（Plan）

\- 列出：要改哪些檔案、要新增哪些檔案、資料/介面變更點、測試案例、驗收步驟。

2\) 依計畫實作（Implement）

\- 僅允許修改計畫列出的檔案；如需新增/擴大範圍，先更新計畫。

3\) 自我驗證（Verify）

\- 必跑：pnpm lint / pnpm test / pnpm build

\- 失敗：只修造成失敗的最小變更



\## 5. Definition of Done（DoD）

\- pnpm lint / pnpm test / pnpm build 全部通過

\- 提供可重現的驗收步驟（含指令與操作路徑）

\- 新增功能必含最小測試：

&nbsp; - API：至少 1 個成功 + 1 個失敗案例

&nbsp; - Web：至少 1 個關鍵流程 smoke test（可先手動步驟，後續補自動化）

\- 不引入互動式安裝/設定步驟（CI 必須可無人值守執行）



\## 6. PR / Commit 規則

\- 一個 Ticket 一個 PR

\- 最小變更原則：只提交與 Ticket 直接相關的改動

\- Commit message 格式：

&nbsp; - chore: ...

&nbsp; - feat(<scope>): ...

&nbsp; - fix(<scope>): ...



