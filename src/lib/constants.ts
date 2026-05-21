export const WEBHOOK_EVENTS = {
	MESSAGE_SENT: {
		name: 'chat.message.sent',
		version: 1
	},
	CHANNEL_FOLLOWED: {
		name: 'channel.followed',
		version: 1
	},
	CHANNEL_SUBSCRIPTION_RENEWAL: {
		name: 'channel.subscription.renewal',
		version: 1
	},
	CHANNEL_SUBSCRIPTION_GIFTS: {
		name: 'channel.subscription.gifts',
		version: 1
	},
	CHANNEL_SUBSCRIPTION_NEW: {
		name: 'channel.subscription.new',
		version: 1
	},
	CHANNEL_REWARD_REDEPTION: {
		name: 'channel.reward.redemption.updated',
		version: 1
	},
	LIVESTREAM_STATUS_UPDATED: {
		name: 'livestream.status.updated',
		version: 1
	},
	LIVESTREAM_METADATA_UPDATED: {
		name: 'livestream.metadata.updated',
		version: 1
	},
	MODERATION_BANNED: {
		name: 'moderation.banned',
		version: 1
	},
	KICKS_GIFTED: {
		name: 'kicks.gifted',
		version: 1
	}
} as const;

const KICK_HOST_URLS = {
	AUTH: 'https://id.kick.com',
	API: 'https://api.kick.com'
}

export const KICK_ENDPOINTS = {
	ACCESS_TOKEN: `${KICK_HOST_URLS.AUTH}/oauth/token`,
	PUBLIC_KEY: `${KICK_HOST_URLS.API}/public/v1/public-key`,
	SUBSCRIPTIONS: `${KICK_HOST_URLS.API}/public/v1/events/subscriptions`
};

export enum SubscriptionMethods {
	Webhook = "webhook"
};