<script lang="ts">
	import { enhance } from '$app/forms';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Textarea } from '$lib/components/ui/textarea';
	import { Label } from '$lib/components/ui/label';
	import { Card, CardContent } from '$lib/components/ui/card';

	let { form } = $props();
</script>

<svelte:head>
	<title>Add Song — Language Learner</title>
</svelte:head>

<div class="max-w-xl">
	<div class="flex items-center gap-3 mb-6">
		<Button href="/music" variant="outline" size="sm">&larr;</Button>
		<h1 class="text-3xl font-bold">Add Song</h1>
	</div>

	{#if form?.error}
		<Card class="mb-4">
			<CardContent class="py-3 px-4 text-destructive">{form.error}</CardContent>
		</Card>
	{/if}

	<form method="POST" use:enhance class="flex flex-col gap-4">
		<div class="flex flex-col gap-1.5">
			<Label for="youtubeUrl">YouTube URL or ID</Label>
			<Input
				id="youtubeUrl"
				name="youtubeUrl"
				type="text"
				placeholder="e.g. https://www.youtube.com/watch?v=dQw4w9WgXcQ"
				value={form?.youtubeInput ?? ''}
				required
			/>
		</div>

		<div class="flex flex-col gap-1.5">
			<Label for="teacherNotes">Teacher notes (optional)</Label>
			<Textarea
				id="teacherNotes"
				name="teacherNotes"
				rows={3}
				placeholder="Anything your teacher said about this song"
			/>
		</div>

		<Button type="submit">Save Song</Button>
	</form>
</div>
