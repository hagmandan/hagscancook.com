import type { Metadata } from 'next'
import styles from '../legal.module.css'

export const metadata: Metadata = {
  title: 'DMCA & Copyright',
  description: 'DMCA takedown policy and copyright information for hags can cook.',
}

const UPDATED = 'June 1, 2026'

export default function DmcaPage() {
  return (
    <div>
      <h1>DMCA &amp; Copyright</h1>
      <p className={styles.updated}>Last updated: {UPDATED}</p>

      <h2>Our Policy</h2>
      <p>
        hags can cook respects the intellectual property rights of others. We comply with the
        Digital Millennium Copyright Act (DMCA) and will respond promptly to notices of alleged
        copyright infringement.
      </p>

      <h2>Reporting Infringement</h2>
      <p>
        If you believe content on the Site infringes your copyright, please send a written notice
        to our designated agent containing the following information:
      </p>
      <ol>
        <li>
          <strong>Identification of the copyrighted work</strong> — A description of the
          copyrighted work you claim has been infringed, or a representative list if multiple
          works are covered.
        </li>
        <li>
          <strong>Identification of the infringing material</strong> — A description of the
          material you believe is infringing, with enough detail for us to locate it (e.g. the
          URL of the page).
        </li>
        <li>
          <strong>Your contact information</strong> — Your address, telephone number, and email
          address.
        </li>
        <li>
          <strong>Good faith statement</strong> — A statement that you have a good faith belief
          that use of the material in the manner complained of is not authorized by the copyright
          owner, its agent, or the law.
        </li>
        <li>
          <strong>Accuracy statement</strong> — A statement that the information in the notice is
          accurate, and under penalty of perjury, that you are the copyright owner or authorized
          to act on the copyright owner&rsquo;s behalf.
        </li>
        <li>
          <strong>Signature</strong> — A physical or electronic signature of the copyright owner
          or a person authorized to act on their behalf.
        </li>
      </ol>

      <p>
        Send DMCA notices to:{' '}
        <a href="mailto:dmca@hagscancook.com">dmca@hagscancook.com</a>
      </p>

      <h2>Counter-Notice</h2>
      <p>
        If you believe content was removed due to a mistake or misidentification, you may submit a
        counter-notice. A valid counter-notice must include:
      </p>
      <ol>
        <li>Your physical or electronic signature.</li>
        <li>Identification of the material that was removed and the location where it appeared.</li>
        <li>
          A statement under penalty of perjury that you have a good faith belief that the material
          was removed as a result of mistake or misidentification.
        </li>
        <li>
          Your name, address, and telephone number, and a statement that you consent to the
          jurisdiction of the federal district court for the judicial district in which your address
          is located.
        </li>
      </ol>
      <p>
        Send counter-notices to the same address:{' '}
        <a href="mailto:dmca@hagscancook.com">dmca@hagscancook.com</a>
      </p>

      <h2>Repeat Infringers</h2>
      <p>
        In appropriate circumstances, we will disable or terminate the accounts of users who are
        repeat infringers.
      </p>

      <h2>User-Submitted Recipes</h2>
      <p>
        Recipe ideas and general techniques are not copyrightable. However, the specific written
        expression of a recipe — such as the particular wording of instructions — may be protected.
        We ask that users write recipes in their own words rather than copying text verbatim from
        other sources.
      </p>

      <h2>Contact</h2>
      <p>
        Questions about copyright or this policy?{' '}
        <a href="mailto:dmca@hagscancook.com">dmca@hagscancook.com</a>
      </p>
    </div>
  )
}
