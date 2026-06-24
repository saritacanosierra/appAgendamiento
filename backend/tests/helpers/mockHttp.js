/** Mock minimo de res.json / res.status para middlewares. */
export function crearMockRes() {
  const res = {
    statusCode: 200,
    body: null,
    headers: {},
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.body = payload;
      return this;
    },
    setHeader(name, value) {
      this.headers[name] = value;
    },
  };
  return res;
}

export function crearMockReq(overrides = {}) {
  return {
    body: {},
    query: {},
    params: {},
    headers: {},
    ip: '127.0.0.1',
    originalUrl: '/api/admin/test',
    ...overrides,
  };
}

export function crearMockNext() {
  let called = false;
  let error = null;
  const next = (err) => {
    called = true;
    error = err ?? null;
  };
  next.wasCalled = () => called;
  next.getError = () => error;
  return next;
}
