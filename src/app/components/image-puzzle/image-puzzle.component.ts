import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CdkDrag, CdkDragEnd } from '@angular/cdk/drag-drop';

interface PuzzlePiece {
  id: number;
  correctIndex: number;
  imageUrl: string;
  gridPosition: { x: number; y: number }; // 正解位置（グリッド座標）
  currentPosition: { x: number; y: number }; // 現在位置（ピクセル座標）
  zIndex: number;
  edges: {
    top: number;    // 0: flat, 1: tab(凸), -1: blank(凹)
    right: number;  // 0: flat, 1: tab(凸), -1: blank(凹)
    bottom: number; // 0: flat, 1: tab(凸), -1: blank(凹)
    left: number;   // 0: flat, 1: tab(凸), -1: blank(凹)
  };
}

@Component({
  selector: 'app-image-puzzle',
  standalone: true,
  imports: [CommonModule, CdkDrag],
  templateUrl: './image-puzzle.component.html',
  styleUrl: './image-puzzle.component.css'
})
export class ImagePuzzleComponent {
  readonly gridSize = 3;
  readonly pieceSize = 150; // px
  readonly pieceGap = 1; // ピース間の隙間
  readonly snapThreshold = 50; // スナップ判定の閾値

  pieces = signal<PuzzlePiece[]>([]);
  isCompleted = signal(false);
  imageUrl = 'https://picsum.photos/450/450'; // 450x450の固定画像(犬)
  maxZIndex = 1;

  ngOnInit() {
    // 画像をプリロード
    const img = new Image();
    img.src = this.imageUrl;
    img.onload = () => {
      this.initializePuzzle();
    };
  }

  initializePuzzle() {
    const newPieces: PuzzlePiece[] = [];
    const shuffledPositions = this.getShuffledPositions();
    const edgeMatrix = this.generateEdgeMatrix();

    console.log('Edge Matrix:', edgeMatrix);

    for (let i = 0; i < this.gridSize * this.gridSize; i++) {
      const row = Math.floor(i / this.gridSize);
      const col = i % this.gridSize;
      const shuffledPos = shuffledPositions[i];
      const edges = this.getPieceEdges(row, col, edgeMatrix);

      console.log(`Piece [${row}][${col}]:`, edges);

      newPieces.push({
        id: i,
        correctIndex: i,
        imageUrl: this.imageUrl,
        gridPosition: { x: col, y: row }, // 正解のグリッド位置
        currentPosition: {
          x: shuffledPos.x * (this.pieceSize + this.pieceGap),
          y: shuffledPos.y * (this.pieceSize + this.pieceGap)
        }, // シャッフルされた初期位置
        zIndex: i,
        edges: edges
      });
    }

    this.pieces.set(newPieces);
    this.isCompleted.set(false);
    this.maxZIndex = this.gridSize * this.gridSize;
  }

  generateEdgeMatrix() {
    // 横方向の辺（縦の線）
    const horizontalEdges: boolean[][] = [];
    for (let row = 0; row < this.gridSize; row++) {
      horizontalEdges[row] = [];
      for (let col = 0; col < this.gridSize - 1; col++) {
        horizontalEdges[row][col] = Math.random() > 0.5; // true=tab, false=blank
      }
    }

    // 縦方向の辺（横の線）
    const verticalEdges: boolean[][] = [];
    for (let row = 0; row < this.gridSize - 1; row++) {
      verticalEdges[row] = [];
      for (let col = 0; col < this.gridSize; col++) {
        verticalEdges[row][col] = Math.random() > 0.5; // true=tab, false=blank
      }
    }

    return { horizontalEdges, verticalEdges };
  }

  getPieceEdges(row: number, col: number, edgeMatrix: any) {
    const edges = {
      top: 0,
      right: 0,
      bottom: 0,
      left: 0
    };

    // 上辺 (上のピースの下辺と逆)
    if (row === 0) {
      edges.top = 0; // flat
    } else {
      // verticalEdges[row-1][col] は「上のピースの下辺」を表す
      // 上のピースが 1(tab) なら、このピースは -1(blank)
      edges.top = edgeMatrix.verticalEdges[row - 1][col] ? -1 : 1;
    }

    // 右辺
    if (col === this.gridSize - 1) {
      edges.right = 0; // flat
    } else {
      // horizontalEdges[row][col] は「このピースの右辺」を表す
      edges.right = edgeMatrix.horizontalEdges[row][col] ? 1 : -1;
    }

    // 下辺
    if (row === this.gridSize - 1) {
      edges.bottom = 0; // flat
    } else {
      // verticalEdges[row][col] は「このピースの下辺」を表す
      edges.bottom = edgeMatrix.verticalEdges[row][col] ? 1 : -1;
    }

    // 左辺 (左のピースの右辺と逆)
    if (col === 0) {
      edges.left = 0; // flat
    } else {
      // horizontalEdges[row][col-1] は「左のピースの右辺」を表す
      // 左のピースが 1(tab) なら、このピースは -1(blank)
      edges.left = edgeMatrix.horizontalEdges[row][col - 1] ? -1 : 1;
    }

    return edges;
  }

  getShuffledPositions(): { x: number; y: number }[] {
    const positions: { x: number; y: number }[] = [];

    for (let i = 0; i < this.gridSize * this.gridSize; i++) {
      const row = Math.floor(i / this.gridSize);
      const col = i % this.gridSize;
      positions.push({ x: col, y: row });
    }

    // Fisher-Yatesシャッフル
    for (let i = positions.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [positions[i], positions[j]] = [positions[j], positions[i]];
    }

    return positions;
  }

