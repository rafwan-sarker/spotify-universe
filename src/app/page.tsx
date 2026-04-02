import { auth } from "@/auth"
import { GalaxySceneLoader } from "@/components/canvas/GalaxySceneLoader"

export default async function HomePage() {
  const session = await auth()

  return (
    <main className="relative h-screen w-screen overflow-hidden" style={{ background: "#000005" }}>
      <GalaxySceneLoader isAuthenticated={!!session} />
    </main>
  )
}
