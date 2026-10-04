import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy | RPV Bible',
  description: 'Privacy policy for the RPV Bible app and website.',
};

export default function PrivacyPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-10 text-neutral-800 dark:text-neutral-200">
      <h1 className="text-3xl font-bold mb-2">Privacy Policy</h1>
      <p className="text-sm text-neutral-500 mb-8">Last updated: September 21, 2026</p>

      <section className="space-y-4 mb-8">
        <h2 className="text-xl font-semibold">Overview</h2>
        <p>
          RPV Bible ("the app", operated by The Redemption Project) provides Bible reading,
          audio playback, search, study tools, and related features. This policy explains what
          information we collect, how we use it, and the choices you have.
        </p>
      </section>

      <section className="space-y-4 mb-8">
        <h2 className="text-xl font-semibold">Information We Collect</h2>
        <ul className="list-disc pl-6 space-y-2">
          <li>
            <strong>Account information.</strong> If you create an account, we store your email
            address, display name, and a hashed password. Passwords are never stored in plain text.
          </li>
          <li>
            <strong>Study data.</strong> Notes, highlights, bookmarks, reading plans, and reading
            progress you create are stored so they can sync across your devices.
          </li>
          <li>
            <strong>Usage data.</strong> Basic technical information (device type, app version,
            pages visited) may be collected to keep the service reliable and improve it.
          </li>
        </ul>
      </section>

      <section className="space-y-4 mb-8">
        <h2 className="text-xl font-semibold">How We Use Information</h2>
        <ul className="list-disc pl-6 space-y-2">
          <li>To provide and maintain the app and website.</li>
          <li>To authenticate you and sync your study data between devices.</li>
          <li>To respond to support requests and improve the service.</li>
        </ul>
        <p>We do not sell your personal information and we do not use it for advertising.</p>
      </section>

      <section className="space-y-4 mb-8">
        <h2 className="text-xl font-semibold">Third-Party Services</h2>
        <p>
          The app relies on a small number of infrastructure providers to operate, including
          Cloudflare (content storage and delivery) and our hosting provider. These providers
          process data only as needed to deliver the service.
        </p>
        <p>
          Audio Bible uses your device's built-in text-to-speech engine. The text is processed
          on your device and is not sent to our servers for speech.
        </p>
      </section>

      <section className="space-y-4 mb-8">
        <h2 className="text-xl font-semibold">Data Retention & Deletion</h2>
        <p>
          Your account and study data are retained while your account is active. You may request
          deletion of your account and associated data at any time by contacting us at the email
          below.
        </p>
      </section>

      <section className="space-y-4 mb-8">
        <h2 className="text-xl font-semibold">Security</h2>
        <p>
          We use HTTPS for all traffic and industry-standard practices to protect your data.
          No method of transmission or storage is 100% secure, but we work to protect your
          information.
        </p>
      </section>

      <section className="space-y-4 mb-8">
        <h2 className="text-xl font-semibold">Children</h2>
        <p>
          The app is not directed at children under 13, and we do not knowingly collect personal
          information from children under 13.
        </p>
      </section>

      <section className="space-y-4 mb-8">
        <h2 className="text-xl font-semibold">Changes to This Policy</h2>
        <p>
          We may update this policy from time to time. The "Last updated" date at the top reflects
          the latest revision. Continued use of the app after changes means you accept the
          updated policy.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Contact</h2>
        <p>
          Questions about this policy or your data? Email us at{' '}
          <a href="mailto:support@rpvbible.com" className="text-brand-600 hover:text-brand-700 underline">
            support@rpvbible.com
          </a>
          .
        </p>
      </section>
    </div>
  );
}
