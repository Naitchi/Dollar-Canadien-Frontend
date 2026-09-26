import { describe, expect, it } from 'vitest';
import { PerspectiveCamera, Quaternion, Vector3 } from 'three';

import {
  DIE_PX,
  FACE_VALUES,
  LANDED,
  createThrow,
  diePxFor,
  faceQuaternion,
  fitLayout,
  poseAt,
  setupCamera,
  slotsFor,
} from '@/components/Dices3D/diceMath';

const FACE_NORMALS = [
  new Vector3(1, 0, 0),
  new Vector3(-1, 0, 0),
  new Vector3(0, 1, 0),
  new Vector3(0, -1, 0),
  new Vector3(0, 0, 1),
  new Vector3(0, 0, -1),
];

// A typical "Dés lancés" box: 420 x 170 px, with the row of dice in it.
const WIDTH = 420;
const HEIGHT = 170;
const makeCamera = () => {
  const camera = new PerspectiveCamera();
  setupCamera(camera, WIDTH, HEIGHT);
  return camera;
};
const toPixels = (point: Vector3, camera: PerspectiveCamera) => {
  const ndc = point.clone().project(camera);
  return { x: ((ndc.x + 1) / 2) * WIDTH, y: ((1 - ndc.y) / 2) * HEIGHT };
};

describe('faces', () => {
  it('uses real die faces: opposite faces add up to 7', () => {
    expect(FACE_VALUES[0] + FACE_VALUES[1]).toBe(7);
    expect(FACE_VALUES[2] + FACE_VALUES[3]).toBe(7);
    expect(FACE_VALUES[4] + FACE_VALUES[5]).toBe(7);
  });

  it('turns the face carrying each value towards the camera', () => {
    FACE_VALUES.forEach((value, face) => {
      const turned = FACE_NORMALS[face].clone().applyQuaternion(faceQuaternion(value));
      expect(turned.distanceTo(new Vector3(0, 0, 1))).toBeLessThan(1e-6);
    });
  });

  it('keeps the dice upright (no die lying on its side with its pips rotated)', () => {
    for (const value of [1, 3, 4, 6]) {
      const up = new Vector3(0, 1, 0).applyQuaternion(faceQuaternion(value));
      expect(up.distanceTo(new Vector3(0, 1, 0))).toBeLessThan(1e-6);
    }
  });
});

describe('fitLayout', () => {
  const slots = slotsFor(6, 20, 110);
  // Center of the face showing the value (towards the camera).
  const frontFace = (position: Vector3, size: number) => position.clone().setZ(position.z + size / 2);

  it('lands the face of every die exactly on its slot, as seen by the camera', () => {
    const camera = makeCamera();
    const { positions, size } = fitLayout(camera, WIDTH, HEIGHT, slots)!;

    positions.forEach((position, index) => {
      const pixel = toPixels(frontFace(position, size), camera);
      expect(pixel.x).toBeCloseTo(slots[index].x, 3);
      expect(pixel.y).toBeCloseTo(slots[index].y, 3);
    });
  });

  it('makes the faces of the landed dice DIE_PX wide, like the old flat dice', () => {
    const camera = makeCamera();
    const { positions, size } = fitLayout(camera, WIDTH, HEIGHT, slots)!;

    for (const position of positions) {
      const face = frontFace(position, size);
      const left = toPixels(face.clone().setX(face.x - size / 2), camera);
      const right = toPixels(face.clone().setX(face.x + size / 2), camera);
      expect(right.x - left.x).toBeCloseTo(DIE_PX, 3);
    }
  });

  it('rests the dice on the table', () => {
    const { positions, size } = fitLayout(makeCamera(), WIDTH, HEIGHT, slots)!;
    for (const position of positions) expect(position.y).toBeCloseTo(size / 2, 6);
  });

  it('fits smaller dice when the row is narrow', () => {
    const diePx = 40;
    const camera = makeCamera();
    const narrowSlots = slotsFor(6, 10, 110, diePx);
    const { positions, size } = fitLayout(camera, WIDTH, HEIGHT, narrowSlots, diePx)!;

    positions.forEach((position, index) => {
      const face = frontFace(position, size);
      const left = toPixels(face.clone().setX(face.x - size / 2), camera);
      const right = toPixels(face.clone().setX(face.x + size / 2), camera);
      expect(right.x - left.x).toBeCloseTo(diePx, 3);
      expect((left.x + right.x) / 2).toBeCloseTo(narrowSlots[index].x, 3);
    });
  });

  it('gives up (null) for a row above the horizon or no dice at all', () => {
    expect(fitLayout(makeCamera(), WIDTH, HEIGHT, slotsFor(1, 0, 0))).toBeNull();
    expect(fitLayout(makeCamera(), WIDTH, HEIGHT, [])).toBeNull();
  });
});

describe('poseAt', () => {
  const finalPosition = new Vector3(0.3, 0.4, -4);
  const finalQuaternion = faceQuaternion(5);
  const size = 0.8;
  const dieThrow = createThrow(() => 0.5);
  const end = dieThrow.delayMs + dieThrow.durationMs;

  it('starts far away and up in the air', () => {
    const pose = poseAt(dieThrow, finalPosition, finalQuaternion, size, dieThrow.delayMs);
    expect(pose.position.z).toBeLessThanOrEqual(finalPosition.z - 14 * size);
    expect(pose.position.y).toBeGreaterThan(finalPosition.y + size);
    expect(pose.started).toBe(true);
    expect(pose.done).toBe(false);
  });

  it('is hidden while waiting for its delay', () => {
    const delayed = createThrow(() => 0.9);
    expect(poseAt(delayed, finalPosition, finalQuaternion, size, 0).started).toBe(false);
  });

  it('comes closer all the way and never goes through the table', () => {
    let previousZ = -Infinity;
    for (let elapsed = dieThrow.delayMs; elapsed <= end; elapsed += 10) {
      const { position } = poseAt(dieThrow, finalPosition, finalQuaternion, size, elapsed);
      expect(position.z).toBeGreaterThanOrEqual(previousZ);
      expect(position.y).toBeGreaterThanOrEqual(finalPosition.y - 1e-9);
      previousZ = position.z;
    }
  });

  it('lands exactly on its final position, showing its value', () => {
    const pose = poseAt(dieThrow, finalPosition, finalQuaternion, size, end + 1);
    expect(pose.done).toBe(true);
    expect(pose.position.distanceTo(finalPosition)).toBeLessThan(1e-9);
    expect(pose.quaternion.angleTo(finalQuaternion)).toBeLessThan(1e-6);
  });

  it('is already landed without animation when motion is reduced', () => {
    const pose = poseAt(LANDED, finalPosition, finalQuaternion, size, 0);
    expect(pose.done).toBe(true);
    expect(pose.started).toBe(true);
    expect(pose.position.distanceTo(finalPosition)).toBeLessThan(1e-9);
    expect(pose.quaternion.angleTo(new Quaternion().copy(finalQuaternion))).toBeLessThan(1e-6);
  });
});

describe('diePxFor', () => {
  it('keeps the usual size when 6 dice fit', () => {
    expect(diePxFor(600)).toBe(DIE_PX);
  });

  it('shrinks the dice so that 6 of them (and their gaps) fit in a narrow row', () => {
    const diePx = diePxFor(300);
    const slots = slotsFor(6, 0, 0, diePx);
    expect(diePx).toBeLessThan(DIE_PX);
    expect(slots[5].x + diePx / 2).toBeLessThanOrEqual(300);
  });

  it('never makes them unreadably small', () => {
    expect(diePxFor(50)).toBe(24);
  });
});
