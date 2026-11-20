import { Blob as NodeBlob, Buffer } from 'node:buffer'

import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'

import { buildZipBlob } from './saveExportFiles.js'

// jsdom's Blob lacks arrayBuffer(), which the browser export uses.
beforeAll(() => vi.stubGlobal('Blob', NodeBlob))
afterAll(() => vi.unstubAllGlobals())

describe('ZIP export checksums and bytes', () => {
    it.each([
        ['empty content', new Uint8Array(), 0],
        ['standard CRC-32 vector', new TextEncoder().encode('123456789'), 0xcbf43926],
        ['all byte values', Uint8Array.from({ length: 256 }, (_, index) => index), 0x29058c73],
    ])('writes the expected CRC-32 in both headers for %s', async (_label, content, expectedCrc) => {
        const filename = 'контроль.bin'
        const nameBytes = new TextEncoder().encode(filename)
        const zip = await buildZipBlob([{ filename, blob: new Blob([content]) }])
        const bytes = new Uint8Array(await zip.arrayBuffer())
        const view = new DataView(bytes.buffer)
        const dataOffset = 30 + nameBytes.length
        const centralOffset = dataOffset + content.length

        expect(view.getUint32(14, true)).toBe(expectedCrc)
        expect(view.getUint32(centralOffset + 16, true)).toBe(expectedCrc)
        expect(view.getUint16(6, true)).toBe(0x0800)
        expect(Array.from(bytes.slice(30, dataOffset))).toEqual(Array.from(nameBytes))
        expect(Array.from(bytes.slice(dataOffset, centralOffset))).toEqual(Array.from(content))
    })

    it('keeps the complete archive byte-for-byte identical to the previous exporter', async () => {
        // Captured from HEAD before replacing the CRC table's odd/even check.
        const previousArchive = 'UEsDBBQAAAgAAAAAAAAmOfTLCQAAAAkAAAAUAAAA0LrQvtC90YLRgNC+0LvRjC50eHQxMjM0NTY3ODlQSwECFAAUAAAIAAAAAAAAJjn0ywkAAAAJAAAAFAAAAAAAAAAAAAAAAAAAAAAA0LrQvtC90YLRgNC+0LvRjC50eHRQSwUGAAAAAAEAAQBCAAAAOwAAAAAA'
        const zip = await buildZipBlob([{ filename: 'контроль.txt', blob: new Blob(['123456789']) }])

        expect(Buffer.from(await zip.arrayBuffer()).toString('base64')).toBe(previousArchive)
    })
})
