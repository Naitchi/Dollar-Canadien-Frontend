import {
  DirectionalLight,
  HemisphereLight,
  Mesh,
  MeshStandardMaterial,
  PCFShadowMap,
  PerspectiveCamera,
  PlaneGeometry,
  Quaternion,
  Scene,
  ShadowMaterial,
  Vector3,
  WebGLRenderer,
} from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';

import {
  DIE_PX,
  DiceLayout,
  DiePose,
  DieThrow,
  FACE_VALUES,
  LANDED,
  createThrow,
  faceQuaternion,
  fitLayout,
  poseAt,
  setupCamera,
  slotsFor,
} from './diceMath';
import { createFaceTexture } from './faceTextures';

// The three.js side of Dices3D, without React: the scene, where the dice
// land, throwing them and moving them frame by frame.

// A selected die rises by this much, like the old flat ones (translateY(-5px)).
const SELECTED_LIFT_PX = 5;
// A die hitting the attack number rises higher (the .hit overlay follows it).
const HIT_LIFT_PX = 10;

export interface Row {
  left: number;
  centerY: number;
  // Size of the dice, so that 6 of them fit in the row.
  diePx: number;
}

// Everything three.js, kept out of React state: it changes every frame.
export interface Stage {
  renderer: WebGLRenderer;
  scene: Scene;
  camera: PerspectiveCamera;
  light: DirectionalLight;
  floor: Mesh<PlaneGeometry, ShadowMaterial>;
  geometry: RoundedBoxGeometry;
  materials: MeshStandardMaterial[];
  dice: Mesh[];
  throws: DieThrow[];
  finalQuaternions: Quaternion[];
  lifts: number[];
  layout: DiceLayout | null;
  rollStart: number;
  settled: boolean;
  // Something changed (resize, new dice...): render the next frame even if nothing moves.
  dirty: boolean;
  pose: DiePose;
}