  onDragEnded(event: CdkDragEnd, piece: PuzzlePiece) {
    const pieces = this.pieces();
    const index = pieces.findIndex(p => p.id === piece.id);

    if (index === -1) return;

    // ドラッグ後の位置を計算（現在位置 + 移動距離）
    const newX = piece.currentPosition.x + event.distance.x;
    const newY = piece.currentPosition.y + event.distance.y;

    // グリッドにスナップするか判定
    const snappedPos = this.snapToGrid(newX, newY);

    if (snappedPos) {
      // スナップする
      pieces[index].currentPosition = snappedPos;

      // 最前面に
      this.maxZIndex++;
      pieces[index].zIndex = this.maxZIndex;
    }
    // スナップできない場合は元の位置のまま（移動しない）

    // ドラッグ位置をリセット（重要！）
    event.source.reset();

    this.pieces.set([...pieces]);
    this.checkCompletion();
  }

  snapToGrid(x: number, y: number): { x: number; y: number } | null {
    const gridStep = this.pieceSize + this.pieceGap;
    const gridX = Math.round(x / gridStep);
    const gridY = Math.round(y / gridStep);

    // グリッド範囲内かチェック
    if (gridX < 0 || gridX >= this.gridSize || gridY < 0 || gridY >= this.gridSize) {
      return null;
    }

    const snappedX = gridX * gridStep;
    const snappedY = gridY * gridStep;

    // 閾値以内ならスナップ
    const distance = Math.sqrt(Math.pow(x - snappedX, 2) + Math.pow(y - snappedY, 2));

    if (distance <= this.snapThreshold) {
      return { x: snappedX, y: snappedY };
    }

    return null;
  }

  checkCompletion() {
    const pieces = this.pieces();
    const gridStep = this.pieceSize + this.pieceGap;
    const isComplete = pieces.every(piece => {
      const correctX = piece.gridPosition.x * gridStep;
      const correctY = piece.gridPosition.y * gridStep;
      return piece.currentPosition.x === correctX && piece.currentPosition.y === correctY;
    });

    this.isCompleted.set(isComplete);
  }

  isCorrectPosition(piece: PuzzlePiece): boolean {
    const gridStep = this.pieceSize + this.pieceGap;
    const correctX = piece.gridPosition.x * gridStep;
    const correctY = piece.gridPosition.y * gridStep;
    return piece.currentPosition.x === correctX && piece.currentPosition.y === correctY;
  }

  reset() {
    this.initializePuzzle();
  }

  getBackgroundPosition(piece: PuzzlePiece): string {
    const margin = this.pieceSize * 0.24;
    const offsetX = -piece.gridPosition.x * this.pieceSize + margin;
    const offsetY = -piece.gridPosition.y * this.pieceSize + margin;
    return `${offsetX}px ${offsetY}px`;
  }

  getBackgroundSize(): string {
    const totalSize = this.pieceSize * this.gridSize;
    return `${totalSize}px ${totalSize}px`;
  }

  bringToFront(piece: PuzzlePiece) {
    const pieces = this.pieces();
    const index = pieces.findIndex(p => p.id === piece.id);

    if (index !== -1) {
      this.maxZIndex++;
      pieces[index].zIndex = this.maxZIndex;
      this.pieces.set([...pieces]);
    }
  }

  private addEdgeToPath(
    edgeType: number,
    direction: 'top' | 'right' | 'bottom' | 'left',
    size: number,
    radius: number,
    protrusion: number,
    margin: number
  ): string {
    if (edgeType === 0) {
      // flat edge
      const endpoints = {
        top: `${size + margin} ${margin}`,
        right: `${size + margin} ${size + margin}`,
        bottom: `${margin} ${size + margin}`,
        left: `${margin} ${margin}`
      };
      return ` L ${endpoints[direction]}`;
    }

    const isTab = edgeType === 1;
    const sweepFlag = isTab ? 0 : 1;
    const angleOffset = Math.asin(Math.min(1, Math.abs(protrusion) / radius));
    const arcDistance = radius * Math.cos(angleOffset);

    if (direction === 'top' || direction === 'bottom') {
      const cx = size / 2 + margin;
      const y = direction === 'top' ? margin : size + margin;
      const startX = direction === 'bottom' ? cx + arcDistance : cx - arcDistance;
      const endX = direction === 'bottom' ? cx - arcDistance : cx + arcDistance;
      const cornerX = size + margin;

      return ` L ${startX} ${y} A ${radius} ${radius} 0 1 ${sweepFlag} ${endX} ${y} L ${direction === 'top' ? cornerX : margin} ${y}`;
    } else {
      const cy = size / 2 + margin;
      const x = direction === 'right' ? size + margin : margin;
      const startY = direction === 'left' ? cy + arcDistance : cy - arcDistance;
      const endY = direction === 'left' ? cy - arcDistance : cy + arcDistance;
      const cornerY = size + margin;

      return ` L ${x} ${startY} A ${radius} ${radius} 0 1 ${sweepFlag} ${x} ${endY} L ${x} ${cornerY}`;
    }
  }

  getPuzzlePath(piece: PuzzlePiece): string {
    const size = this.pieceSize;
    const radius = size * 0.15;
    const protrusion = radius * 0.6;
    const margin = size * 0.24; // radius + protrusion = radius * 1.6 ≒ size * 0.24

    let path = `M ${margin} ${margin}`;

    path += this.addEdgeToPath(piece.edges.top, 'top', size, radius, protrusion, margin);
    path += this.addEdgeToPath(piece.edges.right, 'right', size, radius, protrusion, margin);
    path += this.addEdgeToPath(piece.edges.bottom, 'bottom', size, radius, protrusion, margin);
    path += this.addEdgeToPath(piece.edges.left, 'left', size, radius, protrusion, margin);

    path += ` Z`;
    return path;
  }
}
