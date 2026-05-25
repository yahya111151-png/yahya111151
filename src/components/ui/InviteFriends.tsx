'use client'

import { useState, useEffect } from 'react'
import { Users, MessageCircle, Copy, Check, Phone } from 'lucide-react'

interface Contact {
  name: string
  phone: string
}

interface InviteFriendsProps {
  username: string
  fullName: string
}

export default function InviteFriends({ username, fullName }: InviteFriendsProps) {
  const [contacts, setContacts] = useState<Contact[]>([])
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [contactsSupported, setContactsSupported] = useState(false)
  const [contactsLoaded, setContactsLoaded] = useState(false)
  const [copied, setCopied] = useState(false)
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState<Set<string>>(new Set())

  const profileUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/profile/${username}`
  const inviteText = `Hey! I'm on Lens — a social reputation app where people rate each other honestly. Check out my profile and rate me! 👇\n${profileUrl}\n\nJoin me on Lens 🌟`

  useEffect(() => {
    // @ts-ignore — Contact Picker API
    setContactsSupported('contacts' in navigator && 'ContactsManager' in window)
  }, [])

  async function loadContacts() {
    try {
      // @ts-ignore
      const results = await navigator.contacts.select(['name', 'tel'], { multiple: true })
      const parsed: Contact[] = results
        .filter((c: any) => c.tel?.length && c.name?.length)
        .map((c: any) => ({
          name: c.name[0],
          phone: c.tel[0].replace(/\s+/g, '').replace(/[^+\d]/g, ''),
        }))
      setContacts(parsed)
      setContactsLoaded(true)
    } catch {
      // User cancelled or denied
    }
  }

  function toggleContact(phone: string) {
    setSelected(prev => {
      const next = new Set(prev)
      next.has(phone) ? next.delete(phone) : next.add(phone)
      return next
    })
  }

  function sendWhatsApp(phone: string, name: string) {
    const text = encodeURIComponent(`Hey ${name}! ${inviteText}`)
    const url = `https://wa.me/${phone.replace(/\D/g, '')}?text=${text}`
    window.open(url, '_blank')
    setSent(prev => new Set([...prev, phone]))
  }

  function sendToSelected() {
    setSending(true)
    const toSend = contacts.filter(c => selected.has(c.phone))
    // Open one at a time with small delay
    toSend.forEach((c, i) => {
      setTimeout(() => sendWhatsApp(c.phone, c.name), i * 800)
    })
    setTimeout(() => setSending(false), toSend.length * 800 + 500)
  }

  function sendGenericWhatsApp() {
    const text = encodeURIComponent(inviteText)
    window.open(`https://wa.me/?text=${text}`, '_blank')
  }

  async function copyLink() {
    await navigator.clipboard.writeText(profileUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="bg-surface border border-border rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="px-4 py-4 border-b border-border">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-green-500/15 flex items-center justify-center shrink-0">
            <Users size={16} className="text-green-400" />
          </div>
          <div>
            <p className="font-bold text-foreground text-sm">Invite friends</p>
            <p className="text-muted text-xs">More ratings = higher score = better perks</p>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-3">
        {/* WhatsApp buttons */}
        <div className="grid grid-cols-2 gap-2">
          {/* Open WhatsApp directly */}
          <button
            onClick={sendGenericWhatsApp}
            className="flex items-center justify-center gap-2 px-3 py-3 rounded-xl font-bold text-sm transition-all bg-[#25D366] text-white hover:bg-[#20b858] active:scale-95"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
            </svg>
            WhatsApp
          </button>

          {/* Copy link */}
          <button
            onClick={copyLink}
            className={`flex items-center justify-center gap-2 px-3 py-3 rounded-xl font-bold text-sm transition-all border active:scale-95 ${
              copied
                ? 'bg-green-500/15 border-green-500/40 text-green-400'
                : 'bg-surface border-border text-foreground hover:border-primary/40'
            }`}
          >
            {copied ? <Check size={15} /> : <Copy size={15} />}
            {copied ? 'Copied!' : 'Copy link'}
          </button>
        </div>

        {/* Contact Picker — Android Chrome only */}
        {contactsSupported && !contactsLoaded && (
          <button
            onClick={loadContacts}
            className="w-full flex items-center justify-center gap-2 px-3 py-3 rounded-xl font-bold text-sm bg-primary/10 border border-primary/30 text-primary hover:bg-primary/15 transition-all active:scale-95"
          >
            <Phone size={15} />
            Pick from contacts
          </button>
        )}

        {/* Contacts list */}
        {contactsLoaded && contacts.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-muted">{contacts.length} contacts found</p>
              {selected.size > 0 && (
                <button
                  onClick={sendToSelected}
                  disabled={sending}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg bg-[#25D366] text-white hover:bg-[#20b858] disabled:opacity-50 transition-all"
                >
                  <MessageCircle size={12} />
                  {sending ? 'Opening…' : `Send to ${selected.size}`}
                </button>
              )}
            </div>

            <div className="max-h-52 overflow-y-auto space-y-1 rounded-xl border border-border divide-y divide-border">
              {contacts.map(c => (
                <div
                  key={c.phone}
                  className="flex items-center gap-3 px-3 py-2.5 hover:bg-surface/80 transition-colors"
                >
                  <button
                    onClick={() => toggleContact(c.phone)}
                    className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-colors ${
                      selected.has(c.phone)
                        ? 'bg-primary border-primary'
                        : 'border-border'
                    }`}
                  >
                    {selected.has(c.phone) && <Check size={11} className="text-white" />}
                  </button>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">{c.name}</p>
                    <p className="text-xs text-muted truncate">{c.phone}</p>
                  </div>
                  <button
                    onClick={() => sendWhatsApp(c.phone, c.name)}
                    className={`p-1.5 rounded-lg transition-colors shrink-0 ${
                      sent.has(c.phone)
                        ? 'text-green-400'
                        : 'text-[#25D366] hover:bg-green-500/10'
                    }`}
                    title={sent.has(c.phone) ? 'Sent!' : 'Send via WhatsApp'}
                  >
                    {sent.has(c.phone)
                      ? <Check size={16} />
                      : <MessageCircle size={16} />
                    }
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {contactsLoaded && contacts.length === 0 && (
          <p className="text-center text-muted text-xs py-2">No contacts with phone numbers found</p>
        )}

        <p className="text-[11px] text-muted/60 text-center">
          Invite message includes your profile link
        </p>
      </div>
    </div>
  )
}
