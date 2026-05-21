export type KickClientCreateOptions = {
	clientId: string;
	clientSecret: string;
	subscriptions: WebhookEvent[];
};

export type LoginAccessTokenResponseSuccess = {
  access_token: string;
  token_type: string;
  expires_in: string;
}

export type LoginAccessTokenResponseError = {
  error: string;
}

export type SubscriptionCreatedSuccess = {
	data: SubscriptionCreatedSuccessData[];
	message: string;
}

export type SubscriptionCreatedError = {
	data: null;
	message: string;
};

export type SubscriptionCreatedSuccessData = {
	error: string;
	name: string;
	subscription_id: string;
	version: number;
}

export type WebhookEvent = {
	name: string;
	version: number;
}

export type Subscriptions = {
	subscriptionId: string;
	eventName: string;
}

export type PublicKeyResponse = {
	data: {
		public_key: string;
	};
	message: string;
}