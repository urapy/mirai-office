import { startMatrixEffect } from '../office/engine/matrixEffectState.js';
import type { OfficeState } from '../office/engine/officeState.js';
import type { OfficeActor } from './demoOffice.js';

export type MiraiWorkCue = 'music' | 'sweat';

const MIRAI_WORK_CUE_SEQUENCE: readonly MiraiWorkCue[] = ['music', 'sweat', 'music', 'music'];

export function getMiraiWorkCue(
  visibleActorIds: readonly number[],
  cueIndex: number,
): { actorId: number; cue: MiraiWorkCue } | null {
  if (visibleActorIds.length === 0) return null;
  return {
    actorId: visibleActorIds[cueIndex % visibleActorIds.length],
    cue: MIRAI_WORK_CUE_SEQUENCE[cueIndex % MIRAI_WORK_CUE_SEQUENCE.length],
  };
}

export function selectVisibleOfficeActors(
  actors: readonly OfficeActor[],
  visibleActorIds: readonly number[],
): OfficeActor[] {
  const visibleIds = new Set(visibleActorIds);
  return actors.filter((actor) => visibleIds.has(actor.id));
}

/** Synchronize only the fixed Mirai Office actors, leaving other agents alone. */
export function syncOfficeActors(
  officeState: OfficeState,
  actors: readonly OfficeActor[],
  visibleActorIds: readonly number[],
): void {
  const visibleActors = selectVisibleOfficeActors(actors, visibleActorIds);
  const visibleIds = new Set(visibleActors.map((actor) => actor.id));

  for (const actor of actors) {
    const existing = officeState.characters.get(actor.id);
    if (!visibleIds.has(actor.id)) {
      if (existing && existing.matrixEffect !== 'despawn') {
        officeState.removeAgent(actor.id);
      }
      continue;
    }

    if (!existing) {
      officeState.addAgent(actor.id, actor.palette, actor.hueShift);
      officeState.enterAgentFromEntrance(actor.id);
    } else if (existing.matrixEffect === 'despawn') {
      if (existing.seatId) {
        const seat = officeState.seats.get(existing.seatId);
        if (seat) seat.assigned = true;
      }
      startMatrixEffect(existing, 'spawn');
    }

    const character = officeState.characters.get(actor.id);
    if (character) {
      character.agentName = actor.label;
      character.interactionOnlyLabel = true;
    }
    officeState.setAgentActive(actor.id, actor.activity === 'working');
  }
}
