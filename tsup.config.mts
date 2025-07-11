import { defineConfig } from 'tsup';

export default defineConfig({
	entry: ['src/index.ts'],
	sourcemap: true,
	platform: 'node',
	target: 'esnext',
	dts: true,
	format: ['cjs', 'esm'],
	clean: true,
});