import express from 'express';
import crypto from 'node:crypto';
import { KickClient } from '../client.js';
import { KICK_ENDPOINTS } from '../lib/constants.js';
import { Utils } from '../lib/utils.js';
import type { PublicKeyResponse, Subscriptions } from '../types.js';

export class WebhookListener {
	private _app = express();
	private _subscriptions: Subscriptions[];

	constructor() {
		this._subscriptions = [];

		this._app.use(express.json());
		this._app.post('/webhook', this.webhookHandler.bind(this));
		this._app.use(this.sendNotFound);
	}

	private async webhookHandler(req: express.Request, res: express.Response): Promise<void> {
		const isValidRequest = await WebhookListener.verifyRequest(req);
		if (!isValidRequest) return;

		if (WebhookListener.verifySubscriptionId(req, this._subscriptions)) return;

		console.log('Received webhook:', req.body);
		KickClient.instance.emit('message', req.body);
		res.sendStatus(200);
	}

	public setSubcriptions(subscriptions: Subscriptions[]): void {
		this._subscriptions = subscriptions;
	}

	public getSubcriptions(): Subscriptions[] {
		return this._subscriptions;
	}

	private sendNotFound(_req: express.Request, res: express.Response): void {
		res.sendStatus(404);
	}

	public startServer(port: string): Promise<void> {
		return new Promise((resolve) => {
			this._app.listen(port, () => resolve());
		});
	}

	private static verifySubscriptionId(req: express.Request, subscriptions: Subscriptions[]): boolean {		
		const subscriptionId = req.headers['kick-event-subscription-id'] as string;
		return subscriptions.find(subscription => subscription.subscriptionId === subscriptionId) !== undefined;
	}

	private static async verifyRequest(req: express.Request): Promise<boolean> {
		const messageId = req.headers['kick-event-message-id'] as string;
		const timestamp = req.headers['kick-event-message-timestamp'] as string;
		const kickSignature = req.headers['kick-event-signature'] as string;

		if (!messageId || !timestamp || !kickSignature) return false;

		const publicKeyKick = await this.getKickPublicKey();
		const publicKey = this.parsePublicKey(publicKeyKick);
		const signature = this.createSignature(messageId, timestamp, JSON.stringify(req.body));

		return this.verifyAndCompare(publicKey, signature, kickSignature);
	}
	
	private static createSignature(messageId: string, timestamp: string, body: string): Buffer<ArrayBuffer> {
		const signatureString = `${messageId}.${timestamp}.${body}`;
		return Buffer.from(signatureString);
	}

	private static parsePublicKey(bs: string) {
		const pemStr = Buffer.isBuffer(bs) ? bs.toString("utf8") : bs;

		if (!pemStr.includes("-----BEGIN PUBLIC KEY-----")) {
			throw new Error("not public key");
		}

		let keyObject;
		try {
			keyObject = crypto.createPublicKey({
				key: pemStr,
				format: "pem",
				type: "spki",
			});
		} catch {
			throw new Error("not decodable key");
		}

		if (keyObject.asymmetricKeyType !== "rsa") {
			throw new Error("not expected public key interface");
		}

		return keyObject;
	}

	private static verifyAndCompare(publicKey: crypto.KeyObject, body: Buffer<ArrayBuffer>, signature: string): boolean {
		const sigBuffer = Buffer.from(
			Buffer.isBuffer(signature) ? signature.toString("utf8") : signature,
			"base64"
		);

		const isValid = crypto.verify(
			"sha256",       // hash algorithm
			Buffer.isBuffer(body) ? body : Buffer.from(body),
			{
				key: publicKey,
				padding: crypto.constants.RSA_PKCS1_PADDING,
			},
			sigBuffer
		);

		return isValid;
	}

	private static async getKickPublicKey(): Promise<string> {
		const response = await Utils.sendGet<PublicKeyResponse>(KICK_ENDPOINTS.PUBLIC_KEY);
		return response.data.public_key;
	}
}