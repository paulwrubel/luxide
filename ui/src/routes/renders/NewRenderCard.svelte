<script lang="ts">
	import Card, { Content, PrimaryAction } from '@smui/card';
	import { goto } from '$app/navigation';
	import { Icon } from '@smui/icon-button';
	import { mdiPlusCircleOutline } from '@mdi/js';
</script>

<Card class="new-render-card">
	<PrimaryAction onclick={() => goto('/renders/new')}>
		<Content class="new-render-card-content">
			<Icon tag="svg" viewBox="0 0 24 24" style="width: 30px;">
				<path fill="currentColor" d={mdiPlusCircleOutline} />
			</Icon>
			<h6 class="mdc-typography--headline6"><em>New Render</em></h6>
		</Content>
	</PrimaryAction>
</Card>

<style>
	:global(.new-render-card) {
		background-color: transparent;
		border: 2px dashed white;
		border-radius: 5%;
	}

	:global(.new-render-card-content) {
		width: 100%;
		height: 264px;
		padding: 0;

		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
	}

	/* :global(.card-content) * {
		margin: 0;
	} */
</style>
