import { z } from 'zod';

export const ImportanceSamplingConfigSchema = z
  .object({
    emissive_weight: z.number().min(0).default(1.0),
    transmissive_weight: z.number().min(0).default(0.0),
    specular_weight: z.number().min(0).default(0.0),
    brdf_weight: z.number().min(0).default(1.0),
  })
  .refine(
    (cfg) =>
      cfg.emissive_weight + cfg.transmissive_weight + cfg.specular_weight + cfg.brdf_weight > 0,
    { message: 'At least one importance sampling category must have a non-zero weight' },
  );

export type ImportanceSamplingConfig = z.infer<typeof ImportanceSamplingConfigSchema>;

export const RenderParametersSchema = z
  .object({
    image_dimensions: z.tuple([z.number().int().min(1), z.number().int().min(1)]),
    tile_dimensions: z.tuple([z.number().int().min(1), z.number().int().min(1)]),
    gamma_correction: z.number().min(1).max(5),
    samples_per_checkpoint: z.number().int().min(1).max(1000),
    total_checkpoints: z.number().int().min(1).max(1000),
    saved_checkpoint_limit: z.number().int().min(0).max(1000).optional(),
    max_bounces: z.number().int().min(1).max(200),
    use_scaling_truncation: z.boolean(),
    importance_sampling: ImportanceSamplingConfigSchema.default({
      emissive_weight: 0.0,
      transmissive_weight: 0.0,
      specular_weight: 0.0,
      brdf_weight: 1.0,
    }),
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
