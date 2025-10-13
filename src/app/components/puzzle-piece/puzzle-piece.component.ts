import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CdkDrag, CdkDragEnd } from '@angular/cdk/drag-drop';
import { PuzzlePathGenerator } from '../../services/puzzle-path-generator';

export interface PuzzlePiece {
  id: number;
  correctIndex: number;
  imageUrl: string;
  gridPosition: { x: number; y: number };
  currentPosition: { x: number; y: number };
  zIndex: number;
  edges: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
}

@Component({
  selector: 'app-puzzle-piece',
  standalone: true,
  imports: [CommonModule, CdkDrag],
  templateUrl: './puzzle-piece.component.html',
  styleUrl: './puzzle-piece.component.css'
})
export class PuzzlePieceComponent {
  @Input() piece!: PuzzlePiece;
  @Input() pieceSize!: number;
  @Input() gridSize!: number;
  @Input() pieceGap!: number;
  @Input() snapThreshold!: number;
  @Input() clipPathId!: string;

  @Output() positionChanged = new EventEmitter<{ piece: PuzzlePiece; newPosition: { x: number; y: number } }>();
  @Output() bringToFront = new EventEmitter<void>();

  get isCorrect(): boolean {
    const gridStep = this.pieceSize + this.pieceGap;
    const correctX = this.piece.gridPosition.x * gridStep;
    const correctY = this.piece.gridPosition.y * gridStep;
    return this.piece.currentPosition.x === correctX && this.piece.currentPosition.y === correctY;
  }

  get backgroundPosition(): string {
    const margin = this.pieceSize * 0.24;
    const offsetX = -this.piece.gridPosition.x * this.pieceSize + margin;
    const offsetY = -this.piece.gridPosition.y * this.pieceSize + margin;
    return `${offsetX}px ${offsetY}px`;
  }

  get backgroundSize(): string {
    const totalSize = this.pieceSize * this.gridSize;
    return `${totalSize}px ${totalSize}px`;
  }

  onDragEnded(event: CdkDragEnd) {
    const newX = this.piece.currentPosition.x + event.distance.x;
    const newY = this.piece.currentPosition.y + event.distance.y;

    const snappedPos = this.snapToGrid(newX, newY);

    if (snappedPos) {
      this.positionChanged.emit({ piece: this.piece, newPosition: snappedPos });
    }

    event.source.reset();
  }

  private snapToGrid(x: number, y: number): { x: number; y: number } | null {
    const gridStep = this.pieceSize + this.pieceGap;
    const gridX = Math.round(x / gridStep);
    const gridY = Math.round(y / gridStep);

    if (gridX < 0 || gridX >= this.gridSize || gridY < 0 || gridY >= this.gridSize) {
      return null;
    }

    const snappedX = gridX * gridStep;
    const snappedY = gridY * gridStep;

    const distance = Math.sqrt(Math.pow(x - snappedX, 2) + Math.pow(y - snappedY, 2));

    if (distance <= this.snapThreshold) {
      return { x: snappedX, y: snappedY };
    }

    return null;
  }

  onMouseDown() {
    this.bringToFront.emit();
  }
}
