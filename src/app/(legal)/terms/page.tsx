import type { Metadata } from 'next'
import styles from '../legal.module.css'

export const metadata: Metadata = {
  title: 'Terms of Service',
  description: 'Terms of Service for hags can cook.',
}

export const revalidate = false

const UPDATED = 'June 9, 2026'

export default function TermsPage() {
  return (
    <div>
      <h1>Terms of Service</h1>
      <p className={styles.updated}>Last updated: {UPDATED}</p>

      <h2>1. Acceptance of Terms</h2>
      <p>
        By accessing or using hags can cook (&ldquo;the Site&rdquo;), you agree to be bound by
        these Terms of Service. If you do not agree, please do not use the Site.
      </p>

      <h2>2. Your Account</h2>
      <p>
        You may create a free account to access additional features such as saving recipes and
        creating your own. You are responsible for maintaining the confidentiality of your account
        credentials and for all activity that occurs under your account.
      </p>
      <p>
        You must be at least 13 years old to create an account. By registering, you represent that
        you meet this requirement.
      </p>

      <h2>3. User-Generated Content</h2>
      <p>
        Users may submit recipes, comments, and other content (&ldquo;Content&rdquo;) to the Site.
        By submitting Content, you grant hags can cook a non-exclusive, worldwide, royalty-free
        license to display, reproduce, and distribute that Content in connection with operating the
        Site.
      </p>
      <p>You retain ownership of Content you create. You represent that:</p>
      <ul>
        <li>You own or have the right to submit the Content.</li>
        <li>The Content does not infringe any third-party intellectual property rights.</li>
        <li>The Content does not violate any applicable law.</li>
      </ul>

      <h2>4. Image Uploads</h2>
      <p>
        When you upload a cover image for a recipe, you represent that:
      </p>
      <ul>
        <li>The image is your own original content or content you have the right to use.</li>
        <li>The image is food or cooking-related and appropriate for all audiences.</li>
        <li>The image does not contain adult content, hate imagery, violence, or copyrighted
          material you do not own.</li>
      </ul>
      <p>
        All uploaded images are reviewed by our team before they appear publicly. We reserve
        the right to reject or remove any image at our sole discretion. Rejected images are
        not deleted from our storage; you may upload a replacement image at any time.
      </p>

      <h2>5. Acceptable Use</h2>
      <p>You agree not to:</p>
      <ul>
        <li>Post content that is unlawful, harmful, harassing, defamatory, or obscene.</li>
        <li>Scrape, crawl, or systematically download content without permission.</li>
        <li>Attempt to gain unauthorized access to any part of the Site or its infrastructure.</li>
        <li>Use the Site to transmit spam or unsolicited communications.</li>
        <li>Impersonate any person or entity.</li>
      </ul>

      <h2>6. Copyright & DMCA</h2>
      <p>
        We respect intellectual property rights. If you believe content on the Site infringes your
        copyright, please review our <a href="/dmca">DMCA & Copyright</a> policy and submit a
        takedown notice.
      </p>

      <h2>7. Content Moderation</h2>
      <p>
        We reserve the right to remove Content or suspend accounts that violate these Terms or that
        we otherwise determine, in our sole discretion, are harmful to the community or the Site.
      </p>

      <h2>8. Disclaimer of Warranties</h2>
      <p>
        The Site is provided &ldquo;as is&rdquo; and &ldquo;as available&rdquo; without warranty of
        any kind. We do not guarantee that recipes are accurate, safe, or suitable for any
        particular dietary need or health condition. Always consult a qualified professional for
        dietary or medical advice.
      </p>

      <h2>9. Limitation of Liability</h2>
      <p>
        To the fullest extent permitted by law, hags can cook and its operators shall not be liable
        for any indirect, incidental, special, or consequential damages arising from your use of the
        Site.
      </p>

      <h2>10. Changes to These Terms</h2>
      <p>
        We may update these Terms from time to time. Continued use of the Site after changes are
        posted constitutes your acceptance of the revised Terms. We will update the &ldquo;Last
        updated&rdquo; date at the top of this page.
      </p>

      <h2>11. Contact</h2>
      <p>
        Questions about these Terms? Email us at{' '}
        <a href="mailto:hello@hagscancook.com">hello@hagscancook.com</a>.
      </p>
    </div>
  )
}
