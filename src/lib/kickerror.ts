export class KickError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "KickError";
  }
}