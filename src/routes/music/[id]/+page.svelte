<script lang="ts">
	import { enhance } from '$app/forms';
	import { Popover, PopoverContent } from '$lib/components/ui/popover';
	import { Button } from '$lib/components/ui/button';
	import { Card, CardContent } from '$lib/components/ui/card';
	import SongPlayer from '$lib/components/SongPlayer.svelte';
	import LyricsDisplay from '$lib/components/LyricsDisplay.svelte';

	let { data, form } = $props();

	let currentMs = $state(0);
	let pendingWord = $state('');
	let popoverOpen = $state(false);
	let anchorEl: HTMLElement | null = $state(null);
	let reloadingLyrics = $state(false);

	function handleWordClick(word: string, event: MouseEvent) {
		anchorEl = event.target as HTMLElement;
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

<div class="h-full overflow-hidden flex flex-col gap-4 p-4 pb-20 md:p-6 md:pb-6">
	<div class="flex items-center gap-3">
		<Button href="/music" variant="outline" size="sm">&larr;</Button>
		<div class="flex-1">
			<p class="text-sm text-muted-foreground"><Button href="/music" variant="link" class="h-auto p-0">Music</Button></p>
			<h1 class="text-2xl font-bold">{data.song.title}</h1>
			<p class="text-muted-foreground">{data.song.artist}</p>
		</div>
	</div>

	{#if data.song.teacherNotes}
		<Card>
			<CardContent class="py-3 px-4 text-sm text-muted-foreground">{data.song.teacherNotes}</CardContent>
		</Card>
	{/if}

	{#if form?.added}
		<Card>
			<CardContent class="py-3 px-4">Added "{form.word.spanish}" &rarr; "{form.word.english}"</CardContent>
		</Card>
	{:else if form?.added === false}
		<Card>
			<CardContent class="py-3 px-4">"{form.word.spanish}" already tracked</CardContent>
		</Card>
	{:else if form?.addError}
		<Card>
			<CardContent class="py-3 px-4 text-destructive">{form.addError}</CardContent>
		</Card>
	{/if}

	<div class="flex-1 min-h-0 grid md:grid-cols-2 gap-4">
		<div class="flex flex-col gap-4 overflow-y-auto min-h-0">
			<SongPlayer youtubeId={data.song.youtubeId} onTimeUpdate={handleTimeUpdate} />

			{#if data.songWords.length > 0}
				<Card>
					<CardContent class="py-4 px-4">
						<h2 class="text-base font-semibold mb-3">Saved words ({data.songWords.length})</h2>
						<ul class="flex flex-col gap-2">
							{#each data.songWords as word}
								<li class="flex items-center gap-2">
									<span class="flex-1">
										<span class="font-medium">{word.spanish}</span>
										{#if word.english}
											<span class="text-muted-foreground"> &mdash; {word.english}</span>
										{/if}
									</span>
									<form method="POST" action="?/deleteWord" use:enhance>
										<input type="hidden" name="id" value={word.id} />
										<Button type="submit" size="sm" variant="destructive">&times;</Button>
									</form>
								</li>
							{/each}
						</ul>
					</CardContent>
				</Card>
			{/if}
		</div>

		{#if data.lines.length > 0}
			<Card class="flex flex-col overflow-hidden">
				<div class="flex items-center justify-between p-4 pb-2">
					<h2 class="text-base font-semibold">Lyrics</h2>
					<form
						method="POST"
						action="?/reloadLyrics"
						use:enhance={() => {
							reloadingLyrics = true;
							return ({ update }) => {
								reloadingLyrics = false;
								update();
							};
						}}
					>
						<Button type="submit" size="sm" variant="outline" disabled={reloadingLyrics}>
							{reloadingLyrics ? 'Reloading…' : 'Reload lyrics'}
						</Button>
					</form>
				</div>
				{#if form?.reloadError}
					<p class="text-sm text-muted-foreground px-4">{form.reloadError}</p>
				{/if}
				<div class="flex-1 overflow-y-auto">
					<LyricsDisplay
						lines={data.lines.map((l) => ({ startMs: l.startMs, spanish: l.spanish, english: l.english ?? null }))}
						{currentMs}
						trackedWords={data.trackedWords}
						onWordClick={handleWordClick}
					/>
				</div>
			</Card>
		{:else}
			<Card>
				<CardContent class="py-4 text-center text-muted-foreground">
					<p>No lyrics added yet.</p>
					<form
						method="POST"
						action="?/reloadLyrics"
						use:enhance={() => {
							reloadingLyrics = true;
							return ({ update }) => {
								reloadingLyrics = false;
								update();
							};
						}}
						class="mt-2"
					>
						<Button type="submit" size="sm" variant="outline" disabled={reloadingLyrics}>
							{reloadingLyrics ? 'Reloading…' : 'Reload lyrics'}
						</Button>
					</form>
					{#if form?.reloadError}
						<p class="text-sm text-muted-foreground mt-1">{form.reloadError}</p>
					{/if}
				</CardContent>
			</Card>
		{/if}
	</div>
</div>

<Popover bind:open={popoverOpen} onOpenChange={(open) => { if (!open) hidePopover(); }}>
	<PopoverContent customAnchor={anchorEl} side="top">
		<p class="font-bold mb-2">{pendingWord}</p>
		<form
			method="POST"
			action="?/addWord"
			use:enhance={() => {
				return async ({ result, update }) => {
					if (result.type === 'success' || result.type === 'redirect') hidePopover();
					await update();
				};
			}}
			class="flex gap-2"
		>
			<input type="hidden" name="term" value={pendingWord} />
			<Button type="submit" size="sm">Save word</Button>
			<Button type="button" size="sm" variant="outline" onclick={hidePopover}>Cancel</Button>
		</form>
	</PopoverContent>
</Popover>
