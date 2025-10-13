import { Component, signal, computed, ChangeDetectionStrategy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProgressBarModule } from 'primeng/progressbar';
import { SkeletonModule } from 'primeng/skeleton';
import { ButtonModule } from 'primeng/button';
import { PuzzlePathGenerator } from '../../services/puzzle-path-generator';
import { PuzzlePieceComponent, PuzzlePiece } from '../puzzle-piece/puzzle-piece.component';

/**
 * 画像パズルメインコンポーネント
 * パズル全体の状態管理、ピース生成、完了判定を担当
 */
@Component({
  selector: 'app-image-puzzle',
  imports: [CommonModule, PuzzlePieceComponent, ProgressBarModule, SkeletonModule, ButtonModule],
  templateUrl: './image-puzzle.component.html',
  styleUrl: './image-puzzle.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ImagePuzzleComponent implements OnInit {
  readonly gridSize = 3;
  readonly pieceSize = 150; // ピースのサイズ（ピクセル）
  readonly pieceGap = 0; // ピース間の隙間
  readonly snapThreshold = 50; // スナップ判定の閾値

  pieces = signal<PuzzlePiece[]>([]);
  isCompleted = signal(false);
  isLoading = signal(true);
  isAnimating = signal(false);
  showHint = signal(false);
  imageUrl = 'https://picsum.photos/450/450'; // 450x450のランダム画像
  maxZIndex = 1;

  private pathGenerator = new PuzzlePathGenerator(this.pieceSize);
  private inactivityTimer?: ReturnType<typeof setTimeout>;

  /**
   * コンポーネント初期化時の処理
   * 画像をプリロードしてからパズルを初期化
   */
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

  /**
   * パズルを初期化
   * ピースを生成し、1秒後にシャッフル位置へアニメーション移動
   */
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
      const shuffledPieces = pieces.map((piece, index) => {
        const shuffledPos = shuffledPositions[index];
        return {
          ...piece,
          currentPosition: {
            x: shuffledPos.x * (this.pieceSize + this.pieceGap),
            y: shuffledPos.y * (this.pieceSize + this.pieceGap)
          }
        };
      });
      this.pieces.set(shuffledPieces);

      // アニメーション完了後にフラグをオフ
      setTimeout(() => {
        this.isAnimating.set(false);
        this.resetInactivityTimer();
      }, 1000);
    }, 1000);
  }

  /**
   * パズルピースの辺の形状マトリクスを生成
   * 隣接するピースが正しく組み合わさるように凸凹を決定
   * @returns 横方向と縦方向の辺の形状マトリクス
   */
  generateEdgeMatrix() {
    // 横方向の辺（縦の線）
    const horizontalEdges: boolean[][] = [];
    for (let row = 0; row < this.gridSize; row++) {
      horizontalEdges[row] = [];
      for (let col = 0; col < this.gridSize - 1; col++) {
        horizontalEdges[row][col] = Math.random() > 0.5; // true=凸（タブ）, false=凹（ブランク）
      }
    }

    // 縦方向の辺（横の線）
    const verticalEdges: boolean[][] = [];
    for (let row = 0; row < this.gridSize - 1; row++) {
      verticalEdges[row] = [];
      for (let col = 0; col < this.gridSize; col++) {
        verticalEdges[row][col] = Math.random() > 0.5; // true=凸（タブ）, false=凹（ブランク）
      }
    }

    return { horizontalEdges, verticalEdges };
  }

  /**
   * 指定位置のピースの各辺の形状を取得
   * 隣接ピースとの関係から各辺が凸(1)、凹(-1)、フラット(0)かを決定
   * @param row 行位置
   * @param col 列位置
   * @param edgeMatrix 辺の形状マトリクス
   * @returns 各辺の形状（top, right, bottom, left）
   */
  getPieceEdges(row: number, col: number, edgeMatrix: {
    horizontalEdges: boolean[][];
    verticalEdges: boolean[][];
  }) {
    const edges = {
      top: 0,
      right: 0,
      bottom: 0,
      left: 0
    };

    // 上辺（上のピースの下辺と逆）
    if (row === 0) {
      edges.top = 0; // フラット（端）
    } else {
      // verticalEdges[row-1][col] は「上のピースの下辺」を表す
      // 上のピースが 1（凸）なら、このピースは -1（凹）
      edges.top = edgeMatrix.verticalEdges[row - 1][col] ? -1 : 1;
    }

    // 右辺
    if (col === this.gridSize - 1) {
      edges.right = 0; // フラット（端）
    } else {
      // horizontalEdges[row][col] は「このピースの右辺」を表す
      edges.right = edgeMatrix.horizontalEdges[row][col] ? 1 : -1;
    }

    // 下辺
    if (row === this.gridSize - 1) {
      edges.bottom = 0; // フラット（端）
    } else {
      // verticalEdges[row][col] は「このピースの下辺」を表す
      edges.bottom = edgeMatrix.verticalEdges[row][col] ? 1 : -1;
    }

    // 左辺（左のピースの右辺と逆）
    if (col === 0) {
      edges.left = 0; // フラット（端）
    } else {
      // horizontalEdges[row][col-1] は「左のピースの右辺」を表す
      // 左のピースが 1（凸）なら、このピースは -1（凹）
      edges.left = edgeMatrix.horizontalEdges[row][col - 1] ? -1 : 1;
    }

    return edges;
  }

  /**
   * シャッフルされたピースの初期位置を取得
   * 全てのピースが正解位置と異なる位置になるまでシャッフルを繰り返す
   * @returns シャッフルされた位置の配列
   */
  getShuffledPositions(): { x: number; y: number }[] {
    const positions: { x: number; y: number }[] = [];

    for (let i = 0; i < this.gridSize * this.gridSize; i++) {
      const row = Math.floor(i / this.gridSize);
      const col = i % this.gridSize;
      positions.push({ x: col, y: row });
    }

    // 全てのピースが正解位置と異なるまでシャッフルを繰り返す
    let isValidShuffle = false;
    let shuffledPositions = [...positions];

    while (!isValidShuffle) {
      // Fisher-Yatesアルゴリズムでシャッフル
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

  /**
   * ピースの位置が変更された時の処理
   * ピースの位置とz-indexを更新し、完了判定とタイマーリセットを実行
   * @param event ピースと新しい位置の情報
   */
  onPositionChanged(event: { piece: PuzzlePiece; newPosition: { x: number; y: number } }) {
    const pieces = this.pieces();
    const index = pieces.findIndex(p => p.id === event.piece.id);

    if (index === -1) return;

    this.maxZIndex++;

    // 新しいオブジェクトを作成してイミュータブルに更新（OnPush戦略のため）
    const updatedPieces = pieces.map((p, i) =>
      i === index
        ? { ...p, currentPosition: event.newPosition, zIndex: this.maxZIndex }
        : p
    );

    this.pieces.set(updatedPieces);
    this.checkCompletion();
    this.resetInactivityTimer();
  }

  /**
   * 非アクティブタイマーをリセット
   * ヒント表示を停止し、新しいヒントサイクルを開始
   */
  resetInactivityTimer() {
    this.showHint.set(false);
    if (this.inactivityTimer) {
      clearTimeout(this.inactivityTimer);
    }
    this.startHintCycle();
  }

  /**
   * ヒント表示サイクルを開始
   * 5秒間非アクティブ後、1秒間ヒントを表示し、再度サイクルを開始
   */
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

  /**
   * パズルの進捗率を計算（0-100%）
   * 正しい位置にあるピースの割合を返す
   */
  progressValue = computed(() => {
    const pieces = this.pieces();
    if (pieces.length === 0) return 0;

    const gridStep = this.pieceSize + this.pieceGap;
    const correctCount = pieces.filter(piece => {
      const correctX = piece.gridPosition.x * gridStep;
      const correctY = piece.gridPosition.y * gridStep;
      return piece.currentPosition.x === correctX && piece.currentPosition.y === correctY;
    }).length;

    return Math.round((correctCount / pieces.length) * 100);
  });

  /**
   * パズル完了をチェック
   * 全てのピースが正しい位置にある場合、完了フラグをtrueに設定
   */
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

  /**
   * パズルをリセット
   * 新しいシャッフル配置でパズルを再初期化
   */
  reset() {
    this.initializePuzzle();
  }

  /**
   * 指定したピースを最前面に移動
   * @param piece 最前面に移動するピース
   */
  bringToFront(piece: PuzzlePiece) {
    const pieces = this.pieces();
    const index = pieces.findIndex(p => p.id === piece.id);

    if (index !== -1) {
      this.maxZIndex++;
      const updatedPieces = pieces.map((p, i) =>
        i === index ? { ...p, zIndex: this.maxZIndex } : p
      );
      this.pieces.set(updatedPieces);
    }
  }

  /**
   * ピースのSVGクリップパスを生成
   * @param piece パズルピース
   * @returns SVGパス文字列
   */
  getPuzzlePath(piece: PuzzlePiece): string {
    return this.pathGenerator.generatePath(piece.edges);
  }
}
