import Link from "next/link";
import { connection } from "next/server";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Privacy" };

/** What this site does with data, stated as facts about the code. Not legal advice. */
export default async function Privacy() {
  await connection(); // read PRIVACY_CONTACT at request time, not build time
  const contact = process.env.PRIVACY_CONTACT;
  return (
    <main style={{ maxWidth: 720, margin: "0 auto", padding: "32px 16px 48px", lineHeight: 1.55 }}>
      <h1>Privacy</h1>
      <p>
        Everything below is open source and can be checked against the code. This is unofficial and
        not affiliated with or endorsed by Garmin. Garmin&apos;s own privacy policy applies to the
        data Garmin holds: <a href="https://www.garmin.com/privacy/">garmin.com/privacy</a>.
      </p>

      <h2>Garmin in Claude (the connector)</h2>
      <ul>
        <li>
          <strong>Stored:</strong> the server keeps one row per connection: a random id, a keyed
          hash of your Garmin profile id, the client&apos;s name (for example &quot;Claude&quot;), a
          state, a counter and timestamps. The row is deleted after 35 days unused.
        </li>
        <li>
          <strong>Never stored:</strong> your password (sent once to Garmin), your email, your Garmin
          tokens (they are encrypted inside the token your MCP client keeps) and your Garmin data
          (it is passed through to your client, not kept).
        </li>
        <li>
          <strong>Logs</strong> hold a connection-id prefix, the tool name, a status and a duration
          only.
        </li>
      </ul>

      <h2>The sleep &amp; HRV demo</h2>
      <h3>When you sign in</h3>
      <ul>
        <li>
          Your email and password go from your browser to this server, and from it straight to
          Garmin&apos;s own sign-in service. They are not stored, logged, or sent anywhere else.
        </li>
        <li>
          If Garmin asks for a verification code, the half-finished sign-in is kept for up to ten
          minutes in an encrypted cookie in your browser, then deleted.
        </li>
        <li>
          Garmin returns access tokens. They are encrypted and kept <strong>only in your
          browser</strong>, as an httpOnly cookie that expires after 30 days. This server keeps no
          copy and has no database for the demo.
        </li>
      </ul>

      <h3>While you&apos;re signed in</h3>
      <ul>
        <li>
          Each page view reads your recent sleep data (score, duration, HRV, resting heart rate)
          and your name from Garmin, draws the charts, and discards the data. It is not stored.
        </li>
        <li>The demo only reads. It never writes anything to your Garmin account.</li>
      </ul>

      <h3>Signing out</h3>
      <p>
        <strong>Sign out</strong> deletes the token cookie. To also end the session on Garmin&apos;s
        side, change your Garmin password or review connected sessions in Garmin Connect.
      </p>

      <h2>Other data</h2>
      <p>
        To limit abuse, demo sign-in attempts are counted per IP address, in memory, for 15 minutes.
        Nothing else is collected: there is no analytics and no tracking.
      </p>

      {contact && (
        <>
          <h2>Contact</h2>
          <p>{contact}</p>
        </>
      )}

      <p style={{ marginTop: 32 }}>
        <Link href="/">← Back</Link>
      </p>
    </main>
  );
}
