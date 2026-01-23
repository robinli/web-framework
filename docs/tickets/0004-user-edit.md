# Ticket 0004 – User Management (Read-Only) Business Feature Vertical Slice

## 目的

實作第一個實際業務模組，以**使用者清單（唯讀）**為例，完整跑通：

**Menu → Page → API → RBAC → DB**

驗證新增業務功能是否能在既有架構下**不返工、不繞路**完成。

---

## 範圍（In Scope）

- 使用者清單（Read-Only）
- 新增一個實際業務 permission
- 對應 menu、page、API
- RBAC 完整套用於 API 與選單
- 最小前端顯示（表格即可）

---

## 非範圍（Out of Scope）

- 新增 / 編輯 / 刪除使用者
- 密碼重設
- 分頁 / 搜尋 / 排序
- 使用者管理 UI（角色、權限編輯）
- 美術、樣式、最佳化

---

## 技術決策（沿用，不可更動）

- Frontend：Next.js
- Backend：NestJS
- Database：PostgreSQL
- ORM：Prisma
- Auth / RBAC / Menu：完全沿用 Ticket 0001–0003
- API 為唯一授權裁決點

---

## 新增 Permission（必須）

- `user.manage`

語意：

可存取「使用者管理相關功能（本 Ticket 僅為 read）」。

---

## Menu 規格（必須）

新增 menu：

- key：`user-management`
- label：`User Management`
- path：`/users`
- permission_key：`user.manage`
- parent：root 或既有管理群組

規則：

- 無 `user.manage` → menu 不回傳
- 有 `user.manage` → menu 顯示

---

## API 規格

### GET /api/users

用途：取得使用者清單（唯讀）

**Header**

```
Authorization: Bearer <token>
```

**授權**

- 必須具備 `user.manage`
- 使用 `@RequirePermissions('user.manage')`
- 僅能在 Guard 層判斷

**回傳（200）**

```json
[
  {
    "id": "uuid",
    "email": "string",
    "isActive": true,
    "createdAt": "timestamp"
  }
]

```

回傳規則：

- 依 `createdAt` 由新到舊排序
- 僅允許上述四個欄位

**錯誤**

- 無 token → 401
- 有 token 無權限 → 403

---

## 資料來源

- 使用既有 `users` table
- 不新增新資料表
- 不回傳任何 password 相關欄位

---

## Seed（必須）

- admin：
    - 擁有 `user.manage`
- viewer：
    - 不擁有 `user.manage`

驗證結果：

- admin 可看到 menu 與清單
- viewer 看不到 menu，API 回傳 403

---

## 前端行為

### Page

- 路徑：`/users`
- 僅能從 menu 進入
- 行為：
    - 載入呼叫 `GET /api/users`
    - 成功：表格顯示 `email / isActive / createdAt`

---

### 權限規則（固定規則 B）

- menu 不存在 → 無法導航
- **直接輸入 `/users` 且無權限時：**
    1. 前端攔截 API 403
    2. 立即導回 `/dashboard`
    3. 顯示全域頂部提示（非 modal）：
        
        ```
        You do not have permission to access that page.
        ```
        
    4. 提示可自動消失或手動關閉
    5. 不使用 alert / confirm / modal
    6. 不使用 query string 傳遞狀態

---

## 測試需求（最小集合）

### Backend（必須）

- admin token → `GET /api/users` → 200
- viewer token → `GET /api/users` → 403
- 無 token → `GET /api/users` → 401

### Frontend（最小）

- admin：
    - 看得到 menu
    - 可進入 `/users`
- viewer：
    - 看不到 menu
    - 直接輸入 `/users` → 被導回 `/dashboard` 並顯示拒絕提示

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

1. 新增 `user.manage` permission
2. menu / page / API 全綁定該 permission
3. API 層正確回傳 401 / 403
4. 前端依固定規則 B 處理無權限導頁
5. admin / viewer 行為符合 seed
6. 使用者清單可正常顯示
7. 所有指令可執行且通過

---

## Codex 執行指示

### Plan

- 檔案修改／新增清單
- Permission / Menu / API 對應
- Seed 變更
- 測試案例
- 驗收步驟
    
    **禁止寫程式碼**
    

### Implement

- 僅修改 Plan 列出的檔案
- 不擴充 scope
- 不補管理 UI
- 嚴格遵守既有 Auth / RBAC / Menu 設計
- 確保 `pnpm dev / lint / test / build` 全通過