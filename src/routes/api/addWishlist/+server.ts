import { json } from '@sveltejs/kit';
import { prisma } from '$lib/server/prisma';

export const POST = async ({ request }) => {
	const { priority, userId, selectedIdLegoWL, addOrRemove } = await request.json();

	if (addOrRemove) {
		await prisma.wishlistItem.create({
			data: {
				userId: userId,
				legoId: selectedIdLegoWL,
				priority: priority
			}
		});
	} else {
		await prisma.wishlistItem.delete({
			where: {
				userId_legoId: {
					userId: userId,
					legoId: selectedIdLegoWL
				}
			}
		});
	}

	return json({ success: true });
};
