declare var fly: any
declare var Document: any

import { Fetchable } from './backends'

export interface RewriteOptions {
  prefixes: string[][],
  excludeCanonical?: boolean
}
export interface Prefixes {
  [key: string]: string
}
function prefixUrl(v: string, prefix: string, replace: string) {
  if (v.startsWith(prefix)) {
    v = replace + v.substring(prefix.length)
  }
  return v
}

//
function prefixStyleUrl(v: string, prefix: string, replacement: string) {
  const s = `url(${prefix}`
  const r = `url(${replacement}`
  v = v.replace(s, r)
  return v
}
const linkAttributes = [
  { a: "href", fn: prefixUrl },
  { a: "src", fn: prefixUrl },
  { a: "style", fn: prefixStyleUrl }
]

export function rewriteLinks(fetch: Fetchable, opts: RewriteOptions): Fetchable {
  return async function rewriteLinks(req, init?) {
    console.log("rewriting links")
    if (req instanceof Request) {
      req.headers.delete("accept-encoding") // don't want gzip
    }
    let resp = await fetch(req, init)

    let contentType = resp.headers.get("content-type")
    if (!contentType || !contentType.includes("text/html")) {
      // we only care about html right now
      return resp
    }
    resp.headers.delete("content-length") // this'll change
    const body = await resp.text()
    const doc = Document.parse(body)

    const selector = linkAttributes.map((l) => `[${l.a}]`).join(",")
    const prefixes = opts.prefixes
    for (const tag of doc.querySelectorAll(selector)) {
      if (opts.excludeCanonical && tag.getAttribute("rel") === "canonical") continue
      for (const l of linkAttributes) {
        const a = l.a
        let v = tag.getAttribute(a)
        // ignore blank or protocol relative urls
        if (!v || typeof v !== "string") continue
        const fn = l.fn
        for (const p of prefixes) {
          let replace = p[1]
          let done = fn(v, p[0], replace)
          if (v != done) {
            tag.setAttribute(a, done)
            continue
          }
        }
      }
    }

    return new Response(doc.documentElement.outerHTML, resp)
  }
}