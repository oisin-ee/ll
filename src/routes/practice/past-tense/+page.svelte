<script lang="ts">
	import { SegmentedControl, Progress, Switch } from '@skeletonlabs/skeleton-svelte';
	import { generateExercises, checkAnswer, getTenseLabel, type PastTenseExercise, type TenseFilter } from '$lib/past-tense-exercises';
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
		if (submitted) {
			advance();
		}
	}

	function retry() {
		start();
	}

	function practiceMissed() {
		start(missed, missed.length);
	}
</script>

<svelte:window onkeydown={handleKeydown} />

<div class="flex flex-col gap-4 max-w-2xl mx-auto">
	<div>
		<p class="opacity-50"><a href="/practice" class="anchor">Practice</a> / Past Tense</p>
		<h1 class="h2">Past Tense Practice</h1>
	</div>

	{#if phase === 'setup'}
		<div class="card p-6 flex flex-col gap-4">
			<p>{data.pool.length} exercises available</p>

			<div>
				<p class="font-bold mb-2">What to practice</p>
				<SegmentedControl
					name="tense-filter"
					value={tenseFilter}
					onValueChange={(details) => { if (details.value) applyTenseFilter(details.value); }}
				>
					<SegmentedControl.Control>
						<SegmentedControl.Indicator />
						<SegmentedControl.Item value="all">
							<SegmentedControl.ItemText>Mix everything</SegmentedControl.ItemText>
							<SegmentedControl.ItemHiddenInput />
						</SegmentedControl.Item>
						<SegmentedControl.Item value="preterito">
							<SegmentedControl.ItemText>I did it</SegmentedControl.ItemText>
							<SegmentedControl.ItemHiddenInput />
						</SegmentedControl.Item>
						<SegmentedControl.Item value="imperfecto">
							<SegmentedControl.ItemText>I used to</SegmentedControl.ItemText>
							<SegmentedControl.ItemHiddenInput />
						</SegmentedControl.Item>
						<SegmentedControl.Item value="presentePerfecto">
							<SegmentedControl.ItemText>I have done</SegmentedControl.ItemText>
							<SegmentedControl.ItemHiddenInput />
						</SegmentedControl.Item>
					</SegmentedControl.Control>
				</SegmentedControl>
			</div>

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

			<div class="flex items-center gap-3">
				<Switch name="show-hints" checked={showHints} onCheckedChange={(e) => { showHints = e.checked; }} />
				<span>Show verb hints</span>
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
			<div class="flex items-center gap-2 flex-wrap">
				<span class="badge preset-tonal w-fit">Translate to Spanish</span>
				{#if showHints}
					<span class="badge preset-tonal-primary w-fit">{currentExercise.verbInfinitive} — {currentExercise.verbEnglish}</span>
				{/if}
			</div>

			<p class="h3">{currentExercise.english}</p>

			{#if !submitted}
				<!-- svelte-ignore a11y_autofocus -->
				<form onsubmit={(e) => { e.preventDefault(); submitAnswer(); }}>
					<input
						type="text"
						bind:value={userInput}
						class="input"
						placeholder="Type your Spanish translation..."
						autofocus
					/>
					<button
						type="submit"
						class="btn preset-filled-primary mt-2 w-full"
						disabled={!userInput.trim()}
					>Check</button>
				</form>
			{:else if lastResult}
				{#if lastResult.correct}
					<div class="card preset-tonal-primary p-4">
						<p class="font-bold text-green-500">Correct!</p>
						<p class="h4">{currentExercise.displayAnswer}</p>
						{#if lastResult.accentWarning}
							<p class="opacity-75 mt-1">Watch the accents: <strong>{currentExercise.displayAnswer}</strong></p>
						{/if}
					</div>
				{:else}
					<div class="card preset-tonal p-4 border-l-4 border-red-500">
						<p class="font-bold text-red-500">Not quite</p>
						<p class="line-through opacity-50">{userInput}</p>
					</div>
					<div class="card preset-tonal-primary p-4">
						<p class="font-bold">Correct answer:</p>
						<p class="h4">{currentExercise.displayAnswer}</p>
					</div>
				{/if}

				<button class="btn preset-filled-primary" onclick={advance}>Next</button>
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
				<a href="/practice" class="btn preset-tonal">Back to Practice</a>
			</div>
		</div>
	{/if}
</div>
