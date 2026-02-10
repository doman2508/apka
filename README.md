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
2. Configure SQL connection by copying `backend/.env.example` to `backend/.env` and adjusting if needed.
3. Run API:
   ```bash
   npm run dev:backend
   ```
4. Run UI (new terminal):
   ```bash
   npm run dev:frontend
   ```

## API endpoint

- `GET /api/materials-summary`

SQL query used:

```sql
SELECT
  m.id AS Id,
  m.Reference,
  m.Name,
  COALESCE(SUM(lu.Quantity), 0) AS TotalQuantity
FROM dbo_Materials m
LEFT JOIN dbo_LogisticUnits lu ON lu.material = m.id
GROUP BY m.id, m.Reference, m.Name
ORDER BY m.Name ASC;
```
