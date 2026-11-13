// Packages prepared export files as ZIP archives or saves them in a chosen folder.

// Checks whether the browser supports selecting an export directory.
export const canChooseExportDirectory = () => typeof window.showDirectoryPicker === 'function'

const zipTime = 0
const zipDate = 0

const crcTable = Array.from(
    { length: 256 },
    // Precomputes a CRC-32 lookup entry for ZIP checksums.
    (_, i) => {
        let crc = i
        for (let j = 0; j < 8; j += 1) {
            crc = crc & 1 ? 0xedb88320 ^ (crc >>> 1) : crc >>> 1
        }
        return crc >>> 0
    },
)

// Calculates the CRC-32 checksum required by each ZIP entry.
function crc32(bytes) {
    let crc = 0xffffffff
    for (const byte of bytes) crc = crcTable[(crc ^ byte) & 0xff] ^ (crc >>> 8)
    return (crc ^ 0xffffffff) >>> 0
}

// Standard ZIP archive, UTF-8 filenames, STORE entries (no external libraries).
export async function buildZipBlob(files) {
    validateExportFileNames(files)
    if (files.length > 65535) throw new Error('Слишком много файлов для ZIP')
    const encoder = new TextEncoder()
    const localParts = []
    const centralParts = []
    let offset = 0
    let centralSize = 0

    for (const file of files) {
        const nameBytes = encoder.encode(file.filename)
        const data = new Uint8Array(await file.blob.arrayBuffer())
        const size = data.byteLength
        if (size > 0xffffffff || offset + size > 0xffffffff) {
            throw new Error('Объём файлов превышает ограничение ZIP')
        }
        const crc = crc32(data)
        const local = new Uint8Array(30 + nameBytes.length)
        const l = new DataView(local.buffer)
        l.setUint32(0, 0x04034b50, true)
        l.setUint16(4, 20, true)
        l.setUint16(6, 0x0800, true) // UTF-8
        l.setUint16(8, 0, true) // STORE
        l.setUint16(10, zipTime, true)
        l.setUint16(12, zipDate, true)
        l.setUint32(14, crc, true)
        l.setUint32(18, size, true)
        l.setUint32(22, size, true)
        l.setUint16(26, nameBytes.length, true)
        l.setUint16(28, 0, true)
        local.set(nameBytes, 30)
        localParts.push(local, data)

        const central = new Uint8Array(46 + nameBytes.length)
        const c = new DataView(central.buffer)
        c.setUint32(0, 0x02014b50, true)
        c.setUint16(4, 20, true) // made by
        c.setUint16(6, 20, true) // needed
        c.setUint16(8, 0x0800, true)
        c.setUint16(10, 0, true)
        c.setUint16(12, zipTime, true)
        c.setUint16(14, zipDate, true)
        c.setUint32(16, crc, true)
        c.setUint32(20, size, true)
        c.setUint32(24, size, true)
        c.setUint16(28, nameBytes.length, true)
        c.setUint16(30, 0, true)
        c.setUint16(32, 0, true)
        c.setUint16(34, 0, true)
        c.setUint16(36, 0, true)
        c.setUint32(38, 0, true)
        c.setUint32(42, offset, true)
        central.set(nameBytes, 46)
        centralParts.push(central)
        centralSize += central.byteLength
        offset += local.byteLength + data.byteLength
    }

    const end = new Uint8Array(22)
    const e = new DataView(end.buffer)
    e.setUint32(0, 0x06054b50, true)
    e.setUint16(4, 0, true)
    e.setUint16(6, 0, true)
    e.setUint16(8, files.length, true)
    e.setUint16(10, files.length, true)
    e.setUint32(12, centralSize, true)
    e.setUint32(16, offset, true)
    e.setUint16(20, 0, true)
    return new Blob([...localParts, ...centralParts, end], { type: 'application/zip' })
}

// Creates a timestamped folder name for an export batch.
export function buildExportFolderName() {
    const date = new Date()
    // Pads a date or time component to two digits.
    const pad = (n) => String(n).padStart(2, '0')
    return `Mixity_документы_${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}_${pad(date.getHours())}-${pad(date.getMinutes())}-${pad(date.getSeconds())}`
}

