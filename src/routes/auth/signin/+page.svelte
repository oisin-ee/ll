<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Card, CardContent } from '$lib/components/ui/card';
</script>

<div class="flex min-h-[60vh] items-center justify-center">
	<Card class="w-full max-w-sm">
		<CardContent class="p-10 flex flex-col items-center gap-6">
			<div class="text-center">
				<h1 class="text-2xl font-bold">Welcome</h1>
				<p class="text-muted-foreground mt-1">Sign in to track your progress</p>
			</div>

			<Button href="/auth/login" class="w-full gap-3">
				<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" class="w-5 h-5">
					<path fill="#4285F4" d="M47.5 24.6c0-1.6-.1-3.1-.4-4.6H24v8.7h13.1c-.6 3-2.3 5.5-4.9 7.2v6h7.9c4.6-4.3 7.4-10.6 7.4-17.3z"/>
					<path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.9-6c-2.1 1.4-4.9 2.3-8 2.3-6.1 0-11.3-4.1-13.2-9.7H2.7v6.2C6.7 42.6 14.8 48 24 48z"/>
					<path fill="#FBBC05" d="M10.8 28.8c-.5-1.4-.7-2.9-.7-4.8s.3-3.3.7-4.8V13H2.7C1 16.3 0 20 0 24s1 7.7 2.7 11l8.1-6.2z"/>
					<path fill="#EA4335" d="M24 9.5c3.4 0 6.5 1.2 8.9 3.5l6.6-6.6C35.9 2.4 30.5 0 24 0 14.8 0 6.7 5.4 2.7 13l8.1 6.2C12.7 13.6 17.9 9.5 24 9.5z"/>
				</svg>
				Continue with Google
			</Button>
		</CardContent>
	</Card>
</div>
