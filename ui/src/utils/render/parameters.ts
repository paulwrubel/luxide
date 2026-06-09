import { z } from 'zod';

export const ImportanceSamplingConfigSchema = z.object({
  emissive_weight: z.number().min(0),
  transmissive_weight: z.number().min(0),
  specular_weight: z.number().min(0),
  brdf_weight: z.number().min(0),
  use_multiple_importance_sampling: z.boolean(),
});

export type ImportanceSamplingConfig = z.infer<typeof ImportanceSamplingConfigSchema>;

export const RenderParametersSchema = z
  .object({
    image_dimensions: z.tuple([z.number().int().min(1), z.number().int().min(1)]),
    tile_dimensions: z.tuple([z.number().int().min(1), z.number().int().min(1)]),
    gamma_correction: z.number().min(1).max(5),
    samples_per_checkpoint: z.number().int().min(1),
    total_checkpoints: z.number().int().min(1),
    saved_checkpoint_limit: z.number().int().min(0).optional(),
    max_bounces: z.number().int().min(1).max(200),
    use_scaling_truncation: z.boolean(),
    importance_sampling: ImportanceSamplingConfigSchema.optional(),
  })
  .refine((params) => params.tile_dimensions[0] <= params.image_dimensions[0], {
    message: 'Cannot be larger than image dimensions',
    path: ['tile_dimensions', 0],
  })
  .refine((params) => params.tile_dimensions[1] <= params.image_dimensions[1], {
    message: 'Cannot be larger than image dimensions',
    path: ['tile_dimensions', 1],
  });

export type RenderParameters = z.infer<typeof RenderParametersSchema>;
