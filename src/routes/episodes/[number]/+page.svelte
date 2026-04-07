<script lang="ts">
	import { enhance } from '$app/forms';
	import { Tabs, Switch, Avatar, Collapsible, Tooltip, Popover } from '@skeletonlabs/skeleton-svelte';
	import AudioPlayer from '$lib/components/AudioPlayer.svelte';

	let { data, form } = $props();
	let activeTab = $state('transcript');
	let listened = $state(data.episode.listened);
	$effect(() => { listened = data.episode.listened; });
	let formEl: HTMLFormElement;

	let pendingWord = $state('');
	let popoverOpen = $state(false);
	let anchorEl: HTMLElement | null = $state(null);

	function showPopup(e: MouseEvent, word: string) {
		anchorEl = e.target as HTMLElement;
		pendingWord = word;
		popoverOpen = true;
	}

	function hidePopup() {
		popoverOpen = false;
		pendingWord = '';
	}
</script>

<div class="flex flex-col h-[calc(100dvh-3.5rem)] md:h-[calc(100dvh-3rem)] overflow-hidden">
	<!-- Header -->
	<div class="flex flex-wrap items-center gap-2 md:gap-4 pb-4">
		{#if data.prevEpisode}
			<a href="/episodes/{data.prevEpisode.number}" class="btn btn-sm preset-tonal" title={data.prevEpisode.title}>
				&larr;
			</a>
		{/if}

		<Avatar class="preset-filled-primary-500">
			<Avatar.Fallback>{data.episode.number}</Avatar.Fallback>
		</Avatar>
		<div class="flex-1">
			<p class="opacity-50"><a href="/episodes" class="anchor">Episodes</a> / Episode {data.episode.number}</p>
			<h1 class="h2">{data.episode.title}</h1>
		</div>

		<form bind:this={formEl} method="POST" action="?/toggleListened" use:enhance>
			<input type="hidden" name="number" value={data.episode.number} />
			<input type="hidden" name="listened" value={String(!listened)} />
			<Switch checked={listened} onCheckedChange={() => { formEl.requestSubmit(); listened = !listened; }}>
				<Switch.Control>
					<Switch.Thumb />
				</Switch.Control>
				<Switch.Label><span class="hidden sm:inline">{listened ? 'Listened' : 'Not listened'}</span></Switch.Label>
				<Switch.HiddenInput name="_switch" />
			</Switch>
			<noscript><button type="submit" class="btn btn-sm">Toggle</button></noscript>
		</form>

		{#if data.nextEpisode}
			<a href="/episodes/{data.nextEpisode.number}" class="btn btn-sm preset-tonal-primary" title={data.nextEpisode.title}>
				&rarr;
			</a>
		{/if}
	</div>

	<!-- Audio Player -->
	<div class="pb-4">
		<AudioPlayer
			episodeNumber={data.episode.number}
			playbackPosition={data.episode.playbackPosition}
			nextEpisodeNumber={data.nextEpisode?.number ?? null}
			onListenedChange={() => { listened = true; }}
		/>
	</div>

	<!-- Feedback (ephemeral) -->
	{#if form?.added === true}
		<aside class="card preset-tonal-primary p-3 mb-2">
			Added "{form.word.spanish}" &rarr; "{form.word.english}"
		</aside>
	{/if}
	{#if form?.added === false}
		<aside class="card preset-tonal p-3 mb-2">
			"{form.word.spanish}" already tracked
		</aside>
	{/if}
	{#if form?.addError}
		<aside class="card preset-tonal-error p-3 mb-2">{form.addError}</aside>
	{/if}

	<!-- Tabs + scrollable content -->
	<Tabs value={activeTab} onValueChange={(details) => (activeTab = details.value)} class="flex flex-col flex-1 min-h-0">
		<Tabs.List>
			<Tabs.Trigger value="transcript">Transcript</Tabs.Trigger>
			<Tabs.Trigger value="words">Words ({data.words.length})</Tabs.Trigger>
			<Tabs.Trigger value="concepts">Concepts ({data.concepts.length})</Tabs.Trigger>
			<Tabs.Indicator />
		</Tabs.List>

		<!-- Transcript Tab -->
		<Tabs.Content value="transcript" class="flex-1 min-h-0">
			<div class="transcript-scroll overflow-auto h-full pt-4" style="line-height: 1.8; position: relative;">
				{#if data.transcript.length > 0}
					{#if data.episodeSummary}
						<div class="card preset-tonal p-4 mb-4">
							<p>{data.episodeSummary}</p>
						</div>
					{/if}

					{#each data.transcript as turn}
						<div class="mb-3 flex items-start gap-3">
							{#if turn.speaker}
								<span
									class="mt-[0.55rem] inline-block h-2.5 w-2.5 shrink-0 rounded-full"
									style="background-color: var(--color-{turn.speaker === 'T' ? 'primary' : 'secondary'}-500);"
								></span>
							{:else}
								<span class="mt-[0.55rem] inline-block h-2.5 w-2.5 shrink-0"></span>
							{/if}
							<span class="inline">
								{#each turn.words as token}
									{#if token.clean}
										{#if data.savedWords.includes(token.clean)}
											<span class="chip preset-tonal-primary">{token.display}</span>
										{:else}
											<button type="button" class="anchor" onclick={(e) => showPopup(e, token.clean)}>{token.display}</button>
										{/if}
									{:else}
										{token.display}
									{/if}
								{/each}
							</span>
						</div>
					{/each}

					<!-- Popover for word actions -->
					<Popover
						open={popoverOpen}
						onOpenChange={(details: { open: boolean }) => { if (!details.open) hidePopup(); }}
						positioning={{ placement: 'top', flip: true, getAnchorElement: () => anchorEl }}
						closeOnInteractOutside={true}
					>
						<Popover.Positioner>
							<Popover.Content class="card preset-filled-primary-500 p-3">
								<p class="font-bold">Add "{pendingWord}"?</p>
								<form method="POST" action="?/addWord" use:enhance class="flex gap-2 mt-2">
									<input type="hidden" name="term" value={pendingWord} />
									<input type="hidden" name="episodeNumber" value={data.episode.number} />
									<button type="submit" class="btn btn-sm preset-filled-surface-100-900" onclick={hidePopup}>Add to LingQ</button>
									<button type="button" class="btn btn-sm preset-tonal" onclick={hidePopup}>Cancel</button>
								</form>
							</Popover.Content>
						</Popover.Positioner>
					</Popover>
				{:else}
					<div class="text-center p-8 opacity-50">
						<p class="h4">No transcript available</p>
						<p>This episode doesn't have a transcript yet.</p>
					</div>
				{/if}
			</div>
		</Tabs.Content>

		<!-- Words Tab -->
		<Tabs.Content value="words" class="flex-1 min-h-0">
			<div class="overflow-auto h-full pt-4">
				<div class="flex flex-col gap-3">
					{#if data.words.length > 0}
						{#each data.words as word}
							<div class="card p-4 flex items-center gap-4">
								<div class="flex-1">
									<span class="h4">{word.spanish}</span>
									<span class="opacity-75">&mdash; {word.english}</span>
								</div>
								{#if word.lingqStatus !== null}
									<span class="badge preset-filled-primary-500">{word.lingqStatus}</span>
								{/if}
								<form method="POST" action="?/deleteWord" use:enhance>
									<input type="hidden" name="id" value={word.id} />
									<Tooltip>
										<Tooltip.Trigger>
											{#snippet child({ props })}
												<button {...props} type="submit" class="btn btn-sm preset-tonal-error">&times;</button>
											{/snippet}
										</Tooltip.Trigger>
										<Tooltip.Content>Remove word</Tooltip.Content>
									</Tooltip>
								</form>
							</div>
						{/each}
					{:else}
						<div class="card preset-tonal p-6 text-center">
							<p class="h4">No words tracked yet</p>
							<p class="opacity-50">Click words in the transcript to add them to your vocabulary.</p>
						</div>
					{/if}
				</div>
			</div>
		</Tabs.Content>

		<!-- Concepts Tab -->
		<Tabs.Content value="concepts" class="flex-1 min-h-0">
			<div class="overflow-auto h-full pt-4">
				<div class="flex flex-col gap-4">
					{#if data.episodeSummary}
						<div class="card preset-tonal p-4">
							<p>{data.episodeSummary}</p>
						</div>
					{/if}

					{#if data.concepts.length > 0}
						{#each data.concepts as concept, i}
							<Collapsible defaultOpen={i === 0}>
								<Collapsible.Trigger>
									<div class="flex items-center gap-2">
										<span class="font-bold">{concept.name}</span>
										<span class="badge preset-filled-primary-500">{concept.role}</span>
										{#if concept.category}
											<span class="badge preset-tonal">{concept.category}</span>
										{/if}
									</div>
								</Collapsible.Trigger>
								<Collapsible.Content>
									<div class="flex flex-col gap-3 p-2">
										{#if concept.summary}
											<p>{concept.summary}</p>
										{/if}

										{#if concept.rule}
											<div class="card preset-tonal-primary p-3" style="border-left: 3px solid var(--color-primary-500);">
												<p class="font-bold">{concept.rule}</p>
											</div>
										{/if}

										{#if concept.examples.length > 0}
											<div class="grid grid-cols-1 md:grid-cols-2 gap-2">
												{#each concept.examples as ex}
													<p class="font-bold">{ex.spanish}</p>
													<p class="opacity-75">{ex.english}</p>
												{/each}
											</div>
										{/if}

										{#if concept.notes}
											<p class="opacity-50">{concept.notes}</p>
										{/if}
									</div>
								</Collapsible.Content>
							</Collapsible>
						{/each}
					{:else}
						<div class="card preset-tonal p-6 text-center">
							<p class="h4">No concepts linked</p>
							<p class="opacity-50">No grammar concepts have been extracted for this episode yet.</p>
						</div>
					{/if}

					{#if data.vocabulary.length > 0}
						<h3 class="h3">Vocabulary</h3>
						<div class="grid grid-cols-1 md:grid-cols-2 gap-2">
							{#each data.vocabulary as v}
								<div class="card p-3">
									<p class="font-bold">{v.spanish}</p>
									<p class="opacity-75">{v.english}</p>
									{#if v.derivation}
										<p class="opacity-50">{v.derivation}</p>
									{/if}
								</div>
							{/each}
						</div>
					{/if}
				</div>
			</div>
		</Tabs.Content>
	</Tabs>
</div>
