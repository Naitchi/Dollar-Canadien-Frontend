import { CanvasTexture, SRGBColorSpace } from 'three';

// Same color as the old flat dice.
const DIE_COLOR = '#f5f5f5';

// Pip positions on a face, as fractions of its width/height.
const PIPS: Record<number, [number, number][]> = {
  1: [[0.5, 0.5]],
  2: [
    [0.27, 0.27],
    [0.73, 0.73],
  ],
  3: [
    [0.27, 0.27],
    [0.5, 0.5],
    [0.73, 0.73],
  ],
  4: [
    [0.27, 0.27],
    [0.73, 0.27],
    [0.27, 0.73],
    [0.73, 0.73],
  ],
  5: [
    [0.27, 0.27],
    [0.73, 0.27],
    [0.5, 0.5],
    [0.27, 0.73],
    [0.73, 0.73],
  ],
  6: [
    [0.27, 0.25],
    [0.27, 0.5],
    [0.27, 0.75],
    [0.73, 0.25],
    [0.73, 0.5],
    [0.73, 0.75],
  ],
};

/**
 * Draws the face of a die showing `value`.
 *
 * @param {number} value - The die value (1-6).
 * @returns {CanvasTexture} The texture of that face.
 */
export const createFaceTexture = (value: number): CanvasTexture => {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const context = canvas.getContext('2d')!;
  context.fillStyle = DIE_COLOR;
  context.fillRect(0, 0, 256, 256);
  // Like on most real dice, the single pip of the 1 is bigger and red.
  context.fillStyle = value === 1 ? '#c0392b' : '#1b1b1b';
  for (const [x, y] of PIPS[value]) {
    context.beginPath();
    context.arc(x * 256, y * 256, value === 1 ? 36 : 23, 0, Math.PI * 2);
    context.fill();
  }
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  texture.anisotropy = 4;
  return texture;
};
