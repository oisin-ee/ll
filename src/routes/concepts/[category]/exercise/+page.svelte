<script lang="ts">
	import { SegmentedControl, Progress } from '@skeletonlabs/skeleton-svelte';
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

	const sizeOptions = $derived(() => {
		const opts = [{ value: '10', label: '10' }, { value: '20', label: '20' }];
		if (data.pool.length > 20) {
			opts.push({ value: 'all', label: `All (${data.pool.length})` });
		}
		return opts;
	});
</script>

<div class="flex flex-col gap-4 max-w-2xl mx-auto">
	<!-- Header -->
	<div>
		<p class="opacity-50"><a href="/concepts" class="anchor">Concepts</a> / <a href="/concepts/{data.categorySlug}" class="anchor">{data.categoryName}</a> / Practice</p>
		<h1 class="h2">Practice: {data.categoryName}</h1>
	</div>

	{#if data.pool.length === 0}
		<div class="card preset-tonal p-6 text-center">
			<p class="h4">No examples available</p>
			<p class="opacity-50">This category has no example sentences to practice with.</p>
			<a href="/concepts/{data.categorySlug}" class="btn preset-tonal mt-4">Back to category</a>
		</div>

	{:else if phase === 'setup'}
		<div class="card p-6 flex flex-col gap-4">
			<p>{data.pool.length} examples available</p>

			<div>
				<p class="font-bold mb-2">Round size</p>
				<SegmentedControl
					name="round-size"
					value={roundSize}
					onValueChange={(details) => { roundSize = details.value ?? roundSize; }}
				>
					<SegmentedControl.Control>
						<SegmentedControl.Indicator />
						<SegmentedControl.Item value="10">
							<SegmentedControl.ItemText>10</SegmentedControl.ItemText>
							<SegmentedControl.ItemHiddenInput />
						</SegmentedControl.Item>
						<SegmentedControl.Item value="20">
							<SegmentedControl.ItemText>20</SegmentedControl.ItemText>
							<SegmentedControl.ItemHiddenInput />
						</SegmentedControl.Item>
						<SegmentedControl.Item value="all">
							<SegmentedControl.ItemText>All ({data.pool.length})</SegmentedControl.ItemText>
							<SegmentedControl.ItemHiddenInput />
						</SegmentedControl.Item>
					</SegmentedControl.Control>
				</SegmentedControl>
			</div>

			<button class="btn preset-filled-primary" onclick={() => start()}>Start</button>
		</div>

	{:else if phase === 'active' && currentExercise}
		<!-- Progress -->
		<div class="flex items-center gap-3">
			<span class="badge preset-tonal">{currentIndex + 1} / {total}</span>
			<div class="flex-1">
				<Progress value={progressPercent} max={100}>
					<Progress.Track>
						<Progress.Range />
					</Progress.Track>
				</Progress>
			</div>
			<span class="badge preset-tonal">{score.correct} correct</span>
		</div>

		<!-- Exercise card -->
		<div class="card p-6 flex flex-col gap-4">
			{#if currentExercise.type === 'translate'}
				<span class="badge preset-tonal w-fit">Translate to Spanish</span>
				<p class="h3">{currentExercise.english}</p>

				{#if !revealed}
					<button class="btn preset-filled-primary" onclick={() => { revealed = true; }}>Reveal answer</button>
				{:else}
					<div class="card preset-tonal-primary p-4">
						<p class="h3 font-bold">{currentExercise.spanish}</p>
					</div>

					{#if currentExercise.rule}
						<p class="opacity-50">{currentExercise.conceptName}: {currentExercise.rule}</p>
					{:else}
						<p class="opacity-50">{currentExercise.conceptName}</p>
					{/if}

					<div class="flex gap-2">
						<button class="btn preset-filled-primary flex-1" onclick={markCorrect}>Got it</button>
						<button class="btn preset-tonal flex-1" onclick={markIncorrect}>Missed it</button>
					</div>
				{/if}

			{:else}
				<span class="badge preset-tonal w-fit">Choose the translation</span>
				<p class="h3">{currentExercise.spanish}</p>

				<div class="flex flex-col gap-2">
					{#each currentExercise.options ?? [] as option}
						{@const isCorrect = option === currentExercise.english}
						{@const isSelected = option === selectedOption}
						<button
							class="btn text-left {answered
								? isCorrect
									? 'preset-filled-primary'
									: isSelected
										? 'preset-filled-error-500'
										: 'preset-tonal'
								: 'preset-tonal'}"
							onclick={() => selectOption(option)}
							disabled={answered}
						>{option}</button>
					{/each}
				</div>

				{#if answered}
					{#if currentExercise.rule}
						<p class="opacity-50">{currentExercise.conceptName}: {currentExercise.rule}</p>
					{:else}
						<p class="opacity-50">{currentExercise.conceptName}</p>
					{/if}

					<button class="btn preset-filled-primary" onclick={advance}>Next</button>
				{/if}
			{/if}
		</div>

	{:else if phase === 'summary'}
		<div class="card p-6 flex flex-col gap-4 text-center">
			<p class="h3">Round complete</p>

			<div class="flex justify-center gap-6">
				<div>
					<p class="h2">{score.correct}</p>
					<p class="opacity-50">Correct</p>
				</div>
				<div>
					<p class="h2">{score.incorrect}</p>
					<p class="opacity-50">Missed</p>
				</div>
				<div>
					<p class="h2">{total > 0 ? Math.round((score.correct / total) * 100) : 0}%</p>
					<p class="opacity-50">Score</p>
				</div>
			</div>

			<div class="flex flex-col gap-2">
				<button class="btn preset-filled-primary" onclick={retry}>Retry</button>
				{#if missed.length > 0}
					<button class="btn preset-tonal" onclick={practiceMissed}>Practice missed ({missed.length})</button>
				{/if}
				<a href="/concepts/{data.categorySlug}" class="btn preset-tonal">Back to category</a>
			</div>
		</div>
	{/if}
</div>
