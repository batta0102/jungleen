import { Component, OnInit, ChangeDetectionStrategy, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CrosswordsService, CrosswordGame, CrosswordClue } from './crosswords.service';

interface GridCell {
  blocked: boolean;
  letter: string;
  number: number | null;
}

@Component({
  selector: 'app-crosswords',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './crosswords.component.html',
  styleUrls: ['./crosswords.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CrosswordsComponent implements OnInit {
  readonly games = signal<CrosswordGame[]>([]);
  readonly editGame = signal<CrosswordGame | null>(null);
  readonly errorMessage = signal<string | null>(null);
  readonly showForm = signal(false);
  readonly saving = signal(false);

  // Form fields
  readonly title = signal('');
  readonly difficulty = signal<string>('Beginner');
  readonly xpReward = signal(50);
  readonly gridWidth = signal(10);
  readonly gridHeight = signal(10);

  // Visual grid – 2D array of cells
  readonly grid = signal<GridCell[][]>([]);

  // Clues
  readonly clues = signal<CrosswordClue[]>([]);
  readonly showClueForm = signal(false);
  readonly editingClueIndex = signal<number | null>(null);
  readonly clueDirection = signal<'across' | 'down'>('across');
  readonly clueRow = signal(0);
  readonly clueCol = signal(0);
  readonly clueAnswer = signal('');
  readonly clueHint = signal('');

  // Computed
  readonly isEditing = computed(() => this.editGame() !== null);
  readonly acrossClues = computed(() => this.clues().filter(c => c.direction === 'across'));
  readonly downClues = computed(() => this.clues().filter(c => c.direction === 'down'));

  constructor(private svc: CrosswordsService) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.svc.getAll().subscribe({
      next: (list) => this.games.set(list || []),
      error: () => this.errorMessage.set('Failed to load crosswords.')
    });
  }

  // ── Grid Management ──────────────────────────────

  initGrid(): void {
    const w = this.gridWidth();
    const h = this.gridHeight();
    const rows: GridCell[][] = [];
    for (let r = 0; r < h; r++) {
      const row: GridCell[] = [];
      for (let c = 0; c < w; c++) {
        row.push({ blocked: false, letter: '', number: null });
      }
      rows.push(row);
    }
    this.grid.set(rows);
    this.clues.set([]);
    this.renumberGrid();
  }

  resizeGrid(): void {
    const w = this.gridWidth();
    const h = this.gridHeight();
    if (w < 3 || w > 25 || h < 3 || h > 25) return;
    const old = this.grid();
    const rows: GridCell[][] = [];
    for (let r = 0; r < h; r++) {
      const row: GridCell[] = [];
      for (let c = 0; c < w; c++) {
        if (r < old.length && c < (old[r]?.length ?? 0)) {
          row.push({ ...old[r][c] });
        } else {
          row.push({ blocked: false, letter: '', number: null });
        }
      }
      rows.push(row);
    }
    this.grid.set(rows);
    // Remove clues that no longer fit
    const valid = this.clues().filter(cl => {
      const len = cl.answer.length;
      for (let i = 0; i < len; i++) {
        const rr = cl.direction === 'across' ? cl.row : cl.row + i;
        const cc = cl.direction === 'across' ? cl.col + i : cl.col;
        if (rr >= h || cc >= w) return false;
      }
      return true;
    });
    this.clues.set(valid);
    this.rebuildLetters();
    this.renumberGrid();
  }

  toggleCell(r: number, c: number): void {
    const g = this.grid().map(row => row.map(cell => ({ ...cell })));
    g[r][c].blocked = !g[r][c].blocked;
    if (g[r][c].blocked) {
      g[r][c].letter = '';
      g[r][c].number = null;
      // Remove clues that overlap this blocked cell
      const valid = this.clues().filter(cl => {
        const len = cl.answer.length;
        for (let i = 0; i < len; i++) {
          const rr = cl.direction === 'across' ? cl.row : cl.row + i;
          const cc = cl.direction === 'across' ? cl.col + i : cl.col;
          if (rr === r && cc === c) return false;
        }
        return true;
      });
      this.clues.set(valid);
    }
    this.grid.set(g);
    this.rebuildLetters();
    this.renumberGrid();
  }

  private renumberGrid(): void {
    const g = this.grid().map(row => row.map(cell => ({ ...cell, number: null as number | null })));
    const h = g.length;
    const w = h > 0 ? g[0].length : 0;
    // A cell gets a number if it starts an across or down word
    let num = 1;
    for (let r = 0; r < h; r++) {
      for (let c = 0; c < w; c++) {
        if (g[r][c].blocked) continue;
        const startsAcross = (c === 0 || g[r][c - 1].blocked) && c + 1 < w && !g[r][c + 1].blocked;
        const startsDown = (r === 0 || g[r - 1][c].blocked) && r + 1 < h && !g[r + 1][c].blocked;
        if (startsAcross || startsDown) {
          g[r][c].number = num++;
        }
      }
    }
    this.grid.set(g);
  }

  private rebuildLetters(): void {
    const g = this.grid().map(row => row.map(cell => ({ ...cell, letter: '' })));
    for (const cl of this.clues()) {
      const len = cl.answer.length;
      for (let i = 0; i < len; i++) {
        const r = cl.direction === 'across' ? cl.row : cl.row + i;
        const c = cl.direction === 'across' ? cl.col + i : cl.col;
        if (r < g.length && c < g[0].length && !g[r][c].blocked) {
          g[r][c].letter = cl.answer[i];
        }
      }
    }
    this.grid.set(g);
  }

  // ── Clue Management ──────────────────────────────

  openAddClue(): void {
    this.editingClueIndex.set(null);
    this.clueDirection.set('across');
    this.clueRow.set(0);
    this.clueCol.set(0);
    this.clueAnswer.set('');
    this.clueHint.set('');
    this.showClueForm.set(true);
    this.errorMessage.set(null);
  }

  editClue(index: number): void {
    const cl = this.clues()[index];
    if (!cl) return;
    this.editingClueIndex.set(index);
    this.clueDirection.set(cl.direction);
    this.clueRow.set(cl.row);
    this.clueCol.set(cl.col);
    this.clueAnswer.set(cl.answer);
    this.clueHint.set(cl.hint);
    this.showClueForm.set(true);
    this.errorMessage.set(null);
  }

  saveClue(): void {
    const answer = this.clueAnswer().toUpperCase().trim();
    const hint = this.clueHint().trim();
    if (!answer || !hint) {
      this.errorMessage.set('Answer and hint are required.');
      return;
    }
    const direction = this.clueDirection();
    const row = this.clueRow();
    const col = this.clueCol();
    const g = this.grid();
    const h = g.length;
    const w = h > 0 ? g[0].length : 0;

    // Bounds check
    for (let i = 0; i < answer.length; i++) {
      const r = direction === 'across' ? row : row + i;
      const c = direction === 'across' ? col + i : col;
      if (r >= h || c >= w) {
        this.errorMessage.set(`"${answer}" goes out of bounds. Make the grid larger or shorten the word.`);
        return;
      }
      if (g[r][c].blocked) {
        this.errorMessage.set(`"${answer}" overlaps a blocked cell at row ${r + 1}, col ${c + 1}.`);
        return;
      }
    }

    const idx = this.editingClueIndex();
    let list = [...this.clues()];
    const clue: CrosswordClue = {
      id: idx !== null ? list[idx].id : `c${Date.now()}`,
      number: 0, // will be assigned
      direction,
      row,
      col,
      answer,
      hint
    };

    if (idx !== null) {
      list[idx] = clue;
    } else {
      list.push(clue);
    }

    // Assign numbers based on grid position
    list = this.assignClueNumbers(list);
    this.clues.set(list);
    this.rebuildLetters();
    this.renumberGrid();
    this.showClueForm.set(false);
    this.errorMessage.set(null);
  }

  removeClue(index: number): void {
    const list = this.clues().filter((_, i) => i !== index);
    this.clues.set(this.assignClueNumbers(list));
    this.rebuildLetters();
    this.renumberGrid();
  }

  private assignClueNumbers(list: CrosswordClue[]): CrosswordClue[] {
    // Sort by position (top-to-bottom, left-to-right)
    const sorted = [...list].sort((a, b) => {
      if (a.row !== b.row) return a.row - b.row;
      if (a.col !== b.col) return a.col - b.col;
      return a.direction === 'across' ? -1 : 1;
    });
    // Assign numbers: same position = same number
    let num = 1;
    const posMap = new Map<string, number>();
    for (const cl of sorted) {
      const key = `${cl.row},${cl.col}`;
      if (!posMap.has(key)) {
        posMap.set(key, num++);
      }
      cl.number = posMap.get(key)!;
    }
    return sorted;
  }

  // ── CRUD ─────────────────────────────────────────

  openCreate(): void {
    this.editGame.set(null);
    this.title.set('');
    this.difficulty.set('Beginner');
    this.xpReward.set(50);
    this.gridWidth.set(10);
    this.gridHeight.set(10);
    this.clues.set([]);
    this.errorMessage.set(null);
    this.showClueForm.set(false);
    this.initGrid();
    this.showForm.set(true);
  }

  startEdit(game: CrosswordGame): void {
    this.editGame.set(game);
    this.title.set(game.title);
    this.difficulty.set(game.difficulty);
    this.xpReward.set(game.xpReward);
    this.gridWidth.set(game.width);
    this.gridHeight.set(game.height);
    this.errorMessage.set(null);
    this.showClueForm.set(false);

    // Rebuild grid from gridRows
    const rows: GridCell[][] = [];
    for (let r = 0; r < game.height; r++) {
      const row: GridCell[] = [];
      const rowStr = game.gridRows[r] || '';
      for (let c = 0; c < game.width; c++) {
        row.push({ blocked: rowStr[c] === '#', letter: '', number: null });
      }
      rows.push(row);
    }
    this.grid.set(rows);
    this.clues.set((game.clues || []).map(cl => ({ ...cl })));
    this.rebuildLetters();
    this.renumberGrid();
    this.showForm.set(true);
  }

  closeForm(): void {
    this.showForm.set(false);
    this.editGame.set(null);
    this.errorMessage.set(null);
  }

  save(): void {
    this.errorMessage.set(null);
    const t = this.title().trim();
    if (!t) { this.errorMessage.set('Title is required.'); return; }

    const g = this.grid();
    const clueList = this.clues();
    if (clueList.length === 0) { this.errorMessage.set('Add at least one clue.'); return; }

    const gridRows = g.map(row => row.map(cell => cell.blocked ? '#' : (cell.letter || '.')).join(''));
    const payload: CrosswordGame = {
      title: t,
      difficulty: this.difficulty(),
      xpReward: this.xpReward(),
      width: this.gridWidth(),
      height: this.gridHeight(),
      gridRows,
      clues: clueList
    };

    this.saving.set(true);
    const editId = this.editGame()?.id;
    const obs = editId ? this.svc.update(editId, payload) : this.svc.create(payload);
    obs.subscribe({
      next: () => {
        this.saving.set(false);
        this.load();
        this.closeForm();
      },
      error: (err) => {
        this.saving.set(false);
        console.error('Save failed:', err);
        this.errorMessage.set('Save failed. Check console for details.');
      }
    });
  }

  delete(id: number | undefined): void {
    if (!id) return;
    if (!confirm('Delete this crossword?')) return;
    this.svc.delete(id).subscribe({
      next: () => this.load(),
      error: (err) => console.error('Delete failed:', err)
    });
  }
}
