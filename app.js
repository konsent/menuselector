document.addEventListener('DOMContentLoaded', () => {
    // --- DOM 요소 ---
    const headerSubtitle = document.getElementById('header-subtitle');
    const modeToggle = document.getElementById('mode-toggle');
    const menuFirstModeEl = document.getElementById('menu-first-mode');
    const ingredientFirstModeEl = document.getElementById('ingredient-first-mode');

    // 메뉴 우선 모드 요소
    const menuCategoriesEl = document.getElementById('menu-categories');
    const shoppingListEl = document.getElementById('shopping-list');
    const copyButton = document.getElementById('copy-button');

    // 재료 우선 모드 요소
    const allIngredientsListEl = document.getElementById('all-ingredients-list');
    const possibleMenusListEl = document.getElementById('possible-menus-list');

    // --- 상태 관리 ---
    let allMenus = [];
    let allIngredients = new Set();
    const selectedMenus = new Set(); // 선택된 메뉴 이름 저장
    let ownedIngredients = new Set(); // 보유한 재료 이름 저장
    let isIngredientModeInitialized = false;

    /**
     * JSON 데이터 로드 및 앱 초기화
     */
    async function init() {
        try {
            const response = await fetch('data.json');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            allMenus = data.menus;

            renderMenus();
            setupEventListeners();

            // 현재 모드에 맞춰 초기 렌더링
            if (modeToggle.checked) {
                switchToIngredientMode();
            } else {
                switchToMenuMode();
            }

            // 클립보드 API 지원 여부 확인 및 복사 버튼 상태 설정
            if (!navigator.clipboard || !navigator.clipboard.writeText) {
                copyButton.style.display = 'none'; // 지원하지 않으면 버튼 숨김
            }
        } catch (error) {
            console.error("데이터를 불러오는 데 실패했습니다:", error);
            menuCategoriesEl.innerHTML = '<p class="error">메뉴를 불러올 수 없습니다.</p>';
        }
    }

    /**
     * 전체 메뉴 목록을 화면에 렌더링 (타입별 분류)
     */
    function renderMenus() {
        menuCategoriesEl.innerHTML = ''; // 기존 목록 초기화

        const menusByType = new Map();
        allMenus.forEach(menu => {
            const type = menu.type || '기타'; // type이 없으면 '기타'로 분류
            if (!menusByType.has(type)) {
                menusByType.set(type, []);
            }
            menusByType.get(type).push(menu);
        });

        // 타입별 정렬 순서 (선택 사항)
        const sortedTypes = Array.from(menusByType.keys()).sort((a, b) => {
            const order = ['찌개', '국', '볶음', '전', '밥', '반찬', '찜', '탕', '구이', '면', '커리', '쌈', '튀김', '나물', '장아찌', '젓갈', '만두', '샐러드', '기타'];
            const indexA = order.indexOf(a);
            const indexB = order.indexOf(b);

            if (indexA === -1 && indexB === -1) return a.localeCompare(b); // 둘 다 커스텀 순서에 없으면 알파벳 순
            if (indexA === -1) return 1; // A가 커스텀 순서에 없으면 B가 먼저
            if (indexB === -1) return -1; // B가 커스텀 순서에 없으면 A가 먼저
            return indexA - indexB; // 커스텀 순서대로 정렬
        });

        sortedTypes.forEach(type => {
            const typeSection = document.createElement('div');
            typeSection.classList.add('menu-type-section');

            const typeHeading = document.createElement('h3');
            typeHeading.textContent = type;
            typeSection.appendChild(typeHeading);

            const typeMenuList = document.createElement('ul');
            typeMenuList.classList.add('type-menu-list'); // CSS 적용을 위한 클래스

            menusByType.get(type).forEach(menu => {
                const li = document.createElement('li');
                li.textContent = menu.name;
                li.dataset.menuName = menu.name; // 데이터 속성으로 메뉴 이름 저장
                if (selectedMenus.has(menu.name)) {
                    li.classList.add('selected'); // 이전에 선택된 메뉴는 'selected' 클래스 추가
                }
                typeMenuList.appendChild(li);
            });
            typeSection.appendChild(typeMenuList);
            menuCategoriesEl.appendChild(typeSection);
        });
    }

    /**
     * 이벤트 리스너 설정
     */
    function setupEventListeners() {
        // 모드 토글 이벤트
        modeToggle.addEventListener('change', (event) => {
            if (event.target.checked) {
                switchToIngredientMode();
            } else {
                switchToMenuMode();
            }
        });

        // 메뉴 선택 이벤트 (메뉴 우선 모드)
        menuCategoriesEl.addEventListener('click', (event) => {
            const targetLi = event.target.closest('.type-menu-list li');
            if (targetLi) {
                handleMenuClick(targetLi);
            }
        });

        // 복사 버튼 이벤트 (메뉴 우선 모드)
        copyButton.addEventListener('click', handleCopyClick);
    }

    /**
     * 메뉴 클릭 이벤트 처리
     * @param {HTMLElement} menuElement - 클릭된 li 요소
     */
    function handleMenuClick(menuElement) {
        const menuName = menuElement.dataset.menuName;
        menuElement.classList.toggle('selected');

        if (selectedMenus.has(menuName)) {
            selectedMenus.delete(menuName);
        } else {
            selectedMenus.add(menuName);
        }

        updateShoppingList();
    }

    /**
     * 선택된 메뉴에 따라 쇼핑 목록 업데이트
     */
    function updateShoppingList() {
        const ingredientCount = new Map();

        selectedMenus.forEach(menuName => {
            const menu = allMenus.find(m => m.name === menuName);
            if (menu) {
                menu.ingredients.forEach(ingredient => {
                    ingredientCount.set(ingredient, (ingredientCount.get(ingredient) || 0) + 1);
                });
            }
        });

        const sortedIngredients = Array.from(ingredientCount.entries()).sort((a, b) => a[0].localeCompare(b[0]));
        renderShoppingList(sortedIngredients);
    }

    /**
     * 쇼핑 목록을 화면에 렌더링
     * @param {Array<[string, number]>} ingredients - 렌더링할 [재료, 개수] 목록
     */
    function renderShoppingList(ingredients) {
        shoppingListEl.innerHTML = ''; // 기존 목록 초기화

        if (ingredients.length === 0) {
            shoppingListEl.innerHTML = '<li class="placeholder">메뉴를 선택해주세요.</li>';
            copyButton.style.display = 'none'; // 재료가 없으면 버튼 숨기기
            return;
        }

        copyButton.style.display = 'inline-block'; // 재료가 있으면 버튼 보이기
        ingredients.forEach(([ingredient, count]) => {
            const li = document.createElement('li');
            
            const nameSpan = document.createElement('span');
            nameSpan.textContent = ingredient;
            li.appendChild(nameSpan);

            if (count > 1) {
                const countSpan = document.createElement('span');
                countSpan.classList.add('ingredient-count');
                countSpan.textContent = count;
                li.appendChild(countSpan);
            }
            shoppingListEl.appendChild(li);
        });
    }

    /**
     * 쇼핑 목록 복사 버튼 클릭 이벤트 처리
     */
    function handleCopyClick() {
        // 클립보드 API 지원 여부 다시 확인 (혹시 모를 경우 대비)
        if (!navigator.clipboard || !navigator.clipboard.writeText) {
            alert('이 브라우저에서는 클립보드 복사 기능을 지원하지 않습니다. (HTTPS 또는 localhost 환경에서 사용해주세요)');
            return;
        }
        const listItems = shoppingListEl.querySelectorAll('li:not(.placeholder)');
        if (listItems.length === 0) return;

        // 제목과 함께 재료 목록 및 수량을 포맷에 맞게 생성
        const title = '구매해야하는 식재료';
        const ingredientsText = Array.from(listItems)
            .map(li => {
                const name = li.querySelector('span:first-child').textContent;
                const countSpan = li.querySelector('.ingredient-count');
                if (countSpan) {
                    const count = countSpan.textContent;
                    return `- ${name} * ${count}`;
                }
                return `- ${name}`;
            })
            .join('\n');

        const textToCopy = `${title}\n${ingredientsText}`;

        navigator.clipboard.writeText(textToCopy).then(() => {
            // 복사 성공 시 사용자에게 피드백
            const originalText = copyButton.textContent;
            copyButton.textContent = '복사 완료!';
            copyButton.disabled = true;
            setTimeout(() => {
                copyButton.textContent = originalText;
                copyButton.disabled = false;
            }, 1500);
        }).catch(err => {
            console.error('클립보드 복사에 실패했습니다:', err);
            alert('클립보드 복사에 실패했습니다.');
        });
    }

    // --- 모드 전환 관련 함수 ---

    function switchToMenuMode() {
        headerSubtitle.textContent = "메뉴를 선택하면 구매할 식재료 목록이 나타납니다.";
        menuFirstModeEl.classList.add('active');
        ingredientFirstModeEl.classList.remove('active');
        updateShoppingList();
    }

    function switchToIngredientMode() {
        headerSubtitle.textContent = "보유한 재료를 선택하면 만들 수 있는 메뉴를 보여줍니다.";
        menuFirstModeEl.classList.remove('active');
        ingredientFirstModeEl.classList.add('active');

        if (!isIngredientModeInitialized) {
            initializeIngredientMode();
        }
        updatePossibleMenus();
    }

    // --- 재료 우선 모드 관련 함수 ---

    function initializeIngredientMode() {
        // 1. 전체 재료 목록 생성 및 렌더링
        const allIngredientsSet = new Set();
        allMenus.forEach(menu => {
            menu.ingredients.forEach(ing => allIngredientsSet.add(ing));
        });
        allIngredients = Array.from(allIngredientsSet).sort();

        allIngredientsListEl.innerHTML = '';
        allIngredients.forEach(ingredient => {
            const li = document.createElement('li');
            li.textContent = ingredient;
            li.dataset.ingredientName = ingredient;
            if (ownedIngredients.has(ingredient)) {
                li.classList.add('selected');
            }
            allIngredientsListEl.appendChild(li);
        });

        // 2. 이벤트 리스너 설정
        allIngredientsListEl.addEventListener('click', (event) => {
            const targetLi = event.target.closest('li');
            if (targetLi) {
                handleIngredientClick(targetLi);
            }
        });

        isIngredientModeInitialized = true;
    }

    /**
     * 쇼핑 목록을 화면에 렌더링
     * @param {string[]} ingredients - 렌더링할 재료 목록
     */
    function handleIngredientClick(ingredientElement) {
        const ingredientName = ingredientElement.dataset.ingredientName;
        ingredientElement.classList.toggle('selected');

        if (ownedIngredients.has(ingredientName)) {
            ownedIngredients.delete(ingredientName);
        } else {
            ownedIngredients.add(ingredientName);
        }

        updatePossibleMenus();
    }

    function updatePossibleMenus() {
        possibleMenusListEl.innerHTML = '';

        if (ownedIngredients.size === 0) {
            possibleMenusListEl.innerHTML = '<p class="placeholder">보유한 재료를 선택해보세요.</p>';
            return;
        }

        const possibleMenus = allMenus.map(menu => {
            const missingIngredients = menu.ingredients.filter(ing => !ownedIngredients.has(ing));
            const ownedCount = menu.ingredients.length - missingIngredients.length;
            return { menu, missingIngredients, ownedCount };
        }).filter(item => item.ownedCount > 0) // 보유 재료가 하나라도 있는 메뉴만 필터링
          .sort((a, b) => {
              // 1. 부족한 재료가 적은 순
              if (a.missingIngredients.length !== b.missingIngredients.length) {
                  return a.missingIngredients.length - b.missingIngredients.length;
              }
              // 2. 보유한 재료가 많은 순
              return b.ownedCount - a.ownedCount;
          });

        if (possibleMenus.length === 0) {
            possibleMenusListEl.innerHTML = '<p class="placeholder">선택한 재료로 만들 수 있는 메뉴가 없습니다.</p>';
            return;
        }

        possibleMenus.forEach(({ menu, missingIngredients }) => {
            const card = document.createElement('div');
            card.className = 'possible-menu-card';

            let content = `<h4>${menu.name}</h4>`;
            if (missingIngredients.length === 0) {
                content += '<p class="ready-to-cook">✅ 재료 모두 보유!</p>';
            } else {
                content += '<p>추가 필요 재료:</p>';
                content += '<ul class="missing-ingredients-list">';
                missingIngredients.forEach(ing => {
                    content += `<li>${ing}</li>`;
                });
                content += '</ul>';
            }
            card.innerHTML = content;
            possibleMenusListEl.appendChild(card);
        });
    }

    // 앱 실행
    init();
});