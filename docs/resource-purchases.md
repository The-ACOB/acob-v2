# Paid resource purchases

Paid resources use manual bKash/Nagad transaction verification. This is not an automatic payment-gateway integration.

## Setup

1. Install dependencies: `npm install`
2. Configure the existing database variables: `DATABASE_URL` and `DIRECT_URL`.
3. Configure Vercel Blob uploads with `BLOB_READ_WRITE_TOKEN`.
4. Configure transactional email with `RESEND_API_KEY` and `EMAIL_FROM` (defaults to `ACOB <no-reply@theacob.com>`).
5. Apply the schema migration: `npm run db:migrate`
6. Regenerate Prisma Client: `npm run db:generate`
7. Build and deploy the application.

## Admin workflow

Open Dashboard → Resources, create or edit a resource, enable **This is a paid resource**, enter its BDT price, and upload that resource's QR image. Each resource stores its own QR image. Publish the resource when ready.

Open Dashboard → Payment Approvals → Resource purchase requests to compare the submitted sender number and transaction ID with the payment record. Approve only after verifying the payment manually.

## Participant workflow

Participants must sign in before checkout. The checkout page displays the QR image configured for that resource and collects the payment method, sender number, and transaction ID. The request remains pending until an administrator approves it. Approved purchases appear in Purchase History and unlock the resource; the participant also receives an email.

Email delivery depends on valid Resend credentials and a verified sender domain. Payment verification remains manual; the app does not claim to verify transactions directly with bKash or Nagad.
