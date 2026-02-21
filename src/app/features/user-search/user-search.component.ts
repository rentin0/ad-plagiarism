import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Observable } from 'rxjs';
import { map, startWith, catchError } from 'rxjs';
import { of } from 'rxjs';

import { PanelModule } from 'primeng/panel';

import { JsonPlaceholderService } from '../../services/json-placeholder.service';
import type { User } from '../../models/user';

export type UsersState = { loading: boolean; users: User[] | null };

const initialUsersState: UsersState = { loading: true, users: null };

@Component({
  selector: 'app-user-search',
  standalone: true,
  imports: [CommonModule, PanelModule],
  templateUrl: './user-search.component.html'
})
export class UserSearchComponent {
  private readonly jsonPlaceholderService = inject(JsonPlaceholderService);

  usersState$: Observable<UsersState> = this.jsonPlaceholderService.getUsers().pipe(
    map(users => ({ loading: false, users })),
    startWith(initialUsersState),
    catchError(() => of({ ...initialUsersState, loading: false }))
  );
}
