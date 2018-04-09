declare var app: any

/**
 * Create a wrapper function that forces SSL on requests in production mode.
 * @param fetch a function that accepts a request and returns an HTTP response
 */
export function forceSSL(fetch: (input: RequestInfo, init?: RequestInit) => Promise<Response>) {
  return function forceSSL(req: Request, opts?: any) {
    const url = new URL(req.url)
    if (app.env != "development" && url.protocol != "https:") {
      url.protocol = "https:"
      url.port = '443'
      console.debug("Redirecting for ssl:", url.toString())
      return new Response("", { status: 301, headers: { location: url.toString() } })
    }
    req.headers.set("x-forwarded-proto", "https")
    return fetch(req, opts)
  }
}

const utilities = {
  forceSSL
}
export default utilities