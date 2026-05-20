import Navbar from '@/components/Navbar'
import InstallPrompt from '@/components/InstallPrompt'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Navbar />
      <main className="min-h-screen pt-0 md:pt-14 pb-20 md:pb-0">
        {children}
      </main>
      <InstallPrompt />
    </>
  )
}
