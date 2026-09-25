import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Oswald } from "next/font/google";
import { cookies } from "next/headers";
import "./globals.css";
import NavBar from "@/components/NavBar";
import PinGate from "@/components/PinGate";
import StartupAnimation from "@/components/StartupAnimation";
import CookieNoticeBanner from "@/components/CookieNoticeBanner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const condensed = Oswald({
  variable: "--font-condensed",
  subsets: ["latin"],
  weight: ["600", "700"],
});

export const metadata: Metadata = {
  title: "Racked",
  description: "Track your workouts and share them with friends.",
  appleWebApp: {
    title: "Racked",
    statusBarStyle: "black-translucent",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#000000",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const cookieStore = await cookies();
  const cookieNoticeDismissed = cookieStore.get("racked_cookie_notice_ack")?.value === "1";

  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${condensed.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col">
        <script
          dangerouslySetInnerHTML={{
            __html: `try{var a=localStorage.getItem('racked_accent');if(a)document.documentElement.style.setProperty('--accent',a);}catch(e){}`,
          }}
        />
        <StartupAnimation />
        <PinGate>
          <main className="flex-1 pb-20">{children}</main>
          <NavBar />
        </PinGate>
        <CookieNoticeBanner initiallyDismissed={cookieNoticeDismissed} />
      </body>
    </html>
  );
}
