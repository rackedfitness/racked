"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { HomeIcon, DumbbellIcon, TrendingUpIcon, UsersIcon, UserIcon } from "@/components/NavIcons";

const TABS = (username: string | null) => [
  { href: "/", label: "Home", Icon: HomeIcon },
  { href: "/workouts", label: "Workouts", Icon: DumbbellIcon },
  { href: "/progress", label: "Progress", Icon: TrendingUpIcon },
  { href: "/feed", label: "Feed", Icon: UsersIcon },
  { href: username ? `/profile/${username}` : "/login", label: "Profile", Icon: UserIcon },
];

export default function BottomNav({ username }: { username: string | null }) {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-20 border-t border-card-border bg-card/95 backdrop-blur pb-[env(safe-area-inset-bottom)]">
      <div className="mx-auto flex max-w-lg items-stretch justify-between px-2">
        {TABS(username).map(({ href, label, Icon }) => {
          const isActive = href === "/" ? pathname === "/" : pathname.startsWith(href.split("?")[0]);
          return (
            <Link
              key={href}
              href={href}
              className={`flex flex-1 flex-col items-center gap-1 py-2.5 text-[11px] transition-colors ${
                isActive ? "text-accent" : "text-muted"
              }`}
            >
              <Icon active={isActive} />
              {label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
