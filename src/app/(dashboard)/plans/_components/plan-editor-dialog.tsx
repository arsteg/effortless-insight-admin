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
import { Checkbox } from '@/components/ui/checkbox'
import {
  useCreatePlan,
  useUpdatePlan,
  usePlanDetail,
} from '@/hooks/use-plans'
import { PLAN_FEATURES } from '@/constants/features'
import type { CreatePlanRequest, UpdatePlanRequest } from '@/types/admin'

const planSchema = z.object({
  code: z
    .string()
    .min(1, 'Plan code is required')
    .regex(/^[a-z0-9_]+$/, 'Code must be lowercase letters, numbers, and underscores'),
  name: z.string().min(1, 'Name is required'),
  displayName: z.string().min(1, 'Display name is required'),
  description: z.string().optional(),

  // Pricing (in rupees, will be converted to paise)
  pricingMonthly: z.number().min(0, 'Monthly price must be positive').optional(),
  pricingAnnually: z.number().min(0, 'Annual price must be positive').optional(),
  perSeatMonthly: z.number().min(0, 'Per-seat monthly price must be positive').optional(),
  perSeatAnnually: z.number().min(0, 'Per-seat annual price must be positive').optional(),
  currency: z.string(),
  contactSales: z.boolean(),
  startingAt: z.number().min(0, 'Starting price must be positive').optional(),

  // Razorpay IDs
  razorpayPlanIdMonthly: z.string().optional(),
  razorpayPlanIdAnnually: z.string().optional(),

  // Limits
  noticesPerMonth: z.number().int().min(0, 'Notices must be 0 or positive'),
  users: z.number().int().min(0, 'Users must be 0 or positive'),
  storageGb: z.number().int().min(0, 'Storage must be 0 or positive'),
  organizationsCount: z.number().int().min(1, 'Must allow at least 1 organization'),
  additionalUsersAllowed: z.boolean(),
  apiCalls: z.number().int().min(0, 'API calls must be 0 or positive'),

  // Features
  features: z.array(z.string()),

  // Settings
  isActive: z.boolean(),
  isPopular: z.boolean(),
  trialDays: z.number().int().min(0),
  sortOrder: z.number().int().min(0),
})

type PlanFormData = z.infer<typeof planSchema>

interface PlanEditorDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  planId?: string | null
}

