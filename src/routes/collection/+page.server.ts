import { prisma } from '$lib/server/prisma';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	const userCollection = await prisma.user.findUnique({
		where: { id: 'dff89fe8-baac-421e-b5f3-75b9584264b1' },
		include: { collection: true }
	});
	return { userCollection };
};
