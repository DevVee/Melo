import { useRef, useState } from 'react'
import { Camera, X, Sparkles, Loader2, MapPin, Navigation } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useBuilderStore } from '@/store/builder.store'

// ─── Resize image to ≤300px, return base64 ─────────────────────────────────

async function resizeImage(file: File, maxSize = 300): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      const scale = Math.min(1, maxSize / Math.max(img.width, img.height))
      const w = Math.round(img.width * scale)
      const h = Math.round(img.height * scale)
      const canvas = document.createElement('canvas')
      canvas.width = w; canvas.height = h
      const ctx = canvas.getContext('2d')!
      ctx.drawImage(img, 0, 0, w, h)
      resolve(canvas.toDataURL('image/jpeg', 0.85))
      URL.revokeObjectURL(img.src)
    }
    img.onerror = reject
    img.src = URL.createObjectURL(file)
  })
}

// ─── Reverse-geocode using BigDataCloud (free, no key) ──────────────────────

interface BDCResponse {
  city?: string
  locality?: string
  principalSubdivision?: string
  countryName?: string
  localityInfo?: {
    administrative?: Array<{ name: string; order: number; adminLevel?: number }>
  }
}

/** Strip ISO "(the)" suffixes: "Philippines (the)" → "Philippines" */
function cleanCountryName(raw: string): string {
  return raw.replace(/\s*\(the\b[^)]*\)\s*$/i, '').trim()
}

async function reverseGeocode(
  lat: number, lng: number
): Promise<{ city: string; country: string; address: string }> {
  const res  = await fetch(
    `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=en`
  )
  const data = await res.json() as BDCResponse

  // Strip any parenthetical suffix from a name: "Batangas (3rd District)" → "Batangas"
  function stripParens(s: string) { return s.replace(/\s*\([^)]*\)\s*/g, '').trim() }

  // Country: strip "(the)" suffix — e.g. "Philippines (the)" → "Philippines"
  const country = cleanCountryName(data.countryName || '')

  // City field: "Locality, Province" — e.g. "Balayan, Batangas"
  const locality = stripParens(data.locality || data.city || '')
  const province = stripParens(data.principalSubdivision || '')
  const city = [locality, province].filter(Boolean).join(', ')

  // Barangay / street: pick the most granular admin level from localityInfo
  let address = ''
  const admins = data.localityInfo?.administrative
  if (admins && admins.length > 0) {
    const sorted = [...admins].sort((a, b) => b.order - a.order)
    // Find a granular entry (order ≥ 7) that isn't the same as locality
    const barangay = sorted.find(
      a => a.order >= 7 && a.name && a.name !== locality
    )
    if (barangay) address = barangay.name
  }

  return { city, country, address }
}

// ─── Component ────────────────────────────────────────────────────────────────

