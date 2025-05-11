<script lang="ts">
	import Button from '@smui/button';
	import { navigateToAPILogin } from '$lib/api';
</script>

<Button
	color="secondary"
	variant="raised"
	onclick={async () => {
		await navigateToAPILogin();
	}}
>
	Log In
</Button>
