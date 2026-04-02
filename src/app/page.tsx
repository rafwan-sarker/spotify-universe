import { auth } from "@/auth"
import { GalaxySceneLoader } from "@/components/canvas/GalaxySceneLoader"
import { DemoBanner } from "@/components/ui/DemoBanner"
import { ProfileMenu } from "@/components/ui/ProfileMenu"
import { WarpTransition } from "@/components/ui/WarpTransition"
import { SessionExpiredBanner } from "@/components/ui/SessionExpiredBanner"

export default async function HomePage() {
  const session = await auth()

  return (
    <main className="relative h-screen w-screen overflow-hidden" style={{ background: "#000005" }}>
      <GalaxySceneLoader isAuthenticated={!!session} />

      {/* DOM overlays -- positioned above canvas via z-index */}
      {!session && <DemoBanner />}
      {session?.user && <ProfileMenu user={session.user} />}
      <WarpTransition />
      <SessionExpiredBanner />
    </main>
  )
}
