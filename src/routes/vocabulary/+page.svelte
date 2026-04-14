<script lang="ts">
	import { ToggleGroup, ToggleGroupItem } from '$lib/components/ui/toggle-group';
	import { Badge } from '$lib/components/ui/badge';
	import { Card, CardContent } from '$lib/components/ui/card';
	import { Input } from '$lib/components/ui/input';
	import { Button } from '$lib/components/ui/button';

	let { data } = $props();
	let search = $state('');
	let statusFilter = $state('all');

	const filteredWords = $derived(
		data.words.filter((w) => {
			const matchesSearch =
				w.spanish.toLowerCase().includes(search.toLowerCase()) ||
				w.english.toLowerCase().includes(search.toLowerCase());
			const matchesStatus =
				statusFilter === 'all' ||
				(statusFilter === 'new' && (w.lingqStatus === null || w.lingqStatus === 0)) ||
				(statusFilter === 'learning' && w.lingqStatus !== null && w.lingqStatus > 0 && w.lingqStatus < 4) ||
				(statusFilter === 'known' && w.lingqStatus === 4);
			return matchesSearch && matchesStatus;
		})
	);

	function statusLabel(status: number | null): string {
		if (status === null || status === 0) return 'New';
		if (status === 1) return 'Recognized';
		if (status === 2) return 'Familiar';
		if (status === 3) return 'Learned';
		if (status === 4) return 'Known';
		return String(status);
	}

	function statusVariant(status: number | null): 'default' | 'secondary' | 'outline' | 'destructive' {
		if (status === null || status === 0) return 'destructive';
		if (status === 4) return 'default';
		if (status === 3) return 'secondary';
		return 'outline';
	}
</script>

<div class="flex flex-col gap-4">
	<div class="flex items-center gap-4">
		<h1 class="font-display text-3xl font-semibold flex-1">Vocabulary</h1>
		<Badge>{filteredWords.length} words</Badge>
	</div>

	<div class="flex flex-col gap-3">
		<Input type="text" bind:value={search} placeholder="Search words..." />
		<ToggleGroup type="single" value={statusFilter} onValueChange={(v) => { if (v) statusFilter = v; }} spacing={0} variant="outline">
			<ToggleGroupItem value="all">All</ToggleGroupItem>
			<ToggleGroupItem value="new">New</ToggleGroupItem>
			<ToggleGroupItem value="learning">Learning</ToggleGroupItem>
			<ToggleGroupItem value="known">Known</ToggleGroupItem>
		</ToggleGroup>
	</div>

	{#if filteredWords.length > 0}
		<div class="grid grid-cols-1 gap-3 md:grid-cols-3">
			{#each filteredWords as word}
				<Card>
					<CardContent class="flex flex-col gap-2 pt-4">
						<div class="flex items-center gap-2">
							<span class="font-display text-lg font-semibold flex-1">{word.spanish}</span>
							<Badge variant={statusVariant(word.lingqStatus)}>{statusLabel(word.lingqStatus)}</Badge>
						</div>
						<p class="text-muted-foreground">{word.english}</p>
						{#if word.example}
							<p class="text-muted-foreground italic text-sm">{word.example}</p>
						{/if}
						<Button href="/episodes/{word.episodeNumber}" variant="outline" size="sm" class="w-fit">
							Episode {word.episodeNumber}
						</Button>
					</CardContent>
				</Card>
			{/each}
		</div>
	{:else}
		<Card>
			<CardContent class="text-center py-6">
				<p class="font-display text-lg font-semibold">No words found</p>
				<p class="text-muted-foreground text-sm mt-1">
					{#if search || statusFilter !== 'all'}
						Try adjusting your filters.
					{:else}
						Add words from episode transcripts to start building your vocabulary.
					{/if}
				</p>
			</CardContent>
		</Card>
	{/if}
</div>
