import emailjs from '@emailjs/browser';

// EmailJS service credentials
// Note: Make sure these match EXACTLY with your EmailJS dashboard
const SERVICE_ID = 'service_wfeyfeb'; // Your EmailJS service ID - UPDATED to match dashboard
const TEMPLATE_ID = 'template_qgp0qpi'; // Your EmailJS template ID
const PUBLIC_KEY = 'dp8tvLSUXMeXaAPpF'; // Your EmailJS public key (should be the User ID from your EmailJS dashboard)

// Define the email parameters as a Record to satisfy EmailJS types
type EmailParams = Record<string, unknown> & {
  to_email: string;
  to_name?: string;
  from_name: string;
  password_title: string;
  message?: string;
  reply_to?: string;
}

/**
 * Sends a password sharing notification email using EmailJS
 */
export const sendPasswordSharedEmail = async (params: EmailParams): Promise<boolean> => {
  try {
    // Ensure we have all required parameters
    const emailParams = {
      ...params,
      to_name: params.to_name || 'Futeur Vault User',
      reply_to: params.reply_to || params.to_email, // Use recipient email as reply_to if not provided
    };
    
    await emailjs.send(
      SERVICE_ID,
      TEMPLATE_ID,
      emailParams,
      PUBLIC_KEY
    );
    
    return true;
  } catch (error) {
    // Silently fail - we don't want to block the UI if email sending fails
    return false;
  }
};

/**
 * Initialize EmailJS
 * Call this once at app startup
 */
export const initEmailJS = () => {
  emailjs.init(PUBLIC_KEY);
};

