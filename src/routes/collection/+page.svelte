<script lang="ts">
	import type { PageProps } from './$types';

	let props: PageProps = $props();
	$inspect(props.data.legos[0].name);
</script>

<main class="flex flex-col g-4"></main>
