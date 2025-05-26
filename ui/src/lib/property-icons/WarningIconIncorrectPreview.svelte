<script>
	import { P, Tooltip, Heading } from 'flowbite-svelte';
	import { InfoCircleOutline } from 'flowbite-svelte-icons';
</script>

<InfoCircleOutline class="text-amber-400" />
<Tooltip>
	<Heading tag="h6">Incorrect Preview</Heading>
	<P>Editing this property will not affect the preview.</P>
	<P>
		You may only be able to see this property's effects by creating a render.
	</P>
</Tooltip>
