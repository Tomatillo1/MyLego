import { navCounts } from '$lib/server/services/wishlist';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals }) => {
	const user = locals.user!; // garanti par hooks.server.ts
	return {
		user: {
			username: user.username,
			email: user.email,
			createdAt: user.createdAt,
			avatarVersion: user.avatarVersion
		},
		counts: await navCounts(user.id)
	};
};
