import { MathUtils, PerspectiveCamera, Plane, Quaternion, Raycaster, Vector2, Vector3 } from 'three';

// Size and spacing of the dice once landed, in CSS pixels: the same format as
// the old flat dice. Smaller when the row is too narrow for 6 of them.
export const DIE_PX = 64;
export const DIE_GAP_PX = 10;
const MIN_DIE_PX = 24;

/**
 * Size of the dice so that 6 of them fit in a row of the given width.
 *
 * @param {number} rowWidth - Width of the row, in pixels.
 * @returns {number} The die size in pixels, at most DIE_PX.
 */
export const diePxFor = (rowWidth: number): number =>
  Math.max(
    MIN_DIE_PX,
    Math.min(DIE_PX, Math.floor((rowWidth * DIE_PX) / (6 * DIE_PX + 5 * DIE_GAP_PX))),
  );

// Camera looking at the table from the front, slightly from above. The pitch
// has to stay below half the field of view, otherwise the far end of the
// table (where the dice are thrown from) would be above the top of the view.
export const CAMERA_FOV = 26; // degrees, vertical
export const CAMERA_PITCH = 10; // degrees, downwards

// Value shown on each face of the box geometry, in three.js face/material
// order: +X, -X, +Y, -Y, +Z, -Z. Opposite faces add up to 7, like a real die.
export const FACE_VALUES = [3, 4, 5, 2, 1, 6];
const FACE_NORMALS = [
  new Vector3(1, 0, 0),
  new Vector3(-1, 0, 0),
  new Vector3(0, 1, 0),
  new Vector3(0, -1, 0),
  new Vector3(0, 0, 1),
  new Vector3(0, 0, -1),
];
// The camera is on the +Z side of the dice.
const TOWARD_CAMERA = new Vector3(0, 0, 1);

/**
 * Orientation of a die showing `value` on its face turned towards the camera.
 *
 * @param {number} value - The die value (1-6).
 * @returns {Quaternion} The orientation.
 */
export const faceQuaternion = (value: number): Quaternion => {
  const normal = FACE_NORMALS[FACE_VALUES.indexOf(value)] ?? TOWARD_CAMERA;
  return new Quaternion().setFromUnitVectors(normal, TOWARD_CAMERA);
};

export interface Slot {
  // Center of the die, in pixels from the top-left corner of the stage.
  x: number;
  y: number;
}

/**
 * Where each die lands: in a row, left-aligned, like the old flat dice.
 *
 * @param {number} count - The number of dice.
 * @param {number} rowLeft - Left edge of the row, in stage pixels.
 * @param {number} rowCenterY - Vertical center of the row, in stage pixels.
 * @param {number} diePx - Size of a die, in pixels (the gap scales with it).
 * @returns {Slot[]} The center of each die.
 */
export const slotsFor = (
  count: number,
  rowLeft: number,
  rowCenterY: number,
  diePx: number = DIE_PX,
): Slot[] => {
  const gap = (diePx * DIE_GAP_PX) / DIE_PX;
  return Array.from({ length: count }, (_, index) => ({
    x: rowLeft + diePx / 2 + index * (diePx + gap),
    y: rowCenterY,
  }));
};

/**
 * Sets the camera up for a stage of the given size.
 *
 * @param {PerspectiveCamera} camera - The camera to set up (mutated).
 * @param {number} width - Stage width in pixels.
 * @param {number} height - Stage height in pixels.
 */
export const setupCamera = (camera: PerspectiveCamera, width: number, height: number): void => {
  camera.fov = CAMERA_FOV;
  camera.aspect = width / height;
  camera.near = 0.01;
  camera.far = 1000;
  camera.position.set(0, 1, 0);
  camera.rotation.set(-MathUtils.degToRad(CAMERA_PITCH), 0, 0);
  camera.updateProjectionMatrix();
  camera.updateMatrixWorld();
};

const raycaster = new Raycaster();
const ndc = new Vector2();
const horizontalPlane = new Plane(new Vector3(0, 1, 0), 0);

// Point where the line of sight through a pixel of the stage meets the
// horizontal plane at height `y` (null if it never does: above the horizon).
const pointOnPlane = (
  camera: PerspectiveCamera,
  width: number,
  height: number,
  slot: Slot,
  y: number,
): Vector3 | null => {
  ndc.set((slot.x / width) * 2 - 1, 1 - (slot.y / height) * 2);
  raycaster.setFromCamera(ndc, camera);
  horizontalPlane.constant = -y;
  return raycaster.ray.intersectPlane(horizontalPlane, new Vector3());
};

export interface DiceLayout {
  // Size of a die in world units.
  size: number;
  // Final center of each die (the table is the plane y = 0).
  positions: Vector3[];
}

/**
 * Computes the size and final position of the dice so that, seen from the
 * camera, the face of die `i` showing its value is exactly `diePx` wide and
 * centered on `slots[i]`. The HTML buttons laid over the dice use the same
 * slots, so they line up exactly. (Fitting the center of the die instead
 * would make the dice on the sides look bigger and shifted outwards: their
 * front face is closer to the camera than their center.)
 *
 * @param {PerspectiveCamera} camera - The camera, already set up.
 * @param {number} width - Stage width in pixels.
 * @param {number} height - Stage height in pixels.
 * @param {Slot[]} slots - Where each die must land.
 * @param {number} diePx - Size of a die, in pixels.
 * @returns {DiceLayout | null} The layout, or null if the slots can't be reached.
 */
