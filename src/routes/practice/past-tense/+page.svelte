<script lang="ts">
	import { ToggleGroup, ToggleGroupItem } from '$lib/components/ui/toggle-group';
	import { Progress } from '$lib/components/ui/progress';
	import { Switch } from '$lib/components/ui/switch';
	import { Badge } from '$lib/components/ui/badge';
	import { Card, CardContent } from '$lib/components/ui/card';
	import { Input } from '$lib/components/ui/input';
	import { Button } from '$lib/components/ui/button';
	import { generateExercises, checkAnswer, type PastTenseExercise, type TenseFilter } from '$lib/past-tense-exercises';
	import { goto } from '$app/navigation';

	let { data } = $props();

	let phase = $state<'setup' | 'active' | 'summary'>('setup');
	let roundSize = $state('20');
	let tenseFilter = $derived<TenseFilter>(data.tenseFilter);
	let showHints = $state(false);
	let exercises = $state<PastTenseExercise[]>([]);
	let currentIndex = $state(0);
	let score = $state({ correct: 0, incorrect: 0 });
	let missed = $state<PastTenseExercise[]>([]);
	let submitted = $state(false);
	let userInput = $state('');
	let lastResult = $state<{ correct: boolean; accentWarning: boolean } | null>(null);

	const currentExercise = $derived(exercises[currentIndex]);
	const total = $derived(exercises.length);
	const progressPercent = $derived(total > 0 ? Math.round((currentIndex / total) * 100) : 0);

	function applyTenseFilter(value: string) {
		goto(`/practice/past-tense?tense=${value}`, { replaceState: true, invalidateAll: true });
	}

	function start(pool?: PastTenseExercise[], count?: number) {
		const c = count ?? (roundSize === 'all' ? undefined : Number(roundSize));
		exercises = generateExercises(pool ?? data.pool, { count: c });
		currentIndex = 0;
		score = { correct: 0, incorrect: 0 };
		missed = [];
		submitted = false;
		userInput = '';
		lastResult = null;
		phase = 'active';
	}

	function submitAnswer() {
		if (submitted || !userInput.trim()) return;
		submitted = true;
		lastResult = checkAnswer(userInput, currentExercise.acceptedAnswers);
		if (lastResult.correct) {
			score.correct++;
		} else {
			score.incorrect++;
			missed.push(currentExercise);
		}
	}

	function advance() {
		if (currentIndex + 1 >= total) {
			phase = 'summary';
		} else {
			currentIndex++;
			submitted = false;
			userInput = '';
			lastResult = null;
		}
	}

	function handleKeydown(e: KeyboardEvent) {
		if (phase !== 'active' || e.key !== 'Enter') return;
		if (submitted) advance();
	}

	function retry() { start(); }
	function practiceMissed() { start(missed, missed.length); }
</script>

<svelte:window onkeydown={handleKeydown} />

