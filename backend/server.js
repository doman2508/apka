import 'dotenv/config';
import cors from 'cors';
import express from 'express';
import sql from 'mssql';

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

const sqlConfig = {
  user: process.env.SQL_USER || 'sa',
  password: process.env.SQL_PASSWORD || 'Wms@12345',
  server: process.env.SQL_HOST || '192.168.1.10',
  database: process.env.SQL_DATABASE || 'wms3',
  port: Number(process.env.SQL_PORT || 1433),
  options: {
    encrypt: false,
    trustServerCertificate: true,
    instanceName: process.env.SQL_INSTANCE || 'WEAVER',
  },
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30_000,
  },
};

let poolPromise;

function getPool() {
  if (!poolPromise) {
    poolPromise = sql.connect(sqlConfig);
  }
  return poolPromise;
}

app.get('/api/materials-summary', async (_req, res) => {
  try {
    const pool = await getPool();
    const result = await pool.request().query(`
      SELECT
        m.id AS Id,
        m.Reference,
        m.Name,
        COALESCE(SUM(lu.Quantity), 0) AS TotalQuantity
      FROM dbo_Materials m
      LEFT JOIN dbo_LogisticUnits lu ON lu.material = m.id
      GROUP BY m.id, m.Reference, m.Name
      ORDER BY m.Name ASC;
    `);

    res.json(result.recordset);
  } catch (error) {
    console.error('Failed to load materials summary', error);
    res.status(500).json({
      message: 'Could not fetch materials summary',
      details: error instanceof Error ? error.message : String(error),
    });
  }
});

app.get('/api/health', async (_req, res) => {
  try {
    await getPool();
    res.json({ ok: true, db: 'connected' });
  } catch (error) {
    res.status(500).json({ ok: false, db: 'disconnected', details: String(error) });
  }
});

app.listen(port, () => {
  console.log(`API server listening on http://localhost:${port}`);
});
