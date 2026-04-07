<script lang="ts">
	import { enhance } from '$app/forms';
	import { SegmentedControl, Collapsible, Progress } from '@skeletonlabs/skeleton-svelte';

	let { data } = $props();

	const masteryLabels: Record<number, string> = { 0: 'Not started', 1: 'Introduced', 2: 'Practicing', 3: 'Solid' };
	let search = $state('');
	let masteryFilter = $state('all');

	function masteryBorder(mastery: number): string {
		if (mastery === 1) return 'border-left: 4px solid var(--color-warning-500);';
		if (mastery === 2) return 'border-left: 4px solid var(--color-secondary-500);';
		if (mastery === 3) return 'border-left: 4px solid var(--color-primary-500);';
		return 'border-left: 4px solid transparent;';
	}

	const filteredConcepts = $derived(
		data.concepts.filter((c) => {
			const matchesSearch = !search ||
				c.name.toLowerCase().includes(search.toLowerCase()) ||
				(c.description?.toLowerCase().includes(search.toLowerCase()) ?? false);
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
	<!-- Header -->
	<div class="flex flex-wrap items-center gap-2 md:gap-4">
		<div class="flex-1">
			<p class="opacity-50"><a href="/concepts" class="anchor">Concepts</a> / {data.categoryName}</p>
			<h1 class="h2">{data.categoryName}</h1>
		</div>
		<a href="/concepts/{data.categorySlug}/exercise" class="btn preset-filled-primary">Practice</a>
		<span class="badge preset-tonal">{data.concepts.length} concepts</span>
		<span class="badge preset-tonal-primary">{masteredCount} mastered</span>
	</div>

	<Progress value={progressPercent} max={100}>
		<Progress.Track>
			<Progress.Range />
		</Progress.Track>
	</Progress>

	<!-- Filters -->
	<div class="flex flex-col gap-3">
		<input
			type="text"
			bind:value={search}
			placeholder="Search in {data.categoryName}..."
			class="input"
		/>
		<div class="overflow-x-auto"><SegmentedControl
			name="mastery-filter"
			value={masteryFilter}
			onValueChange={(details) => { masteryFilter = details.value; }}
		>
			<SegmentedControl.Control>
				<SegmentedControl.Indicator />
				<SegmentedControl.Item value="all">
					<SegmentedControl.ItemText>All</SegmentedControl.ItemText>
					<SegmentedControl.ItemHiddenInput />
				</SegmentedControl.Item>
				<SegmentedControl.Item value="0">
					<SegmentedControl.ItemText>Not started</SegmentedControl.ItemText>
					<SegmentedControl.ItemHiddenInput />
				</SegmentedControl.Item>
				<SegmentedControl.Item value="1">
					<SegmentedControl.ItemText>Introduced</SegmentedControl.ItemText>
					<SegmentedControl.ItemHiddenInput />
				</SegmentedControl.Item>
				<SegmentedControl.Item value="2">
					<SegmentedControl.ItemText>Practicing</SegmentedControl.ItemText>
					<SegmentedControl.ItemHiddenInput />
				</SegmentedControl.Item>
				<SegmentedControl.Item value="3">
					<SegmentedControl.ItemText>Solid</SegmentedControl.ItemText>
					<SegmentedControl.ItemHiddenInput />
				</SegmentedControl.Item>
			</SegmentedControl.Control>
		</SegmentedControl></div>
	</div>

	<!-- Concept cards -->
	<div class="flex flex-col gap-2">
		{#each filteredConcepts as concept}
			<div class="card p-3" id={concept.slug} style={masteryBorder(concept.mastery)}>
				<!-- Top row: name + mastery buttons -->
				<div class="flex flex-wrap items-center gap-2">
					<span class="font-bold flex-1">{concept.name}</span>
					<form method="POST" action="?/updateMastery" use:enhance class="flex gap-1 flex-wrap">
						<input type="hidden" name="id" value={concept.id} />
						{#each [0, 1, 2, 3] as level}
							<button
								type="submit"
								name="mastery"
								value={String(level)}
								class="btn btn-sm {concept.mastery === level ? 'preset-filled-primary-500' : 'preset-tonal'}"
							>{masteryLabels[level]}</button>
						{/each}
					</form>
				</div>

				{#if concept.description}
					<p class="opacity-75 mt-1">{concept.description}</p>
				{/if}

				<!-- Episode links as compact chips -->
				{#if concept.episodes.length > 0}
					<div class="flex flex-col gap-1 mt-2">
						{#each concept.episodes as ep}
							<Collapsible>
								<Collapsible.Trigger>
									<span class="flex items-center gap-2">
										<span>{ep.episodeTitle}</span>
										<span class="badge preset-filled-primary-500">{ep.role}</span>
									</span>
								</Collapsible.Trigger>
								<Collapsible.Content>
									<div class="flex flex-col gap-2 p-2">
										{#if ep.summary}
											<p>{ep.summary}</p>
										{/if}
										{#if ep.rule}
											<div class="card preset-tonal-primary p-2" style="border-left: 3px solid var(--color-primary-500);">
												<p class="font-bold">{ep.rule}</p>
											</div>
										{/if}
										{#if ep.examples.length > 0}
											<div class="grid grid-cols-1 md:grid-cols-2 gap-1">
												{#each ep.examples as ex}
													<p class="font-bold">{ex.spanish}</p>
													<p class="opacity-75">{ex.english}</p>
												{/each}
											</div>
										{/if}
										{#if ep.notes}
											<p class="opacity-50">{ep.notes}</p>
										{/if}
										<a href="/episodes/{ep.episodeNumber}" class="btn btn-sm preset-tonal w-fit">Go to episode &rarr;</a>
									</div>
								</Collapsible.Content>
							</Collapsible>
						{/each}
					</div>
				{/if}
			</div>
		{/each}
	</div>

	{#if filteredConcepts.length === 0}
		<div class="card preset-tonal p-6 text-center">
			<p class="h4">No concepts match your filters</p>
			<p class="opacity-50">Try adjusting your search or mastery filter.</p>
		</div>
	{/if}

	<!-- Category navigation -->
	<div class="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-4 mt-4">
		{#if data.prevCategory}
			<a href="/concepts/{data.prevCategory.slug}" class="btn preset-tonal flex-1">
				&larr; {data.prevCategory.name}
			</a>
		{:else}
			<div class="flex-1"></div>
		{/if}
		<a href="/concepts" class="btn preset-tonal">All Categories</a>
		{#if data.nextCategory}
			<a href="/concepts/{data.nextCategory.slug}" class="btn preset-tonal-primary flex-1 text-right">
				{data.nextCategory.name} &rarr;
			</a>
		{/if}
	</div>
</div>
