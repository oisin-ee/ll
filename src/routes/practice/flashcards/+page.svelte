<script lang="ts">
	import { Progress } from '@skeletonlabs/skeleton-svelte';

	let { data } = $props();

	let phase = $state<'setup' | 'active' | 'done'>('setup');
	let currentIndex = $state(0);
	let revealed = $state(false);
	let reviewed = $state(0);

	const cards = $derived(data.cards);
	const currentCard = $derived(cards[currentIndex]);
	const progressPercent = $derived(cards.length > 0 ? Math.round((currentIndex / cards.length) * 100) : 0);

	function start() {
		if (cards.length === 0) return;
		currentIndex = 0;
		reviewed = 0;
		revealed = false;
		phase = 'active';
	}

	async function rate(rating: 'Again' | 'Hard' | 'Good' | 'Easy') {
		await fetch('/api/flashcards/review', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				episodeId: currentCard.episodeId,
				spanish: currentCard.spanish,
				rating
			})
		});

		reviewed++;

		if (currentIndex + 1 >= cards.length) {
			phase = 'done';
		} else {
			currentIndex++;
			revealed = false;
		}
	}

	function handleKeydown(e: KeyboardEvent) {
		if (phase !== 'active') return;

		if (!revealed && (e.key === ' ' || e.key === 'Enter')) {
			e.preventDefault();
			revealed = true;
			return;
		}

		if (revealed) {
			if (e.key === '1') rate('Again');
			else if (e.key === '2') rate('Hard');
			else if (e.key === '3') rate('Good');
			else if (e.key === '4') rate('Easy');
		}
	}
</script>

<svelte:window onkeydown={handleKeydown} />

<div class="flex flex-col gap-4 max-w-2xl mx-auto">
	<div>
		<p class="opacity-50"><a href="/practice" class="anchor">Practice</a> / Flashcards</p>
		<h1 class="h2">Vocabulary Flashcards</h1>
	</div>

	{#if phase === 'setup'}
		<div class="card p-6 flex flex-col gap-4">
			{#if data.stats.total === 0}
				<p>No vocabulary available yet. Listen to some episodes first!</p>
				<a href="/episodes" class="btn preset-filled-primary">Go to Episodes</a>
			{:else}
				<div class="flex gap-6">
					<div>
						<p class="h2">{data.stats.due}</p>
						<p class="opacity-50">Due</p>
					</div>
					<div>
						<p class="h2">{data.stats.newCards}</p>
						<p class="opacity-50">New</p>
					</div>
					<div>
						<p class="h2">{data.stats.total}</p>
						<p class="opacity-50">Total</p>
					</div>
				</div>

				{#if data.stats.due === 0}
					<p>All caught up! Come back later for more reviews.</p>
					<a href="/practice" class="btn preset-tonal">Back to Practice</a>
				{:else}
					<button class="btn preset-filled-primary" onclick={start}>
						Start ({data.stats.due} cards)
					</button>
				{/if}
			{/if}
		</div>

	{:else if phase === 'active' && currentCard}
		<div class="flex items-center gap-3">
			<span class="badge preset-tonal">{currentIndex + 1} / {cards.length}</span>
			<div class="flex-1">
				<Progress value={progressPercent} max={100}>
					<Progress.Track>
						<Progress.Range />
					</Progress.Track>
				</Progress>
			</div>
			<span class="badge preset-tonal">{reviewed} reviewed</span>
		</div>

		<div class="card p-6 flex flex-col gap-4">
			<div class="flex items-center gap-2">
				<span class="badge preset-tonal">Ep. {currentCard.episodeNumber}</span>
				{#if currentCard.isNew}
					<span class="badge preset-tonal-primary">New</span>
				{/if}
			</div>

			<p class="h3 text-center py-4">{currentCard.english}</p>

			{#if !revealed}
				<button class="btn preset-filled-primary" onclick={() => revealed = true}>
					Show Answer <span class="opacity-50 ml-2">Space</span>
				</button>
			{:else}
				<div class="card preset-tonal-primary p-4 text-center">
					<p class="h3">{currentCard.spanish}</p>
					{#if currentCard.derivation}
						<p class="opacity-75 mt-1">{currentCard.derivation}</p>
					{/if}
				</div>

				<div class="grid grid-cols-4 gap-2">
					<button class="btn preset-tonal border-l-4 border-red-500" onclick={() => rate('Again')}>
						<span class="flex flex-col items-center">
							<span>Again</span>
							<span class="opacity-50 text-xs">1</span>
						</span>
					</button>
					<button class="btn preset-tonal border-l-4 border-orange-500" onclick={() => rate('Hard')}>
						<span class="flex flex-col items-center">
							<span>Hard</span>
							<span class="opacity-50 text-xs">2</span>
						</span>
					</button>
					<button class="btn preset-tonal border-l-4 border-green-500" onclick={() => rate('Good')}>
						<span class="flex flex-col items-center">
							<span>Good</span>
							<span class="opacity-50 text-xs">3</span>
						</span>
					</button>
					<button class="btn preset-tonal border-l-4 border-blue-500" onclick={() => rate('Easy')}>
						<span class="flex flex-col items-center">
							<span>Easy</span>
							<span class="opacity-50 text-xs">4</span>
						</span>
					</button>
				</div>
			{/if}
		</div>

	{:else if phase === 'done'}
		<div class="card p-6 flex flex-col gap-4 text-center">
			<p class="h3">Session complete</p>
			<p class="h2">{reviewed} cards reviewed</p>
			<div class="flex flex-col gap-2">
				<a href="/practice/flashcards" class="btn preset-filled-primary">Back to Flashcards</a>
				<a href="/practice" class="btn preset-tonal">Back to Practice</a>
			</div>
		</div>
	{/if}
</div>
