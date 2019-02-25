# koa-middleware-apollo

Apollo server implementation that uses the traditional koa middleware pattern. Heavily inspired by [apollo-server-koa](https://github.com/apollographql/apollo-server/tree/master/packages/apollo-server-koa).

_This package is a work in progress and currently does not support file uploads or GraphQL subscriptions._

## Motivation
While the official implementation of the Apollo GraphQL server for koa, the [apollo-server-koa](https://github.com/apollographql/apollo-server/tree/master/packages/apollo-server-koa) package mentioned above, provides an easy way to get a GraphQL server up and running, it does not work the same way that other koa middleware does. Rather than adding a middleware function to the koa stack (via `app.use()`), `apollo-server-koa` exposes an `applyMiddleware` function on an instance of the `ApolloServer` class (see package documentation for further details). This can be problematic if you, for instance, want to use path parameters for your GraphQL endpoint (e.g. `/graph/:clientId`).

`@crystallize/koa-middleware-apollo` exports middleware functions that integrate seamlessly into any koa middleware stack, thus providing better interoperability and allowing for greater customizability.   

### Batteries not Included
Since our aim is to integrate as seamlessly as possible into any middleware stack, we make as few assumptions as reasonably possible. Therefore, `@crystallize/koa-middleware-apollo` does not include a bodyparser, a router or anything other than the basic tools to run a GraphQL server. Contrary to `apollo-server-koa`, it also does not export [graphql-tools](https://github.com/apollographql/graphql-tools) or [apollo-server-core](https://www.npmjs.com/package/apollo-server-core), which means you will have to add that to your dependencies manually if you intend to use functionality provided by these packages (e.g. `makeExecutableSchema` or `gql` respectively).  

## Installation
```
yarn add @crystallize/koa-middleware-apollo
```

## Basic GraphQL Server
### `basicGraphqlServer(options[, dependencies]) -> Function`
Returns middleware for a basic GraphQL server (implemented using `ApolloServerBase` from the [apollo-server-core](https://www.npmjs.com/package/apollo-server-core) package).

* `options`: Configuration object that will be passed to the `ApolloServerBase` constructor
* `dependencies` (optional): Allows for deeper customization of middleware behavior using dependency injection for various functions (default implementations shown here):
  * `getMethod`: `ctx => ctx.request.method`
  * `getQuery`: `ctx => ctx.request.body`
  * `runQuery`: `runHttpQuery` (from `apollo-server-core`)
  * `getOptions`: `ctx => apollo.graphQLServerOptions({ ctx })` (from `apollo-server-core`)
  * `getRequest`: `ctx => convertNodeHttpToRequest(ctx.req)`

#### Example
```js
const { basicGraphqlServer } = require('@crystallize/koa-middleware-apollo')

const app = require('./app')
const schema = require('./schema')

const middleware = basicGraphqlServer({
  schema,
  debug: true,
  context: ({ ctx }) => {
   const { user } = ctx.state

   return { user }
  }
})

app.use(middleware)
```

### `graphqlServer(apollo[, dependencies]) -> Function`
Returns middleware for a custom GraphQL server instance.

* `apollo`: Instance of an `ApolloServer` class
* `dependencies` (optional): See above

## GraphQL Playground
### `graphqlPlayground(options[, dependencies]) -> Function`
Returns middleware for rendering a [GraphQL playground](https://www.apollographql.com/docs/apollo-server/features/graphql-playground.html) via the [@apollographql/graphql-playground-html](https://www.npmjs.com/package/@apollographql/graphql-playground-html) package.

* `options`: Configuration object that will be passed directly to the playground render function. See [docs](https://github.com/prisma/graphql-playground#usage) for available options
* `dependencies` (optional):
  * `getEndpoint`: Returns the GraphQL server endpoint. Will receive koa `ctx` as its only parameter. Defaults to `options.endpoint`.
  
# Full Example
This is a close to real life example implementation of a basic GraphQL server at an endpoint that makes use of a path parameter.

 ```js
 const Koa = require('koa')
 const Router = require('koa-router')
 const { basicGraphqlServer, graphqlPlayground } = require('@crystallize/koa-middleware-apollo')
 
 const schema = require('./schema')
 
 const router = new Router()
 
 router.post('/graph/:clientId', basicGraphqlServer({
   schema,
   context: ({ ctx }) => {
     const { clientId } = ctx.params
     
     return { clientId }
   }
 }))
 
 router.get('/graph/:clientId', graphqlPlayground({
   'editor.theme': 'light'
 }, {
   getEndpoint: ctx => `/graph/${ctx.params.clientId}`
 }))
 
 const app = new Koa()
 
 app
   .use(router.routes())
 
 app.listen(process.env.PORT || 3000)
 ```

# Author
[Michael Smesnik](https://github.com/daerion) at [crystallize](https://crystallize.com)

# License
MIT
