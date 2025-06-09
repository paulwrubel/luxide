<script lang="ts">
	import { auth, clearToken } from '$lib/state/auth.svelte';
	import { Spinner, Dropdown, DropdownItem } from 'flowbite-svelte';

	// function to handle logout
	function handleLogout() {
		clearToken();
		window.location.reload();
	}
</script>

{#if auth.isAuthenticated}
	<div class="relative">
		{#if auth.user === undefined}
			<div class="flex items-center gap-2">
				<Spinner color="blue" size="4" class="text-white" />
				<span class="text-sm text-white">Loading...</span>
			</div>
		{:else}
			<button
				class="flex items-center gap-2 rounded p-1 text-white hover:bg-zinc-800"
				id="user-menu-button"
			>
				<img
					src={auth.validUser.avatar_url}
					alt="User avatar"
					class="h-8 w-auto rounded-md"
				/>
				<span class="text-sm font-medium">{auth.validUser.username}</span>
			</button>

			<Dropdown triggeredBy="#user-menu-button" class="z-10 rounded-lg">
				<DropdownItem
					class="!bg-primary-600 hover:!bg-primary-700 rounded-lg !text-white"
					onclick={handleLogout}
				>
					Log Out
				</DropdownItem>
			</Dropdown>
		{/if}
	</div>
{/if}
