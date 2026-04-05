import { auth } from "@/auth"
import { GalaxySceneLoader } from "@/components/canvas/GalaxySceneLoader"
import { DemoBanner } from "@/components/ui/DemoBanner"
import { ProfileMenu } from "@/components/ui/ProfileMenu"
import { WarpTransition } from "@/components/ui/WarpTransition"
import { SessionExpiredBanner } from "@/components/ui/SessionExpiredBanner"
import { SearchBar } from "@/components/ui/SearchBar"
import { ControlsHint } from "@/components/ui/ControlsHint"
import { GalaxyStats } from "@/components/ui/GalaxyStats"
import { MiniMap } from "@/components/ui/MiniMap"
import { PipelineTrigger } from "@/components/ui/PipelineTrigger"

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
      <SearchBar />
      <ControlsHint />
      <GalaxyStats />
      <MiniMap />
      {!!session && <PipelineTrigger />}
    </main>
  )
}
