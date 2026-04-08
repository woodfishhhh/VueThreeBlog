export type HypercubeRotation = {
  x: number;
  y: number;
  z: number;
};

const TAU = Math.PI * 2;

function normalizeAngleForTween(current: number, target: number) {
  const delta = current - target;
  const wrappedDelta = ((((delta + Math.PI) % TAU) + TAU) % TAU) - Math.PI;

  return target + wrappedDelta;
}

export function normalizeRotationForTween(current: HypercubeRotation, target: HypercubeRotation): HypercubeRotation {
  return {
    x: normalizeAngleForTween(current.x, target.x),
    y: normalizeAngleForTween(current.y, target.y),
    z: normalizeAngleForTween(current.z, target.z),
  };
}
