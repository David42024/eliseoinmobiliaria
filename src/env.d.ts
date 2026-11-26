declare namespace App {
  interface Locals {
    runtime?: {
      env: {
        CRM_WEBHOOK_URL?: string;
        CRM_WEBHOOK_TOKEN?: string;
        CRM_COPY_TO?: string;
      };
    };
  }
}
