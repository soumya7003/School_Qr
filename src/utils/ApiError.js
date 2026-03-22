export class ApiError extends Error {
  constructor(code, status = null, original = null) {
    super(code);
    this.name = "ApiError";
    this.code = code;
    this.status = status;
    this.original = original;
  }
}
