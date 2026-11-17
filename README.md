# Northstar Portal — Industry User Management

A responsive user and admin management portal built with **HTML5, CSS3, vanilla JavaScript, Node.js, Express, EJS and MongoDB**. It uses a Model–View–Template-style separation (Mongoose models, Express controllers/routes, and EJS templates). No React, frontend build tool, or Python runtime is required.

## Features

- User registration and login with server-side validation and browser validation.
- Password hashing with bcrypt (12 salt rounds); passwords are never returned in database queries by default.
- Session-based authentication stored in MongoDB; session ID is regenerated at login/registration.
- Logout, HTTP-only/SameSite cookies, CSRF token validation on form submissions, Helmet security headers, and login/register rate limits.
- Role-based access: `user` and `admin`; public registration can only create standard users.
- Admin dashboard: total, active, inactive and administrator counts; recently registered users.
- Admin user CRUD: create, list/search, update name/email/role/status/password, and delete with browser confirmation.
- Guardrails: an administrator cannot demote, deactivate or delete their own account.
- Responsive desktop/mobile layout and read-only JSON REST endpoints.

## Requirements

Install these on your Windows 10 computer:

1. **Node.js 20 LTS or newer** (Node 18+ is supported). Install the Windows `.msi` from https://nodejs.org/ and keep the option to add Node to PATH enabled. Restart VS Code after installation. Verify with `node -v` and `npm -v`.
2. **MongoDB Community Server 7.x or newer** from https://www.mongodb.com/try/download/community. During setup, install it as a Windows Service. MongoDB Compass is optional but useful for viewing the database: https://www.mongodb.com/products/tools/compass.
3. **Visual Studio Code** (recommended): https://code.visualstudio.com/.
4. A modern browser such as Chrome or Edge.

You do not need Python, React, or a separate frontend server for this project.

## Install and run (Windows PowerShell)

1. Extract the project ZIP to a normal folder, for example `C:\Users\Admin\Desktop\industry-user-management-portal`.
2. Open that folder in VS Code (`File → Open Folder`).
3. Open VS Code Terminal → New Terminal. Confirm Node is available:

   ```powershell
   node -v
   npm -v
   ```

4. Install packages:

   ```powershell
   npm install
   ```

5. Create your local environment file:

   ```powershell
   Copy-Item .env.example .env
   ```

6. Open `.env`. For a local MongoDB service, keep `MONGODB_URI=mongodb://127.0.0.1:27017/industry_portal`. Replace `SESSION_SECRET` with a long random value (at least 32 characters). Set a strong private `ADMIN_PASSWORD` of at least 12 characters. Do not share `.env` or commit it to GitHub.

7. Make sure MongoDB Server is running. If installed as a Windows service, open Windows Services and start **MongoDB Server** if it is stopped. You can also open MongoDB Compass and connect to `mongodb://127.0.0.1:27017`.

8. Create the first administrator account:

   ```powershell
   npm run create-admin
   ```

   The email/password are the values you set in `.env` (`ADMIN_EMAIL` and `ADMIN_PASSWORD`). The script creates or updates that admin account. Keep credentials private.

9. Start the application:

   ```powershell
   npm start
   ```

10. Open **http://localhost:3000**. Sign in with the administrator credentials. Use **User management → Add user** to create accounts, or register a standard user from the sign-in page.

For auto-restart during development, use `npm run dev` instead. Stop the server with `Ctrl + C`.

## Project structure

```text
industry-user-management-portal/
├── public/
│   ├── css/style.css          # Responsive design system
│   └── js/app.js              # Modal, confirmation and client validation
├── scripts/
│   └── create-admin.js        # One-time admin bootstrap
├── src/
│   ├── config/db.js           # MongoDB connection
│   ├── controllers/           # Request/business logic
│   ├── middleware/auth.js     # Authentication, roles and CSRF
│   ├── models/User.js         # Mongoose user model
│   ├── routes/                # URL-to-controller mapping
│   ├── views/                 # EJS templates (HTML views)
│   ├── app.js                 # Express app and middleware
│   └── server.js              # Startup
├── .env.example
├── .gitignore
├── package.json
└── README.md
```

### MVT-style design mapping

- **Model:** `src/models/User.js` defines the MongoDB user schema and password hashing.
- **View/controller logic:** `src/controllers/` reads requests, validates input and coordinates database operations. Express routes map URLs to controllers.
- **Template:** `src/views/` contains EJS templates that render HTML pages.

Express projects commonly call this MVC; this layout gives the requested separation of Model, View and Template responsibilities without adding Django/Python.

## Database structure

Database: `industry_portal` (configurable in `MONGODB_URI`)

Collection: `users`

| Field | Type | Description |
|---|---|---|
| `_id` | ObjectId | MongoDB primary key |
| `name` | String | 2–70 character display name |
| `email` | String | Unique, lowercase email |
| `password` | String | bcrypt hash; excluded from normal queries |
| `role` | String | `user` or `admin` |
| `status` | String | `active` or `inactive` |
| `lastLoginAt` | Date | Last successful login |
| `createdAt`, `updatedAt` | Date | Mongoose timestamps |

Collection: `sessions` is created/managed by `connect-mongo` for server-side sessions.

## REST API endpoints

All responses are JSON for `/api/...`. Admin endpoints require an authenticated active admin session. User records never include password hashes.

| Method | Endpoint | Access | Purpose |
|---|---|---|---|
| GET | `/api/health` | Public | Application/database health response |
| GET | `/api/admin/stats` | Admin | Dashboard counts |
| GET | `/api/admin/users` | Admin | Up to 200 user records |

The browser form routes provide the complete write CRUD flow and are protected with session authentication and CSRF validation:

| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/register` | Register a standard user |
| POST | `/login` | Sign in |
| POST | `/logout` | Sign out |
| POST | `/admin/users` | Create user |
| POST | `/admin/users/:id/update` | Update user |
| POST | `/admin/users/:id/delete` | Delete user |

For API clients, use the authenticated session cookie. Do not expose administrator credentials or the session secret in frontend code.

## Checks and troubleshooting

- Run the built-in syntax check: `npm run check`.
- If `node` is not recognized, install Node.js LTS, close all VS Code windows, reopen VS Code, and retry `node -v`.
- If MongoDB connection fails, check the Windows MongoDB service and confirm the URI/port in `.env`.
- If startup reports a short/missing session secret, set `SESSION_SECRET` to at least 32 characters.
- If port 3000 is occupied, change `PORT=3001` in `.env` and visit `http://localhost:3001`.
- If you change `.env`, restart the Node server.

## Production deployment notes

Before deploying publicly: use HTTPS, set `NODE_ENV=production`, use a strong unique session secret, use a managed MongoDB deployment with network access restricted, set backups and monitoring, configure a reverse proxy/trusted proxy correctly if used, and add an operational password-reset/email verification flow. This starter includes secure foundations but should receive a deployment-specific security review before handling real industry/customer data.
