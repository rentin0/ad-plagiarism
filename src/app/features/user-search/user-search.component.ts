import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Observable } from 'rxjs';

import { JsonPlaceholderService } from '../../services/json-placeholder.service';
import type { User } from '../../models/user';

@Component({
  selector: 'app-user-search',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './user-search.component.html'
})
export class UserSearchComponent {
  private readonly jsonPlaceholder = inject(JsonPlaceholderService);
  users$: Observable<User[]> = this.jsonPlaceholder.getUsers();
}
