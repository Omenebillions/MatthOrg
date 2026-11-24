import { BusinessProfile } from '../types';

/**
 * Generates direct shareable quotation and consultation links for a real registered business.
 */
export function getShareableIntakeLink(business: BusinessProfile): { webLink: string; whatsappLink: string } {
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://matthorg.com';
  const webLink = `${origin}/services?requestQuote=true&biz=${encodeURIComponent(business.business_name || 'verified')}`;
  
  const phone = (business.whatsapp || business.phone || '').replace(/[^0-9]/g, '');
  const greeting = encodeURIComponent(
    `Hello ${business.business_name || 'MatthOrg Pro'}, I would like to request an official quotation for your services.`
  );
  const whatsappLink = phone ? `https://wa.me/${phone}?text=${greeting}` : webLink;

  return { webLink, whatsappLink };
}
