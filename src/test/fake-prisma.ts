/**
 * Fausse base Prisma en mémoire pour les tests unitaires des services.
 * Couvre uniquement les opérations utilisées par les services testés, avec :
 * - contraintes d'unicité (erreur { code: 'P2002' } comme Prisma) ;
 * - transactions interactives avec annulation (rollback) si erreur.
 */
type Row = Record<string, unknown>;
type Where = Record<string, unknown>;

type ModelDef = {
	unique: string[][];
	ci?: string[];
	defaults?: () => Row;
	composite?: Record<string, string[]>;
};

const MODELS: Record<string, ModelDef> = {
	user: { unique: [['id'], ['email'], ['username']], ci: ['username'] },
	lego: { unique: [['id'], ['setNumber']] },
	session: { unique: [['id']] },
	passwordResetToken: { unique: [['id'], ['tokenHash']] },
	collectionItem: {
		unique: [['userId', 'legoId']],
		composite: { userId_legoId: ['userId', 'legoId'] }
	},
	wishlistItem: {
		unique: [['id'], ['userId', 'legoId']],
		composite: { userId_legoId: ['userId', 'legoId'] }
	}
};

let seq = 0;
const now = () => new Date();

function cmp(a: unknown, b: unknown) {
	const x = a instanceof Date ? a.getTime() : (a as number);
	const y = b instanceof Date ? b.getTime() : (b as number);
	return x - y;
}

function matchValue(v: unknown, cond: unknown): boolean {
	if (cond === null) return v == null;
	if (cond instanceof Date) return v instanceof Date && v.getTime() === cond.getTime();
	if (typeof cond === 'object' && !Array.isArray(cond)) {
		const c = cond as Record<string, unknown>;
		const ci = c.mode === 'insensitive';
		const norm = (s: unknown) => (ci && typeof s === 'string' ? s.toLowerCase() : s);
		for (const [op, arg] of Object.entries(c)) {
			if (op === 'mode') continue;
			if (op === 'equals' && norm(v) !== norm(arg)) return false;
			if (op === 'not' && matchValue(v, arg)) return false;
			if (op === 'in' && !(arg as unknown[]).includes(v)) return false;
			if (op === 'gt' && !(v != null && cmp(v, arg) > 0)) return false;
			if (op === 'gte' && !(v != null && cmp(v, arg) >= 0)) return false;
			if (op === 'lt' && !(v != null && cmp(v, arg) < 0)) return false;
			if (op === 'lte' && !(v != null && cmp(v, arg) <= 0)) return false;
			if (op === 'contains' && !String(norm(v)).includes(String(norm(arg)))) return false;
			if (op === 'startsWith' && !String(norm(v)).startsWith(String(norm(arg)))) return false;
		}
		return true;
	}
	return v === cond;
}

function matches(row: Row, where: Where | undefined, def: ModelDef): boolean {
	if (!where) return true;
	for (const [k, cond] of Object.entries(where)) {
		if (k === 'AND') {
			if (!(cond as Where[]).every((w) => matches(row, w, def))) return false;
		} else if (k === 'OR') {
			if (!(cond as Where[]).some((w) => matches(row, w, def))) return false;
		} else if (k === 'NOT') {
			if (matches(row, cond as Where, def)) return false;
		} else if (def.composite?.[k]) {
			if (!def.composite[k].every((f) => row[f] === (cond as Row)[f])) return false;
		} else if (!matchValue(row[k], cond)) return false;
	}
	return true;
}

