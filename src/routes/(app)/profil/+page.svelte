<script lang="ts">
	import { enhance } from '$app/forms';
	import { formatInt } from '$lib/domain';
	import { showToast } from '$lib/toast.svelte';
	import Avatar from '$lib/components/Avatar.svelte';
	import Field from '$lib/components/Field.svelte';
	import Icon from '$lib/components/Icon.svelte';
	import OfflineBanner from '$lib/components/OfflineBanner.svelte';
	import PasswordRules from '$lib/components/PasswordRules.svelte';
	import Sheet from '$lib/components/Sheet.svelte';
	import Topbar from '$lib/components/Topbar.svelte';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();

	const AVATAR_MAX = 2 * 1024 * 1024;
	const AVATAR_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

	let username = $state('');
	let email = $state('');
	let currentPassword = $state('');
	let newPassword = $state('');
	let confirm = $state('');
	let pwdOpen = $state(false);
	let sheet = $state<'save' | 'logout' | 'delete' | null>(null);
	let deletePwd = $state('');
	let busy = $state(false);
	let profileForm: HTMLFormElement | undefined = $state();
	let avatarForm: HTMLFormElement | undefined = $state();
	let avatarError = $state<string | null>(null);

	function resetFields() {
		username = data.user.username;
		email = data.user.email;
		currentPassword = newPassword = confirm = '';
	}
	$effect(() => {
		// Réinitialise quand les données serveur changent (après enregistrement)
		void data.user.username;
		void data.user.email;
		resetFields();
	});
	$effect(() => {
		if (form?.scope === 'update' && 'values' in form && form.values) {
			username = form.values.username;
			email = form.values.email;
			if (form.errors?.currentPassword || form.errors?.newPassword || form.errors?.confirm)
				pwdOpen = true;
		}
	});

	const errors = $derived<Record<string, string>>(
		form?.scope === 'update' && 'errors' in form ? (form.errors ?? {}) : {}
	);
	const usernameDirty = $derived(username.trim() !== data.user.username);
	const emailDirty = $derived(email.trim().toLowerCase() !== data.user.email);
	const pwdDirty = $derived(newPassword !== '');
	const dirty = $derived(usernameDirty || emailDirty || pwdDirty);
	const memberSince = $derived(
		new Date(data.user.createdAt).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
	);

	function onAvatarPick(e: Event) {
		const input = e.currentTarget as HTMLInputElement;
		const f = input.files?.[0];
		avatarError = null;
		if (!f) return;
		if (!AVATAR_TYPES.includes(f.type)) avatarError = 'Formats acceptés : JPEG, PNG ou WebP';
		else if (f.size > AVATAR_MAX) avatarError = 'Image trop lourde (2 Mo maximum)';
		if (avatarError) {
			input.value = '';
			return;
		}
		avatarForm?.requestSubmit();
	}
</script>

<svelte:head><title>Mon profil · myLego</title></svelte:head>

