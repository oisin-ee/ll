<script lang="ts">
	import '../app.css';
	import { Navigation, Avatar } from '@skeletonlabs/skeleton-svelte';
	import { page } from '$app/stores';
	import { enhance } from '$app/forms';
	import { afterNavigate } from '$app/navigation';
	import MobileAppBar from '$lib/components/MobileAppBar.svelte';
	import NavDrawer from '$lib/components/NavDrawer.svelte';

	let { data, children } = $props();
	let drawerOpen = $state(false);

	afterNavigate(() => {
		drawerOpen = false;
	});
</script>

{#snippet navContent()}
	<Navigation layout="sidebar">
		<Navigation.Header>
			<div class="p-4">
				<a href="/" class="h3 anchor">LL</a>
				<p class="opacity-50">Language Transfer</p>
			</div>
		</Navigation.Header>

		<Navigation.Menu>
			<Navigation.Group>
				<Navigation.Label>Learn</Navigation.Label>
				<Navigation.TriggerAnchor
					href="/"
					class={$page.url.pathname === '/' ? 'preset-tonal-primary' : ''}
				>
					<Navigation.TriggerText>Dashboard</Navigation.TriggerText>
				</Navigation.TriggerAnchor>
				<Navigation.TriggerAnchor
					href="/episodes"
					class={$page.url.pathname.startsWith('/episodes') ? 'preset-tonal-primary' : ''}
				>
					<Navigation.TriggerText>Episodes</Navigation.TriggerText>
				</Navigation.TriggerAnchor>
			</Navigation.Group>

			<Navigation.Group>
				<Navigation.Label>Review</Navigation.Label>
				<Navigation.TriggerAnchor
					href="/vocabulary"
					class={$page.url.pathname === '/vocabulary' ? 'preset-tonal-primary' : ''}
				>
					<Navigation.TriggerText>Vocabulary</Navigation.TriggerText>
				</Navigation.TriggerAnchor>
				<Navigation.TriggerAnchor
					href="/concepts"
					class={$page.url.pathname === '/concepts' ? 'preset-tonal-primary' : ''}
				>
					<Navigation.TriggerText>Concepts</Navigation.TriggerText>
				</Navigation.TriggerAnchor>
			</Navigation.Group>

			<Navigation.Group>
				<Navigation.Label>Practice</Navigation.Label>
				<Navigation.TriggerAnchor
					href="/practice/past-tense"
					class={$page.url.pathname.startsWith('/practice') ? 'preset-tonal-primary' : ''}
				>
					<Navigation.TriggerText>Past Tense</Navigation.TriggerText>
				</Navigation.TriggerAnchor>
			</Navigation.Group>
		</Navigation.Menu>

		<Navigation.Footer>
			<div class="p-4 flex flex-col gap-3">
				<form method="POST" action="/?/sync" use:enhance>
					<button type="submit" class="btn preset-tonal w-full">Sync LingQ</button>
				</form>
				{#if data.user}
					<div class="flex items-center gap-3">
						{#if data.user.avatar}
							<img src={data.user.avatar} alt={data.user.name ?? 'User'} class="w-8 h-8 rounded-full" referrerpolicy="no-referrer" />
						{:else}
							<div class="w-8 h-8 rounded-full bg-primary-500 flex items-center justify-center text-sm font-bold">{(data.user.name ?? data.user.email)[0].toUpperCase()}</div>
						{/if}
						<span class="text-sm flex-1 truncate opacity-75">{data.user.name ?? data.user.email}</span>
						<form method="POST" action="/auth/logout">
							<button type="submit" class="btn btn-sm preset-tonal" title="Sign out">
								<svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
							</button>
						</form>
					</div>
				{/if}
			</div>
		</Navigation.Footer>
	</Navigation>
{/snippet}

<svelte:head>
	<title>Language Learner</title>
</svelte:head>

<div class="flex flex-col md:flex-row h-screen">
	<div class="md:hidden">
		<MobileAppBar onMenuClick={() => { drawerOpen = true }} />
	</div>

	<NavDrawer bind:open={drawerOpen}>
		{@render navContent()}
	</NavDrawer>

	<div class="hidden md:block">
		{@render navContent()}
	</div>

	<main class="flex-1 overflow-auto p-3 md:p-6">
		<div class="mx-auto max-w-5xl">
			{@render children()}
		</div>
	</main>
</div>
