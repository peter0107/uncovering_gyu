import { chromium } from 'playwright'
import { writeFileSync } from 'fs'

const BASE = 'http://localhost:3333'
const SS = (name) => `verify_${name}.png`

async function shot(page, name) {
  await page.screenshot({ path: SS(name), fullPage: true })
  console.log(`📸 ${name}`)
}

async function run() {
  const browser = await chromium.launch({ headless: true })
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } })
  const page = await ctx.newPage()

  // ── 1. Home page ──
  await page.goto(BASE)
  await page.waitForLoadState('networkidle')
  await shot(page, '01_home')
  console.log('✅ Home loaded —', await page.title())

  // ── 2. Navigate to /mission ──
  // Find the CTA button (시작하기 or 미션 시작)
  const startBtn = page.locator('a[href="/mission"], button:has-text("시작"), a:has-text("시작")')
  await startBtn.first().click()
  await page.waitForURL('**/mission**')
  await page.waitForLoadState('networkidle')
  await shot(page, '02_mission1_loaded')
  console.log('✅ Mission page loaded')

  // ── 3. Check IRT selected first mission (should show title, not hardcoded) ──
  const missionTitle = await page.locator('h2').first().textContent()
  console.log('   Mission 1 title:', missionTitle)

  // ── 4. Answer mission 1 ──
  const textarea = page.locator('textarea')
  await textarea.fill('친구와 함께 새로운 아이디어를 만들어봤다. 사람들과 협력하면서 완료했다.')
  await shot(page, '03_mission1_typed')

  await page.locator('button:has-text("제출하기")').click()
  await page.waitForSelector('text=미션 완료!')
  await shot(page, '04_mission1_reaction')
  console.log('✅ Reaction screen appeared')

  // ── 5. Submit reaction ──
  await page.locator('button:has-text("중간 결과 확인")').click()

  // Wait for partial-loading then partial-result
  await page.waitForSelector('text=분석 중', { timeout: 3000 }).catch(() => {})
  await shot(page, '05_partial_loading')

  await page.waitForSelector('text=중간 패턴 발견', { timeout: 8000 })
  await shot(page, '06_partial_result')

  const pattern = await page.locator('text=분석').first().textContent().catch(() => '(not found)')
  console.log('✅ Partial result shown:', pattern?.slice(0, 50))

  // Check scores are displayed (not all zero)
  const scoreText = await page.locator('.space-y-3').first().textContent().catch(() => '')
  console.log('   Score bar text:', scoreText.replace(/\s+/g,' ').trim().slice(0, 80))

  // ── 6. Continue to mission 2 ──
  await page.locator('button:has-text("미션 2 계속하기")').click()
  await page.waitForSelector('h2')
  await shot(page, '07_mission2')
  const m2title = await page.locator('h2').first().textContent()
  console.log('✅ Mission 2:', m2title)

  // Check IRT selected a DIFFERENT mission (not same as mission 1)
  if (m2title === missionTitle) {
    console.log('⚠️  Mission 2 has same title as Mission 1 — possible IRT dedup issue')
  } else {
    console.log('✅ IRT selected a different mission for round 2')
  }

  // Check for action mission badge
  const badge = await page.locator('text=행동 미션').isVisible().catch(() => false)
  if (badge) console.log('✅ Action mission badge visible')

  // ── 7. Fast-forward through remaining missions (3-6) ──
  const FILLER_ANSWERS = [
    '구조적으로 분석해서 정리했다. 논리적으로 완료.',
    '만약 새로운 방법이 있다면 해봤다.',
    '사람들과 함께 프로젝트를 완료했다.',
    '아이디어를 실행하고 결과를 냈다.',
  ]

  for (let i = 2; i <= 6; i++) {
    // If already on answer phase, fill and submit
    const ta = page.locator('textarea')
    const isOnAnswer = await ta.isVisible().catch(() => false)
    if (!isOnAnswer) {
      // might be on partial-result still
      const continueBtn = page.locator(`button:has-text("미션 ${i} 계속하기")`)
      if (await continueBtn.isVisible().catch(() => false)) await continueBtn.click()
    }

    await page.locator('textarea').waitFor({ timeout: 5000 })
    const mTitleN = await page.locator('h2').first().textContent().catch(() => '')
    console.log(`   Mission ${i}: ${mTitleN?.slice(0, 40)}`)

    await page.locator('textarea').fill(FILLER_ANSWERS[i - 2] ?? '완료했다. 사람들과 함께.')

    const isLast = i === 6
    await page.locator('button:has-text("제출하기")').click()
    await page.waitForSelector('text=미션 완료!', { timeout: 5000 })

    // Set reactions to 4/4/4/4 (above default)
    const sliders = page.locator('input[type=range]')
    const count = await sliders.count()
    for (let s = 0; s < count; s++) {
      await sliders.nth(s).fill('4')
    }

    if (isLast) {
      await page.locator('button:has-text("결과 분석하기")').click()
      break
    } else {
      await page.locator('button:has-text("중간 결과 확인")').click()
      await page.waitForSelector('text=중간 패턴 발견', { timeout: 10000 })
      await page.locator(`button:has-text("미션 ${i + 1} 계속하기")`).click()
    }
  }

  // ── 8. Analyzing page ──
  await page.waitForURL('**/analyzing**', { timeout: 5000 })
  await shot(page, '08_analyzing')
  console.log('✅ Analyzing page reached')

  // ── 9. Result page ──
  await page.waitForURL('**/result**', { timeout: 15000 })
  await page.waitForLoadState('networkidle')
  await shot(page, '09_result')
  console.log('✅ Result page reached')

  // Check mock banner
  const mockBanner = await page.locator('text=mock 모드').isVisible().catch(() => false)
  console.log(mockBanner ? '✅ Mock banner visible' : '❌ Mock banner NOT found')

  // Check type_title is dynamic (not hardcoded)
  const typeTitle = await page.locator('h1').first().textContent()
  console.log('   type_title:', typeTitle)
  const isDynamic = !['사람을 연결하는 실행가'].includes(typeTitle ?? '')
  console.log(isDynamic ? '✅ type_title is dynamic (not old hardcoded)' : '⚠️  type_title looks hardcoded')

  // Check score bars rendered
  const scoreBars = await page.locator('.rounded-full').count()
  console.log('   Score bars count:', scoreBars)

  // Check insights section
  const insightText = await page.locator('text=분석했어요').isVisible().catch(() => false)
  console.log(insightText ? '✅ Mock insights visible' : '⚠️  Mock insights not visible')

  // ── 10. Probe: localStorage thetas persisted ──
  const thetas = await page.evaluate(() => localStorage.getItem('uncovering_thetas'))
  if (thetas) {
    const parsed = JSON.parse(thetas)
    const changed = Object.values(parsed).some(v => v !== 5)
    console.log('✅ IRT thetas persisted in localStorage:', JSON.stringify(parsed))
    console.log(changed ? '✅ Thetas changed from initial 5 — updateTheta ran' : '⚠️  Thetas all still 5')
  } else {
    console.log('❌ uncovering_thetas not found in localStorage')
  }

  // Check completedIds
  const cids = await page.evaluate(() => localStorage.getItem('uncovering_completed_ids'))
  if (cids) {
    const ids = JSON.parse(cids)
    console.log(`✅ completedIds: [${ids}] (${ids.length} missions, all unique: ${new Set(ids).size === ids.length})`)
  }

  // ── 11. Probe: retry from result page ──
  await page.locator('button:has-text("다시 시작하기")').click()
  await page.waitForURL(`${BASE}/`, { timeout: 5000 })
  const missionsCleared = await page.evaluate(() => localStorage.getItem('uncovering_missions'))
  console.log(missionsCleared === null ? '✅ missions cleared on restart' : '⚠️  missions still in localStorage after restart')

  await shot(page, '10_restarted_home')
  console.log('✅ Returned to home after restart')

  await browser.close()
  console.log('\n✅ All steps complete')
}

run().catch(e => {
  console.error('❌ Error:', e.message)
  process.exit(1)
})
