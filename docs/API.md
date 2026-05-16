# API Reference

Base URL: `http://localhost:4000/api`

All responses follow a consistent envelope:

```jsonc
// Success
{ "success": true, "message": "...", "data": <payload>, "meta": { "page": 1, "pageSize": 20, "total": 0, "totalPages": 1 } }

// Error
{ "success": false, "message": "...", "errors": { "field": ["msg"] }, "code": "P2002" }
```

Authentication: include `Authorization: Bearer <accessToken>` on protected routes.
The `/auth/refresh` endpoint will issue a new access token using a valid refresh token (sent in body, cookie, or both).

---

## Auth

### `POST /auth/signup`
Create an account. The very first user automatically becomes an `ADMIN`.

```json
// Request
{ "name": "Alex Admin", "email": "alex@example.com", "password": "Password123" }
```

```json
// Response (201)
{
  "success": true,
  "message": "Account created successfully",
  "data": {
    "user": { "id": "...", "name": "Alex Admin", "email": "alex@example.com", "role": "ADMIN" },
    "accessToken": "ey...",
    "refreshToken": "ey...",
    "accessTokenExpiresIn": "15m",
    "refreshTokenExpiresIn": "7d"
  }
}
```

### `POST /auth/login`
```json
{ "email": "alex@example.com", "password": "Password123" }
```

### `POST /auth/refresh`
```json
{ "refreshToken": "ey..." }
```
(Or rely on the `refreshToken` httpOnly cookie set by the server.)

### `POST /auth/logout`
Protected. Revokes all refresh tokens for the current user.

---

## Users

### `GET /users/me`
Returns the current user profile.

### `PUT /users/profile`
```json
{ "name": "Alex A.", "bio": "Engineering manager", "avatar": "https://..." }
```

### `POST /users/change-password`
```json
{ "currentPassword": "Password123", "newPassword": "EvenStronger1" }
```

### `GET /users` _(admin)_
Query params: `page`, `pageSize`, `search`, `role`.

### `PUT /users/:id` _(admin)_
```json
{ "role": "ADMIN", "isActive": false, "name": "..." }
```

### `DELETE /users/:id` _(admin)_

---

## Projects

### `GET /projects`
Returns projects the user owns or is a member of (admins see everything).
Query: `page`, `pageSize`, `search`, `status`.

### `POST /projects` _(admin)_
```json
{
  "title": "Mobile redesign",
  "description": "New design system",
  "status": "ACTIVE",
  "deadline": "2025-06-30",
  "color": "#6366f1",
  "memberIds": ["cuid1", "cuid2"]
}
```

### `GET /projects/:id`
Returns the project with members, status counts and computed progress %.

### `PUT /projects/:id`
Owner or admin only. Accepts a partial payload of the create schema (and an optional `memberIds` array to replace the team).

### `DELETE /projects/:id`
Owner or admin only.

### `POST /projects/:id/members`
```json
{ "memberIds": ["cuid1", "cuid2"] }
```

### `DELETE /projects/:id/members/:userId`

---

## Tasks

### `GET /tasks`
Query params: `page`, `pageSize`, `search`, `status`, `priority`, `projectId`, `assignedToId`, `overdue=true`.

### `POST /tasks`
```json
{
  "title": "Implement search bar",
  "description": "Global search with fuzzy match",
  "priority": "HIGH",
  "status": "TODO",
  "dueDate": "2025-04-12",
  "projectId": "cuid_of_project",
  "assignedToId": "cuid_of_user"
}
```

### `GET /tasks/:id`
Returns the task plus comments, attachments and recent activities.

### `PUT /tasks/:id`
Partial update. **Members can only change `status` of tasks assigned to them.** Owners/admins can change anything. Setting `status` to `COMPLETED` automatically stamps `completedAt`.

### `DELETE /tasks/:id`
Admin or project owner only.

### `POST /tasks/:id/attachments`
`multipart/form-data` with a single `file` field. Returns the Cloudinary URL.

---

## Comments

### `POST /comments`
```json
{ "content": "Looks great!", "taskId": "cuid" }
```

### `GET /comments/:taskId`
Lists all comments on a task.

### `DELETE /comments/:id`
Author or admin only.

---

## Dashboard

### `GET /dashboard/stats`
Returns analytics scoped to the user's projects (or workspace-wide for admins):

```jsonc
{
  "cards": { "totalProjects": 8, "activeProjects": 5, "completedTasks": 142, ... },
  "statusBreakdown": { "todo": 12, "inProgress": 7, "review": 3, "completed": 142 },
  "priorityBreakdown": [ { "priority": "HIGH", "count": 24 } ],
  "completionTrend": [ { "month": "Jan 2025", "completed": 12 } ],
  "recentActivities": [ /* ... */ ]
}
```

---

## Errors

| Status | Meaning |
| ------ | ------- |
| 400    | Bad request / validation failure |
| 401    | Missing or expired token |
| 403    | Authenticated but forbidden |
| 404    | Resource not found |
| 409    | Conflict (e.g. duplicate email) |
| 422    | Zod validation error (see `errors` field) |
| 429    | Rate limit hit |
| 500    | Server error |

Rate limits:
- Auth endpoints (`/auth/login`, `/auth/signup`): **20 / 15 minutes / IP**
- Everything else: **300 / 15 minutes / IP**
