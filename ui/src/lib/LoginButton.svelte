<script lang="ts">
	import Button from '@smui/button';
	import { login } from '$lib/api';
</script>

<Button
	color="secondary"
	variant="raised"
	onclick={() => {
		console.log('Bazinga!');
		login();
	}}>Log In</Button
>
