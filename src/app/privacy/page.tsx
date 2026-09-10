import Link from "next/link";
import { ArrowLeftIcon } from "@/components/UIIcons";

export const metadata = { title: "Privacy Policy — Racked" };

export default function PrivacyPage() {
  return (
    <div className="mx-auto flex max-w-lg flex-col gap-4 px-4 py-6">
      <div className="flex items-center gap-3">
        <Link href="/" className="text-muted">
          <ArrowLeftIcon size={20} />
        </Link>
        <h1 className="text-xl font-bold">Privacy Policy</h1>
      </div>

      <p className="text-sm text-muted">Effective date: September 10, 2026</p>

      <div className="flex flex-col gap-4 text-sm leading-relaxed">
        <p>
          Racked (&ldquo;we,&rdquo; &ldquo;us&rdquo;) provides a fitness-tracking app with optional social features.
          This policy explains what we collect, why, and what choices you have.
        </p>

        <section>
          <h2 className="mb-1 font-semibold text-foreground">Information we collect</h2>
          <ul className="list-disc pl-5 text-muted">
            <li>Account info: email, username, display name, avatar, and optionally sex/age (used only to calculate strength ranks)</li>
            <li>Workout data: exercises, sets, reps, weights, notes, and any photos you upload</li>
            <li>Body measurements you choose to log (e.g. bodyweight)</li>
            <li>Gym locations you tag on a workout (searched via a third-party places API)</li>
            <li>If you use the mobile app and connect Apple Health / Google Health Connect, we write your workout duration and calories there — we don&rsquo;t read anything back from Health</li>
            <li>If you use the AI workout generator (Premium), the photo or equipment list you submit is sent to our AI provider to generate a workout</li>
            <li>Payment information if you subscribe to Premium — this is handled entirely by our payment processor; we never see or store your card details</li>
            <li>Basic technical/usage data (e.g. login session cookies) needed to operate the app</li>
          </ul>
        </section>

        <section>
          <h2 className="mb-1 font-semibold text-foreground">How we use it</h2>
          <ul className="list-disc pl-5 text-muted">
            <li>To provide the core service — tracking workouts and computing your stats, ranks, and streaks</li>
            <li>To power social features (feed, likes, comments, follows) — anything you mark public is visible to other users</li>
            <li>To process payments and manage your subscription</li>
            <li>To generate AI workouts when you request one</li>
            <li>To notify you of activity on your account (likes, comments, follows)</li>
            <li>To maintain, secure, and improve the app</li>
          </ul>
        </section>

        <section>
          <h2 className="mb-1 font-semibold text-foreground">Third parties we share data with</h2>
          <p className="text-muted">
            We use a small number of service providers to run Racked: a database/hosting provider, a payment
            processor, an AI provider (only for the AI workout generator), a places-search provider (only for gym
            tagging), and, if you use the mobile app and opt in, Apple/Google Health. We do not sell your data.
          </p>
        </section>

        <section>
          <h2 className="mb-1 font-semibold text-foreground">Your choices</h2>
          <ul className="list-disc pl-5 text-muted">
            <li>Export your data at any time from Settings</li>
            <li>Clear your workout history while keeping your account, or permanently delete your account entirely (which also cancels any active subscription) — both from Settings</li>
            <li>Block or report other users</li>
            <li>Choose whether each workout is public or private</li>
          </ul>
        </section>

        <section>
          <h2 className="mb-1 font-semibold text-foreground">Data retention</h2>
          <p className="text-muted">
            We keep your data for as long as your account is active. When you delete your account, your data is
            removed promptly, though it may briefly persist in routine backups before those cycle out.
          </p>
        </section>

        <section>
          <h2 className="mb-1 font-semibold text-foreground">Children&rsquo;s privacy</h2>
          <p className="text-muted">
            Racked is not intended for children under 13, and we do not knowingly collect data from children.
          </p>
        </section>

        <section>
          <h2 className="mb-1 font-semibold text-foreground">Security</h2>
          <p className="text-muted">
            We use industry-standard measures (encrypted connections, access-controlled databases) to protect your
            data, but no online service can guarantee absolute security.
          </p>
        </section>

        <section>
          <h2 className="mb-1 font-semibold text-foreground">Changes to this policy</h2>
          <p className="text-muted">
            If we make changes, we&rsquo;ll update the effective date above. Continuing to use Racked after a change
            means you accept the update.
          </p>
        </section>

        <section>
          <h2 className="mb-1 font-semibold text-foreground">Contact</h2>
          <p className="text-muted">Questions about this policy? Contact [add your contact email here].</p>
        </section>
      </div>
    </div>
  );
}
