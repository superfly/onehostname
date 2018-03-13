# One Hostname to Rule them All

This is an example Fly Edge Application for implementing one hostname.

## How it works

Backend types are defined in (src/backends.js). These create a `fetch` like function for proxying requests to a specific origin. Each backend type manages the headers it sets, some origin sources expect certain `host` headers, each needs a different set of `x-forwarded-*` headers.