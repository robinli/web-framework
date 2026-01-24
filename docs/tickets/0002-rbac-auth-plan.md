# Ticket 0002 – RBAC Authorization Minimal Vertical Slice Plan

## 1) 檔案修改／新增清單（含路徑）

### Backend（NestJS / Prisma）
- 修改 `apps/api/prisma/schema.prisma`
  - 新增 Role/Permission/RolePermission/UserRole model 與 User 關聯欄位
- 新增 `apps/api/prisma/migrations/<timestamp>_rbac-authorization/migration.sql`
  - 透過 Prisma migration 產生（不可手動改 DB schema）
- 修改 `apps/api/prisma/seed.ts`
  - 加入 roles/permissions/關聯 seed 與 viewer 使用者（idempotent）
- 修改 `apps/api/src/auth/auth.controller.ts`
  - 擴充 `GET /api/auth/me` 回傳 roles/permissions
- 修改 `apps/api/src/auth/auth.service.ts`
  - 新增查詢使用者 roles/permissions union 的方法供 `/me` 使用
- 新增 `apps/api/src/auth/permissions.decorator.ts`
  - `@RequirePermissions(...keys)` 裝飾器
- 新增 `apps/api/src/auth/permissions.guard.ts`
  - 讀取 decorator metadata 並於 Guard 層判斷 401/403
- 新增 `apps/api/src/protected/protected.controller.ts`
  - `GET /api/protected/example` 需 `user.read`
- 新增 `apps/api/src/protected/protected.module.ts`
  - 註冊 protected endpoint
- 修改 `apps/api/src/app.module.ts`
  - 掛載 ProtectedModule

### Frontend（Next.js）
- 修改 `apps/web/app/dashboard/page.tsx`
  - `/api/auth/me` 回傳 roles/permissions 並顯示
  - 新增 `user.read` 受保護區塊
- （如需）新增 `apps/web/lib/permissions.ts`
  - 前端顯示用 `hasPermission` helper

### Tests
- 修改 `apps/api/test/auth.e2e-spec.ts` 或新增 `apps/api/test/rbac.e2e-spec.ts`
  - 覆蓋 protected endpoint 200/401/403

## 2) API 端點與 DTO 規格對應

### `POST /api/auth/login`
- Request DTO：`LoginDto`
- Response：`{ accessToken: string }`

### `GET /api/auth/me`（擴充）
- Auth：`Authorization: Bearer <token>`
- Response：
  ```ts
  {
    id: string;
    email: string;
    roles: string[]; // role.code
    permissions: string[]; // permission.key (union)
  }
  ```

### `GET /api/protected/example`（新增）
- Required Permission：`user.read`
- Response：最小驗證用 JSON

## 3) Prisma schema / migration / seed 設計

### Schema
- 新增 `Role`, `Permission`, `RolePermission`, `UserRole`
- `role_permissions`、`user_roles` 使用複合唯一鍵

### Migration
- 使用 Prisma migration，命名含 RBAC 語意

### Seed
- Roles：`admin`, `viewer`
- Permissions：`user.read`, `menu.read`
- 關聯：
  - admin 擁有全部 permissions（依據資料表內容）
  - viewer 只有 `user.read`
- 使用者：
  - 既有 admin 使用者指派 `admin`
  - 新增 viewer 使用者
- 必須 idempotent

## 4) 測試案例清單（最小集合）

### Backend
- admin token → `GET /api/protected/example` 回 200
- viewer token → `GET /api/protected/example` 回 200（具 `user.read`）
- 無權限 token → `GET /api/protected/example` 回 403
- 無 token → `GET /api/protected/example` 回 401

### Frontend
- admin 登入可看到受保護區塊
- viewer 登入行為符合其權限

## 5) pnpm dev/lint/test/build 如何跑通（指令與端口）

### 指令（根目錄）
- `pnpm dev`
- `pnpm lint`
- `pnpm test`
- `pnpm build`

### 端口/啟動方式
- API：`API_PORT`（預設 3001）
- Web：Next.js 預設 3000，API base 使用 `NEXT_PUBLIC_API_BASE_URL`

## 6) 驗收步驟（curl + UI smoketest）

### curl
1. `POST /api/auth/login` 取得 token
2. `GET /api/auth/me` 確認 roles/permissions
3. `GET /api/protected/example`
   - admin/viewer → 200
   - 無權限 → 403
   - 無 token → 401

### UI smoketest
1. `pnpm dev` 後開啟 `http://localhost:3000`
2. admin / viewer 登入
3. Dashboard 顯示 roles/permissions 與 `user.read` 受保護區塊
