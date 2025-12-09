<script lang="ts">
	import { resolve } from '$app/paths';
</script>

<main class="flex flex-col gap-4">
	<a href={resolve('/collection')}>Collection</a>
	<a href={resolve('/wishlist')}>Wishlist</a>
</main>
