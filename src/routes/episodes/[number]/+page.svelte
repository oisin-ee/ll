<script lang="ts">
	import { enhance } from '$app/forms';
	import { Tabs, TabsList, TabsTrigger, TabsContent } from '$lib/components/ui/tabs';
	import { Switch } from '$lib/components/ui/switch';
	import { Avatar, AvatarFallback } from '$lib/components/ui/avatar';
	import { Collapsible, CollapsibleTrigger, CollapsibleContent } from '$lib/components/ui/collapsible';
	import { Tooltip, TooltipTrigger, TooltipContent } from '$lib/components/ui/tooltip';
	import { Popover, PopoverContent } from '$lib/components/ui/popover';
	import { Button, buttonVariants } from '$lib/components/ui/button';
	import { Badge } from '$lib/components/ui/badge';
	import { Card, CardContent } from '$lib/components/ui/card';
	import AudioPlayer from '$lib/components/AudioPlayer.svelte';

	let { data, form } = $props();
	let activeTab = $state('transcript');
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

<div class="flex flex-col gap-4">
	<div class="flex items-center gap-3">
		<Button href="/episodes" variant="ghost" size="icon-sm">&larr;</Button>
		<div class="flex-1 min-w-0">
			<p class="text-xs text-muted-foreground">Episode {data.episode.number}</p>
			<h1 class="text-lg font-semibold leading-tight truncate">{data.episode.title}</h1>
		</div>
		<div class="flex items-center gap-2 shrink-0">
			{#if data.prevEpisode}
				<Button href="/episodes/{data.prevEpisode.number}" variant="outline" size="icon-sm" title={data.prevEpisode.title}>&larr;</Button>
			{/if}
			{#if data.nextEpisode}
				<Button href="/episodes/{data.nextEpisode.number}" variant="outline" size="icon-sm" title={data.nextEpisode.title}>&rarr;</Button>
			{/if}
			<form bind:this={formEl} method="POST" action="?/toggleListened" use:enhance>
				<input type="hidden" name="number" value={data.episode.number} />
				<input type="hidden" name="listened" value={String(!data.episode.listened)} />
				<Switch checked={data.episode.listened} onclick={() => formEl.requestSubmit()} />
				<noscript><button type="submit">Toggle</button></noscript>
			</form>
		</div>
	</div>

	<div>
		<AudioPlayer
			episodeNumber={data.episode.number}
			playbackPosition={data.episode.playbackPosition}
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

	<Tabs bind:value={activeTab}>
		<TabsList>
			<TabsTrigger value="transcript">Transcript</TabsTrigger>
			<TabsTrigger value="words">Words ({data.words.length})</TabsTrigger>
			<TabsTrigger value="concepts">Concepts ({data.concepts.length})</TabsTrigger>
		</TabsList>

		<TabsContent value="transcript">
			<div class="pt-4 relative" style="line-height: 1.8;">
				{#if data.transcript.length > 0}
					{#if data.episodeSummary}
						<Card class="mb-4">
							<CardContent class="py-4 px-4"><p>{data.episodeSummary}</p></CardContent>
						</Card>
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
											<Badge variant="secondary">{token.display}</Badge>
										{:else}
											<Button type="button" variant="link" class="h-auto p-0 text-base" onclick={(e: MouseEvent) => showPopup(e, token.clean)}>{token.display}</Button>
										{/if}
									{:else}
										{token.display}
									{/if}
								{/each}
							</span>
						</div>
					{/each}

					<Popover bind:open={popoverOpen} onOpenChange={(open) => { if (!open) hidePopup(); }}>
						<PopoverContent customAnchor={anchorEl} side="top">
							<p class="font-bold">Add "{pendingWord}"?</p>
							<form method="POST" action="?/addWord" use:enhance class="flex gap-2 mt-2">
								<input type="hidden" name="term" value={pendingWord} />
								<input type="hidden" name="episodeNumber" value={data.episode.number} />
								<Button type="submit" size="sm" onclick={hidePopup}>Add to LingQ</Button>
								<Button type="button" variant="outline" size="sm" onclick={hidePopup}>Cancel</Button>
							</form>
						</PopoverContent>
					</Popover>
				{:else}
					<div class="text-center p-8 text-muted-foreground">
						<p class="text-xl font-semibold">No transcript available</p>
						<p>This episode doesn't have a transcript yet.</p>
					</div>
				{/if}
			</div>
		</TabsContent>

		<TabsContent value="words">
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

		<TabsContent value="concepts">
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
