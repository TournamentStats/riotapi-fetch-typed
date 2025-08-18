import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import stylistic from '@stylistic/eslint-plugin';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default tseslint.config(
	{
		ignores: ['dist/*', 'src/types/openapi.d.ts'],
	},
	{
		plugins: {
			'@stylistic': stylistic
		},
		rules: {
			'@stylistic/indent': ['error', 'tab'],
			'@stylistic/semi': ['error', 'always'],
			'@stylistic/quotes': ['error', 'single']
		}
	},
	eslint.configs.recommended,
	tseslint.configs.strictTypeChecked,
	tseslint.configs.stylisticTypeChecked,
	{
		languageOptions: {
			parserOptions: {
				projectService: true,
				tsconfigRootDir: __dirname
			}
		}
	}
);