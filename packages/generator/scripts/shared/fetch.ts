export async function fetchOk(url: string, init?: RequestInit) {
	const response = await fetch(url, init);
	if (!response.ok) {
		throw new Error(
			`Could not fetch ${url}: ${response.status.toString()} ${response.statusText}.`,
		);
	}

	return response;
}

export async function fetchText(url: string, init?: RequestInit) {
	return await (await fetchOk(url, init)).text();
}
