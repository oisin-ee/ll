<script lang="ts">
	import { MenuIcon } from '@lucide/svelte';
	import { Button } from '$lib/components/ui/button';

	let {
		onMenuClick
	}: {
		onMenuClick: () => void;
	} = $props();
</script>

<header class="flex items-center gap-3 px-4 py-3 border-b border-border bg-background">
	<Button variant="ghost" size="icon" onclick={onMenuClick} aria-label="Open menu">
		<MenuIcon />
	</Button>
	<Button href="/" variant="link" class="font-display text-xl font-semibold p-0 h-auto">LL</Button>
</header>
