import { configDotenv } from 'dotenv';
configDotenv();

import type { components } from '../../src/types/openapi.js';
import { assertType, expect, expectTypeOf, test } from 'vitest';
import { createRiotFetch, RiotError } from '../../src/index.js';

type Account = components['schemas']['account-v1.AccountDto'];

/** Make sure apikey is valid before testing */
const apiKey = process.env.X_RIOT_API_TOKEN;
const validPuuid = process.env.PUUID;

if (apiKey == undefined || validPuuid == undefined) {
	console.error('Api Key or puuid not defined in env');
	process.exit(1);
}

const rfetch = createRiotFetch({ apiKey });
const throwing_rfetch = createRiotFetch({ apiKey, throwOnResponseError: true });

/**
 * Tests if a fetch is successful and if the result matches the specific DTO in the OpenAPI specification
 */
test('Test fetch account', async () => {
	const { response, data, error } = await rfetch(`/riot/account/v1/accounts/by-puuid/${validPuuid}`, {
		region: 'europe'
	});

	if (error) {
		console.error('fetch errored', response.status, data?.status);
		throw new Error('fetch failed');
	}

	expectTypeOf(data).toMatchObjectType<Account>();
	assertType(data);

	expect(data).toEqual(
		expect.objectContaining({
			puuid: expect.stringMatching(validPuuid) as string,
			gameName: expect.any(String) as string,
			tagLine: expect.any(String) as string,
		})
	);
});

/**
 * Tests a 404 error on a (hopefully) not existing Riot ID. Configuration is noThrow
 */
test('Test fetch account http error', async () => {
	// puuid 1 will result in 404
	const { response, error } = await rfetch('/riot/account/v1/accounts/by-riot-id/g45w9j6er8u9/EUW', {
		region: 'europe'
	});

	expect(error).toEqual(true);
	expect(response.status).toEqual(404);
});

/**
 * Tests a generic error to throw on configuration toThrow
 */
test('Test throw http error', async () => {
	await expect(throwing_rfetch('/riot/account/v1/accounts/by-puuid/1', {
		region: 'europe'
	}))
		.rejects.toThrowError(RiotError);
});