<script lang="ts">
	import { Progress } from '$lib/components/ui/progress';
	import { Badge } from '$lib/components/ui/badge';
	import { Card, CardContent } from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';

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
	{#if phase === 'setup'}
		<Card>
			<CardContent class="pt-4 flex flex-col gap-4">
				{#if data.stats.total === 0}
					<p class="text-muted-foreground">No vocabulary available yet. Listen to some episodes first!</p>
					<Button href="/episodes">Go to Episodes</Button>
				{:else}
					<div class="flex gap-6">
						<div>
							<p class="font-display text-3xl font-semibold">{data.stats.due}</p>
							<p class="text-sm text-muted-foreground">Due</p>
						</div>
						<div>
							<p class="font-display text-3xl font-semibold">{data.stats.newCards}</p>
							<p class="text-sm text-muted-foreground">New</p>
						</div>
						<div>
							<p class="font-display text-3xl font-semibold">{data.stats.total}</p>
							<p class="text-sm text-muted-foreground">Total</p>
						</div>
					</div>

					{#if data.stats.due === 0}
						<p class="text-muted-foreground">All caught up! Come back later for more reviews.</p>
						<Button href="/practice" variant="outline">Back to Practice</Button>
					{:else}
						<Button onclick={start}>Start ({data.stats.due} cards)</Button>
					{/if}
				{/if}
			</CardContent>
		</Card>

	{:else if phase === 'active' && currentCard}
		<div class="flex items-center gap-3">
			<Badge variant="outline">{currentIndex + 1} / {cards.length}</Badge>
			<Progress value={progressPercent} max={100} class="flex-1" />
			<Badge variant="outline">{reviewed} reviewed</Badge>
		</div>

		<Card>
			<CardContent class="pt-4 flex flex-col gap-4">
				<div class="flex items-center gap-2">
					<Badge variant="outline">Ep. {currentCard.episodeNumber}</Badge>
					{#if currentCard.isNew}
						<Badge>New</Badge>
					{/if}
				</div>

				<p class="font-display text-3xl text-center py-4">{currentCard.english}</p>

				{#if !revealed}
					<Button onclick={() => { revealed = true; }}>
						Show Answer <span class="text-primary-foreground/60 ml-2">Space</span>
					</Button>
				{:else}
					<Card>
						<CardContent class="py-3 text-center">
							<p class="font-display text-2xl">{currentCard.spanish}</p>
							{#if currentCard.derivation}
								<p class="text-sm text-muted-foreground mt-1">{currentCard.derivation}</p>
							{/if}
						</CardContent>
					</Card>

					<div class="grid grid-cols-4 gap-2">
						<Button variant="destructive" onclick={() => rate('Again')}>
							<span class="flex flex-col items-center">
								<span>Again</span>
								<span class="text-xs opacity-60">1</span>
							</span>
						</Button>
						<Button variant="outline" onclick={() => rate('Hard')}>
							<span class="flex flex-col items-center">
								<span>Hard</span>
								<span class="text-xs opacity-60">2</span>
							</span>
						</Button>
						<Button variant="secondary" onclick={() => rate('Good')}>
							<span class="flex flex-col items-center">
								<span>Good</span>
								<span class="text-xs opacity-60">3</span>
							</span>
						</Button>
						<Button onclick={() => rate('Easy')}>
							<span class="flex flex-col items-center">
								<span>Easy</span>
								<span class="text-xs opacity-60">4</span>
							</span>
						</Button>
					</div>
				{/if}
			</CardContent>
		</Card>

	{:else if phase === 'done'}
		<Card>
			<CardContent class="pt-4 flex flex-col gap-4 text-center">
				<p class="font-display text-2xl font-semibold">Session complete</p>
				<p class="font-display text-3xl font-semibold">{reviewed} cards reviewed</p>
				<div class="flex flex-col gap-2">
					<Button href="/practice/flashcards">Back to Flashcards</Button>
					<Button href="/practice" variant="outline">Back to Practice</Button>
				</div>
			</CardContent>
		</Card>
	{/if}
</div>
