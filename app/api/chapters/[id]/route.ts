import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data, error } = await supabase
    .from('chapters')
    .select('*, project:projects(id, user_id)')
    .eq('id', id)
    .single()

  if (error || !data) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if ((data.project as any).user_id !== user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  return NextResponse.json(data)
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { title, content, word_count, sort_order } = await req.json()

  const { data: chapter } = await supabase
    .from('chapters')
    .select('id, project:projects(user_id)')
    .eq('id', id)
    .single()

  if (!chapter || (chapter.project as any).user_id !== user.id)
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { data: updated, error } = await supabase
    .from('chapters')
    .update({ title, content, word_count, sort_order, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error }, { status: 500 })
  return NextResponse.json(updated)
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: chapter } = await supabase
    .from('chapters')
    .select('id, project:projects(user_id)')
    .eq('id', id)
    .single()

  if (!chapter || (chapter.project as any).user_id !== user.id)
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  await supabase.from('chapters').delete().eq('id', id)
  return NextResponse.json({ success: true })
}