<Topbar title="Mon profil" />
<main class="content">
	<OfflineBanner />
	<div class="profile-hero">
		<div class="avatar-xl">
			<Avatar username={data.user.username} version={data.user.avatarVersion} xl />
			<form
				bind:this={avatarForm}
				method="POST"
				action="?/avatar"
				enctype="multipart/form-data"
				use:enhance={() => {
					busy = true;
					return async ({ result, update }) => {
						busy = false;
						if (result.type === 'failure')
							avatarError = (result.data?.message as string) ?? 'Erreur';
						else if (result.type === 'success') showToast({ title: 'Avatar mis à jour' });
						await update();
					};
				}}
			>
				<label class="avatar-edit" aria-label="Changer d’avatar">
					<Icon name="camera" />
					<input
						type="file"
						name="avatar"
						accept="image/jpeg,image/png,image/webp"
						onchange={onAvatarPick}
						disabled={busy}
					/>
				</label>
			</form>
		</div>
		<h2>{data.user.username}</h2>
		<p>Membre depuis {memberSince}</p>
		{#if avatarError}<p class="form-error" role="alert" style="margin-top:10px">
				{avatarError}
			</p>{/if}
	</div>

	<div class="stats">
		<div class="stat"><b>{formatInt(data.stats.sets)}</b><span>Sets</span></div>
		<div class="stat"><b>{formatInt(data.stats.pieces)}</b><span>Pièces</span></div>
		<div class="stat"><b>{formatInt(data.stats.wishes)}</b><span>Souhaits</span></div>
	</div>

	<form
		bind:this={profileForm}
		method="POST"
		action="?/update"
		novalidate
		onsubmit={(e) => {
			if (sheet !== 'save') {
				e.preventDefault();
				if (dirty) sheet = 'save';
			}
		}}
		use:enhance={() => {
			busy = true;
			return async ({ result, update }) => {
				busy = false;
				sheet = null;
				if (result.type === 'success') {
					showToast({ title: 'Modifications enregistrées' });
					pwdOpen = false;
				}
				await update({ reset: false });
			};
		}}
	>
		{#if errors.form}<p class="form-error" role="alert">{errors.form}</p>{/if}
		<div class="section-title">Informations</div>
		<Field
			label="Pseudo"
			name="username"
			icon="user"
			autocomplete="username"
			maxlength={20}
			bind:value={username}
			dirty={usernameDirty}
			error={errors.username}
		/>
		<Field
			label="Email"
			name="email"
			icon="mail"
			type="email"
			autocomplete="email"
			bind:value={email}
			dirty={emailDirty}
			error={errors.email}
		/>
		{#if emailDirty && !pwdOpen}
			<Field
				label="Mot de passe actuel (requis pour changer d’email)"
				name="currentPassword"
				icon="lock"
				type="password"
				autocomplete="current-password"
				reveal
				bind:value={currentPassword}
				error={errors.currentPassword}
			/>
		{/if}

		<div class="section-title">Sécurité</div>
		<details class="pwd" bind:open={pwdOpen}>
			<summary><Icon name="lock" />Changer le mot de passe<Icon name="chev" class="chev" /></summary
			>
			<div class="pwd-body">
				{#if pwdOpen}
					<Field
						label="Mot de passe actuel"
						name="currentPassword"
						icon="lock"
						type="password"
						autocomplete="current-password"
						reveal
						bind:value={currentPassword}
						error={errors.currentPassword}
					/>
					<Field
						label="Nouveau mot de passe"
						name="newPassword"
						icon="lock"
						type="password"
						autocomplete="new-password"
						reveal
						bind:value={newPassword}
						error={errors.newPassword}
					/>
					<Field
						label="Confirmer"
						name="confirm"
						icon="lock"
						type="password"
						autocomplete="new-password"
						bind:value={confirm}
						error={errors.confirm}
					/>
					{#if newPassword}<PasswordRules password={newPassword} />{/if}
				{/if}
			</div>
		</details>
		<button class="btn btn-primary" type="submit" disabled={!dirty || busy}
			><Icon name="check" />Enregistrer les modifications</button
		>
	</form>

	<button
		class="btn btn-outline-danger"
		type="button"
		style="margin-top:10px"
		onclick={() => (sheet = 'logout')}><Icon name="logout" />Se déconnecter</button
	>
	<button
		class="danger-link"
		type="button"
		style="width:100%"
		onclick={() => ((deletePwd = ''), (sheet = 'delete'))}>Supprimer mon compte</button
	>
</main>

<!-- Récapitulatif avant enregistrement -->
<Sheet
	open={sheet === 'save'}
	label="Enregistrer les modifications ?"
	onclose={() => (sheet = null)}
	confirm
>
	<div class="big-icon"><Icon name="edit" /></div>
	<h3>Enregistrer les modifications ?</h3>
	<p>Vérifie les changements avant de valider.</p>
	<ul class="changes">
		{#if usernameDirty}<li>
				<span>Pseudo</span><b><s>{data.user.username}</s>{username.trim()}</b>
			</li>{/if}
		{#if emailDirty}<li>
				<span>Email</span><b><s>{data.user.email}</s>{email.trim().toLowerCase()}</b>
			</li>{/if}
		{#if pwdDirty}<li><span>Mot de passe</span><b>Modifié</b></li>{/if}
	</ul>
	<div class="sheet-actions">
		<button class="btn btn-ghost" type="button" onclick={() => (sheet = null)}>Annuler</button>
		<button
			class="btn btn-primary"
			type="button"
			disabled={busy}
			onclick={() => profileForm?.requestSubmit()}>Confirmer</button
		>
	</div>
</Sheet>

<!-- Déconnexion -->
<Sheet open={sheet === 'logout'} label="Se déconnecter ?" onclose={() => (sheet = null)} confirm>
	<div class="big-icon danger"><Icon name="logout" /></div>
	<h3>Se déconnecter ?</h3>
	<p>Tu pourras te reconnecter à tout moment avec ton email.</p>
	<form
		method="POST"
		action="/logout"
		class="sheet-actions"
		onsubmit={() => navigator.serviceWorker?.controller?.postMessage('clear-pages')}
	>
		<button class="btn btn-ghost" type="button" onclick={() => (sheet = null)}>Annuler</button>
		<button class="btn btn-danger" type="submit">Se déconnecter</button>
	</form>
</Sheet>

<!-- Suppression du compte -->
<Sheet
	open={sheet === 'delete'}
	label="Supprimer ton compte ?"
	onclose={() => (sheet = null)}
	confirm
>
	<div class="big-icon danger"><Icon name="trash" /></div>
	<h3>Supprimer ton compte ?</h3>
	<p>
		Ta collection, ta wishlist et ton avatar seront définitivement effacés. Cette action est
		irréversible.
	</p>
	<form
		method="POST"
		action="?/delete"
		onsubmit={() => navigator.serviceWorker?.controller?.postMessage('clear-pages')}
		use:enhance={() => {
			busy = true;
			return async ({ update }) => {
				busy = false;
				await update({ reset: false });
			};
		}}
	>
		<Field
			label="Confirme avec ton mot de passe"
			name="password"
			icon="lock"
			type="password"
			autocomplete="current-password"
			reveal
			bind:value={deletePwd}
			error={form?.scope === 'delete' && 'message' in form ? form.message : null}
		/>
		<div class="sheet-actions">
			<button class="btn btn-ghost" type="button" onclick={() => (sheet = null)}>Annuler</button>
			<button class="btn btn-danger" type="submit" disabled={!deletePwd || busy}>Supprimer</button>
		</div>
	</form>
</Sheet>
