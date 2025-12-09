import { prisma } from '$lib/server/prisma';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	const legos = await prisma.lego.findMany();
	console.log(legos);
	return { legos };
};
