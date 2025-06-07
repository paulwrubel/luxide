import { RenderConfigSchema } from '$lib/utils/render';
import { getDefaultRenderConfig } from '$lib/utils/renderTemplates';
import type { PageLoad } from './$types';
import { superValidate } from 'sveltekit-superforms';
import { zod } from 'sveltekit-superforms/adapters';
import type z from 'zod';

export const load: PageLoad = async () => {
	const schema = RenderConfigSchema;

	const form = await superValidate(zod(schema), {
		defaults: getDefaultRenderConfig() as z.infer<typeof schema>
	});

	return {
		form
	};
};
