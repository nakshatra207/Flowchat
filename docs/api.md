# API Documentation

The FlowChat API is served from:

```text
/api
```

## Route Groups

- `/api/auth` - registration, login, refresh, logout, current session
- `/api/users` - profile management, search, presence
- `/api/conversations` - direct and group conversation listing and metadata
- `/api/messages` - message creation, editing, deletion, reactions, reads, search
- `/api/groups` - group creation, membership, permissions, admin actions
- `/api/notifications` - notification listing and read state

## Auth

- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/refresh`
- `POST /api/auth/logout`
- `GET /api/auth/me`

## Users

- `GET /api/users/search?q=<term>`
- `PATCH /api/users/me`
- `POST /api/users/me/avatar`
- `GET /api/users/:userId`

## Conversations

- `GET /api/conversations`
- `POST /api/conversations/direct`
- `GET /api/conversations/:conversationId`
- `POST /api/conversations/:conversationId/read`

## Messages

- `GET /api/messages/search?q=<term>`
- `POST /api/messages/attachments`
- `GET /api/messages/conversation/:conversationId`
- `POST /api/messages`
- `PATCH /api/messages/:messageId`
- `DELETE /api/messages/:messageId`
- `POST /api/messages/:messageId/reactions`
- `POST /api/messages/:messageId/read`

## Groups

- `GET /api/groups`
- `GET /api/groups/search?q=<term>`
- `POST /api/groups`
- `GET /api/groups/:groupId`
- `PATCH /api/groups/:groupId`
- `POST /api/groups/:groupId/avatar`
- `POST /api/groups/:groupId/members`
- `DELETE /api/groups/:groupId/members`
- `POST /api/groups/:groupId/admins`

## Notifications

- `GET /api/notifications`
- `POST /api/notifications/read-all`
- `POST /api/notifications/:notificationId/read`

Authenticated routes require:

```text
Authorization: Bearer <access-token>
```
