<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Card, CardContent } from '$lib/components/ui/card';

	let { data } = $props();
</script>

<svelte:head>
	<title>Videos — Language Learner</title>
</svelte:head>

<div class="flex items-center justify-between mb-6">
	<h1 class="text-3xl font-bold">Videos</h1>
	<Button href="/videos/new">Add Video</Button>
</div>

{#if data.videos.length === 0}
	<Card>
		<CardContent class="py-8 text-center text-muted-foreground">
			<p class="mb-4">No videos yet.</p>
			<Button href="/videos/new" variant="outline">Add your first video</Button>
		</CardContent>
	</Card>
{:else}
	<ul class="grid gap-4 sm:grid-cols-2">
		{#each data.videos as video}
			<li>
				<Button href="/videos/{video.id}" variant="outline" class="h-auto p-4 flex flex-col gap-1 items-start w-full justify-start">
					<span class="font-semibold text-base">{video.title}</span>
					<span class="text-muted-foreground">{video.artist}</span>
					{#if video.teacherNotes}
						<span class="text-sm text-muted-foreground line-clamp-2">{video.teacherNotes}</span>
					{/if}
				</Button>
			</li>
		{/each}
	</ul>
{/if}
