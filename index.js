const {
  ApolloServerBase,
  convertNodeHttpToRequest,
  runHttpQuery
} = require('apollo-server-core')

const basicGraphqlServer = (config, dependencies) =>
  graphqlServer(new ApolloServerBase(config), dependencies)

const graphqlServer = (apollo, dependencies = {}) => {
  const setHeadersFromObject = (obj, ctx) => {
    if (
      typeof obj === 'object' &&
      typeof obj.headers === 'object' &&
      !!obj.headers
    ) {
      Object.entries(obj.headers).forEach(([header, value]) => {
        ctx.set(header, value)
      })
    }
  }

  const {
    getMethod = ctx => ctx.request.method,
    getQuery = ctx => ctx.request.body,
    runQuery = runHttpQuery,
    getOptions = ctx => apollo.graphQLServerOptions({ ctx }),
    getRequest = ctx => convertNodeHttpToRequest(ctx.req)
  } = dependencies

  return async (ctx, next) => {
    try {
      const { graphqlResponse, responseInit } = await runQuery([ctx], {
        options: await getOptions(ctx),
        method: await getMethod(ctx),
        query: await getQuery(ctx),
        request: await getRequest(ctx)
      })

      setHeadersFromObject(responseInit, ctx)

      ctx.body = graphqlResponse
    } catch (e) {
      if (e.name !== 'HttpQueryError') {
        throw e
      }

      setHeadersFromObject(e, ctx)

      ctx.status = e.statusCode
      ctx.body = e.message
    }

    return next()
  }
}

module.exports = {
  basicGraphqlServer,
  graphqlServer
}
