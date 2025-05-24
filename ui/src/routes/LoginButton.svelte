<script lang="ts">
	import { Button } from 'flowbite-svelte';
	import { navigateToAPILogin } from '$lib/api';
</script>

<Button
	color="primary"
	onclick={async () => {
		await navigateToAPILogin();
	}}
>
	Log In
</Button>
