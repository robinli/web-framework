# Ticket 0002 – RBAC Authorization Minimal Vertical Slice

## 目的

在既有登入（Ticket 0001）基礎上，建立**角色／權限（RBAC）最小閉環**，使後端 API 具備可宣告式授權能力，前端可消費權限結果，作為後續選單與功能模組的基礎。

本 Ticket 完成後，系統必須能回答以下問題：

> 「這個使用者，是否有權限存取某個 API／功能？」
> 

---

## 範圍（In Scope）

- 角色（Role）
- 權限（Permission）
- 使用者與角色關聯
- 角色與權限關聯
- API 層權限判斷（唯一真相）
- `/api/auth/me` 擴充回傳角色與權限
- 最小前端權限消費（僅顯示，不做管理）

---

## 非範圍（Out of Scope）

- 權限管理 UI
- 角色管理 UI
- 群組（Group）
- 權限繼承、層級、Scope
- 多租戶（Tenant）
- 動態新增權限（僅 seed）

---

## 技術決策（不可更動）

- Backend：NestJS
- Auth：JWT（沿用 Ticket 0001）
- Database：PostgreSQL
- ORM：Prisma
- 授權判斷：
    - **僅後端判斷**
    - 前端僅做 UX 隱藏
- 未通過授權：
    - 已登入但無權限 → **403**
    - 未登入 → **401**

---

## 資料模型

### roles

- id (uuid, pk)
- code (string, unique)
    - 例：`admin`, `viewer`
- name (string)
- created_at
- updated_at

---

### permissions

- id (uuid, pk)
- key (string, unique)
    - 例：`user.read`, `menu.read`
- description (string)

---

### role_permissions

- role_id (fk → roles.id)
- permission_id (fk → permissions.id)

複合唯一鍵：

- (role_id, permission_id)

---

### user_roles

- user_id (fk → users.id)
- role_id (fk → roles.id)

複合唯一鍵：

- (user_id, role_id)

---

## Migration 規則

- 必須使用 Prisma migration
- 不可手動修改 DB schema
- migration 命名需反映 RBAC 語意

---

## Seed（必須）

### Roles

- `admin`
- `viewer`

### Permissions（最小集合）

- `user.read`
- `menu.read`

### 關聯

- admin：
    - 擁有全部 permissions
    - admin 的 「全部 permissions」定義為：當前 permissions 資料表中的所有記錄
    - 不得使用特殊值（例如 *）或寫死「admin 永遠放行」的 bypass 規則
- viewer：
    - 僅 `user.read`

### 使用者

- 將既有 seed 的 admin 使用者指派為 `admin`
- 新增一個 viewer 使用者（帳密可自定）

Seed 必須：

- 可重複執行（idempotent）
- 不產生重複資料

---

## API 行為

### 擴充 GET /api/auth/me

- permissions 必須為「使用者所有角色 permissions 的聯集（union）」
- permissions 僅回傳 string[]（不得回傳物件或巢狀關聯）
- roles 僅回傳 string[]（role code）

### Header

```
Authorization: Bearer <token>

```

### 成功（200）

```json
{
"id":"uuid",
"email":"string",
"roles":["admin"],
"permissions":["user.read","menu.read"]
}

```

---

## 授權機制（核心）

### 必須實作

- Permission Guard（NestJS）
- Permission Decorator
- 權限判斷 必須實作於 NestJS Guard 層
- Controller / Service 不得自行判斷權限
- Guard 為唯一授權裁決點

範例（概念）：

```tsx
@RequirePermissions('user.read')

```

行為規則：

- 有任一指定權限 → 通過
- 無指定權限 → 403
- 無 token → 401

---

## 驗證用保護 API（最小）

新增一個測試用 endpoint，例如：

```
GET /api/protected/example

```

- 需要 `user.read`
- 僅用於驗證 RBAC 是否生效

---

## 前端行為（最小）

- 登入後呼叫 `/api/auth/me`
- 在 `/dashboard` 顯示：
    - roles（純文字）
    - permissions（純文字）
- 建立一個「受權限保護區塊」
    - 條件：需 `user.read`
    - 有權限 → 顯示
    - 無權限 → 不顯示

不做任何編輯或管理 UI。

---

## 測試需求（最小集合）

### Backend（必須）

- admin token：
    - 存取 protected API → 200
- viewer token：
    - 存取 protected API → 200（若有 user.read）
- 無權限 token：
    - 存取 protected API → 403
- 無 token：
    - 存取 protected API → 401

---

### Frontend（可最小）

- admin 登入：
    - 可看到受保護區塊
- viewer 登入：
    - 行為符合其權限

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

1. `/api/auth/me` 回傳 roles 與 permissions
2. API 層可宣告式限制權限
3. admin / viewer 行為符合 seed 設計
4. 無權限時回傳 403（非 401）
5. 所有指令可執行且通過
6. permissions 為「使用者所有角色的 permissions 聯集（union）」
7. 不回傳 role_permissions 或中介結構
8. permissions 僅回傳 string array（不可回傳物件）

---

## Codex 執行指示

### Plan

依 `docs/dev/codex-workflow.md`，產出：

- 檔案修改／新增清單
- Prisma schema 變更
- Migration 與 seed
- Guard / Decorator 設計
- 測試案例
- 驗收步驟

**禁止寫程式碼**

---

### Implement

- 僅修改 Plan 列出的檔案
- 嚴格遵守本文件的技術決策
- 不擴充 scope
- 確保 `pnpm dev / lint / test / build` 全通過