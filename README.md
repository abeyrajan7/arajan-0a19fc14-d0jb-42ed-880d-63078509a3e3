## 🛠 Setup & Installation

### 1. Prerequisites

- **Node.js**: v20 or higher
- **Nx CLI**: Install globally via `npm install --global nx`

### 2. Environment Setup (.env)

The application requires a `.env` file in the **root directory** to manage secrets and database paths. Create a file named `.env` and add the following:

env

# Server Port

PORT=3000

# Authentication

# Replace with a long, random string for production

JWT_SECRET=your_secure_random_string_here

# Database Configuration

# Path to your SQLite file relative to the project root

DATABASE_PATH=database.sqlite

# Frontend URL (CORS)

# The URL where your Angular app is running

FRONTEND_URL=http://localhost:4200

3. Install Dependencies
   Run the following command in the root folder to install all necessary packages for both frontend and backend:

Bash

npm install --legacy-peer-deps 4. Running the Applications
You can run both the NestJS API and the Angular Dashboard simultaneously using Nx:

Bash

# Run both apps together

npx nx run-many -t serve

# Or run them individually in separate terminals

npx nx serve api
npx nx serve dashboard
Backend API: http://localhost:3000/api

Frontend Dashboard: http://localhost:4200

## 🏗 Architecture Overview

### 1. Nx Monorepo Layout & Rationale

This project utilizes an **Nx Monorepo** architecture. Instead of having separate repositories for the Frontend and Backend, both live in a single workspace.

**Rationale:**

- **Shared Type Safety**: We can share TypeScript interfaces between the API and the Dashboard, ensuring that if a "Task" object changes on the backend, the frontend knows immediately.
- **Atomic Commits**: Features that require both backend and frontend changes can be committed and reviewed in a single Pull Request.
- **Simplified Tooling**: One `package.json`, one set of ESLint rules, and one testing framework across the entire stack.

### 2. Workspace Structure

- **`apps/`**: Contains the entry points for our applications.
  - `api/`: The NestJS server (Backend).
  - `dashboard/`: The Angular application (Frontend).
- **`libs/`**: (If applicable) This is where shared logic, UI components, and data-access services reside.

### 3. Identifying Shared Libraries & Modules

To understand how the modules and libraries interact, you can use the built-in **Nx Graph**. This tool visually maps every dependency in the workspace.

**To view the architecture graph, run:**

````bash
npx nx graph



## 📊 Data Model & Schema

The application uses a relational data model managed via **TypeORM**. The schema is designed to enforce strict data isolation between different organizations (multi-tenancy) while maintaining a clear audit trail of task ownership.

### 1. Entity Relationship Diagram (ERD)



Image Link:
https://drive.google.com/file/d/1RlNzh7KDcY6UFs7ARpQ3rZ_-Wi8tG_1g/view?usp=sharing


2. Schema Breakdown
Organization: The top-level container.

Key Fields: id, name.

Rationale: All data is scoped to an organizationId. One organization represents the HeadQuarters (HQ), while others represent branch offices.

User: Represents an employee within an organization.

Key Fields: id, email, role (ADMIN, OWNER, VIEWER), organizationId.

Rationale: A user belongs to exactly one organization. Their role determines what they can do with tasks inside that organization.

Task: The core unit of work.

Key Fields: id, title, description, status, position, organizationId, createdBy.

Rationale: Every task is linked to an organization. The position field is used for the Drag-and-Drop reordering logic.

Audit Log: Tracks system-wide actions.

Key Fields: id, action, performedBy, timestamp.


## 🔐 Access Control Implementation

The system implements a hierarchical **Role-Based Access Control (RBAC)** model combined with **Organization-based scoping**. This ensures that users only see what they are supposed to see and only perform actions they are authorized to do.

### 1. The Role Hierarchy
Permissions are determined by a combination of the user's `Role` and their `Organization`.

| Role | Scope | Reordering | Permissions |
| :--- | :--- | :--- | :--- |
| **ADMIN (HQ)** | **Global** | ✅ Yes | Full access to view, edit, delete, and reorder tasks across **all** organizations. |
| **ADMIN (Branch)**| **Branch** | ❌ No | Full management (CRUD) of all tasks within their **specific** organization. |
| **OWNER** | **Individual** | ❌ No | Can view all tasks in their org, but can only **Edit/Delete** tasks they personally created. |
| **VIEWER** | **Read-Only** | ❌ No | Can view tasks within their organization but cannot create, edit, or delete anything. |

### 2. JWT & Auth Integration
Authentication is handled via **JWT (JSON Web Tokens)**. When a user logs in, the backend issues a signed token containing their identity and permissions.

