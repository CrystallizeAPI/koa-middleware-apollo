/* eslint-env mocha */

const sinon = require('sinon')
const { HttpQueryError } = require('apollo-server-core')
const { expectAsyncError } = require('@tailored-apps/helpers/chai')

const { graphqlServer } = require('../index')

describe('graphql server middleware', () => {
  const mockCtx = (method = 'POST') => ({
    headers: {},
    request: { method, body: { reqBody: true } },
    req: { isReqObject: true },
    set: function (header, value) {
      this.headers[header] = value
    },
    status: null,
    body: null
  })

  const mockApollo = () => ({
    graphQLServerOptions: sinon.fake.resolves({ option: 'value' })
  })

  describe('query handling', () => {
    it('passes options to query runner', async () => {
      const ctx = mockCtx()
      const runQuery = sinon.fake.resolves({})
      const apollo = mockApollo()
      const getRequest = sinon.fake(ctx => ctx.req)
      const next = sinon.spy()
      const handleRequest = graphqlServer(apollo, {
        runQuery,
        getRequest
      })

      await handleRequest(ctx, next)

      sinon.assert.calledOnce(next)
      sinon.assert.calledOnce(runQuery)
      sinon.assert.calledWith(runQuery, [ctx], {
        options: { option: 'value' },
        method: 'POST',
        query: { reqBody: true },
        request: { isReqObject: true }
      })
    })

    it('sets response headers', async () => {
      const ctx = mockCtx()
      const runQuery = sinon.fake.resolves({
        responseInit: { headers: { first: 'header 1', second: 'header 2' } }
      })

      const handleRequest = graphqlServer(mockApollo(), {
        runQuery,
        getOptions: sinon.spy(),
        getRequest: sinon.spy()
      })

      await handleRequest(ctx, sinon.spy())

      expect(ctx.headers).to.deep.equal({
        first: 'header 1',
        second: 'header 2'
      })
    })

    it('sets response body', async () => {
      const ctx = mockCtx()
      const runQuery = sinon.fake.resolves({
        graphqlResponse: { prop: 'value' }
      })
      const handleRequest = graphqlServer(mockApollo(), {
        runQuery,
        getOptions: sinon.spy(),
        getRequest: sinon.spy()
      })

      await handleRequest(ctx, sinon.spy())

      expect(ctx.body).to.deep.equal({ prop: 'value' })
    })
  })

  describe('error handling', () => {
    it('rethrows errors other than HttpQueryError', async () => {
      const runQuery = sinon.fake.rejects(new Error('Generic error'))
      const handleRequest = graphqlServer(mockApollo(), {
        runQuery,
        getOptions: sinon.spy(),
        getRequest: sinon.spy()
      })

      await expectAsyncError(
        () => handleRequest(mockCtx(), sinon.spy()),
        'Generic error'
      )
    })

    it('handles HttpQueryErrors', async () => {
      const err = new HttpQueryError(1234, 'Http query error', true, {
        queryErrorHeader: 'header value'
      })

      const ctx = mockCtx()
      const runQuery = sinon.fake.rejects(err)
      const handleRequest = graphqlServer(mockApollo(), {
        runQuery,
        getOptions: sinon.spy(),
        getRequest: sinon.spy()
      })

      await handleRequest(ctx, sinon.spy())

      expect(ctx.status).to.equal(1234)
      expect(ctx.body).to.equal('Http query error')
      expect(ctx.headers).to.deep.equal({
        queryErrorHeader: 'header value'
      })
    })
  })
})
