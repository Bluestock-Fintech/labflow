export function ok(res, data, message = 'OK', meta = undefined) {
  return res.json({ success: true, data, message, ...(meta ? { meta } : {}) });
}

export function created(res, data, message = 'Created') {
  return res.status(201).json({ success: true, data, message });
}

export class ApiError extends Error {
  constructor(status, code, message) {
    super(message);
    this.status = status;
    this.code = code;
  }
}
