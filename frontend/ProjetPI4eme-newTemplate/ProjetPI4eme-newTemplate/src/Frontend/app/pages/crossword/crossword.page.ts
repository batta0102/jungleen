import { Component, signal, ElementRef, ViewChildren, QueryList, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { CrosswordService, CrosswordGame, CrosswordClue, ValidateResponse } from '../../core/crossword/crossword.service';
import { GamificationService } from '../../core/gamification/gamification.service';
import { StatsTrackerService } from '../../core/gamification/stats-tracker.service';
import { LeaderboardService } from '../../core/gamification/leaderboard.service';

export interface CellData {
  row: number;
  col: number;
  isBlock: boolean;
  letter: string;
  clueNumber?: number;
  acrossClueId?: string;
  downClueId?: string;
  correct?: boolean | null; // null = not checked yet
}

@Component({
  selector: 'app-crossword-page',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './crossword.page.html',
  styleUrls: ['./crossword.page.scss']
})
export class CrosswordPage implements OnDestroy {
  @ViewChildren('cellInput') cellInputs!: QueryList<ElementRef<HTMLInputElement>>;

  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly gami = inject(GamificationService);
  private readonly statsTracker = inject(StatsTrackerService);
  private readonly leaderboard = inject(LeaderboardService);
  private gameStartTime = Date.now();

  difficulty = signal<'Beginner' | 'Medium' | 'Hard'>('Beginner');
  game = signal<CrosswordGame | null>(null);
  loading = signal(false);
  error = signal<string | null>(null);
  result = signal<ValidateResponse | null>(null);

  // Timer
  timerDuration = signal(0); // seconds from query param
  timerRemaining = signal(0);
  timerRunning = signal(false);
  private timerInterval: ReturnType<typeof setInterval> | null = null;

  // XP popup
  showXpPopup = signal(false);
  earnedXp = signal(0);
  xpReward = signal(0);
  gameTitle = signal('Crossword');

  cells: CellData[][] = [];
  gridWidth = 0;
  gridHeight = 0;
  acrossClues: CrosswordClue[] = [];
  downClues: CrosswordClue[] = [];
  selectedClueId: string | null = null;
  activeDirection: 'across' | 'down' = 'across';

  constructor(private svc: CrosswordService) {
    // Read query params for timer and xp
    this.route.queryParams.subscribe(params => {
      const td = parseInt(params['timerDuration'], 10);
      if (td > 0) this.timerDuration.set(td);
      const xp = parseInt(params['xpReward'], 10);
      if (xp > 0) this.xpReward.set(xp);
      if (params['gameTitle']) this.gameTitle.set(params['gameTitle']);
    });

    this.loadRandom();
  }

  ngOnDestroy(): void {
    this.stopTimer();
  }

  loadRandom(): void {
    this.loading.set(true);
    this.error.set(null);
    this.result.set(null);
    this.showXpPopup.set(false);
    this.cells = [];
    this.stopTimer();
    this.gameStartTime = Date.now();

    this.svc.getRandom(this.difficulty()).subscribe({
      next: (g) => {
        this.game.set(g);
        this.buildGrid(g);
        this.loading.set(false);
        this.startTimer();
      },
      error: (err) => {
        console.error('Failed to load crossword:', err);
        this.error.set('No crossword found for this difficulty. Try another level.');
        this.loading.set(false);
      }
    });
  }

  /** Builds the interactive grid from the game data */
  buildGrid(g: CrosswordGame): void {
    const rows = g.gridRows || [];
    this.gridHeight = rows.length;
    this.gridWidth = rows.length > 0 ? rows[0].length : 0;

    // Init cells
    this.cells = [];
    for (let r = 0; r < this.gridHeight; r++) {
      const row: CellData[] = [];
      for (let c = 0; c < this.gridWidth; c++) {
        row.push({
          row: r,
          col: c,
          isBlock: rows[r][c] === '#',
          letter: '',
          correct: null
        });
      }
      this.cells.push(row);
    }

    // Map clues to cells
    const clues = g.clues || [];
    this.acrossClues = clues.filter(cl => cl.direction === 'across');
    this.downClues = clues.filter(cl => cl.direction === 'down');

    for (const clue of clues) {
      const len = clue.answer.length;
      for (let i = 0; i < len; i++) {
        const r = clue.direction === 'across' ? clue.row : clue.row + i;
        const c = clue.direction === 'across' ? clue.col + i : clue.col;
        if (r < this.gridHeight && c < this.gridWidth) {
          const cell = this.cells[r][c];
          if (clue.direction === 'across') {
            cell.acrossClueId = clue.id;
          } else {
            cell.downClueId = clue.id;
          }
          // Mark clue number on the starting cell
          if (i === 0) {
            cell.clueNumber = clue.number;
          }
        }
      }
    }
  }

  setDifficulty(value: 'Beginner' | 'Medium' | 'Hard'): void {
    this.difficulty.set(value);
    this.loadRandom();
  }

  /** Handle key input on a cell */
  onCellInput(event: Event, row: number, col: number): void {
    const input = event.target as HTMLInputElement;
    const val = input.value.toUpperCase().replace(/[^A-Z]/g, '');
    input.value = val;
    this.cells[row][col].letter = val;
    this.cells[row][col].correct = null; // reset check status

    // Auto-advance in the active direction
    if (val.length === 1) {
      if (this.activeDirection === 'down') {
        this.focusDirection(row, col, 1, 0) || this.focusDirection(row, col, 0, 1);
      } else {
        this.focusDirection(row, col, 0, 1) || this.focusDirection(row, col, 1, 0);
      }
    }
  }

  /** Handle keydown for backspace and arrow navigation */
  onCellKeydown(event: KeyboardEvent, row: number, col: number): void {
    if (event.key === 'Backspace' && this.cells[row][col].letter === '') {
      event.preventDefault();
      if (this.activeDirection === 'down') {
        this.focusDirection(row, col, -1, 0) || this.focusDirection(row, col, 0, -1);
      } else {
        this.focusDirection(row, col, 0, -1) || this.focusDirection(row, col, -1, 0);
      }
    } else if (event.key === 'ArrowRight') {
      event.preventDefault();
      this.activeDirection = 'across';
      this.focusDirection(row, col, 0, 1);
    } else if (event.key === 'ArrowLeft') {
      event.preventDefault();
      this.activeDirection = 'across';
      this.focusDirection(row, col, 0, -1);
    } else if (event.key === 'ArrowDown') {
      event.preventDefault();
      this.activeDirection = 'down';
      this.focusDirection(row, col, 1, 0);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      this.activeDirection = 'down';
      this.focusDirection(row, col, -1, 0);
    }
  }

  /** Focus a cell in a given direction */
  focusDirection(row: number, col: number, dr: number, dc: number): boolean {
    let r = row + dr;
    let c = col + dc;
    while (r >= 0 && r < this.gridHeight && c >= 0 && c < this.gridWidth) {
      if (!this.cells[r][c].isBlock) {
        this.focusCell(r, c);
        return true;
      }
      r += dr;
      c += dc;
    }
    return false;
  }

  focusCell(row: number, col: number): void {
    // cellInput refs only exist for non-block cells, so count how many non-block cells
    // come before (row, col) to find the correct ref index
    let refIdx = 0;
    for (let r = 0; r < this.gridHeight; r++) {
      for (let c = 0; c < this.gridWidth; c++) {
        if (r === row && c === col) {
          const inputs = this.cellInputs?.toArray();
          if (inputs && inputs[refIdx]) {
            inputs[refIdx].nativeElement.focus();
            inputs[refIdx].nativeElement.select();
          }
          return;
        }
        if (!this.cells[r][c].isBlock) {
          refIdx++;
        }
      }
    }
  }

  /** Highlight cells belonging to a clue */
  selectClue(clue: CrosswordClue): void {
    this.selectedClueId = clue.id;
    this.activeDirection = clue.direction;
    // Focus the first cell of this clue
    this.focusCell(clue.row, clue.col);
  }

  /** When clicking a grid cell, detect direction from which clues it belongs to */
  onCellFocus(cell: CellData): void {
    // If cell belongs to currently selected clue, keep it
    if (this.selectedClueId && (
      cell.acrossClueId === this.selectedClueId ||
      cell.downClueId === this.selectedClueId
    )) {
      return;
    }
    // Prefer across clue if exists, else down
    if (cell.acrossClueId) {
      this.selectedClueId = cell.acrossClueId;
      this.activeDirection = 'across';
    } else if (cell.downClueId) {
      this.selectedClueId = cell.downClueId;
      this.activeDirection = 'down';
    }
  }

  /** Check if a cell belongs to the selected clue */
  isCellHighlighted(cell: CellData): boolean {
    if (!this.selectedClueId) return false;
    return cell.acrossClueId === this.selectedClueId || cell.downClueId === this.selectedClueId;
  }

  /** Build answers from the grid and submit */
  submit(): void {
    const g = this.game();
    if (!g || !g.id) return;
    this.error.set(null);
    this.stopTimer();

    const clues = g.clues || [];
    const answers: Array<{ clueId: string; answer: string }> = [];

    for (const clue of clues) {
      let word = '';
      const len = clue.answer.length;
      for (let i = 0; i < len; i++) {
        const r = clue.direction === 'across' ? clue.row : clue.row + i;
        const c = clue.direction === 'across' ? clue.col + i : clue.col;
        if (r < this.gridHeight && c < this.gridWidth) {
          word += this.cells[r][c].letter || '';
        }
      }
      answers.push({ clueId: clue.id, answer: word });
    }

    this.svc.validate(g.id, { answers }).subscribe({
      next: (res) => {
        this.result.set(res);
        // Mark cells as correct/incorrect per clue
        const correctSet = new Set(res.correctClueIds || []);
        for (const clue of clues) {
          const isCorrect = correctSet.has(clue.id);
          const len = clue.answer.length;
          for (let i = 0; i < len; i++) {
            const r = clue.direction === 'across' ? clue.row : clue.row + i;
            const c = clue.direction === 'across' ? clue.col + i : clue.col;
            if (r < this.gridHeight && c < this.gridWidth) {
              if (this.cells[r][c].correct !== true) {
                this.cells[r][c].correct = isCorrect;
              }
            }
          }
        }
        // Show XP popup
        this.showXpResult(res);
      },
      error: (err) => {
        console.error('Validate failed:', err);
        this.error.set('Validation failed.');
      }
    });
  }

  /** Show the XP earned popup after validation */
  private showXpResult(res: ValidateResponse): void {
    // Compute XP: full xpReward if all correct, else proportional
    const baseXp = this.xpReward() || (this.game()?.xpReward || 0);
    const ratio = res.total > 0 ? res.correct / res.total : 0;
    const xp = res.allCorrect ? baseXp : Math.round(baseXp * ratio);
    this.earnedXp.set(xp);
    this.showXpPopup.set(true);

    // Award XP to the user's gamification profile
    if (xp > 0) {
      this.gami.awardXp(xp);
      this.leaderboard.sync();
    }

    // Record the game play in stats tracker
    const durationSec = Math.round((Date.now() - this.gameStartTime) / 1000);
    this.statsTracker.recordGamePlay({
      gameId: String(this.game()?.id ?? 'crossword'),
      title: this.gameTitle(),
      category: 'Crossword',
      durationSec,
      xpEarned: xp,
      completed: res.allCorrect
    });
  }

  /** Navigate back to gamification page */
  goBackToGamification(): void {
    this.showXpPopup.set(false);
    void this.router.navigate(['/gamification']);
  }

  // ── Timer ──
  private startTimer(): void {
    const dur = this.timerDuration();
    if (dur <= 0) return;
    this.timerRemaining.set(dur);
    this.timerRunning.set(true);
    this.timerInterval = setInterval(() => {
      const remaining = this.timerRemaining() - 1;
      this.timerRemaining.set(remaining);
      if (remaining <= 0) {
        this.stopTimer();
        this.submit(); // Auto-submit when time runs out
      }
    }, 1000);
  }

  private stopTimer(): void {
    this.timerRunning.set(false);
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }

  /** Formats seconds into mm:ss */
  formatTime(seconds: number): string {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  }

  /** Get the cell ID for the template */
  cellId(row: number, col: number): string {
    return `cell-${row}-${col}`;
  }
}