export function createFakePrisma() {
	let db: Record<string, Row[]> = Object.fromEntries(Object.keys(MODELS).map((m) => [m, []]));

	function checkUnique(model: string, row: Row, exceptRow?: Row) {
		const def = MODELS[model];
		for (const fields of def.unique) {
			const clash = db[model].find(
				(r) =>
					r !== exceptRow &&
					fields.every((f) =>
						def.ci?.includes(f) && typeof r[f] === 'string'
							? (r[f] as string).toLowerCase() === String(row[f]).toLowerCase()
							: r[f] === row[f]
					)
			);
			if (clash)
				throw Object.assign(new Error(`Unique constraint failed on ${fields.join(',')}`), {
					code: 'P2002',
					meta: { target: fields }
				});
		}
	}

	function model(name: string) {
		const def = MODELS[name];
		const rows = () => db[name];
		const create = ({ data }: { data: Row }) => {
			const row: Row = { id: `${name}_${++seq}`, createdAt: now(), ...data };
			if (name === 'collectionItem') row.addedAt ??= now();
			if (name === 'wishlistItem') row.priority ??= 'MANDATORY';
			if (name === 'collectionItem') delete row.id;
			checkUnique(name, row);
			rows().push(row);
			return { ...row };
		};
		const findFirst = ({ where }: { where?: Where } = {}) => {
			const r = rows().find((x) => matches(x, where, def));
			return r ? { ...r } : null;
		};
		return {
			create: async (a: { data: Row }) => create(a),
			findUnique: async (a: { where: Where }) => findFirst(a),
			findFirst: async (a: { where?: Where } = {}) => findFirst(a),
			findUniqueOrThrow: async (a: { where: Where }) => {
				const r = findFirst(a);
				if (!r) throw Object.assign(new Error('Not found'), { code: 'P2025' });
				return r;
			},
			findMany: async ({ where }: { where?: Where } = {}) =>
				rows()
					.filter((x) => matches(x, where, def))
					.map((r) => ({ ...r })),
			count: async ({ where }: { where?: Where } = {}) =>
				rows().filter((x) => matches(x, where, def)).length,
			update: async ({ where, data }: { where: Where; data: Row }) => {
				const r = rows().find((x) => matches(x, where, def));
				if (!r) throw Object.assign(new Error('Not found'), { code: 'P2025' });
				checkUnique(name, { ...r, ...data }, r);
				Object.assign(r, data);
				return { ...r };
			},
			updateMany: async ({ where, data }: { where?: Where; data: Row }) => {
				const list = rows().filter((x) => matches(x, where, def));
				list.forEach((r) => Object.assign(r, data));
				return { count: list.length };
			},
			upsert: async ({
				where,
				create: c,
				update: u
			}: {
				where: Where;
				create: Row;
				update: Row;
			}) => {
				const r = rows().find((x) => matches(x, where, def));
				if (r) {
					Object.assign(r, u);
					return { ...r };
				}
				return create({ data: c });
			},
			delete: async ({ where }: { where: Where }) => {
				const i = rows().findIndex((x) => matches(x, where, def));
				if (i < 0) throw Object.assign(new Error('Not found'), { code: 'P2025' });
				const [r] = rows().splice(i, 1);
				// cascade utilisateur
				if (name === 'user')
					for (const m of ['session', 'passwordResetToken', 'collectionItem', 'wishlistItem'])
						db[m] = db[m].filter((x) => x.userId !== r.id);
				return r;
			},
			deleteMany: async ({ where }: { where?: Where } = {}) => {
				const before = rows().length;
				db[name] = rows().filter((x) => !matches(x, where, def));
				return { count: before - db[name].length };
			}
		};
	}

	const client = {
		user: model('user'),
		lego: model('lego'),
		session: model('session'),
		passwordResetToken: model('passwordResetToken'),
		collectionItem: model('collectionItem'),
		wishlistItem: model('wishlistItem'),
		async $transaction(arg: unknown) {
			if (Array.isArray(arg)) return Promise.all(arg);
			const snapshot = structuredClone(db);
			try {
				return await (arg as (tx: typeof client) => Promise<unknown>)(client);
			} catch (e) {
				db = snapshot;
				throw e;
			}
		},
		/** Accès direct aux tables pour préparer / vérifier les tests. */
		_db: () => db,
		_reset: () => {
			db = Object.fromEntries(Object.keys(MODELS).map((m) => [m, []]));
		}
	};
	return client;
}

export type FakePrisma = ReturnType<typeof createFakePrisma>;
