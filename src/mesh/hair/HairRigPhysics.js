import * as THREE from "three";
import { getHairCards } from "./HairAdvancedEditing.js";

export function createPonytailRig(group, {
  segments = 5,
  length = 0.9,
} = {}) {
  if (!group) return null;

  const chain = [];
  for (let i = 0; i < segments; i++) {
    chain.push({
      position: new THREE.Vector3(0, 1.7 - (i / Math.max(segments - 1, 1)) * length, -0.08),
      velocity: new THREE.Vector3(),
    });
  }

  group.userData.ponytailRig = {
    chain,
    length,
    segments,
    type: "ponytail",
  };

  return group.userData.ponytailRig;
}

export function attachCardsToRig(group) {
  const rig = group?.userData?.ponytailRig;
  const cards = getHairCards(group);
  if (!rig || !cards.length) return false;

  cards.forEach((card, i) => {
    const t = cards.length <= 1 ? 0 : i / (cards.length - 1);
    const idx = Math.min(rig.chain.length - 1, Math.round(t * (rig.chain.length - 1)));
    card.userData.rigIndex = idx;
  });

  return true;
}

export function stepHairPhysics(group, {
  gravity = -0.004,
  stiffness = 0.18,
  damping = 0.92,
  sway = 0.012,
  time = 0,
} = {}) {
  const rig = group?.userData?.ponytailRig;
  const cards = getHairCards(group);
  if (!rig || !cards.length) return false;

  for (let i = 1; i < rig.chain.length; i++) {
    const curr = rig.chain[i];
    const prev = rig.chain[i - 1];
    const targetY = prev.position.y - rig.length / Math.max(rig.chain.length - 1, 1);

    curr.velocity.y += gravity;
    curr.velocity.x += Math.sin(time * 0.003 + i) * sway;
    curr.velocity.z += Math.cos(time * 0.002 + i * 0.5) * sway * 0.65;

    curr.position.add(curr.velocity);
    curr.position.y += (targetY - curr.position.y) * stiffness;
    curr.position.x += (prev.position.x - curr.position.x) * stiffness * 0.25;
    curr.position.z += (prev.position.z - curr.position.z) * stiffness * 0.25;

    curr.velocity.multiplyScalar(damping);
  }

  cards.forEach((card) => {
    const idx = card.userData.rigIndex ?? 0;
    const bone = rig.chain[Math.max(0, Math.min(rig.chain.length - 1, idx))];
    card.position.copy(bone.position);
  });

  return true;
}
