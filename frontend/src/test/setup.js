import { vi } from 'vitest'

// Use browser storage even when Node exposes its own experimental localStorage.
vi.stubGlobal('localStorage', globalThis.jsdom.window.localStorage)
globalThis.IS_REACT_ACT_ENVIRONMENT = true
