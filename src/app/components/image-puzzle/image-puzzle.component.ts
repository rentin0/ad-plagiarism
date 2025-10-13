import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProgressBarModule } from 'primeng/progressbar';
import { SkeletonModule } from 'primeng/skeleton';
import { ButtonModule } from 'primeng/button';
import { PuzzlePathGenerator } from '../../services/puzzle-path-generator';
import { PuzzlePieceComponent, PuzzlePiece } from '../puzzle-piece/puzzle-piece.component';

@Component({
  selector: 'app-image-puzzle',
  standalone: true,
  imports: [CommonModule, PuzzlePieceComponent, ProgressBarModule, SkeletonModule, ButtonModule],
  templateUrl: './image-puzzle.component.html',
  styleUrl: './image-puzzle.component.css'
})
export class ImagePuzzleComponent {
  readonly gridSize = 3;
  readonly pieceSize = 150; // px
  readonly pieceGap = 0; // ピース間の隙間
  readonly snapThreshold = 50; // スナップ判定の閾値

  pieces = signal<PuzzlePiece[]>([]);
  isCompleted = signal(false);
  isLoading = signal(true);
  isAnimating = signal(false);
  showHint = signal(false);
  imageUrl = 'https://picsum.photos/450/450'; // 450x450の固定画像(犬)
  maxZIndex = 1;

  private pathGenerator: PuzzlePathGenerator;
  private inactivityTimer?: ReturnType<typeof setTimeout>;

  constructor() {
    this.pathGenerator = new PuzzlePathGenerator(this.pieceSize);
  }

  ngOnInit() {
    // 画像をプリロード
    this.isLoading.set(true);
    const img = new Image();
    img.src = this.imageUrl;
    img.onload = () => {
      this.initializePuzzle();
      this.isLoading.set(false);
    };
  }

  initializePuzzle() {
    const newPieces: PuzzlePiece[] = [];
    const shuffledPositions = this.getShuffledPositions();
    const edgeMatrix = this.generateEdgeMatrix();

    for (let i = 0; i < this.gridSize * this.gridSize; i++) {
      const row = Math.floor(i / this.gridSize);
      const col = i % this.gridSize;
      const edges = this.getPieceEdges(row, col, edgeMatrix);

      newPieces.push({
        id: i,
        imageUrl: this.imageUrl,
        gridPosition: { x: col, y: row },
        currentPosition: {
          x: col * (this.pieceSize + this.pieceGap),
          y: row * (this.pieceSize + this.pieceGap)
        },
        zIndex: 100 + i,
        edges: edges
      });
    }

    this.pieces.set(newPieces);
    this.isCompleted.set(false);
    this.maxZIndex = 100 + this.gridSize * this.gridSize;

    // 1秒後にシャッフル位置へアニメーション
    setTimeout(() => {
      this.isAnimating.set(true);
      const pieces = this.pieces();
      pieces.forEach((piece, index) => {
        const shuffledPos = shuffledPositions[index];
        piece.currentPosition = {
          x: shuffledPos.x * (this.pieceSize + this.pieceGap),
          y: shuffledPos.y * (this.pieceSize + this.pieceGap)
        };
      });
      this.pieces.set([...pieces]);

      // アニメーション完了後にフラグをオフ
      setTimeout(() => {
        this.isAnimating.set(false);
        this.resetInactivityTimer();
      }, 1000);
    }, 1000);
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

    // 正解位置と完全に一致しないまでシャッフルを繰り返す
    let isValidShuffle = false;
    let shuffledPositions = [...positions];

    while (!isValidShuffle) {
      // Fisher-Yatesシャッフル
      for (let i = shuffledPositions.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffledPositions[i], shuffledPositions[j]] = [shuffledPositions[j], shuffledPositions[i]];
      }

      // 全てのピースが正解位置と異なるかチェック
      isValidShuffle = shuffledPositions.every((pos, index) => {
        const correctRow = Math.floor(index / this.gridSize);
        const correctCol = index % this.gridSize;
        return pos.x !== correctCol || pos.y !== correctRow;
      });
    }

    return shuffledPositions;
  }

  onPositionChanged(event: { piece: PuzzlePiece; newPosition: { x: number; y: number } }) {
    const pieces = this.pieces();
    const index = pieces.findIndex(p => p.id === event.piece.id);

    if (index === -1) return;

    pieces[index].currentPosition = event.newPosition;

    this.maxZIndex++;
    pieces[index].zIndex = this.maxZIndex;

    this.pieces.set([...pieces]);
    this.checkCompletion();
    this.resetInactivityTimer();
  }

  resetInactivityTimer() {
    this.showHint.set(false);
    if (this.inactivityTimer) {
      clearTimeout(this.inactivityTimer);
    }
    this.startHintCycle();
  }

  private startHintCycle() {
    this.inactivityTimer = setTimeout(() => {
      if (!this.isCompleted()) {
        this.showHint.set(true);
        setTimeout(() => {
          this.showHint.set(false);
          this.startHintCycle(); // 再度サイクルを開始
        }, 1000);
      }
    }, 5000);
  }

  get progressValue(): number {
    const pieces = this.pieces();
    if (pieces.length === 0) return 0;

    const gridStep = this.pieceSize + this.pieceGap;
    const correctCount = pieces.filter(piece => {
      const correctX = piece.gridPosition.x * gridStep;
      const correctY = piece.gridPosition.y * gridStep;
      return piece.currentPosition.x === correctX && piece.currentPosition.y === correctY;
    }).length;

    return Math.round((correctCount / pieces.length) * 100);
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

  reset() {
    this.initializePuzzle();
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

  getPuzzlePath(piece: PuzzlePiece): string {
    return this.pathGenerator.generatePath(piece.edges);
  }
}
