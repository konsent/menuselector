# 메뉴 카테고리 기본 닫힘 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 첫 화면에서 모든 메뉴 카테고리가 닫힌 상태로 시작하게 한다.

**Architecture:** 메뉴 카테고리를 만드는 `renderMenus()`의 초기 상태만 수정한다. 이후 카테고리 클릭·키보드 조작과 검색 필터링이 사용하는 `active` 클래스 토글 로직은 그대로 둔다.

**Tech Stack:** HTML5, CSS3, Vanilla JavaScript (ES6+), Node.js 내장 테스트 러너

## Global Constraints

- 초기 메뉴 카테고리는 모두 `aria-expanded="false"`여야 한다.
- 초기 렌더링에서 메뉴 카테고리에 `active` 클래스를 추가하지 않는다.
- 카테고리 클릭 및 Enter/Space 키의 토글 동작은 변경하지 않는다.
- 검색어가 있는 경우 결과가 있는 카테고리를 여는 기존 동작은 변경하지 않는다.
- 재료 우선 모드와 브라우저 저장 데이터는 변경하지 않는다.

---

### Task 1: 메뉴 카테고리의 초기 확장 상태 제거

**Files:**
- Create: `test/menu-categories-default-state.test.mjs`
- Modify: `app.js:172-186`

**Interfaces:**
- Consumes: `renderMenus()`가 생성하는 `.menu-type-section` 및 해당 `h3` 요소
- Produces: 초기 렌더링 시 모든 메뉴 카테고리가 닫힌 DOM 상태

- [ ] **Step 1: 초기 상태 회귀 테스트 작성**

`test/menu-categories-default-state.test.mjs`에 다음 테스트를 작성한다. 이 테스트는 첫 카테고리를 열도록 하는 소스 패턴이 남아 있지 않고, 모든 제목의 초기 ARIA 값이 닫힘임을 확인한다.

```js
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const appSource = await readFile(new URL('../app.js', import.meta.url), 'utf8');

test('menu categories start closed', () => {
    assert.match(appSource, /typeHeading\.setAttribute\('aria-expanded', 'false'\);/);
    assert.doesNotMatch(appSource, /index === 0 \? 'true' : 'false'/);
    assert.doesNotMatch(appSource, /if \(index === 0\) typeSection\.classList\.add\('active'\);/);
});

test('search-driven expansion remains in place', () => {
    assert.match(appSource, /section\.classList\.toggle\('active', searchTerm && sectionHasVisibleItems\);/);
});
```

- [ ] **Step 2: 테스트가 실패하는지 확인**

Run: `node --test test/menu-categories-default-state.test.mjs`

Expected: 첫 테스트가 `index === 0` 초기 확장 패턴을 발견해 FAIL.

- [ ] **Step 3: 최소 구현 적용**

`app.js`의 `sortedTypes.forEach((type, index) => {`를 `sortedTypes.forEach((type) => {`로 바꾼다. 이어서 다음 두 초기화 코드를 제거하고, ARIA 초기값을 닫힘으로 고정한다.

```js
typeHeading.setAttribute('aria-expanded', 'false');
```

제거할 코드:

```js
// 첫 번째 카테고리는 기본으로 열기
if (index === 0) typeSection.classList.add('active');
```

- [ ] **Step 4: 테스트 통과 확인**

Run: `node --test test/menu-categories-default-state.test.mjs`

Expected: 두 테스트 모두 PASS.

- [ ] **Step 5: 브라우저 수동 확인**

정적 서버로 `index.html`을 열어 다음을 확인한다.

1. 새로고침 직후 `찌개`를 포함한 모든 메뉴 항목이 숨겨져 있다.
2. `찌개` 제목을 클릭하고 Enter 및 Space 키를 각각 사용하면 항목이 열리고 닫힌다.
3. 메뉴 검색어를 입력하면 일치하는 메뉴가 있는 카테고리가 열리고, 검색어를 지우면 필터 동작이 정상으로 돌아간다.

- [ ] **Step 6: 변경 사항 커밋**

```bash
git add app.js test/menu-categories-default-state.test.mjs
git commit -m "fix: start menu categories closed"
```

## Plan Self-Review

- Spec coverage: 초기 닫힘은 Task 1의 구현과 첫 테스트가 다루며, 클릭·키보드 동작과 검색 자동 열림은 Task 1의 수동 확인 및 두 번째 테스트로 보호한다. 재료 우선 모드와 저장 데이터는 수정 대상 파일에 포함하지 않는다.
- Placeholder scan: 미결정 항목과 추후 작업 표시는 없다.
- Type consistency: 새 API나 함수는 추가하지 않으며, 기존 `renderMenus()`와 DOM 클래스/ARIA 속성 이름만 사용한다.
