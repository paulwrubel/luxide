<script lang="ts">
	import { Button } from 'flowbite-svelte';
	import { navigateToAPILogin } from '$lib/utils/api';
</script>

<Button color="primary" onclick={navigateToAPILogin}>Log In</Button>
