import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Loader2, User, Lock, Trash2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useAuthStore } from '@/store/auth.store'
import { supabase } from '@/lib/supabase'
import { getInitials } from '@/lib/utils'

const profileSchema = z.object({
  full_name: z.string().min(2, 'Name must be at least 2 characters'),
})

const passwordSchema = z.object({
  new_password: z.string().min(8, 'Password must be at least 8 characters'),
  confirm_password: z.string(),
}).refine(d => d.new_password === d.confirm_password, { message: "Passwords don't match", path: ['confirm_password'] })

export default function ProfilePage() {
  const { user } = useAuthStore()
  const [profileSuccess, setProfileSuccess] = useState(false)
  const [passwordSuccess, setPasswordSuccess] = useState(false)
  const [profileLoading, setProfileLoading] = useState(false)
  const [passwordLoading, setPasswordLoading] = useState(false)
  const [profileError, setProfileError] = useState('')
  const [passwordError, setPasswordError] = useState('')

  const displayName = user?.user_metadata?.full_name ?? user?.email ?? ''
  const avatarUrl = user?.user_metadata?.avatar_url as string | undefined

  const profileForm = useForm({
    resolver: zodResolver(profileSchema),
    defaultValues: { full_name: user?.user_metadata?.full_name ?? '' },
  })

  const passwordForm = useForm({
    resolver: zodResolver(passwordSchema),
    defaultValues: { new_password: '', confirm_password: '' },
  })

  async function handleProfileSave(values: { full_name: string }) {
    setProfileLoading(true); setProfileError(''); setProfileSuccess(false)
    try {
      const { error } = await supabase.auth.updateUser({ data: { full_name: values.full_name } })
      if (error) throw error
      await supabase.from('profiles').update({ full_name: values.full_name }).eq('user_id', user!.id)
      setProfileSuccess(true)
    } catch (e) {
      setProfileError((e as Error).message)
    } finally {
      setProfileLoading(false)
    }
  }

  async function handlePasswordChange(values: { new_password: string }) {
    setPasswordLoading(true); setPasswordError(''); setPasswordSuccess(false)
    try {
      const { error } = await supabase.auth.updateUser({ password: values.new_password })
      if (error) throw error
      setPasswordSuccess(true)
      passwordForm.reset()
    } catch (e) {
      setPasswordError((e as Error).message)
    } finally {
      setPasswordLoading(false)
    }
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Profile Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">Manage your account information and preferences.</p>
      </div>

      {/* Avatar */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              {avatarUrl && <AvatarImage src={avatarUrl} />}
              <AvatarFallback className="text-lg">{getInitials(displayName)}</AvatarFallback>
            </Avatar>
            <div>
              <p className="font-semibold">{displayName}</p>
              <p className="text-sm text-muted-foreground">{user?.email}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="profile">
        <TabsList>
          <TabsTrigger value="profile"><User className="h-3.5 w-3.5" /> Profile</TabsTrigger>
          <TabsTrigger value="security"><Lock className="h-3.5 w-3.5" /> Security</TabsTrigger>
        </TabsList>

        {/* Profile tab */}
        <TabsContent value="profile">
          <Card>
            <CardHeader><CardTitle className="text-base">Personal Information</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              {profileSuccess && <Alert variant="success"><AlertDescription>Profile updated successfully!</AlertDescription></Alert>}
              {profileError && <Alert variant="destructive"><AlertDescription>{profileError}</AlertDescription></Alert>}
              <Form {...profileForm}>
                <form onSubmit={profileForm.handleSubmit(handleProfileSave)} className="space-y-4">
                  <FormField control={profileForm.control} name="full_name" render={({ field }) => (
                    <FormItem><FormLabel>Full Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <div className="space-y-1">
                    <FormLabel>Email</FormLabel>
                    <Input value={user?.email ?? ''} disabled className="bg-muted" />
                    <p className="text-xs text-muted-foreground">Email cannot be changed here.</p>
                  </div>
                  <Button type="submit" disabled={profileLoading}>
                    {profileLoading && <Loader2 className="animate-spin" />} Save Changes
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security tab */}
        <TabsContent value="security">
          <Card>
            <CardHeader><CardTitle className="text-base">Change Password</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              {passwordSuccess && <Alert variant="success"><AlertDescription>Password changed successfully!</AlertDescription></Alert>}
              {passwordError && <Alert variant="destructive"><AlertDescription>{passwordError}</AlertDescription></Alert>}
              <Form {...passwordForm}>
                <form onSubmit={passwordForm.handleSubmit(handlePasswordChange)} className="space-y-4">
                  <FormField control={passwordForm.control} name="new_password" render={({ field }) => (
                    <FormItem><FormLabel>New Password</FormLabel><FormControl><Input type="password" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={passwordForm.control} name="confirm_password" render={({ field }) => (
                    <FormItem><FormLabel>Confirm Password</FormLabel><FormControl><Input type="password" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <Button type="submit" disabled={passwordLoading}>
                    {passwordLoading && <Loader2 className="animate-spin" />} Update Password
                  </Button>
                </form>
              </Form>

              <Separator />

              <div>
                <p className="text-sm font-medium text-destructive mb-1">Danger Zone</p>
                <p className="text-xs text-muted-foreground mb-3">Permanently delete your account and all your data.</p>
                <Button variant="destructive" size="sm" disabled>
                  <Trash2 className="h-4 w-4" /> Delete Account
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
