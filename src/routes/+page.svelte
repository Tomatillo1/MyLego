<script lang="ts">
	import { resolve } from '$app/paths';
</script>

<main class="flex flex-col gap-4">
	<a href={resolve('/collection')}>My collection</a>
	<a href={resolve('/wishlist')}>My wishlist</a>
	<a href={resolve('/legos-list')}>All legos</a>
</main>
