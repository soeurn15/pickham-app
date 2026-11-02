// Errors that carry an HTTP status; the error handler turns them into JSON responses.
class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

module.exports = {
  HttpError,
  badRequest: msg => new HttpError(400, msg),
  unauthorized: msg => new HttpError(401, msg),
  forbidden: msg => new HttpError(403, msg),
  notFound: msg => new HttpError(404, msg),
  conflict: msg => new HttpError(409, msg)
};
