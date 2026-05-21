import EventEmitter from 'node:events';
import { KickEvent } from './events.js';
import { KICK_ENDPOINTS } from './lib/constants.js';
import { WebhookListener } from './webhooks/index.js';
import { Utils } from './lib/utils.js';
import { KickError } from './lib/kickerror.js';
import type { KickClientCreateOptions, LoginAccessTokenResponseError, LoginAccessTokenResponseSuccess, WebhookEvent } from './types.js';

export class KickClient extends EventEmitter {
	private _token: string | undefined;

	private _events: KickEvent;
	private static _instance: KickClient;

	private constructor(clientId: string, clientSecret: string, subscriptions: WebhookEvent[]) {
		super();

		this._events = new KickEvent(this, subscriptions);
		this._getAccessToken(clientId, clientSecret).then(() => {
			this._events.subscribeEvent();
		});

		const webhookListener = new WebhookListener();
		webhookListener.startServer();
		KickClient._instance = this;
	}

	public static create(options: KickClientCreateOptions): KickClient {
		return new KickClient(options.clientId, options.clientSecret, options.subscriptions);
	}

	public get token(): string {
		if (!this._token) {
			throw new Error('Token is required to perform this action.');
		}
		return this._token;
	}

	public static get instance(): KickClient {
		return KickClient._instance;
	}

	private async _getAccessToken(clientId: string, clientSecret: string): Promise<void> {

		const body = new FormData();
		body.set('grant_type', 'client_credentials');
		body.set('client_id', clientId);
		body.set('client_secret', clientSecret);

		const response = await Utils.sendPost<LoginAccessTokenResponseSuccess, LoginAccessTokenResponseError>(KICK_ENDPOINTS.ACCESS_TOKEN, body);

		if (!('error' in response)) {
			this._token = response.access_token;
		} else {
			this._token = undefined;
			throw new KickError(response.error);
		}
	}
}