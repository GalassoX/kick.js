export class Utils {
	private constructor() {}

	public static async sendPost<T, E>(url: string, body: any, headers: Headers = new Headers()): Promise<T | E> {
		const contentType = headers.get('Content-Type');

		if (!contentType) {
			headers.set('Content-Type', 'application/json');
		}

		if (body instanceof FormData) {
			headers.set('Content-Type', 'application/x-www-form-urlencoded');
			
			const urlencoded = new URLSearchParams();
			body.forEach((value, key) => urlencoded.append(key, String(value)));

			body = urlencoded;
		} else {
			body = JSON.stringify(body);
		}

		const response = await fetch(url, {
			method: 'POST',
			headers: headers,
			body: body
		});

		if (response.ok) {
			return response.json() as T;
		} else {
			return response.json() as E;
		}
	}

	public static async sendGet<T>(url: string, headers: Headers = new Headers()): Promise<T> {
		const response = await fetch(url, { 
			headers
		});
		return await response.json() as T;
	}

	public static createHeadersWithAuthToken(authToken: string): Headers {
		return new Headers({
			Authorization: authToken
		})
	}
}