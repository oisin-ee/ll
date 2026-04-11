declare module 'youtube-player' {
	interface PlayerEventMap {
		ready: Event;
		stateChange: { data: number };
		playbackQualityChange: { data: string };
		playbackRateChange: { data: number };
		error: { data: number };
		apiChange: Event;
	}

	type EventName = keyof PlayerEventMap;

	interface YouTubePlayerInstance {
		loadVideoById(videoId: string): Promise<void>;
		getCurrentTime(): Promise<number>;
		getPlayerState(): Promise<number>;
		on<K extends EventName>(event: K, listener: (event: PlayerEventMap[K]) => void): void;
		off<K extends EventName>(event: K, listener: (event: PlayerEventMap[K]) => void): void;
		destroy(): void;
	}

	interface YouTubePlayerOptions {
		width?: number | string;
		height?: number | string;
		videoId?: string;
		playerVars?: Record<string, number | string>;
	}

	function YouTubePlayer(
		element: string | HTMLElement,
		options?: YouTubePlayerOptions
	): YouTubePlayerInstance;

	export = YouTubePlayer;
}
