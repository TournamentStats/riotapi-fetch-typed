# riotapi-fetch-typed

Fetch the Riot Games API type-safe at all times thanks to OpenAPI specifications.

## Features

- Just a thin wrapper around fetch
- (Almost) Fully Type-safe
  - Regions (based on API Route)
  - API Routes
  - HTTP Methods
  - Request Body
  - Response Body
  - Errors
- Almost instant updates with zero maintenance, Updates on the API just need a regeneration of the src/types/openapi.d.ts file using `openapi-typescript`
- supports all endpoints that are in the [OpenAPI specification](https://github.com/MingweiSamuel/riotapi-schema)

## Usage

### Without Error throwing

```typescript
import { createRiotFetch } from "riotapi-fetch-typed";

const riotFetch = createRiotFetch({ apiKey: process.env.RIOT_API_KEY! });

const puuid =
  "Zz2sEt4n_mfS37AyXSqXnNw4eXDHHRfsYXD2FQb7jOLIrttOjtIe88cu_fKqwkPVgCSc_4slSNSrbg";
// theoretically the route could support autofill, but current vscode typescript language doesn't support it, sadge. See below for issues
const { response, data, error } = await riotFetch(
  `/riot/account/v1/accounts/by-puuid/${puuid}`,
  {
    region: "europe", // type-safe
  }
);

if (!error) {
  const { gameName, tagLine } = data;
}
```

### With Error throwing

```typescript
const riotFetch = createRiotFetch({
  apiKey: process.env.RIOT_API_KEY!,
  throwOnResponseError: true,
});

try {
  const { response, data } = await riotFetch("/lol/tournament/v5/codes", {
    region: "europe",
    method: "post", // also type-safe
    body: {
      enoughPlayers: false,
      mapType: "SUMMONERS_RIFT",
      pickType: "TOURNAMENT_DRAFT",
      spectatorType: "ALL",
      teamSize: 5,
    }, // body is also fully typed and annotated (if exists)
  });
  const tournamentCodes = data;
} catch (e: unknown) {
  if (e instanceof RiotError) {
    console.error(e.statusCode, e.data);
  }
}
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

## Autocomplete related issues

This library would be much more DX-friendly if typescript could autocomplete / give suggestions for template literal types. I think in theory
this could be possible, but in reality I have no clue if the typescript eco-system would allow something like that.

Issues/PRs i found that maybe relates to the autocompletion of template literals.

- https://github.com/microsoft/TypeScript/issues/57902
- https://github.com/microsoft/TypeScript/pull/59794
- https://github.com/microsoft/TypeScript/issues/61217

## How it works

This module uses the `openapi-typescript` module to generate typescript data from the Riot API OpenAPI Specification, that itself is generated from the officially documentation. Huge thanks to [Mingwei Samuel](https://github.com/MingweiSamuel) who provides them at https://github.com/MingweiSamuel/riotapi-schema. With these type information, typescript's flexible typing system including template literals and type infering, we can infer the type of response and method and applicable regions from the fetch parameters.

## Contributing

Feel free to contribute.

## This also exist

- https://openapi-ts.dev/openapi-fetch/
  - Much more feature complete, riotapi-fetch-typed is tailored for the Riot API and would require much more work to be as general as openapi-fetch
