<script lang="ts">
	import type { Snippet } from 'svelte';
	import { enhance } from '$app/forms';
	import { Popover, PopoverContent } from '$lib/components/ui/popover';
	import { Button } from '$lib/components/ui/button';

	interface Props {
		open: boolean;
		word: string;
		anchor: HTMLElement | null;
		action?: string;
		submitLabel?: string;
		extraFields?: Snippet;
	}

	let {
		open = $bindable(),
		word,
		anchor,
		action = '?/addWord',
		submitLabel = 'Save word',
		extraFields
	}: Props = $props();

	function close() {
		open = false;
	}
</script>

<Popover bind:open onOpenChange={(next) => { if (!next) close(); }}>
	<PopoverContent customAnchor={anchor} side="top">
		<p class="mb-2 font-bold">{word}</p>
		<form
			method="POST"
			{action}
			use:enhance={() => {
				return async ({ result, update }) => {
					if (result.type === 'success' || result.type === 'redirect') close();
					await update();
				};
			}}
			class="flex gap-2"
		>
			<input type="hidden" name="term" value={word} />
			{@render extraFields?.()}
			<Button type="submit" size="sm">{submitLabel}</Button>
			<Button type="button" size="sm" variant="outline" onclick={close}>Cancel</Button>
		</form>
	</PopoverContent>
</Popover>
