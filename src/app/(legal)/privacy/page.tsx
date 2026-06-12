import type { Metadata } from 'next'
import styles from '../legal.module.css'

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'Privacy Policy for hags can cook.',
}

export const revalidate = false

const UPDATED = 'June 1, 2026'

export default function PrivacyPage() {
  return (
    <div>
      <h1>Privacy Policy</h1>
      <p className={styles.updated}>Last updated: {UPDATED}</p>

      <h2>1. What We Collect</h2>
      <p>
        We collect information you provide directly, information collected automatically when you
        use the Site, and information from third-party services.
      </p>

      <h4>Account information</h4>
      <p>
        When you create an account via Google Sign-In or email/password, we receive your email
        address, display name, and profile photo URL from Firebase Authentication. We store a user
        record in our database that includes your email, display name, avatar URL, and account role.
      </p>

      <h4>Content you create</h4>
      <p>
        Recipes, ingredients, steps, and other content you submit are stored in our database and may
        be displayed publicly if you choose to publish them.
      </p>

      <h4>Usage data</h4>
      <p>
        We may collect basic analytics such as page views and feature usage to improve the Site. We
        do not sell this data.
      </p>

      <h2>2. How We Use Your Information</h2>
      <ul>
        <li>To provide and operate the Site and its features.</li>
        <li>To authenticate your identity and maintain your session.</li>
        <li>To display your content and profile to other users.</li>
        <li>To send transactional emails (e.g. account notifications) if applicable.</li>
        <li>To improve the Site based on usage patterns.</li>
      </ul>

      <h2>3. Session Cookies</h2>
      <p>
        After you sign in, we set a secure, HttpOnly session cookie to maintain your authenticated
        session. This cookie is used solely to verify your identity on subsequent requests and is
        not used for advertising or tracking across other sites.
      </p>

      <h2>4. Third-Party Services</h2>
      <p>We use the following third-party services, each with their own privacy practices:</p>
      <ul>
        <li>
          <strong>Firebase (Google)</strong> — Authentication and file storage. Subject to{' '}
          <a
            href="https://policies.google.com/privacy"
            target="_blank"
            rel="noopener noreferrer"
          >
            Google&rsquo;s Privacy Policy
          </a>
          .
        </li>
        <li>
          <strong>Neon</strong> — Database hosting. Your data is stored on Neon&rsquo;s
          infrastructure, which is subject to their data processing agreement.
        </li>
      </ul>

      <h2>5. Data Retention</h2>
      <p>
        We retain your account data as long as your account is active. Recipes you delete are
        soft-deleted (not immediately removed) and may be retained for a period before permanent
        deletion. You may request deletion of your account and associated data by contacting us.
      </p>

      <h2>6. Your Rights</h2>
      <p>Depending on your jurisdiction, you may have the right to:</p>
      <ul>
        <li>Access the personal data we hold about you.</li>
        <li>Request correction of inaccurate data.</li>
        <li>Request deletion of your data (&ldquo;right to be forgotten&rdquo;).</li>
        <li>Object to or restrict certain processing of your data.</li>
      </ul>
      <p>
        To exercise these rights, email{' '}
        <a href="mailto:hello@hagscancook.com">hello@hagscancook.com</a>.
      </p>

      <h2>7. Children&rsquo;s Privacy</h2>
      <p>
        The Site is not directed to children under 13. We do not knowingly collect personal
        information from children under 13. If you believe a child has provided us with personal
        information, please contact us and we will delete it.
      </p>

      <h2>8. Changes to This Policy</h2>
      <p>
        We may update this Privacy Policy from time to time. We will update the &ldquo;Last
        updated&rdquo; date at the top of this page. Continued use of the Site after changes
        constitutes your acceptance.
      </p>

      <h2>9. Contact</h2>
      <p>
        Privacy questions or requests? Email{' '}
        <a href="mailto:hello@hagscancook.com">hello@hagscancook.com</a>.
      </p>
    </div>
  )
}
