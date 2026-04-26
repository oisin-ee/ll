<script lang="ts">
	import { enhance } from '$app/forms';
	import { Button } from '$lib/components/ui/button';
	import { Textarea } from '$lib/components/ui/textarea';
	import { Label } from '$lib/components/ui/label';
	import { Alert, AlertDescription } from '$lib/components/ui/alert';
	import YoutubeSearchPicker from './YoutubeSearchPicker.svelte';

	interface FormState {
		error?: string;
		youtubeInput?: string;
		teacherNotes?: string;
		selectedYoutubeId?: string;
		candidates?: Array<{
			youtubeId: string;
			title: string;
			channel: string;
			durationSeconds: number | null;
			hasCaptions: boolean;
			hasSyncedLyrics: boolean;
		}>;
	}

	let {
		title,
		backHref,
		submitLabel,
		notesPlaceholder,
		form
	}: {
		title: string;
		backHref: string;
		submitLabel: string;
		notesPlaceholder: string;
		form?: FormState | null;
	} = $props();

	let saving = $state(false);
</script>

<div class="flex flex-col gap-6">
	<div class="flex items-center gap-3">
		<Button href={backHref} variant="outline" size="sm">&larr;</Button>
		<span class="font-medium">{title}</span>
	</div>

	{#if form?.error}
		<Alert variant="destructive">
			<AlertDescription>{form.error}</AlertDescription>
		</Alert>
	{/if}

	<form
		method="POST"
		use:enhance={() => {
			saving = true;
			return async ({ update }) => {
				await update();
				saving = false;
			};
		}}
		class="flex flex-col gap-6"
	>
		<div class="flex flex-col gap-2">
			<p class="text-sm text-muted-foreground">Paste a YouTube URL or ID, or search by title.</p>
			<YoutubeSearchPicker
				initialQuery={form?.youtubeInput}
				initialSelectedId={form?.selectedYoutubeId}
				initialCandidates={form?.candidates}
			/>
		</div>

		<div class="flex flex-col gap-2">
			<Label for="teacherNotes">
				Teacher notes <span class="text-muted-foreground">(optional)</span>
			</Label>
			<Textarea
				id="teacherNotes"
				name="teacherNotes"
				rows={3}
				placeholder={notesPlaceholder}
				value={form?.teacherNotes ?? ''}
			/>
		</div>

		<div class="flex justify-end">
			<Button type="submit" disabled={saving}>
				{saving ? 'Saving…' : submitLabel}
			</Button>
		</div>
	</form>
</div>