export function PlanEditorDialog({
  open,
  onOpenChange,
  planId,
}: PlanEditorDialogProps) {
  const isEditing = !!planId
  const [activeTab, setActiveTab] = useState('pricing')

  // Checkbox states for unlimited limits
  const [unlimitedNotices, setUnlimitedNotices] = useState(false)
  const [unlimitedUsers, setUnlimitedUsers] = useState(false)
  const [unlimitedStorage, setUnlimitedStorage] = useState(false)

  const { data: existingPlan, isLoading: isLoadingPlan } = usePlanDetail(planId || undefined)
  const createMutation = useCreatePlan()
  const updateMutation = useUpdatePlan()

  const form = useForm<PlanFormData>({
    resolver: zodResolver(planSchema),
    defaultValues: {
      code: '',
      name: '',
      displayName: '',
      description: '',
      pricingMonthly: undefined,
      pricingAnnually: undefined,
      perSeatMonthly: undefined,
      perSeatAnnually: undefined,
      currency: 'INR',
      contactSales: false,
      startingAt: undefined,
      razorpayPlanIdMonthly: undefined,
      razorpayPlanIdAnnually: undefined,
      noticesPerMonth: 100,
      users: 5,
      storageGb: 10,
      organizationsCount: 1,
      additionalUsersAllowed: false,
      apiCalls: 10000,
      features: [],
      isActive: true,
      isPopular: false,
      trialDays: 14,
      sortOrder: 0,
    },
  })

  // Load existing plan when editing
  useEffect(() => {
    if (existingPlan && isEditing) {
      // Check if limits are unlimited (-1)
      setUnlimitedNotices(existingPlan.limits.noticesPerMonth === -1)
      setUnlimitedUsers(existingPlan.limits.users === -1)
      setUnlimitedStorage(existingPlan.limits.storageGb === -1)

      form.reset({
        code: existingPlan.code,
        name: existingPlan.name,
        displayName: existingPlan.displayName,
        description: existingPlan.description || '',
        pricingMonthly: existingPlan.pricingMonthly ? existingPlan.pricingMonthly / 100 : undefined,
        pricingAnnually: existingPlan.pricingAnnually ? existingPlan.pricingAnnually / 100 : undefined,
        perSeatMonthly: existingPlan.perSeatMonthly ? existingPlan.perSeatMonthly / 100 : undefined,
        perSeatAnnually: existingPlan.perSeatAnnually ? existingPlan.perSeatAnnually / 100 : undefined,
        currency: existingPlan.currency,
        contactSales: existingPlan.contactSales,
        startingAt: existingPlan.startingAt ? existingPlan.startingAt / 100 : undefined,
        razorpayPlanIdMonthly: existingPlan.razorpayPlanIdMonthly || undefined,
        razorpayPlanIdAnnually: existingPlan.razorpayPlanIdAnnually || undefined,
        noticesPerMonth: existingPlan.limits.noticesPerMonth === -1 ? 0 : existingPlan.limits.noticesPerMonth,
        users: existingPlan.limits.users === -1 ? 0 : existingPlan.limits.users,
        storageGb: existingPlan.limits.storageGb === -1 ? 0 : existingPlan.limits.storageGb,
        organizationsCount: existingPlan.limits.organizationsCount,
        additionalUsersAllowed: existingPlan.limits.additionalUsersAllowed,
        apiCalls: existingPlan.limits.apiCalls,
        features: existingPlan.features,
        isActive: existingPlan.isActive,
        isPopular: existingPlan.isPopular,
        trialDays: existingPlan.trialDays,
        sortOrder: existingPlan.sortOrder,
      })
    }
  }, [existingPlan, isEditing, form])

  // Reset form when dialog opens for new plan
  useEffect(() => {
    if (open && !isEditing) {
      setUnlimitedNotices(false)
      setUnlimitedUsers(false)
      setUnlimitedStorage(false)
      form.reset({
        code: '',
        name: '',
        displayName: '',
        description: '',
        pricingMonthly: undefined,
        pricingAnnually: undefined,
        perSeatMonthly: undefined,
        perSeatAnnually: undefined,
        currency: 'INR',
        contactSales: false,
        startingAt: undefined,
        razorpayPlanIdMonthly: undefined,
        razorpayPlanIdAnnually: undefined,
        noticesPerMonth: 100,
        users: 5,
        storageGb: 10,
        organizationsCount: 1,
        additionalUsersAllowed: false,
        apiCalls: 10000,
        features: [],
        isActive: true,
        isPopular: false,
        trialDays: 14,
        sortOrder: 0,
      })
      setActiveTab('pricing')
    }
  }, [open, isEditing, form])

  const handleSubmit = async (data: PlanFormData) => {
    // Convert prices from rupees to paise
    const convertToPaise = (value: number | null | undefined) => {
      if (value === null || value === undefined) return undefined
      return Math.round(value * 100)
    }

    const planData: CreatePlanRequest = {
      code: data.code,
      name: data.name,
      displayName: data.displayName,
      description: data.description || undefined,
      pricingMonthly: convertToPaise(data.pricingMonthly),
      pricingAnnually: convertToPaise(data.pricingAnnually),
      perSeatMonthly: convertToPaise(data.perSeatMonthly),
      perSeatAnnually: convertToPaise(data.perSeatAnnually),
      currency: data.currency,
      contactSales: data.contactSales,
      startingAt: convertToPaise(data.startingAt),
      razorpayPlanIdMonthly: data.razorpayPlanIdMonthly || undefined,
      razorpayPlanIdAnnually: data.razorpayPlanIdAnnually || undefined,
      limits: {
        noticesPerMonth: unlimitedNotices ? -1 : data.noticesPerMonth,
        users: unlimitedUsers ? -1 : data.users,
        storageGb: unlimitedStorage ? -1 : data.storageGb,
        organizationsCount: data.organizationsCount,
        additionalUsersAllowed: data.additionalUsersAllowed,
        apiCalls: data.apiCalls,
      },
      features: data.features,
      isActive: data.isActive,
      isPopular: data.isPopular,
      trialDays: data.trialDays,
      sortOrder: data.sortOrder,
    }

    if (isEditing && planId) {
      // Code cannot be updated, so destructure it out
      const { code, ...updateData } = planData
      await updateMutation.mutateAsync({ id: planId, data: updateData })
    } else {
      await createMutation.mutateAsync(planData)
    }
    onOpenChange(false)
  }

  const isSubmitting = createMutation.isPending || updateMutation.isPending

  const toggleFeature = (featureCode: string) => {
    const current = form.watch('features')
    if (current.includes(featureCode)) {
      form.setValue('features', current.filter(f => f !== featureCode))
    } else {
      form.setValue('features', [...current, featureCode])
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Plan' : 'Create Plan'}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? 'Update the subscription plan details below.'
              : 'Fill in the details to create a new subscription plan.'}
          </DialogDescription>
        </DialogHeader>

        {isLoadingPlan && isEditing ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="pricing">Pricing</TabsTrigger>
                <TabsTrigger value="limits">Limits</TabsTrigger>
                <TabsTrigger value="features">Features</TabsTrigger>
                <TabsTrigger value="settings">Settings</TabsTrigger>
              </TabsList>

              {/* PRICING TAB */}
              <TabsContent value="pricing" className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="code">Plan Code *</Label>
                    <Input
                      id="code"
                      {...form.register('code')}
                      disabled={isEditing}
                      placeholder="e.g., starter, professional, enterprise"
                    />
                    {form.formState.errors.code && (
                      <p className="text-sm text-destructive">{form.formState.errors.code.message}</p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      Lowercase letters, numbers, and underscores only. Cannot be changed after creation.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="name">Name *</Label>
                    <Input
                      id="name"
                      {...form.register('name')}
                      placeholder="e.g., Starter Plan"
                    />
                    {form.formState.errors.name && (
                      <p className="text-sm text-destructive">{form.formState.errors.name.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="displayName">Display Name *</Label>
                    <Input
                      id="displayName"
                      {...form.register('displayName')}
                      placeholder="e.g., Starter"
                    />
                    {form.formState.errors.displayName && (
                      <p className="text-sm text-destructive">{form.formState.errors.displayName.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="currency">Currency</Label>
                    <Select
                      value={form.watch('currency') || 'INR'}
                      onValueChange={(value) => value && form.setValue('currency', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="INR">INR (₹)</SelectItem>
                        <SelectItem value="USD">USD ($)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    {...form.register('description')}
                    placeholder="Brief description of the plan"
                    rows={2}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="pricingMonthly">Monthly Price (₹)</Label>
                    <Input
                      id="pricingMonthly"
                      type="number"
                      {...form.register('pricingMonthly', { valueAsNumber: true })}
                      placeholder="999"
                    />
                    {form.formState.errors.pricingMonthly && (
                      <p className="text-sm text-destructive">{form.formState.errors.pricingMonthly.message}</p>
                    )}
                    <p className="text-xs text-muted-foreground">Leave empty for enterprise plans</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="pricingAnnually">Annual Price (₹)</Label>
                    <Input
                      id="pricingAnnually"
                      type="number"
                      {...form.register('pricingAnnually', { valueAsNumber: true })}
                      placeholder="9990"
                    />
                    {form.formState.errors.pricingAnnually && (
                      <p className="text-sm text-destructive">{form.formState.errors.pricingAnnually.message}</p>
                    )}
                    <p className="text-xs text-muted-foreground">Typically 10 months worth (2 months free)</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="perSeatMonthly">Per Seat Monthly (₹)</Label>
                    <Input
                      id="perSeatMonthly"
                      type="number"
                      {...form.register('perSeatMonthly', { valueAsNumber: true })}
                      placeholder="499"
                    />
                    {form.formState.errors.perSeatMonthly && (
                      <p className="text-sm text-destructive">{form.formState.errors.perSeatMonthly.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="perSeatAnnually">Per Seat Annually (₹)</Label>
                    <Input
                      id="perSeatAnnually"
                      type="number"
                      {...form.register('perSeatAnnually', { valueAsNumber: true })}
                      placeholder="4990"
                    />
                    {form.formState.errors.perSeatAnnually && (
                      <p className="text-sm text-destructive">{form.formState.errors.perSeatAnnually.message}</p>
                    )}
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="contactSales"
                    checked={form.watch('contactSales')}
                    onCheckedChange={(checked) => form.setValue('contactSales', checked)}
                  />
                  <Label htmlFor="contactSales">Contact Sales (enterprise plan)</Label>
                </div>

                {form.watch('contactSales') && (
                  <div className="space-y-2">
                    <Label htmlFor="startingAt">Starting At Price (₹)</Label>
                    <Input
                      id="startingAt"
                      type="number"
                      {...form.register('startingAt', { valueAsNumber: true })}
                      placeholder="99999"
                    />
                    <p className="text-xs text-muted-foreground">Optional "Starting at" price for display</p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="razorpayPlanIdMonthly">Razorpay Plan ID (Monthly)</Label>
                    <Input
                      id="razorpayPlanIdMonthly"
                      {...form.register('razorpayPlanIdMonthly')}
                      placeholder="plan_xxxxx"
                    />
                    <p className="text-xs text-muted-foreground">Optional: Link to Razorpay recurring plan</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="razorpayPlanIdAnnually">Razorpay Plan ID (Annual)</Label>
                    <Input
                      id="razorpayPlanIdAnnually"
                      {...form.register('razorpayPlanIdAnnually')}
                      placeholder="plan_xxxxx"
                    />
                  </div>
                </div>
              </TabsContent>

              {/* LIMITS TAB */}
              <TabsContent value="limits" className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="noticesPerMonth">Notices Per Month</Label>
                    <Input
                      id="noticesPerMonth"
                      type="number"
                      {...form.register('noticesPerMonth', { valueAsNumber: true })}
                      disabled={unlimitedNotices}
                      placeholder="100"
                    />
                    {form.formState.errors.noticesPerMonth && (
                      <p className="text-sm text-destructive">{form.formState.errors.noticesPerMonth.message}</p>
                    )}
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="unlimitedNotices"
                        checked={unlimitedNotices}
                        onCheckedChange={(checked) => setUnlimitedNotices(checked as boolean)}
                      />
                      <label htmlFor="unlimitedNotices" className="text-sm">Unlimited</label>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="users">Users</Label>
                    <Input
                      id="users"
                      type="number"
                      {...form.register('users', { valueAsNumber: true })}
                      disabled={unlimitedUsers}
                      placeholder="5"
                    />
                    {form.formState.errors.users && (
                      <p className="text-sm text-destructive">{form.formState.errors.users.message}</p>
                    )}
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="unlimitedUsers"
                        checked={unlimitedUsers}
                        onCheckedChange={(checked) => setUnlimitedUsers(checked as boolean)}
                      />
                      <label htmlFor="unlimitedUsers" className="text-sm">Unlimited</label>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="storageGb">Storage (GB)</Label>
                    <Input
                      id="storageGb"
                      type="number"
                      {...form.register('storageGb', { valueAsNumber: true })}
                      disabled={unlimitedStorage}
                      placeholder="10"
                    />
                    {form.formState.errors.storageGb && (
                      <p className="text-sm text-destructive">{form.formState.errors.storageGb.message}</p>
                    )}
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="unlimitedStorage"
                        checked={unlimitedStorage}
                        onCheckedChange={(checked) => setUnlimitedStorage(checked as boolean)}
                      />
                      <label htmlFor="unlimitedStorage" className="text-sm">Unlimited</label>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="organizationsCount">Organizations Count</Label>
                    <Input
                      id="organizationsCount"
                      type="number"
                      {...form.register('organizationsCount', { valueAsNumber: true })}
                      placeholder="1"
                    />
                    {form.formState.errors.organizationsCount && (
                      <p className="text-sm text-destructive">{form.formState.errors.organizationsCount.message}</p>
                    )}
                    <p className="text-xs text-muted-foreground">Usually 1 for standard plans</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="apiCalls">API Calls Per Month</Label>
                    <Input
                      id="apiCalls"
                      type="number"
                      {...form.register('apiCalls', { valueAsNumber: true })}
                      placeholder="10000"
                    />
                    {form.formState.errors.apiCalls && (
                      <p className="text-sm text-destructive">{form.formState.errors.apiCalls.message}</p>
                    )}
                  </div>

                  <div className="flex items-center space-x-2 pt-6">
                    <Switch
                      id="additionalUsersAllowed"
                      checked={form.watch('additionalUsersAllowed')}
                      onCheckedChange={(checked) => form.setValue('additionalUsersAllowed', checked)}
                    />
                    <Label htmlFor="additionalUsersAllowed">Allow Additional Users</Label>
                  </div>
                </div>
              </TabsContent>

              {/* FEATURES TAB */}
              <TabsContent value="features" className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-4">
                  {PLAN_FEATURES.map((feature) => (
                    <div key={feature.code} className="flex items-center space-x-2">
                      <Checkbox
                        id={feature.code}
                        checked={form.watch('features').includes(feature.code)}
                        onCheckedChange={() => toggleFeature(feature.code)}
                      />
                      <label htmlFor={feature.code} className="text-sm cursor-pointer">
                        {feature.label}
                      </label>
                    </div>
                  ))}
                </div>
              </TabsContent>

              {/* SETTINGS TAB */}
              <TabsContent value="settings" className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="trialDays">Trial Days</Label>
                    <Input
                      id="trialDays"
                      type="number"
                      {...form.register('trialDays', { valueAsNumber: true })}
                      placeholder="14"
                    />
                    <p className="text-xs text-muted-foreground">Default trial period in days</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="sortOrder">Sort Order</Label>
                    <Input
                      id="sortOrder"
                      type="number"
                      {...form.register('sortOrder', { valueAsNumber: true })}
                      placeholder="0"
                    />
                    <p className="text-xs text-muted-foreground">Display order on pricing page (lower = first)</p>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="isPopular"
                    checked={form.watch('isPopular')}
                    onCheckedChange={(checked) => form.setValue('isPopular', checked)}
                  />
                  <Label htmlFor="isPopular">Mark as Popular</Label>
                  <p className="text-sm text-muted-foreground ml-2">Highlights the plan on pricing page</p>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="isActive"
                    checked={form.watch('isActive')}
                    onCheckedChange={(checked) => form.setValue('isActive', checked)}
                  />
                  <Label htmlFor="isActive">Active</Label>
                  <p className="text-sm text-muted-foreground ml-2">
                    Only active plans are visible on the pricing page
                  </p>
                </div>
              </TabsContent>
            </Tabs>

            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isEditing ? 'Update Plan' : 'Create Plan'}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
