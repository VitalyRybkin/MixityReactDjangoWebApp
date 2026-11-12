export const canChooseExportDirectory = () => typeof window.showDirectoryPicker === 'function'

const zipTime = 0
const zipDate = 0

const crcTable = Array.from({ length: 256 }, (_, i) => {
    let crc = i
    for (let j = 0; j < 8; j += 1) {
        crc = crc & 1 ? 0xedb88320 ^ (crc >>> 1) : crc >>> 1
    }
    return crc >>> 0
})

function crc32(bytes) {
    let crc = 0xffffffff
    for (const byte of bytes) crc = crcTable[(crc ^ byte) & 0xff] ^ (crc >>> 8)
    return (crc ^ 0xffffffff) >>> 0
}

// Standard ZIP archive, UTF-8 filenames, STORE entries (no external libraries).
export async function buildZipBlob(files) {
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

export function buildExportFolderName() {
    const date = new Date()
    const pad = (n) => String(n).padStart(2, '0')
    return `Mixity_документы_${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}_${pad(date.getHours())}-${pad(date.getMinutes())}-${pad(date.getSeconds())}`
}

export function validateExportFileNames(files) {
    const names = new Set()
    for (const file of files) {
        if (!file?.filename || !(file.blob instanceof Blob)) throw new Error('Некорректный файл экспорта')
        if (names.has(file.filename)) throw new Error(`Повторное имя экспортируемого файла: ${file.filename}`)
        names.add(file.filename)
    }
}

// In Chrome this opens *one* folder dialog, then writes all files into a
// new subfolder, avoiding accidental overwrite on repeated exports.
export async function saveFilesInChosenFolder(files, folderName, onProgress = () => {}) {
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
        setTimeout(() => URL.revokeObjectURL(url), 60_000)
    }
}
