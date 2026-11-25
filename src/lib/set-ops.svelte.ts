import { callAction, failureMessage } from '$lib/actions';
import { network } from '$lib/online.svelte';
import { showToast } from '$lib/toast.svelte';
import type { Priority } from '$lib/domain';
import { SvelteSet } from 'svelte/reactivity';

/** Ids des sets en cours de modification (désactive leurs boutons). */
export const pending = { ids: new SvelteSet<string>() };

async function guarded(legoId: string, fn: () => Promise<void>) {
	if (!network.online) {
		showToast({ title: 'Hors ligne', sub: 'Reconnecte-toi pour modifier ta collection.' });
		return;
	}
	if (pending.ids.has(legoId)) return;
	pending.ids.add(legoId);
	try {
		await fn();
	} finally {
		pending.ids.delete(legoId);
	}
}

function report(r: Awaited<ReturnType<typeof callAction>>): boolean {
	const msg = failureMessage(r);
	if (msg) showToast({ title: 'Oups', sub: msg });
	return !msg;
}

export const collect = (legoId: string) =>
	guarded(legoId, async () => {
		const r = await callAction('?/collect', { legoId });
		if (!report(r) || r.type !== 'success') return;
		const removed = (r.data?.removedPriority as Priority | null) ?? null;
		showToast({
			title: 'Ajouté à ta collection',
			sub: removed ? 'Retiré de ta wishlist' : undefined,
			action: { label: 'Annuler', run: () => void undoCollect(legoId, removed) }
		});
	});

const undoCollect = (legoId: string, priority: Priority | null) =>
	guarded(legoId, async () => {
		report(await callAction('?/undoCollect', { legoId, priority: priority ?? '' }));
	});

export const uncollect = (legoId: string, withUndo = true) =>
	guarded(legoId, async () => {
		const r = await callAction('?/uncollect', { legoId });
		if (!report(r)) return;
		showToast({
			title: 'Retiré de ta collection',
			action: withUndo ? { label: 'Annuler', run: () => void collectSilently(legoId) } : undefined
		});
	});

const collectSilently = (legoId: string) =>
	guarded(legoId, async () => {
		report(await callAction('?/collect', { legoId }));
	});

export const wish = (legoId: string, priority: Priority) =>
	guarded(legoId, async () => {
		const r = await callAction('?/wish', { legoId, priority });
		if (report(r)) showToast({ title: 'Ajouté à ta wishlist' });
	});

export const setPriority = (legoId: string, priority: Priority) =>
	guarded(legoId, async () => {
		const r = await callAction('?/priority', { legoId, priority });
		if (report(r)) showToast({ title: 'Priorité mise à jour' });
	});

export const unwish = (legoId: string, previous: Priority) =>
	guarded(legoId, async () => {
		const r = await callAction('?/unwish', { legoId });
		if (!report(r)) return;
		showToast({
			title: 'Retiré de ta wishlist',
			action: {
				label: 'Annuler',
				run: () =>
					void guarded(
						legoId,
						async () => void report(await callAction('?/wish', { legoId, priority: previous }))
					)
			}
		});
	});
