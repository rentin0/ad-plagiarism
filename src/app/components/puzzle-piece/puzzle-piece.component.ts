import { Component, input, output, computed, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CdkDrag, CdkDragEnd } from '@angular/cdk/drag-drop';

/**
 * パズルピースのデータ構造
 */
export interface PuzzlePiece {
  /** ピースの一意なID */
  id: number;
  /** 画像のURL */
  imageUrl: string;
  /** グリッド上の正解位置 */
  gridPosition: { x: number; y: number };
  /** 現在の表示位置 */
  currentPosition: { x: number; y: number };
  /** 重なり順序（z-index） */
  zIndex: number;
  /** 各辺の形状（0: フラット, 1: 凸, -1: 凹） */
  edges: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
}

/**
 * パズルピースコンポーネント
 * 個々のパズルピースを表示し、ドラッグ＆ドロップの操作を処理
 */
@Component({
  selector: 'app-puzzle-piece',
  imports: [CommonModule, CdkDrag],
  templateUrl: './puzzle-piece.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PuzzlePieceComponent {
  piece = input.required<PuzzlePiece>();
  pieceSize = input.required<number>();
  gridSize = input.required<number>();
  pieceGap = input.required<number>();
  snapThreshold = input.required<number>();
  isAnimating = input<boolean>(false);
  showHint = input<boolean>(false);

  positionChanged = output<{ piece: PuzzlePiece; newPosition: { x: number; y: number } }>();
  bringToFront = output<void>();

  /** スナップアニメーション中かどうか */
  isSnapping = false;
  /** 前回の位置チェック時に正解位置だったか */
  private wasCorrect = false;

  /**
   * ピースが正しい位置にあるかどうかを計算
   */
  isCorrect = computed(() => {
    const gridStep = this.pieceSize() + this.pieceGap();
    const correctX = this.piece().gridPosition.x * gridStep;
    const correctY = this.piece().gridPosition.y * gridStep;
    return this.piece().currentPosition.x === correctX && this.piece().currentPosition.y === correctY;
  });

  /**
   * 画像の背景位置を計算（ピースの正しい部分を表示するため）
   */
  backgroundPosition = computed(() => {
    const margin = this.pieceSize() * 0.24;
    const offsetX = -this.piece().gridPosition.x * this.pieceSize() + margin;
    const offsetY = -this.piece().gridPosition.y * this.pieceSize() + margin;
    return `${offsetX}px ${offsetY}px`;
  });

  /**
   * 画像の背景サイズを計算（グリッド全体のサイズ）
   */
  backgroundSize = computed(() => {
    const totalSize = this.pieceSize() * this.gridSize();
    return `${totalSize}px ${totalSize}px`;
  });

  /**
   * ドラッグ終了時の処理
   * ピースをグリッドにスナップさせ、正しい位置の場合はアニメーション表示
   * @param event ドラッグイベント
   */
  onDragEnded(event: CdkDragEnd) {
    const newX = this.piece().currentPosition.x + event.distance.x;
    const newY = this.piece().currentPosition.y + event.distance.y;
    const snappedPos = this.snapToGrid(newX, newY);

    if (snappedPos) {
      const gridStep = this.pieceSize() + this.pieceGap();
      const willBeCorrect =
        snappedPos.x === this.piece().gridPosition.x * gridStep &&
        snappedPos.y === this.piece().gridPosition.y * gridStep;

      if (!this.wasCorrect && willBeCorrect) {
        this.isSnapping = true;
        setTimeout(() => this.isSnapping = false, 750);
      }

      this.wasCorrect = willBeCorrect;
      this.positionChanged.emit({ piece: this.piece(), newPosition: snappedPos });
    }

    event.source.reset();
  }

  /**
   * 座標を最も近いグリッド位置にスナップ
   * @param x X座標
   * @param y Y座標
   * @returns スナップ後の座標、またはスナップ範囲外の場合null
   */
  private snapToGrid(x: number, y: number): { x: number; y: number } | null {
    const gridStep = this.pieceSize() + this.pieceGap();
    const gridX = Math.round(x / gridStep);
    const gridY = Math.round(y / gridStep);

    if (gridX < 0 || gridX >= this.gridSize() || gridY < 0 || gridY >= this.gridSize()) {
      return null;
    }

    const snappedX = gridX * gridStep;
    const snappedY = gridY * gridStep;

    const distance = Math.sqrt(Math.pow(x - snappedX, 2) + Math.pow(y - snappedY, 2));

    if (distance <= this.snapThreshold()) {
      return { x: snappedX, y: snappedY };
    }

    return null;
  }

  /**
   * マウスダウン時の処理
   * ピースを最前面に移動
   */
  onMouseDown() {
    this.bringToFront.emit();
  }
}
