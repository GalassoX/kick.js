import { KickClient } from "./client.js";
import { KICK_ENDPOINTS, SubscriptionMethods } from "./lib/constants.js";
import { Utils } from "./lib/utils.js";
import type { SubscriptionCreatedError, SubscriptionCreatedSuccess, Subscriptions, WebhookEvent } from "./types.js";

export class KickEvent {
	private client: KickClient;
	private _subscriptionEvents: WebhookEvent[];
	private _subscriptionIds: Subscriptions[];

	constructor(client: KickClient, subscriptionEvents: WebhookEvent[]) {
		this.client = client;
		this._subscriptionEvents = subscriptionEvents ?? [];
		this._subscriptionIds = [];
	}

	public async subscribeEvent(broadcasterUserId: number): Promise<Subscriptions[]> {
		const headers = Utils.createHeadersWithAuthToken(this.client.token);

		const body = {
			broadcaster_user_id: broadcasterUserId,
			events: this._subscriptionEvents.map(sub => (
				{
					name: sub.name,
					version: sub.version
				}
			)),
			method: SubscriptionMethods.Webhook
		};

		const response = await Utils.sendPost<SubscriptionCreatedSuccess, SubscriptionCreatedError>(KICK_ENDPOINTS.SUBSCRIPTIONS, body, headers);

		if (response.data) {
			this._subscriptionIds = response.data.map(data => (
				{
					subscriptionId: data.subscription_id,
					eventName: data.name
				}
			));
			return this._subscriptionIds;
		}
		return [];
	}
}