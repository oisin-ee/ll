<script lang="ts">
	import { AppBar } from '@skeletonlabs/skeleton-svelte';
	import { MenuIcon } from '@lucide/svelte';

	let {
		onMenuClick
	}: {
		onMenuClick: () => void;
	} = $props();
</script>

<AppBar>
	<AppBar.Toolbar>
		<AppBar.Lead>
			<button class="btn-icon preset-tonal" onclick={onMenuClick}>
				<MenuIcon size={20} />
			</button>
		</AppBar.Lead>
		<AppBar.Headline>
			<a href="/" class="h3 anchor">LL</a>
		</AppBar.Headline>
	</AppBar.Toolbar>
</AppBar>