export const fitLayout = (
  camera: PerspectiveCamera,
  width: number,
  height: number,
  slots: Slot[],
  diePx: number = DIE_PX,
): DiceLayout | null => {
  if (slots.length === 0) return null;

  // The die size depends on how far the row is, which itself depends on the
  // height of the front faces centers (size / 2). Along the line of sight
  // through the row, that center is at t = (size / 2 - origin.y) / direction.y,
  // at a depth of t * (direction . forward), and a face at depth d is diePx
  // wide if size = k * d. Solving size = a * (size / 2 - origin.y) gives:
  ndc.set((slots[0].x / width) * 2 - 1, 1 - (slots[0].y / height) * 2);
  raycaster.setFromCamera(ndc, camera);
  const { origin, direction } = raycaster.ray;
  if (direction.y >= 0) return null; // the row is above the horizon
  const forward = camera.getWorldDirection(new Vector3());
  const k = (2 * diePx * Math.tan(MathUtils.degToRad(camera.fov / 2))) / height;
  const a = (k * direction.dot(forward)) / direction.y;
  const size = (-a * origin.y) / (1 - a / 2);

  const frontFaces = slots.map((slot) => pointOnPlane(camera, width, height, slot, size / 2));
  if (frontFaces.some((face) => !face)) return null;
  // The center of each die is half a die behind its front face.
  const positions = (frontFaces as Vector3[]).map((face) => face.setZ(face.z - size / 2));
  return { size, positions };
};

export interface DieThrow {
  delayMs: number;
  durationMs: number;
  // Where the die starts, relative to where it lands, in die sizes: far
  // away (negative z) and up in the air.
  offset: Vector3;
  // The die tumbles around this world axis, and slows down until it lands
  // showing the right face.
  spinAxis: Vector3;
  spinAngle: number;
  bounces: number;
}

/**
 * Picks a random throw for one die.
 *
 * @param {() => number} random - Random number generator in [0, 1).
 * @returns {DieThrow} The throw.
 */
export const createThrow = (random: () => number = Math.random): DieThrow => ({
  delayMs: random() * 180,
  durationMs: 1300 + random() * 300,
  offset: new Vector3((random() - 0.5) * 8, 2 + random() * 1.5, -(14 + random() * 6)),
  // Mostly around X, so that the dice roll towards the camera.
  spinAxis: new Vector3(1, (random() - 0.5) * 0.8, (random() - 0.5) * 0.8).normalize(),
  spinAngle: Math.PI * 2 * (2 + random() * 1.5),
  bounces: 3,
});

// A die that is already where it lands, for people who asked their system to
// reduce motion.
export const LANDED: DieThrow = {
  delayMs: 0,
  durationMs: 0,
  offset: new Vector3(),
  spinAxis: new Vector3(1, 0, 0),
  spinAngle: 0,
  bounces: 0,
};

const easeOutCubic = (t: number) => 1 - (1 - t) ** 3;

export interface DiePose {
  position: Vector3;
  quaternion: Quaternion;
  // False while the die waits for its (small, random) delay: hide it.
  started: boolean;
  done: boolean;
}

/**
 * Position and orientation of a thrown die at a given time.
 *
 * @param {DieThrow} dieThrow - The throw.
 * @param {Vector3} finalPosition - Where the die lands.
 * @param {Quaternion} finalQuaternion - How it lands (see faceQuaternion).
 * @param {number} size - Size of a die in world units.
 * @param {number} elapsedMs - Time since the throw started.
 * @param {DiePose} out - Objects to write the pose into (avoids allocations every frame).
 * @returns {DiePose} The pose.
 */
export const poseAt = (
  dieThrow: DieThrow,
  finalPosition: Vector3,
  finalQuaternion: Quaternion,
  size: number,
  elapsedMs: number,
  out: DiePose = { position: new Vector3(), quaternion: new Quaternion(), started: false, done: false },
): DiePose => {
  const t =
    dieThrow.durationMs <= 0
      ? 1
      : MathUtils.clamp((elapsedMs - dieThrow.delayMs) / dieThrow.durationMs, 0, 1);
  // 1 when thrown, 0 once landed: the die travels fast then slows down.
  const remaining = 1 - easeOutCubic(t);
  // Hops getting lower and lower, touching the table between them.
  const hop = (1 - t) ** 1.8 * Math.abs(Math.cos(Math.PI * dieThrow.bounces * t));

  out.position.set(
    finalPosition.x + dieThrow.offset.x * size * remaining,
    finalPosition.y + dieThrow.offset.y * size * hop,
    finalPosition.z + dieThrow.offset.z * size * remaining,
  );
  // The minus sign makes the die roll forward (its top towards the camera)
  // while it comes closer.
  out.quaternion
    .setFromAxisAngle(dieThrow.spinAxis, -dieThrow.spinAngle * remaining)
    .multiply(finalQuaternion);
  out.started = elapsedMs >= dieThrow.delayMs || dieThrow.durationMs <= 0;
  out.done = t >= 1;
  return out;
};
