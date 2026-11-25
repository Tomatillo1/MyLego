<script lang="ts">
	import { checkPasswordRules } from '$lib/rules/password';
	import Icon from './Icon.svelte';

	let { password }: { password: string } = $props();
	const r = $derived(checkPasswordRules(password));
</script>

<ul class="rules" aria-label="Règles du mot de passe">
	<li class:ok={r.length}><Icon name={r.length ? 'check' : 'x'} />8 caractères minimum</li>
	<li class:ok={r.upper}><Icon name={r.upper ? 'check' : 'x'} />Une majuscule</li>
	<li class:ok={r.digit}><Icon name={r.digit ? 'check' : 'x'} />Un chiffre</li>
</ul>
