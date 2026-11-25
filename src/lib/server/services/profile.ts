import { prisma } from '$lib/server/prisma';
import { DomainError, isUniqueViolation } from '$lib/server/errors';
import { hashPassword, verifyPassword } from '$lib/server/auth/password';
import { isEmailTaken, isUsernameTaken } from '$lib/server/auth/users';
import { sha256 } from '$lib/server/auth/session';

export async function profileStats(userId: string) {
	const [sets, pieces, wishes] = await Promise.all([
		prisma.collectionItem.count({ where: { userId } }),
		prisma.lego.aggregate({
			where: { collectionItems: { some: { userId } } },
			_sum: { pieces: true }
		}),
		prisma.wishlistItem.count({ where: { userId } })
	]);
	return { sets, pieces: pieces._sum.pieces ?? 0, wishes };
}

export type ProfileUpdate = {
	username: string;
	email: string;
	currentPassword: string;
	newPassword: string;
};

/**
 * Met à jour le profil de l'utilisateur connecté uniquement.
 * Le mot de passe actuel est exigé pour changer d'email ou de mot de passe.
 * Retourne les champs en erreur, ou null si tout est OK.
 */
export async function updateProfile(
	userId: string,
	input: ProfileUpdate,
	currentSessionToken?: string
): Promise<Record<string, string> | null> {
	const user = await prisma.user.findUniqueOrThrow({
		where: { id: userId },
		select: { username: true, email: true, passwordHash: true }
	});
	const emailChanged = input.email !== user.email;
	const usernameChanged = input.username !== user.username;
	const pwdChanged = input.newPassword !== '';
	if (!emailChanged && !usernameChanged && !pwdChanged) return null;

	if (
		(emailChanged || pwdChanged) &&
		!(await verifyPassword(user.passwordHash, input.currentPassword))
	) {
		return { currentPassword: 'Mot de passe actuel incorrect' };
	}
	if (usernameChanged && (await isUsernameTaken(input.username, userId)))
		return { username: 'Ce pseudo est déjà pris.' };
	if (emailChanged && (await isEmailTaken(input.email, userId)))
		return { email: 'Cet email est déjà utilisé.' };

	try {
		await prisma.$transaction(async (tx) => {
			await tx.user.update({
				where: { id: userId },
				data: {
					username: input.username,
					email: input.email,
					...(pwdChanged ? { passwordHash: await hashPassword(input.newPassword) } : {})
				}
			});
			// Changement de mot de passe : on ferme les autres sessions
			if (pwdChanged) {
				await tx.session.deleteMany({
					where: {
						userId,
						...(currentSessionToken ? { NOT: { id: sha256(currentSessionToken) } } : {})
					}
				});
			}
		});
	} catch (e) {
		if (isUniqueViolation(e)) return { username: 'Ce pseudo ou cet email est déjà utilisé.' };
		throw e;
	}
	return null;
}

export async function setAvatar(userId: string, data: Uint8Array<ArrayBuffer>, mime: string) {
	await prisma.user.update({
		where: { id: userId },
		data: { avatar: data, avatarMime: mime, avatarUpdatedAt: new Date() }
	});
}

export async function removeAvatar(userId: string) {
	await prisma.user.update({
		where: { id: userId },
		data: { avatar: null, avatarMime: null, avatarUpdatedAt: null }
	});
}

export async function getAvatar(userId: string) {
	return prisma.user.findUnique({
		where: { id: userId },
		select: { avatar: true, avatarMime: true, avatarUpdatedAt: true }
	});
}

/** Supprime le compte (cascade : sessions, collection, wishlist, jetons). Mot de passe exigé. */
export async function deleteAccount(userId: string, password: string): Promise<void> {
	const user = await prisma.user.findUniqueOrThrow({
		where: { id: userId },
		select: { passwordHash: true }
	});
	if (!(await verifyPassword(user.passwordHash, password)))
		throw new DomainError(403, 'Mot de passe incorrect');
	await prisma.user.delete({ where: { id: userId } });
}
