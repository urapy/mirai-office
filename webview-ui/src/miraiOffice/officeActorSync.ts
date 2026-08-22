import { startMatrixEffect } from '../office/engine/matrixEffectState.js';
import type { OfficeState } from '../office/engine/officeState.js';
import type { OfficeActor } from './demoOffice.js';

export function selectVisibleOfficeActors(
  actors: readonly OfficeActor[],
  purchaseCount: number,
): OfficeActor[] {
  const visibleCount = Math.max(0, Math.min(Math.floor(purchaseCount), actors.length));
  return actors.slice(0, visibleCount);
}

/** Synchronize only the fixed Mirai Office actors, leaving other agents alone. */
export function syncOfficeActors(
  officeState: OfficeState,
  actors: readonly OfficeActor[],
  purchaseCount: number,
): void {
  const visibleActors = selectVisibleOfficeActors(actors, purchaseCount);
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
    } else if (existing.matrixEffect === 'despawn') {
      if (existing.seatId) {
        const seat = officeState.seats.get(existing.seatId);
        if (seat) seat.assigned = true;
      }
      startMatrixEffect(existing, 'spawn');
    }

    const character = officeState.characters.get(actor.id);
    if (character) character.agentName = actor.label;
    officeState.setAgentActive(actor.id, actor.activity === 'working');
  }
}
