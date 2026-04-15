import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AppBadgeComponent } from '../../components/ui/badge.component';

interface Game {
  id: number;
  title: string;
  category: string;
  level: string;
  players: number;
  rating: number;
  icon: string;
  iconColor: string;
  bgColor: string;
}

interface LeaderboardPlayer {
  rank: number;
  name: string;
  points: number;
  avatar: string;
}

@Component({
  selector: 'app-games',
  standalone: true,
  imports: [CommonModule, AppBadgeComponent],
  templateUrl: './games.component.html',
  styleUrls: ['./games.component.scss']
})
export class GamesComponent {
  games: Game[] = [
    {
      id: 1,
      title: 'Vocabulary Speed Run',
      category: 'Vocabulary',
      level: 'All Levels',
      players: 1240,
      rating: 4.8,
      icon: '⚡',
      iconColor: 'text-amber-500',
      bgColor: 'bg-amber-50'
    },
    {
      id: 2,
      title: 'Grammar Puzzle',
      category: 'Grammar',
      level: 'Intermediate',
      players: 850,
      rating: 4.5,
      icon: '🎮',
      iconColor: 'text-purple-500',
      bgColor: 'bg-purple-50'
    },
    {
      id: 3,
      title: 'Culture Quiz',
      category: 'Interactive Quiz',
      level: 'Advanced',
      players: 2100,
      rating: 4.9,
      icon: '⭐',
      iconColor: 'text-blue-500',
      bgColor: 'bg-blue-50'
    }
  ];

  leaderboard: LeaderboardPlayer[] = [
    { rank: 1, name: 'Sophie L.', points: 12500, avatar: 'SL' },
    { rank: 2, name: 'Marc D.', points: 11200, avatar: 'MD' },
    { rank: 3, name: 'Julie A.', points: 10800, avatar: 'JA' },
    { rank: 4, name: 'Thomas B.', points: 9500, avatar: 'TB' },
    { rank: 5, name: 'Lucas M.', points: 8900, avatar: 'LM' }
  ];

  getRankClass(rank: number): string {
    switch (rank) {
      case 1:
        return 'bg-amber-100 text-amber-700';
      case 2:
        return 'bg-gray-100 text-gray-700';
      case 3:
        return 'bg-orange-100 text-orange-700';
      default:
        return 'bg-white text-secondary border border-border';
    }
  }
}
