<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '$lib/components/ui/card';
</script>

<div class="flex flex-col gap-4 max-w-2xl mx-auto">
	<h1 class="text-3xl font-bold">Practice</h1>

	<Card>
		<CardHeader>
			<CardTitle>Vocabulary Flashcards</CardTitle>
			<CardDescription>Spaced repetition flashcards for vocabulary from episodes you've listened to. New words are added as you progress.</CardDescription>
		</CardHeader>
		<CardContent>
			<Button href="/practice/flashcards">Start</Button>
		</CardContent>
	</Card>

	<Card>
		<CardHeader>
			<CardTitle>Past Tense</CardTitle>
			<CardDescription>Practice translating English sentences to Spanish in the past tense. Covers 600+ verbs including all irregular forms.</CardDescription>
		</CardHeader>
		<CardContent>
			<Button href="/practice/past-tense">Start</Button>
		</CardContent>
	</Card>
</div>
