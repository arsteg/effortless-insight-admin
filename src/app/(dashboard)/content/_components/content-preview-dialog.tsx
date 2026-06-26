'use client'

import { Loader2, Globe, Clock, Eye, ThumbsUp, ThumbsDown } from 'lucide-react'
import { format } from 'date-fns'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useContentDetail } from '@/hooks/use-content'

interface ContentPreviewDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  contentId: string | null
}

export function ContentPreviewDialog({
  open,
  onOpenChange,
  contentId,
}: ContentPreviewDialogProps) {
  const { data: content, isLoading } = useContentDetail(contentId || '')

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'published':
        return (
          <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
            <Globe className="mr-1 h-3 w-3" />
            Published
          </Badge>
        )
      case 'draft':
        return (
          <Badge variant="secondary">
            <Clock className="mr-1 h-3 w-3" />
            Draft
          </Badge>
        )
      case 'archived':
        return (
          <Badge variant="secondary" className="bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400">
            Archived
          </Badge>
        )
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Content Preview</DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : content ? (
          <ScrollArea className="max-h-[70vh] pr-4">
            <div className="space-y-6">
              {/* Header */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 flex-wrap">
                  {getStatusBadge(content.status)}
                  {content.isFeatured && (
                    <Badge variant="outline" className="text-yellow-600 border-yellow-600">
                      Featured
                    </Badge>
                  )}
                  <Badge variant="outline">{content.contentType.replace('_', ' ')}</Badge>
                  {content.category && (
                    <Badge variant="outline">{content.category}</Badge>
                  )}
                </div>
                <h1 className="text-2xl font-bold">{content.title}</h1>
                {content.excerpt && (
                  <p className="text-muted-foreground">{content.excerpt}</p>
                )}
              </div>

              <Separator />

              {/* Stats */}
              <div className="flex items-center gap-6 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Eye className="h-4 w-4" />
                  {content.viewCount.toLocaleString()} views
                </span>
                <span className="flex items-center gap-1">
                  <ThumbsUp className="h-4 w-4" />
                  {content.helpfulCount} helpful
                </span>
                <span className="flex items-center gap-1">
                  <ThumbsDown className="h-4 w-4" />
                  {content.notHelpfulCount} not helpful
                </span>
                <span>Version {content.version}</span>
              </div>

              <Separator />

              {/* Content */}
              <div className="prose prose-sm dark:prose-invert max-w-none">
                <pre className="whitespace-pre-wrap font-sans text-sm bg-muted/50 p-4 rounded-lg">
                  {content.content || ''}
                </pre>
              </div>

              <Separator />

              {/* Metadata */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Slug:</span>
                  <span className="ml-2 font-mono">{content.slug}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Language:</span>
                  <span className="ml-2">{content.language || 'en'}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Created:</span>
                  <span className="ml-2">
                    {format(new Date(content.createdAt), 'MMM d, yyyy HH:mm')}
                  </span>
                </div>
                {content.publishedAt && (
                  <div>
                    <span className="text-muted-foreground">Published:</span>
                    <span className="ml-2">
                      {format(new Date(content.publishedAt), 'MMM d, yyyy HH:mm')}
                    </span>
                  </div>
                )}
                {content.metaTitle && (
                  <div className="col-span-2">
                    <span className="text-muted-foreground">Meta Title:</span>
                    <span className="ml-2">{content.metaTitle}</span>
                  </div>
                )}
                {content.metaDescription && (
                  <div className="col-span-2">
                    <span className="text-muted-foreground">Meta Description:</span>
                    <span className="ml-2">{content.metaDescription}</span>
                  </div>
                )}
              </div>
            </div>
          </ScrollArea>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            Content not found
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
