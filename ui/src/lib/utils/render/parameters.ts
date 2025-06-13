import { z } from 'zod';

export const RenderParametersSchema = z
	.object({
		image_dimensions: z.tuple([
			z.number().int().min(1),
			z.number().int().min(1)
		]),
		tile_dimensions: z.tuple([
			z.number().int().min(1),
			z.number().int().min(1)
		]),
		gamma_correction: z.number().min(1).max(5),
		samples_per_checkpoint: z.number().int().min(1).max(1000),
		total_checkpoints: z.number().int().min(1).max(1000),
		saved_checkpoint_limit: z.number().int().min(0).max(1000).optional(),
		max_bounces: z.number().int().min(1).max(200),
		use_scaling_truncation: z.boolean()
	})
	.refine((params) => params.tile_dimensions[0] <= params.image_dimensions[0], {
		message: 'Cannot be larger than image dimensions',
		path: ['tile_dimensions', 0]
	})
	.refine((params) => params.tile_dimensions[1] <= params.image_dimensions[1], {
		message: 'Cannot be larger than image dimensions',
		path: ['tile_dimensions', 1]
	});

export type RenderParameters = z.infer<typeof RenderParametersSchema>;
