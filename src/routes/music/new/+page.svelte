<script lang="ts">
	import { enhance } from '$app/forms';

	let { form } = $props();
</script>

<svelte:head>
	<title>Add Song — Language Learner</title>
</svelte:head>

<div class="max-w-xl">
	<div class="flex items-center gap-3 mb-6">
		<a href="/music" class="btn btn-sm preset-tonal">&larr;</a>
		<h1 class="h2">Add Song</h1>
	</div>

	{#if form?.error}
		<aside class="card preset-tonal-error p-3 mb-4">{form.error}</aside>
	{/if}

	<form method="POST" use:enhance class="flex flex-col gap-4">
		<label class="flex flex-col gap-1">
			<span class="label">Title</span>
			<input
				name="title"
				type="text"
				class="input"
				placeholder="e.g. La Bicicleta"
				value={form?.title ?? ''}
				required
			/>
		</label>

		<label class="flex flex-col gap-1">
			<span class="label">Artist</span>
			<input
				name="artist"
				type="text"
				class="input"
				placeholder="e.g. Carlos Vives"
				value={form?.artist ?? ''}
				required
			/>
		</label>

		<label class="flex flex-col gap-1">
			<span class="label">YouTube URL or ID</span>
			<input
				name="youtubeUrl"
				type="text"
				class="input"
				placeholder="e.g. https://www.youtube.com/watch?v=dQw4w9WgXcQ"
				value={form?.youtubeInput ?? ''}
				required
			/>
		</label>

		<label class="flex flex-col gap-1">
			<span class="label">LRC Lyrics (optional)</span>
			<p class="text-sm opacity-60">Paste timestamped lyrics in LRC format. Tools like lrc-editor.com can help generate this.</p>
			<textarea
				name="lrcText"
				class="textarea font-mono text-sm"
				rows="10"
				placeholder="[00:12.34]First line of lyrics
[00:15.67]Second line"
			>{form?.lrcText ?? ''}</textarea>
		</label>

		<label class="flex flex-col gap-1">
			<span class="label">Teacher notes (optional)</span>
			<textarea
				name="teacherNotes"
				class="textarea"
				rows="3"
				placeholder="Anything your teacher said about this song"
			>{form?.teacherNotes ?? ''}</textarea>
		</label>

		<button type="submit" class="btn preset-filled-primary-500">Save Song</button>
	</form>
</div>
