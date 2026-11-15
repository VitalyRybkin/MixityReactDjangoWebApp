import { expect, it } from 'vitest'

import { prepareDocumentationEmail } from './documentationEmail.js'

const link = {
    id: 1,
    title: 'Certificate &bcc=unexpected@example.com',
    url: 'https://example.com/api/common/documentation/shared/signed-token/',
}
const share = { links: [link], expires_at: '2035-01-01T00:00:00Z' }

it('encodes document titles and URLs as email body text rather than mail headers', () => {
    const { href } = prepareDocumentationEmail(share, [1])
    const params = new URLSearchParams(href.split('?')[1])

    expect(params.get('bcc')).toBeNull()
    expect(params.get('body')).toContain(link.title)
    expect(params.get('body')).toContain(link.url)
    expect(params.get('body')).toContain('\n\n')
    expect(params.get('body')).not.toContain('\\n')
})

it.each([
    ['expired links', { ...share, expires_at: '2000-01-01T00:00:00Z' }],
    ['an unselected document', { ...share, links: [{ ...link, id: 2 }] }],
    ['a script URL', { ...share, links: [{ ...link, url: 'javascript:alert(1)' }] }],
    ['an embedded data URL', { ...share, links: [{ ...link, url: 'data:text/html,example' }] }],
    ['credentials in a URL', { ...share, links: [{ ...link, url: 'https://user:password@example.com/file' }] }],
])('does not prepare an email with %s', (_label, response) => {
    expect(() => prepareDocumentationEmail(response, [1])).toThrow()
})

it('rejects duplicate links rather than silently substituting one selected document', () => {
    expect(() => prepareDocumentationEmail({ ...share, links: [link, link] }, [1, 2])).toThrow()
})
