import EventEmitter from 'node:events';
import { KickEvent } from './events.js';
import { KICK_ENDPOINTS, KickEvents } from './lib/constants.js';
import { WebhookListener } from './webhooks/index.js';
import { Utils } from './lib/utils.js';
import { KickError } from './lib/kickerror.js';
import type { KickClientCreateOptions, LoginAccessTokenResponseError, LoginAccessTokenResponseSuccess } from './types.js';

export class KickClient extends EventEmitter {
	private _token: string | undefined;

	private _events: KickEvent;
	private _webhookListener: WebhookListener;
	private static _instance: KickClient;

	private constructor(options: KickClientCreateOptions) {
		super();
		KickClient._instance = this;

		this._events = new KickEvent(this, options.subscriptions);
		this._webhookListener = new WebhookListener();
	}

	public static async create(options: KickClientCreateOptions): Promise<KickClient> {
		const client = new KickClient(options);
		client._token = await client._getAccessToken(options.clientId, options.clientSecret);
		client._webhookListener.startServer(options.serverPort).then(() => client.emit(KickEvents.WebServerReady));
		return client;
	}

	public async listenBroadcaster(broadcasterId: number) {
		const subscriptions = await this._events.subscribeEvent(broadcasterId);
		this._webhookListener.setSubcriptions([
			...this._webhookListener.getSubcriptions(),
			...subscriptions
		]);
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

	private async _getAccessToken(clientId: string, clientSecret: string): Promise<string> {

		const body = new FormData();
		body.set('grant_type', 'client_credentials');
		body.set('client_id', clientId);
		body.set('client_secret', clientSecret);

		const response = await Utils.sendPost<LoginAccessTokenResponseSuccess, LoginAccessTokenResponseError>(KICK_ENDPOINTS.ACCESS_TOKEN, body);

		if (!('error' in response)) {
			return response.access_token;
		} else {
			throw new KickError(response.error);
		}
	}
}