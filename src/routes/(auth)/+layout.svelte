<script lang="ts">
	let { children } = $props();
</script>

<div class="screen">
	<main class="auth">
		{@render children()}
	</main>
</div>
