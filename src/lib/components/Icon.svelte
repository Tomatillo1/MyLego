<script lang="ts">
	type Props = { name: string; fill?: boolean; class?: string };
	let { name, fill = false, class: cls = '' }: Props = $props();
</script>

<svg class="ico {cls}" class:fill aria-hidden="true"><use href="#i-{name}" /></svg>