<div class="flex flex-col gap-4 max-w-2xl mx-auto">
	<div>
		<p class="text-sm text-muted-foreground">
			<Button href="/practice" variant="link" class="h-auto p-0">Practice</Button> / Past Tense
		</p>
		<h1 class="font-display text-3xl font-semibold">Past Tense Practice</h1>
	</div>

	{#if phase === 'setup'}
		<Card>
			<CardContent class="pt-4 flex flex-col gap-4">
				<p class="text-muted-foreground">{data.pool.length} exercises available</p>

				<div>
					<p class="font-semibold mb-2">What to practice</p>
					<ToggleGroup type="single" value={tenseFilter} onValueChange={(v) => { if (v) applyTenseFilter(v); }} spacing={0} variant="outline">
						<ToggleGroupItem value="all">Mix everything</ToggleGroupItem>
						<ToggleGroupItem value="preterito">I did it</ToggleGroupItem>
						<ToggleGroupItem value="imperfecto">I used to</ToggleGroupItem>
						<ToggleGroupItem value="presentePerfecto">I have done</ToggleGroupItem>
					</ToggleGroup>
				</div>

				<div>
					<p class="font-semibold mb-2">Round size</p>
					<ToggleGroup type="single" value={roundSize} onValueChange={(v) => { if (v) roundSize = v; }} spacing={0} variant="outline">
						<ToggleGroupItem value="10">10</ToggleGroupItem>
						<ToggleGroupItem value="20">20</ToggleGroupItem>
						<ToggleGroupItem value="all">All ({data.pool.length})</ToggleGroupItem>
					</ToggleGroup>
				</div>

				<div class="flex items-center gap-3">
					<Switch bind:checked={showHints} />
					<span class="text-sm">Show verb hints</span>
				</div>

				<Button onclick={() => start()}>Start</Button>
			</CardContent>
		</Card>

	{:else if phase === 'active' && currentExercise}
		<div class="flex items-center gap-3">
			<Badge variant="outline">{currentIndex + 1} / {total}</Badge>
			<Progress value={progressPercent} max={100} class="flex-1" />
			<Badge variant="outline">{score.correct} correct</Badge>
		</div>

		<Card>
			<CardContent class="pt-4 flex flex-col gap-4">
				<div class="flex items-center gap-2 flex-wrap">
					<Badge variant="outline">Translate to Spanish</Badge>
					{#if showHints}
						<Badge>{currentExercise.verbInfinitive} — {currentExercise.verbEnglish}</Badge>
					{/if}
				</div>

				<p class="font-display text-2xl">{currentExercise.english}</p>

				{#if !submitted}
					<!-- svelte-ignore a11y_autofocus -->
					<form onsubmit={(e) => { e.preventDefault(); submitAnswer(); }}>
						<Input
							type="text"
							bind:value={userInput}
							placeholder="Type your Spanish translation..."
							autofocus
						/>
						<Button type="submit" class="mt-2 w-full" disabled={!userInput.trim()}>Check</Button>
					</form>
				{:else if lastResult}
					{#if lastResult.correct}
						<Card>
							<CardContent class="py-3">
								<p class="font-semibold text-secondary">Correct!</p>
								<p class="font-display text-xl">{currentExercise.displayAnswer}</p>
								{#if lastResult.accentWarning}
									<p class="text-sm text-muted-foreground mt-1">Watch the accents: <strong>{currentExercise.displayAnswer}</strong></p>
								{/if}
							</CardContent>
						</Card>
					{:else}
						<Card>
							<CardContent class="py-3">
								<p class="font-semibold text-destructive">Not quite</p>
								<p class="line-through text-muted-foreground">{userInput}</p>
							</CardContent>
						</Card>
						<Card>
							<CardContent class="py-3">
								<p class="font-semibold text-sm">Correct answer:</p>
								<p class="font-display text-xl">{currentExercise.displayAnswer}</p>
							</CardContent>
						</Card>
					{/if}
					<Button onclick={advance}>Next</Button>
				{/if}
			</CardContent>
		</Card>

	{:else if phase === 'summary'}
		<Card>
			<CardContent class="pt-4 flex flex-col gap-4 text-center">
				<p class="font-display text-2xl font-semibold">Round complete</p>
				<div class="flex justify-center gap-6">
					<div>
						<p class="font-display text-3xl font-semibold">{score.correct}</p>
						<p class="text-sm text-muted-foreground">Correct</p>
					</div>
					<div>
						<p class="font-display text-3xl font-semibold">{score.incorrect}</p>
						<p class="text-sm text-muted-foreground">Missed</p>
					</div>
					<div>
						<p class="font-display text-3xl font-semibold">{total > 0 ? Math.round((score.correct / total) * 100) : 0}%</p>
						<p class="text-sm text-muted-foreground">Score</p>
					</div>
				</div>
				<div class="flex flex-col gap-2">
					<Button onclick={retry}>Retry</Button>
					{#if missed.length > 0}
						<Button variant="outline" onclick={practiceMissed}>Practice missed ({missed.length})</Button>
					{/if}
					<Button href="/practice" variant="outline">Back to Practice</Button>
				</div>
			</CardContent>
		</Card>
	{/if}
</div>
