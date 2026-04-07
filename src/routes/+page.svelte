<script lang="ts">
	import { Progress, Avatar } from '@skeletonlabs/skeleton-svelte';

	let { data } = $props();
	const progressPercent = $derived(Math.round((data.listenedCount / data.totalEpisodes) * 100));
</script>

<div class="flex flex-col gap-6">
	<!-- Hero: Journey Progress -->
	<div class="card preset-tonal-primary p-6">
		<div class="flex flex-col sm:flex-row sm:items-center gap-4">
			<div class="flex-1">
				<h1 class="h2">Your Journey</h1>
				<p class="opacity-75">{data.listenedCount} of {data.totalEpisodes} episodes completed</p>
			</div>
			<div class="flex gap-6">
				<div class="text-center">
					<p class="h3">{data.wordCount}</p>
					<p class="opacity-75">Words</p>
				</div>
				<div class="text-center">
					<p class="h3">{data.conceptCount}</p>
					<p class="opacity-75">Concepts</p>
				</div>
			</div>
		</div>
		<div class="mt-4">
			<Progress value={progressPercent} max={100}>
				<Progress.Track>
					<Progress.Range />
				</Progress.Track>
			</Progress>
			<p class="text-right mt-1 opacity-75">{progressPercent}%</p>
		</div>
	</div>

	<!-- Continue Learning -->
	{#if data.nextEpisode}
		<a href="/episodes/{data.nextEpisode.number}" class="card preset-filled-primary-500 p-6 flex items-center gap-4">
			<Avatar>
				<Avatar.Fallback>{data.nextEpisode.number}</Avatar.Fallback>
			</Avatar>
			<div class="flex-1">
				<p class="opacity-75">Continue learning</p>
				<p class="h3">{data.nextEpisode.title}</p>
			</div>
			<span class="h4">&rarr;</span>
		</a>
	{:else}
		<div class="card preset-tonal p-6 text-center">
			<p class="h3">Course Complete</p>
			<p class="opacity-75">You've listened to all {data.totalEpisodes} episodes</p>
		</div>
	{/if}

	<!-- Recent Activity -->
	{#if data.recentEpisodes.length > 0}
		<div class="card p-6">
			<h2 class="h3">Recent Activity</h2>
			<div class="flex flex-col gap-3 mt-4">
				{#each data.recentEpisodes as ep, i}
					<a href="/episodes/{ep.number}" class="flex items-center gap-3">
						<Avatar class={i === 0 ? 'preset-filled-primary-500' : 'preset-tonal'}>
							<Avatar.Fallback>{ep.number}</Avatar.Fallback>
						</Avatar>
						<div class="flex-1">
							<p class="anchor">{ep.title}</p>
							{#if ep.listenedAt}
								<p class="opacity-50">{ep.listenedAt}</p>
							{/if}
						</div>
					</a>
					{#if i < data.recentEpisodes.length - 1}
						<hr />
					{/if}
				{/each}
			</div>
		</div>
	{/if}
</div>
