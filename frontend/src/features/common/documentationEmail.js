// Only fresh, complete share-link batches may be included in an email.
export function prepareDocumentationEmail(share, selectedIds) {
    const links = share?.links
    const expiresAt = new Date(share?.expires_at)
    if (!Array.isArray(links) || links.length !== selectedIds.length ||
        !Number.isFinite(expiresAt.getTime()) || expiresAt.getTime() <= Date.now()) {
        throw new Error('Invalid documentation share response')
    }

    const byId = new Map(links.map((link) => [String(link.id), link]))
    if (byId.size !== selectedIds.length) throw new Error('Duplicate documentation share links')

    const linksText = selectedIds.map((id, index) => {
        const link = byId.get(String(id))
        const url = new URL(link?.url)
        if (!['https:', 'http:'].includes(url.protocol) || url.username || url.password || !link.title) {
            throw new Error('Invalid documentation share link')
        }
        return `${index + 1}. ${link.title}\n   ${url.href}`
    }).join('\n\n')

    const subject = `Документация МИКСИТИ (${selectedIds.length})`
    const body = `Здравствуйте,\n\nНаправляем Вам следующие документы:\n\n${linksText}\n\nСсылки действуют до ${expiresAt.toLocaleString('ru-RU')}.\n\nЕсли возникнут вопросы — пожалуйста, дайте знать.\n\nС уважением,`
    return {
        href: `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`,
        expiresAt,
    }
}
