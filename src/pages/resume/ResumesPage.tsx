import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Plus, Search, MoreVertical, Pencil, Copy, Trash2, Eye, FileText, Clock } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { useResumes, useDeleteResume, useDuplicateResume } from '@/features/resume/hooks/useResumes'
import { ROUTES } from '@/constants'
import { getInitials, formatDate } from '@/lib/utils'

export default function ResumesPage() {
  const [search, setSearch] = useState('')
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const navigate = useNavigate()

  const { data: resumes, isLoading } = useResumes()
  const { mutate: deleteResume, isPending: deleting } = useDeleteResume()
  const { mutate: duplicateResume } = useDuplicateResume()

  const filtered = resumes?.filter((r) =>
    r.title.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">My Resumes</h1>
          <p className="text-sm text-muted-foreground">
            {resumes?.length ?? 0} resume{resumes?.length !== 1 ? 's' : ''}
          </p>
        </div>
        <Link to={ROUTES.RESUME_NEW}>
          <Button><Plus className="h-4 w-4" /> Create Resume</Button>
        </Link>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search resumes…"
          className="pl-9"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1,2,3,4,5,6].map((i) => <Skeleton key={i} className="h-44 rounded-xl" />)}
        </div>
      ) : !filtered?.length ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <FileText className="h-14 w-14 text-muted-foreground/30 mb-4" />
            <p className="text-lg font-semibold">{search ? 'No resumes found' : 'No resumes yet'}</p>
            <p className="text-sm text-muted-foreground mt-1">
              {search ? 'Try a different search term.' : 'Create your first resume to get started.'}
            </p>
            {!search && (
              <Link to={ROUTES.RESUME_NEW} className="mt-4">
                <Button><Plus className="h-4 w-4" /> Create Resume</Button>
              </Link>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((resume) => (
            <Card key={resume.id} className="group hover:shadow-md transition-shadow">
              {/* Preview area */}
              <div
                className="h-32 rounded-t-xl bg-linear-to-br from-primary/10 to-primary/5 flex items-center justify-center cursor-pointer"
                onClick={() => navigate(ROUTES.RESUME_EDIT(resume.id))}
              >
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary text-primary-foreground text-xl font-bold">
                  {getInitials(resume.title)}
                </div>
              </div>

              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-semibold truncate">{resume.title}</p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                      <Clock className="h-3 w-3" />
                      {formatDate(resume.updated_at)}
                    </p>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => navigate(ROUTES.RESUME_EDIT(resume.id))}>
                        <Pencil className="h-4 w-4" /> Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => navigate(ROUTES.RESUME_PREVIEW(resume.id))}>
                        <Eye className="h-4 w-4" /> Preview
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => duplicateResume(resume.id)}>
                        <Copy className="h-4 w-4" /> Duplicate
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="text-destructive focus:text-destructive"
                        onClick={() => setDeleteId(resume.id)}
                      >
                        <Trash2 className="h-4 w-4" /> Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <Badge variant="secondary" className="mt-2 text-xs">{resume.status}</Badge>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Delete confirm dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete resume?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The resume and all its content will be permanently deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => { if (deleteId) deleteResume(deleteId, { onSuccess: () => setDeleteId(null) }) }}
              disabled={deleting}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
