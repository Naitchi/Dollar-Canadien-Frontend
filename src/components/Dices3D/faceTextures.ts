import { CanvasTexture, SRGBColorSpace } from 'three';

import { MAPLE_LEAF_POINTS } from '../ui/Brand';
import { PIPS } from '../ui/DieFace';

// Same art as the flat dice (ui/DieFace): white face, ink outline, navy pips,
// and a red maple leaf for the 1. The outline is drawn at the edge of every
// face, so the die's silhouette stands out from the light mat.
const DIE_COLOR = '#ffffff';
const INK = '#111e2e';
const PIP_COLOR = '#1e293b';
const LEAF_COLOR = '#ff4757';
const SIZE = 256;
const BORDER = 22;

const drawLeaf = (context: CanvasRenderingContext2D) => {
  // The leaf is drawn in a 100×100 box, centred on the face.
  const scale = 1.25;
  const offset = (SIZE - 100 * scale) / 2;
  context.beginPath();
  MAPLE_LEAF_POINTS.forEach(([x, y], index) => {
    const px = offset + x * scale;
    const py = offset + y * scale + 4;
    if (index === 0) context.moveTo(px, py);
    else context.lineTo(px, py);
  });
  context.closePath();
  context.fillStyle = LEAF_COLOR;
  context.fill();
  context.lineJoin = 'round';
  context.lineWidth = 9;
  context.strokeStyle = INK;
  context.stroke();
};

/**
 * Draws the face of a die showing `value`.
 *
 * @param {number} value - The die value (1-6).
 * @returns {CanvasTexture} The texture of that face.
 */
export const createFaceTexture = (value: number): CanvasTexture => {
  const canvas = document.createElement('canvas');
  canvas.width = SIZE;
  canvas.height = SIZE;
  const context = canvas.getContext('2d')!;
  // Ink edge, then the white face inside it.
  context.fillStyle = INK;
  context.fillRect(0, 0, SIZE, SIZE);
  context.fillStyle = DIE_COLOR;
  context.beginPath();
  if (typeof context.roundRect === 'function') {
    context.roundRect(BORDER, BORDER, SIZE - 2 * BORDER, SIZE - 2 * BORDER, 34);
  } else {
    context.rect(BORDER, BORDER, SIZE - 2 * BORDER, SIZE - 2 * BORDER);
  }
  context.fill();

  if (value === 1) {
    drawLeaf(context);
  } else {
    context.fillStyle = PIP_COLOR;
    for (const [x, y] of PIPS[value]) {
      context.beginPath();
      context.arc(BORDER + x * (SIZE - 2 * BORDER), BORDER + y * (SIZE - 2 * BORDER), 21, 0, Math.PI * 2);
      context.fill();
    }
  }
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  texture.anisotropy = 4;
  return texture;
};
