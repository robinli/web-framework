# Ticket 0001 – Auth Login Vertical Slice

## 目的
完成帳密登入、登出與 `/me` 查詢，建立前後端可運作的最小登入閉環，作為後續權限、選單、功能模組的基礎。

## 範圍
- 僅支援「帳號 / 密碼」登入
- 使用 JWT 作為存取權杖
- 不包含：
  - 使用者註冊
  - 忘記密碼 / 重設密碼
  - 第三方登入（Google / GitHub 等）

## 技術決策（不可更動）
- Frontend：Next.js 14（App Router）
- Backend：NestJS
- Auth：
  - JWT
  - Header：`Authorization: Bearer <token>`
- Database：PostgreSQL
- ORM：Prisma
- Password：
  - 雜湊儲存（bcrypt）
  - 不可明碼、不回傳
- API 為唯一授權判斷來源，前端僅做 UX 控制

## API 規格

### POST /api/auth/login
- 輸入：
```json
{
  "email": "string",
  "password": "string"
}
```

* 成功（200）：

```json
{
  "accessToken": "jwt-token"
}
```

* 失敗：

  * 帳密錯誤 → 401
  * 帳號停用 → 401

### POST /api/auth/logout

* 行為：

  * 後端可先 no-op
  * 前端清除 access token
* 回傳：200

### GET /api/auth/me

* Header：

```
Authorization: Bearer <token>
```

* 成功（200）：

```json
{
  "id": "uuid",
  "email": "string"
}
```

* 失敗：

  * 未帶 token → 401
  * token 無效 / 過期 → 401

## 資料結構

### users

* id (uuid, pk)
* email (string, unique)
* password_hash (string)
* is_active (boolean)
* created_at (timestamp)
* updated_at (timestamp)

### Migration

* 必須產生 Prisma migration
* 不可手動修改 DB schema

## 種子資料（Seed）

* 建立一個 admin 使用者：

  * email：`admin@example.com`
  * password：`admin123`
  * is_active：true
* Seed 必須可重複執行（idempotent）

## 前端行為

### 登入頁

* 路徑：`/login`
* 可輸入 email / password
* 登入成功：

  * 儲存 access token
  * 導向受保護頁面（例如 `/dashboard`）

### 受保護頁面

* 未登入：導向 `/login`
* 已登入：

  * 呼叫 `/api/auth/me`
  * 顯示目前使用者 email

## 驗收條件（必須全部成立）

1. 可使用 seed 帳號成功登入
2. 登入後可看到 `/me` 回傳的 email
3. 未登入直接存取受保護頁面會被導回 `/login`
4. 移除 token 後，`/me` 回傳 401

## 測試需求（最小集合）

### Backend

* login 成功
* login 失敗（錯誤密碼）
* /me 有 token
* /me 無 token

### Frontend

* 登入成功可進入受保護頁（可先手動 smoke test）

## 指令與整合

* `pnpm dev`：同時啟動 apps/web 與 apps/api
* `pnpm test`：至少跑 backend 測試
* `pnpm build`：web 與 api 都必須可 build
* `pnpm lint`：全 repo 通過

## 非目標（Out of Scope）

* 註冊流程
* 權限 / 角色 / 選單
* Refresh token
* Remember me
* 多語系

## Codex 執行指示

### Plan

依 `docs/dev/codex-workflow.md`，產出實作計畫，包含：

* 檔案修改清單
* API 與資料表對應
* Migration 與 seed
* 測試案例
* 驗收步驟
  不要寫程式碼

### Implement

依核准計畫實作，限制：

* 僅修改計畫內檔案
* `pnpm dev / lint / test / build` 必須可跑
* 嚴格遵守本文件的技術決策

