'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import {
  FileText,
  Plus,
  Edit,
  Trash2,
  Eye,
  Globe,
  Clock,
  CheckCircle,
  HelpCircle,
  MessageSquare,
  Bell,
  Archive,
  Send,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { PageHeader, LoadingState, EmptyState } from '@/components/common'
import { RequirePermission } from '@/components/auth'
import { ADMIN_PERMISSIONS } from '@/types/admin'
import {
  useContent,
  usePublishContent,
  useArchiveContent,
  useDeleteContent,
} from '@/hooks/use-content'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { ContentEditorDialog } from './_components/content-editor-dialog'
import { ContentPreviewDialog } from './_components/content-preview-dialog'

type ContentType = 'faq' | 'help_article' | 'notice_template'

export default function ContentPage() {
  const [activeTab, setActiveTab] = useState<ContentType>('faq')
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [editorOpen, setEditorOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [previewId, setPreviewId] = useState<string | null>(null)

  const { data: contentData, isLoading, error } = useContent({
    contentType: activeTab,
    pageSize: 50,
  })

  const publishMutation = usePublishContent()
  const archiveMutation = useArchiveContent()
  const deleteMutation = useDeleteContent()

  const handlePublish = (id: string) => {
    publishMutation.mutate(id)
  }

  const handleArchive = (id: string) => {
    archiveMutation.mutate(id)
  }

  const handleDelete = () => {
    if (deleteId) {
      deleteMutation.mutate(deleteId)
      setDeleteId(null)
    }
  }

  const handleCreate = () => {
    setEditingId(null)
    setEditorOpen(true)
  }

  const handleEdit = (id: string) => {
    setEditingId(id)
    setEditorOpen(true)
  }

  const handlePreview = (id: string) => {
    setPreviewId(id)
  }

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
            <Archive className="mr-1 h-3 w-3" />
            Archived
          </Badge>
        )
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const renderContentList = (contentType: ContentType) => {
    if (isLoading) {
      return <LoadingState message="Loading content..." />
    }

    if (error) {
      return (
        <EmptyState
          icon={<FileText className="h-6 w-6 text-muted-foreground" />}
          title="Error loading content"
          description="There was an error loading the content. Please try again."
        />
      )
    }

    const items = contentData?.items || []

    if (items.length === 0) {
      return (
        <EmptyState
          icon={
            contentType === 'faq'
              ? <HelpCircle className="h-6 w-6 text-muted-foreground" />
              : contentType === 'notice_template'
                ? <Bell className="h-6 w-6 text-muted-foreground" />
                : <FileText className="h-6 w-6 text-muted-foreground" />
          }
          title={`No ${contentType.replace('_', ' ')}s found`}
          description={`Create your first ${contentType.replace('_', ' ')} to get started.`}
        />
      )
    }

    return (
      <ScrollArea className="h-[400px]">
        <div className="space-y-4">
          {items.map((item) => (
            <div
              key={item.id}
              className="flex items-start justify-between rounded-lg border p-4"
            >
              <div className="space-y-1 flex-1">
                <div className="flex items-center gap-2">
                  {contentType === 'faq' && <HelpCircle className="h-4 w-4 text-muted-foreground" />}
                  {contentType === 'help_article' && <FileText className="h-4 w-4 text-muted-foreground" />}
                  {contentType === 'notice_template' && <Bell className="h-4 w-4 text-muted-foreground" />}
                  <span className="font-medium">{item.title}</span>
                  {getStatusBadge(item.status)}
                  {item.isFeatured && (
                    <Badge variant="outline" className="text-yellow-600 border-yellow-600">
                      Featured
                    </Badge>
                  )}
                </div>
                {item.excerpt && (
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {item.excerpt}
                  </p>
                )}
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  {item.category && <span>Category: {item.category}</span>}
                  <span className="flex items-center gap-1">
                    <Eye className="h-3 w-3" />
                    {item.viewCount.toLocaleString()} views
                  </span>
                  {contentType === 'faq' && (
                    <span className="flex items-center gap-1">
                      <CheckCircle className="h-3 w-3" />
                      {item.helpfulCount} helpful
                    </span>
                  )}
                  <span>
                    Updated: {item.updatedAt
                      ? format(new Date(item.updatedAt), 'MMM d, yyyy')
                      : format(new Date(item.createdAt), 'MMM d, yyyy')}
                  </span>
                </div>
              </div>
              <RequirePermission permission={ADMIN_PERMISSIONS.CONTENT_EDIT}>
                <div className="flex gap-1 ml-4">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    title="Preview"
                    onClick={() => handlePreview(item.id)}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    title="Edit"
                    onClick={() => handleEdit(item.id)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  {item.status === 'draft' && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-green-600"
                      title="Publish"
                      onClick={() => handlePublish(item.id)}
                      disabled={publishMutation.isPending}
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  )}
                  {item.status === 'published' && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-gray-600"
                      title="Archive"
                      onClick={() => handleArchive(item.id)}
                      disabled={archiveMutation.isPending}
                    >
                      <Archive className="h-4 w-4" />
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive"
                    title="Delete"
                    onClick={() => setDeleteId(item.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </RequirePermission>
            </div>
          ))}
        </div>
      </ScrollArea>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <PageHeader
          title="Content Management"
          description="Manage FAQs, help articles, and notification templates"
        />
        <RequirePermission permission={ADMIN_PERMISSIONS.CONTENT_EDIT}>
          <Button onClick={handleCreate}>
            <Plus className="mr-2 h-4 w-4" />
            Add Content
          </Button>
        </RequirePermission>
      </div>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as ContentType)} className="space-y-4">
        <TabsList>
          <TabsTrigger value="faq" className="flex items-center gap-2">
            <HelpCircle className="h-4 w-4" />
            FAQs
          </TabsTrigger>
          <TabsTrigger value="help_article" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Help Articles
          </TabsTrigger>
          <TabsTrigger value="notice_template" className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            Templates
          </TabsTrigger>
        </TabsList>

        <TabsContent value="faq">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Frequently Asked Questions</CardTitle>
                  <CardDescription>
                    Manage FAQs displayed in the help center
                  </CardDescription>
                </div>
                <RequirePermission permission={ADMIN_PERMISSIONS.CONTENT_EDIT}>
                  <Button size="sm" onClick={handleCreate}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add FAQ
                  </Button>
                </RequirePermission>
              </div>
            </CardHeader>
            <CardContent>
              {renderContentList('faq')}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="help_article">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Help Articles</CardTitle>
                  <CardDescription>
                    Manage help center documentation
                  </CardDescription>
                </div>
                <RequirePermission permission={ADMIN_PERMISSIONS.CONTENT_EDIT}>
                  <Button size="sm" onClick={handleCreate}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Article
                  </Button>
                </RequirePermission>
              </div>
            </CardHeader>
            <CardContent>
              {renderContentList('help_article')}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notice_template">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Notification Templates</CardTitle>
                  <CardDescription>
                    Manage email and push notification templates
                  </CardDescription>
                </div>
                <RequirePermission permission={ADMIN_PERMISSIONS.CONTENT_EDIT}>
                  <Button size="sm" onClick={handleCreate}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Template
                  </Button>
                </RequirePermission>
              </div>
            </CardHeader>
            <CardContent>
              {renderContentList('notice_template')}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Content</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this content? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <ContentEditorDialog
        open={editorOpen}
        onOpenChange={setEditorOpen}
        contentId={editingId}
        defaultContentType={activeTab}
      />

      <ContentPreviewDialog
        open={!!previewId}
        onOpenChange={(open) => !open && setPreviewId(null)}
        contentId={previewId}
      />
    </div>
  )
}