// Throws if WebGL isn't available.
export const createStage = (root: HTMLElement, canvasClassName: string): Stage => {
  const renderer = new WebGLRenderer({ alpha: true, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = PCFShadowMap;
  renderer.domElement.className = canvasClassName;
  root.prepend(renderer.domElement);

  const scene = new Scene();
  // Sky light, slightly green from below like the felt of the table.
  scene.add(new HemisphereLight(0xffffff, 0x3d6b33, 1.6));
  const light = new DirectionalLight(0xffffff, 2.2);
  light.castShadow = true;
  light.shadow.mapSize.set(1024, 1024);
  light.shadow.radius = 4; // soft shadow edges
  scene.add(light, light.target);
  // Invisible table that only shows the dice shadows.
  const floor = new Mesh(new PlaneGeometry(1, 1), new ShadowMaterial({ opacity: 0.3 }));
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  scene.add(floor);

  return {
    renderer,
    scene,
    camera: new PerspectiveCamera(),
    light,
    floor,
    geometry: new RoundedBoxGeometry(1, 1, 1, 4, 0.14),
    materials: FACE_VALUES.map(
      (value) => new MeshStandardMaterial({ map: createFaceTexture(value), roughness: 0.4 }),
    ),
    dice: [],
    throws: [],
    finalQuaternions: [],
    lifts: [],
    layout: null,
    rollStart: 0,
    settled: true,
    dirty: true,
    pose: { position: new Vector3(), quaternion: new Quaternion(), started: false, done: false },
  };
};

// Sizes the canvas and places the camera, the dice and the light so that the
// dice land on the row.
export const layoutStage = (stage: Stage, width: number, height: number, row: Row): void => {
  const { renderer, camera, light, floor } = stage;
  renderer.setSize(width, height, false);
  setupCamera(camera, width, height);

  const count = Math.max(stage.dice.length, 1);
  const slots = slotsFor(count, row.left, row.centerY, row.diePx);
  stage.layout = fitLayout(camera, width, height, slots, row.diePx);
  stage.dirty = true;
  if (!stage.layout) {
    // Don't leave old dice on screen: the flat fallback takes over.
    renderer.clear();
    return;
  }

  const { size, positions } = stage.layout;
  const center = positions[Math.floor((positions.length - 1) / 2)];
  light.position.set(center.x - 3 * size, 12 * size, center.z + 6 * size);
  light.target.position.set(center.x, 0, center.z - 6 * size);
  light.target.updateMatrixWorld();
  const shadowCamera = light.shadow.camera;
  shadowCamera.left = -20 * size;
  shadowCamera.right = 20 * size;
  shadowCamera.top = 20 * size;
  shadowCamera.bottom = -20 * size;
  shadowCamera.near = 0.1 * size;
  shadowCamera.far = 40 * size;
  shadowCamera.updateProjectionMatrix();
  light.shadow.normalBias = 0.02 * size;
  floor.position.set(center.x, 0, center.z - 15 * size);
  floor.scale.set(80 * size, 60 * size, 1);
};

/**
 * Replaces the dice on the table with new ones and throws them (or puts them
 * down directly when not animated).
 *
 * @param {Stage} stage - The stage (mutated).
 * @param {number[]} values - The values of the new dice.
 * @param {boolean} animated - False to put the dice down without throwing them.
 */
export const throwDice = (stage: Stage, values: number[], animated: boolean): void => {
  stage.dice.forEach((die) => stage.scene.remove(die));
  stage.dice = values.map(() => {
    const die = new Mesh(stage.geometry, stage.materials);
    die.castShadow = true;
    die.visible = false;
    stage.scene.add(die);
    return die;
  });
  const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  stage.throws = values.map(() => (reduceMotion || !animated ? LANDED : createThrow()));
  stage.finalQuaternions = values.map(faceQuaternion);
  stage.lifts = values.map(() => 0);
  stage.rollStart = performance.now();
  stage.settled = values.length === 0;
};

/**
 * Moves every die to where it should be at `now`, and renders the frame if
 * anything changed.
 *
 * @param {Stage} stage - The stage (mutated).
 * @param {number} now - The current time (requestAnimationFrame timestamp).
 * @param {number[]} selected - Indexes of the selected dice (they rise a little).
 * @param {number[]} hits - Indexes of the dice to highlight once landed (they rise more).
 * @returns {boolean} Whether anything is still moving.
 */
export const updateStage = (
  stage: Stage,
  now: number,
  selected: number[],
  hits: number[],
): boolean => {
  const current = stage.layout;
  if (!current) return false;

  let moving = false;
  stage.dice.forEach((die, index) => {
    const pose = poseAt(
      stage.throws[index],
      current.positions[index],
      stage.finalQuaternions[index],
      current.size,
      now - stage.rollStart,
      stage.pose,
    );
    if (!pose.done) moving = true;

    // Selected dice rise smoothly, like the old flat ones.
    // Hits only rise once every die has landed.
    const hit = stage.settled && hits.includes(index);
    const lift = hit
      ? HIT_LIFT_PX / DIE_PX
      : selected.includes(index)
        ? SELECTED_LIFT_PX / DIE_PX
        : 0;
    stage.lifts[index] += (lift - stage.lifts[index]) * 0.3;
    if (Math.abs(lift - stage.lifts[index]) > 1e-3) moving = true;
    else stage.lifts[index] = lift;

    die.visible = pose.started;
    die.position.copy(pose.position);
    die.position.y += stage.lifts[index] * current.size;
    die.quaternion.copy(pose.quaternion);
    die.scale.setScalar(current.size);
  });

  // Nothing moves once the dice have landed: stop rendering until something changes.
  if (moving || stage.dirty) {
    stage.renderer.render(stage.scene, stage.camera);
    stage.dirty = false;
  }
  return moving;
};

export const disposeStage = (stage: Stage): void => {
  stage.geometry.dispose();
  stage.materials.forEach((material) => {
    material.map?.dispose();
    material.dispose();
  });
  stage.floor.geometry.dispose();
  stage.floor.material.dispose();
  stage.renderer.dispose();
  // Browsers only allow a few WebGL contexts at once: free it right away.
  stage.renderer.forceContextLoss();
  stage.renderer.domElement.remove();
};
