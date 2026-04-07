<script lang="ts">
	import { Progress, Avatar, SegmentedControl } from '@skeletonlabs/skeleton-svelte';

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
			<h1 class="h2">Episodes</h1>
			<p class="opacity-50">{data.listenedCount} of {data.totalEpisodes} completed</p>
		</div>
	</div>

	<Progress value={progressPercent} max={100}>
		<Progress.Track>
			<Progress.Range />
		</Progress.Track>
	</Progress>

	<!-- Filters -->
	<SegmentedControl
		name="filter"
		value={filter}
		onValueChange={(details) => { filter = details.value; }}
	>
		<SegmentedControl.Control>
			<SegmentedControl.Indicator />
			<SegmentedControl.Item value="all">
				<SegmentedControl.ItemText>All ({data.totalEpisodes})</SegmentedControl.ItemText>
				<SegmentedControl.ItemHiddenInput />
			</SegmentedControl.Item>
			<SegmentedControl.Item value="listened">
				<SegmentedControl.ItemText>Listened ({data.listenedCount})</SegmentedControl.ItemText>
				<SegmentedControl.ItemHiddenInput />
			</SegmentedControl.Item>
			<SegmentedControl.Item value="not-listened">
				<SegmentedControl.ItemText>Not Listened ({data.totalEpisodes - data.listenedCount})</SegmentedControl.ItemText>
				<SegmentedControl.ItemHiddenInput />
			</SegmentedControl.Item>
		</SegmentedControl.Control>
	</SegmentedControl>

	<!-- Episode cards -->
	<div class="flex flex-col gap-2">
		{#each filteredEpisodes as ep}
			<a href="/episodes/{ep.number}" class="card p-4 flex items-center gap-4">
				<Avatar class={ep.listened ? 'preset-filled-primary-500' : 'preset-tonal'}>
					<Avatar.Fallback>{ep.number}</Avatar.Fallback>
				</Avatar>
				<div class="flex-1">
					<p class="anchor">{ep.title}</p>
					{#if ep.conceptNames.length > 0}
						<div class="flex gap-1 mt-1 flex-wrap">
							{#each ep.conceptNames as name}
								<span class="chip preset-tonal">{name}</span>
							{/each}
						</div>
					{/if}
				</div>
				<div class="flex gap-2">
					{#if ep.wordCount > 0}
						<span class="badge preset-tonal">{ep.wordCount} words</span>
					{/if}
					{#if ep.conceptCount > 0}
						<span class="badge preset-tonal">{ep.conceptCount} concepts</span>
					{/if}
				</div>
			</a>
		{/each}
	</div>

	{#if filteredEpisodes.length === 0}
		<div class="card preset-tonal p-6 text-center">
			<p class="h4">No episodes match this filter</p>
		</div>
	{/if}
</div>
