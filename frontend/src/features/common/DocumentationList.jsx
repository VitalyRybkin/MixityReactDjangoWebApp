import React, { useState } from 'react'

import {
    Box,
    Checkbox,
    CircularProgress,
    Divider,
    Stack,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Typography,
} from '@mui/material'

import api from '../../api.js'
import AppBreadcrumbs from '../../components/AppBreadcrumbs.jsx'
import ErrorState from '../../components/ui/ErrorState.jsx'
import DownloadAction from '../../components/ui/buttons/DownloadAction.jsx'
import EmailLink from '../../components/ui/buttons/EmailLink.jsx'
import AppSnackbar from '../../components/ui/feedback/AppSnackbar.jsx'
import useSnackbar from '../../hooks/useSnackbar.js'

import { fetchDocumentationDetail, useGetDocumentation } from './common.queries.js'
import { documentationApiPaths } from './documentationApiPaths.js'

export default function DocumentationListPage() {
    const { data: documentation = [], isPending, error, refetch } = useGetDocumentation()

    const normalizedDocs = documentation.map((doc) => ({
        ...doc,
        tags: Array.isArray(doc.tag) ? doc.tag : doc.tag ? [doc.tag] : [],
    }))

    const uniqueTags = [...new Set(normalizedDocs.flatMap((doc) => doc.tags))]
    const [selectedDocs, setSelectedDocs] = useState([])

    const handleSelect = (id) => {
        setSelectedDocs((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]))
    }

    const [downloadLoading, setDownloadLoading] = useState(false)

    const { snack, showSnackbar, closeSnackbar } = useSnackbar()

    const handleDownloadAll = async () => {
        if (!selectedDocs.length) return

        setDownloadLoading(true)

        try {
            const response = await api.post(
                documentationApiPaths.downloadZip(),
                { ids: selectedDocs },
                { responseType: 'blob' },
            )

            const blob = new Blob([response.data], { type: 'application/zip' })
            const url = window.URL.createObjectURL(blob)

            const link = document.createElement('a')
            link.href = url
            link.download = 'documents.zip'
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)

            window.URL.revokeObjectURL(url)
        } catch {
            showSnackbar('Не удалось скачать документы.', 'error')
        } finally {
            setDownloadLoading(false)
        }
    }

    const handleViewDocument = async (doc) => {
        try {
            const blob = await fetchDocumentationDetail(doc.id)
            const blobUrl = URL.createObjectURL(blob)

            window.open(blobUrl, '_blank', 'noopener,noreferrer')

            setTimeout(() => {
                URL.revokeObjectURL(blobUrl)
            }, 60_000)
        } catch {
            showSnackbar('Не удалось открыть документ.', 'error')
        }
    }

    const handleSendEmail = () => {
        if (!selectedDocs.length) return

        const linksText = selectedDocs
            .map((id, index) => {
                const doc = documentation.find((d) => d.id === id)
                if (!doc) return null

                return `${index + 1}. ${doc.title}\n   ${doc.public_url}`
            })
            .filter(Boolean)
            .join('\n\n')

        const subject = `Документация МИКСИТИ (${selectedDocs.length})`

        const body = `Здравствуйте,

            Направляем Вам следующие документы:
            
            ${linksText}
            
            Если возникнут вопросы — пожалуйста, дайте знать.
            
            С уважением,`.trim()

        window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
    }

    return (
        <Box sx={{ p: 3 }}>
            <AppBreadcrumbs />

            <Box sx={{ p: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="h4">Документация</Typography>
                {downloadLoading && <CircularProgress size={20} />}

                <Stack direction="row" spacing={2}>
                    <EmailLink title="Отправить" onClick={handleSendEmail} />
                    <DownloadAction onClick={handleDownloadAll} />
                </Stack>
            </Box>

            <Divider sx={{ mb: 3 }} />
            {error ? (
                <ErrorState error={error} onRetry={refetch} loading={isPending} />
            ) : isPending ? (
                <Box sx={{ py: 6, display: 'flex', justifyContent: 'center' }}>
                    <CircularProgress />
                </Box>
            ) : (
                <TableContainer>
                    <Table sx={{ minWidth: 800 }}>
                        {uniqueTags.map((tag) => {
                            const filteredDocs = normalizedDocs.filter((doc) => doc.tags.includes(tag))
                            const allSelectedInTag = filteredDocs.every((d) => selectedDocs.includes(d.id))

                            if (filteredDocs.length === 0) return null

                            return (
                                <React.Fragment key={tag}>
                                    <TableHead sx={{ bgcolor: 'action.hover' }}>
                                        <TableRow>
                                            <TableCell padding="checkbox">
                                                <Checkbox
                                                    indeterminate={
                                                        selectedDocs.some((id) =>
                                                            filteredDocs.map((d) => d.id).includes(id),
                                                        ) && !allSelectedInTag
                                                    }
                                                    checked={allSelectedInTag}
                                                    onChange={() => {
                                                        const ids = filteredDocs.map((d) => d.id)
                                                        if (allSelectedInTag) {
                                                            setSelectedDocs((prev) =>
                                                                prev.filter((id) => !ids.includes(id)),
                                                            )
                                                        } else {
                                                            setSelectedDocs((prev) =>
                                                                Array.from(new Set([...prev, ...ids])),
                                                            )
                                                        }
                                                    }}
                                                />
                                            </TableCell>
                                            <TableCell colSpan={2} sx={{ fontWeight: 700 }}>
                                                {tag}
                                            </TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {filteredDocs.map((doc) => (
                                            <TableRow
                                                key={doc.id}
                                                hover
                                                onClick={() => handleViewDocument(doc)}
                                                sx={{ cursor: 'pointer' }}
                                            >
                                                <TableCell padding="checkbox">
                                                    <Checkbox
                                                        checked={selectedDocs.includes(doc.id)}
                                                        onChange={(e) => {
                                                            e.stopPropagation()
                                                            handleSelect(doc.id)
                                                        }}
                                                        onClick={(e) => e.stopPropagation()}
                                                    />
                                                </TableCell>
                                                <TableCell>{doc.title || 'Без названия'}</TableCell>
                                                <TableCell>{doc.status || '-'}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </React.Fragment>
                            )
                        })}
                    </Table>
                </TableContainer>
            )}

            <AppSnackbar open={snack.open} message={snack.message} severity={snack.severity} onClose={closeSnackbar} />
        </Box>
    )
}
