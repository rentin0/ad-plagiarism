import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { Observable } from 'rxjs';
import { map, startWith, catchError, debounceTime, combineLatest } from 'rxjs';
import { of } from 'rxjs';

import { PanelModule } from 'primeng/panel';
import { InputTextModule } from 'primeng/inputtext';

import { JsonPlaceholderService } from '../../services/json-placeholder.service';
import type { User } from '../../models/user';

export type UsersState = { loading: boolean; users: User[] | null };

const initialUsersState: UsersState = { loading: true, users: null };

@Component({
  selector: 'app-user-search',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, PanelModule, InputTextModule],
  templateUrl: './user-search.component.html'
})
export class UserSearchComponent {
  private readonly jsonPlaceholderService = inject(JsonPlaceholderService);

  searchControl = new FormControl('', { nonNullable: true });

  private usersState$: Observable<UsersState> = this.jsonPlaceholderService.getUsers().pipe(
    map(users => ({ loading: false, users })),
    startWith(initialUsersState),
    catchError(() => of({ ...initialUsersState, loading: false }))
  );

  private searchTerm$ = this.searchControl.valueChanges.pipe(
    startWith(this.searchControl.value),
    debounceTime(300),
    map(searchTerm => searchTerm.toLowerCase().trim())
  );

  filteredUsersState$: Observable<UsersState> = combineLatest([
    this.usersState$,
    this.searchTerm$
  ]).pipe(
    map(([state, searchTerm]) => {
      if (state.loading || !state.users) {
        return state;
      }
      const filtered = searchTerm
        ? state.users.filter(user => user.name.toLowerCase().includes(searchTerm))
        : state.users;
      return { ...state, users: filtered };
    })
  );
}
