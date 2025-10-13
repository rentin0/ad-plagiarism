export interface PieceEdges {
  top: number;    // 0: flat, 1: tab(凸), -1: blank(凹)
  right: number;
  bottom: number;
  left: number;
}

export class PuzzlePathGenerator {
  private radius: number;
  private protrusion: number;

  constructor(
    private pieceSize: number,
    radius?: number,
    protrusion?: number
  ) {
    this.radius = radius ?? pieceSize * 0.15;
    this.protrusion = protrusion ?? pieceSize * 0.15 * 0.6;
  }

  get margin(): number {
    return this.pieceSize * 0.24;
  }

  generatePath(edges: PieceEdges): string {
    let path = `M ${this.margin} ${this.margin}`;

    path += this.addEdgeToPath(edges.top, 'top');
    path += this.addEdgeToPath(edges.right, 'right');
    path += this.addEdgeToPath(edges.bottom, 'bottom');
    path += this.addEdgeToPath(edges.left, 'left');

    path += ` Z`;
    return path;
  }

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

  private getFlatEdge(direction: 'top' | 'right' | 'bottom' | 'left'): string {
    const endpoints = {
      top: `${this.pieceSize + this.margin} ${this.margin}`,
      right: `${this.pieceSize + this.margin} ${this.pieceSize + this.margin}`,
      bottom: `${this.margin} ${this.pieceSize + this.margin}`,
      left: `${this.margin} ${this.margin}`
    };
    return ` L ${endpoints[direction]}`;
  }

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
