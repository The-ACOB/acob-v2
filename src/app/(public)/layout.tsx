import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { PopupBanner } from "@/components/effects/PopupBanner";
import { getCurrentSession } from "@/lib/auth/session";
import { getActivePopup } from "@/lib/popups/query";

export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  const [session, popup] = await Promise.all([getCurrentSession(), getActivePopup()]);

  return (
    <div className="flex min-h-dvh flex-col">
      <PopupBanner popup={popup} />
      <Header user={session ? { email: session.email, fullName: session.fullName } : null} />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
