import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Observable } from 'rxjs';

import { PanelModule } from 'primeng/panel';

import { JsonPlaceholderService } from '../../services/json-placeholder.service';
import type { User } from '../../models/user';

@Component({
  selector: 'app-user-search',
  standalone: true,
  imports: [CommonModule, PanelModule],
  templateUrl: './user-search.component.html'
})
export class UserSearchComponent {
  private readonly jsonPlaceholderService = inject(JsonPlaceholderService);
  users$: Observable<User[]> = this.jsonPlaceholderService.getUsers();
}
