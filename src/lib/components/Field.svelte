<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { HTMLInputAttributes } from 'svelte/elements';
	import Icon from './Icon.svelte';

	type Props = HTMLInputAttributes & {
		label: string;
		name: string;
		icon: string;
		value?: string;
		error?: string | null;
		help?: Snippet;
		dirty?: boolean;
		reveal?: boolean;
	};
	let {
		label,
		name,
		icon,
		value = $bindable(''),
		error = null,
		help,
		dirty = false,
		reveal = false,
		type = 'text',
		...rest
	}: Props = $props();
	const id = $props.id();
	let shown = $state(false);
</script>

<div class="field" class:error={!!error} class:dirty>
	<label for={id}>{label}</label>
	<div class="input">
		<Icon name={icon} />
		<input
			{id}
			{name}
			type={reveal && shown ? 'text' : type}
			bind:value
			aria-invalid={error ? 'true' : undefined}
			aria-describedby={error || help ? `${id}-help` : undefined}
			{...rest}
		/>
		{#if reveal}
			<button
				type="button"
				class="eye"
				aria-label={shown ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
				aria-pressed={shown}
				onclick={() => (shown = !shown)}
			>
				<Icon name="eye" />
			</button>
		{/if}
	</div>
	{#if error}
		<span class="help" id="{id}-help" role="alert">{error}</span>
	{:else if help}
		<span id="{id}-help">{@render help()}</span>
	{/if}
</div>
