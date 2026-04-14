<script lang="ts">
	import { Progress } from '$lib/components/ui/progress';
	import { Badge } from '$lib/components/ui/badge';
	import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';

	let { data } = $props();
	const overallPercent = $derived(
		data.totalConcepts > 0 ? Math.round((data.totalMastered / data.totalConcepts) * 100) : 0
	);
</script>

<div class="flex flex-col gap-6">
	<div class="flex items-center gap-4">
		<div class="flex-1">
			<h1 class="font-display text-3xl font-semibold">Concepts</h1>
			<p class="text-muted-foreground text-sm mt-0.5">{data.totalMastered} of {data.totalConcepts} mastered</p>
		</div>
		<Badge class="font-display text-base">{overallPercent}%</Badge>
	</div>

	<Progress value={overallPercent} max={100} />

	<div class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
		{#each data.categories as cat}
			{@const percent = cat.conceptCount > 0 ? Math.round((cat.masteredCount / cat.conceptCount) * 100) : 0}
			<Button href="/concepts/{cat.slug}" variant="outline" class="h-auto p-5 flex flex-col gap-3 items-start justify-start">
				<div class="flex items-center gap-2 w-full">
					<CardTitle class="font-display text-base flex-1">{cat.name}</CardTitle>
					{#if percent === 100}
						<Badge>Complete</Badge>
					{:else if percent > 0}
						<Badge variant="outline">{percent}%</Badge>
					{/if}
				</div>
				<Progress value={percent} max={100} class="w-full" />
				<div class="flex gap-3">
					<Badge variant="outline">{cat.conceptCount} concepts</Badge>
					{#if cat.episodeLinkCount > 0}
						<Badge variant="outline">{cat.episodeLinkCount} episode links</Badge>
					{/if}
				</div>
			</Button>
		{/each}
	</div>

	{#if data.categories.length === 0}
		<Card>
			<CardContent class="text-center py-6">
				<p class="font-display text-lg font-semibold">No concepts extracted yet</p>
				<p class="text-muted-foreground text-sm mt-1">Concepts are automatically extracted from episode transcripts.</p>
			</CardContent>
		</Card>
	{/if}
</div>