// Uses filesystem-safe filenames for ZIP and directory exports. Compare names
// without case or Unicode normalization differences (macOS/Windows behavior).
const filenameEncoder = new TextEncoder()
const MAX_FILENAME_BYTES = 240
const WINDOWS_RESERVED_NAME = /^(?:con|prn|aux|nul|com[1-9]|lpt[1-9])$/i

function exportFilenameParts(filename) {
    const sanitized = filename
        .normalize('NFC')
        .replace(/[<>:"/\\|?*\p{Cc}]/gu, '_')
        .trim()
        .replace(/[. ]+$/g, '')

    if (!sanitized) throw new Error('Некорректное имя экспортируемого файла')

    const dot = sanitized.lastIndexOf('.')
    const extension = dot > 0 ? sanitized.slice(dot) : ''
    let stem = extension ? sanitized.slice(0, dot) : sanitized

    if (WINDOWS_RESERVED_NAME.test(stem)) stem = `_${stem}`
    return { stem, extension }
}

// Keep filenames below common filesystem limits, leaving room for a numeric suffix.
function fitExportFilename(stem, extension, suffix) {
    const limit = MAX_FILENAME_BYTES - filenameEncoder.encode(`${suffix}${extension}`).length
    if (limit < 1) throw new Error('Слишком длинное расширение экспортируемого файла')

    let safeStem = ''
    let used = 0
    for (const character of stem) {
        const size = filenameEncoder.encode(character).length
        if (used + size > limit) break
        safeStem += character
        used += size
    }
    safeStem = safeStem.replace(/[. ]+$/g, '') || 'Документ'
    return `${safeStem}${suffix}${extension}`
}

const filenameComparisonKey = (filename) => filename.normalize('NFD').toLocaleLowerCase('en-US')

// Normalize and uniquely name *all* files, without throwing on collisions.
// Mutates filenames in place intentionally: Home.jsx already calls this helper
// before passing the same `files` array to ZIP or folder export.
export function validateExportFileNames(files) {
    // Validate the whole batch first, so invalid inputs do not partially rename it.
    for (const file of files) {
        if (typeof file?.filename !== 'string' || !file.filename.trim() || !(file.blob instanceof Blob)) {
            throw new Error('Некорректный файл экспорта')
        }
    }

    const used = new Set()
    const newNames = files.map((file) => {
        const { stem, extension } = exportFilenameParts(file.filename)
        let number = 1
        let filename
        do {
            const suffix = number === 1 ? '' : ` (${number})`
            filename = fitExportFilename(stem, extension, suffix)
            number += 1
        } while (used.has(filenameComparisonKey(filename)))

        used.add(filenameComparisonKey(filename))
        return filename
    })

    files.forEach((file, index) => {
        file.filename = newNames[index]
    })
    return files
}

// In Chrome this opens *one* folder dialog, then writes all files into a
// new subfolder, avoiding accidental overwrite on repeated exports.
export async function saveFilesInChosenFolder(
    files,
    folderName,
    // Ignores progress when no callback is supplied.
    onProgress = () => {},
) {
    validateExportFileNames(files)
    const root = await window.showDirectoryPicker({ id: 'mixity-order-export', mode: 'readwrite' })
    const destination = await root.getDirectoryHandle(folderName, { create: true })
    let saved = 0
    for (const file of files) {
        const handle = await destination.getFileHandle(file.filename, { create: true })
        const writable = await handle.createWritable()
        try {
            await writable.write(file.blob)
            await writable.close()
        } catch (error) {
            try {
                await writable.abort()
            } catch {
                /* ignore secondary cleanup error */
            }
            throw error
        }
        saved += 1
        onProgress(saved)
    }
    return saved
}

// Fallback: the user picks the destination of one ZIP file, not each PDF.
export function downloadPreparedZip(zipBlob, folderName) {
    const url = URL.createObjectURL(zipBlob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${folderName}.zip`
    document.body.appendChild(link)
    try {
        link.click()
    } finally {
        link.remove()
        setTimeout(
            // Releases the temporary download URL after the browser has used it.
            () => URL.revokeObjectURL(url),
            60_000,
        )
    }
}
