<script lang="ts">
	import { Progress } from '$lib/components/ui/progress';
	import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import { Avatar, AvatarFallback } from '$lib/components/ui/avatar';
	import { Separator } from '$lib/components/ui/separator';

	let { data } = $props();
	const progressPercent = $derived(Math.round((data.listenedCount / data.totalEpisodes) * 100));
</script>

<div class="flex flex-col gap-6">
	<Card>
		<CardHeader>
			<div class="flex flex-col sm:flex-row sm:items-center gap-4">
				<div class="flex-1">
					<CardTitle class="font-display text-2xl">Your Journey</CardTitle>
					<p class="text-muted-foreground text-sm mt-1">{data.listenedCount} of {data.totalEpisodes} episodes completed</p>
				</div>
				<div class="flex gap-6">
					<div class="text-center">
						<p class="font-display text-2xl font-semibold">{data.wordCount}</p>
						<p class="text-sm text-muted-foreground">Words</p>
					</div>
					<div class="text-center">
						<p class="font-display text-2xl font-semibold">{data.conceptCount}</p>
						<p class="text-sm text-muted-foreground">Concepts</p>
					</div>
				</div>
			</div>
		</CardHeader>
		<CardContent>
			<Progress value={progressPercent} max={100} />
			<p class="text-right mt-1 text-sm text-muted-foreground">{progressPercent}%</p>
		</CardContent>
	</Card>

	{#if data.nextEpisode}
		<Button href="/episodes/{data.nextEpisode.number}" variant="default" class="h-auto p-6 flex items-center gap-4 justify-start">
			<Avatar>
				<AvatarFallback class="bg-primary-foreground/20 text-primary-foreground font-display">{data.nextEpisode.number}</AvatarFallback>
			</Avatar>
			<div class="flex-1 text-left">
				<p class="text-primary-foreground/75 text-sm">Continue learning</p>
				<p class="font-display text-xl font-semibold">{data.nextEpisode.title}</p>
			</div>
			<span class="text-xl">&rarr;</span>
		</Button>
	{:else}
		<Card>
			<CardContent class="text-center py-4">
				<p class="font-display text-xl font-semibold">Course Complete</p>
				<p class="text-muted-foreground mt-1">You've listened to all {data.totalEpisodes} episodes</p>
			</CardContent>
		</Card>
	{/if}

	{#if data.recentEpisodes.length > 0}
		<Card>
			<CardHeader>
				<CardTitle class="font-display text-xl">Recent Activity</CardTitle>
			</CardHeader>
			<CardContent class="flex flex-col gap-3">
				{#each data.recentEpisodes as ep, i}
					<Button href="/episodes/{ep.number}" variant="ghost" class="h-auto py-2 flex items-center gap-3 justify-start">
						<Avatar>
							<AvatarFallback class="{i === 0 ? 'bg-primary text-primary-foreground' : ''} font-display">{ep.number}</AvatarFallback>
						</Avatar>
						<div class="flex-1 text-left">
							<p class="text-foreground">{ep.title}</p>
							{#if ep.listenedAt}
								<p class="text-xs text-muted-foreground">{ep.listenedAt}</p>
							{/if}
						</div>
					</Button>
					{#if i < data.recentEpisodes.length - 1}
						<Separator />
					{/if}
				{/each}
			</CardContent>
		</Card>
	{/if}
</div>
