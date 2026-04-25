<script lang="ts">
	import { goto, beforeNavigate, invalidateAll } from '$app/navigation';
	import { onDestroy } from 'svelte';
	import { PlayIcon, PauseIcon } from '@lucide/svelte';
	import { Button } from '$lib/components/ui/button';
	import { Card, CardContent } from '$lib/components/ui/card';

	let {
		episodeNumber,
		playbackPosition = 0,
		prevEpisodeNumber = null,
		nextEpisodeNumber = null
	}: {
		episodeNumber: number;
		playbackPosition: number;
		prevEpisodeNumber: number | null;
		nextEpisodeNumber: number | null;
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

	async function markListened() {
		if (markedListened) return;
		markedListened = true;
		await fetch(`/api/episodes/${episodeNumber}`, {
			method: 'PATCH',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ listened: true })
		});
		invalidateAll();
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

	async function handleEnded() {
		stopSaveTimer();
		await fetch(`/api/episodes/${episodeNumber}`, {
			method: 'PATCH',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ playbackPosition: 0, listened: true })
		});
		if (nextEpisodeNumber && !userSeeked) {
			goto(`/episodes/${nextEpisodeNumber}`);
		} else {
			invalidateAll();
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

<Card>
	<CardContent class="py-4 px-4">
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
			{#if prevEpisodeNumber}
				<Button href="/episodes/{prevEpisodeNumber}" size="sm" variant="outline">
					&larr; <span class="hidden sm:inline">Prev</span>
				</Button>
			{/if}

			<Button size="icon" onclick={togglePlay}>
				{#if isPlaying}
					<PauseIcon />
				{:else}
					<PlayIcon />
				{/if}
			</Button>

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
				<Button href="/episodes/{nextEpisodeNumber}" size="sm" variant="outline">
					<span class="hidden sm:inline">Next</span> &rarr;
				</Button>
			{/if}
		</div>
	</CardContent>
</Card>
