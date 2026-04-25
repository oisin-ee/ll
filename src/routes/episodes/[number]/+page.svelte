<script lang="ts">
	import { enhance } from '$app/forms';
	import { Tabs, TabsList, TabsTrigger, TabsContent } from '$lib/components/ui/tabs';
	import { Switch } from '$lib/components/ui/switch';
	import { Collapsible, CollapsibleTrigger, CollapsibleContent } from '$lib/components/ui/collapsible';
	import { Tooltip, TooltipTrigger, TooltipContent } from '$lib/components/ui/tooltip';
	import { buttonVariants } from '$lib/components/ui/button';
	import { Badge } from '$lib/components/ui/badge';
	import { Card, CardContent } from '$lib/components/ui/card';
	import AudioPlayer from '$lib/components/AudioPlayer.svelte';
	import WordPopover from '$lib/components/media-detail/WordPopover.svelte';

	let { data, form } = $props();
	let activeTab = $state('transcript');
	let formEl: HTMLFormElement;

	let pendingWord = $state('');
	let popoverOpen = $state(false);
	let anchorEl = $state<HTMLElement | null>(null);

	function getSpeakerClasses(speaker: 'T' | 'S' | null): string {
		if (speaker === 'T') {
			return 'border-primary/30 bg-primary/10 text-foreground';
		}
		if (speaker === 'S') {
			return 'border-emerald-500/30 bg-emerald-500/10 text-foreground';
		}
		return 'border-border bg-muted text-muted-foreground';
	}

	function openWord(e: MouseEvent, word: string) {
		anchorEl = e.target as HTMLElement;
		pendingWord = word;
		popoverOpen = true;
	}
</script>

