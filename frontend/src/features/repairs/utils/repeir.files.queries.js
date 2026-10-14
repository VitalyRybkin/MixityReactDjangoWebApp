import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import api from '../../../api.js'

import { repairFilesApiPaths } from './repairApiPaths.js'

export const repairFileKeys = {
    all: ['repairFiles'],

    list: (requestId) => [...repairFileKeys.all, 'list', String(requestId)],
}

// --- API ---

export const fetchRepairFiles = async (requestId) => {
    const res = await api.get(repairFilesApiPaths.list(requestId))

    return res.data
}

export const uploadRequestFile = async ({ requestId, file, fileName }) => {
    const formData = new FormData()

    formData.append('file', file)
    formData.append('file_name', fileName || file.name)

    const res = await api.post(repairFilesApiPaths.requestFileListCreate(requestId), formData)

    return res.data
}

export const deleteRequestFile = async ({ requestId, fileId }) => {
    await api.delete(repairFilesApiPaths.requestFileDetail(requestId, fileId))

    return fileId
}

export const uploadClosingFile = async ({ requestId, file, fileName }) => {
    const formData = new FormData()

    formData.append('file', file)
    formData.append('file_name', fileName || file.name)

    const res = await api.post(repairFilesApiPaths.closingFileListCreate(requestId), formData)

    return res.data
}

export const deleteClosingFile = async ({ requestId, fileId }) => {
    await api.delete(repairFilesApiPaths.closingFileDetail(requestId, fileId))

    return fileId
}

// --- HOOKS ---

export function useGetRepairFiles(requestId) {
    return useQuery({
        queryKey: repairFileKeys.list(requestId),
        queryFn: () => fetchRepairFiles(requestId),
        enabled: Boolean(requestId),
    })
}

export function useUploadRequestFile() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: uploadRequestFile,

        onSuccess: async (_, { requestId }) => {
            await queryClient.invalidateQueries({
                queryKey: repairFileKeys.list(requestId),
            })
        },
    })
}

export function useDeleteRequestFile() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: deleteRequestFile,

        onSuccess: async (_, { requestId }) => {
            await queryClient.invalidateQueries({
                queryKey: repairFileKeys.list(requestId),
            })
        },
    })
}

export function useUploadClosingFile() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: uploadClosingFile,

        onSuccess: async (_, { requestId }) => {
            await queryClient.invalidateQueries({
                queryKey: repairFileKeys.list(requestId),
            })
        },
    })
}

export function useDeleteClosingFile() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: deleteClosingFile,

        onSuccess: async (_, { requestId }) => {
            await queryClient.invalidateQueries({
                queryKey: repairFileKeys.list(requestId),
            })
        },
    })
}
