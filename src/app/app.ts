import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ImagePuzzleComponent } from './components/image-puzzle/image-puzzle.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, ImagePuzzleComponent],
  templateUrl: './app.html'
})
export class App {}
