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
    const totalIngredientsCountEl = document.getElementById('total-ingredients-count');
    const selectedMenusListEl = document.getElementById('selected-menus-list');

    // 재료 우선 모드 요소
    const allIngredientsListEl = document.getElementById('all-ingredients-list');
    const possibleMenusListEl = document.getElementById('possible-menus-list');

    // --- 상태 관리 ---
    let allMenus = [];
    let allIngredients = new Set();
    const selectedMenus = new Set(); // 선택된 메뉴 이름 저장
    let ownedIngredients = new Set(); // 보유한 재료 이름 저장
    let isIngredientModeInitialized = false;

    // --- 재료 카테고리 분류 ---
    const ingredientCategoryMap = {
        // 육류
        '돼지고기': '육류', '소고기': '육류', '닭다리': '육류', '닭고기': '육류', '소갈비': '육류', '삼겹살': '육류', '차돌박이': '육류', '오리고기': '육류',
        // 해산물
        '고등어': '해산물', '오징어': '해산물', '새우': '해산물', '해산물': '해산물', '멸치': '해산물', '북어': '해산물', '꽁치': '해산물', '낙지': '해산물', '명란': '해산물',
        // 채소
        '파': '채소', '양파': '채소', '애호박': '채소', '버섯': '채소', '당근': '채소', '양배추': '채소', '시금치': '채소', '콩나물': '채소', '생강': '채소', '감자': '채소', '피망': '채소', '부추': '채소', '무': '채소', '고구마': '채소', '숙주': '채소', '토마토': '채소', '상추': '채소', '깻잎': '채소', '나물': '채소', '표고버섯': '채소', '팽이버섯': '채소', '오이': '채소', '고사리': '채소',
        // 가공/유제품/계란
        '두부': '가공/유제품', '계란': '가공/유제품', '유부': '가공/유제품', '소세지': '가공/유제품', '스팸': '가공/유제품', '어묵': '가공/유제품', '버터': '가공/유제품', '생크림': '가공/유제품', '우유': '가공/유제품', '순두부': '가공/유제품', '만두': '가공/유제품',
        // 곡물/면/가루
        '밀가루': '곡물/면/가루', '부침가루': '곡물/면/가루', '당면': '곡물/면/가루', '스파게티 면': '곡물/면/가루', '떡': '곡물/면/가루', '국수': '곡물/면/가루',
        // 소스/기타
        '오꼬노미 소스': '소스/기타', '마요네즈': '소스/기타', '토마토소스': '소스/기타', '올리브오일': '소스/기타', '카레가루': '소스/기타', '두반장': '소스/기타', '김': '소스/기타', '다시다': '소스/기타', '사골': '소스/기타'
    };

    /**
     * 재료의 카테고리를 반환하는 함수
     * @param {string} ingredient 
     * @returns {string} category
     */
    function getIngredientCategory(ingredient) {
        if (ingredient.includes('김치')) return '채소';
        return ingredientCategoryMap[ingredient] || '기타';
    }

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
            const order = ['찌개', '국', '탕', '찜', '조림', '볶음', '구이', '전', '나물', '반찬', '밥', '면', '커리', '쌈', '기타'];
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
            const targetH3 = event.target.closest('.menu-type-section h3');

            if (targetLi) {
                handleMenuClick(targetLi);
                return; // 메뉴 아이템 클릭 시 드롭다운 토글 방지
            }

            if (targetH3) {
                // h3의 부모인 .menu-type-section에 active 클래스를 토글
                targetH3.parentElement.classList.toggle('active');
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
     * 선택된 메뉴 목록을 화면에 렌더링
     */
    function renderSelectedMenus() {
        selectedMenusListEl.innerHTML = '';
        if (selectedMenus.size === 0) {
            selectedMenusListEl.innerHTML = '<li class="placeholder">메뉴를 선택해주세요.</li>';
            return;
        }

        const sortedMenus = Array.from(selectedMenus).sort();
        sortedMenus.forEach(menuName => {
            const li = document.createElement('li');
            li.textContent = menuName;
            selectedMenusListEl.appendChild(li);
        });
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

        const totalCount = ingredientCount.size;

        // 재료를 카테고리별로 그룹화
        const categorizedIngredients = new Map();
        for (const [ingredient, count] of ingredientCount.entries()) {
            const category = getIngredientCategory(ingredient);
            if (!categorizedIngredients.has(category)) {
                categorizedIngredients.set(category, []);
            }
            categorizedIngredients.get(category).push({ name: ingredient, count });
        }

        // 각 카테고리 내에서 재료를 가나다순으로 정렬
        for (const ingredients of categorizedIngredients.values()) {
            ingredients.sort((a, b) => a.name.localeCompare(b.name));
        }

        // 카테고리 자체를 정해진 순서대로 정렬
        const categoryOrder = ['육류', '해산물', '채소', '가공/유제품', '곡물/면/가루', '소스/기타', '기타'];
        const sortedCategorizedIngredients = new Map(
            [...categorizedIngredients.entries()].sort(([catA], [catB]) => {
                const indexA = categoryOrder.indexOf(catA);
                const indexB = categoryOrder.indexOf(catB);
                if (indexA === -1 && indexB === -1) return catA.localeCompare(catB);
                if (indexA === -1) return 1;
                if (indexB === -1) return -1;
                return indexA - indexB;
            })
        );

        renderSelectedMenus();
        renderShoppingList(sortedCategorizedIngredients, totalCount);
    }

    /**
     * 쇼핑 목록을 화면에 렌더링
     * @param {Map<string, Array<{name: string, count: number}>>} categorizedIngredients - 렌더링할 분류된 재료 목록
     * @param {number} totalCount - 총 재료 개수
     */
    function renderShoppingList(categorizedIngredients, totalCount) {
        shoppingListEl.innerHTML = ''; // 기존 목록 초기화

        if (categorizedIngredients.size === 0) {
            shoppingListEl.innerHTML = '<li class="placeholder">메뉴를 선택해주세요.</li>';
            copyButton.style.display = 'none'; // 재료가 없으면 버튼 숨기기
            totalIngredientsCountEl.textContent = '';
            return;
        }

        copyButton.style.display = 'inline-block'; // 재료가 있으면 버튼 보이기

        for (const [category, ingredients] of categorizedIngredients.entries()) {
            // 카테고리 헤더 생성
            totalIngredientsCountEl.textContent = `(${totalCount}개)`;
            const categoryLi = document.createElement('li');
            categoryLi.classList.add('shopping-list-category');
            categoryLi.textContent = category;
            shoppingListEl.appendChild(categoryLi);

            // 해당 카테고리의 재료 아이템들 생성
            ingredients.forEach(({ name, count }) => {
                const li = document.createElement('li');
                
                const nameSpan = document.createElement('span');
                nameSpan.textContent = name;
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
        if (selectedMenus.size === 0) return;

        // 재료 목록을 다시 계산하고 분류
        const ingredientCount = new Map();
        selectedMenus.forEach(menuName => {
            const menu = allMenus.find(m => m.name === menuName);
            if (menu) {
                menu.ingredients.forEach(ingredient => {
                    ingredientCount.set(ingredient, (ingredientCount.get(ingredient) || 0) + 1);
                });
            }
        });

        const categorizedIngredients = new Map();
        for (const [ingredient, count] of ingredientCount.entries()) {
            const category = getIngredientCategory(ingredient);
            if (!categorizedIngredients.has(category)) {
                categorizedIngredients.set(category, []);
            }
            categorizedIngredients.get(category).push({ name: ingredient, count });
        }

        for (const ingredients of categorizedIngredients.values()) {
            ingredients.sort((a, b) => a.name.localeCompare(b.name));
        }

        const categoryOrder = ['육류', '해산물', '채소', '가공/유제품', '곡물/면/가루', '소스/기타', '기타'];
        const sortedCategorizedIngredients = new Map(
            [...categorizedIngredients.entries()].sort(([catA], [catB]) => {
                const indexA = categoryOrder.indexOf(catA);
                const indexB = categoryOrder.indexOf(catB);
                if (indexA === -1 && indexB === -1) return catA.localeCompare(catB);
                if (indexA === -1) return 1;
                if (indexB === -1) return -1;
                return indexA - indexB;
            })
        );

        // 복사할 텍스트 포맷 생성
        const selectedMenusTitle = '⭐ 선택한 메뉴';
        const selectedMenusText = Array.from(selectedMenus).sort().map(name => `- ${name}`).join('\n');

        const ingredientsTitle = '🛒 구매해야하는 식재료';
        const ingredientsListText = Array.from(sortedCategorizedIngredients.entries())
            .map(([category, ingredients]) => {
                const items = ingredients.map(ing => {
                    let line = `- ${ing.name}`;
                    if (ing.count > 1) {
                        line += ` * ${ing.count}`;
                    }
                    return line;
                }).join('\n');
                return `\n[${category}]\n${items}`;
            })
            .join('');

        const textToCopy = `${selectedMenusTitle}\n${selectedMenusText}\n\n${ingredientsTitle}${ingredientsListText}`;

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
        // 1. 전체 재료 목록 생성 및 그룹화
        const allIngredientsSet = new Set();
        allMenus.forEach(menu => {
            menu.ingredients.forEach(ing => allIngredientsSet.add(ing));
        });

        const categorizedIngredients = new Map();
        allIngredientsSet.forEach(ingredient => {
            const category = getIngredientCategory(ingredient);
            if (!categorizedIngredients.has(category)) {
                categorizedIngredients.set(category, []);
            }
            categorizedIngredients.get(category).push(ingredient);
        });

        // 각 카테고리 내에서 재료를 가나다순으로 정렬
        for (const ingredients of categorizedIngredients.values()) {
            ingredients.sort((a, b) => a.localeCompare(b));
        }

        // 카테고리 자체를 정해진 순서대로 정렬
        const categoryOrder = ['육류', '해산물', '채소', '가공/유제품', '곡물/면/가루', '소스/기타', '기타'];
        const sortedCategorizedIngredients = new Map(
            [...categorizedIngredients.entries()].sort(([catA], [catB]) => {
                const indexA = categoryOrder.indexOf(catA);
                const indexB = categoryOrder.indexOf(catB);
                if (indexA === -1 && indexB === -1) return catA.localeCompare(catB);
                if (indexA === -1) return 1;
                if (indexB === -1) return -1;
                return indexA - indexB;
            })
        );

        // 2. 화면에 렌더링
        allIngredientsListEl.innerHTML = ''; // This is now a div
        for (const [category, ingredients] of sortedCategorizedIngredients.entries()) {
            const categorySection = document.createElement('div');
            categorySection.className = 'ingredient-category-section';

            const categoryHeading = document.createElement('h3');
            categoryHeading.textContent = category;
            categorySection.appendChild(categoryHeading);

            const ingredientGrid = document.createElement('ul');
            ingredientGrid.className = 'ingredient-grid';

            ingredients.forEach(ingredient => {
                const li = document.createElement('li');
                li.textContent = ingredient;
                li.dataset.ingredientName = ingredient;
                if (ownedIngredients.has(ingredient)) {
                    li.classList.add('selected');
                }
                ingredientGrid.appendChild(li);
            });

            categorySection.appendChild(ingredientGrid);
            allIngredientsListEl.appendChild(categorySection);
        }

        // 3. 이벤트 리스너 설정
        allIngredientsListEl.addEventListener('click', (event) => {
            const targetLi = event.target.closest('.ingredient-grid li');
            const targetH3 = event.target.closest('.ingredient-category-section h3');

            if (targetLi) {
                handleIngredientClick(targetLi);
                return; // 재료 아이템 클릭 시 드롭다운 토글 방지
            }

            if (targetH3) {
                // h3의 부모인 .ingredient-category-section에 active 클래스를 토글
                targetH3.parentElement.classList.toggle('active');
            }
        });

        isIngredientModeInitialized = true;
    }

    /**
 * 보유 재료 클릭 이벤트 처리
 * @param {HTMLElement} ingredientElement - 클릭된 재료 li 요소
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