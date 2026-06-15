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
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { PageHeader, LoadingState, EmptyState } from '@/components/common'
import { RequirePermission } from '@/components/auth'
import { ADMIN_PERMISSIONS } from '@/types/admin'

// Mock data for demonstration - would come from API
const faqs = [
  {
    id: '1',
    question: 'How do I upload a GST notice?',
    answer: 'Navigate to Notices > Upload and drag your notice file or click to browse...',
    category: 'Getting Started',
    isPublished: true,
    order: 1,
    updatedAt: '2024-06-10T10:00:00Z',
  },
  {
    id: '2',
    question: 'What file formats are supported?',
    answer: 'We support PDF, JPG, PNG, and scanned documents...',
    category: 'Getting Started',
    isPublished: true,
    order: 2,
    updatedAt: '2024-06-08T14:30:00Z',
  },
  {
    id: '3',
    question: 'How do I add team members?',
    answer: 'Go to Settings > Team and click "Invite Member"...',
    category: 'Team Management',
    isPublished: false,
    order: 1,
    updatedAt: '2024-06-12T09:15:00Z',
  },
]

const helpArticles = [
  {
    id: '1',
    title: 'Getting Started Guide',
    slug: 'getting-started',
    category: 'Onboarding',
    isPublished: true,
    viewCount: 1234,
    updatedAt: '2024-06-10T10:00:00Z',
  },
  {
    id: '2',
    title: 'Understanding GST Notices',
    slug: 'understanding-gst-notices',
    category: 'Notices',
    isPublished: true,
    viewCount: 856,
    updatedAt: '2024-06-08T14:30:00Z',
  },
  {
    id: '3',
    title: 'Billing and Subscriptions',
    slug: 'billing-subscriptions',
    category: 'Billing',
    isPublished: true,
    viewCount: 432,
    updatedAt: '2024-06-05T11:00:00Z',
  },
]

const noticeTemplates = [
  {
    id: '1',
    name: 'Notice Acknowledgment',
    description: 'Sent when a notice is uploaded and processing begins',
    type: 'email',
    isActive: true,
    updatedAt: '2024-06-10T10:00:00Z',
  },
  {
    id: '2',
    name: 'Processing Complete',
    description: 'Sent when AI processing of a notice is complete',
    type: 'email',
    isActive: true,
    updatedAt: '2024-06-08T14:30:00Z',
  },
  {
    id: '3',
    name: 'Due Date Reminder',
    description: 'Reminder sent before a notice response is due',
    type: 'email',
    isActive: true,
    updatedAt: '2024-06-05T11:00:00Z',
  },
  {
    id: '4',
    name: 'Task Assignment',
    description: 'Notification when a task is assigned to a user',
    type: 'push',
    isActive: true,
    updatedAt: '2024-06-03T16:45:00Z',
  },
]

export default function ContentPage() {
  const [activeTab, setActiveTab] = useState('faqs')

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <PageHeader
          title="Content Management"
          description="Manage FAQs, help articles, and notification templates"
        />
        <RequirePermission permission={ADMIN_PERMISSIONS.CONTENT_EDIT}>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Content
          </Button>
        </RequirePermission>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="faqs" className="flex items-center gap-2">
            <HelpCircle className="h-4 w-4" />
            FAQs
          </TabsTrigger>
          <TabsTrigger value="help" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Help Articles
          </TabsTrigger>
          <TabsTrigger value="templates" className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            Templates
          </TabsTrigger>
        </TabsList>

        {/* FAQs Tab */}
        <TabsContent value="faqs">
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
                  <Button size="sm">
                    <Plus className="mr-2 h-4 w-4" />
                    Add FAQ
                  </Button>
                </RequirePermission>
              </div>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                <div className="space-y-4">
                  {faqs.map((faq) => (
                    <div
                      key={faq.id}
                      className="flex items-start justify-between rounded-lg border p-4"
                    >
                      <div className="space-y-1 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{faq.question}</span>
                          {faq.isPublished ? (
                            <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                              <Globe className="mr-1 h-3 w-3" />
                              Published
                            </Badge>
                          ) : (
                            <Badge variant="secondary">
                              <Clock className="mr-1 h-3 w-3" />
                              Draft
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {faq.answer}
                        </p>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span>Category: {faq.category}</span>
                          <span>Updated: {format(new Date(faq.updatedAt), 'MMM d, yyyy')}</span>
                        </div>
                      </div>
                      <RequirePermission permission={ADMIN_PERMISSIONS.CONTENT_EDIT}>
                        <div className="flex gap-1 ml-4">
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </RequirePermission>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Help Articles Tab */}
        <TabsContent value="help">
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
                  <Button size="sm">
                    <Plus className="mr-2 h-4 w-4" />
                    Add Article
                  </Button>
                </RequirePermission>
              </div>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                <div className="space-y-4">
                  {helpArticles.map((article) => (
                    <div
                      key={article.id}
                      className="flex items-start justify-between rounded-lg border p-4"
                    >
                      <div className="space-y-1 flex-1">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{article.title}</span>
                          {article.isPublished && (
                            <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                              Published
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span>/{article.slug}</span>
                          <span>Category: {article.category}</span>
                        </div>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Eye className="h-3 w-3" />
                            {article.viewCount.toLocaleString()} views
                          </span>
                          <span>Updated: {format(new Date(article.updatedAt), 'MMM d, yyyy')}</span>
                        </div>
                      </div>
                      <RequirePermission permission={ADMIN_PERMISSIONS.CONTENT_EDIT}>
                        <div className="flex gap-1 ml-4">
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </RequirePermission>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Templates Tab */}
        <TabsContent value="templates">
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
                  <Button size="sm">
                    <Plus className="mr-2 h-4 w-4" />
                    Add Template
                  </Button>
                </RequirePermission>
              </div>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                <div className="space-y-4">
                  {noticeTemplates.map((template) => (
                    <div
                      key={template.id}
                      className="flex items-start justify-between rounded-lg border p-4"
                    >
                      <div className="space-y-1 flex-1">
                        <div className="flex items-center gap-2">
                          {template.type === 'email' ? (
                            <MessageSquare className="h-4 w-4 text-muted-foreground" />
                          ) : (
                            <Bell className="h-4 w-4 text-muted-foreground" />
                          )}
                          <span className="font-medium">{template.name}</span>
                          <Badge variant="outline" className="capitalize">
                            {template.type}
                          </Badge>
                          {template.isActive && (
                            <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                              <CheckCircle className="mr-1 h-3 w-3" />
                              Active
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {template.description}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Updated: {format(new Date(template.updatedAt), 'MMM d, yyyy')}
                        </p>
                      </div>
                      <RequirePermission permission={ADMIN_PERMISSIONS.CONTENT_EDIT}>
                        <div className="flex gap-1 ml-4">
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <Edit className="h-4 w-4" />
                          </Button>
                        </div>
                      </RequirePermission>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
