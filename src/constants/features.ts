/**
 * Plan feature codes and labels.
 * Used for configuring subscription plan features in the admin portal.
 *
 * Clean set of 11 technical features organized by category:
 * - Core (Free tier): notice_detection, email_notifications, push_notifications
 * - AI (Paid tiers): ai_explanation, draft_reply, whatsapp_assistant
 * - Team: collaboration, advanced_analytics
 * - Premium: workflows, bulk_operations, data_export
 */
export const PLAN_FEATURES = [
  // === Core Features (Free Tier) ===
  { code: 'notice_detection', label: 'Notice Detection', category: 'core' },
  { code: 'email_notifications', label: 'Email Notifications', category: 'core' },
  { code: 'push_notifications', label: 'Push Notifications', category: 'core' },

  // === AI Features (Paid Tiers) ===
  { code: 'ask_ai', label: 'Ask AI', category: 'ai' },
  { code: 'ai_explanation', label: 'AI Explanation', category: 'ai' },
  { code: 'draft_reply', label: 'Draft Reply', category: 'ai' },
  { code: 'whatsapp_assistant', label: 'WhatsApp Assistant', category: 'ai' },

  // === Team Features ===
  { code: 'collaboration', label: 'Team Collaboration', category: 'team' },
  { code: 'advanced_analytics', label: 'Advanced Analytics', category: 'team' },

  // === Premium Features ===
  { code: 'workflows', label: 'Workflows', category: 'premium' },
  { code: 'bulk_operations', label: 'Bulk Operations', category: 'premium' },
  { code: 'data_export', label: 'Data Export', category: 'premium' },
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
  premium: 'Premium Features',
};

/** Billing cycle options */
export const BILLING_CYCLES = [
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'annually', label: 'Annually' },
] as const;

export type BillingCycleValue = typeof BILLING_CYCLES[number]['value'];
