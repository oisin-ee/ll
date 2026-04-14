<script lang="ts">
	import { Sheet, SheetContent } from '$lib/components/ui/sheet';
	import type { Snippet } from 'svelte';

	let {
		open = $bindable(false),
		children
	}: {
		open: boolean;
		children: Snippet;
	} = $props();
</script>

<Sheet bind:open>
	<SheetContent side="left" class="p-0 w-64">
		{@render children()}
	</SheetContent>
</Sheet>
