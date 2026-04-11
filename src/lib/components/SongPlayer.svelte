<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import YouTubePlayer from 'youtube-player';

	type PlayerInstance = ReturnType<typeof YouTubePlayer>;

	interface Props {
		youtubeId: string;
		onTimeUpdate?: (ms: number) => void;
	}

	let { youtubeId, onTimeUpdate }: Props = $props();

	let containerEl: HTMLDivElement | null = $state(null);
	let player: PlayerInstance | null = null;
	let rafId: number | null = null;

	function startPolling() {
		async function poll() {
			if (player) {
				const state = await player.getPlayerState();
				// PlayerState 1 = playing
				if (state === 1) {
					const time = await player.getCurrentTime();
					onTimeUpdate?.(time * 1000);
				}
			}
			rafId = requestAnimationFrame(poll);
		}
		rafId = requestAnimationFrame(poll);
	}

	onMount(() => {
		if (!containerEl) return;
		player = YouTubePlayer(containerEl, {
			videoId: youtubeId,
			playerVars: { rel: 0, modestbranding: 1 }
		});
		player.on('ready', startPolling);
	});

	onDestroy(() => {
		if (rafId !== null) cancelAnimationFrame(rafId);
		player?.destroy();
	});
</script>

<div class="aspect-video w-full">
	<div bind:this={containerEl} class="w-full h-full"></div>
</div>
