<script lang="ts">
	import { Progress } from '$lib/components/ui/progress';
	import { ToggleGroup, ToggleGroupItem } from '$lib/components/ui/toggle-group';
	import { Badge } from '$lib/components/ui/badge';
	import { Card, CardContent } from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import { Avatar, AvatarFallback } from '$lib/components/ui/avatar';

	let { data } = $props();
	let filter = $state('all');

	const filteredEpisodes = $derived(
		data.episodes.filter((ep) => {
			if (filter === 'listened') return ep.listened;
			if (filter === 'not-listened') return !ep.listened;
			return true;
		})
	);

	const progressPercent = $derived(Math.round((data.listenedCount / data.totalEpisodes) * 100));
</script>

<div class="flex flex-col gap-4">
	<div class="flex items-center gap-4">
		<div class="flex-1">
			<h1 class="font-display text-3xl font-semibold">Episodes</h1>
			<p class="text-muted-foreground text-sm mt-0.5">{data.listenedCount} of {data.totalEpisodes} completed</p>
		</div>
	</div>

	<Progress value={progressPercent} max={100} />

	<ToggleGroup type="single" value={filter} onValueChange={(v) => { if (v) filter = v; }} spacing={0} variant="outline">
		<ToggleGroupItem value="all">All ({data.totalEpisodes})</ToggleGroupItem>
		<ToggleGroupItem value="listened">Listened ({data.listenedCount})</ToggleGroupItem>
		<ToggleGroupItem value="not-listened">Not Listened ({data.totalEpisodes - data.listenedCount})</ToggleGroupItem>
	</ToggleGroup>

	<div class="flex flex-col gap-2">
		{#each filteredEpisodes as ep}
			<Button href="/episodes/{ep.number}" variant="outline" class="h-auto p-4 flex items-center gap-4 justify-start">
				<Avatar>
					<AvatarFallback class="{ep.listened ? 'bg-primary text-primary-foreground' : ''} font-display">{ep.number}</AvatarFallback>
				</Avatar>
				<div class="flex-1 text-left">
					<p class="text-foreground">{ep.title}</p>
					{#if ep.conceptNames.length > 0}
						<div class="flex gap-1 mt-1 flex-wrap">
							{#each ep.conceptNames as name}
								<Badge variant="outline">{name}</Badge>
							{/each}
						</div>
					{/if}
				</div>
				<div class="flex gap-2">
					{#if ep.wordCount > 0}
						<Badge variant="outline">{ep.wordCount} words</Badge>
					{/if}
					{#if ep.conceptCount > 0}
						<Badge variant="outline">{ep.conceptCount} concepts</Badge>
					{/if}
				</div>
			</Button>
		{/each}
	</div>

	{#if filteredEpisodes.length === 0}
		<Card>
			<CardContent class="text-center py-6">
				<p class="font-display text-lg font-semibold">No episodes match this filter</p>
			</CardContent>
		</Card>
	{/if}
</div>
