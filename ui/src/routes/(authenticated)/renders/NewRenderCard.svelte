<script lang="ts">
	import { Card, Heading } from 'flowbite-svelte';
	import { CirclePlusOutline } from 'flowbite-svelte-icons';
</script>

<Card
	href="/renders/new"
	class="h-[264px] border-2 border-dashed !border-zinc-50 !bg-zinc-950 !text-zinc-200 hover:!bg-zinc-900"
>
	<div class="flex h-full w-full items-center justify-center gap-2">
		<CirclePlusOutline />
		<Heading tag="h2" class="text-lg font-normal italic">New Render</Heading>
	</div>
</Card>
