import { useEffect, useRef, useState } from 'react';
import { type DeepKeys } from '@tanstack/react-form';
import { useAppForm } from '@/hooks/useAppForm';
import { RenderConfigSchema, type NormalizedRenderConfig } from '../utils/render/config';
import { getDefaultRenderConfig } from '../utils/render/templates';
import type { User } from '../utils/api';

const DRAFT_KEY = 'luxide-render-config-draft';

function loadRenderDraft(): NormalizedRenderConfig | undefined {
  try {
    const raw = sessionStorage.getItem(DRAFT_KEY);
    if (raw === null) {
      return undefined;
    }

    const parsed = JSON.parse(raw);
    const { data, success } = RenderConfigSchema.safeParse(parsed);
    if (!success) {
      return undefined;
    }
    return data;
  } catch {
    return undefined;
  }
}

export function saveRenderDraft(config: NormalizedRenderConfig): void {
  try {
    sessionStorage.setItem(DRAFT_KEY, JSON.stringify(config));
  } catch {
    // silently ignore
  }
}

export function clearRenderDraft(): void {
  try {
    sessionStorage.removeItem(DRAFT_KEY);
  } catch {
    // silently ignore
  }
}

export type UseRenderFormOptions = {
  user: User | undefined;
};

export type RenderForm = ReturnType<typeof useRenderForm>;
export type RenderFormPath = DeepKeys<NormalizedRenderConfig>;

export function useRenderForm(options: UseRenderFormOptions) {
  const { user } = options;

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
    .refine(
      ({ parameters }) => {
        const cfg = parameters.importance_sampling;

        return (
          !cfg ||
          cfg.brdf_weight +
            cfg.emissive_weight +
            cfg.transmissive_weight +
            cfg.specular_weight +
            cfg.virtual_weight >
            0
        );
      },
      {
        message: 'At least one importance sampling weight must be non-zero',
        path: ['parameters', 'importance_sampling'],
      },
    );

  const [resolvedDefaults] = useState(() => {
    return loadRenderDraft() ?? getDefaultRenderConfig();
  });

  const form = useAppForm({
    defaultValues: resolvedDefaults,
    validators: {
      onChange: formSchema,
    },
  });

  const saveTimerRef = useRef<ReturnType<typeof setTimeout>>(null);

  // debounced auto-save: persist form values to sessionStorage after
  // the user stops typing for 500ms, avoiding writes on every keystroke
  useEffect(() => {
    // subscribe to the form store — fires on every value change
    const { unsubscribe } = form.store.subscribe(() => {
      // a pending save is already scheduled — cancel it to reset the debounce clock
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
      }
      // start a new 500ms timer; if no further changes arrive, persist current values
      saveTimerRef.current = setTimeout(() => {
        saveRenderDraft(form.state.values);
      }, 500);
    });

    return () => {
      // stop listening for changes on unmount
      unsubscribe();
      // cancel any still-pending save
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
      }
    };
  }, [form]);

  return form;
}
