import { Routes } from '@angular/router';
import { UserSearchComponent } from './features/user-search/user-search.component';
import { ImagePuzzleComponent } from './components/image-puzzle/image-puzzle.component';

export const routes: Routes = [
  { path: '', component: ImagePuzzleComponent },
  { path: 'assignment', component: UserSearchComponent }
];
