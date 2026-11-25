import { prisma } from '$lib/server/prisma';
import { sendResetEmail } from '$lib/server/email';
import { hashPassword } from './password';
import { randomToken, sha256 } from './session';

export const RESET_TTL_MS = 30 * 60 * 1000;
export const RESEND_DELAY_MS = 45 * 1000;
const MAX_PER_HOUR = 5;

/**
 * Demande de réinitialisation. Ne révèle jamais si l'email existe : l'appelant
 * affiche toujours le même écran. Renvoi limité (45 s, 5 / heure).
 */
export async function requestPasswordReset(
	email: string,
	origin: string,
	now = new Date()
): Promise<void> {
	const user = await prisma.user.findUnique({
		where: { email },
		select: { id: true, email: true }
	});
	if (!user) return;

	const recent = await prisma.passwordResetToken.findMany({
		where: { userId: user.id, createdAt: { gt: new Date(now.getTime() - 60 * 60 * 1000) } },
		orderBy: { createdAt: 'desc' },
		select: { createdAt: true }
	});
	if (recent.length >= MAX_PER_HOUR) return;
	if (recent[0] && now.getTime() - recent[0].createdAt.getTime() < RESEND_DELAY_MS) return;

	const token = randomToken();
	await prisma.$transaction([
		// Un seul lien valide à la fois : les précédents sont invalidés
		prisma.passwordResetToken.updateMany({
			where: { userId: user.id, usedAt: null },
			data: { usedAt: now }
		}),
		prisma.passwordResetToken.create({
			data: {
				userId: user.id,
				tokenHash: sha256(token),
				expiresAt: new Date(now.getTime() + RESET_TTL_MS),
				createdAt: now
			}
		})
	]);
	await sendResetEmail(user.email, `${origin}/reset-password/${token}`);
}

/** Le lien est-il encore utilisable ? (affichage de la page) */
export async function isResetTokenValid(token: string, now = new Date()): Promise<boolean> {
	const t = await prisma.passwordResetToken.findUnique({
		where: { tokenHash: sha256(token) },
		select: { usedAt: true, expiresAt: true }
	});
	return !!t && !t.usedAt && t.expiresAt > now;
}

/**
 * Consomme le jeton (usage unique, même en cas de requêtes concurrentes),
 * change le mot de passe et ferme toutes les sessions de l'utilisateur.
 */
export async function consumePasswordReset(
	token: string,
	newPassword: string,
	now = new Date()
): Promise<boolean> {
	const passwordHash = await hashPassword(newPassword);
	return prisma.$transaction(async (tx) => {
		const t = await tx.passwordResetToken.findUnique({
			where: { tokenHash: sha256(token) },
			select: { id: true, userId: true, usedAt: true, expiresAt: true }
		});
		if (!t || t.usedAt || t.expiresAt <= now) return false;
		// Verrou optimiste : une seule requête peut passer usedAt de NULL à une date
		const { count } = await tx.passwordResetToken.updateMany({
			where: { id: t.id, usedAt: null },
			data: { usedAt: now }
		});
		if (count !== 1) return false;
		await tx.user.update({ where: { id: t.userId }, data: { passwordHash } });
		await tx.passwordResetToken.updateMany({
			where: { userId: t.userId, usedAt: null },
			data: { usedAt: now }
		});
		await tx.session.deleteMany({ where: { userId: t.userId } });
		return true;
	});
}
export const RESET_EMAIL_COOKIE = 'mylego_reset_email';
