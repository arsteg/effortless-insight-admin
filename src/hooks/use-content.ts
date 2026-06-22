'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { adminApi, type ContentPage, type CreateContentRequest, type UpdateContentRequest } from '@/lib/api/admin'

export const contentKeys = {
  all: ['content'] as const,
  lists: () => [...contentKeys.all, 'list'] as const,
  list: (params?: { contentType?: string; status?: string; category?: string; search?: string; page?: number }) =>
    [...contentKeys.lists(), params] as const,
  details: () => [...contentKeys.all, 'detail'] as const,
  detail: (id: string) => [...contentKeys.details(), id] as const,
  categories: (contentType?: string) => [...contentKeys.all, 'categories', contentType] as const,
}

export function useContent(params?: {
  contentType?: string
  status?: string
  category?: string
  search?: string
  page?: number
  pageSize?: number
}) {
  return useQuery({
    queryKey: contentKeys.list(params),
    queryFn: () => adminApi.content.list(params),
    placeholderData: (previousData) => previousData,
  })
}

export function useContentDetail(id: string) {
  return useQuery({
    queryKey: contentKeys.detail(id),
    queryFn: () => adminApi.content.get(id),
    enabled: !!id,
  })
}

export function useContentCategories(contentType?: string) {
  return useQuery({
    queryKey: contentKeys.categories(contentType),
    queryFn: () => adminApi.content.getCategories(contentType),
  })
}

export function useCreateContent() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateContentRequest) => adminApi.content.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: contentKeys.lists() })
      toast.success('Content created successfully')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create content')
    },
  })
}

export function useUpdateContent() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateContentRequest }) =>
      adminApi.content.update(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: contentKeys.lists() })
      queryClient.invalidateQueries({ queryKey: contentKeys.detail(variables.id) })
      toast.success('Content updated successfully')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update content')
    },
  })
}

export function usePublishContent() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => adminApi.content.publish(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: contentKeys.lists() })
      queryClient.invalidateQueries({ queryKey: contentKeys.detail(id) })
      toast.success('Content published successfully')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to publish content')
    },
  })
}

export function useArchiveContent() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => adminApi.content.archive(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: contentKeys.lists() })
      queryClient.invalidateQueries({ queryKey: contentKeys.detail(id) })
      toast.success('Content archived successfully')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to archive content')
    },
  })
}

export function useDeleteContent() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => adminApi.content.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: contentKeys.lists() })
      toast.success('Content deleted successfully')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete content')
    },
  })
}
