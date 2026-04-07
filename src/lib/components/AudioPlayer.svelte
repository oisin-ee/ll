<script lang="ts">
	import { goto, beforeNavigate } from '$app/navigation';
	import { onDestroy } from 'svelte';
	import { PlayIcon, PauseIcon } from '@lucide/svelte';

	let {
		episodeNumber,
		playbackPosition = 0,
		nextEpisodeNumber = null,
		onListenedChange
	}: {
		episodeNumber: number;
		playbackPosition: number;
		nextEpisodeNumber: number | null;
		onListenedChange?: () => void;
	} = $props();

	let audioEl: HTMLAudioElement | undefined = $state();
	let isPlaying = $state(false);
	let currentTime = $state(0);
	$effect(() => { currentTime = playbackPosition; });
	let duration = $state(0);
	let markedListened = $state(false);
	let saveTimer: ReturnType<typeof setInterval> | undefined;
	let userSeeked = $state(false);

	function formatTime(secs: number): string {
		const m = Math.floor(secs / 60);
		const s = Math.floor(secs % 60);
		return `${m}:${String(s).padStart(2, '0')}`;
	}

	function savePosition() {
		if (!audioEl || audioEl.currentTime === 0) return;
		fetch(`/api/episodes/${episodeNumber}`, {
			method: 'PATCH',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ playbackPosition: Math.floor(audioEl.currentTime) })
		});
	}

	function markListened() {
		if (markedListened) return;
		markedListened = true;
		fetch(`/api/episodes/${episodeNumber}`, {
			method: 'PATCH',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ listened: true })
		});
		onListenedChange?.();
	}

	function startSaveTimer() {
		stopSaveTimer();
		saveTimer = setInterval(savePosition, 10_000);
	}

	function stopSaveTimer() {
		if (saveTimer) {
			clearInterval(saveTimer);
			saveTimer = undefined;
		}
	}

	function handleLoadedMetadata() {
		if (!audioEl) return;
		duration = audioEl.duration;
		if (playbackPosition > 0 && playbackPosition < duration) {
			audioEl.currentTime = playbackPosition;
		}
	}

	function handleTimeUpdate() {
		if (!audioEl) return;
		currentTime = audioEl.currentTime;
		if (duration > 0 && currentTime / duration >= 0.95) {
			markListened();
		}
	}

	function handleEnded() {
		stopSaveTimer();
		fetch(`/api/episodes/${episodeNumber}`, {
			method: 'PATCH',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ playbackPosition: 0, listened: true })
		});
		if (!markedListened) onListenedChange?.();
		if (nextEpisodeNumber && !userSeeked) {
			goto(`/episodes/${nextEpisodeNumber}`);
		}
	}

	function togglePlay() {
		if (!audioEl) return;
		if (audioEl.paused) {
			audioEl.play();
		} else {
			audioEl.pause();
		}
	}

	function seek(value: number) {
		if (!audioEl) return;
		userSeeked = true;
		audioEl.currentTime = value;
		currentTime = value;
	}

	function handleBeforeUnload() {
		if (audioEl && audioEl.currentTime > 0) {
			navigator.sendBeacon(
				`/api/episodes/${episodeNumber}`,
				new Blob(
					[JSON.stringify({ playbackPosition: Math.floor(audioEl.currentTime) })],
					{ type: 'application/json' }
				)
			);
		}
	}

	beforeNavigate(() => {
		savePosition();
	});

	$effect(() => {
		window.addEventListener('beforeunload', handleBeforeUnload);
		return () => window.removeEventListener('beforeunload', handleBeforeUnload);
	});

	onDestroy(() => {
		stopSaveTimer();
	});
</script>

<div class="card preset-tonal p-4">
	<audio
		bind:this={audioEl}
		src="/api/audio/{episodeNumber}"
		preload="metadata"
		onplay={() => { isPlaying = true; startSaveTimer(); }}
		onpause={() => { isPlaying = false; savePosition(); stopSaveTimer(); }}
		ontimeupdate={handleTimeUpdate}
		onloadedmetadata={handleLoadedMetadata}
		onended={handleEnded}
	></audio>

	<div class="flex items-center gap-2 md:gap-3">
		<button class="btn-icon preset-filled-primary-500" onclick={togglePlay}>
			{#if isPlaying}
				<PauseIcon size={20} />
			{:else}
				<PlayIcon size={20} />
			{/if}
		</button>

		<span class="font-mono text-sm">{formatTime(currentTime)}</span>

		<input
			type="range"
			class="flex-1"
			min="0"
			max={duration}
			step="1"
			value={currentTime}
			oninput={(e) => seek(e.currentTarget.valueAsNumber)}
		/>

		<span class="font-mono text-sm">{formatTime(duration)}</span>

		{#if nextEpisodeNumber}
			<a href="/episodes/{nextEpisodeNumber}" class="btn btn-sm preset-tonal">
				<span class="hidden sm:inline">Next</span> &rarr;
			</a>
		{/if}
	</div>
</div>
