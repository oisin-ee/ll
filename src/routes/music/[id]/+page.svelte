<script lang="ts">
	import MediaDetailPage from '$lib/components/MediaDetailPage.svelte';
	import FormFeedback from '$lib/components/media-detail/FormFeedback.svelte';
	import WordList from '$lib/components/media-detail/WordList.svelte';
	import ReloadButton from '$lib/components/media-detail/ReloadButton.svelte';
	import WordPopover from '$lib/components/media-detail/WordPopover.svelte';
	import SongPlayer from '$lib/components/SongPlayer.svelte';
	import LyricsDisplay from '$lib/components/LyricsDisplay.svelte';
	import { Button } from '$lib/components/ui/button';
	import { Card, CardContent } from '$lib/components/ui/card';
	import { enhance } from '$app/forms';

	let { data, form } = $props();

	let currentMs = $state(0);
	let popoverOpen = $state(false);
	let pendingWord = $state('');
	let anchorEl = $state<HTMLElement | null>(null);

	function openWord(word: string, e: MouseEvent) {
		pendingWord = word;
		anchorEl = e.target as HTMLElement;
		popoverOpen = true;
	}
</script>

<svelte:head>
	<title>{data.song.title} — Language Learner</title>
</svelte:head>

<MediaDetailPage>
	{#snippet deleteButton()}
		<form method="POST" action="?/deleteSong" use:enhance>
			<Button type="submit" size="sm" variant="destructive">Delete</Button>
		</form>
	{/snippet}

	{#snippet feedback()}
		<FormFeedback {form} />
		{#if data.song.teacherNotes}
			<Card>
				<CardContent class="py-3 px-4 text-sm text-muted-foreground">{data.song.teacherNotes}</CardContent>
			</Card>
		{/if}
	{/snippet}

	{#snippet left()}
		<SongPlayer youtubeId={data.song.youtubeId} onTimeUpdate={(ms) => (currentMs = ms)} />
		<WordList words={data.songWords} label="Saved words" />
	{/snippet}

	{#snippet right()}
		{#if data.lines.length > 0}
			<Card class="flex flex-col overflow-hidden flex-1 min-h-0">
				<div class="flex items-center justify-between p-4 pb-2">
					<h3 class="text-base font-semibold">Lyrics</h3>
					<ReloadButton action="?/reloadLyrics" label="Reload lyrics" error={form?.reloadError} />
				</div>
				<div class="flex-1 overflow-y-auto">
					<LyricsDisplay
						lines={data.lines.map((l) => ({ startMs: l.startMs, spanish: l.spanish, english: l.english ?? null }))}
						{currentMs}
						trackedWords={data.trackedWords}
						onWordClick={openWord}
					/>
				</div>
			</Card>
		{:else}
			<Card>
				<CardContent class="py-4 text-center text-muted-foreground">
					<p>No lyrics added yet.</p>
					<div class="mt-2">
						<ReloadButton action="?/reloadLyrics" label="Reload lyrics" error={form?.reloadError} />
					</div>
				</CardContent>
			</Card>
		{/if}
	{/snippet}

	{#snippet popover()}
		<WordPopover bind:open={popoverOpen} word={pendingWord} anchor={anchorEl} />
	{/snippet}
</MediaDetailPage>
