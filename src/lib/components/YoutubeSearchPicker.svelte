<script lang="ts">
	import { untrack } from 'svelte';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Badge } from '$lib/components/ui/badge';
	import { CardDescription } from '$lib/components/ui/card';
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

	const YOUTUBE_ID_RE = /^[A-Za-z0-9_-]{11}$/;

	// YouTube thumbnail CDN — public documented pattern
	const thumbUrl = (id: string) => `https://img.youtube.com/vi/${id}/mqdefault.jpg`;

	let searchQuery = $state(untrack(() => initialQuery));
	let searching = $state(false);
	let candidates = $state<YoutubeCandidate[]>(untrack(() => initialCandidates));
	let selectedId = $state(untrack(() => initialSelectedId));
	let searchError = $state<string | undefined>();

	function isDirectUrl(input: string): boolean {
		const t = input.trim();
		return t.includes('youtube.com/') || t.includes('youtu.be/') || YOUTUBE_ID_RE.test(t);
	}

	const isDirect = $derived(isDirectUrl(searchQuery));

	function formatDuration(seconds: number | null): string {
		if (seconds === null) return '?:??';
		return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
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
			if (candidates.length === 0) searchError = 'No results found. Try a different search.';
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

<div class="space-y-4">
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
		<div class="space-y-1">
			{#each [0, 1, 2] as _}
				<Item variant="outline" class="animate-pulse">
					<ItemMedia variant="image" class="aspect-video w-24 rounded" />
					<ItemContent>
						<ItemTitle class="w-3/4 rounded bg-muted text-transparent">placeholder</ItemTitle>
						<ItemDescription class="w-1/2 rounded bg-muted text-transparent">placeholder</ItemDescription>
					</ItemContent>
				</Item>
			{/each}
		</div>
	{:else if searchError}
		<CardDescription class="text-destructive">{searchError}</CardDescription>
	{:else if candidates.length > 0}
		<div class="space-y-1.5">
			<CardDescription>{candidates.length} results — pick one</CardDescription>
			<ToggleGroup type="single" bind:value={selectedId} class="w-full gap-1 flex-col items-stretch">
				{#each candidates as candidate (candidate.youtubeId)}
					<ToggleGroupItem
						value={candidate.youtubeId}
						variant="outline"
						class="h-auto w-full justify-start p-0 text-left"
					>
						<Item size="sm" variant="default" class="w-full border-0">
							<ItemMedia variant="image" class="aspect-video w-24 rounded">
								<img
									src={thumbUrl(candidate.youtubeId)}
									alt={candidate.title}
									loading="lazy"
									width={320}
									height={180}
								/>
							</ItemMedia>
							<ItemContent>
								<ItemTitle class="line-clamp-2">{candidate.title}</ItemTitle>
								<ItemDescription>{candidate.channel}</ItemDescription>
							</ItemContent>
							<Badge variant="outline" class="mr-1 shrink-0 self-center text-xs">
								{formatDuration(candidate.durationSeconds)}
							</Badge>
						</Item>
					</ToggleGroupItem>
				{/each}
			</ToggleGroup>
		</div>
	{/if}
</div>
