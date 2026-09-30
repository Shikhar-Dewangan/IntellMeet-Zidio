# IntellMeet Frontend

Vite + React frontend for **IntellMeet – AI-Powered Enterprise Meeting & Collaboration Platform**.

## Included
- Responsive landing page
- Sign up and sign in flows
- Protected application layout
- Dashboard
- Meetings / meeting room UI
- Chat and collaboration UI
- Tasks / action items
- Teams and projects
- Analytics
- Notifications
- Settings
- Service layer ready for the MERN backend
- LocalStorage demo authentication
- Vite development and production build configuration

## Run
```bash
npm install
npm run dev
```

Open the URL printed by Vite, normally `http://localhost:5173`.

For a production build:
```bash
npm run build
npm run preview
```

The frontend uses mock/local data until the backend API is connected through `VITE_API_URL`.


## Responsive design
This version includes a responsive layout for laptop, tablet, and phone screens:
- Desktop: fixed sidebar + full topbar workspace.
- Tablet: adaptive grids and flexible content widths.
- Phone: slide-out navigation drawer, mobile menu button, compact topbar, single-column cards, and mobile meeting-room layout.
- Landing, authentication, dashboard, meetings, projects, analytics, teams, settings, and meeting-room screens use responsive breakpoints.

## Run locally
```bash
npm install
npm run dev
```
Then open the local Vite URL shown in the terminal.

For a production build:
```bash
npm run build
npm run preview
```
