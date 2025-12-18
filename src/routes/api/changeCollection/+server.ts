import { json } from '@sveltejs/kit';
import { prisma } from '$lib/server/prisma';

export const POST = async ({ request }) => {
	const { legoId, userId, addOrRemove } = await request.json();
	if (addOrRemove) {
		await prisma.user.update({
			where: { id: userId },
			data: {
				collection: {
					connect: { id: legoId }
				}
			}
		});
	} else {
		await prisma.user.update({
			where: { id: userId },
			data: {
				collection: {
					disconnect: { id: legoId }
				}
			}
		});
	}

	return json({ success: true });
};
