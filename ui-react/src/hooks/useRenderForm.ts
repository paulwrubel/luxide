import { useForm } from '@tanstack/react-form';
import { RenderConfigSchema, type NormalizedRenderConfig } from '../utils/render/config';
import { getDefaultRenderConfig } from '../utils/render/templates';
import type { User } from '../utils/api';

export type UseRenderFormOptions = {
  user: User | undefined;
};

export type RenderForm = ReturnType<typeof useRenderForm>;

export function useRenderForm(options: UseRenderFormOptions) {
  const { user } = options;

  function onChangeValidate(renderConfig: NormalizedRenderConfig): string | undefined {
    const result = RenderConfigSchema.refine(
      ({ parameters }) => {
        if ((user?.max_render_pixel_count ?? null) !== null) {
          const [x, y] = parameters.image_dimensions;
          return x * y <= (user?.max_render_pixel_count ?? Infinity);
        }
        return true;
      },
      {
        message: 'Image dimensions are too large',
        path: ['parameters', 'image_dimensions'],
      },
    )
      .refine(
        ({ parameters }) => {
          if ((user?.max_checkpoints_per_render ?? null) !== null) {
            return (
              parameters.saved_checkpoint_limit !== undefined &&
              parameters.saved_checkpoint_limit <= (user?.max_checkpoints_per_render ?? Infinity)
            );
          }
          return true;
        },
        {
          message: 'Saved checkpoint limit is too large',
          path: ['parameters', 'saved_checkpoint_limit'],
        },
      )
      .safeParse(renderConfig);

    if (!result.success) {
      return result.error.issues
        .map((issue) =>
          issue.path.length > 0 ? `${issue.path.join('.')}: ${issue.message}` : issue.message,
        )
        .join(', ');
    }
    return undefined;
  }

  return useForm({
    defaultValues: getDefaultRenderConfig(),
    validators: {
      onChange: ({ value: renderConfig }) => {
        onChangeValidate(renderConfig);
      },
    },
  });
}
