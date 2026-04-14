<script lang="ts">
	import '../app.css';
	import { page } from '$app/stores';
	import { enhance } from '$app/forms';
	import { afterNavigate } from '$app/navigation';
	import { LogOutIcon } from '@lucide/svelte';
	import MobileAppBar from '$lib/components/MobileAppBar.svelte';
	import NavDrawer from '$lib/components/NavDrawer.svelte';
	import { Button } from '$lib/components/ui/button';
	import { Avatar, AvatarImage, AvatarFallback } from '$lib/components/ui/avatar';

	let { data, children } = $props();
	let drawerOpen = $state(false);

	afterNavigate(() => {
		drawerOpen = false;
	});

	function isActive(path: string, exact = false): boolean {
		return exact ? $page.url.pathname === path : $page.url.pathname.startsWith(path);
	}
</script>

{#snippet navContent()}
	<nav class="flex flex-col h-full">
		<div class="p-6 pb-4 border-b border-border">
			<Button href="/" variant="link" class="font-display text-2xl font-semibold p-0 h-auto block">LL</Button>
			<p class="text-sm text-muted-foreground mt-0.5">Language Transfer</p>
		</div>

		<div class="flex-1 overflow-y-auto py-4 px-3 flex flex-col gap-6">
			<div>
				<p class="text-xs font-semibold uppercase tracking-widest text-muted-foreground px-3 mb-2">Learn</p>
				<div class="flex flex-col gap-0.5">
					<Button href="/" variant="ghost" class="w-full justify-start {isActive('/', true) ? 'bg-accent text-accent-foreground font-medium' : ''}">Dashboard</Button>
					<Button href="/episodes" variant="ghost" class="w-full justify-start {isActive('/episodes') ? 'bg-accent text-accent-foreground font-medium' : ''}">Episodes</Button>
				</div>
			</div>

			<div>
				<p class="text-xs font-semibold uppercase tracking-widest text-muted-foreground px-3 mb-2">Review</p>
				<div class="flex flex-col gap-0.5">
					<Button href="/vocabulary" variant="ghost" class="w-full justify-start {isActive('/vocabulary', true) ? 'bg-accent text-accent-foreground font-medium' : ''}">Vocabulary</Button>
					<Button href="/concepts" variant="ghost" class="w-full justify-start {isActive('/concepts', true) ? 'bg-accent text-accent-foreground font-medium' : ''}">Concepts</Button>
				</div>
			</div>

			<div>
				<p class="text-xs font-semibold uppercase tracking-widest text-muted-foreground px-3 mb-2">Practice</p>
				<div class="flex flex-col gap-0.5">
					<Button href="/practice/past-tense" variant="ghost" class="w-full justify-start {isActive('/practice') ? 'bg-accent text-accent-foreground font-medium' : ''}">Past Tense</Button>
				</div>
			</div>

			<div>
				<p class="text-xs font-semibold uppercase tracking-widest text-muted-foreground px-3 mb-2">Music</p>
				<div class="flex flex-col gap-0.5">
					<Button href="/music" variant="ghost" class="w-full justify-start {isActive('/music') ? 'bg-accent text-accent-foreground font-medium' : ''}">Songs</Button>
				</div>
			</div>
		</div>

		<div class="p-4 border-t border-border flex flex-col gap-3">
			<form method="POST" action="/?/sync" use:enhance>
				<Button type="submit" variant="outline" class="w-full">Sync LingQ</Button>
			</form>
			{#if data.user}
				<div class="flex items-center gap-3">
					<Avatar size="sm">
						{#if data.user.avatar}
							<AvatarImage src={data.user.avatar} alt={data.user.name ?? 'User'} referrerpolicy="no-referrer" />
						{/if}
						<AvatarFallback>{(data.user.name ?? data.user.email)[0].toUpperCase()}</AvatarFallback>
					</Avatar>
					<span class="text-sm flex-1 truncate text-muted-foreground">{data.user.name ?? data.user.email}</span>
					<form method="POST" action="/auth/logout">
						<Button type="submit" variant="ghost" size="icon-sm" title="Sign out">
							<LogOutIcon />
						</Button>
					</form>
				</div>
			{/if}
		</div>
	</nav>
{/snippet}

<svelte:head>
	<title>Language Learner</title>
</svelte:head>

<div class="flex flex-col md:flex-row h-screen bg-background">
	<div class="md:hidden">
		<MobileAppBar onMenuClick={() => { drawerOpen = true; }} />
	</div>

	<NavDrawer bind:open={drawerOpen}>
		{@render navContent()}
	</NavDrawer>

	<aside class="hidden md:flex flex-col w-56 border-r border-border shrink-0 bg-background">
		{@render navContent()}
	</aside>

	<main class="flex-1 min-h-0 overflow-hidden flex flex-col p-3 md:p-6">
		<div class="mx-auto max-w-5xl w-full flex-1 min-h-0 overflow-auto">
			{@render children()}
		</div>
	</main>
</div>
