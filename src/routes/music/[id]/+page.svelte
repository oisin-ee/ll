<script lang="ts">
	import { enhance } from '$app/forms';
	import { Popover } from '@skeletonlabs/skeleton-svelte';
	import SongPlayer from '$lib/components/SongPlayer.svelte';
	import LyricsDisplay from '$lib/components/LyricsDisplay.svelte';

	let { data, form } = $props();

	let currentMs = $state(0);
	let pendingWord = $state('');
	let popoverOpen = $state(false);
	let anchorEl: HTMLElement | null = $state(null);
	let addWordFormEl: HTMLFormElement | null = $state(null);

	function handleWordClick(e: MouseEvent, word: string) {
		anchorEl = e.currentTarget as HTMLElement;
		pendingWord = word;
		popoverOpen = true;
	}

	function hidePopover() {
		popoverOpen = false;
		pendingWord = '';
	}

	function handleTimeUpdate(ms: number) {
		currentMs = ms;
	}
</script>

<svelte:head>
	<title>{data.song.title} — Language Learner</title>
</svelte:head>

<div class="flex flex-col gap-4">
	<div class="flex items-center gap-3">
		<a href="/music" class="btn btn-sm preset-tonal">&larr;</a>
		<div class="flex-1">
			<p class="opacity-50"><a href="/music" class="anchor">Music</a></p>
			<h1 class="h2">{data.song.title}</h1>
			<p class="opacity-75">{data.song.artist}</p>
		</div>
	</div>

	{#if data.song.teacherNotes}
		<aside class="card preset-tonal p-3 text-sm opacity-75">{data.song.teacherNotes}</aside>
	{/if}

	{#if form?.added}
		<aside class="card preset-tonal-primary p-3">
			Added "{form.word.spanish}" &rarr; "{form.word.english}"
		</aside>
	{:else if form?.added === false}
		<aside class="card preset-tonal p-3">"{form.word.spanish}" already tracked</aside>
	{:else if form?.addError}
		<aside class="card preset-tonal-error p-3">{form.addError}</aside>
	{/if}

	<div class="grid md:grid-cols-2 gap-4 items-start">
		<div class="flex flex-col gap-4">
			<SongPlayer youtubeId={data.song.youtubeId} onTimeUpdate={handleTimeUpdate} />

			{#if data.songWords.length > 0}
				<section class="card preset-tonal p-4">
					<h2 class="h4 mb-3">Saved words ({data.songWords.length})</h2>
					<ul class="flex flex-col gap-2">
						{#each data.songWords as word}
							<li class="flex items-center gap-2">
								<span class="flex-1">
									<span class="font-medium">{word.spanish}</span>
									{#if word.english}
										<span class="opacity-75"> &mdash; {word.english}</span>
									{/if}
								</span>
								<form method="POST" action="?/deleteWord" use:enhance>
									<input type="hidden" name="id" value={word.id} />
									<button type="submit" class="btn btn-sm preset-tonal-error">&times;</button>
								</form>
							</li>
						{/each}
					</ul>
				</section>
			{/if}
		</div>

		{#if data.lines.length > 0}
			<section class="card preset-tonal p-4 max-h-screen overflow-y-auto">
				<h2 class="h4 mb-3">Lyrics</h2>
				<LyricsDisplay
					lines={data.lines.map((l) => ({ startMs: l.startMs, text: l.spanish }))}
					{currentMs}
					trackedWords={data.trackedWords}
					onWordClick={(word) => {
						pendingWord = word;
						popoverOpen = true;
					}}
				/>
			</section>
		{:else}
			<section class="card preset-tonal p-4 text-center opacity-60">
				<p>No lyrics added yet.</p>
				<a href="/music/{data.song.id}/edit" class="anchor text-sm mt-1">Add lyrics</a>
			</section>
		{/if}
	</div>
</div>

<Popover
	open={popoverOpen}
	onOpenChange={(o) => { if (!o) hidePopover(); }}
	positioning={{ placement: 'top' }}
>
	<Popover.Content>
		<p class="mb-2 font-medium">{pendingWord}</p>
		<form
			bind:this={addWordFormEl}
			method="POST"
			action="?/addWord"
			use:enhance={() => {
				return ({ result }) => {
					if (result.type === 'success' || result.type === 'redirect') hidePopover();
				};
			}}
			class="flex gap-2"
		>
			<input type="hidden" name="term" value={pendingWord} />
			<button type="submit" class="btn btn-sm preset-filled-primary-500">Save word</button>
			<button type="button" class="btn btn-sm preset-tonal" onclick={hidePopover}>Cancel</button>
		</form>
	</Popover.Content>
</Popover>
