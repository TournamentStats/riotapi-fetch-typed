# riot-games-fetch-typed

A Module that adds basic typing information to a fetch function by wrapping it. Nothing more.

## Usage

This module provides a utility function to create a fetch function. This uses a given fetch function which needs a BaseURL option (for example ofetch) and returns a wrapper around this function that enables the typed informations.

```typescript
import { createRiotFetch } from 'riot-games-fetch-typed'
import { ofetch } from 'ofetch'

const riotFetch = createRiotFetch(ofetch, 'Your Riot Games API Key')

// account is fully typed! API endpoint supports autofill!
const account = await riotFetch('europe', { apiKey: process.env.RIOT_API_KEY ?? '' })
const { gameName, gameTag } = account

const ids = await riotFetch(
	'EUW1',
	'/lol/tournament/v5/codes',
	{
		method: 'post',
	},
)
```

## Installation

Install it using your package manager:

```bash
$ npm install riot-games-fetch-typed
# or
$ pnpm install riot-games-fetch-typed
# or
$ yarn install riot-games-fetch-typed
# or
$ bun install riot-games-fetch-typed
```

## How it works

This module uses the `openapi-typescript` module to generate typescript data from the Riot API OpenAPI Specification, that itself is generated from the officially documentation. Huge thanks to [Mingwei Samuel](https://github.com/MingweiSamuel) who provides them at https://github.com/MingweiSamuel/riotapi-schema. With these type information, typescripts crazy flexible typing system including template literals and type infering, we can infer the type from the request parameter.

## Improvements

- Make the createRiotFetch function more flexible by also allowing a fetch function without baseURL functionality (for example the standard node fetch)
- I guess this concepts can also be applied to other apis pretty easily. The createRiotFetch removes these flexibility.

## This also exist

- https://openapi-ts.dev/openapi-fetch/
