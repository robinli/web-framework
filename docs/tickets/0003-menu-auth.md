# Ticket 0003 – Menu Authorization Vertical Slice

## 目的

在 **Auth（0001）** 與 **RBAC（0002）** 完成後，建立「**依權限過濾的選單系統**」，使系統能根據使用者權限，決定**可見的功能入口**。

本 Ticket 完成後，系統必須能回答：

> 「這個使用者，登入後應該看到哪些功能入口？」
> 

---

## 範圍（In Scope）

- 選單（Menu）資料模型
- Menu 與 Permission 的關聯（以 permission key 綁定）
- 後端依使用者權限過濾 Menu
- 樹狀 Menu 結構回傳
- 前端動態產生選單（僅顯示）

---

## 非範圍（Out of Scope）

- Menu 管理 UI
- 拖拉排序
- Icon / 樣式美化
- Menu 快取 / 效能最佳化
- Role 直接綁 Menu（一律禁止）

---

## 技術決策（不可更動）

- Menu **只綁 Permission，不綁 Role**
- Menu 過濾 **僅在後端執行**
- 前端 **不得自行判斷權限**
- API 回傳結果即為最終可顯示結構

---

## 資料模型

### menus

- id (uuid, pk)
- key (string, unique)
    - 例：`dashboard`, `user-management`
- label (string)
- path (string)
    - 例：`/dashboard`, `/users`
- permission_key (string, nullable)
    - 對應 `permissions.key`
    - 為 null 表示所有登入使用者可見
- parent_id (uuid, nullable)
    - 指向 menus.id
- sort_order (int)
- created_at
- updated_at

約束規則：

- parent_id 必須指向同一張表
- 不允許循環關聯
- sort_order 僅在同層級有效

---

## Migration 規則

- 必須使用 Prisma migration
- 不可手動修改 DB schema
- migration 命名需反映 Menu 語意

---

## Seed（必須）

### Menu Seed（最小集合）

1. Dashboard
    - key: `dashboard`
    - path: `/dashboard`
    - permission_key: null
2. User Management
    - key: `user-management`
    - path: `/users`
    - permission_key: `user.read`
3. Menu Management
    - key: `menu-management`
    - path: `/menus`
    - permission_key: `menu.read`

### 權限行為驗證

- admin：
    - 可看到全部 menu
- viewer：
    - 僅看到 Dashboard + User Management

Seed 必須：

- 可重複執行（idempotent）
- 不產生重複 menu

---

## API 行為

### GET /api/menus

### Header

```
Authorization: Bearer <token>

```

### 行為規則

- 依登入使用者的 permissions 過濾 menu
- 僅回傳「可見 menu」
- 回傳結果必須是 **已組好的樹狀結構**
- 前端不得再做權限判斷或過濾

### 成功（200）

```json
[
{
"key":"dashboard",
"label":"Dashboard",
"path":"/dashboard",
"children":[]
},
{
"key":"user-management",
"label":"User Management",
"path":"/users",
"children":[]
}
]

```

---

## 授權規則（核心）

- Menu 可見條件：
    - permission_key = null → 可見
    - permission_key ∈ 使用者 permissions → 可見
    - 否則 → 不可見
- admin 不得使用 bypass（僅依 permission 判斷）

---

## 前端行為（最小）

- 登入後流程：
    1. 呼叫 `/api/auth/me`
    2. 呼叫 `/api/menus`
    3. 依回傳結果產生側邊選單
- 若回傳為空陣列：
    - 顯示「無可用功能」頁面（純文字即可）

不做任何樣式設計。

---

## 測試需求（最小集合）

### Backend（必須）

- admin token：
    - `/api/menus` → 回傳 3 個 menu
- viewer token：
    - `/api/menus` → 不包含 `menu-management`
- 無 token：
    - `/api/menus` → 401

---

### Frontend（可最小）

- admin 登入：
    - 側邊選單顯示 3 個項目
- viewer 登入：
    - 側邊選單不顯示 Menu Management

---

## 指令驗收（必須全部通過）

```
pnpm dev
pnpm lint
pnpm test
pnpm build

```

---

## 驗收條件（Definition of Done）

1. Menu 僅依 permission 判斷可見性
2. API 回傳已過濾且為樹狀結構
3. 前端不再做任何權限判斷
4. admin / viewer 行為符合 seed 設計
5. 所有指令可執行且通過

---

## Codex 執行指示

### Plan

依 `docs/dev/codex-workflow.md`，產出：

- 檔案修改／新增清單
- Prisma schema 與 migration
- Menu seed
- `/api/menus` 過濾與樹狀邏輯
- 測試案例
- 驗收步驟

**禁止寫程式碼**

---

### Implement

- 僅修改 Plan 列出的檔案
- 不擴充 scope
- 不引入 UI 管理功能
- 確保 `pnpm dev / lint / test / build` 全通過