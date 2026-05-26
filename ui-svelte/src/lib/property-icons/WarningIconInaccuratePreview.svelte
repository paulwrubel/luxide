<script>
	import { P, Tooltip, Heading } from 'flowbite-svelte';
	import { InfoCircleOutline } from 'flowbite-svelte-icons';
</script>

<InfoCircleOutline class="text-amber-400" />
<Tooltip>
	<Heading tag="h6">Warning: Inaccurate Preview</Heading>
	<P
		>That effect that this property has on the preview may not reflect the
		rendered result.</P
	>
	<P>
		You may only be able to see this property's full effects accurately by
		creating a render.
	</P>
</Tooltip>
