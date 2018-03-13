# One Hostname to Rule them All

This is an example Fly Edge Application for implementing one hostname.

## How it works

Backend types are defined in (src/backends.js). These create a `fetch` like function for proxying requests to a specific origin. Each backend type manages the headers it sets, some origin sources expect certain `host` headers, each needs a different set of `x-forwarded-*` headers.

## Try it out

Install fly, clone this repo, start the server.

```bash
$ npm install -g @fly/fly
$ git clone https://github.com/superfly/onehostname.git
$ cd onehostname
$ fly server
```

And then visit http://localhost:3000 in your browser. Or http://localhost:3000/heroku/. Or something from here: (index.js#L14-L18).