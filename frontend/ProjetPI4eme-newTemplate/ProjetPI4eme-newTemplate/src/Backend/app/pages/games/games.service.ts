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
 * Service for managing games in the backend admin panel
 */
@Injectable({
  providedIn: 'root'
})
export class GameService {
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

  /**
   * Retrieves a specific game by ID
   * @param id - The game ID
   * @returns Observable of the game
   */
  getGame(id: number): Observable<Game> {
    return this.http.get<Game>(`${this.apiUrl}/${id}`).pipe(
      map((g) => this.normalize(g))
    );
  }

  /**
   * Creates a new game
   * @param game - The game data to create
   * @returns Observable of the created game
   */
  create(game: Game): Observable<Game> {
    return this.http.post<Game>(this.apiUrl, game).pipe(
      map((g) => this.normalize(g))
    );
  }

  /**
   * Updates an existing game
   * @param id - The game ID to update
   * @param game - The updated game data
   * @returns Observable of the updated game
   */
  update(id: number, game: Game): Observable<Game> {
    return this.http.put<Game>(`${this.apiUrl}/${id}`, game).pipe(
      map((g) => this.normalize(g))
    );
  }

  /**
   * Deletes a game
   * @param id - The game ID to delete
   * @returns Observable of void
   */
  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
