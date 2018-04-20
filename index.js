import backends from './lib/backends'
import { forceSSL } from './lib/utilities'

/**
 * Specify handler to use during requests. We can do basic middleware by
 * wrapping fetch like functions.
 */
const handler = forceSSL(routeMounts)

/**
 * Respond to HTTP requests with the handler defined above
 */
fly.http.respondWith(handler)

/**
 * This is a mount mapping: `/path => fetch(req)`
 * Several of these use prebuilt backend types, `backends.heroku(name)` just
 * returns a specific `fetch` function that handles all the proxy headers (and more).
 */
const mounts = {
  '/example': backends.generic("https://example.com", { 'host': "example.com" }),
  '/glitch': backends.glitch("fly-example"),
  '/heroku': backends.heroku("example"),
  '/surge': backends.surge("onehostname"),
  '/unmarkdocs': backends.unmarkdocs("onehostname"),
  '/ghost': backends.ghost("newblog", {
    customDomain: "blog.ghost.org",
    basePath: "/ghost/",
    keepCanonical: true
  }),
  '/debug': debug,
  '/': backends.githubPages("superfly/onehostname-comic")
}

async function routeMounts(req) {
  const url = new URL(req.url)
  for (const path of Object.getOwnPropertyNames(mounts)) {
    const trailingSlash = path[path.length - 1] === '/'
    const backend = mounts[path]
    const basePath = path + (!trailingSlash && "/" || "")
    // handle mounts that end in a trailing slash
    if (trailingSlash && url.pathname.startsWith(path)) {
      return await backend(req, basePath)
    }

    // handle /path
    if (url.pathname === path || url.pathname.startsWith(path + "/")) {
      return await backend(req, basePath)
    }
  }
  return new Response("not found", { status: 404 })
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
