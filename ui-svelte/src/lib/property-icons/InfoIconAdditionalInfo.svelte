<script lang="ts">
	import { P, Tooltip, Heading } from 'flowbite-svelte';
	import { InfoCircleOutline } from 'flowbite-svelte-icons';

	type Props = {
		/**
		 * The info to display.
		 *
		 * Can be a string or an array of strings.
		 *
		 * In the case of an array, each string will be displayed
		 * in a separate <p> tag.
		 */
		info: string | string[];
	};

	const { info }: Props = $props();

	const infoStrings: string[] = $derived.by(() => {
		if (Array.isArray(info)) {
			return info;
		} else {
			return [info];
		}
	});
</script>

<InfoCircleOutline />
<Tooltip>
	<Heading tag="h6">Additional Info</Heading>
	{#each infoStrings as infoStr (infoStr)}
		<P>{infoStr}</P>
	{/each}
</Tooltip>
