/** How long a request may take, body included. */
export const requestTimeout = 60_000;

export async function fetchOk(url: string, init?: RequestInit) {
	const response = await fetchUrl(url, {
		signal: AbortSignal.timeout(requestTimeout),
		...init,
	});
	if (!response.ok) {
		throw new Error(
			`Could not fetch ${url}: ${response.status.toString()} ${response.statusText}.`,
		);
	}

	return response;
}

export async function fetchText(url: string, init?: RequestInit) {
	return await readText(await fetchOk(url, init));
}

export async function fetchUrl(url: string, init?: RequestInit) {
	try {
		return await fetch(url, init);
	} catch (error) {
		throw new Error(`Could not fetch ${url}.`, { cause: error });
	}
}

export async function readBuffer(response: Response) {
	return Buffer.from(await readBody(response, response.arrayBuffer()));
}

export async function readText(response: Response) {
	return await readBody(response, response.text());
}

async function readBody<T>(response: Response, body: Promise<T>) {
	try {
		return await body;
	} catch (error) {
		throw new Error(`Could not read ${response.url}.`, { cause: error });
	}
}
