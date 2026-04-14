<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Card, CardContent } from '$lib/components/ui/card';

	let { data } = $props();
</script>

<svelte:head>
	<title>Music — Language Learner</title>
</svelte:head>

<div class="flex items-center justify-between mb-6">
	<h1 class="text-3xl font-bold">Music</h1>
	<Button href="/music/new">Add Song</Button>
</div>

{#if data.songs.length === 0}
	<Card>
		<CardContent class="py-8 text-center text-muted-foreground">
			<p class="mb-4">No songs yet. Add one your teacher assigned!</p>
			<Button href="/music/new" variant="outline">Add your first song</Button>
		</CardContent>
	</Card>
{:else}
	<ul class="grid gap-4 sm:grid-cols-2">
		{#each data.songs as song}
			<li>
				<Button href="/music/{song.id}" variant="outline" class="h-auto p-4 flex flex-col gap-1 items-start w-full justify-start">
					<span class="font-semibold text-base">{song.title}</span>
					<span class="text-muted-foreground">{song.artist}</span>
					{#if song.teacherNotes}
						<span class="text-sm text-muted-foreground line-clamp-2">{song.teacherNotes}</span>
					{/if}
				</Button>
			</li>
		{/each}
	</ul>
{/if}
