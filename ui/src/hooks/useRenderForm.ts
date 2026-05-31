import { useForm, type DeepKeys } from '@tanstack/react-form';
import { RenderConfigSchema, type RenderConfig } from '../utils/render/config';
import { getDefaultRenderConfig } from '../utils/render/templates';
import type { User } from '../utils/api';

export type UseRenderFormOptions = {
  user: User | undefined;
  initialValues?: RenderConfig;
};

export type RenderForm = ReturnType<typeof useRenderForm>;
export type RenderFormPath = DeepKeys<RenderConfig>;

export function useRenderForm(options: UseRenderFormOptions) {
  const { user, initialValues } = options;

  const formSchema = RenderConfigSchema.refine(
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
  ).refine(
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
  );

  return useForm({
    defaultValues: initialValues ?? getDefaultRenderConfig(),
    validators: {
      onChange: formSchema,
    },
  });
}
