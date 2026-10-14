// Small helpers to keep API responses consistent across every module.
const ok = (res, data, meta = undefined, status = 200) =>
  res.status(status).json({ success: true, data, ...(meta ? { meta } : {}) });

const created = (res, data) => ok(res, data, undefined, 201);

const fail = (res, status, message, errors = undefined) =>
  res.status(status).json({ success: false, message, ...(errors ? { errors } : {}) });

module.exports = { ok, created, fail };
