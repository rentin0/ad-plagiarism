/**
 * パズルピースの各辺の形状
 */
export interface PieceEdges {
  /** 上辺の形状 */
  top: number;    // 0: フラット, 1: 凸（タブ）, -1: 凹（ブランク）
  /** 右辺の形状 */
  right: number;
  /** 下辺の形状 */
  bottom: number;
  /** 左辺の形状 */
  left: number;
}

/**
 * パズルピースのSVGパス生成クラス
 * ピースの辺の形状（凸凹）に基づいてクリップパスを生成
 */
export class PuzzlePathGenerator {
  private radius: number;
  private protrusion: number;

  /**
   * コンストラクタ
   * @param pieceSize ピースのサイズ（ピクセル）
   * @param radius 凹凸の半径（デフォルト: pieceSize * 0.15）
   * @param protrusion 凹凸の突出量（デフォルト: radius * 0.6）
   */
  constructor(
    private pieceSize: number,
    radius?: number,
    protrusion?: number
  ) {
    this.radius = radius ?? pieceSize * 0.15;
    this.protrusion = protrusion ?? pieceSize * 0.15 * 0.6;
  }

  /**
   * ピース周囲のマージン（凸凹を描画するための余白）
   */
  get margin(): number {
    return this.pieceSize * 0.24;
  }

  /**
   * パズルピースのSVGパスを生成
   * @param edges ピースの各辺の形状
   * @returns SVGパス文字列
   */
  generatePath(edges: PieceEdges): string {
    let path = `M ${this.margin} ${this.margin}`;

    path += this.addEdgeToPath(edges.top, 'top');
    path += this.addEdgeToPath(edges.right, 'right');
    path += this.addEdgeToPath(edges.bottom, 'bottom');
    path += this.addEdgeToPath(edges.left, 'left');

    path += ` Z`;
    return path;
  }

  /**
   * 指定した辺のSVGパスを追加
   * @param edgeType 辺の形状（0: フラット, 1: 凸, -1: 凹）
   * @param direction 辺の方向
   * @returns SVGパス文字列の一部
   */
  private addEdgeToPath(
    edgeType: number,
    direction: 'top' | 'right' | 'bottom' | 'left'
  ): string {
    if (edgeType === 0) {
      return this.getFlatEdge(direction);
    }

    const isTab = edgeType === 1;
    const sweepFlag = isTab ? 0 : 1;
    const angleOffset = Math.asin(Math.min(1, Math.abs(this.protrusion) / this.radius));
    const arcDistance = this.radius * Math.cos(angleOffset);

    if (direction === 'top' || direction === 'bottom') {
      return this.getHorizontalEdge(direction, arcDistance, sweepFlag);
    } else {
      return this.getVerticalEdge(direction, arcDistance, sweepFlag);
    }
  }

  /**
   * フラット（直線）な辺のSVGパスを生成
   * @param direction 辺の方向
   * @returns SVGパス文字列の一部
   */
  private getFlatEdge(direction: 'top' | 'right' | 'bottom' | 'left'): string {
    const endpoints = {
      top: `${this.pieceSize + this.margin} ${this.margin}`,
      right: `${this.pieceSize + this.margin} ${this.pieceSize + this.margin}`,
      bottom: `${this.margin} ${this.pieceSize + this.margin}`,
      left: `${this.margin} ${this.margin}`
    };
    return ` L ${endpoints[direction]}`;
  }

  /**
   * 水平方向（上辺・下辺）の凹凸パスを生成
   * @param direction 辺の方向（top or bottom）
   * @param arcDistance 円弧の距離
   * @param sweepFlag SVG円弧の方向フラグ
   * @returns SVGパス文字列の一部
   */
  private getHorizontalEdge(
    direction: 'top' | 'bottom',
    arcDistance: number,
    sweepFlag: number
  ): string {
    const cx = this.pieceSize / 2 + this.margin;
    const y = direction === 'top' ? this.margin : this.pieceSize + this.margin;
    const startX = direction === 'bottom' ? cx + arcDistance : cx - arcDistance;
    const endX = direction === 'bottom' ? cx - arcDistance : cx + arcDistance;
    const cornerX = this.pieceSize + this.margin;

    return ` L ${startX} ${y} A ${this.radius} ${this.radius} 0 1 ${sweepFlag} ${endX} ${y} L ${direction === 'top' ? cornerX : this.margin} ${y}`;
  }

  /**
   * 垂直方向（右辺・左辺）の凹凸パスを生成
   * @param direction 辺の方向（right or left）
   * @param arcDistance 円弧の距離
   * @param sweepFlag SVG円弧の方向フラグ
   * @returns SVGパス文字列の一部
   */
  private getVerticalEdge(
    direction: 'right' | 'left',
    arcDistance: number,
    sweepFlag: number
  ): string {
    const cy = this.pieceSize / 2 + this.margin;
    const x = direction === 'right' ? this.pieceSize + this.margin : this.margin;
    const startY = direction === 'left' ? cy + arcDistance : cy - arcDistance;
    const endY = direction === 'left' ? cy - arcDistance : cy + arcDistance;
    const cornerY = this.pieceSize + this.margin;

    return ` L ${x} ${startY} A ${this.radius} ${this.radius} 0 1 ${sweepFlag} ${x} ${endY} L ${x} ${cornerY}`;
  }
}
