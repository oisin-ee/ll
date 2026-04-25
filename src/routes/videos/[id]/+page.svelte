<script lang="ts">
	import MediaDetailPage from '$lib/components/MediaDetailPage.svelte';
	import FormFeedback from '$lib/components/media-detail/FormFeedback.svelte';
	import WordList from '$lib/components/media-detail/WordList.svelte';
	import ReloadButton from '$lib/components/media-detail/ReloadButton.svelte';
	import WordPopover from '$lib/components/media-detail/WordPopover.svelte';
	import SongPlayer from '$lib/components/SongPlayer.svelte';
	import LyricsDisplay from '$lib/components/LyricsDisplay.svelte';
	import { Card, CardContent } from '$lib/components/ui/card';

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
	<title>{data.video.title} — Language Learner</title>
</svelte:head>

<MediaDetailPage>
	{#snippet feedback()}
		<FormFeedback {form} />
		{#if data.video.teacherNotes}
			<Card>
				<CardContent class="py-3 px-4 text-sm text-muted-foreground">{data.video.teacherNotes}</CardContent>
			</Card>
		{/if}
	{/snippet}

	{#snippet left()}
		<SongPlayer youtubeId={data.video.youtubeId} onTimeUpdate={(ms) => (currentMs = ms)} />
		<WordList words={data.videoWords} label="Saved words" />
	{/snippet}

	{#snippet right()}
		{#if data.lines.length > 0}
			<Card class="flex flex-col overflow-hidden flex-1 min-h-0">
				<div class="flex items-center justify-between p-4 pb-2">
					<h3 class="text-base font-semibold">Subtitles</h3>
					<ReloadButton action="?/reloadSubtitles" label="Reload subtitles" error={form?.reloadError} />
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
					<p>No subtitles added yet.</p>
					<div class="mt-2">
						<ReloadButton action="?/reloadSubtitles" label="Reload subtitles" error={form?.reloadError} />
					</div>
				</CardContent>
			</Card>
		{/if}
	{/snippet}

	{#snippet popover()}
		<WordPopover bind:open={popoverOpen} word={pendingWord} anchor={anchorEl} />
	{/snippet}
</MediaDetailPage>
