/**
 * Plan feature codes and labels.
 * Used for configuring subscription plan features in the admin portal.
 */
export const PLAN_FEATURES = [
  { code: 'full_ai_analysis', label: 'Full AI Analysis' },
  { code: 'priority_processing', label: 'Priority Processing' },
  { code: 'workflows', label: 'Workflows' },
  { code: 'advanced_workflows', label: 'Advanced Workflows' },
  { code: 'advanced_analytics', label: 'Advanced Analytics' },
  { code: 'advanced_reporting', label: 'Advanced Reporting' },
  { code: 'api_access', label: 'API Access' },
  { code: 'whatsapp_integration', label: 'WhatsApp Integration' },
  { code: 'email_support', label: 'Email Support' },
  { code: 'phone_support', label: 'Phone Support' },
  { code: 'dedicated_manager', label: 'Dedicated Account Manager' },
  { code: 'custom_integrations', label: 'Custom Integrations' },
  { code: 'sso_integration', label: 'Single Sign-On (SSO)' },
  { code: 'audit_logs', label: 'Audit Logs' },
  { code: 'data_export', label: 'Data Export' },
  { code: 'multi_org', label: 'Multiple Organizations' },
  { code: 'custom_branding', label: 'Custom Branding' },
  { code: 'custom_domain', label: 'Custom Domain' },
  { code: 'priority_support', label: 'Priority Support' },
  { code: 'training', label: 'Training & Onboarding' },
  { code: 'bulk_operations', label: 'Bulk Operations' },
  { code: 'advanced_filters', label: 'Advanced Filters' },
] as const;

export type PlanFeatureCode = typeof PLAN_FEATURES[number]['code'];
