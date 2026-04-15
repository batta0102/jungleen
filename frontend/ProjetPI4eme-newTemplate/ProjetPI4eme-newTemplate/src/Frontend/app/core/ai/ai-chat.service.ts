import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';

/* ──────────────────────── Interfaces ──────────────────────── */

export interface Correction {
  original: string;
  corrected: string;
  explanation: string;
}

export interface ChatResponse {
  reply: string;
  corrections: Correction[];
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  corrections: Correction[];
  timestamp: Date;
}

export interface ScriptLine {
  speaker: 'tutor' | 'student';
  text: string;
  hint?: string;
}

export interface Script {
  id: string;
  title: string;
  description: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  lines: ScriptLine[];
}

export interface UserMemory {
  userId: string;
  userName: string;
  firstSeen: string;
  lastSeen: string;
  sessionCount: number;
  skillLevel: 'beginner' | 'intermediate' | 'advanced';
  topicsDiscussed: string[];
  commonMistakes: { pattern: string; count: number }[];
  preferences: { favoriteTopics: string[]; learningGoals: string[] };
  completedScripts: string[];
  totalMessages: number;
  streakDays: number;
  lastConversationSummary: string;
}

/* ──────────────────────── Service ──────────────────────── */

@Injectable({ providedIn: 'root' })
export class AiChatService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = '/api/chat';

  /** Reactive memory snapshot for the UI */
  readonly memory = signal<UserMemory | null>(null);

  /* ─── Storage key helpers ─── */
  private storageKey(userId: string): string {
    return `jungle_ai_memory_${userId}`;
  }

  private historyKey(userId: string): string {
    return `jungle_ai_history_${userId}`;
  }

  /* ─────────── Memory Management ─────────── */

  loadMemory(userId: string, userName: string): UserMemory {
    const raw = localStorage.getItem(this.storageKey(userId));
    if (raw) {
      const mem: UserMemory = JSON.parse(raw);
      mem.sessionCount += 1;

      // streak calculation
      const last = new Date(mem.lastSeen);
      const now = new Date();
      const diffDays = Math.floor((now.getTime() - last.getTime()) / 86_400_000);
      mem.streakDays = diffDays <= 1 ? mem.streakDays + (diffDays === 1 ? 1 : 0) : 1;

      mem.lastSeen = now.toISOString();
      mem.userName = userName;
      this.saveMemory(mem);
      this.memory.set(mem);
      return mem;
    }

    const fresh: UserMemory = {
      userId,
      userName,
      firstSeen: new Date().toISOString(),
      lastSeen: new Date().toISOString(),
      sessionCount: 1,
      skillLevel: 'beginner',
      topicsDiscussed: [],
      commonMistakes: [],
      preferences: { favoriteTopics: [], learningGoals: [] },
      completedScripts: [],
      totalMessages: 0,
      streakDays: 1,
      lastConversationSummary: '',
    };
    this.saveMemory(fresh);
    this.memory.set(fresh);
    return fresh;
  }

  saveMemory(mem: UserMemory): void {
    localStorage.setItem(this.storageKey(mem.userId), JSON.stringify(mem));
    this.memory.set(mem);
  }

  /**
   * Read-only peek at stored memory — no side effects.
   * Safe to call inside Angular computed() signals.
   */
  peekMemory(userId: string): UserMemory | null {
    try {
      const raw = localStorage.getItem(this.storageKey(userId));
      return raw ? JSON.parse(raw) as UserMemory : null;
    } catch {
      return null;
    }
  }

  updateMemoryAfterMessage(corrections: Correction[]): void {
    const mem = this.memory();
    if (!mem) return;
    mem.totalMessages += 1;

    // Track mistake patterns
    for (const c of corrections) {
      const existing = mem.commonMistakes.find(
        (m) => m.pattern.toLowerCase() === c.original.toLowerCase()
      );
      if (existing) {
        existing.count += 1;
      } else {
        mem.commonMistakes.push({ pattern: c.original, count: 1 });
      }
    }
    // Keep top 20 mistakes
    mem.commonMistakes.sort((a, b) => b.count - a.count);
    mem.commonMistakes = mem.commonMistakes.slice(0, 20);

    this.saveMemory(mem);
  }

  addTopicDiscussed(topic: string): void {
    const mem = this.memory();
    if (!mem) return;
    if (!mem.topicsDiscussed.includes(topic)) {
      mem.topicsDiscussed.push(topic);
      if (mem.topicsDiscussed.length > 30) mem.topicsDiscussed.shift();
      this.saveMemory(mem);
    }
  }

  markScriptCompleted(scriptId: string): void {
    const mem = this.memory();
    if (!mem) return;
    if (!mem.completedScripts.includes(scriptId)) {
      mem.completedScripts.push(scriptId);
      this.saveMemory(mem);
    }
  }

  updateSkillLevel(level: 'beginner' | 'intermediate' | 'advanced'): void {
    const mem = this.memory();
    if (!mem) return;
    mem.skillLevel = level;
    this.saveMemory(mem);
  }

  saveConversationSummary(summary: string): void {
    const mem = this.memory();
    if (!mem) return;
    mem.lastConversationSummary = summary;
    this.saveMemory(mem);
  }

  /* ─────────── Conversation History (per user) ─────────── */

  loadHistory(userId: string): ChatMessage[] {
    const raw = localStorage.getItem(this.historyKey(userId));
    if (!raw) return [];
    try {
      const arr = JSON.parse(raw) as ChatMessage[];
      // Keep last 50 messages to avoid bloat
      return arr.slice(-50);
    } catch {
      return [];
    }
  }

  saveHistory(userId: string, messages: ChatMessage[]): void {
    const toStore = messages.slice(-50);
    localStorage.setItem(this.historyKey(userId), JSON.stringify(toStore));
  }

  /* ─────────── Build memory context for system prompt ─────────── */

  buildMemoryContext(): string {
    const mem = this.memory();
    if (!mem) return '';

    const parts: string[] = [];
    parts.push(`Student name: ${mem.userName}`);
    parts.push(`Skill level: ${mem.skillLevel}`);
    parts.push(`Session #${mem.sessionCount} (${mem.streakDays}-day streak)`);
    parts.push(`Total messages exchanged: ${mem.totalMessages}`);

    if (mem.topicsDiscussed.length > 0) {
      parts.push(`Topics we've discussed before: ${mem.topicsDiscussed.slice(-10).join(', ')}`);
    }
    if (mem.commonMistakes.length > 0) {
      const top = mem.commonMistakes.slice(0, 5).map((m) => `"${m.pattern}" (${m.count}x)`);
      parts.push(`Common mistakes to watch for: ${top.join(', ')}`);
    }
    if (mem.lastConversationSummary) {
      parts.push(`Last conversation summary: ${mem.lastConversationSummary}`);
    }
    if (mem.preferences.learningGoals.length > 0) {
      parts.push(`Learning goals: ${mem.preferences.learningGoals.join(', ')}`);
    }

    return parts.join('\n');
  }

  /* ─────────── Chat API ─────────── */

  sendMessage(
    message: string,
    history: { role: string; content: string }[]
  ): Observable<ChatResponse> {
    const memoryContext = this.buildMemoryContext();
    return this.http.post<ChatResponse>(this.apiUrl, {
      message,
      history,
      memoryContext,
    });
  }

  /* ─────────── Script Generation API ─────────── */

  generateScript(topic?: string): Observable<Script> {
    const mem = this.memory();
    const level = mem?.skillLevel ?? 'beginner';
    const userName = mem?.userName ?? 'Student';
    const memoryContext = this.buildMemoryContext();

    return this.http
      .post<{ script: Script }>(this.apiUrl + '/script', {
        topic: topic || 'daily conversation',
        level,
        userName,
        memoryContext,
      })
      .pipe(map((res) => res.script));
  }

  /* ─────────── Script Scoring (compare spoken vs expected) ─────────── */

  scoreReading(expected: string, spoken: string): Observable<{
    score: number;
    feedback: string;
    corrections: Correction[];
  }> {
    const memoryContext = this.buildMemoryContext();
    return this.http.post<{
      score: number;
      feedback: string;
      corrections: Correction[];
    }>(this.apiUrl + '/score-reading', {
      expected,
      spoken,
      memoryContext,
    });
  }

  /* ─────────── Text-to-Speech via OpenAI TTS ─────────── */

  /**
   * Gets high-quality TTS audio from the backend (OpenAI tts-1).
   * Returns an Observable of an audio Blob (mp3).
   * Falls back to null if the backend has no API key.
   */
  textToSpeech(text: string, voice: string = 'nova'): Observable<Blob> {
    return this.http.post(this.apiUrl + '/tts', { text, voice }, {
      responseType: 'blob',
    });
  }
}
