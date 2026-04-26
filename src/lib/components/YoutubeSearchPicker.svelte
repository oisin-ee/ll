<script lang="ts">
	import { untrack } from 'svelte';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Badge } from '$lib/components/ui/badge';
	import { Alert, AlertDescription } from '$lib/components/ui/alert';
	import {
		Item,
		ItemContent,
		ItemTitle,
		ItemDescription,
		ItemMedia
	} from '$lib/components/ui/item';
	import { ToggleGroup, ToggleGroupItem } from '$lib/components/ui/toggle-group';

	interface YoutubeCandidate {
		youtubeId: string;
		title: string;
		channel: string;
		durationSeconds: number | null;
		hasCaptions: boolean;
		hasSyncedLyrics: boolean;
	}

	let {
		initialQuery = '',
		initialSelectedId = '',
		initialCandidates = []
	}: {
		initialQuery?: string;
		initialSelectedId?: string;
		initialCandidates?: YoutubeCandidate[];
	} = $props();

	const thumbUrl = (id: string) => `https://img.youtube.com/vi/${id}/mqdefault.jpg`;
	const YOUTUBE_ID_RE = /^[A-Za-z0-9_-]{11}$/;

	let searchQuery = $state(untrack(() => initialQuery));
	let searching = $state(false);
	let candidates = $state<YoutubeCandidate[]>(untrack(() => initialCandidates));
	let selectedId = $state(untrack(() => initialSelectedId));
	let searchError = $state<string | undefined>();

	const isDirect = $derived(
		searchQuery.includes('youtube.com/') ||
		searchQuery.includes('youtu.be/') ||
		YOUTUBE_ID_RE.test(searchQuery.trim())
	);

	function formatDuration(seconds: number | null): string {
		if (seconds === null) return '?:??';
		return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
	}

	function sourceBadgeLabel(candidate: YoutubeCandidate): string | null {
		if (candidate.hasCaptions && candidate.hasSyncedLyrics) return 'Both';
		if (candidate.hasSyncedLyrics) return 'Lyrics';
		if (candidate.hasCaptions) return 'Captions';
		return null;
	}

	export async function search() {
		const q = searchQuery.trim();
		if (!q) return;
		searching = true;
		searchError = undefined;
		candidates = [];
		selectedId = '';
		try {
			const res = await fetch(`/api/youtube-search?q=${encodeURIComponent(q)}`);
			if (!res.ok) throw new Error('Search request failed');
			const data = (await res.json()) as { candidates: YoutubeCandidate[] };
			candidates = data.candidates;
			if (candidates.length === 0) searchError = 'No results with captions or synced lyrics found. Try a different search.';
		} catch {
			searchError = 'Search failed. Please try again.';
		} finally {
			searching = false;
		}
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter' && !isDirect) {
			e.preventDefault();
			search();
		}
	}
</script>

<!-- Hidden inputs carry values into the parent form POST -->
<input type="hidden" name="youtubeUrl" value={searchQuery} />
<input type="hidden" name="selectedYoutubeId" value={selectedId} />

<div class="flex flex-col gap-4">
	<div class="flex gap-2">
		<Input
			id="searchInput"
			type="text"
			placeholder="e.g. juanes la camisa negra"
			bind:value={searchQuery}
			onkeydown={handleKeydown}
			class="flex-1"
		/>
		{#if !isDirect}
			<Button
				type="button"
				variant="outline"
				onclick={search}
				disabled={searching || !searchQuery.trim()}
			>
				{searching ? 'Searching…' : 'Search'}
			</Button>
		{/if}
	</div>

	{#if searching}
		<div class="flex flex-col gap-1">
			{#each [0, 1, 2] as _}
				<Item variant="outline" class="animate-pulse flex-nowrap">
					<ItemMedia variant="image" class="aspect-video w-20 shrink-0 rounded" />
					<ItemContent class="min-w-0">
						<ItemTitle class="w-3/4 rounded bg-muted text-transparent">placeholder</ItemTitle>
						<ItemDescription class="w-1/2 rounded bg-muted text-transparent">pl</ItemDescription>
					</ItemContent>
				</Item>
			{/each}
		</div>
	{:else if searchError}
		<Alert variant="destructive">
			<AlertDescription>{searchError}</AlertDescription>
		</Alert>
	{:else if candidates.length > 0}
		<ToggleGroup type="single" bind:value={selectedId} class="w-full flex-col items-stretch gap-1">
			{#each candidates as candidate (candidate.youtubeId)}
				<ToggleGroupItem
					value={candidate.youtubeId}
					variant="outline"
					class="h-auto w-full justify-start p-0 text-left"
				>
					<Item size="sm" variant="default" class="w-full flex-nowrap border-0">
						<ItemMedia variant="image" class="aspect-video w-20 shrink-0 rounded">
							<img
								src={thumbUrl(candidate.youtubeId)}
								alt={candidate.title}
								loading="lazy"
								width={320}
								height={180}
							/>
						</ItemMedia>
						<ItemContent class="min-w-0">
							<ItemTitle class="w-full truncate">{candidate.title}</ItemTitle>
							<ItemDescription class="truncate">{candidate.channel}</ItemDescription>
						</ItemContent>
						<div class="mr-2 flex shrink-0 items-center gap-1">
							{#if sourceBadgeLabel(candidate)}
								<Badge variant="secondary" class="text-xs">
									{sourceBadgeLabel(candidate)}
								</Badge>
							{/if}
							<Badge variant="outline" class="text-xs">
								{formatDuration(candidate.durationSeconds)}
							</Badge>
						</div>
					</Item>
				</ToggleGroupItem>
			{/each}
		</ToggleGroup>
	{/if}
</div>
