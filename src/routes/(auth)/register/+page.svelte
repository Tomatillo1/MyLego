<script lang="ts">
	import { resolve } from '$app/paths';
	import { enhance } from '$app/forms';
	import AuthHero from '$lib/components/AuthHero.svelte';
	import Field from '$lib/components/Field.svelte';
	import Icon from '$lib/components/Icon.svelte';
	import { passwordStrength } from '$lib/rules/password';
	import type { PageProps } from './$types';

	let { form }: PageProps = $props();
	let username = $state('');
	let password = $state('');
	let busy = $state(false);
	$effect(() => {
		if (form?.values) username = form.values.username;
	});
	const strength = $derived(passwordStrength(password));
</script>

<svelte:head><title>Créer un compte · myLego</title></svelte:head>

<a class="round-btn" href={resolve('/login')} aria-label="Retour"><Icon name="back" /></a>
<AuthHero title="Crée ton compte" sub="Commence à suivre ta collection en 30 secondes." />

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
		label="Pseudo"
		name="username"
		icon="user"
		autocomplete="username"
		required
		maxlength={20}
		bind:value={username}
		error={form?.errors?.username}
	></Field>
	{#if form?.errors?.username && form?.suggestion}
		<p class="help" style="margin:-8px 0 14px">
			Essaie <button
				type="button"
				class="link"
				onclick={() => (username = form?.suggestion ?? username)}>« {form.suggestion} »</button
			> ?
		</p>
	{/if}
	<Field
		label="Email"
		name="email"
		icon="mail"
		type="email"
		autocomplete="email"
		required
		value={form?.values?.email ?? ''}
		error={form?.errors?.email}
	/>
	<Field
		label="Mot de passe"
		name="password"
		icon="lock"
		type="password"
		autocomplete="new-password"
		required
		reveal
		bind:value={password}
		error={form?.errors?.password}
	>
		{#snippet help()}
			<div class="strength" aria-hidden="true">
				{#each [1, 2, 3, 4] as i (i)}<i class:on={strength.score >= i}></i>{/each}
			</div>
			<div class="help-row">
				<span>{strength.label ? `Force : ${strength.label}` : ''}</span><span
					>8 caractères min., 1 majuscule, 1 chiffre</span
				>
			</div>
		{/snippet}
	</Field>
	<Field
		label="Confirmer le mot de passe"
		name="confirm"
		icon="lock"
		type="password"
		autocomplete="new-password"
		required
		placeholder="••••••••"
		error={form?.errors?.confirm}
	/>
	<button class="btn btn-primary" type="submit" disabled={busy}>Créer mon compte</button>
</form>
<p class="auth-foot">Déjà inscrit ? <a class="link" href={resolve('/login')}>Se connecter</a></p>
