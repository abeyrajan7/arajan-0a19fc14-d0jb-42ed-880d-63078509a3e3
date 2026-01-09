1. Prerequisites
   Node.js: v20 or higher

Nx CLI: npm install --global nx

2. Environment Setup
   Create a .env file in the root directory (refer to .env.example for required keys):

Code snippet

PORT=3000
JWT_SECRET=your_secure_random_string
DATABASE_PATH=database.sqlite
FRONTEND_URL=http://localhost:4200

That default Nx README is a great template for generic monorepos, but it doesn't tell anyone what your specific app does! We should keep the helpful Nx commands but move them to the bottom, and put your Task Management System features right at the top.

Here is a fresh, professional README.md that combines the best of both worlds.

🚀 Task Management System (Nx Monorepo)
An enterprise-grade Task Management application featuring hierarchical Role-Based Access Control (RBAC) and Organization-based data scoping. Built with Angular 21, NestJS 11, and SQLite.

🛠 Quick Start

1. Prerequisites
   Node.js: v20 or higher

Nx CLI: npm install --global nx

2. Environment Setup
   Create a .env file in the root directory (refer to .env.example for required keys):

Code snippet

PORT=3000
JWT_SECRET=your_secure_random_string
DATABASE_PATH=database.sqlite
FRONTEND_URL=http://localhost:4200 3. Install & Run
Bash

# Install dependencies

npm install --legacy-peer-deps

# Run both Backend and Frontend simultaneously

npx nx run-many -t serve
Backend API: http://localhost:3000/api

Frontend Dashboard: http://localhost:4200

Role,Scope,Description
ADMIN (HQ),Global,Full access to all tasks across all organizations. Can reorder global task lists.
ADMIN (Branch),Branch,Can manage all tasks within their specific organization.
OWNER,Creator,"Can view all tasks in their org, but can only Edit/Delete their own creations."
VIEWER,Read-Only,Can only view tasks within their organization.

Core API Endpoints
POST /auth/login - Authenticate and receive a JWT.

GET /tasks - Retrieve tasks (scoped by the user's Organization).

PUT /tasks/reorder - Update task sequence (Restricted to HQ Admin).

DELETE /tasks/:id - Remove a task (requires Ownership or Admin role).

PUT /tasks/reorder - This endpoint is specifically designed for the Drag-and-Drop functionality in the Angular frontend.
Authorization: Requires a valid JWT with the ADMIN role from the HQ organization.
Payload: Accepts an array of task IDs in their new desired sequence.
Logic: The backend performs a bulk update on the position or order column in the SQLite database to persist the UI state.

Endpoint: GET http://localhost:3000/api/seed
Result: Creates a global HQ Admin and a Branch Admin with predefined credentials for testing.

# Testing

We use Jest with an ESM configuration. To run tests properly in this environment:

# Run Dashboard Unit Tests

$env:NODE_OPTIONS="--experimental-vm-modules"; npx nx test dashboard

# Run api Unit Tests

npx nx test api

# About this Nx Workspace

This workspace was generated using Nx. Nx provides a powerful set of tools for managing monorepos.

Useful Nx Commands
Visualize Graph: npx nx graph (See how the API and Dashboard are connected).

Generate Code: npx nx generate <plugin>:<generator>

Run Specific Project: npx nx serve <project-name>

Project Structure
apps/api: NestJS application. Contains the JwtStrategy (Auth), TaskService (CRUD & Reorder), and SeedService.

apps/dashboard: Angular 19+ application. Features a custom TaskComponent with @angular/cdk/drag-drop integration.

#API Doc

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
