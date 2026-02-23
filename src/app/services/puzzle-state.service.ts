import { Injectable, signal, computed } from '@angular/core';

export interface PuzzleConfig {
  pieceSize: number;
  gridSize: number;
  pieceGap: number;
  puzzleAreaPaddingRatio: number;
}

/** 凸凹（タブ）部分がピースサイズに占める比率 */
export const TAB_RATIO = 0.24;

/**
 * パズルの設定と表示状態を管理するサービス
 * 親コンポーネントで providers に指定し、子コンポーネントから inject で参照する
 */
@Injectable()
export class PuzzleStateService {
  private readonly _config = signal<PuzzleConfig>({
    pieceSize: 150,
    gridSize: 3,
    pieceGap: 0,
    puzzleAreaPaddingRatio: 0.3,
  });

  readonly config = this._config.asReadonly();
  readonly isAnimating = signal(false);
  readonly showHint = signal(false);

  readonly snapThreshold = 50;

  /** 凸凹を含むピース描画領域のサイズ */
  readonly renderSize = computed(() => {
    const ps = this._config().pieceSize;
    return ps + ps * TAB_RATIO * 2;
  });

  /** パズルエリアのパディング */
  readonly areaPadding = computed(() => {
    const { pieceSize, puzzleAreaPaddingRatio } = this._config();
    return pieceSize * puzzleAreaPaddingRatio;
  });

  /** パズルエリアの幅・高さ */
  readonly areaSize = computed(() => {
    const { pieceSize, pieceGap, gridSize } = this._config();
    const gridStep = pieceSize + pieceGap;
    return gridStep * gridSize - pieceGap + this.areaPadding() * 2;
  });

  /** スケルトン1個分のサイズ */
  readonly skeletonSize = computed(() => this._config().pieceSize - 6);

  /** グリッドの1ステップ幅 */
  readonly gridStep = computed(() => {
    const { pieceSize, pieceGap } = this._config();
    return pieceSize + pieceGap;
  });

  updateConfig(partial: Partial<PuzzleConfig>) {
    this._config.update(c => ({ ...c, ...partial }));
  }
}
