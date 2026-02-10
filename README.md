# WMS Materials Summary App

Simple React + Tailwind UI with an Express API that connects to SQL Server and returns:
- `Reference` and `Name` from `dbo_Materials`
- `SUM(Quantity)` from `dbo_LogisticUnits`
- Joined on `dbo_LogisticUnits.material = dbo_Materials.id`

## Project structure

- `frontend/` - React + Vite + Tailwind client
- `backend/` - Express API with SQL Server (`mssql`)

## Setup

1. Install dependencies:
   ```bash
   npm run install:all
   ```
2. Configure SQL connection by copying `backend/.env.example` to `backend/.env`.

   You can use either:
   - `SQL_SERVER=192.168.1.10,1433\WEAVER` (single string), or
   - `SQL_HOST`, `SQL_PORT`, and optional `SQL_INSTANCE` fields.

   > Important: SQL Server drivers treat `port` and `instanceName` as mutually exclusive.
   > If `SQL_PORT` is set, the backend will prefer port-based connection and ignore instance.

3. (Optional) If frontend is served from a different host/port, set API base URL:
   ```bash
   echo 'VITE_API_BASE_URL=http://localhost:3001' > frontend/.env
   ```

4. Run API:
   ```bash
   npm run dev:backend
   ```
5. Run UI (new terminal):
   ```bash
   npm run dev:frontend
   ```

## Connectivity check

Use these endpoints to diagnose SQL connection and query issues:

```bash
curl http://localhost:3001/api/health
curl http://localhost:3001/api/materials-summary
```

## API endpoint

- `GET /api/materials-summary`

SQL query used:

```sql
SELECT
  m.id AS Id,
  m.Reference,
  m.Name,
  COALESCE(SUM(TRY_CONVERT(decimal(18, 2), lu.Quantity)), 0) AS TotalQuantity
FROM dbo_Materials m
LEFT JOIN dbo_LogisticUnits lu ON lu.material = m.id
GROUP BY m.id, m.Reference, m.Name
ORDER BY m.Name ASC;
```
