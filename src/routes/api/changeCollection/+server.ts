import { json } from '@sveltejs/kit';
import { prisma } from '$lib/server/prisma';

export const POST = async ({ request }) => {
	const { legoId, userId, addOrRemove } = await request.json();
	const user = await prisma.user.findUnique({
		where: { id: userId },
		include: { collection: true }
	});
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
		console.log('deleted', user);
	}

	return json({ success: true });
};
