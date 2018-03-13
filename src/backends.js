const backends = {
  heroku
}
export default backends

/**
 * 
 * Creates a Heroku application backend.
 * @param {string} appName The Heroku application name 
 */
export const heroku = function (appName) {
  return function (req) {
    const herokuApp = `${appName}.herokuapp.com`
    const override = {
      protocol: "https:",
      hostname: herokuApp,
      port: 443,
    }
    const breq = createProxyRequest(req, { url: override })
    breq.headers.set("host", herokuApp)
    breq.headers.set("x-forwarded-host", req.headers.get("host"))
    return fetch(breq)
  }
}

export const surge = function (subdomain) {
  return function (req) {
    const surgeHost = `${subdomain}.surge.sh`
    const override = {
      protocol: "https:",
      hostname: surgeHost,
      port: 443
    }
    const breq = createProxyRequest(req, { url: override })
    breq.headers.set('host', surgeHost)
    breq.headers.delete('x-forwarded-host') // surge doesn't like this
    return fetch(breq)
  }
}

/**
 * Convert a request into a new request for proxying, add appropriate headers, adjust URL with rewrites
 * @param {Request} req The original Request to adapt for proxying 
 * @param {Object} [rewrite] Options for rewriting the request when it goes to a backend 
 */
function createProxyRequest(req, rewrite) {
  let oreq = null
  if (req instanceof Request) {
    oreq = req.clone()
  }
  if (!req) {
    throw "fetch(req) must be either a string or Request object"
  }
  if (typeof oreq.url === 'string') {
    oreq.url = new URL(oreq.url)
  }

  oreq.headers.set("x-forwarded-for", req.remoteAddr)
  oreq.headers.set("x-forwarded-proto", req.protocol.substring(0, req.protocol.length - 1)) // because http: isn't right
  oreq.headers.set("x-forwarded-host", req.hostname)

  if (rewrite && rewrite.url) {
    for (const k of Object.getOwnPropertyNames(rewrite.url)) {
      oreq.url[k] = rewrite.url[k]
    }
  }
  if (rewrite && rewrite.method) {
    oreq.method = rewrite.method
  }
  return oreq
}