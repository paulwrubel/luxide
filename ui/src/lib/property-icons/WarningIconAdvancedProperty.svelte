<script>
	import { P, Tooltip, Heading } from 'flowbite-svelte';
	import { InfoCircleOutline } from 'flowbite-svelte-icons';
</script>

<InfoCircleOutline class="text-amber-400" />
<Tooltip>
	<Heading tag="h6">Warning: Advanced Property</Heading>
	<P>This property is advanced and may not be visible in the preview.</P>
	<P>It is recommended to leave this property at its default value.</P>
</Tooltip>
