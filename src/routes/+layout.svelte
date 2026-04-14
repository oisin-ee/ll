<script lang="ts">
	import '../app.css';
	import { page } from '$app/stores';
	import { enhance } from '$app/forms';
	import { Home, Headphones, BookOpen, Zap, Music, Video, Brain, LogOut } from '@lucide/svelte';
	import { Button } from '$lib/components/ui/button';
	import { Avatar, AvatarImage, AvatarFallback } from '$lib/components/ui/avatar';

	let { data, children } = $props();

	function isActive(path: string, exact = false): boolean {
		return exact ? $page.url.pathname === path : $page.url.pathname.startsWith(path);
	}

	const navItems = [
		{ href: '/', label: 'Home', icon: Home, exact: true },
		{ href: '/episodes', label: 'Episodes', icon: Headphones, exact: false },
		{ href: '/vocabulary', label: 'Vocab', icon: BookOpen, exact: false },
		{ href: '/practice', label: 'Practice', icon: Zap, exact: false },
		{ href: '/music', label: 'Music', icon: Music, exact: false },
		{ href: '/videos', label: 'Videos', icon: Video, exact: false },
	];
</script>

<svelte:head>
	<title>Language Learner</title>
</svelte:head>

<div class="flex h-screen bg-background">
	<!-- Desktop sidebar -->
	<aside class="hidden md:flex flex-col w-44 border-r border-border shrink-0 bg-background">
		<div class="px-4 py-5">
			<a href="/" class="font-semibold text-base tracking-tight text-foreground">LL</a>
			<p class="text-xs text-muted-foreground mt-0.5">Language Transfer</p>
		</div>

		<nav class="flex-1 px-2 flex flex-col gap-0.5 overflow-y-auto">
			{#each navItems as item}
				<a
					href={item.href}
					class="flex items-center gap-2.5 px-2.5 py-2 rounded-md text-sm transition-colors {isActive(item.href, item.exact) ? 'bg-accent text-accent-foreground font-medium' : 'text-muted-foreground hover:text-foreground hover:bg-muted'}"
				>
					<item.icon size={16} />
					{item.label}
				</a>
			{/each}
			<a
				href="/concepts"
				class="flex items-center gap-2.5 px-2.5 py-2 rounded-md text-sm transition-colors {isActive('/concepts') ? 'bg-accent text-accent-foreground font-medium' : 'text-muted-foreground hover:text-foreground hover:bg-muted'}"
			>
				<Brain size={16} />
				Concepts
			</a>
		</nav>

		<div class="px-2 py-3 border-t border-border flex flex-col gap-2">
			<form method="POST" action="/?/sync" use:enhance>
				<Button type="submit" variant="outline" size="sm" class="w-full text-xs">Sync LingQ</Button>
			</form>
			{#if data.user}
				<div class="flex items-center gap-2 px-1">
					<Avatar size="sm">
						{#if data.user.avatar}
							<AvatarImage src={data.user.avatar} alt={data.user.name ?? 'User'} referrerpolicy="no-referrer" />
						{/if}
						<AvatarFallback class="text-xs">{(data.user.name ?? data.user.email)[0].toUpperCase()}</AvatarFallback>
					</Avatar>
					<span class="text-xs flex-1 truncate text-muted-foreground">{data.user.name ?? data.user.email}</span>
					<form method="POST" action="/auth/logout">
						<Button type="submit" variant="ghost" size="icon-sm" title="Sign out">
							<LogOut size={14} />
						</Button>
					</form>
				</div>
			{/if}
		</div>
	</aside>

	<!-- Main content -->
	<main class="flex-1 min-h-0 overflow-hidden">
		{@render children()}
	</main>

	<!-- Mobile bottom nav -->
	<nav class="md:hidden fixed bottom-0 left-0 right-0 bg-background border-t border-border" style="padding-bottom: env(safe-area-inset-bottom);">
		<div class="grid grid-cols-5 h-14">
			{#each navItems as item}
				<a
					href={item.href}
					class="flex flex-col items-center justify-center gap-0.5 transition-colors {isActive(item.href, item.exact) ? 'text-primary' : 'text-muted-foreground'}"
				>
					<item.icon size={20} />
					<span class="text-[10px] font-medium">{item.label}</span>
				</a>
			{/each}
		</div>
	</nav>
</div>
