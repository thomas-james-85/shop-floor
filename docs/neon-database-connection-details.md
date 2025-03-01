# Neon PostgreSQL Database Connection Details

## Connection Information

| Parameter | Value |
|-----------|-------|
| Host | `ep-summer-shadow-abphzfik-pooler.eu-west-2.aws.neon.tech` |
| Port | `5432` |
| Database | `neondb` |
| User | `neondb_owner` |
| Password | `npg_gB2ZwI3OnJmW` |

## Connection Strings

### Standard PostgreSQL Connection String
```
postgresql://neondb_owner:npg_gB2ZwI3OnJmW@ep-summer-shadow-abphzfik-pooler.eu-west-2.aws.neon.tech/neondb?sslmode=require
```

### Connection Environment Variables

#### Node.js / Next.js Environment Variables
```
PGHOST='ep-summer-shadow-abphzfik-pooler.eu-west-2.aws.neon.tech'
PGDATABASE='neondb'
PGUSER='neondb_owner'
PGPASSWORD='npg_gB2ZwI3OnJmW'
```

#### For use with the db.ts adapter
```
NEON_HOST=ep-summer-shadow-abphzfik-pooler.eu-west-2.aws.neon.tech
NEON_PORT=5432
NEON_DATABASE=neondb
NEON_USER=neondb_owner
NEON_PASSWORD=npg_gB2ZwI3OnJmW
```

#### Single connection string format
```
NEON_CONNECTION_STRING=postgresql://neondb_owner:npg_gB2ZwI3OnJmW@ep-summer-shadow-abphzfik-pooler.eu-west-2.aws.neon.tech/neondb?sslmode=require
```

## Connection Code Samples

### Node.js with pg
```javascript
const { Pool } = require('pg');

const pool = new Pool({
  host: 'ep-summer-shadow-abphzfik-pooler.eu-west-2.aws.neon.tech',
  database: 'neondb',
  user: 'neondb_owner',
  password: 'npg_gB2ZwI3OnJmW',
  port: 5432,
  ssl: {
    rejectUnauthorized: false
  }
});
```

### Prisma Schema Configuration
```prisma
datasource db {
  provider = "postgresql"
  url      = "postgresql://neondb_owner:npg_gB2ZwI3OnJmW@ep-summer-shadow-abphzfik-pooler.eu-west-2.aws.neon.tech/neondb?sslmode=require"
}
```

### Sequelize
```javascript
const { Sequelize } = require('sequelize');

const sequelize = new Sequelize('neondb', 'neondb_owner', 'npg_gB2ZwI3OnJmW', {
  host: 'ep-summer-shadow-abphzfik-pooler.eu-west-2.aws.neon.tech',
  dialect: 'postgres',
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false
    }
  }
});
```

### Drizzle ORM Configuration
```typescript
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';

const pool = new Pool({
  host: 'ep-summer-shadow-abphzfik-pooler.eu-west-2.aws.neon.tech',
  database: 'neondb',
  user: 'neondb_owner',
  password: 'npg_gB2ZwI3OnJmW',
  port: 5432,
  ssl: true
});

const db = drizzle(pool);
```

## Security Notes

- Consider storing these credentials in a secure environment variable management system
- For production use, it's recommended to use environment variables rather than hardcoded strings
- Create separate database users with appropriate permissions for different applications
- Rotate the password periodically for enhanced security

## Neon Dashboard

Access the Neon dashboard to manage your database:
- URL: https://console.neon.tech/
- Sign in with your Neon account credentials

## Troubleshooting

Common issues:
- Connection timeout: Check firewall settings and IP restrictions
- Authentication failed: Verify username and password
- SSL required: Ensure SSL configuration is correctly set up
- Connection pooling: Use the pooler endpoint for connection pooling benefits

## Additional Resources

- [Neon Documentation](https://neon.tech/docs)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Node-Postgres Documentation](https://node-postgres.com/)
