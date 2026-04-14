<script lang="ts">
	import { ToggleGroup, ToggleGroupItem } from '$lib/components/ui/toggle-group';
	import { Progress } from '$lib/components/ui/progress';
	import { Badge } from '$lib/components/ui/badge';
	import { Card, CardContent } from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import { generateExercises, type ExerciseItem } from '$lib/exercises';

	let { data } = $props();

	let phase = $state<'setup' | 'active' | 'summary'>('setup');
	let roundSize = $state('20');
	let exercises = $state<ExerciseItem[]>([]);
	let currentIndex = $state(0);
	let score = $state({ correct: 0, incorrect: 0 });
	let missed = $state<ExerciseItem[]>([]);
	let revealed = $state(false);
	let selectedOption = $state<string | null>(null);
	let answered = $state(false);

	const currentExercise = $derived(exercises[currentIndex]);
	const total = $derived(exercises.length);
	const progressPercent = $derived(total > 0 ? Math.round(((currentIndex) / total) * 100) : 0);

	function start(count?: number) {
		const c = count ?? (roundSize === 'all' ? undefined : Number(roundSize));
		exercises = generateExercises(data.pool, { count: c });
		currentIndex = 0;
		score = { correct: 0, incorrect: 0 };
		missed = [];
		revealed = false;
		selectedOption = null;
		answered = false;
		phase = 'active';
	}

	function markCorrect() {
		score.correct++;
		advance();
	}

	function markIncorrect() {
		score.incorrect++;
		missed.push(currentExercise);
		advance();
	}

	function selectOption(option: string) {
		if (answered) return;
		selectedOption = option;
		answered = true;
		if (option === currentExercise.english) {
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
			revealed = false;
			selectedOption = null;
			answered = false;
		}
	}

	function retry() {
		start();
	}

	function practiceMissed() {
		exercises = generateExercises(missed, { count: missed.length });
		currentIndex = 0;
		score = { correct: 0, incorrect: 0 };
		missed = [];
		revealed = false;
		selectedOption = null;
		answered = false;
		phase = 'active';
	}
</script>

<div class="flex flex-col gap-4 max-w-2xl mx-auto">
	<div>
		<p class="text-sm text-muted-foreground">
			<Button href="/concepts" variant="link" class="h-auto p-0">Concepts</Button> /
			<Button href="/concepts/{data.categorySlug}" variant="link" class="h-auto p-0">{data.categoryName}</Button> / Practice
		</p>
		<h1 class="font-display text-3xl font-semibold">Practice: {data.categoryName}</h1>
	</div>

	{#if data.pool.length === 0}
		<Card>
			<CardContent class="text-center py-6 flex flex-col gap-4">
				<p class="font-display text-lg font-semibold">No examples available</p>
				<p class="text-muted-foreground text-sm">This category has no example sentences to practice with.</p>
				<Button href="/concepts/{data.categorySlug}" variant="outline" class="w-fit mx-auto">Back to category</Button>
			</CardContent>
		</Card>

	{:else if phase === 'setup'}
		<Card>
			<CardContent class="pt-4 flex flex-col gap-4">
				<p class="text-muted-foreground">{data.pool.length} examples available</p>
				<div>
					<p class="font-semibold mb-2">Round size</p>
					<ToggleGroup type="single" value={roundSize} onValueChange={(v) => { if (v) roundSize = v; }} spacing={0} variant="outline">
						<ToggleGroupItem value="10">10</ToggleGroupItem>
						<ToggleGroupItem value="20">20</ToggleGroupItem>
						<ToggleGroupItem value="all">All ({data.pool.length})</ToggleGroupItem>
					</ToggleGroup>
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
				{#if currentExercise.type === 'translate'}
					<Badge variant="outline" class="w-fit">Translate to Spanish</Badge>
					<p class="font-display text-2xl">{currentExercise.english}</p>

					{#if !revealed}
						<Button onclick={() => { revealed = true; }}>Reveal answer</Button>
					{:else}
						<Card>
							<CardContent class="py-3">
								<p class="font-display text-2xl font-bold">{currentExercise.spanish}</p>
							</CardContent>
						</Card>
						{#if currentExercise.rule}
							<p class="text-sm text-muted-foreground">{currentExercise.conceptName}: {currentExercise.rule}</p>
						{:else}
							<p class="text-sm text-muted-foreground">{currentExercise.conceptName}</p>
						{/if}
						<div class="flex gap-2">
							<Button class="flex-1" onclick={markCorrect}>Got it</Button>
							<Button class="flex-1" variant="outline" onclick={markIncorrect}>Missed it</Button>
						</div>
					{/if}

				{:else}
					<Badge variant="outline" class="w-fit">Choose the translation</Badge>
					<p class="font-display text-2xl">{currentExercise.spanish}</p>

					<div class="flex flex-col gap-2">
						{#each currentExercise.options ?? [] as option}
							{@const isCorrect = option === currentExercise.english}
							{@const isSelected = option === selectedOption}
							<Button
								class="text-left justify-start"
								variant={answered ? (isCorrect ? 'default' : isSelected ? 'destructive' : 'outline') : 'outline'}
								onclick={() => selectOption(option)}
								disabled={answered}
							>{option}</Button>
						{/each}
					</div>

					{#if answered}
						{#if currentExercise.rule}
							<p class="text-sm text-muted-foreground">{currentExercise.conceptName}: {currentExercise.rule}</p>
						{:else}
							<p class="text-sm text-muted-foreground">{currentExercise.conceptName}</p>
						{/if}
						<Button onclick={advance}>Next</Button>
					{/if}
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
					<Button href="/concepts/{data.categorySlug}" variant="outline">Back to category</Button>
				</div>
			</CardContent>
		</Card>
	{/if}
</div>
