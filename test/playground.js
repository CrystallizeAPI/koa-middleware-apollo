/* eslint-env mocha */

const sinon = require('sinon')

const { playground } = require('../index')

describe('graphql playground', () => {
  const mockCtx = () => ({
    set: sinon.spy(),
    body: null
  })

  it('passes options to renderPage', async () => {
    const ctx = mockCtx()
    const renderPage = sinon.fake.returns('rendered page')
    const next = sinon.spy()
    const handleRequest = playground(
      { endpoint: '/graph', prop: 'value' },
      { renderPage }
    )

    await handleRequest(ctx, next)

    sinon.assert.calledWith(renderPage, { endpoint: '/graph', prop: 'value' })

    expect(ctx.body).to.equal('rendered page')
  })

  it('sets content type', async () => {
    const ctx = mockCtx()
    const handleRequest = playground({}, { renderPage: sinon.spy() })

    await handleRequest(ctx, sinon.spy())

    sinon.assert.calledOnce(ctx.set)
    sinon.assert.calledWith(ctx.set, 'Content-Type', 'text/html')
  })

  it('passes request context to getEndpoint', async () => {
    const ctx = mockCtx()
    const getEndpoint = sinon.fake.returns('/returned/value')
    const renderPage = sinon.spy()
    const handleRequest = playground({}, { getEndpoint, renderPage })

    await handleRequest(ctx, sinon.spy())

    sinon.assert.calledOnce(getEndpoint)
    sinon.assert.calledWith(getEndpoint, ctx)

    expect(renderPage.args[0][0].endpoint).to.equal('/returned/value')
  })
})
