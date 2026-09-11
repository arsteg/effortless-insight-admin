/**
 * Plan feature codes and labels.
 * Used for configuring subscription plan features in the admin portal.
 *
 * Features are organized by tier:
 * - Core (Free tier): notice_detection, email_notifications, push_notifications
 * - AI (Paid tiers): ai_explanation, draft_reply, whatsapp_assistant, multilingual_support
 * - Team tier: collaboration, custom_roles, audit_trail, advanced_analytics
 * - Enterprise: sso, api_access, workflows, sla_guarantee, priority_support
 */
export const PLAN_FEATURES = [
  // === Core Features (Free Tier) ===
  { code: 'notice_detection', label: 'Notice Detection', category: 'core' },
  { code: 'email_notifications', label: 'Email Notifications', category: 'core' },
  { code: 'push_notifications', label: 'Push Notifications', category: 'core' },

  // === AI Features (Paid Tiers) ===
  { code: 'ai_explanation', label: 'AI Explanation', category: 'ai' },
  { code: 'draft_reply', label: 'Draft Reply', category: 'ai' },
  { code: 'whatsapp_assistant', label: 'WhatsApp Assistant', category: 'ai' },
  { code: 'multilingual_support', label: 'Multilingual Support', category: 'ai' },
  { code: 'full_ai_analysis', label: 'Full AI Analysis', category: 'ai' },
  { code: 'priority_processing', label: 'Priority Processing', category: 'ai' },

  // === Team Features ===
  { code: 'collaboration', label: 'Team Collaboration', category: 'team' },
  { code: 'custom_roles', label: 'Custom Roles', category: 'team' },
  { code: 'audit_trail', label: 'Audit Trail', category: 'team' },
  { code: 'advanced_analytics', label: 'Advanced Analytics', category: 'team' },
  { code: 'advanced_reporting', label: 'Advanced Reporting', category: 'team' },
  { code: 'bulk_operations', label: 'Bulk Operations', category: 'team' },
  { code: 'advanced_filters', label: 'Advanced Filters', category: 'team' },
  { code: 'audit_logs', label: 'Audit Logs', category: 'team' },

  // === Enterprise Features ===
  { code: 'sso', label: 'Single Sign-On (SSO)', category: 'enterprise' },
  { code: 'api_access', label: 'API Access', category: 'enterprise' },
  { code: 'workflows', label: 'Custom Workflows', category: 'enterprise' },
  { code: 'advanced_workflows', label: 'Advanced Workflows', category: 'enterprise' },
  { code: 'sla_guarantee', label: 'SLA Guarantee', category: 'enterprise' },
  { code: 'priority_support', label: 'Priority Support', category: 'enterprise' },
  { code: 'dedicated_manager', label: 'Dedicated Account Manager', category: 'enterprise' },
  { code: 'custom_integrations', label: 'Custom Integrations', category: 'enterprise' },
  { code: 'custom_branding', label: 'Custom Branding', category: 'enterprise' },
  { code: 'custom_domain', label: 'Custom Domain', category: 'enterprise' },

  // === Support Features ===
  { code: 'email_support', label: 'Email Support', category: 'support' },
  { code: 'phone_support', label: 'Phone Support', category: 'support' },
  { code: 'training', label: 'Training & Onboarding', category: 'support' },

  // === Other Features ===
  { code: 'data_export', label: 'Data Export', category: 'other' },
  { code: 'multi_org', label: 'Multiple Organizations', category: 'other' },
  { code: 'whatsapp_integration', label: 'WhatsApp Integration (Legacy)', category: 'other' },
  { code: 'sso_integration', label: 'SSO Integration (Legacy)', category: 'other' },
] as const;

export type PlanFeatureCode = typeof PLAN_FEATURES[number]['code'];
export type PlanFeatureCategory = typeof PLAN_FEATURES[number]['category'];

/** Get features grouped by category for display */
export function getFeaturesByCategory(): Record<string, typeof PLAN_FEATURES[number][]> {
  const grouped: Record<string, typeof PLAN_FEATURES[number][]> = {};
  for (const feature of PLAN_FEATURES) {
    if (!grouped[feature.category]) {
      grouped[feature.category] = [];
    }
    grouped[feature.category].push(feature);
  }
  return grouped;
}

/** Category labels for display */
export const FEATURE_CATEGORY_LABELS: Record<string, string> = {
  core: 'Core Features',
  ai: 'AI Features',
  team: 'Team Features',
  enterprise: 'Enterprise Features',
  support: 'Support',
  other: 'Other',
};

/** Billing cycle options */
export const BILLING_CYCLES = [
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'annually', label: 'Annually' },
] as const;

export type BillingCycleValue = typeof BILLING_CYCLES[number]['value'];
