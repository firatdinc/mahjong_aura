import {LayoutTemplate} from '../../types/tileMatch';

export interface Position {
  row: number;
  col: number;
  layer: number;
}

/**
 * Generate a layout of tile positions for the given template.
 * Returns exactly `totalTiles` positions distributed across layers.
 */
export function generateLayout(
  template: LayoutTemplate,
  totalTiles: number,
  maxLayers: number,
): Position[] {
  switch (template) {
    case 'rectangle':
      return generateRectangle(totalTiles, maxLayers);
    case 'pyramid':
      return generatePyramid(totalTiles, maxLayers);
    case 'diamond':
      return generateDiamond(totalTiles, maxLayers);
    case 'cross':
      return generateCross(totalTiles, maxLayers);
    default:
      return generateRectangle(totalTiles, maxLayers);
  }
}

function generateRectangle(totalTiles: number, maxLayers: number): Position[] {
  const positions: Position[] = [];
  const tilesPerLayer = Math.ceil(totalTiles / maxLayers);
  const cols = 6;
  const rows = Math.ceil(tilesPerLayer / cols);

  let remaining = totalTiles;
  for (let layer = 0; layer < maxLayers && remaining > 0; layer++) {
    const layerTiles = Math.min(remaining, tilesPerLayer);
    const layerRows = Math.ceil(layerTiles / cols);
    const offsetR = layer * 0.5;
    const offsetC = layer * 0.5;
    let placed = 0;
    for (let r = 0; r < layerRows && placed < layerTiles; r++) {
      for (let c = 0; c < cols && placed < layerTiles; c++) {
        positions.push({row: r + offsetR, col: c + offsetC, layer});
        placed++;
      }
    }
    remaining -= layerTiles;
  }

  return positions;
}

function generatePyramid(totalTiles: number, maxLayers: number): Position[] {
  const positions: Position[] = [];
  // Each layer gets smaller
  const baseCols = 6;
  const baseRows = Math.ceil(totalTiles / (maxLayers * baseCols)) + maxLayers;

  let remaining = totalTiles;
  for (let layer = 0; layer < maxLayers && remaining > 0; layer++) {
    const shrink = layer;
    const cols = Math.max(2, baseCols - shrink);
    const rows = Math.max(1, baseRows - shrink);
    const layerTiles = Math.min(remaining, cols * rows);
    const offsetR = layer * 0.5 + shrink * 0.5;
    const offsetC = layer * 0.5 + shrink * 0.5;

    let placed = 0;
    for (let r = 0; r < rows && placed < layerTiles; r++) {
      for (let c = 0; c < cols && placed < layerTiles; c++) {
        positions.push({row: r + offsetR, col: c + offsetC, layer});
        placed++;
      }
    }
    remaining -= layerTiles;
  }

  return positions;
}

function generateDiamond(totalTiles: number, maxLayers: number): Position[] {
  const positions: Position[] = [];
  const tilesPerLayer = Math.ceil(totalTiles / maxLayers);
  const size = Math.ceil(Math.sqrt(tilesPerLayer));
  const center = size / 2;

  let remaining = totalTiles;
  for (let layer = 0; layer < maxLayers && remaining > 0; layer++) {
    const layerTiles = Math.min(remaining, tilesPerLayer);
    const offset = layer * 0.5;
    let placed = 0;
    for (let r = 0; r < size && placed < layerTiles; r++) {
      for (let c = 0; c < size && placed < layerTiles; c++) {
        const dist = Math.abs(r - center) + Math.abs(c - center);
        if (dist <= center) {
          positions.push({row: r + offset, col: c + offset, layer});
          placed++;
        }
      }
    }
    remaining -= placed;
  }

  // Fill any remaining with extra positions on top layer
  while (positions.length < totalTiles) {
    const last = positions[positions.length - 1];
    positions.push({
      row: last.row + 0.5,
      col: last.col + 0.5,
      layer: last.layer,
    });
  }

  return positions.slice(0, totalTiles);
}

function generateCross(totalTiles: number, maxLayers: number): Position[] {
  const positions: Position[] = [];
  const tilesPerLayer = Math.ceil(totalTiles / maxLayers);
  const armLength = Math.ceil(Math.sqrt(tilesPerLayer / 5));
  const armWidth = Math.max(2, Math.ceil(armLength / 2));

  let remaining = totalTiles;
  for (let layer = 0; layer < maxLayers && remaining > 0; layer++) {
    const offset = layer * 0.5;
    const layerPositions: Position[] = [];

    // Center block
    for (let r = 0; r < armWidth; r++) {
      for (let c = 0; c < armWidth; c++) {
        layerPositions.push({
          row: armLength + r + offset,
          col: armLength + c + offset,
          layer,
        });
      }
    }

    // Arms (top, bottom, left, right)
    for (let i = 0; i < armLength; i++) {
      for (let w = 0; w < armWidth; w++) {
        // Top
        layerPositions.push({row: i + offset, col: armLength + w + offset, layer});
        // Bottom
        layerPositions.push({row: armLength + armWidth + i + offset, col: armLength + w + offset, layer});
        // Left
        layerPositions.push({row: armLength + w + offset, col: i + offset, layer});
        // Right
        layerPositions.push({row: armLength + w + offset, col: armLength + armWidth + i + offset, layer});
      }
    }

    const layerTiles = Math.min(remaining, layerPositions.length);
    positions.push(...layerPositions.slice(0, layerTiles));
    remaining -= layerTiles;
  }

  // Ensure we have exactly totalTiles positions
  while (positions.length < totalTiles) {
    const last = positions[positions.length - 1];
    positions.push({
      row: last.row + 0.5,
      col: last.col + 0.5,
      layer: last.layer,
    });
  }

  return positions.slice(0, totalTiles);
}
