import type { paths, components } from './types/openapi'

type RiotError = components['schemas']['Error']

type _Region = 'americas' | 'asia' | 'europe' | 'esports'
export type Region = _Region | Uppercase<_Region>

type _Platform = 'br1' | 'eun1' | 'euw1' | 'jp1' | 'kr' | 'la1' | 'la2' | 'me1' | 'na1' | 'oc1' | 'ph2' | 'ru' | 'sg2' | 'th2' | 'tr1' | 'tw2' | 'vn2'
export type Platform = _Platform | Uppercase<_Platform>

// Type util to convert path parameters to template strings recursivly
// example: TemplatePathParams<'summoner/{summonerName}/ranked'> = 'summoner/${summonerName}/ranked'
type TemplatePathParams<Path extends string> =
Path extends `${infer Start}/{${string}}${infer End}`
	? `${Start}/${string}${TemplatePathParams<End>}`
	: Path

// every possible api path
type Paths = keyof paths
type AvailableMethods<Path extends Paths> = keyof paths[Path]

// every possible api path, templatified
type TemplatePaths = TemplatePathParams<keyof paths>

// Type util to get the corresponding api path from a string that extends from the specific template string
// basically reverses the TemplatePathParams type
type ResolveTemplatePath<TemplatePath extends string> = {
	[P in keyof paths]: TemplatePath extends TemplatePathParams<P> ? P : never;
}[keyof paths]

// gets the responses of a specific path and method by status code, if applicable
type GetResponses<Path extends Paths, Method extends AvailableMethods<Path>> =
	paths[Path][Method] extends { responses: infer Responses } ? Responses : never

// gets the response json body of a specific path and method for a specific status code, if applicable
type GetResponseBody<Path extends Paths, Method extends AvailableMethods<Path>, StatusCode extends number> =
	GetResponses<Path, Method> extends Record<StatusCode, { content: { 'application/json': infer Body } }> ? Body : never

// gets the request json body of a specific path and method, if applicable
type GetRequestBody<Path extends Paths, Method extends AvailableMethods<Path>> =
	paths[Path][Method] extends { requestBody: { content: { 'application/json': infer Body } } } ? Body : never

export interface CreateFetchOptions {
	apiKey: string
	baseUrl?: (region: Region | Platform | string) => string
}

// Checks if an error is a RiotError
export function isRiotError(error: unknown): error is RiotError {
	return (error as RiotError).status !== undefined
}


/**
 * Creates a fetch function that automatically appends the api key to the headers
 * provides typing for the request and response bodies based on the passed request path
 * Path and Method are automatically inferred from parameters, ResponseCode defaults to 200
 * Function requires a fetch method that can work with a base url, for example ofetch https://github.com/unjs/ofetch
 * only really tested with ofetch
 *
 * @param fetchMethod Fetch method, for example ofetch. This Function has to return a promise with the response body. For custom parameters wrap the fetch method and use the options parameter.
 * @param createFetchOptions Object containing the api key and optional base url function
 * @returns A function that can be called with a region, request path and optional options
 */
export function createRiotFetch<
	O extends Record<string, unknown> | undefined,
	Fetch extends <T>(
		request: string,
		options?: Partial<O> & { headers?: HeadersInit, baseURL?: string, body?: object },
	) => Promise<T>,
>(
	fetchMethod: Fetch,
	createFetchOptions: CreateFetchOptions
) {
	return async <
		Path extends TemplatePaths,
		Method extends AvailableMethods<ResolveTemplatePath<Path>> = 'get',
		ResponseCode extends number = 200,
	>(
		region: Region | Platform | string,
		request: Path,
		options: O & { headers?: HeadersInit, baseURL?: string } & { body?: GetRequestBody<ResolveTemplatePath<Path>, Method> },
	): Promise<GetResponseBody<ResolveTemplatePath<Path>, Method, ResponseCode>> => {

		options = options ?? {}
		const headers = new Headers(options?.headers)
		headers.append('X-Riot-Token', createFetchOptions.apiKey)
		options.headers = headers

		return fetchMethod<GetResponseBody<ResolveTemplatePath<Path>, Method, ResponseCode>>(
			request,
			{
				baseURL: createFetchOptions.baseUrl?.(region) ?? `https://${region}.api.riotgames.com/`,
				...options,
			},
		)
	}
}