import { RenderConfigSchema } from '$lib/utils/render/config';
import { getDefaultRenderConfig } from '$lib/utils/render/templates';
import type { PageLoad } from './$types';
import { superValidate } from 'sveltekit-superforms';
import { zod } from 'sveltekit-superforms/adapters';
import type z from 'zod';

export const load: PageLoad = async () => {
	const schema = RenderConfigSchema;

	const defaults = getDefaultRenderConfig() as z.infer<typeof schema>;
	const form = await superValidate(zod(schema), {
		defaults,
		errors: false,
		strict: true
	});

	return {
		form
	};
};
