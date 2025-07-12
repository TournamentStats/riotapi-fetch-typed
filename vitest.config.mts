import { defineConfig } from 'vitest/config';

export default defineConfig({
	test: {
		include: ['tests/**/*.ts'],
		typecheck: {
			include: ['tests/**/*.ts']
		},
		silent: false,
		printConsoleTrace: true,
	}
});