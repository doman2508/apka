import 'dotenv/config';
import cors from 'cors';
import express from 'express';
import sql from 'mssql';

const app = express();
const port = Number(process.env.PORT || 3001);

app.use(cors());
app.use(express.json());

function parseSqlServerAddress(rawAddress) {
  // Supports values like:
  // - 192.168.1.10
  // - 192.168.1.10,1433
  // - 192.168.1.10\\WEAVER
  // - 192.168.1.10,1433\\WEAVER
  if (!rawAddress) {
    return {};
  }

  const [serverPart, instancePart] = rawAddress.split('\\');
  const [hostPart, portPart] = (serverPart || '').split(',');

  return {
    server: hostPart || undefined,
    port: portPart ? Number(portPart) : undefined,
    instanceName: instancePart || undefined,
  };
}

const parsedAddress = parseSqlServerAddress(process.env.SQL_SERVER || '192.168.1.10,1433\\WEAVER');

const sqlConfig = {
  user: process.env.SQL_USER || 'sa',
  password: process.env.SQL_PASSWORD || 'Wms@12345',
  server: process.env.SQL_HOST || parsedAddress.server || '192.168.1.10',
  database: process.env.SQL_DATABASE || 'wms3',
  options: {
    encrypt: process.env.SQL_ENCRYPT === 'true',
    trustServerCertificate: process.env.SQL_TRUST_CERT !== 'false',
    ...(process.env.SQL_INSTANCE || parsedAddress.instanceName
      ? { instanceName: process.env.SQL_INSTANCE || parsedAddress.instanceName }
      : {}),
  },
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30_000,
  },
};

// Port and instanceName are mutually exclusive in tedious/mssql.
// Prefer explicit SQL_PORT; otherwise use parsed host,port only when no instance is used.
const explicitPort = process.env.SQL_PORT ? Number(process.env.SQL_PORT) : undefined;
if (explicitPort) {
  sqlConfig.port = explicitPort;
  delete sqlConfig.options.instanceName;
} else if (parsedAddress.port && !sqlConfig.options.instanceName) {
  sqlConfig.port = parsedAddress.port;
}

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
    res.json({
      ok: true,
      db: 'connected',
      config: {
        server: sqlConfig.server,
        port: sqlConfig.port || null,
        instanceName: sqlConfig.options.instanceName || null,
        database: sqlConfig.database,
      },
    });
  } catch (error) {
    res.status(500).json({
      ok: false,
      db: 'disconnected',
      details: error instanceof Error ? error.message : String(error),
      config: {
        server: sqlConfig.server,
        port: sqlConfig.port || null,
        instanceName: sqlConfig.options.instanceName || null,
        database: sqlConfig.database,
      },
    });
  }
});

app.listen(port, () => {
  console.log(`API server listening on http://localhost:${port}`);
});
