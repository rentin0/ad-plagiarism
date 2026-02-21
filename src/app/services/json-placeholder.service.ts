import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import type { User } from '../models/user';

const BASE_URL = 'https://jsonplaceholder.typicode.com';

@Injectable({ providedIn: 'root' })
export class JsonPlaceholderService {
  constructor(private readonly http: HttpClient) {}

  getUsers(): Observable<User[]> {
    return this.http.get<User[]>(`${BASE_URL}/users`);
  }
}
