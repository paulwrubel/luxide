<script lang="ts">
	type Props = {
		vertical?: boolean;
		class?: string;
	};

	const { vertical, class: className }: Props = $props();
</script>

{#if vertical}
	<div class={['border-r-[1px] border-zinc-600', className]}></div>
{:else}
	<div class={['border-b-[1px] border-zinc-600', className]}></div>
{/if}
