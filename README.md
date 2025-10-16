
EMR Backend (Regenerated)
=========================

This regenerated backend is Node.js + Express, designed to work with MS SQL Server and OpenAI/local LLMs.
It includes:
- Auth (JWT)
- Patients, Visits, Prescriptions, Lab upload + OCR
- Model registry + unified LLM adapter (OpenAI & local)
- Alerts (socket.io + email) and retrain cron
- Dockerfile and docker-compose example

Quick start (development):
1. Create a database in SQL Server and run the schema in `database/schema.sql`
2. Copy `.env.example` to `.env` and fill values.
3. npm install
4. npm run dev  (requires nodemon) or npm start

Docker:
- Use the provided docker-compose.yml for MSSQL + backend; adjust env secrets.
