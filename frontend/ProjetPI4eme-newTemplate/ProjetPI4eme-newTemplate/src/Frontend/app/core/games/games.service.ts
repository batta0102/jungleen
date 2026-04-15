import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

/**
 * Interface representing a game in the gamification system
 */
export interface Game {
  id?: number;
  title: string;
  description?: string;
  category: string;
  xpReward?: number;
  timerDuration?: number; // 0=none, 30, 60, 180, 300 seconds
  icon?: string;
  iconColor?: string;
  bgColor?: string;
  players?: number;
  rating?: number;
}

/**
 * Service for managing games in the frontend
 * Uses relative URL to enable dev server proxy and avoid CORS issues
 */
@Injectable({ providedIn: 'root' })
export class GamesService {
  private readonly apiUrl = '/api/games';

  constructor(private http: HttpClient) {}

  /**
   * Normalizes a game object to ensure it has an id field
   * Handles both id and _id field mappings
   * @param game - Raw game object
   * @returns Normalized game object
   */
  private normalize(game: any): Game {
    return {
      ...game,
      id: (game.id ?? game._id) as number | undefined
    };
  }

  /**
   * Retrieves all games from the backend
   * @returns Observable of games array
   */
  getAll(): Observable<Game[]> {
    return this.http.get<Game[]>(this.apiUrl).pipe(
      map((games) => (games || []).map((g) => this.normalize(g)))
    );
  }
}
