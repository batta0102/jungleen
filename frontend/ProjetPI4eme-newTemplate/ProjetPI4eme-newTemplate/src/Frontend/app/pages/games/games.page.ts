import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { GamesService, Game } from '../../core/games/games.service';
import { AvatarsService, AvatarDto, SkinDto } from '../../core/avatars/avatars.service';
import { PaginationComponent } from '../../shared/pagination/pagination.component';

@Component({
  selector: 'app-frontend-games',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, PaginationComponent],
  templateUrl: './games.page.html',
  styleUrls: ['./games.page.scss']
})
export class FrontendGamesPage implements OnInit {
  games = signal<Game[]>([]);
  avatars = signal<AvatarDto[]>([]);
  skins = signal<SkinDto[]>([]);

  // Pagination
  page = signal(1);
  pageSize = 6;
  pageCount = computed(() => Math.max(1, Math.ceil(this.games().length / this.pageSize)));
  pagedGames = computed(() => {
    const start = (this.page() - 1) * this.pageSize;
    return this.games().slice(start, start + this.pageSize);
  });

  setPage(p: number): void {
    if (p >= 1 && p <= this.pageCount()) {
      this.page.set(p);
    }
  }

  constructor(private gamesSvc: GamesService, private avatarsSvc: AvatarsService) {}

  ngOnInit(): void {
    this.gamesSvc.getAll().subscribe(g => this.games.set(g || []));
    this.avatarsSvc.getAvatars().subscribe(a => this.avatars.set(a || []));
    this.avatarsSvc.getSkins().subscribe(s => this.skins.set(s || []));
  }
}
