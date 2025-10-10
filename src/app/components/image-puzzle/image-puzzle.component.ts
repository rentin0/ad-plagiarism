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
  readonly snapThreshold = 50; // スナップ判定の閾値

  pieces = signal<PuzzlePiece[]>([]);
  isCompleted = signal(false);
  imageUrl = 'https://picsum.photos/450/450'; // 450x450のランダム画像
  maxZIndex = 1;

  ngOnInit() {
    this.initializePuzzle();
  }

  initializePuzzle() {
    const newPieces: PuzzlePiece[] = [];
    const shuffledPositions = this.getShuffledPositions();

    for (let i = 0; i < this.gridSize * this.gridSize; i++) {
      const row = Math.floor(i / this.gridSize);
      const col = i % this.gridSize;
      const shuffledPos = shuffledPositions[i];

      newPieces.push({
        id: i,
        correctIndex: i,
        imageUrl: this.imageUrl,
        gridPosition: { x: col, y: row }, // 正解のグリッド位置
        currentPosition: {
          x: shuffledPos.x * this.pieceSize,
          y: shuffledPos.y * this.pieceSize
        }, // シャッフルされた初期位置
        zIndex: i
      });
    }

    this.pieces.set(newPieces);
    this.isCompleted.set(false);
    this.maxZIndex = this.gridSize * this.gridSize;
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
    const gridX = Math.round(x / this.pieceSize);
    const gridY = Math.round(y / this.pieceSize);

    // グリッド範囲内かチェック
    if (gridX < 0 || gridX >= this.gridSize || gridY < 0 || gridY >= this.gridSize) {
      return null;
    }

    const snappedX = gridX * this.pieceSize;
    const snappedY = gridY * this.pieceSize;

    // 閾値以内ならスナップ
    const distance = Math.sqrt(Math.pow(x - snappedX, 2) + Math.pow(y - snappedY, 2));

    if (distance <= this.snapThreshold) {
      return { x: snappedX, y: snappedY };
    }

    return null;
  }

  checkCompletion() {
    const pieces = this.pieces();
    const isComplete = pieces.every(piece => {
      const correctX = piece.gridPosition.x * this.pieceSize;
      const correctY = piece.gridPosition.y * this.pieceSize;
      return piece.currentPosition.x === correctX && piece.currentPosition.y === correctY;
    });

    this.isCompleted.set(isComplete);
  }

  reset() {
    this.initializePuzzle();
  }

  getBackgroundPosition(piece: PuzzlePiece): string {
    return `${-piece.gridPosition.x * this.pieceSize}px ${-piece.gridPosition.y * this.pieceSize}px`;
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
}
