import type { paths, components } from './types/openapi.d.js';

export * from './types/openapi.d.js';


/** Every possible API path, based on the OpenAPI document */
type Paths = keyof paths;

/**
 * Type util that replaces all occurences of curly brackets pairs in a string literal type to string placeholders,
 * resulting in a template literal type. For that it recursively tests the string for curly bracket pairs.
 *
 * @example TemplatifyPath<'summoner/{summonerName}/ranked'> -> `summoner/${string}/ranked`
 */
type TemplatifyPath<Path extends string> =
	Path extends `${infer Start}/{${string}}${infer End}`
		? `${Start}/${string}${TemplatifyPath<End>}`
		: Path;


/** Every possible API path, but templatified */
type TemplatePaths = TemplatifyPath<Paths>;

/**
 * Gives all API Paths that matches the templatified path. Basically the reverse operation of TemplatifyPath
 *
 * @example ResolveTemplatePath<`/riot/account/v1/accounts/by-puuid/${string}`>
 * -> "/riot/account/v1/accounts/by-puuid/{puuid}"
 */
type ResolveTemplatePath<TemplatePath extends TemplatePaths> = {
	[P in Paths]: TemplatePath extends TemplatifyPath<P> ? P : never;
}[Paths];


export type HTTPMethods = 'get' | 'put' | 'post' | 'delete' | 'options' | 'head' | 'patch' | 'trace';

/**
 * Get all available methods for a specific API path
 */
type Methods<Path extends Paths> = Exclude<keyof {
	[K in keyof paths[Path] as paths[Path][K] extends undefined ? never : K]: paths[Path][K]
}, 'parameters'>;

/** Get all possible responses for a specific API path and method */
type GetResponses<Path extends Paths, Method extends Methods<Path>> =
	paths[Path][Method] extends { responses: infer Responses }
		? Responses
		: never;


/** Get the response body for a specific API path, method and status code */
type GetResponseBody<Path extends Paths, Method extends Methods<Path>, StatusCode extends number> =
	GetResponses<Path, Method> extends Record<StatusCode, { content: { 'application/json': infer Body } }>
		? Body
		: never;

/** Get the request body for a specific API path and method */
type GetRequestBody<Path extends Paths, Method extends Methods<Path>> =
	paths[Path][Method] extends { requestBody: { content: { 'application/json': infer Body } } }
		? Body
		: never;

/** Regions for /riot/account/ endpoints */
export type AccountRegion =  'americas' | 'asia' | 'europe';
/** Regions for some lol and tft endpoints */
export type LolRegion = 'br1' | 'eun1' | 'euw1' | 'jp1' | 'kr' | 'la1' | 'la2' | 'me1' | 'na1' | 'oc1' | 'ph2' | 'ru' | 'sg2' | 'th2' | 'tr1' | 'tw2' | 'vn2';
/** Regions for lol and tft matches endpoints */
export type MatchRegion = 'americas' | 'asia' | 'europe' | 'sea';
/** Regions for /lor/ endpoints */
export type LorRegion = 'americas' | 'europe' | 'sea';
/** Regions for /val/ endpoints */
export type ValorantRegion = 'ap' | 'br' | 'eu' | 'latam' | 'na' | 'esports' | 'kr';


