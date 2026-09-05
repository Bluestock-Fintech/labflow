import pg from 'pg';
import dotenv from 'dotenv';
import dns from 'node:dns';

dotenv.config();

// Prefer Node's own DNS-over-network resolver instead of the OS/c-ares
// getaddrinfo path, which has been unreliable for the Neon hostname in some
// environments (works fine here and also on Vercel's serverless runtime,
// where the earlier `dig`-shellout fix would not work at all).
dns.setDefaultResultOrder('ipv4first');

export const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  max: process.env.VERCEL ? 1 : 10,
});
