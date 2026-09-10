import Link from "next/link";
import { ArrowLeftIcon } from "@/components/UIIcons";

export const metadata = { title: "Terms of Service — Racked" };

export default function TermsPage() {
  return (
    <div className="mx-auto flex max-w-lg flex-col gap-4 px-4 py-6">
      <div className="flex items-center gap-3">
        <Link href="/" className="text-muted">
          <ArrowLeftIcon size={20} />
        </Link>
        <h1 className="text-xl font-bold">Terms of Service</h1>
      </div>

      <p className="text-sm text-muted">Effective date: September 10, 2026</p>

      <div className="flex flex-col gap-4 text-sm leading-relaxed">
        <section>
          <h2 className="mb-1 font-semibold text-foreground">1. Acceptance</h2>
          <p className="text-muted">By creating an account or using Racked, you agree to these terms.</p>
        </section>

        <section>
          <h2 className="mb-1 font-semibold text-foreground">2. The service</h2>
          <p className="text-muted">
            Racked lets you log workouts, track your progress, and optionally share activity with other users. Some
            features (AI-generated workouts, expanded rankings, and other Premium features) require a paid
            subscription.
          </p>
        </section>

        <section>
          <h2 className="mb-1 font-semibold text-foreground">3. Accounts</h2>
          <p className="text-muted">
            You&rsquo;re responsible for your account and anything that happens under it. You agree to provide
            accurate information and to meet the minimum age requirement described in our Privacy Policy.
          </p>
        </section>

        <section>
          <h2 className="mb-1 font-semibold text-foreground">4. User content &amp; conduct</h2>
          <p className="mb-1 text-muted">
            You keep ownership of what you post (workout notes, photos, comments). By posting public content, you
            grant us a license to display it within the app to other users. You agree not to:
          </p>
          <ul className="list-disc pl-5 text-muted">
            <li>Post illegal, abusive, harassing, or hateful content</li>
            <li>Impersonate another person</li>
            <li>Spam, harass, or abuse other users</li>
            <li>Attempt to scrape, abuse, or overload the service</li>
          </ul>
          <p className="mt-1 text-muted">
            We may remove content, or suspend or terminate accounts, that violate these terms — including in
            response to a report from another user.
          </p>
        </section>

        <section>
          <h2 className="mb-1 font-semibold text-foreground">5. Premium subscription</h2>
          <ul className="list-disc pl-5 text-muted">
            <li>Racked Premium is a recurring subscription billed through our payment processor (or, where applicable, through the app store on iOS/Android)</li>
            <li>Subscriptions renew automatically until canceled</li>
            <li>You can cancel any time from Settings → Manage subscription; you&rsquo;ll keep access until the end of the current billing period</li>
            <li>[Add your refund policy here]</li>
          </ul>
        </section>

        <section>
          <h2 className="mb-1 font-semibold text-foreground">6. Disclaimers</h2>
          <p className="text-muted">
            Racked is a fitness-tracking tool, not a medical or professional coaching service. Workout suggestions —
            including AI-generated ones — are not a substitute for professional medical or fitness advice. Talk to a
            qualified professional before starting any new exercise program, especially if you have a health
            condition. Strength ranks and estimated one-rep maxes are statistical estimates, not certified
            assessments.
          </p>
        </section>

        <section>
          <h2 className="mb-1 font-semibold text-foreground">7. Limitation of liability</h2>
          <p className="text-muted">
            To the extent permitted by law, Racked is provided &ldquo;as is&rdquo; without warranties of any kind. We
            are not liable for injuries, damages, or losses resulting from your use of the app or any workout you
            perform.
          </p>
        </section>

        <section>
          <h2 className="mb-1 font-semibold text-foreground">8. Termination</h2>
          <p className="text-muted">
            You may delete your account at any time from Settings. We may suspend or terminate accounts that violate
            these terms.
          </p>
        </section>

        <section>
          <h2 className="mb-1 font-semibold text-foreground">9. Changes</h2>
          <p className="text-muted">
            We may update these terms from time to time. Continuing to use Racked after a change means you accept
            the update.
          </p>
        </section>

        <section>
          <h2 className="mb-1 font-semibold text-foreground">10. Governing law</h2>
          <p className="text-muted">[Add your governing jurisdiction here]</p>
        </section>

        <section>
          <h2 className="mb-1 font-semibold text-foreground">Contact</h2>
          <p className="text-muted">Questions about these terms? Contact [add your contact email here].</p>
        </section>
      </div>
    </div>
  );
}
