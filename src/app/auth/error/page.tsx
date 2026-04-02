import { TryAgainButton } from "./TryAgainButton"

const ERROR_MESSAGES: Record<string, string> = {
  OAuthSignin: "Failed to start Spotify login.",
  OAuthCallback: "Spotify login was denied or failed.",
  OAuthAccountNotLinked: "This account is already linked to another login.",
  Callback: "There was an issue during login.",
  Default: "An unexpected error occurred.",
}

interface AuthErrorPageProps {
  searchParams: Promise<{ error?: string }>
}

export default async function AuthErrorPage({
  searchParams,
}: AuthErrorPageProps) {
  const { error } = await searchParams
  const message = ERROR_MESSAGES[error ?? ""] ?? ERROR_MESSAGES.Default

  return (
    <main
      className="flex min-h-screen items-center justify-center"
      style={{ background: "#000005" }}
    >
      <div className="text-center max-w-md px-6">
        <div
          className="text-6xl mb-6"
          style={{ color: "var(--neon-pink)" }}
        >
          !
        </div>
        <h1
          className="text-2xl font-bold mb-3"
          style={{ color: "var(--neon-pink)" }}
        >
          Something went wrong
        </h1>
        <p className="text-white/60 mb-8">{message}</p>
        <TryAgainButton />
      </div>
    </main>
  )
}
