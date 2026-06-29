## Project Configuration

- **Language**: TypeScript
- **Package Manager**: npm
- **Add-ons**: prettier

---

## Project: Moni — Personal Finance Tracker

- **Stack**: SvelteKit 5 + adapter-static + IndexedDB (idb)
- **Host**: GitHub Pages (free, static-only, browser-only)
- **Data**: IndexedDB per user, no backend, no auth

### MVP Features

- [ ] Dashboard: số dư, tổng thu/chi trong tháng, pie chart chi tiêu theo danh mục
- [ ] Transaction CRUD: thêm/sửa/xoá giao dịch (số tiền, ngày, danh mục, ghi chú), phân loại Thu/Chi
- [ ] Danh mục (Categories): mặc định + thêm/sửa/xoá
- [ ] Lọc: theo tháng, theo danh mục
- [ ] Export/Import JSON (backup)

### Non-goals (v1)

Đăng nhập, sync cloud, nhiều tài khoản, budget, recurring transactions, currency converter.

---

## Implementation Plan

### Phase 0: Setup

- [x] 0.1 Chuyển `adapter-auto` → `adapter-static` + thêm `idb`
- [x] 0.2 Tạo `svelte.config.js` với `paths.base` + `fallback: 'index.html'`
- [x] 0.3 Thêm GitHub Actions workflow (`.github/workflows/deploy.yml`)

### Phase 1: Data Layer

- [x] 1.1 Định nghĩa types (`Transaction`, `Category`) trong `$lib/types.ts`
- [x] 1.2 Tạo `$lib/db.ts` — wrapper IndexedDB với `idb`
- [x] 1.3 Seed danh mục mặc định

### Phase 2: State Management

- [x] 2.1 Tạo `$lib/stores/transactions.svelte.ts` — class `$state` + CRUD
- [x] 2.2 Tạo `$lib/stores/categories.svelte.ts` — class `$state` + CRUD

### Phase 3: Transaction CRUD

- [x] 3.1 Trang `/transactions` — danh sách giao dịch
- [x] 3.2 Form thêm giao dịch (modal/inline)
- [x] 3.3 Sửa giao dịch
- [x] 3.4 Xoá giao dịch
- [x] 3.5 Trang `/categories` — quản lý danh mục

### Phase 4: Dashboard

- [x] 4.1 Tổng thu, tổng chi, số dư tháng hiện tại
- [x] 4.2 Pie chart chi tiêu theo danh mục (horizontal bar chart)
- [x] 4.3 Dashboard là trang `/`

### Phase 5: Lọc

- [x] 5.1 Lọc theo tháng (date picker)
- [x] 5.2 Lọc theo danh mục (dropdown)

### Phase 6: Export / Import

- [x] 6.1 Export JSON
- [x] 6.2 Import JSON

### Phase 7: Deploy

- [ ] 7.1 Push lên GitHub, verify GitHub Pages

---

You are able to use the Svelte MCP server, where you have access to comprehensive Svelte 5 and SvelteKit documentation. Here's how to use the available tools effectively:

## Available Svelte MCP Tools:

### 1. list-sections

Use this FIRST to discover all available documentation sections. Returns a structured list with titles, use_cases, and paths.
When asked about Svelte or SvelteKit topics, ALWAYS use this tool at the start of the chat to find relevant sections.

### 2. get-documentation

Retrieves full documentation content for specific sections. Accepts single or multiple sections.
After calling the list-sections tool, you MUST analyze the returned documentation sections (especially the use_cases field) and then use the get-documentation tool to fetch ALL documentation sections that are relevant for the user's task.

### 3. svelte-autofixer

Analyzes Svelte code and returns issues and suggestions.
You MUST use this tool whenever writing Svelte code before sending it to the user. Keep calling it until no issues or suggestions are returned.

### 4. playground-link

Generates a Svelte Playground link with the provided code.
After completing the code, ask the user if they want a playground link. Only call this tool after user confirmation and NEVER if code was written to files in their project.
