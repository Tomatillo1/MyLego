<script lang="ts">
	import { resolve } from '$app/paths';
	import Avatar from './Avatar.svelte';

	type Props = { username: string; avatarVersion: number | null };
	let { username, avatarVersion }: Props = $props();
</script>

<header class="app-header">
	<div class="hello"><small>Bonjour,</small><strong>{username}</strong></div>
	<a class="avatar" href={resolve('/profil')} aria-label="Mon profil"
		><Avatar {username} version={avatarVersion} /></a
	>
</header>
