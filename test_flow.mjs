import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();
await page.setViewportSize({ width: 1280, height: 800 });

// 헬퍼: 버튼 텍스트 목록
async function getButtons() {
  return page.evaluate(() =>
    Array.from(document.querySelectorAll('button')).map(e => e.textContent.trim())
  );
}

// 미션 페이지 시작
await page.goto('http://localhost:3000/mission');
await page.waitForLoadState('networkidle');
await page.waitForTimeout(500);

const answers = [
  '바다, 커피, 음악, 코딩, 여행',
  '프로젝트 완성했을 때 뿌듯함, 새로운 기술 배울 때 설렘',
  '사람들이 내 아이디어로 실제로 문제를 해결하는 모습',
  'UX 디자이너, 창업가, 개발자, 마케터',
];

for (let i = 0; i < answers.length; i++) {
  const missionNum = i + 1;
  console.log(`\n=== 미션 ${missionNum} ===`);

  // (1) answer 단계: textarea 입력 → 제출하기
  await page.waitForSelector('textarea', { timeout: 5000 });
  await page.fill('textarea', answers[i]);
  await page.waitForTimeout(200);
  await page.screenshot({ path: `test_m${missionNum}_a_answer.png`, fullPage: true });
  await page.click('button:has-text("제출하기")');
  await page.waitForTimeout(400);

  // (2) reaction 단계: 슬라이더 → "중간 결과 확인" 또는 "결과 분석하기"
  await page.waitForSelector('input[type="range"]', { timeout: 5000 });
  await page.screenshot({ path: `test_m${missionNum}_b_reaction.png`, fullPage: true });
  console.log(`  reaction 버튼:`, await getButtons());

  if (missionNum < answers.length) {
    await page.click('button:has-text("중간 결과 확인")');
    // (3) partial-loading → partial-result 대기
    await page.waitForSelector('button:has-text("계속하기")', { timeout: 8000 });
    await page.screenshot({ path: `test_m${missionNum}_c_partial.png`, fullPage: true });
    const partialText = await page.evaluate(() => document.body.innerText.slice(0, 300));
    console.log(`  중간결과:`, partialText.replace(/\n+/g, ' ').slice(0, 150));
    // (4) 다음 미션으로
    await page.click(`button:has-text("미션 ${missionNum + 1} 계속하기")`);
    await page.waitForTimeout(400);
  } else {
    // 마지막 미션: "결과 분석하기" 클릭 → /analyzing
    await page.click('button:has-text("결과 분석하기")');
    console.log(`  → 결과 분석하기 클릭, URL: ${page.url()}`);
  }
}

// analyzing 페이지 대기
await page.waitForURL('**/analyzing', { timeout: 5000 }).catch(() => {});
console.log('\n=== 분석 페이지 ===');
console.log('URL:', page.url());
await page.screenshot({ path: 'test_analyzing.png', fullPage: true });

// result 페이지 대기 (최대 10초)
await page.waitForURL('**/result', { timeout: 12000 });
await page.waitForLoadState('networkidle');
await page.waitForTimeout(500);

console.log('\n=== 결과 페이지 ===');
console.log('URL:', page.url());
await page.screenshot({ path: 'test_result.png', fullPage: true });
const resultText = await page.evaluate(() => document.body.innerText.slice(0, 800));
console.log('결과 내용:', resultText.replace(/\n+/g, ' ').slice(0, 500));

await browser.close();
console.log('\n✅ 전체 플로우 테스트 완료');
