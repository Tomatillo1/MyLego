export type ToastData = {
	id: number;
	title: string;
	sub?: string;
	action?: { label: string; run: () => void };
};

let seq = 0;
export const toast = $state<{ current: ToastData | null }>({ current: null });
let timer: ReturnType<typeof setTimeout> | undefined;

export function showToast(t: Omit<ToastData, 'id'>, ms = 6000) {
	clearTimeout(timer);
	toast.current = { ...t, id: ++seq };
	timer = setTimeout(() => (toast.current = null), ms);
}

export function hideToast() {
	clearTimeout(timer);
	toast.current = null;
}
