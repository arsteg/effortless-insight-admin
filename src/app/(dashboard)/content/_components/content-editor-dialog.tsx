'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Loader2 } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useCreateContent, useUpdateContent, useContentDetail } from '@/hooks/use-content'
import type { ContentPage, CreateContentRequest, UpdateContentRequest } from '@/lib/api/admin'

const contentSchema = z.object({
  contentType: z.string().min(1, 'Content type is required'),
  slug: z.string().min(1, 'Slug is required').regex(/^[a-z0-9-]+$/, 'Slug must be lowercase letters, numbers, and hyphens'),
  title: z.string().min(1, 'Title is required'),
  excerpt: z.string().optional(),
  content: z.string().min(1, 'Content is required'),
  category: z.string().optional(),
  isFeatured: z.boolean().optional(),
  allowFeedback: z.boolean().optional(),
  metaTitle: z.string().optional(),
  metaDescription: z.string().optional(),
})

type ContentFormData = z.infer<typeof contentSchema>

interface ContentEditorDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  contentId?: string | null
  defaultContentType?: string
}

export function ContentEditorDialog({
  open,
  onOpenChange,
  contentId,
  defaultContentType = 'faq',
}: ContentEditorDialogProps) {
  const isEditing = !!contentId
  const [activeTab, setActiveTab] = useState('content')

  const { data: existingContent, isLoading: isLoadingContent } = useContentDetail(contentId || '')
  const createMutation = useCreateContent()
  const updateMutation = useUpdateContent()

  const form = useForm<ContentFormData>({
    resolver: zodResolver(contentSchema),
    defaultValues: {
      contentType: defaultContentType,
      slug: '',
      title: '',
      excerpt: '',
      content: '',
      category: '',
      isFeatured: false,
      allowFeedback: true,
      metaTitle: '',
      metaDescription: '',
    },
  })

  // Load existing content when editing
  useEffect(() => {
    if (existingContent && isEditing) {
      form.reset({
        contentType: existingContent.contentType,
        slug: existingContent.slug,
        title: existingContent.title,
        excerpt: existingContent.excerpt || '',
        content: existingContent.content || '',
        category: existingContent.category || '',
        isFeatured: existingContent.isFeatured,
        allowFeedback: existingContent.allowFeedback,
        metaTitle: existingContent.metaTitle || '',
        metaDescription: existingContent.metaDescription || '',
      })
    }
  }, [existingContent, isEditing, form])

  // Reset form when dialog opens for new content
  useEffect(() => {
    if (open && !isEditing) {
      form.reset({
        contentType: defaultContentType,
        slug: '',
        title: '',
        excerpt: '',
        content: '',
        category: '',
        isFeatured: false,
        allowFeedback: true,
        metaTitle: '',
        metaDescription: '',
      })
    }
  }, [open, isEditing, defaultContentType, form])

  const handleSubmit = async (data: ContentFormData) => {
    if (isEditing && contentId) {
      const updateData: UpdateContentRequest = {
        slug: data.slug,
        title: data.title,
        excerpt: data.excerpt || undefined,
        content: data.content,
        category: data.category || undefined,
        isFeatured: data.isFeatured,
        allowFeedback: data.allowFeedback,
        metaTitle: data.metaTitle || undefined,
        metaDescription: data.metaDescription || undefined,
      }
      await updateMutation.mutateAsync({ id: contentId, data: updateData })
    } else {
      const createData: CreateContentRequest = {
        contentType: data.contentType,
        slug: data.slug,
        title: data.title,
        excerpt: data.excerpt || undefined,
        content: data.content,
        category: data.category || undefined,
        isFeatured: data.isFeatured,
        allowFeedback: data.allowFeedback,
        metaTitle: data.metaTitle || undefined,
        metaDescription: data.metaDescription || undefined,
      }
      await createMutation.mutateAsync(createData)
    }
    onOpenChange(false)
  }

  const isSubmitting = createMutation.isPending || updateMutation.isPending

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Content' : 'Create Content'}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? 'Update the content details below.'
              : 'Fill in the details to create new content.'}
          </DialogDescription>
        </DialogHeader>

        {isLoadingContent && isEditing ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="content">Content</TabsTrigger>
                <TabsTrigger value="settings">Settings</TabsTrigger>
                <TabsTrigger value="seo">SEO</TabsTrigger>
              </TabsList>

              <TabsContent value="content" className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="contentType">Content Type</Label>
                    <Select
                      value={form.watch('contentType')}
                      onValueChange={(value) => form.setValue('contentType', value)}
                      disabled={isEditing}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="faq">FAQ</SelectItem>
                        <SelectItem value="help_article">Help Article</SelectItem>
                        <SelectItem value="notice_template">Notification Template</SelectItem>
                      </SelectContent>
                    </Select>
                    {form.formState.errors.contentType && (
                      <p className="text-sm text-destructive">{form.formState.errors.contentType.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="slug">Slug</Label>
                    <Input
                      id="slug"
                      placeholder="my-content-slug"
                      {...form.register('slug')}
                    />
                    {form.formState.errors.slug && (
                      <p className="text-sm text-destructive">{form.formState.errors.slug.message}</p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    placeholder="Enter title"
                    {...form.register('title')}
                  />
                  {form.formState.errors.title && (
                    <p className="text-sm text-destructive">{form.formState.errors.title.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="excerpt">Excerpt</Label>
                  <Textarea
                    id="excerpt"
                    placeholder="Brief description..."
                    rows={2}
                    {...form.register('excerpt')}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="content">Content (Markdown)</Label>
                  <Textarea
                    id="content"
                    placeholder="Write your content in markdown..."
                    rows={10}
                    className="font-mono text-sm"
                    {...form.register('content')}
                  />
                  {form.formState.errors.content && (
                    <p className="text-sm text-destructive">{form.formState.errors.content.message}</p>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="settings" className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Input
                    id="category"
                    placeholder="Enter category"
                    {...form.register('category')}
                  />
                </div>

                <div className="flex items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <Label>Featured</Label>
                    <p className="text-sm text-muted-foreground">
                      Display this content prominently
                    </p>
                  </div>
                  <Switch
                    checked={form.watch('isFeatured')}
                    onCheckedChange={(checked) => form.setValue('isFeatured', checked)}
                  />
                </div>

                <div className="flex items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <Label>Allow Feedback</Label>
                    <p className="text-sm text-muted-foreground">
                      Let users rate this content as helpful
                    </p>
                  </div>
                  <Switch
                    checked={form.watch('allowFeedback')}
                    onCheckedChange={(checked) => form.setValue('allowFeedback', checked)}
                  />
                </div>
              </TabsContent>

              <TabsContent value="seo" className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="metaTitle">Meta Title</Label>
                  <Input
                    id="metaTitle"
                    placeholder="SEO title"
                    {...form.register('metaTitle')}
                  />
                  <p className="text-xs text-muted-foreground">
                    Leave empty to use the content title
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="metaDescription">Meta Description</Label>
                  <Textarea
                    id="metaDescription"
                    placeholder="SEO description"
                    rows={3}
                    {...form.register('metaDescription')}
                  />
                  <p className="text-xs text-muted-foreground">
                    Leave empty to use the excerpt
                  </p>
                </div>
              </TabsContent>
            </Tabs>

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isEditing ? 'Update' : 'Create'}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
