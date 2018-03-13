import backends from './src/backends'

/**
 * Specify handlers to use during requests. These are just function references,
 * with the same params: `(req:Request) -> Response`.
 */
const handlers = [
  forceSSL,
  routeMounts
]

/**
 * Response to http requests. First loop through the handlers above,
 * if none of them return a response send a 404.
 */
fly.http.respondWith(async (req) => {
  let resp = null
  for (const h of handlers) {
    resp = h(req)
    if (resp) return resp
  }

  return new Response("not found", { status: 404 })
})

/**
 * This is a mount mapping: `/path => fetch(req)`
 * Several of these use prebuilt backend types, `backends.heroku(name)` just
 * returns a specific `fetch` function that handles all the proxy headers (and more).
 */
const mounts = {
  '/example': backends.generic("https://example.com", { 'host': "example.com" }),
  '/heroku': backends.heroku("example"),
  '/surge': backends.surge("onehostname"),
  '/debug': debug,
  '/': backends.githubPages("superfly/onehostname-comic")
}
async function routeMounts(req) {
  const url = new URL(req.url)
  for (const path of Object.getOwnPropertyNames(mounts)) {
    const trailingSlash = path[path.length - 1] === '/'
    const backend = mounts[path]
    // handle mounts that end in a trailing slash
    if (trailingSlash && url.pathname.startsWith(path)) {
      return await backend(req, path)
    }

    // handle /path
    if (url.pathname === path || url.pathname.startsWith(path + "/")) {
      return await backend(req, path)
    }
  }
  return null
}

/* Sometimes it's nice to see exactly what the app is getting. */
function debug(req) {
  const info = {
    request: {
      headers: req.headers.toJSON(),
      url: req.url
    },
    app: app
  }
  return new Response(JSON.stringify(info), { headers: { "content-type": "application/json" } })
}

/**
 * If we're not running in development, we always want to redirect people to 
 * https
 */
function forceSSL(req) {
  const url = new URL(req.url)
  if (app.env != "development" && url.protocol != "https:") {
    url.protocol = "https:"
    url.port = 443
    return new Response("", { status: 301, headers: { location: url.toString() } })
  }
  return null
}