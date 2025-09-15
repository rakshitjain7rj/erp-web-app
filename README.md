# ERP Web App

## Production Environment Variables (Render)
Set these in your Render Dashboard (Service -> Environment):

```
CORS_ORIGIN=https://erp-web-app-g2e8.onrender.com
DB_HOST=dpg-d2t74j15pdvs73991icg-a
DB_NAME=erp_db_n4av
DB_PASSWORD=REDACTED_IN_FAVOR_OF_URI
DB_PORT=5432
DB_USER=erp_db_n4av_user
JWT_EXPIRES_IN=7d
JWT_SECRET=prod_6ae3d4e4c6b5420cb4e4b6d9b1f7b71e_9f8f7d6c
NODE_ENV=production
PORT=10000
POSTGRES_URI=postgresql://erp_db_n4av_user:2XElhNYckOUTcVaCYl3nIrJJH5JqAPQZ@dpg-d2t74j15pdvs73991icg-a/erp_db_n4av
```

Notes:
- `POSTGRES_URI` (single connection string) is preferred; when present the discrete DB_* variables are ignored by the code. Keep DB_* only for reference/backups.
- On Render you normally do NOT set `PORT`; Render injects one. Keeping it here for clarity, but the app already uses `process.env.PORT || 5000`.
- If you add a custom domain, append it to `CORS_ORIGIN` or use `CORS_ORIGINS` with a comma separated list.
- Ensure you rotate `JWT_SECRET` if it was ever committed publicly.

## Local Development Example (.env.development)
```
NODE_ENV=development
POSTGRES_URI=postgres://postgres:postgres@localhost:5432/yarn_erp
JWT_SECRET=dev_change_me
JWT_EXPIRES_IN=7d
CORS_ORIGINS=http://localhost:5173,http://localhost:3000
LOG_TO_FILE=true
LOG_DIR=./logs
```

## Start (Backend)
From `server/` directory:
```
npm install
npm run dev
```

## Frontend
See `erp-frontend/README.md` for frontend specific setup.