/** Get the relevant subdomains, depending on the endpoint */
// i dont like eslint indenting here
/* eslint-disable @stylistic/indent */
type GetSubdomain<Path extends TemplatePaths> =
	Path extends `/riot/account/${string}` ? AccountRegion :
	Path extends `/lol/champion-mastery/${string}` ? LolRegion :
	Path extends `/lol/platform/${string}` ? LolRegion :
	Path extends `/lol/clash/${string}` ? LolRegion :
	Path extends `/lol/league-exp/${string}` ? LolRegion :
	Path extends `/lol/league/${string}` ? LolRegion :
	Path extends `/lol/challenges/${string}` ? LolRegion :
	Path extends `/lol/rso-match/${string}` ? MatchRegion :
	Path extends `/lol/status/${string}` ? LolRegion :
	Path extends `/lor/deck/${string}` ? LorRegion :
	Path extends `/lor/inventory/${string}` ? LorRegion :
	Path extends `/lor/match/${string}` ? LorRegion | 'apac' :
	Path extends `/lor/ranked/${string}` ? LorRegion :
	Path extends `/lor/status/${string}` ? LorRegion :
	Path extends `/lol/match/${string}` ? MatchRegion :
	Path extends `/lol/spectator/${string}` ? LolRegion :
	Path extends `/fulfillment/${string}` ? LolRegion :
	Path extends `/lol/summoner/${string}` ? LolRegion :
	Path extends `/tft/league/${string}` ? LolRegion :
	Path extends `/tft/match/${string}` ? MatchRegion | 'esports' | 'esportseu' :
	Path extends `/tft/status/${string}` ? LolRegion :
	Path extends `/tft/summoner/${string}` ? LolRegion :
	// seems like only americas but not sure
	Path extends `/lol/tournament-stub/${string}` ? 'americas' :
	// don't know, can't see in api reference
	Path extends `/lol/tournament/${string}` ? LolRegion | MatchRegion :
	// The api docs do not include all regions for console, but for stability we will just include them
	Path extends `/val/match/console/${string}` ? ValorantRegion :
	Path extends `/val/console/ranked/${string}` ? ValorantRegion :
	Path extends `/val/content/${string}` ? ValorantRegion :
	Path extends `/val/match/${string}` ? ValorantRegion :
	Path extends `/val/ranked/${string}` ? ValorantRegion :
	Path extends `/val/status/${string}` ? Exclude<ValorantRegion, 'esports'>
	: never;
/* eslint-enable @stylistic/indent */

/** Typical structure for a RiotError json object. */
export type RiotErrorData = components['schemas']['Error'];

/**
 * Error Class for a 4xx/5xx response code in a fetch to the Riot API
 */
export class RiotError extends Error {
	constructor(message: string, statusCode: number, data?: RiotErrorData) {
		super(message);
		this.statusCode = statusCode;
		this.data = data;
	}
	statusCode: number;
	data: RiotErrorData | undefined;
}

/**
 * Type guard to check if an object is in the form of an riot error.
 * The API may return a structure like that on error, but we cannot be sure.
 *
 * @param obj obj to be checked
 * @returns true if obj has the form of RiotErroData
 */
function isRiotErrorData(obj: unknown): obj is RiotErrorData {
	if (typeof obj !== 'object' || obj === null) return false;

	const data = obj as RiotErrorData;

	if (data.status !== undefined) {
		if (typeof data.status !== 'object') {
			return false;
		}

		if ('status_code' in data.status && typeof data.status.status_code !== 'number')		{
			return false;
		}

		if ('message' in data.status && typeof data.status.message !== 'string')		{
			return false;
		}
	}

	return true;
}


/**
 * This is a mess. I am sorry for this type abonimation.
 *
 * @template Path the Path of the API route
 * @template ChosenMethod the Method that is chosen, has to be one of the available methods of the Path
 * @template ThrowOnError Wether createRiotFetch is configured to throw on http errors or not
 * @template error response.ok, used for type narrowing
 */
type RiotFetchReturn<
	Path extends TemplatePaths,
	ChosenMethod extends Methods<ResolveTemplatePath<Path>>,
	ThrowOnError extends boolean,
	error extends boolean,
> = ThrowOnError extends true
	? error extends false
		? {
			/** The response object of the fetch */
			response: Response;
			/** Typed result of response.json() */
			data: GetResponseBody<ResolveTemplatePath<Path>, ChosenMethod, 200>;
		}
		: never
	: error extends false
		? {
			/** The response object of the fetch */
			response: Response;
			/** Typed result of response.json() or eventual error data */
			data: GetResponseBody<ResolveTemplatePath<Path>, ChosenMethod, 200>;
			/** Wether the fetch errored */
			error: false;
		}
		: {
			/** The response object of the fetch */
			response: Response;
			/** Typed result of response.json() or eventual error data */
			data:RiotErrorData | undefined;
			/** Wether the fetch errored */
			error: true;
		};

