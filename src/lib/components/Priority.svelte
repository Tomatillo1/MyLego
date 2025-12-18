<script lang="ts">
	type Props = {
		addLego: (priority: string) => void;
	};
	let props: Props = $props();

	let selected = $state('MANDATORY');
</script>

<main class="flex flex-col gap-2 p-2">
	<label for="priority-select">What priority:</label>

	<select name="priority" id="priority-select" bind:value={selected}>
		<option value="MANDATORY" selected>Mandatory</option>
		<option value="IF_POSSIBLE">If possible</option>
		<option value="IF_MONEY">If money</option>
	</select>
	<button
		onclick={() => props.addLego(selected)}
		class="border-2 border-black rounded-3xl px-4 py-2">Validate</button
	>
</main>
