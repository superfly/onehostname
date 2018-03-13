import backends from './src/backends'

fly.http.respondWith(async (req) => {
  let resp = await routeMounts(req)

  if (resp) {
    return resp
  }

  return new Response("not found", { status: 404 })
})

const mounts = {
  '/': backends.githubPages("superfly/onehostname-comic"),
  '/example': backends.generic("https://example.com", { 'host': "example.com" }),
  '/heroku': backends.heroku("example"),
  '/surge': backends.surge("onehostname")
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