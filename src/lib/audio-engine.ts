class AudioEngine {
  private audio: HTMLAudioElement;
  private listeners: Map<string, Set<Function>> = new Map();

  constructor() {
    this.audio = new Audio();
    this.audio.preload = 'none';
    this.setupEventListeners();
  }

  private setupEventListeners() {
    this.audio.addEventListener('timeupdate', () => this.emit('timeupdate'));
    this.audio.addEventListener('ended', () => this.emit('ended'));
    this.audio.addEventListener('play', () => this.emit('play'));
    this.audio.addEventListener('pause', () => this.emit('pause'));
    this.audio.addEventListener('error', () => this.emit('error'));
    this.audio.addEventListener('loadedmetadata', () => this.emit('loadedmetadata'));
  }

  play(url: string): Promise<void> {
    if (this.audio.src !== url) {
      this.audio.src = url;
    }
    return this.audio.play();
  }

  pause(): void {
    this.audio.pause();
  }

  stop(): void {
    this.audio.pause();
    this.audio.currentTime = 0;
  }

  setVolume(volume: number): void {
    this.audio.volume = Math.max(0, Math.min(1, volume));
  }

  seek(time: number): void {
    this.audio.currentTime = time;
  }

  getCurrentTime(): number {
    return this.audio.currentTime;
  }

  getDuration(): number {
    return this.audio.duration;
  }

  getVolume(): number {
    return this.audio.volume;
  }

  isPlaying(): boolean {
    return !this.audio.paused;
  }

  on(event: string, callback: Function): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);
  }

  off(event: string, callback: Function): void {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      eventListeners.delete(callback);
    }
  }

  private emit(event: string): void {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      eventListeners.forEach(callback => callback());
    }
  }

  getAudioElement(): HTMLAudioElement {
    return this.audio;
  }
}

// Singleton instance
export const audioEngine = new AudioEngine();