/**
 * Options for the createRiotFetch functions
 * @template FetchOptions Options the fetch function can accept
 * @template ThrowOnError We set throwOnResponseError as a generic literal boolean, so that we can better type it
 */
export interface CreateRiotFetchOptions<FetchOptions, ThrowOnError extends boolean> {
	/** The Api Key obtained from Riot Games */
	apiKey: string
	/** fetch function that gets called (default: `undici.fetch`) */
	fetchFn?: (request: string, fetchOptions: FetchOptions) => Promise<Response>
	/** Function for dynamically creating the base url based on the given region. (default: standard riot api) */
	baseUrl?: (region: string) => string,
	/**
	 * Wether on 4xx/5xx response status the fetch should error or set error = true and include eventual error data in data
	 * @see RiotError
	 */
	throwOnResponseError?: ThrowOnError,
}

/**
 * Basic Fetch Options that are essential for the functioning of createRiotFetch
 */
interface BaseFetchOptions {
	method?: HTTPMethods,
	headers?: Headers,
}

/**
 * Creates a new function that basically wraps the provided fetch function to provide type information.
 *
 * @param {CreateRiotFetchOptions} createRiotFetchOptions Options for the createRiotFetch function
 * @param defaultOptions Options that get passed to the fetch function by default
 * @returns A fetch function to get fetch the Riot Games API type-safe
 */
export function createRiotFetch<
	FetchOptions extends BaseFetchOptions & Record<string, unknown>,
	ThrowOnError extends boolean = false
>(
	{
		apiKey,
		fetchFn = fetch,
		baseUrl = (region: string) => `https://${region}.api.riotgames.com/`,
		throwOnResponseError = false as ThrowOnError
	}: CreateRiotFetchOptions<FetchOptions & { body?: BodyInit }, ThrowOnError>,
	defaultOptions: FetchOptions = {} as FetchOptions
) {
	const headers = new Headers(defaultOptions.headers);
	headers.append('X-Riot-Token', apiKey);
	headers.append('Content-Type', 'application/json');
	defaultOptions.headers = headers;

	/**
	 * A functions that can be used to fetch the Riot Games API with already defined defaults and type information
	 * based on it's OpenAPI specification.
	 *
	 * @template Path The literal type of the path, inferred by `request`
	 * @template UsableMethods All Methods that can be selected, used to autocomplete `method`
	 * @template ChosenMethod The method
	 * @param request The path of the resource requested. Gets merged using `URL`
	 * @returns Response Object, a promise for the return body, depending on Path, Method and Status Code and an error indicator
	 * @throws { RiotError } if `throwOnResponseError = true` and !response.ok
	 */
	return async <
		Path extends TemplatePaths,
		UsableMethods extends Methods<ResolveTemplatePath<Path>>,
		ChosenMethod extends UsableMethods | undefined = 'get' extends UsableMethods ? 'get' : UsableMethods,
	>(
		request: Path,
		options: FetchOptions & {
			region: GetSubdomain<ResolveTemplatePath<Path>>,
			method?: UsableMethods,
			body?: GetRequestBody<ResolveTemplatePath<Path>, Extract<ChosenMethod, HTTPMethods>>
		},
	) => {
		const baseURL = baseUrl(options.region);
		const req = new URL(request, baseURL);
		const response = await fetchFn(req.toString(), {
			...defaultOptions,
			...options,
			body: JSON.stringify(options.body)
		});

		if (!response.ok) {
			const riotErrorData = await response.json()
				.then(obj => isRiotErrorData(obj) ? obj : undefined)
				.catch(() => undefined);


			if (throwOnResponseError) {
				throw new RiotError(
					'Riot Games Fetch Error',
					response.status,
					riotErrorData
				);
			}

			return {
				response,
				data: riotErrorData,
				error: true,
			} as RiotFetchReturn<Path, Extract<ChosenMethod, HTTPMethods>, ThrowOnError, true>;
		}

		return {
			response,
			data: await response.json() as GetResponseBody<ResolveTemplatePath<Path>, Extract<ChosenMethod, HTTPMethods>, 200>,
			error: false,
		} as RiotFetchReturn<Path, Extract<ChosenMethod, HTTPMethods>, ThrowOnError, false>;
	};
}