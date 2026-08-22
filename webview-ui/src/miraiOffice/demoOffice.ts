export type OfficeActorActivity = 'working' | 'resting';

export interface OfficeActor {
  id: number;
  label: string;
  palette: number;
  hueShift?: number;
  activity: OfficeActorActivity;
}

export interface OfficeActorSnapshot {
  version: 1;
  actors: OfficeActor[];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

/**
 * Validate the small, product-neutral boundary used by the local screen-port
 * spike. Investment data can produce this snapshot without knowing anything
 * about Claude/Codex sessions or tools.
 */
export function parseOfficeActorSnapshot(value: unknown): OfficeActorSnapshot {
  if (!isRecord(value) || value.version !== 1 || !Array.isArray(value.actors)) {
    throw new Error('Invalid office actor snapshot');
  }

  const ids = new Set<number>();
  const actors = value.actors.map((candidate) => {
    if (!isRecord(candidate)) throw new Error('Invalid office actor');

    const { id, label, palette, hueShift, activity } = candidate;
    if (!Number.isInteger(id) || (id as number) <= 0 || ids.has(id as number)) {
      throw new Error('Office actor IDs must be unique positive integers');
    }
    if (typeof label !== 'string' || label.trim().length === 0) {
      throw new Error('Office actor labels must not be empty');
    }
    if (!Number.isInteger(palette) || (palette as number) < 0 || (palette as number) > 5) {
      throw new Error('Office actor palettes must be integers from 0 to 5');
    }
    if (
      hueShift !== undefined &&
      (!Number.isInteger(hueShift) || (hueShift as number) < 0 || (hueShift as number) > 360)
    ) {
      throw new Error('Office actor hue shifts must be integers from 0 to 360');
    }
    if (activity !== 'working' && activity !== 'resting') {
      throw new Error('Office actor activity must be working or resting');
    }
    const normalizedActivity: OfficeActorActivity = activity;

    ids.add(id as number);
    return {
      id: id as number,
      label: label.trim(),
      palette: palette as number,
      ...(hueShift === undefined ? {} : { hueShift: hueShift as number }),
      activity: normalizedActivity,
    };
  });

  return { version: 1, actors };
}
