<script lang="ts">
	import { enhance } from '$app/forms';
	import { ToggleGroup, ToggleGroupItem } from '$lib/components/ui/toggle-group';
	import { Collapsible, CollapsibleTrigger, CollapsibleContent } from '$lib/components/ui/collapsible';
	import { Progress } from '$lib/components/ui/progress';
	import { Badge } from '$lib/components/ui/badge';
	import { Card, CardContent } from '$lib/components/ui/card';
	import { Input } from '$lib/components/ui/input';
	import { Button } from '$lib/components/ui/button';
	import { Separator } from '$lib/components/ui/separator';

	let { data } = $props();

	const masteryLabels: Record<number, string> = { 0: 'Not started', 1: 'Introduced', 2: 'Practicing', 3: 'Solid' };
	let search = $state('');
	let masteryFilter = $state('all');

	function masteryVariant(mastery: number): 'default' | 'secondary' | 'outline' | 'destructive' {
		if (mastery === 3) return 'default';
		if (mastery === 2) return 'secondary';
		if (mastery === 1) return 'outline';
		return 'outline';
	}

	const filteredConcepts = $derived(
		data.concepts.filter((c) => {
			const matchesSearch = !search || c.name.toLowerCase().includes(search.toLowerCase());
			const matchesMastery = masteryFilter === 'all' || String(c.mastery) === masteryFilter;
			return matchesSearch && matchesMastery;
		})
	);

	const masteredCount = $derived(data.concepts.filter((c) => c.mastery >= 3).length);
	const progressPercent = $derived(
		data.concepts.length > 0 ? Math.round((masteredCount / data.concepts.length) * 100) : 0
	);
</script>

<div class="flex flex-col gap-4">
	<div class="flex flex-wrap items-center gap-2 md:gap-4">
		<div class="flex-1">
			<p class="text-sm text-muted-foreground">
				<Button href="/concepts" variant="link" class="h-auto p-0">Concepts</Button> / {data.categoryName}
			</p>
			<h1 class="font-display text-3xl font-semibold">{data.categoryName}</h1>
		</div>
		<Button href="/concepts/{data.categorySlug}/exercise">Practice</Button>
		<Badge variant="outline">{data.concepts.length} concepts</Badge>
		<Badge>{masteredCount} mastered</Badge>
	</div>

	<Progress value={progressPercent} max={100} />

	<div class="flex flex-col gap-3">
		<Input type="text" bind:value={search} placeholder="Search in {data.categoryName}..." />
		<div class="overflow-x-auto">
			<ToggleGroup type="single" value={masteryFilter} onValueChange={(v) => { if (v) masteryFilter = v; }} spacing={0} variant="outline">
				<ToggleGroupItem value="all">All</ToggleGroupItem>
				<ToggleGroupItem value="0">Not started</ToggleGroupItem>
				<ToggleGroupItem value="1">Introduced</ToggleGroupItem>
				<ToggleGroupItem value="2">Practicing</ToggleGroupItem>
				<ToggleGroupItem value="3">Solid</ToggleGroupItem>
			</ToggleGroup>
		</div>
	</div>

	<div class="flex flex-col gap-2">
		{#each filteredConcepts as concept}
			<Card id={concept.slug}>
				<CardContent class="pt-4 flex flex-col gap-3">
					<div class="flex flex-wrap items-center gap-2">
						<span class="font-display font-semibold flex-1">{concept.name}</span>
						<form method="POST" action="?/updateMastery" use:enhance class="flex gap-1 flex-wrap">
							<input type="hidden" name="id" value={concept.id} />
							{#each [0, 1, 2, 3] as level}
								<Button
									type="submit"
									name="mastery"
									value={String(level)}
									size="sm"
									variant={concept.mastery === level ? 'default' : 'outline'}
								>{masteryLabels[level]}</Button>
							{/each}
						</form>
					</div>

					{#if concept.episodes.length > 0}
						<div class="flex flex-col gap-1">
							{#each concept.episodes as ep}
								<Collapsible>
									<CollapsibleTrigger class="flex items-center gap-2 text-sm hover:text-foreground text-muted-foreground transition-colors w-full text-left">
										<span class="flex-1">{ep.episodeTitle}</span>
										<Badge variant={masteryVariant(concept.mastery)}>{ep.role}</Badge>
									</CollapsibleTrigger>
									<CollapsibleContent>
										<div class="flex flex-col gap-2 pt-2 pl-2">
											{#if ep.summary}
												<p class="text-sm text-muted-foreground">{ep.summary}</p>
											{/if}
											{#if ep.rule}
												<Card>
													<CardContent class="py-2 px-3">
														<p class="font-semibold text-sm">{ep.rule}</p>
													</CardContent>
												</Card>
											{/if}
											{#if ep.examples.length > 0}
												<div class="grid grid-cols-1 md:grid-cols-2 gap-1">
													{#each ep.examples as ex}
														<p class="font-semibold text-sm">{ex.spanish}</p>
														<p class="text-sm text-muted-foreground">{ex.english}</p>
													{/each}
												</div>
											{/if}
											{#if ep.notes}
												<p class="text-xs text-muted-foreground">{ep.notes}</p>
											{/if}
											<Button href="/episodes/{ep.episodeNumber}" variant="outline" size="sm" class="w-fit">Go to episode &rarr;</Button>
										</div>
									</CollapsibleContent>
								</Collapsible>
							{/each}
						</div>
					{/if}
				</CardContent>
			</Card>
		{/each}
	</div>

	{#if filteredConcepts.length === 0}
		<Card>
			<CardContent class="text-center py-6">
				<p class="font-display text-lg font-semibold">No concepts match your filters</p>
				<p class="text-muted-foreground text-sm mt-1">Try adjusting your search or mastery filter.</p>
			</CardContent>
		</Card>
	{/if}

	<Separator />

	<div class="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-4">
		{#if data.prevCategory}
			<Button href="/concepts/{data.prevCategory.slug}" variant="outline" class="flex-1">
				&larr; {data.prevCategory.name}
			</Button>
		{:else}
			<div class="flex-1"></div>
		{/if}
		<Button href="/concepts" variant="outline">All Categories</Button>
		{#if data.nextCategory}
			<Button href="/concepts/{data.nextCategory.slug}" variant="default" class="flex-1">
				{data.nextCategory.name} &rarr;
			</Button>
		{/if}
	</div>
</div>
