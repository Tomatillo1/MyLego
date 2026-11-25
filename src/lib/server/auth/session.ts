import { createHash, randomBytes } from 'node:crypto';
import type { Cookies } from '@sveltejs/kit';
import { dev } from '$app/environment';
import { prisma } from '$lib/server/prisma';

export const SESSION_COOKIE = 'mylego_session';
const DAY = 24 * 60 * 60 * 1000;
const SESSION_TTL = 30 * DAY;
const RENEW_BEFORE = 15 * DAY;

export const sha256 = (v: string) => createHash('sha256').update(v).digest('hex');
export const randomToken = () => randomBytes(32).toString('base64url');

export type SessionUser = {
	id: string;
	email: string;
	username: string;
	createdAt: Date;
	avatarVersion: number | null;
};

export async function createSession(userId: string, cookies: Cookies) {
	const token = randomToken();
	const expiresAt = new Date(Date.now() + SESSION_TTL);
	await prisma.session.create({ data: { id: sha256(token), userId, expiresAt } });
	setCookie(cookies, token, expiresAt);
}

export async function validateSession(
	token: string | undefined,
	cookies: Cookies
): Promise<SessionUser | null> {
	if (!token) return null;
	const id = sha256(token);
	const session = await prisma.session.findUnique({
		where: { id },
		include: {
			user: {
				select: { id: true, email: true, username: true, createdAt: true, avatarUpdatedAt: true }
			}
		}
	});
	if (!session) return null;
	const now = Date.now();
	if (session.expiresAt.getTime() <= now) {
		await prisma.session.deleteMany({ where: { id } });
		return null;
	}
	if (session.expiresAt.getTime() - now < RENEW_BEFORE) {
		const expiresAt = new Date(now + SESSION_TTL);
		await prisma.session.update({ where: { id }, data: { expiresAt } });
		setCookie(cookies, token, expiresAt);
	}
	const { avatarUpdatedAt, ...u } = session.user;
	return { ...u, avatarVersion: avatarUpdatedAt ? avatarUpdatedAt.getTime() : null };
}

export async function destroySession(token: string | undefined, cookies: Cookies) {
	if (token) await prisma.session.deleteMany({ where: { id: sha256(token) } });
	cookies.delete(SESSION_COOKIE, { path: '/' });
}

function setCookie(cookies: Cookies, token: string, expires: Date) {
	cookies.set(SESSION_COOKIE, token, {
		path: '/',
		httpOnly: true,
		sameSite: 'lax',
		secure: !dev,
		expires
	});
}
