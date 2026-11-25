/**
 * Script unique : hache en argon2id les mots de passe encore stockés en clair
 * (antérieurs à la migration 1_auth_and_design). Idempotent.
 * Usage : node scripts/rehash-legacy-passwords.ts
 */
import 'dotenv/config';
import pg from 'pg';
import { hash } from '@node-rs/argon2';

const OPTIONS = { memoryCost: 19456, timeCost: 2, parallelism: 1, outputLen: 32 };

const client = new pg.Client({ connectionString: process.env.DATABASE_URL });
await client.connect();
try {
	const { rows } = await client.query<{ id: string; passwordHash: string }>(
		`SELECT "id", "passwordHash" FROM "User" WHERE "passwordHash" NOT LIKE '$argon2%'`
	);
	for (const row of rows) {
		const h = await hash(row.passwordHash, OPTIONS);
		await client.query(`UPDATE "User" SET "passwordHash" = $1 WHERE "id" = $2`, [h, row.id]);
	}
	console.log(`${rows.length} mot(s) de passe haché(s).`);
} finally {
	await client.end();
}
