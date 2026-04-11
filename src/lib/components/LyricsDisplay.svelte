<script lang="ts">
	import type { LrcLine } from '$lib/lrc';

	interface Props {
		lines: LrcLine[];
		currentMs: number;
		trackedWords: string[];
		onWordClick: (word: string) => void;
	}

	let { lines, currentMs, trackedWords, onWordClick }: Props = $props();

	let lineEls: HTMLElement[] = $state([]);

	const currentIndex = $derived.by(() => {
		if (lines.length === 0) return -1;
		let lo = 0;
		let hi = lines.length - 1;
		let result = -1;
		while (lo <= hi) {
			const mid = (lo + hi) >> 1;
			if (lines[mid].startMs <= currentMs) {
				result = mid;
				lo = mid + 1;
			} else {
				hi = mid - 1;
			}
		}
		return result;
	});

	$effect(() => {
		const el = lineEls[currentIndex];
		if (el) {
			el.scrollIntoView({ behavior: 'smooth', block: 'center' });
		}
	});

	function tokenize(text: string): string[] {
		return text.split(/(\s+)/).filter(Boolean);
	}

	function cleanWord(token: string): string {
		return token.toLowerCase().replace(/[^a-záéíóúüñ]/gi, '');
	}

	function isTracked(token: string): boolean {
		return trackedWords.includes(cleanWord(token));
	}

	function handleWordClick(token: string) {
		const clean = cleanWord(token);
		if (clean) onWordClick(clean);
	}
</script>

<ol class="flex flex-col gap-2 p-2">
	{#each lines as line, i}
		<li
			bind:this={lineEls[i]}
			class="rounded px-2 py-1 transition-colors duration-300 {i === currentIndex
				? 'preset-tonal-primary'
				: 'opacity-60'}"
		>
			{#each tokenize(line.text) as token}
				{#if token.trim()}
					<button
						type="button"
						class="inline rounded px-0.5 {isTracked(token)
							? 'chip preset-tonal-primary'
							: 'hover:preset-tonal'}"
						onclick={() => handleWordClick(token)}
					>
						{token}
					</button>
				{:else}
					<span>{token}</span>
				{/if}
			{/each}
		</li>
	{/each}
</ol>
