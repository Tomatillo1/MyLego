<script lang="ts">
	import { resolve } from '$app/paths';
	import { enhance } from '$app/forms';
	import AuthHero from '$lib/components/AuthHero.svelte';
	import Field from '$lib/components/Field.svelte';
	import Icon from '$lib/components/Icon.svelte';
	import PasswordRules from '$lib/components/PasswordRules.svelte';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();
	let password = $state('');
	let busy = $state(false);
</script>

<svelte:head
	><title>Nouveau mot de passe · myLego</title><meta
		name="referrer"
		content="no-referrer"
	/></svelte:head
>

<a class="round-btn" href={resolve('/login')} aria-label="Retour"><Icon name="back" /></a>
{#if !data.valid}
	<AuthHero
		icon="lock"
		title="Lien expiré"
		sub="Ce lien de réinitialisation n’est plus valable (30 minutes, usage unique)."
	/>
	<a class="btn btn-primary" href={resolve('/forgot-password')}>Demander un nouveau lien</a>
{:else}
	<AuthHero
		icon="lock"
		title="Nouveau mot de passe"
		sub="Choisis un mot de passe que tu n’utilises pas ailleurs."
	/>
	<form
		method="POST"
		novalidate
		use:enhance={() => {
			busy = true;
			return async ({ update }) => {
				await update({ reset: false });
				busy = false;
			};
		}}
	>
		{#if form?.errors?.form}<p class="form-error" role="alert">{form.errors.form}</p>{/if}
		<Field
			label="Nouveau mot de passe"
			name="password"
			icon="lock"
			type="password"
			autocomplete="new-password"
			required
			reveal
			bind:value={password}
			error={form?.errors?.password}
		/>
		<Field
			label="Confirmer"
			name="confirm"
			icon="lock"
			type="password"
			autocomplete="new-password"
			required
			error={form?.errors?.confirm}
		/>
		<PasswordRules {password} />
		<button class="btn btn-primary" type="submit" disabled={busy}>Enregistrer</button>
	</form>
{/if}
