<script lang="ts">
	let { data } = $props();
</script>

<svelte:head>
	<title>Music — Language Learner</title>
</svelte:head>

<div class="flex items-center justify-between mb-6">
	<h1 class="h2">Music</h1>
	<a href="/music/new" class="btn preset-filled-primary-500">Add Song</a>
</div>

{#if data.songs.length === 0}
	<div class="card preset-tonal p-8 text-center opacity-75">
		<p class="mb-4">No songs yet. Add one your teacher assigned!</p>
		<a href="/music/new" class="btn preset-tonal-primary">Add your first song</a>
	</div>
{:else}
	<ul class="grid gap-4 sm:grid-cols-2">
		{#each data.songs as song}
			<li>
				<a href="/music/{song.id}" class="card preset-tonal p-4 flex flex-col gap-1 hover:preset-tonal-primary transition-colors">
					<span class="h4 font-semibold">{song.title}</span>
					<span class="opacity-75">{song.artist}</span>
					{#if song.teacherNotes}
						<span class="text-sm opacity-60 mt-1 line-clamp-2">{song.teacherNotes}</span>
					{/if}
				</a>
			</li>
		{/each}
	</ul>
{/if}
