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
		this._app.post('/webhook', (req, res) => this.webhookHandler(req, res));
		this._app.use(this.sendNotFound);
	}

	private async webhookHandler(req: express.Request, res: express.Response): Promise<void> {
		const isValidRequest = await this.verifyRequest(req);
		if (!isValidRequest) return;
		
		if (!this.isValidSubscription(req, this._subscriptions)) return;

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

	private isValidSubscription(req: express.Request, subscriptions: Subscriptions[]): boolean {		
		const subscriptionId = this.getHeader(req, 'kick-event-subscription-id');
		return subscriptions.find(subscription => subscription.subscriptionId === subscriptionId) !== undefined;
	}

	private async verifyRequest(req: express.Request): Promise<boolean> {
		const messageId = this.getHeader(req, 'kick-event-message-id');
		const timestamp = this.getHeader(req, 'kick-event-message-timestamp');
		const kickSignature = this.getHeader(req, 'kick-event-signature');

		if (!messageId || !timestamp || !kickSignature) return false;

		const publicKeyKick = await this.getKickPublicKey();
		const publicKey = this.parsePublicKey(publicKeyKick);
		const signature = this.createSignature(messageId, timestamp, JSON.stringify(req.body));

		return this.verifyAndCompare(publicKey, signature, kickSignature);
	}
	
	private createSignature(messageId: string, timestamp: string, body: string): Buffer<ArrayBuffer> {
		const signatureString = `${messageId}.${timestamp}.${body}`;
		return Buffer.from(signatureString);
	}

	private parsePublicKey(bs: string) {
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

	private verifyAndCompare(publicKey: crypto.KeyObject, body: Buffer<ArrayBuffer>, signature: string): boolean {
		const sigBuffer = Buffer.from(
			Buffer.isBuffer(signature) ? signature.toString("utf8") : signature,
			"base64"
		);

		const isValid = crypto.verify(
			"sha256",
			Buffer.isBuffer(body) ? body : Buffer.from(body),
			{
				key: publicKey,
				padding: crypto.constants.RSA_PKCS1_PADDING,
			},
			sigBuffer
		);

		return isValid;
	}

	private async getKickPublicKey(): Promise<string> {
		const response = await Utils.sendGet<PublicKeyResponse>(KICK_ENDPOINTS.PUBLIC_KEY);
		return response.data.public_key;
	}

	private getHeader(req: express.Request, key: string): string | undefined {
		const header = req.headers[key];
		if (!header || Array.isArray(header)) return;
		return header;
	}
}