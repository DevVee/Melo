import { useRef } from 'react'
import { Camera, X, Sparkles, Loader2 } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useBuilderStore } from '@/store/builder.store'
import { useMutation } from '@tanstack/react-query'
import { callGroq, GROQ_MODELS } from '@/lib/groq'

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

// ─── Component ────────────────────────────────────────────────────────────────

export function PersonalInfoForm() {
  const personal       = useBuilderStore(s => s.personal)
  const update         = useBuilderStore(s => s.updatePersonal)
  const profilePhoto   = useBuilderStore(s => s.profilePhoto)
  const setPhoto       = useBuilderStore(s => s.setProfilePhoto)
  const targetJobTitle = useBuilderStore(s => s.targetJobTitle)
  const groqApiKey     = useBuilderStore(s => s.groqApiKey)
  const fileRef        = useRef<HTMLInputElement>(null)

  // AI suggest professional title
  const { mutate: suggestTitle, isPending: suggestingTitle } = useMutation({
    mutationFn: async () => {
      const ctx = [
        targetJobTitle && `Target job: ${targetJobTitle}`,
        personal.firstName && `Name: ${personal.firstName} ${personal.lastName}`,
      ].filter(Boolean).join(', ')
      return callGroq(
        [
          { role: 'system', content: 'You are a career expert. Suggest a punchy, professional resume headline/title. Output ONLY the title text, nothing else. Max 6 words.' },
          { role: 'user', content: `Suggest a professional title for: ${ctx || 'general professional'}` },
        ],
        30, GROQ_MODELS.ULTRAFAST, groqApiKey,
      )
    },
    onSuccess: (title) => update({ professionalTitle: title }),
  })

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

  function field(key: keyof typeof personal, label: string, placeholder: string, type = 'text') {
    return (
      <div className="space-y-1">
        <Label className="text-xs font-medium">{label}</Label>
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
          <p className="text-sm font-medium">Profile Photo</p>
          <p className="text-xs text-muted-foreground mt-0.5">Appears on your resume.<br />JPG, PNG — cropped to circle.</p>
          <button
            onClick={() => fileRef.current?.click()}
            className="mt-2 text-xs text-primary underline hover:no-underline"
          >
            {profilePhoto ? 'Change photo' : 'Upload photo'}
          </button>
        </div>
      </div>

      {/* Name */}
      <div className="grid grid-cols-2 gap-4">
        {field('firstName', 'First Name *', 'Juan')}
        {field('lastName', 'Last Name *', 'dela Cruz')}
      </div>

      {/* Professional title with AI */}
      <div className="space-y-1">
        <Label className="text-xs font-medium">Professional Title</Label>
        <div className="flex gap-2">
          <Input
            placeholder="e.g. Software Engineer · Marketing Manager · Barista"
            value={personal.professionalTitle}
            onChange={e => update({ professionalTitle: e.target.value })}
            className="flex-1"
          />
          <button
            onClick={() => suggestTitle()}
            disabled={suggestingTitle}
            className="shrink-0 flex items-center gap-1.5 rounded-md border border-input bg-background px-3 py-2 text-xs font-medium hover:bg-accent transition-colors disabled:opacity-50"
            title="AI suggest title"
          >
            {suggestingTitle ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5 text-primary" />}
            <span className="hidden sm:inline">AI</span>
          </button>
        </div>
        <p className="text-xs text-muted-foreground">This appears under your name on the resume.</p>
      </div>

      {/* Contact */}
      <div className="grid grid-cols-2 gap-4">
        {field('email', 'Email', 'juan@example.com', 'email')}
        {field('phone', 'Phone', '+63 912 345 6789', 'tel')}
      </div>

      {/* Location */}
      <div className="grid grid-cols-3 gap-3">
        {field('city', 'City', 'Manila')}
        {field('country', 'Country', 'Philippines')}
        {field('address', 'Street Address', 'Quezon City')}
      </div>

      {/* Online presence */}
      <div className="grid grid-cols-2 gap-4">
        {field('linkedin', 'LinkedIn URL', 'https://linkedin.com/in/…', 'url')}
        {field('website', 'Portfolio / Website', 'https://yoursite.com', 'url')}
      </div>
    </div>
  )
}