**The Auth Flow:**
1. **Extraction**: The `JwtStrategy` extracts the token from the `Authorization: Bearer <token>` header.
2. **Validation**: The backend verifies the token using the `JWT_SECRET` defined in the `.env` file.
3. **Payload Injection**: Once validated, the user's `userId`, `role`, and `organizationId` are attached to the Request object (`req.user`).
4. **Guards**: Custom NestJS Guards compare the `req.user` data against the requested resource. For example:
   * *Is the user an ADMIN?*
   * *Does the Task's `organizationId` match the User's `organizationId`?*

### 3. Data Scoping Logic
Access control isn't just about blocking buttons; it's built into the database queries.
* **Filtering**: When fetching tasks, the `TaskService` automatically appends a filter: `WHERE task.organizationId = :userOrgId`.
* **Ownership Check**: For sensitive operations (like Delete), the service checks:
  `if (user.role !== 'ADMIN' && task.createdBy !== user.id) throw ForbiddenException();`


### API Doc

1. POST /tasks (Create Task)
   Permission Check: Required ADMIN or OWNER role. VIEWER is blocked.

Request Header: Authorization: Bearer <JWT_TOKEN>

Request Body:

JSON

{
"title": "Fix Database Connection",
"description": "Resolve the timeout issue in the dev environment",
"organizationId": 2
}
Response (201 Created):

JSON

{
"id": 101,
"title": "Fix Database Connection",
"organizationId": 2,
"createdBy": 15,
"status": "pending",
"createdAt": "2026-01-09T10:00:00Z"
}

2. GET /tasks (List Tasks)
   Scoping: Users only see tasks where task.organizationId === user.organizationId. HQ Admins see all.

Request Header: Authorization: Bearer <JWT_TOKEN>

Response (200 OK):

JSON

[
{
"id": 101,
"title": "Fix Database Connection",
"status": "pending",
"organization": { "id": 2, "name": "Branch Office" }
},
{
"id": 102,
"title": "Update README",
"status": "completed",
"organization": { "id": 2, "name": "Branch Office" }
}
]

3. PUT /tasks/:id (Edit Task)
   Permission Check: ADMIN can edit any task in their org. OWNER can only edit tasks where createdBy === userId.

URL: /tasks/101

Request Body:

JSON

{
"status": "completed"
}
Response (200 OK):

JSON

{
"id": 101,
"title": "Fix Database Connection",
"status": "completed",
"updatedAt": "2026-01-09T11:30:00Z"
}
Response (403 Forbidden): Returns if a VIEWER tries to edit or an OWNER tries to edit someone else's task.

4. DELETE /tasks/:id (Delete Task)
   Permission Check: Restricted to ADMIN or the original OWNER who created the task.

URL: /tasks/101

Response (200 OK):

JSON

{
"message": "Task 101 successfully deleted"
}

5. GET /audit-log (View Logs)
   Permission Check: Only accessible by ADMIN or OWNER.

Request Header: Authorization: Bearer <JWT_TOKEN>

Response (200 OK):

JSON

{
"message": "Audit log accessible. Check server terminal for real-time logs."
}
````


## Future Considerations

To evolve this project from a functional prototype to a production-ready enterprise solution, the following enhancements are considered:

### 1. Dynamic Permissions & Delegation
* **Super Admin Control Panel**: A dedicated interface for the HQ Admin to dynamically adjust permissions for specific roles without redeploying code.
* **Granular Role Delegation**: Enabling Admins to delegate specific tasks or "Editor" rights to a Viewer for a limited time.
* **Invite System**: Implementing a secure email invitation flow for onboarding new organization members.

### 2. Production-Ready Security
* **JWT Refresh Tokens**: Moving to a dual-token system (short-lived Access Tokens and long-lived Refresh Tokens) to improve session security.
* **CSRF & XSS Protection**: Implementing `csurf` middleware and moving JWT storage from `localStorage` to `HttpOnly` cookies.
* **RBAC Caching**: Integrating **Redis** to cache user roles and organization scoping data, reducing the number of database lookups per request.



### 3. Scaling & Performance
* **Efficient Permission Checks**: Implementing **Bitmask-based permissions** or an **Access Control List (ACL)** for faster evaluation as the number of users grows.
* **Database Migrations**: Moving away from TypeORM's `synchronize: true` in favor of a managed migration strategy to ensure data integrity during schema updates.
* **Audit Trail Expansion**: Transitioning the simple audit log into a full-scale event-streaming service (using Kafka or RabbitMQ) for high-frequency logging.



### 4. Advanced Frontend Features
* **Real-time Updates**: Integrating **WebSockets (Socket.io)** so that when an Admin reorders tasks, the change is reflected instantly on all organization members' screens.
* **Offline Support**: Implementing a Service Worker to allow users to view tasks even when their internet connection is lost.