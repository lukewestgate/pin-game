import { z } from 'zod';
import { NEXT_COLOUR_RULES, type NextColourRule } from '../rules/next-colour';

export const FORMAT_VERSION = 1;

const id = z.string().min(1);
const vec3 = z.tuple([z.number(), z.number(), z.number()]);
const hex = z.string().regex(/^#[0-9a-fA-F]{6}$/, 'expected a colour like #a1b2c3');
const positive = z.number().positive();
const segments = z.number().int().min(3).optional();

const shapeBase = {
  position: vec3,
  /** Euler angles in radians. */
  rotation: vec3.optional(),
  colour: hex,
  /** Edge radius in Model units, overriding the renderer's small default bevel. */
  round: z.number().nonnegative().optional(),
  finish: z.literal('wood').optional(),
};

/** Tagged union, so a `{ kind: "mesh", src }` variant can be added later (ADR 0001). */
export const shapeSchema = z.discriminatedUnion('kind', [
  z.object({ ...shapeBase, kind: z.literal('box'), size: z.tuple([positive, positive, positive]) }),
  z.object({
    ...shapeBase,
    kind: z.literal('cylinder'),
    diameter: positive,
    height: positive,
    segments,
  }),
  z.object({
    ...shapeBase,
    kind: z.literal('torus'),
    diameter: positive,
    thickness: positive,
    segments,
  }),
  z.object({
    ...shapeBase,
    kind: z.literal('capsule'),
    radius: positive,
    height: positive,
    segments,
  }),
  z.object({
    ...shapeBase,
    kind: z.literal('sphere'),
    size: z.tuple([positive, positive, positive]),
    segments,
  }),
]);

export const socketSchema = z.object({
  id,
  /** In the Part's local space. */
  position: vec3,
  /** The direction the Pin pulls out along, in the Part's local space. */
  direction: vec3,
  /** Hand-written list of the Part ids that Block this Socket while present. */
  coveredBy: z.array(id),
});

export const partSchema = z.object({
  id,
  position: vec3.optional(),
  rotation: vec3.optional(),
  shapes: z.array(shapeSchema).min(1),
  /** Overrides the default fall direction (outward from the Model's centre). */
  fall: vec3.optional(),
  /** A Part with no Sockets is a Core and never falls. */
  sockets: z.array(socketSchema),
});

export const modelSchema = z.object({
  id,
  formatVersion: z.literal(FORMAT_VERSION),
  parts: z.array(partSchema).min(1),
});

export const levelSchema = z.object({
  id,
  formatVersion: z.literal(FORMAT_VERSION),
  model: id,
  /** A Candy palette index for every Socket id. */
  colours: z.record(id, z.number().int().nonnegative()),
  seed: z.number().int(),
  rules: z
    .object({
      boxes: z.number().int().positive(),
      capacity: z.number().int().positive(),
      bufferSize: z.number().int().positive(),
      nextColour: z.enum(NEXT_COLOUR_RULES as [NextColourRule, ...NextColourRule[]]),
    })
    .partial()
    .optional(),
});

export type Shape = z.infer<typeof shapeSchema>;
export type Socket = z.infer<typeof socketSchema>;
export type Part = z.infer<typeof partSchema>;
export type ModelData = z.infer<typeof modelSchema>;
export type LevelData = z.infer<typeof levelSchema>;
