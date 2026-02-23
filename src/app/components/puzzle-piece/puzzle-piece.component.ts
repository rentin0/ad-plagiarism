import { Component, inject, input, output, computed, effect, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CdkDrag, CdkDragEnd } from '@angular/cdk/drag-drop';
import { PuzzleStateService, TAB_RATIO } from '../../services/puzzle-state.service';

export interface PuzzlePiece {
  id: number;
  imageUrl: string;
  gridPosition: { x: number; y: number };
  currentPosition: { x: number; y: number };
  zIndex: number;
  /** 各辺の形状（0: フラット, 1: 凸, -1: 凹） */
  edges: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
}

@Component({
  selector: 'app-puzzle-piece',
  imports: [CommonModule, CdkDrag],
  templateUrl: './puzzle-piece.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PuzzlePieceComponent {
  private readonly puzzleState = inject(PuzzleStateService);

  piece = input.required<PuzzlePiece>();

  dragEnded = output<{ pieceId: number; delta: { x: number; y: number } }>();
  dragStarted = output<{ pieceId: number }>();

  isSnapping = false;
  private wasCorrect = false;

  constructor() {
    effect(() => {
      const correct = this.isCorrect();
      if (correct && !this.wasCorrect) {
        this.isSnapping = true;
        setTimeout(() => this.isSnapping = false, 750);
      }
      this.wasCorrect = correct;
    });
  }

  readonly isAnimating = this.puzzleState.isAnimating;
  readonly showHint = this.puzzleState.showHint;

  isCorrect = computed(() => {
    const gridStep = this.puzzleState.gridStep();
    const { gridPosition, currentPosition } = this.piece();
    return currentPosition.x === gridPosition.x * gridStep
        && currentPosition.y === gridPosition.y * gridStep;
  });

  isDragDisabled = computed(() => this.isCorrect() || this.isAnimating());

  /** ドラッグ可否・アニメーション・ヒント等をまとめたクラスマップ */
  cssClasses = computed(() => {
    const animating = this.isAnimating();
    const correct = this.isCorrect();
    const hinting = this.showHint() && !correct;
    return {
      'absolute': true,
      'transition-none': !animating,
      'transition-all': animating,
      'duration-500': animating,
      'animate-pulse-scale': hinting,
      'cursor-move': !correct && !animating,
      'cursor-default': correct || animating,
    };
  });

  /** 位置・サイズ・z-indexをまとめたスタイルオブジェクト */
  cssStyles = computed(() => {
    const size = this.puzzleState.renderSize();
    const offset = this.renderOffset();
    const zIndex = this.isCorrect() ? 0 : this.piece().zIndex;
    return {
      'width.px': size,
      'height.px': size,
      'left.px': offset.x,
      'top.px': offset.y,
      'z-index': zIndex,
    };
  });

  /** 画像レイヤーのスタイル */
  imageStyles = computed(() => {
    const ps = this.puzzleState.config().pieceSize;
    const { gridPosition } = this.piece();
    const margin = ps * TAB_RATIO;
    const { pieceSize, gridSize } = this.puzzleState.config();
    const total = pieceSize * gridSize;
    return {
      'clip-path': `url(#puzzle-clip-${this.piece().id})`,
      'background-image': `url(${this.piece().imageUrl})`,
      'background-position': `${-gridPosition.x * ps + margin}px ${-gridPosition.y * ps + margin}px`,
      'background-size': `${total}px ${total}px`,
    };
  });

  private renderOffset = computed(() => {
    const config = this.puzzleState.config();
    const { currentPosition } = this.piece();
    const tabOffset = config.pieceSize * TAB_RATIO;
    const padding = config.pieceSize * config.puzzleAreaPaddingRatio;
    return {
      x: currentPosition.x + padding - tabOffset,
      y: currentPosition.y + padding - tabOffset,
    };
  });

  onDragStarted() {
    this.dragStarted.emit({ pieceId: this.piece().id });
  }

  onDragEnded(event: CdkDragEnd) {
    this.dragEnded.emit({
      pieceId: this.piece().id,
      delta: { x: event.distance.x, y: event.distance.y },
    });
    event.source.reset();
  }
}
