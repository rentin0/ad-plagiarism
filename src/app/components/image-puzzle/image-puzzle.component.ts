import { Component, inject, signal, computed, ChangeDetectionStrategy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProgressBarModule } from 'primeng/progressbar';
import { SkeletonModule } from 'primeng/skeleton';
import { ButtonModule } from 'primeng/button';
import { PuzzlePathGenerator } from '../../services/puzzle-path-generator';
import { PuzzleStateService } from '../../services/puzzle-state.service';
import { PuzzlePieceComponent, PuzzlePiece } from '../puzzle-piece/puzzle-piece.component';
import confetti from 'canvas-confetti';

@Component({
  selector: 'app-image-puzzle',
  imports: [CommonModule, PuzzlePieceComponent, ProgressBarModule, SkeletonModule, ButtonModule],
  providers: [PuzzleStateService],
  templateUrl: './image-puzzle.component.html',
  styleUrl: './image-puzzle.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ImagePuzzleComponent implements OnInit {
  private readonly puzzleState = inject(PuzzleStateService);

  pieces = signal<PuzzlePiece[]>([]);
  isCompleted = signal(false);
  isLoading = signal(true);
  imageUrl = 'https://picsum.photos/450/450';
  maxZIndex = 1;

  private pathGenerator!: PuzzlePathGenerator;
  private inactivityTimer?: ReturnType<typeof setTimeout>;
  private isDragging = false;

  readonly isAnimating = this.puzzleState.isAnimating;
  readonly showHint = this.puzzleState.showHint;
  readonly areaPadding = this.puzzleState.areaPadding;
  readonly areaSize = this.puzzleState.areaSize;
  readonly skeletonSize = this.puzzleState.skeletonSize;

  private get config() { return this.puzzleState.config(); }

  ngOnInit() {
    this.calculatePieceSize();
    this.pathGenerator = new PuzzlePathGenerator(this.config.pieceSize);

    this.isLoading.set(true);
    const img = new Image();
    img.src = this.imageUrl;
    img.onload = () => {
      this.initializePuzzle();
      this.isLoading.set(false);
    };

    window.addEventListener('resize', () => this.handleResize());
  }

  private calculatePieceSize() {
    const screenWidth = window.innerWidth;
    const outerPadding = 16;
    const { gridSize, puzzleAreaPaddingRatio } = this.config;
    const availableWidth = screenWidth - outerPadding;
    const calculatedSize = Math.floor(availableWidth / (gridSize + puzzleAreaPaddingRatio * 2));
    this.puzzleState.updateConfig({
      pieceSize: Math.max(80, Math.min(150, calculatedSize)),
    });
  }

  private handleResize() {
    const oldSize = this.config.pieceSize;
    this.calculatePieceSize();

    if (oldSize !== this.config.pieceSize) {
      this.pathGenerator = new PuzzlePathGenerator(this.config.pieceSize);
      this.initializePuzzle();
    }
  }

  initializePuzzle() {
    const { gridSize } = this.config;
    const gridStep = this.puzzleState.gridStep();
    const newPieces: PuzzlePiece[] = [];
    const shuffledPositions = this.getShuffledPositions();
    const edgeMatrix = this.generateEdgeMatrix();

    for (let i = 0; i < gridSize * gridSize; i++) {
      const row = Math.floor(i / gridSize);
      const col = i % gridSize;
      const edges = this.getPieceEdges(row, col, edgeMatrix);

      newPieces.push({
        id: i,
        imageUrl: this.imageUrl,
        gridPosition: { x: col, y: row },
        currentPosition: { x: col * gridStep, y: row * gridStep },
        zIndex: 100 + i,
        edges,
      });
    }

    this.pieces.set(newPieces);
    this.isCompleted.set(false);
    this.maxZIndex = 100 + gridSize * gridSize;

    setTimeout(() => {
      this.isAnimating.set(true);
      const pieces = this.pieces();
      const shuffledPieces = pieces.map((piece: PuzzlePiece, index: number) => {
        const shuffledPos = shuffledPositions[index];
        return {
          ...piece,
          currentPosition: {
            x: shuffledPos.x * gridStep,
            y: shuffledPos.y * gridStep,
          },
        };
      });
      this.pieces.set(shuffledPieces);

      setTimeout(() => {
        this.isAnimating.set(false);
        this.resetInactivityTimer();
      }, 1000);
    }, 1000);
  }

  generateEdgeMatrix() {
    const { gridSize } = this.config;
    const horizontalEdges: boolean[][] = [];
    for (let row = 0; row < gridSize; row++) {
      horizontalEdges[row] = [];
      for (let col = 0; col < gridSize - 1; col++) {
        horizontalEdges[row][col] = Math.random() > 0.5;
      }
    }

    const verticalEdges: boolean[][] = [];
    for (let row = 0; row < gridSize - 1; row++) {
      verticalEdges[row] = [];
      for (let col = 0; col < gridSize; col++) {
        verticalEdges[row][col] = Math.random() > 0.5;
      }
    }

    return { horizontalEdges, verticalEdges };
  }

  getPieceEdges(row: number, col: number, edgeMatrix: {
    horizontalEdges: boolean[][];
    verticalEdges: boolean[][];
  }) {
    const { gridSize } = this.config;
    const edges = { top: 0, right: 0, bottom: 0, left: 0 };

    if (row > 0) {
      edges.top = edgeMatrix.verticalEdges[row - 1][col] ? -1 : 1;
    }
    if (col < gridSize - 1) {
      edges.right = edgeMatrix.horizontalEdges[row][col] ? 1 : -1;
    }
    if (row < gridSize - 1) {
      edges.bottom = edgeMatrix.verticalEdges[row][col] ? 1 : -1;
    }
    if (col > 0) {
      edges.left = edgeMatrix.horizontalEdges[row][col - 1] ? -1 : 1;
    }

    return edges;
  }

  getShuffledPositions(): { x: number; y: number }[] {
    const { gridSize } = this.config;
    const positions: { x: number; y: number }[] = [];

    for (let i = 0; i < gridSize * gridSize; i++) {
      const row = Math.floor(i / gridSize);
      const col = i % gridSize;
      positions.push({ x: col, y: row });
    }

    let shuffledPositions = [...positions];
    let isValidShuffle = false;

    while (!isValidShuffle) {
      for (let i = shuffledPositions.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffledPositions[i], shuffledPositions[j]] = [shuffledPositions[j], shuffledPositions[i]];
      }

      isValidShuffle = shuffledPositions.every((pos, index) => {
        const correctRow = Math.floor(index / gridSize);
        const correctCol = index % gridSize;
        return pos.x !== correctCol || pos.y !== correctRow;
      });
    }

    return shuffledPositions;
  }

  onDragEnded(event: { pieceId: number; delta: { x: number; y: number } }) {
    const pieces = this.pieces();
    const piece = pieces.find((p: PuzzlePiece) => p.id === event.pieceId);
    if (!piece) return;

    const newX = piece.currentPosition.x + event.delta.x;
    const newY = piece.currentPosition.y + event.delta.y;
    const snappedPos = this.snapToGrid(newX, newY);

    if (!snappedPos) {
      this.isDragging = false;
      return;
    }

    this.maxZIndex++;
    this.isDragging = false;

    const updatedPieces = pieces.map((p: PuzzlePiece) =>
      p.id === event.pieceId
        ? { ...p, currentPosition: snappedPos, zIndex: this.maxZIndex }
        : p
    );

    this.pieces.set(updatedPieces);
    this.checkCompletion();
    this.resetInactivityTimer();
  }

  private snapToGrid(x: number, y: number): { x: number; y: number } | null {
    const { gridSize } = this.config;
    const gridStep = this.puzzleState.gridStep();
    const gridX = Math.round(x / gridStep);
    const gridY = Math.round(y / gridStep);

    if (gridX < 0 || gridX >= gridSize || gridY < 0 || gridY >= gridSize) {
      return null;
    }

    const snappedX = gridX * gridStep;
    const snappedY = gridY * gridStep;
    const distance = Math.sqrt(Math.pow(x - snappedX, 2) + Math.pow(y - snappedY, 2));

    return distance <= this.puzzleState.snapThreshold ? { x: snappedX, y: snappedY } : null;
  }

  progressValue = computed(() => {
    const pieces = this.pieces();
    if (pieces.length === 0) return 0;

    const gridStep = this.puzzleState.gridStep();
    const correctCount = pieces.filter((piece: PuzzlePiece) => {
      const correctX = piece.gridPosition.x * gridStep;
      const correctY = piece.gridPosition.y * gridStep;
      return piece.currentPosition.x === correctX && piece.currentPosition.y === correctY;
    }).length;

    return Math.round((correctCount / pieces.length) * 100);
  });

  checkCompletion() {
    const pieces = this.pieces();
    const gridStep = this.puzzleState.gridStep();
    const isComplete = pieces.every((piece: PuzzlePiece) => {
      const correctX = piece.gridPosition.x * gridStep;
      const correctY = piece.gridPosition.y * gridStep;
      return piece.currentPosition.x === correctX && piece.currentPosition.y === correctY;
    });

    const wasCompleted = this.isCompleted();
    this.isCompleted.set(isComplete);

    if (isComplete && !wasCompleted) {
      this.celebrateCompletion();
    }
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
      if (!this.isCompleted() && !this.isDragging) {
        this.showHint.set(true);
        setTimeout(() => {
          this.showHint.set(false);
          this.startHintCycle();
        }, 1000);
      }
    }, 5000);
  }

  private celebrateCompletion() {
    const duration = 3000;
    const animationEnd = Date.now() + duration;

    const interval = setInterval(() => {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        clearInterval(interval);
        return;
      }

      confetti({
        particleCount: 50,
        startVelocity: 30,
        spread: 360,
        origin: { x: Math.random(), y: Math.random() - 0.2 },
        colors: ['#a855f7', '#ec4899', '#8b5cf6', '#f472b6'],
      });
    }, 250);
  }

  reset() {
    this.initializePuzzle();
  }

  bringToFront(pieceId: number) {
    const pieces = this.pieces();
    const index = pieces.findIndex((p: PuzzlePiece) => p.id === pieceId);

    if (index !== -1) {
      this.isDragging = true;
      this.maxZIndex++;
      const updatedPieces = pieces.map((p: PuzzlePiece, i: number) =>
        i === index ? { ...p, zIndex: this.maxZIndex } : p
      );
      this.pieces.set(updatedPieces);
    }
  }

  getPuzzlePath(piece: PuzzlePiece): string {
    return this.pathGenerator.generatePath(piece.edges);
  }
}
