import { z } from 'zod';
import type { RenderConfig } from './config';
import { isNonNullObject } from './utils';
// FormPath is a branded string type for schema field paths.
type FormPath = string;

export const CameraDataSchema = z.object({
  vertical_field_of_view_degrees: z.number().min(0).max(180),
  eye_location: z.tuple([z.number(), z.number(), z.number()]),
  target_location: z.tuple([z.number(), z.number(), z.number()]),
  view_up: z.tuple([z.number(), z.number(), z.number()]),
  defocus_angle_degrees: z.number().min(0).max(180),
  focus_distance: z.union([z.literal('eye_to_target'), z.number().min(0)]),
});

export type CameraData = NormalizedCameraData;

export type NormalizedCameraData = RawCameraData;

export type RawCameraData = {
  vertical_field_of_view_degrees: number;
  eye_location: [number, number, number];
  target_location: [number, number, number];
  view_up: [number, number, number];
  defocus_angle_degrees: number;
  focus_distance: 'eye_to_target' | number;
};

export function isCameraData(data: unknown): data is CameraData {
  return (
    isNonNullObject(data) &&
    [
      'vertical_field_of_view_degrees',
      'eye_location',
      'target_location',
      'view_up',
      'defocus_angle_degrees',
      'focus_distance',
    ].every((key) => key in data)
  );
}

export type CameraDataResult = {
  data: CameraData;
  source: 'reference' | 'inline';
  path: FormPath;
};

export function getCameraData(
  config: RenderConfig,
  nameOrData: string | CameraData,
): CameraDataResult {
  if (isCameraData(nameOrData)) {
    return {
      data: nameOrData,
      source: 'inline',
      path: 'active_scene.camera' as FormPath,
    };
  }

  const camera = config.cameras?.[nameOrData];
  if (!camera) {
    throw new Error(`Camera ${nameOrData} not found`);
  }

  return {
    data: camera,
    source: 'reference',
    path: `cameras.${nameOrData}` as FormPath,
  };
}