<div class="h-full overflow-hidden flex flex-col gap-4">
	<div class="flex items-center justify-end gap-2">
			<form bind:this={formEl} method="POST" action="?/toggleListened" use:enhance>
				<input type="hidden" name="number" value={data.episode.number} />
				<input type="hidden" name="listened" value={String(!data.episode.listened)} />
				<Switch checked={data.episode.listened} onclick={() => formEl.requestSubmit()} />
				<noscript><button type="submit">Toggle</button></noscript>
			</form>
	</div>

	<div>
		<AudioPlayer
			episodeNumber={data.episode.number}
			playbackPosition={data.episode.playbackPosition}
			prevEpisodeNumber={data.prevEpisode?.number ?? null}
			nextEpisodeNumber={data.nextEpisode?.number ?? null}
		/>
	</div>

	{#if form?.added === true}
		<Card class="mb-2">
			<CardContent class="py-3 px-4">Added "{form.word.spanish}" &rarr; "{form.word.english}"</CardContent>
		</Card>
	{/if}
	{#if form?.added === false}
		<Card class="mb-2">
			<CardContent class="py-3 px-4">"{form.word.spanish}" already tracked</CardContent>
		</Card>
	{/if}
	{#if form?.addError}
		<Card class="mb-2">
			<CardContent class="py-3 px-4 text-destructive">{form.addError}</CardContent>
		</Card>
	{/if}

	<Tabs bind:value={activeTab} class="flex-1 min-h-0 overflow-hidden">
		<TabsList>
			<TabsTrigger value="transcript">Transcript</TabsTrigger>
			<TabsTrigger value="words">Words ({data.words.length})</TabsTrigger>
			<TabsTrigger value="concepts">Concepts ({data.concepts.length})</TabsTrigger>
		</TabsList>

		<TabsContent value="transcript" class="overflow-y-auto min-h-0">
			<div class="relative pt-4">
				{#if data.transcript.length > 0}
					{#if data.episodeSummary}
						<Card class="mb-4">
							<CardContent class="py-4 px-4"><p>{data.episodeSummary}</p></CardContent>
						</Card>
					{/if}

					{#each data.transcript as turn}
						<div class="mb-4 flex items-start gap-3">
							<span
								class={`inline-flex h-6 min-w-6 shrink-0 items-center justify-center rounded-full border text-xs font-semibold ${getSpeakerClasses(turn.speaker)}`}
							>
								{turn.speaker ?? '—'}
							</span>
							<span class={`inline text-base leading-8 font-normal ${turn.speaker ? 'text-foreground' : 'text-muted-foreground'}`}>
								{#each turn.words as token}
									{#if token.clean}
										{#if data.savedWords.includes(token.clean)}
											<Badge variant="secondary">{token.display}</Badge>
										{:else}
											<button
												type="button"
												class="inline cursor-pointer border-none bg-transparent p-0 text-base font-normal text-inherit underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
												onclick={(e: MouseEvent) => openWord(e, token.clean)}
											>
												{token.display}
											</button>
										{/if}
									{:else}
										{token.display}
									{/if}
								{/each}
							</span>
						</div>
					{/each}

					<WordPopover
						bind:open={popoverOpen}
						word={pendingWord}
						anchor={anchorEl}
						submitLabel="Add to LingQ"
					>
						{#snippet extraFields()}
							<input type="hidden" name="episodeNumber" value={data.episode.number} />
						{/snippet}
					</WordPopover>
				{:else}
					<div class="text-center p-8 text-muted-foreground">
						<p class="text-xl font-semibold">No transcript available</p>
						<p>This episode doesn't have a transcript yet.</p>
					</div>
				{/if}
			</div>
		</TabsContent>

		<TabsContent value="words" class="overflow-y-auto min-h-0">
			<div class="pt-4">
				<div class="flex flex-col gap-3">
					{#if data.words.length > 0}
						{#each data.words as word}
							<Card>
								<CardContent class="py-4 px-4 flex items-center gap-4">
									<div class="flex-1">
										<span class="text-lg font-semibold">{word.spanish}</span>
										<span class="text-muted-foreground"> &mdash; {word.english}</span>
									</div>
									{#if word.lingqStatus !== null}
										<Badge>{word.lingqStatus}</Badge>
									{/if}
									<form method="POST" action="?/deleteWord" use:enhance>
										<input type="hidden" name="id" value={word.id} />
										<Tooltip>
											<TooltipTrigger type="submit" class={buttonVariants({ variant: 'destructive', size: 'sm' })}>&times;</TooltipTrigger>
											<TooltipContent>Remove word</TooltipContent>
										</Tooltip>
									</form>
								</CardContent>
							</Card>
						{/each}
					{:else}
						<Card>
							<CardContent class="py-6 text-center">
								<p class="text-lg font-semibold">No words tracked yet</p>
								<p class="text-muted-foreground">Click words in the transcript to add them to your vocabulary.</p>
							</CardContent>
						</Card>
					{/if}
				</div>
			</div>
		</TabsContent>

		<TabsContent value="concepts" class="overflow-y-auto min-h-0">
			<div class="pt-4">
				<div class="flex flex-col gap-4">
					{#if data.episodeSummary}
						<Card>
							<CardContent class="py-4 px-4"><p>{data.episodeSummary}</p></CardContent>
						</Card>
					{/if}

					{#if data.concepts.length > 0}
						{#each data.concepts as concept, i}
							<Collapsible open={i === 0}>
								<CollapsibleTrigger class="flex items-center gap-2 w-full text-left">
									<span class="font-bold">{concept.name}</span>
									<Badge>{concept.role}</Badge>
									{#if concept.category}
										<Badge variant="outline">{concept.category}</Badge>
									{/if}
								</CollapsibleTrigger>
								<CollapsibleContent>
									<div class="flex flex-col gap-3 p-2">
										{#if concept.summary}
											<p>{concept.summary}</p>
										{/if}
										{#if concept.rule}
											<Card>
												<CardContent class="py-3 px-3">
													<p class="font-bold">{concept.rule}</p>
												</CardContent>
											</Card>
										{/if}
										{#if concept.examples.length > 0}
											<div class="grid grid-cols-1 md:grid-cols-2 gap-2">
												{#each concept.examples as ex}
													<p class="font-bold">{ex.spanish}</p>
													<p class="text-muted-foreground">{ex.english}</p>
												{/each}
											</div>
										{/if}
										{#if concept.notes}
											<p class="text-muted-foreground text-sm">{concept.notes}</p>
										{/if}
									</div>
								</CollapsibleContent>
							</Collapsible>
						{/each}
					{:else}
						<Card>
							<CardContent class="py-6 text-center">
								<p class="text-lg font-semibold">No concepts linked</p>
								<p class="text-muted-foreground">No grammar concepts have been extracted for this episode yet.</p>
							</CardContent>
						</Card>
					{/if}

					{#if data.vocabulary.length > 0}
						<h3 class="text-xl font-semibold">Vocabulary</h3>
						<div class="grid grid-cols-1 md:grid-cols-2 gap-2">
							{#each data.vocabulary as v}
								<Card>
									<CardContent class="py-3 px-3">
										<p class="font-bold">{v.spanish}</p>
										<p class="text-muted-foreground">{v.english}</p>
										{#if v.derivation}
											<p class="text-muted-foreground text-sm">{v.derivation}</p>
										{/if}
									</CardContent>
								</Card>
							{/each}
						</div>
					{/if}
				</div>
			</div>
		</TabsContent>
	</Tabs>
</div>