export function PersonalInfoForm() {
  const personal     = useBuilderStore(s => s.personal)
  const update       = useBuilderStore(s => s.updatePersonal)
  const profilePhoto = useBuilderStore(s => s.profilePhoto)
  const setPhoto     = useBuilderStore(s => s.setProfilePhoto)
  const fileRef      = useRef<HTMLInputElement>(null)
  const [locating, setLocating] = useState(false)

  async function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const base64 = await resizeImage(file)
      setPhoto(base64)
    } catch {
      alert('Could not load image. Please try a different file.')
    }
  }

  async function detectLocation() {
    if (!navigator.geolocation) return
    setLocating(true)
    try {
      const pos = await new Promise<GeolocationPosition>((resolve, reject) =>
        navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 10000 })
      )
      const { city, country, address } = await reverseGeocode(pos.coords.latitude, pos.coords.longitude)
      if (city)    update({ city })
      if (country) update({ country })
      if (address) update({ address })
    } catch {
      /* user denied or error — fail silently */
    } finally {
      setLocating(false)
    }
  }

  function field(
    key: keyof typeof personal,
    label: string,
    placeholder: string,
    type = 'text',
    required = false,
  ) {
    return (
      <div className="space-y-1">
        <Label className="text-xs font-semibold">
          {label}
          {required
            ? <span className="ml-1 text-red-400">*</span>
            : <span className="ml-1 font-normal text-gray-400">optional</span>}
        </Label>
        <Input
          type={type}
          placeholder={placeholder}
          value={personal[key] as string}
          onChange={e => update({ [key]: e.target.value })}
        />
      </div>
    )
  }

  return (
    <div className="space-y-5">

      {/* Show AI-generated title if already set */}
      {personal.professionalTitle && (
        <div className="rounded-xl bg-purple-50 border border-purple-100 px-3 py-2 flex items-center gap-2">
          <Sparkles className="h-3.5 w-3.5 text-purple-400 shrink-0" />
          <div className="min-w-0">
            <p className="text-[10px] text-purple-400 font-semibold uppercase tracking-wider">AI-generated title</p>
            <p className="text-sm font-semibold text-gray-800 truncate">{personal.professionalTitle}</p>
          </div>
        </div>
      )}

      {/* Photo upload */}
      <div className="flex items-center gap-4">
        <div className="relative shrink-0">
          <div
            className="h-20 w-20 rounded-full overflow-hidden border-2 border-dashed border-border bg-muted flex items-center justify-center cursor-pointer hover:border-primary transition-colors"
            onClick={() => fileRef.current?.click()}
          >
            {profilePhoto ? (
              <img src={profilePhoto} alt="Profile" className="h-full w-full object-cover" />
            ) : (
              <Camera className="h-6 w-6 text-muted-foreground" />
            )}
          </div>
          {profilePhoto && (
            <button
              onClick={() => setPhoto('')}
              className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-destructive text-white flex items-center justify-center hover:opacity-80"
            >
              <X className="h-3 w-3" />
            </button>
          )}
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
        </div>
        <div>
          <p className="text-sm font-semibold text-gray-800">Profile Photo</p>
          <p className="text-xs text-muted-foreground mt-0.5">Optional. Appears on resume.<br />JPG or PNG.</p>
          <button
            onClick={() => fileRef.current?.click()}
            className="mt-2 text-xs text-primary underline hover:no-underline"
          >
            {profilePhoto ? 'Change photo' : 'Upload photo'}
          </button>
        </div>
      </div>

      {/* Name */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {field('firstName', 'First Name',  'Juan',       'text', true)}
        {field('lastName',  'Last Name',   'dela Cruz',  'text', true)}
      </div>

      {/* Contact */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {field('email', 'Email Address',  'juan@example.com',  'email', true)}
        {field('phone', 'Phone Number',   '+63 912 345 6789',  'tel'       )}
      </div>

      {/* Location — with detect button */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-xs font-semibold flex items-center gap-1.5">
            <MapPin className="h-3.5 w-3.5 text-purple-400" /> Location
            <span className="font-normal text-gray-400">optional</span>
          </Label>
          <button
            onClick={detectLocation}
            disabled={locating}
            className="flex items-center gap-1 rounded-[3px] px-2.5 py-1 text-[11px] font-semibold text-purple-600 bg-purple-50 border border-purple-200 hover:bg-purple-100 transition-colors disabled:opacity-50"
          >
            {locating
              ? <Loader2 className="h-3 w-3 animate-spin" />
              : <Navigation className="h-3 w-3" />}
            {locating ? 'Detecting…' : 'Detect my location'}
          </button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {field('city',    'City / Province',    'e.g. Balayan, Batangas'   )}
          {field('country', 'Country',            'e.g. Philippines'         )}
          {field('address', 'Barangay / Street',  'e.g. Barangay San Lorenzo')}
        </div>
      </div>

      {/* Online presence */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {field('linkedin', 'LinkedIn URL',        'https://linkedin.com/in/…', 'url')}
        {field('website',  'Portfolio / Website', 'https://yoursite.com',      'url')}
      </div>

    </div>
  )
}
