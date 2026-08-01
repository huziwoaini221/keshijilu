interface Env {
  DB: D1Database
  PASSCODE: string
  BOT_TOKEN?: string
  CHAT_ID?: string
}

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

function authenticate(request: Request, env: Env): Response | null {
  if (!env.PASSCODE) return null
  const code = request.headers.get('X-Passcode') || request.headers.get('Authorization')?.replace('Bearer ', '')
  if (code !== env.PASSCODE) {
    return json({ error: 'Unauthorized' }, 401)
  }
  return null
}

async function tg(env: Env, text: string) {
  if (!env.BOT_TOKEN || !env.CHAT_ID) return
  try {
    await fetch(`https://api.telegram.org/bot${env.BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: +env.CHAT_ID, text, parse_mode: 'Markdown' }),
    })
  } catch {}
}

async function courseInfo(db: D1Database, courseId: string) {
  const c: any = await db.prepare('SELECT name,child_id FROM courses WHERE id=?').bind(courseId).first()
  if (!c) return { courseName: '?' }
  const ch: any = await db.prepare('SELECT name FROM children WHERE id=?').bind(c.child_id).first()
  return { courseName: c.name, childName: ch?.name || '?' }
}

export const onRequest: PagesFunction<Env> = async (context) => {
  const { request, env, waitUntil } = context
  const url = new URL(request.url)
  const path = url.pathname.replace(/\/$/, '')
  const method = request.method
  const db = env.DB

  if (method === 'OPTIONS') {
    return new Response(null, { status: 204 })
  }

  if (path !== '/api/auth' || method !== 'POST') {
    const authErr = authenticate(request, env)
    if (authErr) return authErr
  }

  try {
    if (path === '/api/auth' && method === 'POST') {
      const { passcode } = await request.json() as { passcode: string }
      if (passcode === env.PASSCODE) return json({ ok: true })
      return json({ error: 'Invalid passcode' }, 401)
    }

    if (path === '/api/families' && method === 'GET') {
      const { results } = await db.prepare('SELECT * FROM families').all()
      return json(results)
    }

    if (path === '/api/families' && method === 'POST') {
      const body = await request.json() as { id: string; name: string }
      await db.prepare('INSERT INTO families (id, name) VALUES (?, ?)').bind(body.id, body.name).run()
      return json({ ok: true }, 201)
    }

    if (path === '/api/children' && method === 'GET') {
      const familyId = url.searchParams.get('family_id')
      if (!familyId) return json({ error: 'family_id required' }, 400)
      const { results } = await db.prepare('SELECT * FROM children WHERE family_id = ?').bind(familyId).all()
      return json(results)
    }

    if (path === '/api/children' && method === 'POST') {
      const body = await request.json() as { id: string; family_id: string; name: string; birthday?: string; created_at: string }
      await db.prepare(
        'INSERT INTO children (id, family_id, name, birthday, created_at) VALUES (?, ?, ?, ?, ?)'
      ).bind(body.id, body.family_id, body.name, body.birthday || null, body.created_at).run()
      waitUntil(tg(env, `👶 新增孩子：${body.name}`))
      return json({ ok: true }, 201)
    }

    if (path.match(/^\/api\/children\/[\w-]+$/) && method === 'PUT') {
      const id = path.split('/').pop()!
      const body = await request.json() as { name?: string; birthday?: string }
      const old: any = await db.prepare('SELECT name FROM children WHERE id=?').bind(id).first()
      await db.prepare('UPDATE children SET name = COALESCE(?, name), birthday = COALESCE(?, birthday) WHERE id = ?')
        .bind(body.name || null, body.birthday || null, id).run()
      waitUntil(tg(env, `✏️ 修改孩子：${old?.name || '?'}`))
      return json({ ok: true })
    }

    if (path.match(/^\/api\/children\/[\w-]+$/) && method === 'DELETE') {
      const id = path.split('/').pop()!
      const old: any = await db.prepare('SELECT name FROM children WHERE id=?').bind(id).first()
      await db.batch([
        db.prepare('DELETE FROM lesson_records WHERE course_id IN (SELECT id FROM courses WHERE child_id = ?)').bind(id),
        db.prepare('DELETE FROM purchases WHERE course_id IN (SELECT id FROM courses WHERE child_id = ?)').bind(id),
        db.prepare('DELETE FROM courses WHERE child_id = ?').bind(id),
        db.prepare('DELETE FROM children WHERE id = ?').bind(id),
      ])
      waitUntil(tg(env, `🗑️ 删除孩子：${old?.name || '?'}`))
      return json({ ok: true })
    }

    if (path === '/api/organizations' && method === 'GET') {
      const familyId = url.searchParams.get('family_id')
      if (!familyId) return json({ error: 'family_id required' }, 400)
      const { results } = await db.prepare('SELECT * FROM organizations WHERE family_id = ?').bind(familyId).all()
      return json(results)
    }

    if (path === '/api/organizations' && method === 'POST') {
      const body = await request.json() as { id: string; family_id: string; name: string; teacher?: string; phone?: string; address?: string; created_at: string }
      await db.prepare(
        'INSERT INTO organizations (id, family_id, name, teacher, phone, address, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)'
      ).bind(body.id, body.family_id, body.name, body.teacher || null, body.phone || null, body.address || null, body.created_at).run()
      waitUntil(tg(env, `🏫 新增机构：${body.name}`))
      return json({ ok: true }, 201)
    }

    if (path.match(/^\/api\/organizations\/[\w-]+$/) && method === 'PUT') {
      const id = path.split('/').pop()!
      const body = await request.json() as any
      const old: any = await db.prepare('SELECT name FROM organizations WHERE id=?').bind(id).first()
      await db.prepare(
        'UPDATE organizations SET name = ?, teacher = ?, phone = ?, address = ? WHERE id = ?'
      ).bind(body.name, body.teacher || null, body.phone || null, body.address || null, id).run()
      waitUntil(tg(env, `✏️ 修改机构：${old?.name || '?'} → ${body.name}`))
      return json({ ok: true })
    }

    if (path.match(/^\/api\/organizations\/[\w-]+$/) && method === 'DELETE') {
      const id = path.split('/').pop()!
      const old: any = await db.prepare('SELECT name FROM organizations WHERE id=?').bind(id).first()
      await db.prepare('DELETE FROM organizations WHERE id = ?').bind(id).run()
      waitUntil(tg(env, `🗑️ 删除机构：${old?.name || '?'}`))
      return json({ ok: true })
    }

    if (path === '/api/courses' && method === 'GET') {
      const childId = url.searchParams.get('child_id')
      if (childId) {
        const { results } = await db.prepare('SELECT * FROM courses WHERE child_id = ?').bind(childId).all()
        return json(results)
      }
      const familyId = url.searchParams.get('family_id')
      if (!familyId) return json({ error: 'family_id or child_id required' }, 400)
      const { results } = await db.prepare('SELECT * FROM courses WHERE family_id = ?').bind(familyId).all()
      return json(results)
    }

    if (path === '/api/courses' && method === 'POST') {
      const body = await request.json() as any
      await db.prepare(
        `INSERT INTO courses (id, family_id, child_id, organization_id, name, lessons_per_session, default_time_start, default_time_end, price, expire_date, alert_threshold, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      ).bind(
        body.id, body.family_id, body.child_id, body.organization_id || null,
        body.name, body.lessons_per_session || 1,
        body.default_time_start || null, body.default_time_end || null,
        body.price || null, body.expire_date || null, body.alert_threshold || 10, body.created_at
      ).run()
      const ch: any = await db.prepare('SELECT name FROM children WHERE id=?').bind(body.child_id).first()
      waitUntil(tg(env, `📚 新增课程：${body.name}（${ch?.name || '?'}）`))
      return json({ ok: true }, 201)
    }

    if (path.match(/^\/api\/courses\/[\w-]+$/) && method === 'GET') {
      const id = path.split('/').pop()!
      const course = await db.prepare('SELECT * FROM courses WHERE id = ?').bind(id).first()
      if (!course) return json({ error: 'Not found' }, 404)

      const [purchasesResult, recordsResult] = await db.batch([
        db.prepare('SELECT COALESCE(SUM(lessons + gift_lessons), 0) as total FROM purchases WHERE course_id = ?').bind(id),
        db.prepare('SELECT COALESCE(SUM(consume_lessons), 0) as used FROM lesson_records WHERE course_id = ? AND consume_lessons > 0').bind(id),
      ])
      const totalBought = (purchasesResult.results?.[0] as any)?.total ?? 0
      const usedLessons = (recordsResult.results?.[0] as any)?.used ?? 0

      return json({
        ...course,
        totalBought,
        usedLessons,
        remainingLessons: totalBought - usedLessons,
      })
    }

    if (path.match(/^\/api\/courses\/[\w-]+$/) && method === 'PUT') {
      const id = path.split('/').pop()!
      const body = await request.json() as any
      const info: any = await db.prepare(`
        SELECT c.name, ch.name as childName FROM courses c
        LEFT JOIN children ch ON ch.id = c.child_id WHERE c.id=?
      `).bind(id).first()
      await db.prepare(
        `UPDATE courses SET name = ?, lessons_per_session = ?, organization_id = ?, default_time_start = ?, default_time_end = ?, expire_date = ?, alert_threshold = ? WHERE id = ?`
      ).bind(
        body.name, body.lessons_per_session, body.organization_id || null,
        body.default_time_start || null, body.default_time_end || null,
        body.expire_date || null, body.alert_threshold, id
      ).run()
      waitUntil(tg(env, `✏️ 修改课程：${info?.name || '?'}（${info?.childName || '?'}）`))
      return json({ ok: true })
    }

    if (path.match(/^\/api\/courses\/[\w-]+$/) && method === 'DELETE') {
      const id = path.split('/').pop()!
      const info: any = await db.prepare(`
        SELECT c.name, ch.name as childName FROM courses c
        LEFT JOIN children ch ON ch.id = c.child_id WHERE c.id=?
      `).bind(id).first()
      await db.batch([
        db.prepare('DELETE FROM lesson_records WHERE course_id = ?').bind(id),
        db.prepare('DELETE FROM purchases WHERE course_id = ?').bind(id),
        db.prepare('DELETE FROM courses WHERE id = ?').bind(id),
      ])
      waitUntil(tg(env, `🗑️ 删除课程：${info?.name || '?'}（${info?.childName || '?'}）`))
      return json({ ok: true })
    }

    if (path === '/api/purchases' && method === 'GET') {
      const courseId = url.searchParams.get('course_id')
      if (!courseId) return json({ error: 'course_id required' }, 400)
      const { results } = await db.prepare('SELECT * FROM purchases WHERE course_id = ? ORDER BY date DESC').bind(courseId).all()
      return json(results)
    }

    if (path === '/api/purchases' && method === 'POST') {
      const body = await request.json() as any
      await db.prepare(
        'INSERT INTO purchases (id, family_id, course_id, date, lessons, gift_lessons, amount, payment_method, remark, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
      ).bind(body.id, body.family_id, body.course_id, body.date, body.lessons, body.gift_lessons || 0, body.amount || null, body.payment_method || null, body.remark || null, body.created_at).run()
      const info = await courseInfo(db, body.course_id)
      waitUntil(tg(env, `➕ ${info.childName} · ${info.courseName} · 购课 ${body.lessons}+${body.gift_lessons || 0} 节`))
      return json({ ok: true }, 201)
    }

    if (path.match(/^\/api\/purchases\/[\w-]+$/) && method === 'PUT') {
      const id = path.split('/').pop()!
      const body = await request.json() as any
      const p: any = await db.prepare('SELECT course_id FROM purchases WHERE id=?').bind(id).first()
      await db.prepare(
        'UPDATE purchases SET date = ?, lessons = ?, gift_lessons = ?, amount = ?, payment_method = ?, remark = ? WHERE id = ?'
      ).bind(body.date, body.lessons, body.gift_lessons || 0, body.amount || null, body.payment_method || null, body.remark || null, id).run()
      if (p) {
        const info = await courseInfo(db, p.course_id)
        waitUntil(tg(env, `✏️ ${info.childName} · ${info.courseName} · 修改购课（${body.lessons}+${body.gift_lessons || 0} 节）`))
      }
      return json({ ok: true })
    }

    if (path.match(/^\/api\/purchases\/[\w-]+$/) && method === 'DELETE') {
      const id = path.split('/').pop()!
      const p: any = await db.prepare('SELECT course_id FROM purchases WHERE id=?').bind(id).first()
      await db.prepare('DELETE FROM purchases WHERE id = ?').bind(id).run()
      if (p) {
        const info = await courseInfo(db, p.course_id)
        waitUntil(tg(env, `🗑️ ${info.childName} · ${info.courseName} · 删除购课`))
      }
      return json({ ok: true })
    }

    if (path === '/api/records' && method === 'GET') {
      const courseId = url.searchParams.get('course_id')
      if (!courseId) return json({ error: 'course_id required' }, 400)
      const { results } = await db.prepare('SELECT * FROM lesson_records WHERE course_id = ? ORDER BY date DESC').bind(courseId).all()
      return json(results)
    }

    if (path === '/api/records' && method === 'POST') {
      const body = await request.json() as any
      await db.prepare(
        'INSERT INTO lesson_records (id, family_id, course_id, date, start_time, end_time, status, consume_lessons, remark, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
      ).bind(
        body.id, body.family_id, body.course_id, body.date,
        body.start_time || null, body.end_time || null,
        body.status, body.consume_lessons, body.remark || null, body.created_at
      ).run()
      const info = await courseInfo(db, body.course_id)
      waitUntil(tg(env, `➖ ${info.childName} · ${info.courseName} · 销课 ${body.consume_lessons} 节`))
      if (body.status === 'attended' || body.status === 'completed') {
        const [pr, rr] = await db.batch([
          db.prepare('SELECT COALESCE(SUM(lessons+gift_lessons),0) as t FROM purchases WHERE course_id=?').bind(body.course_id),
          db.prepare('SELECT COALESCE(SUM(consume_lessons),0) as u FROM lesson_records WHERE course_id=? AND consume_lessons>0').bind(body.course_id),
        ])
        const total = (pr.results?.[0] as any)?.t ?? 0
        const used = (rr.results?.[0] as any)?.u ?? 0
        const remaining = total - used
        const c: any = await db.prepare('SELECT alert_threshold FROM courses WHERE id=?').bind(body.course_id).first()
        if (c && remaining <= c.alert_threshold) {
          waitUntil(tg(env, `⚠️ ${info.childName} · ${info.courseName} · 仅剩 ${remaining} 节（阈值 ${c.alert_threshold}）`))
        }
      }
      return json({ ok: true }, 201)
    }

    if (path.match(/^\/api\/records\/[\w-]+$/) && method === 'DELETE') {
      const id = path.split('/').pop()!
      const r: any = await db.prepare('SELECT course_id, consume_lessons FROM lesson_records WHERE id=?').bind(id).first()
      await db.prepare('DELETE FROM lesson_records WHERE id = ?').bind(id).run()
      if (r) {
        const info = await courseInfo(db, r.course_id)
        waitUntil(tg(env, `↩️ ${info.childName} · ${info.courseName} · 撤销销课 ${r.consume_lessons} 节`))
      }
      return json({ ok: true })
    }

    if (path === '/api/sync' && method === 'GET') {
      const familyId = url.searchParams.get('family_id')
      if (!familyId) return json({ error: 'family_id required' }, 400)
      const [children, organizations, courses, purchases, records] = await db.batch([
        db.prepare('SELECT * FROM children WHERE family_id = ?').bind(familyId),
        db.prepare('SELECT * FROM organizations WHERE family_id = ?').bind(familyId),
        db.prepare('SELECT * FROM courses WHERE family_id = ?').bind(familyId),
        db.prepare('SELECT * FROM purchases WHERE family_id = ?').bind(familyId),
        db.prepare('SELECT * FROM lesson_records WHERE family_id = ?').bind(familyId),
      ])
      return json({
        children: children.results,
        organizations: organizations.results,
        courses: courses.results,
        purchases: purchases.results,
        lessonRecords: records.results,
      })
    }

    if (path.match(/^\/api\/stats\/[\w-]+$/) && method === 'GET') {
      const courseId = path.split('/').pop()!
      const [purchasesResult, recordsResult] = await db.batch([
        db.prepare('SELECT COALESCE(SUM(lessons + gift_lessons), 0) as total FROM purchases WHERE course_id = ?').bind(courseId),
        db.prepare('SELECT COALESCE(SUM(consume_lessons), 0) as used FROM lesson_records WHERE course_id = ? AND consume_lessons > 0').bind(courseId),
      ])
      const totalBought = (purchasesResult.results?.[0] as any)?.total ?? 0
      const usedLessons = (recordsResult.results?.[0] as any)?.used ?? 0
      return json({ totalBought, usedLessons, remainingLessons: totalBought - usedLessons })
    }

    return json({ error: 'Not found' }, 404)
  } catch (e: any) {
    return json({ error: e.message }, 500)
  }
}
