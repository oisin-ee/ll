<script lang="ts">
	import { Dialog, Portal } from '@skeletonlabs/skeleton-svelte';
	import { XIcon } from '@lucide/svelte';
	import type { Snippet } from 'svelte';

	let {
		open = $bindable(false),
		children
	}: {
		open: boolean;
		children: Snippet;
	} = $props();

	const animBackdrop =
		'transition transition-discrete opacity-0 starting:data-[state=open]:opacity-0 data-[state=open]:opacity-100';
	const animDrawer =
		'transition transition-discrete opacity-0 -translate-x-full starting:data-[state=open]:opacity-0 starting:data-[state=open]:-translate-x-full data-[state=open]:opacity-100 data-[state=open]:translate-x-0';
</script>

<Dialog {open} onOpenChange={(d) => { open = d.open }}>
	<Portal>
		<Dialog.Backdrop class="fixed inset-0 z-50 bg-surface-50-950/50 {animBackdrop}" />
		<Dialog.Positioner class="fixed inset-0 z-50 flex justify-start">
			<Dialog.Content class="h-screen w-sm {animDrawer}">
				<div class="flex justify-end p-2">
					<Dialog.CloseTrigger class="btn-icon preset-tonal">
						<XIcon size={20} />
					</Dialog.CloseTrigger>
				</div>
				{@render children()}
			</Dialog.Content>
		</Dialog.Positioner>
	</Portal>
</Dialog>
