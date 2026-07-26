export type FieldCopy = {
  /** human-readable label shown in the form */
  label: string;
  /** tooltip/help text explaining the field in plain language */
  description: string | string[];
};

export const RENDER_FIELD_COPY = {
  parameters: {
    name: {
      label: 'Name',
      description: `A human-readable name for this render configuration.
      Used to reference the render in the dashboard.`,
    },
    imageDimensions: {
      label: 'Size (width x height)',
      description: [
        `The resolution of the rendered image, measured in pixels. 
        Higher resolutions produce sharper images but take significantly longer to render, as the time scales linearly with pixel count.`,

        `Common values are 300x300 or 500x500 for testing, or 1920x1080 (Full HD) or 3840x2160 (4K) for production renders.`,
      ],
    },
    tileDimensions: {
      label: 'Tile Size',
      description: [
        `The size in pixels of each square tile the renderer processes in parallel. 
        Changing this setting is almost certain to have absolutely no effect on your render, in terms of visuals or rendering efficiency.`,

        `It is recommended to leave this at the default value of 1x1 unless you have a specific reason to change it.`,
      ],
    },
    samplesPerCheckpoint: {
      label: 'Samples Per Checkpoint',
      description: `How many samples are traced for each pixel before a checkpoint image is saved.
      Higher values reduce noise but make each checkpoint take longer.`,
    },
    totalCheckpoints: {
      label: 'Total Checkpoints',
      description: [
        `The total number of checkpoint images the renderer will produce before stopping.
        A greater total checkpoint count means a longer render with a higher sampled final result.`,

        `The final image quality depends on the total samples (samples per checkpoint x total checkpoints).
        Please note that the same total sample count will take longer if configured with more checkpoints and
        less samples per checkpoint, due to the overhead of saving more intermediate images to the backend storage.`,
      ],
    },
    useScalingTruncation: {
      label: 'Use Scaling Truncation',
      description: [
        `Whether to scale color channel values when clamping them, to preserve the color hues.`,

        `When a pixel color value exceeds 1.0, it must be clamped to fit within the displayable range.
        This can cause the hue of a pixel to change if one channel is clamped while others are not.
        Enabling this parameter ensures all channels are scaled proportionally to preserve the original 
        hue, at the cost of potentially losing some brightness.`,
      ],
    },
    enforceCheckpointLimit: {
      label: 'Enforce Checkpoint Limit?',
      description: [
        `Whether to enforce a limit on the total number of saved checkpoint images, by discarding old checkpoints.`,

        `When disabled, all checkpoints are kept until the render completes.`,
      ],
    },
    savedCheckpointLimit: {
      label: 'Saved Checkpoint Limit',
      description: `The maximum number of checkpoint images kept on disk at once.
      When the limit is reached, older checkpoints are discarded as new ones are saved.
      The number is always the most recent n checkpoints.`,
    },
    maxLightBounces: {
      label: 'Max Light Bounces',
      description: `The maximum number of times a light ray can reflect or refract before the tracer stops following it.
      Higher values produce more realistic lighting but increase render time. A value of 10-50 is typical for most scenes.`,
    },
    useRussianRoulette: {
      label: 'Use Russian Roulette?',
      description: `A technique that probabilistically terminates low-energy rays to reduce render time without 
      noticeably affecting quality. Rays with low contribution are randomly terminated based on their remaining energy.`,
    },
    minBouncesBeforeRoulette: {
      label: 'Minimum Bounces Before Activation',
      description: `The minimum number of bounces a ray must complete before Russian roulette can terminate it.
      This ensures early bounces, which carry the most visual energy, are always fully computed.`,
    },
    useImportanceSampling: {
      label: 'Use Importance Sampling?',
      description: [
        `Whether to bias ray sampling toward specific directions and geometries to reduce noise and converge faster. 
        When enabled and tuned correctly, the renderer can converge significantly faster.`,
        `All values are unitless weights that determine the relative probability of sampling rays in each category.`,
      ],
    },
    brdfWeight: {
      label: 'BRDF Weight',
      description: [
        `The weight assigned to the BRDF (surface reflection) component when importance sampling is active.
        Higher values increase the proportion of rays that follow surface reflections.`,

        `This is the default sampling method, and is guaranteed to correctly converge for all scenes, but 
        may converge much slower than when combined with other importance sampling methods.`,

        `Setting this to 1 and all other weights to 0 effectively disables importance sampling.`,
      ],
    },
    emissiveWeight: {
      label: 'Emissive Weight',
      description: [
        `The weight assigned to emissive (light-emitting) surfaces when importance sampling is active.`,

        `A non-zero weight will result in light being directly sent towards emissive geometrics
        (where the emissive texture has a non-black component).`,
      ],
    },
    transmissiveWeight: {
      label: 'Transmissive Weight',
      description: [
        `The weight assigned to transmissive (light-passing) materials when importance sampling is active.`,

        `This may or may not result in the scene converging slower or faster. Use with caution.`,
      ],
    },
    specularWeight: {
      label: 'Specular Weight',
      description: [
        `The weight assigned to specular (mirror-like) reflections when importance sampling is active.`,

        `This will only accelerate convergence for very specific scenes. Use with caution.`,
      ],
    },
    virtualWeight: {
      label: 'Virtual Weight',
      description: [
        `The weight assigned to virtual geometrics when importance sampling is active.`,

        `This can be used to direct light in directions that are not represented by a physically-placed
        scene object. For example, this can be used to direct light towards a virtual rectangle near the crack under
        a door, in a scene where most illumination would come from that direction.`,
      ],
    },
    useMultipleImportanceSampling: {
      label: 'Use Multiple Importance Sampling',
      description: [
        `An advanced setting that controls some fancy math under the hood. You should probably leave this on.`,
      ],
    },
  },
  cameras: {
    verticalFOV: {
      label: 'Vertical FOV (degrees)',
      description: `How wide the camera's view is, measured in degrees.
Higher values show more of the scene but can cause fisheye distortion.
Typical values are 40-90°.`,
    },
    eyeLocation: {
      label: 'Eye (x/y/z)',
      description: `The 3D position of the camera in world space.
Uses Y-up coordinates: X = right, Y = up, Z = forward.
Moving the eye changes what part of the scene is visible.`,
    },
    targetLocation: {
      label: 'Target (x/y/z)',
      description: `The 3D point the camera is looking at in world space.
Uses Y-up coordinates: X = right, Y = up, Z = forward.
Moving the target changes the direction the camera faces.`,
    },
    viewUp: {
      label: 'View Up (x/y/z)',
      description: `The upward direction vector for the camera, defining its roll orientation.
Uses Y-up coordinates: X = right, Y = up, Z = forward.
The default is (0, 1, 0), meaning the camera's top points along the world Y axis.`,
    },
    defocusAngle: {
      label: 'Defocus Angle (degrees)',
      description: `Controls the depth-of-field blur effect by simulating a finite aperture.
A value of 0 produces a perfectly sharp image.
Higher values increase background blur, drawing attention to in-focus subjects.`,
    },
  },
  geometrics: {
    _shared: {
      material: {
        label: 'Material',
        description: `The material assigned to this geometric surface, determining its visual properties such as color, roughness, and reflectance.
Select from the materials defined in the Materials tab.`,
      },
    },
    box: {
      corner1: {
        label: 'Corner 1',
        description: `The first corner of the box in world space.
Uses Y-up coordinates: X = right, Y = up, Z = forward.
Together with Corner 2, this defines the box's extents.`,
      },
      corner2: {
        label: 'Corner 2',
        description: `The opposite corner of the box in world space.
Uses Y-up coordinates: X = right, Y = up, Z = forward.
Together with Corner 1, this defines the box's extents.`,
      },
    },
    sphere: {
      center: {
        label: 'Center',
        description: `The center position of the sphere or disk in world space.
Uses Y-up coordinates: X = right, Y = up, Z = forward.`,
      },
      radius: {
        label: 'Radius',
        description: `The radius of the sphere, disk, or cylinder. Larger values create bigger objects that occupy more of the scene.`,
      },
    },
    triangle: {
      pointA: {
        label: 'Point A',
        description: `The first vertex of the triangle in world space.
Uses Y-up coordinates: X = right, Y = up, Z = forward.
The triangle is formed by Points A, B, and C in order.`,
      },
      pointB: {
        label: 'Point B',
        description: `The second vertex of the triangle in world space.
Uses Y-up coordinates: X = right, Y = up, Z = forward.`,
      },
      pointC: {
        label: 'Point C',
        description: `The third vertex of the triangle in world space.
Uses Y-up coordinates: X = right, Y = up, Z = forward.`,
      },
    },
    parallelogram: {
      lowerLeft: {
        label: 'Lower Left',
        description: `The origin corner of the parallelogram in world space.
Uses Y-up coordinates: X = right, Y = up, Z = forward.
The parallelogram extends along the u and v vectors from this point.`,
      },
      uVector: {
        label: 'u Vector',
        description: `The first edge direction and length of the parallelogram.
Together with the v vector, it defines the shape and orientation of the surface.`,
      },
      vVector: {
        label: 'v Vector',
        description: `The second edge direction and length of the parallelogram.
Together with the u vector, it defines the shape and orientation of the surface.`,
      },
    },
    plane: {
      point: {
        label: 'Point',
        description: `An anchor point on the infinite plane in world space.
Uses Y-up coordinates: X = right, Y = up, Z = forward.
The plane passes through this point and extends infinitely.`,
      },
      normal: {
        label: 'Normal',
        description: `The surface normal vector for a plane or disk, defining which direction the surface faces.
A normal of (0, 1, 0) faces upward.
The surface is only visible from the side the normal points toward.`,
      },
    },
    disk: {
      center: {
        label: 'Center',
        description: `The center position of the sphere or disk in world space.
Uses Y-up coordinates: X = right, Y = up, Z = forward.`,
      },
      normal: {
        label: 'Normal',
        description: `The surface normal vector for a plane or disk, defining which direction the surface faces.
A normal of (0, 1, 0) faces upward.
The surface is only visible from the side the normal points toward.`,
      },
      radius: {
        label: 'Radius',
        description: `The radius of the sphere, disk, or cylinder. Larger values create bigger objects that occupy more of the scene.`,
      },
      innerRadius: {
        label: 'Inner Radius',
        description: `The inner radius of the ring-shaped disk.
The area between the inner radius and the outer radius forms the visible surface.
Setting this to 0 creates a solid disk.`,
      },
    },
    cylinder: {
      endpointA: {
        label: 'Endpoint A',
        description: `The first endpoint of the cylinder's center axis in world space.
Uses Y-up coordinates: X = right, Y = up, Z = forward.
The cylinder extends along the line between Endpoint A and Endpoint B.`,
      },
      endA: {
        label: 'End A',
        description: `Whether the cylinder's first end is capped (closed with a flat surface), open (hollow), or infinite (extends forever in that direction).
Capped ends block light; open ends let it pass through.`,
      },
      endpointB: {
        label: 'Endpoint B',
        description: `The second endpoint of the cylinder's center axis in world space.
Uses Y-up coordinates: X = right, Y = up, Z = forward.`,
      },
      endB: {
        label: 'End B',
        description: `Whether the cylinder's second end is capped (closed with a flat surface), open (hollow), or infinite (extends forever in that direction).
Capped ends block light; open ends let it pass through.`,
      },
      radius: {
        label: 'Radius',
        description: `The radius of the sphere, disk, or cylinder. Larger values create bigger objects that occupy more of the scene.`,
      },
    },
    bilinear_patch: {
      bilinearCorner: {
        label: 'P00 / P10 / P01 / P11',
        description: `The four corner points of a bilinear patch, a curved surface defined by interpolation between these points.
P00, P10, P01, and P11 represent the four corners in grid order.
Uses Y-up coordinates: X = right, Y = up, Z = forward.`,
      },
    },
    rotate: {
      degreesOfRotation: {
        label: 'Degrees of Rotation',
        description: `The angle of rotation applied around the chosen axis, measured in degrees.
A full rotation is 360°.
Positive values rotate counterclockwise when looking along the axis toward the origin.`,
      },
      radiansOfRotation: {
        label: 'Radians of Rotation',
        description: `The angle of rotation applied around the chosen axis, measured in radians.
A full rotation is 2π (approximately 6.283).
Positive values rotate counterclockwise when looking along the axis toward the origin.`,
      },
      rotationPoint: {
        label: 'Rotation Point / Scale Point',
        description: `Controls the pivot around which rotation or scaling is applied.
"Centroid" uses the geometric center, "Custom" lets you specify a point directly, and "Origin" uses the world origin.`,
      },
      customPivotPoint: {
        label: 'Custom Rotation Point / Custom Scale Point',
        description: `The custom 3D point used as the pivot for rotation or scaling when the pivot mode is set to "Custom".
 Uses Y-up coordinates: X = right, Y = up, Z = forward.`,
      },
    },
    rotate_quaternion: {
      quaternion: {
        label: 'Quaternion',
        description: `A four-component rotation representation (w, x, y, z) that avoids gimbal lock.
 Quaternions define a rotation axis and angle without the singularities of Euler angles.
 The w component represents the cosine of half the rotation angle.`,
      },
      rotationPoint: {
        label: 'Rotation Point / Scale Point',
        description: `Controls the pivot around which rotation or scaling is applied.
 "Centroid" uses the geometric center, "Custom" lets you specify a point directly, and "Origin" uses the world origin.`,
      },
      customPivotPoint: {
        label: 'Custom Rotation Point / Custom Scale Point',
        description: `The custom 3D point used as the pivot for rotation or scaling when the pivot mode is set to "Custom".
 Uses Y-up coordinates: X = right, Y = up, Z = forward.`,
      },
    },
    scale: {
      scale: {
        label: 'Scale',
        description: `A uniform or per-axis scaling factor applied to the geometry.
 A value of 1 leaves the size unchanged.
 Values greater than 1 enlarge the object; values between 0 and 1 shrink it.`,
      },
      rotationPoint: {
        label: 'Rotation Point / Scale Point',
        description: `Controls the pivot around which rotation or scaling is applied.
 "Centroid" uses the geometric center, "Custom" lets you specify a point directly, and "Origin" uses the world origin.`,
      },
      customPivotPoint: {
        label: 'Custom Rotation Point / Custom Scale Point',
        description: `The custom 3D point used as the pivot for rotation or scaling when the pivot mode is set to "Custom".
Uses Y-up coordinates: X = right, Y = up, Z = forward.`,
      },
    },
    translate: {
      translation: {
        label: 'Translation',
        description: `The offset applied to move the geometry in world space.
Uses Y-up coordinates: X = right, Y = up, Z = forward.
This shifts the object from its original position by the specified amounts.`,
      },
    },
    constant_volume: {
      density: {
        label: 'Density',
        description: `The density of the constant-volume medium, controlling how much light is scattered or absorbed as it passes through.
Higher densities create thicker, more opaque volumes.`,
      },
      reflectanceTexture: {
        label: 'Reflectance Texture',
        description: `A texture that maps surface reflectance across the volume, determining how much light is reflected at each point.
Select from the textures defined in the Textures tab.`,
      },
    },
  },
  materials: {
    _shared: {
      reflectanceTexture: {
        label: 'Reflectance Texture',
        description: `A texture that maps surface reflectance (color/albedo) across the material, determining the base color at each point on the surface.
Select from the textures defined in the Textures tab.`,
      },
      emittanceTexture: {
        label: 'Emittance Texture',
        description: `A texture that controls where and how strongly the surface emits light, effectively turning parts of the material into light sources.
White areas emit strongly; black areas do not emit.
Select from the textures defined in the Textures tab.`,
      },
    },
    lambertian: {},
    specular: {
      roughness: {
        label: 'Roughness',
        description: `Controls how rough or smooth the surface is.
0 = perfectly mirror-like, 1 = completely diffuse/matte.
Rough surfaces scatter reflected light in many directions, creating soft reflections.`,
      },
    },
    dielectric: {
      indexOfRefraction: {
        label: 'Index of Refraction',
        description: `Determines how much light bends when entering the material.
Water is ~1.33, glass is ~1.5, diamond is ~2.4.
Higher values create stronger refraction effects.`,
      },
      abbeNumber: {
        label: 'Abbe Number',
        description: `Quantifies the material's chromatic dispersion — how much the index of refraction varies by wavelength.
Lower values (20-40) produce stronger rainbow-like color fringing; higher values (50-80) produce less dispersion.
Typical glass ranges from 30-60.`,
      },
      hasInteriorMedium: {
        label: 'Has Interior Medium?',
        description: `Whether the dielectric (transparent) material contains an interior medium such as smoke, fog, or colored glass.
When enabled, light passing through the material interacts with the medium's properties.`,
      },
      mediumType: {
        label: 'Type',
        description: `The type of interior medium.
"Vacuum" is empty space with no light interaction.
"Homogeneous" has uniform optical properties throughout — light is scattered or absorbed evenly as it passes through.`,
      },
      transmittance: {
        label: 'Transmittance',
        description: `The color of light that passes through the homogeneous medium.
White means all wavelengths pass equally.
Tinted values (such as a green tint) absorb complementary colors, giving the medium a colored appearance.`,
      },
      attenuationDistance: {
        label: 'Attenuation Distance',
        description: `The distance light travels through the homogeneous medium before its intensity is reduced by approximately 63%.
Smaller values create denser, more opaque media.
Larger values create clearer, more transparent media.`,
      },
      emittance: {
        label: 'Emittance',
        description: `The color and intensity of light emitted by the homogeneous medium itself.
A black value means the medium does not emit light.
Non-black values cause the medium to glow from within, like a neon tube or fire.`,
      },
    },
  },
  textures: {
    scale: {
      label: 'Scale',
      description: `Controls the size of the checker pattern.
Smaller values create more, smaller checks across the surface.
Larger values create fewer, larger checks.`,
    },
    color: {
      label: 'Color',
      description: `The solid color value for this texture. This color is applied uniformly across the entire surface.`,
    },
  },
};
