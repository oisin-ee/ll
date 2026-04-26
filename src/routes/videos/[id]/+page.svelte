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

	const otherSourceAvailable = $derived(
		(data.media.source === 'lyrics' && data.sources.hasCaptions) ||
		(data.media.source === 'captions' && data.sources.hasSyncedLyrics)
	);

	const switchLabel = $derived(data.media.source === 'lyrics' ? 'Use captions instead' : 'Use lyrics instead');
	const linesHeading = $derived(data.media.source === 'lyrics' ? 'Lyrics' : 'Subtitles');
	const reloadLabel = $derived(data.media.source === 'lyrics' ? 'Reload lyrics' : 'Reload subtitles');
</script>

<svelte:head>
	<title>{data.media.title} — Language Learner</title>
</svelte:head>

<MediaDetailPage>
	{#snippet deleteButton()}
		<form method="POST" action="?/deleteMedia" use:enhance>
			<Button type="submit" size="sm" variant="destructive">Delete</Button>
		</form>
	{/snippet}

	{#snippet feedback()}
		<FormFeedback {form} />
		{#if data.media.teacherNotes}
			<Card>
				<CardContent class="py-3 px-4 text-sm text-muted-foreground">{data.media.teacherNotes}</CardContent>
			</Card>
		{/if}
	{/snippet}

	{#snippet left()}
		<SongPlayer youtubeId={data.media.youtubeId} onTimeUpdate={(ms) => (currentMs = ms)} />
		<WordList words={data.words} label="Saved words" />
	{/snippet}

	{#snippet right()}
		{#if data.lines.length > 0}
			<Card class="flex flex-col overflow-hidden flex-1 min-h-0">
				<div class="flex items-center justify-between p-4 pb-2">
					<h3 class="text-base font-semibold">{linesHeading}</h3>
					<div class="flex items-center gap-2">
						{#if otherSourceAvailable}
							<form method="POST" action="?/switchSource" use:enhance>
								<Button type="submit" size="sm" variant="outline">{switchLabel}</Button>
							</form>
						{/if}
						<ReloadButton action="?/reloadLines" label={reloadLabel} error={form?.reloadError} />
					</div>
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
					<p>No {linesHeading.toLowerCase()} added yet.</p>
					<div class="mt-2">
						<ReloadButton action="?/reloadLines" label={reloadLabel} error={form?.reloadError} />
					</div>
				</CardContent>
			</Card>
		{/if}
	{/snippet}

	{#snippet popover()}
		<WordPopover bind:open={popoverOpen} word={pendingWord} anchor={anchorEl} />
	{/snippet}
</MediaDetailPage>
