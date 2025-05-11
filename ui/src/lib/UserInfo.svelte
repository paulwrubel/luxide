<script lang="ts">
	import { auth, authenticatedUser } from '$lib/state/auth.svelte';
	import CircularProgress from '@smui/circular-progress';
</script>

{#if auth.token}
	{#await authenticatedUser()}
		<CircularProgress indeterminate />
		<span>Loading user info...</span>
	{:then user}
		<img src={user?.avatar_url} alt="User avatar" class="user-profile-img" />
		<strong class="mdc-typography--body1">{user?.username}</strong>
	{/await}
{/if}

<style>
	.user-profile-img {
		display: block;
		max-height: 100%;
		margin: auto 1em;
		border-radius: 20%;
	}
</style>
