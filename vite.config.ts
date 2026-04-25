import { sveltekit } from '@sveltejs/kit/vite';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vitest/config';

export default defineConfig({
	plugins: [sveltekit(), tailwindcss()],
	server: { port: 3000 },
	test: {
		exclude: ['**/node_modules/**', '**/dist/**', '**/build/**', '**/.svelte-kit/**', 'e2e/**']
	}
});
