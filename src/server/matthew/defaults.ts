/**
 * MATTHORG — MATTHEW SERVER DEFAULT SEED DATA
 * Real-data architecture: Empty arrays by default to prevent injection of any mock or fake entities.
 */

export const DEFAULT_BUSINESS = {
  id: '',
  user_id: '',
  business_name: 'My Service Business',
  phone: '',
  whatsapp: '',
  email: '',
  address: '',
  country: 'Nigeria',
  currency: '₦',
  tax_name: 'VAT',
  tax_rate: 7.5,
  industry: 'Commercial Services',
  specialization: 'General Contracting',
  phone_verified: false,
  email_verified: false,
  identity_verified: false,
  business_verified: false,
  service_verified: false,
  subscription_plan: 'free',
  subscription_status: 'inactive',
};

export const DEFAULT_LEADS: any[] = [];
export const DEFAULT_CUSTOMERS: any[] = [];
export const DEFAULT_QUOTES: any[] = [];
export const DEFAULT_INVOICES: any[] = [];
export const DEFAULT_FOLLOWUPS: any[] = [];
export const DEFAULT_REQUESTS: any[] = [];
