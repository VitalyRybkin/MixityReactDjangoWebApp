import { act } from 'react'
import { createRoot } from 'react-dom/client'

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { ACCESS_TOKEN, REFRESH_TOKEN } from '../../constants.js'

import DocumentationListPage from './DocumentationList.jsx'
import { createDocumentationShareLinks, useGetDocumentation } from './common.queries.js'

vi.mock('../../components/AppBreadcrumbs.jsx', () => ({ default: () => null }))
vi.mock('./common.queries.js', () => ({
    useGetDocumentation: vi.fn(),
    createDocumentationShareLinks: vi.fn(),
    fetchDocumentationDetail: vi.fn(),
}))

const DOCUMENTS = [1, 2, 3].map((id) => ({
    id,
    title: `Документ ${id}`,
    tag: 'МИКСИТИ',
    public_url: `https://mixity.example/api/common/documentation/${id}/`,
}))
const EXPIRES_AT = '2035-07-08T12:30:00Z'
const signedUrl = (id) => `https://mixity.example/api/common/documentation/shared/signed-document-${id}/`
const shareResult = (ids = [1]) => ({
    links: ids.map((id) => ({ id, title: DOCUMENTS.find((doc) => doc.id === id).title, url: signedUrl(id) })),
    expires_at: EXPIRES_AT,
})

const deferred = () => {
    let resolve
    let reject
    const promise = new Promise((resolvePromise, rejectPromise) => {
        resolve = resolvePromise
        reject = rejectPromise
    })
    return { promise, resolve, reject }
}

let container
let root

const sendButton = () => {
    const labeled = container.querySelector('[aria-label="Отправить"], [aria-label^="Подготовка ссылок"]')
    return labeled?.matches('button') ? labeled : labeled?.querySelector('button')
}
const preparedEmail = () => document.querySelector('a[href^="mailto:"]')
const emailBody = () => new URLSearchParams(preparedEmail().getAttribute('href').split('?')[1]).get('body')

const selectDocument = async (id) => {
    const title = DOCUMENTS.find((doc) => doc.id === id).title
    const row = [...container.querySelectorAll('tbody tr')].find((element) => element.textContent.includes(title))
    await act(async () => row.querySelector('input[type="checkbox"]').click())
}

const prepareEmail = async () => {
    await act(async () => sendButton().click())
}

beforeEach(async () => {
    vi.mocked(createDocumentationShareLinks).mockReset()
    vi.mocked(useGetDocumentation).mockReturnValue({ data: DOCUMENTS, isPending: false, error: null })
    localStorage.clear()
    localStorage.setItem(ACCESS_TOKEN, 'private-access-jwt')
    localStorage.setItem(REFRESH_TOKEN, 'private-refresh-jwt')
    container = document.createElement('div')
    document.body.appendChild(container)
    root = createRoot(container)
    await act(async () => root.render(<DocumentationListPage />))
})

afterEach(async () => {
    await act(async () => root.unmount())
    container.remove()
    localStorage.clear()
})

describe('preparing documentation email', () => {
    it('disables sending without selected documents', async () => {
        expect(sendButton().disabled).toBe(true)

        await prepareEmail()

        expect(createDocumentationShareLinks).not.toHaveBeenCalled()
        expect(preparedEmail()).toBeNull()
    })

    it('offers a direct email link containing only fresh selected share URLs and their expiry', async () => {
        vi.mocked(createDocumentationShareLinks).mockResolvedValue(shareResult([1, 2]))
        await selectDocument(1)
        await selectDocument(2)

        await prepareEmail()

        expect(createDocumentationShareLinks).toHaveBeenCalledExactlyOnceWith([1, 2])
        expect(preparedEmail().textContent).toContain('Открыть письмо')
        const body = emailBody()
        expect(body).toContain(signedUrl(1))
        expect(body).toContain(signedUrl(2))
        expect(body).not.toContain(signedUrl(3))
        expect(body).not.toContain(DOCUMENTS[2].title)
        expect(body).toMatch(/действ|срок|истек|истеч/i)
        expect(body).toContain('2035')
        for (const doc of DOCUMENTS) expect(body).not.toContain(doc.public_url)
        expect(body).not.toContain('private-access-jwt')
        expect(body).not.toContain('private-refresh-jwt')
    })

    it('prepares one request for the selection snapshot and ignores repeated busy clicks', async () => {
        const pending = deferred()
        vi.mocked(createDocumentationShareLinks).mockReturnValue(pending.promise)
        await selectDocument(1)
        await prepareEmail()
        expect(sendButton().disabled).toBe(true)
        await prepareEmail()
        await selectDocument(2)
        expect(preparedEmail()).toBeNull()

        await act(async () => pending.resolve(shareResult([1])))

        expect(createDocumentationShareLinks).toHaveBeenCalledExactlyOnceWith([1])
        expect(emailBody()).toContain(signedUrl(1))
        expect(emailBody()).not.toContain(signedUrl(2))
        expect(emailBody()).not.toContain(DOCUMENTS[1].title)
    })

    it('shows an error without preparing an email when link creation fails', async () => {
        vi.mocked(createDocumentationShareLinks).mockRejectedValue(new Error('Share request failed'))
        await selectDocument(1)

        await prepareEmail()

        expect(preparedEmail()).toBeNull()
        expect(document.querySelector('[role="alert"]')?.textContent).toMatch(/не удалось/i)
        expect(sendButton().disabled).toBe(false)
    })

    it.each([
        ['the selected document link', { ...shareResult(), links: [] }],
        ['the expiration time', { links: shareResult().links }],
    ])('rejects a response missing %s', async (_label, response) => {
        vi.mocked(createDocumentationShareLinks).mockResolvedValue(response)
        await selectDocument(1)

        await prepareEmail()

        expect(preparedEmail()).toBeNull()
        expect(document.querySelector('[role="alert"]')?.textContent).toMatch(/не удалось/i)
    })
})
