import Link from "next/link";
import { ArrowLeftIcon } from "@/components/UIIcons";

export const metadata = { title: "Cookie Policy — Racked" };

export default function CookiePolicyPage() {
  return (
    <div className="mx-auto flex max-w-lg flex-col gap-4 px-4 py-6">
      <div className="flex items-center gap-3">
        <Link href="/" className="text-muted">
          <ArrowLeftIcon size={20} />
        </Link>
        <h1 className="text-xl font-bold">Cookie Policy</h1>
      </div>

      <p className="text-sm text-muted">Effective date: September 25, 2026</p>

      <div className="flex flex-col gap-4 text-sm leading-relaxed">
        <p>
          Racked keeps this simple: we don&rsquo;t use advertising, analytics, or cross-site tracking cookies of
          any kind. We use a small number of cookies solely to make the app work.
        </p>

        <section>
          <h2 className="mb-1 font-semibold text-foreground">Cookies we use</h2>
          <ul className="list-disc pl-5 text-muted">
            <li>
              <span className="text-foreground">Session cookie (strictly necessary)</span> — set by our
              authentication provider (Supabase) when you log in, so you stay signed in as you browse. Without
              it, you&rsquo;d have to log in again on every page.
            </li>
            <li>
              <span className="text-foreground">Preference cookies (strictly necessary)</span> — small flags we
              set when you dismiss an in-app prompt (like this cookie notice, the onboarding checklist, or the
              Premium banner) so we don&rsquo;t show it to you again. They store nothing except &ldquo;you saw
              this.&rdquo;
            </li>
          </ul>
        </section>

        <section>
          <h2 className="mb-1 font-semibold text-foreground">What we don&rsquo;t use</h2>
          <p className="text-muted">
            No third-party advertising cookies, no analytics/tracking pixels, and no cross-site cookies of any
            kind. We don&rsquo;t sell data to, or share cookies with, ad networks.
          </p>
        </section>

        <section>
          <h2 className="mb-1 font-semibold text-foreground">Your choices</h2>
          <p className="text-muted">
            Because every cookie we set is strictly necessary to run the app, there&rsquo;s no consent toggle
            for us to offer — turning them off would mean the app can&rsquo;t keep you signed in. You can always
            clear cookies from your browser or device settings, which will simply sign you out and reset
            dismissed prompts.
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
