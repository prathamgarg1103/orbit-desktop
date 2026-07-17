export class HttpError extends Error {
  constructor(status, message, code = "request_error") {
    super(message);
    this.name = "HttpError";
    this.status = status;
    this.code = code;
  }
}

export function asHttpError(error) {
  if (error instanceof HttpError) return error;
  return new HttpError(500, "Diya Cloud could not complete that request.", "internal_error");
}
