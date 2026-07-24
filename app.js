import { INGREDIENT_GROUPS, getIngredientGroup, getIngredientCategory, CATEGORY_ORDER } from './categories.js';
import { parseQuantity, formatQuantity } from './utils.js';
import {
    loadPresetsFromStorage,
    savePresetsToStorage,
    saveCurrentState as persistCurrentState,
    loadCurrentStateFromStorage
} from './storage.js';
import { showInputDialog, showConfirmDialog, showToast } from './dialog.js';

document.addEventListener('DOMContentLoaded', () => {
    // --- DOM 요소 ---
    const headerSubtitle = document.getElementById('header-subtitle');
    const modeToggle = document.getElementById('mode-toggle');
    const menuFirstModeEl = document.getElementById('menu-first-mode');
    const ingredientFirstModeEl = document.getElementById('ingredient-first-mode');

    // 메뉴 우선 모드 요소
    const menuSearchInput = document.getElementById('menu-search-input');
    const autocompleteListEl = document.getElementById('autocomplete-list');
    const menuCategoriesEl = document.getElementById('menu-categories');
    const shoppingListEl = document.getElementById('shopping-list');
    const copyButton = document.getElementById('copy-button');
    const totalIngredientsCountEl = document.getElementById('total-ingredients-count');
    const selectedMenusListEl = document.getElementById('selected-menus-list');
    const basicIngredientsContainerEl = document.getElementById('basic-ingredients-container');
    const basicIngredientsListEl = document.getElementById('basic-ingredients-list');
    const ownedIngredientsDisplayContainerEl = document.getElementById('owned-ingredients-display-container');
    const ownedIngredientsDisplayListEl = document.getElementById('owned-ingredients-display-list');

    // 재료 우선 모드 요소
    const allIngredientsListEl = document.getElementById('all-ingredients-list');
    const possibleMenusListEl = document.getElementById('possible-menus-list');

    // 프리셋 관련 요소
    const presetManageBtn = document.getElementById('preset-manage-btn');
    const savePresetMenuBtn = document.getElementById('save-preset-menu-btn');
    const savePresetIngredientBtn = document.getElementById('save-preset-ingredient-btn');
    const updatePresetMenuBtn = document.getElementById('update-preset-menu-btn');
    const updatePresetIngredientBtn = document.getElementById('update-preset-ingredient-btn');
    const presetModal = document.getElementById('preset-modal');
    const presetListEl = document.getElementById('preset-list');
    const presetModalCloseBtn = presetModal.querySelector('.close-btn');

    // --- 상태 관리 ---
    let allMenus = [];
    let menuNameMap = new Map(); // 메뉴 이름 → 메뉴 객체 (O(1) 조회용)
    let allIngredients = new Set();
    const selectedMenus = new Set();
    let ownedIngredients = new Set(); // 보유한 재료 이름 저장
    let currentPresetId = null; // 현재 선택된 프리셋 ID
    let isIngredientModeInitialized = false;
    let allPresets = [];
    const basicIngredientKeywords = ['고춧가루', '마늘', '쌀', '밥', '설탕', '간장', '고추장', '참기름', '소금', '된장', '식초', '후추', '통깨', '맛술', '식용유', '김치국물'];

    /**
     * 현재 선택 상태를 로컬 스토리지에 저장
     */
    function saveCurrentState() {
        persistCurrentState({ selectedMenus, ownedIngredients, currentPresetId });
    }

    /**
     * JSON 데이터 로드 및 앱 초기화
     */
    async function init() {
        try {
            const response = await fetch('recipes.json');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();

            const menuMap = new Map();
            data.forEach(recipe => {
                if (!recipe.menu) return; // 이름이 없는 데이터는 제외

                const menuData = {
                    name: recipe.menu,
                    type: recipe.type,
                    link: recipe.link,
                    ingredients: [...(recipe.ingredients1 || []), ...(recipe.ingredients2 || [])].map(ing => ({
                        name: ing.name.split('\n')[0].trim(),
                        quantity: ing.quantity,
                        unit: ing.unit
                    }))
                };

                // 이미 같은 이름의 메뉴가 있더라도, 새로 추가할 메뉴에 link가 있고 기존 메뉴에 link가 없다면 덮어쓰기
                // 또는, 기존에 메뉴가 없다면 새로 추가
                if (!menuMap.has(recipe.menu) || (recipe.link && !menuMap.get(recipe.menu).link)) {
                    menuMap.set(recipe.menu, menuData);
                }
            });

            allMenus = Array.from(menuMap.values());
            menuNameMap = new Map(allMenus.map(m => [m.name, m])); // O(1) 조회 인덱스 구축

            // 전체 재료 목록 생성 (그룹 모달에서 사용)
            allMenus.forEach(menu => {
                menu.ingredients.forEach(ing => allIngredients.add(ing.name));
            });

            allPresets = loadPresetsFromStorage(); // 프리셋 불러오기

            // 새로고침 전 선택 상태 복원
            const savedState = loadCurrentStateFromStorage();
            savedState.selectedMenus.forEach(name => selectedMenus.add(name));
            savedState.ownedIngredients.forEach(name => ownedIngredients.add(name));
            if (savedState.currentPresetId && allPresets.some(p => p.id === savedState.currentPresetId)) {
                currentPresetId = savedState.currentPresetId;
            }
            const restoredCount = selectedMenus.size + ownedIngredients.size;
            if (restoredCount > 0) {
                setTimeout(() => showToast(`이전 선택 ${restoredCount}개를 불러왔습니다.`), 400);
            }

            // 프리셋 표시 요소 생성
            const presetDisplay = document.createElement('span');
            presetDisplay.id = 'current-preset-display';
            presetDisplay.className = 'current-preset-display';
            if (presetManageBtn && presetManageBtn.parentNode) {
                presetManageBtn.parentNode.insertBefore(presetDisplay, presetManageBtn.nextSibling);
            }
            updateCurrentPresetDisplay();

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
            const order = ['찌개', '국', '탕', '찜', '조림', '볶음', '구이', '튀김', '무침', '회', '반찬', '밥', '면', '커리', '기타'];
            const indexA = order.indexOf(a);
            const indexB = order.indexOf(b);

            if (indexA === -1 && indexB === -1) return a.localeCompare(b); // 둘 다 커스텀 순서에 없으면 알파벳 순
            if (indexA === -1) return 1; // A가 커스텀 순서에 없으면 B가 먼저
            if (indexB === -1) return -1; // B가 커스텀 순서에 없으면 A가 먼저
            return indexA - indexB; // 커스텀 순서대로 정렬
        });

        sortedTypes.forEach((type) => {
            const typeSection = document.createElement('div');
            typeSection.classList.add('menu-type-section');

            const typeHeading = document.createElement('h3');
            typeHeading.textContent = type;
            typeHeading.setAttribute('role', 'button');
            typeHeading.setAttribute('tabindex', '0');
            typeHeading.setAttribute('aria-expanded', 'false');

            typeSection.appendChild(typeHeading);

            const typeMenuList = document.createElement('ul');
            typeMenuList.classList.add('type-menu-list'); // CSS 적용을 위한 클래스

            const menusForType = menusByType.get(type);
            menusForType.sort((a, b) => a.name.localeCompare(b.name)); // 메뉴 이름을 가나다순으로 정렬

            menusForType.forEach(menu => {
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
                const section = targetH3.parentElement;
                section.classList.toggle('active');
                targetH3.setAttribute('aria-expanded', section.classList.contains('active') ? 'true' : 'false');
            }
        });

        // 아코디언 키보드 접근성 (Enter/Space)
        menuCategoriesEl.addEventListener('keydown', (event) => {
            if (event.key === 'Enter' || event.key === ' ') {
                const targetH3 = event.target.closest('.menu-type-section h3');
                if (targetH3) {
                    event.preventDefault();
                    const section = targetH3.parentElement;
                    section.classList.toggle('active');
                    targetH3.setAttribute('aria-expanded', section.classList.contains('active') ? 'true' : 'false');
                }
            }
        });

        // 선택한 메뉴 목록에서 X 버튼 클릭 이벤트 처리
        selectedMenusListEl.addEventListener('click', (event) => {
            const removeBtn = event.target.closest('.remove-menu-btn');
            if (!removeBtn) return;

            // li 태그에서 메뉴 이름을 가져옴
            const menuName = removeBtn.parentElement.dataset.menuName;
            if (!menuName) return;

            // 1. 상태 업데이트 (Set에서 메뉴 제거)
            selectedMenus.delete(menuName);

            // 2. 메뉴 목록 그리드에서 'selected' 클래스 제거
            const menuItemInGrid = menuCategoriesEl.querySelector(`li[data-menu-name="${menuName}"]`);
            if (menuItemInGrid) {
                menuItemInGrid.classList.remove('selected');
            }

            // 3. 쇼핑 목록 및 선택된 메뉴 목록 업데이트
            updateShoppingList();
            saveCurrentState();
        });

        // 복사 버튼 이벤트 (메뉴 우선 모드)
        copyButton.addEventListener('click', handleCopyClick);

        // 메뉴 검색 이벤트
        menuSearchInput.addEventListener('input', handleMenuSearch);

        // 문서 전체에 클릭 이벤트를 추가하여 자동완성 목록 외부를 클릭하면 목록을 닫음
        document.addEventListener('click', (e) => {
            if (e.target !== menuSearchInput) {
                autocompleteListEl.innerHTML = '';
            }
        });

        // 프리셋 관리 버튼
        presetManageBtn.addEventListener('click', openPresetModal);
        presetModalCloseBtn.addEventListener('click', () => presetModal.classList.remove('show'));

        // 프리셋 저장 버튼
        savePresetMenuBtn.addEventListener('click', saveCurrentStateAsPreset);
        savePresetIngredientBtn.addEventListener('click', saveCurrentStateAsPreset);

        // 프리셋 업데이트 버튼 (메인 화면)
        updatePresetMenuBtn.addEventListener('click', () => {
            if (currentPresetId) updatePreset(currentPresetId);
        });
        updatePresetIngredientBtn.addEventListener('click', () => {
            if (currentPresetId) updatePreset(currentPresetId);
        });

        // 프리셋 목록 내 이벤트 위임 (불러오기, 삭제)
        presetListEl.addEventListener('click', handlePresetActions);

        // 모달 관련 이벤트 리스너 통합
        const unitInfoBtn = document.getElementById('unit-info-btn');
        const unitInfoModal = document.getElementById('unit-info-modal');
        const unitInfoModalCloseBtn = unitInfoModal.querySelector('.close-btn');
        const groupModal = document.getElementById('ingredient-group-modal');
        const groupModalCloseBtn = groupModal.querySelector('.close-btn');

        unitInfoBtn.addEventListener('click', () => unitInfoModal.classList.add('show'));
        unitInfoModalCloseBtn.addEventListener('click', () => unitInfoModal.classList.remove('show'));
        groupModalCloseBtn.addEventListener('click', () => groupModal.classList.remove('show'));

        // 모달 외부 클릭 시 닫기 (단위, 그룹, 프리셋, 다이얼로그 모달 통합 처리)
        window.addEventListener('click', (event) => {
            if (event.target === unitInfoModal) unitInfoModal.classList.remove('show');
            if (event.target === groupModal) groupModal.classList.remove('show');
            if (event.target === presetModal) presetModal.classList.remove('show');
        });

        // 검색 클리어 버튼
        const searchClearBtn = document.getElementById('search-clear-btn');
        if (searchClearBtn) {
            searchClearBtn.addEventListener('click', () => {
                menuSearchInput.value = '';
                searchClearBtn.style.display = 'none';
                autocompleteListEl.innerHTML = '';
                filterMenuList('');
            });
        }

        // 재료 전체 해제 버튼
        const clearIngredientsBtn = document.getElementById('clear-ingredients-btn');
        if (clearIngredientsBtn) {
            clearIngredientsBtn.addEventListener('click', () => {
                if (ownedIngredients.size === 0) return;
                ownedIngredients.clear();
                document.querySelectorAll('#all-ingredients-list li.selected').forEach(li => {
                    li.classList.remove('selected');
                });
                updatePossibleMenus();
                saveCurrentState();
            });
        }
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
        saveCurrentState();
    }

    /**
     * 메뉴 검색 이벤트 처리 (자동완성 및 목록 필터링)
     * @param {Event} event - input 이벤트 객체
     */
    function handleMenuSearch(event) {
        const searchTerm = event.target.value.toLowerCase().trim();

        // 클리어 버튼 표시/숨김
        const searchClearBtn = document.getElementById('search-clear-btn');
        if (searchClearBtn) {
            searchClearBtn.style.display = searchTerm.length > 0 ? 'block' : 'none';
        }

        // 1. 메인 메뉴 목록 필터링
        filterMenuList(searchTerm);

        // 2. 자동완성 드롭다운 생성
        autocompleteListEl.innerHTML = '';
        if (searchTerm.length > 0) {
            const filteredMenus = allMenus
                .filter(menu => menu.name.toLowerCase().includes(searchTerm))
                .slice(0, 7); // 최대 7개까지 제안

            filteredMenus.forEach(menu => {
                const itemEl = document.createElement('div');

                // 검색어 하이라이팅 (특수문자 escape 처리)
                const escapedTerm = searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                const regex = new RegExp(`(${escapedTerm})`, 'gi');
                const highlightedName = menu.name.replace(regex, '<span class="highlight">$1</span>');
                itemEl.innerHTML = highlightedName;

                itemEl.addEventListener('click', () => {
                    menuSearchInput.value = menu.name;
                    autocompleteListEl.innerHTML = '';
                    if (searchClearBtn) searchClearBtn.style.display = 'block';
                    filterMenuList(menu.name.toLowerCase());
                    // 해당 카테고리로 스크롤
                    requestAnimationFrame(() => {
                        const openSection = menuCategoriesEl.querySelector('.menu-type-section.active');
                        if (openSection) openSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    });
                });
                autocompleteListEl.appendChild(itemEl);
            });
        }
    }

    /**
     * 검색어에 따라 메뉴 목록의 표시 여부를 필터링
     * @param {string} searchTerm - 필터링할 검색어
     */
    function filterMenuList(searchTerm) {
        const menuSections = menuCategoriesEl.querySelectorAll('.menu-type-section');

        menuSections.forEach(section => {
            const menuItems = section.querySelectorAll('.type-menu-list li');
            let sectionHasVisibleItems = false;

            menuItems.forEach(item => {
                const menuName = item.dataset.menuName.toLowerCase();
                const isVisible = menuName.includes(searchTerm);
                item.style.display = isVisible ? 'flex' : 'none';
                if (isVisible) sectionHasVisibleItems = true;
            });

            section.style.display = sectionHasVisibleItems ? 'block' : 'none';
            section.classList.toggle('active', searchTerm && sectionHasVisibleItems);
        });
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
            li.dataset.menuName = menuName; // 삭제 버튼 클릭 시 참조하기 위해 데이터 속성 추가

            const menu = menuNameMap.get(menuName);

            const link = document.createElement('a');
            if (menu && menu.link) {
                link.href = menu.link;
            } else {
                link.href = `https://www.google.com/search?q=${encodeURIComponent(menuName + ' 레시피')}`;
            }
            link.target = '_blank'; // 새 탭에서 열기
            link.rel = 'noopener noreferrer'; // 보안 및 성능을 위해 추가
            link.textContent = menuName;

            const removeBtn = document.createElement('button');
            removeBtn.className = 'remove-menu-btn';
            removeBtn.innerHTML = '&times;'; // 'x' 아이콘
            removeBtn.setAttribute('aria-label', `${menuName} 제거`); // 접근성 향상

            li.appendChild(link);
            li.appendChild(removeBtn);
            selectedMenusListEl.appendChild(li);
        });
    }

    /**
     * 선택된 메뉴에 포함된 기본 재료 목록을 렌더링
     */
    function renderBasicIngredients() {
        const includedBasicIngredients = new Set();

        selectedMenus.forEach(menuName => {
            const menu = menuNameMap.get(menuName);
            if (!menu) return;

            menu.ingredients.forEach(ingredient => {
                const { name } = ingredient;
                // 재료 이름에 포함된 기본 재료 키워드를 찾음
                const matchedKeyword = basicIngredientKeywords.find(keyword => name.includes(keyword));
                if (matchedKeyword) {
                    includedBasicIngredients.add(matchedKeyword);
                }
            });
        });

        basicIngredientsListEl.innerHTML = '';
        if (includedBasicIngredients.size === 0) {
            basicIngredientsContainerEl.style.display = 'none'; // 재료가 없으면 컨테이너 숨김
        } else {
            basicIngredientsContainerEl.style.display = 'block'; // 재료가 있으면 보임
            const sortedBasicIngredients = Array.from(includedBasicIngredients).sort((a, b) => a.localeCompare(b));
            sortedBasicIngredients.forEach(ingredient => {
                const li = document.createElement('li');
                li.textContent = ingredient;
                basicIngredientsListEl.appendChild(li);
            });
        }
    }

    /**
     * 선택된 메뉴에 포함된 프리셋(보유) 재료 목록을 렌더링
     */
    function renderPresetIngredients() {
        const includedPresetIngredients = new Set();

        let presetIngredients = new Set();
        if (currentPresetId) {
            const currentPreset = allPresets.find(p => p.id === currentPresetId);
            if (currentPreset) {
                (currentPreset.ingredients || []).forEach(ing => presetIngredients.add(ing));
            }
        }

        if (presetIngredients.size === 0) {
            if (ownedIngredientsDisplayContainerEl) ownedIngredientsDisplayContainerEl.style.display = 'none';
            return;
        }

        selectedMenus.forEach(menuName => {
            const menu = menuNameMap.get(menuName);
            if (!menu) return;

            menu.ingredients.forEach(ingredient => {
                const { name } = ingredient;
                if (!name) return;

                // 기본 재료는 제외 (이미 기본 재료 섹션에 표시됨)
                const isBasic = basicIngredientKeywords.some(keyword => name.includes(keyword));
                if (isBasic) return;

                if (presetIngredients.has(name)) {
                    includedPresetIngredients.add(name);
                }
            });
        });

        if (ownedIngredientsDisplayListEl) {
            ownedIngredientsDisplayListEl.innerHTML = '';
            if (includedPresetIngredients.size === 0) {
                ownedIngredientsDisplayContainerEl.style.display = 'none';
            } else {
                ownedIngredientsDisplayContainerEl.style.display = 'block';
                const sortedIngredients = Array.from(includedPresetIngredients).sort((a, b) => a.localeCompare(b));
                sortedIngredients.forEach(ingredient => {
                    const li = document.createElement('li');
                    li.textContent = ingredient;
                    ownedIngredientsDisplayListEl.appendChild(li);
                });
            }
        }
    }

    /**
     * 선택된 메뉴를 기반으로 쇼핑 목록 데이터를 계산하는 함수
     * @returns {{categorizedIngredients: Map<string, any[]>, totalCount: number}}
     */
    function getShoppingList() {
        const ingredientsData = new Map(); // key: name, value: { units: Map<unit, totalQuantity>, nonSummable: Set<unit> }

        // 현재 적용된 재료 프리셋 확인
        let presetIngredients = new Set();
        if (currentPresetId) {
            const currentPreset = allPresets.find(p => p.id === currentPresetId);
            if (currentPreset) {
                (currentPreset.ingredients || []).forEach(ing => presetIngredients.add(ing));
            }
        }

        selectedMenus.forEach(menuName => {
            const menu = menuNameMap.get(menuName);
            if (!menu) return;

            menu.ingredients.forEach(ingredient => {
                const { name, quantity, unit } = ingredient;
                if (!name) return;

                // 1. 기본 재료는 쇼핑 목록에서 제외
                const isBasic = basicIngredientKeywords.some(keyword => name.includes(keyword));
                if (isBasic) {
                    return;
                }

                // 2. 재료 프리셋에 포함된 재료 제외
                if (presetIngredients.has(name)) {
                    return;
                }

                if (!ingredientsData.has(name)) {
                    ingredientsData.set(name, { units: new Map(), nonSummable: new Set() });
                }
                const data = ingredientsData.get(name);

                const numQuantity = parseQuantity(quantity);

                if (numQuantity > 0 && unit) {
                    data.units.set(unit, (data.units.get(unit) || 0) + numQuantity);
                } else {
                    data.nonSummable.add(unit || '');
                }
            });
        });

        // 렌더링을 위해 데이터 구조를 재구성 및 평탄화
        const flatList = [];
        for (const [name, data] of ingredientsData.entries()) {
            const totalSummable = data.units.size;
            const totalNonSummable = data.nonSummable.size;
            const totalEntries = totalSummable + totalNonSummable;

            if (totalEntries === 1 && totalSummable === 1) {
                // Case 1: 합산 가능한 단위가 하나만 있는 경우 (예: 양파 1개)
                const [unit, totalQuantity] = data.units.entries().next().value;
                flatList.push({ name, quantity: totalQuantity, unit });
            } else if (totalEntries === 1 && totalNonSummable === 1) {
                // Case 2: 합산 불가능한 단위만 하나 있는 경우 (예: 소금 약간)
                const unit = data.nonSummable.values().next().value;
                flatList.push({ name, quantity: 0, unit });
            } else if (totalEntries > 1) {
                // Case 3: 여러 단위가 섞여 있는 경우 (예: 고추 2개, 고추 1큰술)
                let maxQuantity = -1;
                let maxUnit = '';

                // 숫자 단위 중에서 가장 큰 값을 찾음
                for (const [unit, totalQuantity] of data.units.entries()) {
                    if (totalQuantity > maxQuantity) {
                        maxQuantity = totalQuantity;
                        maxUnit = unit;
                    }
                }

                if (maxQuantity > -1) {
                    // 가장 큰 숫자 단위에 '이상'을 붙여 표시
                    flatList.push({ name, quantity: maxQuantity, unit: maxUnit, suffix: '이상' });
                } else {
                    // 숫자 단위가 없는 경우 (예: 소금 약간, 소금 적당량), 첫 번째 항목만 표시
                    const firstUnit = data.nonSummable.values().next().value || '';
                    flatList.push({ name, quantity: 0, unit: firstUnit });
                }
            }
        }

        const totalCount = flatList.length;

        // 카테고리별 그룹화 및 정렬
        const categorizedIngredients = new Map();
        flatList.forEach(item => {
            const category = getIngredientCategory(item.name);
            if (!categorizedIngredients.has(category)) {
                categorizedIngredients.set(category, []);
            }
            categorizedIngredients.get(category).push(item);
        });

        for (const ingredients of categorizedIngredients.values()) {
            ingredients.sort((a, b) => a.name.localeCompare(b.name));
        }

        const sortedCategorizedIngredients = new Map(
            [...categorizedIngredients.entries()].sort(([catA], [catB]) => {
                const indexA = CATEGORY_ORDER.indexOf(catA);
                const indexB = CATEGORY_ORDER.indexOf(catB);
                if (indexA === -1 && indexB === -1) return catA.localeCompare(catB);
                if (indexA === -1) return 1; // A가 순서에 없으면 뒤로
                if (indexB === -1) return -1; // B가 순서에 없으면 앞으로
                return indexA - indexB;
            })
        );

        return { categorizedIngredients: sortedCategorizedIngredients, totalCount };
    }

    /**
     * 선택된 메뉴에 따라 쇼핑 목록 업데이트
     */
    function updateShoppingList() {
        renderSelectedMenus();
        renderBasicIngredients(); // 기본 재료 목록 렌더링 추가
        renderPresetIngredients(); // 프리셋(보유) 재료 목록 렌더링 추가
        const { categorizedIngredients, totalCount } = getShoppingList();
        renderShoppingList(categorizedIngredients, totalCount);
    }

    /**
     * 쇼핑 목록을 화면에 렌더링
     * @param {Map<string, Array<{name: string, quantity: number, unit: string}>>} categorizedIngredients - 렌더링할 분류된 재료 목록
     * @param {number} totalCount - 총 재료 개수
     */
    function renderShoppingList(categorizedIngredients, totalCount) {
        shoppingListEl.innerHTML = ''; // 기존 목록 초기화

        if (categorizedIngredients.size === 0) {
            shoppingListEl.innerHTML = '<li class="placeholder">메뉴를 선택해주세요.</li>';
            copyButton.style.display = 'none';
            totalIngredientsCountEl.textContent = '';
            return;
        }

        copyButton.style.display = 'inline-block';
        totalIngredientsCountEl.textContent = ` (${totalCount}개)`;

        for (const [category, ingredients] of categorizedIngredients.entries()) {
            const categoryLi = document.createElement('li');
            categoryLi.classList.add('shopping-list-category');
            categoryLi.textContent = category;
            shoppingListEl.appendChild(categoryLi);

            ingredients.forEach(({ name, quantity, unit, suffix }) => {
                const li = document.createElement('li');

                const nameSpan = document.createElement('span');
                nameSpan.textContent = name;
                li.appendChild(nameSpan);

                const quantitySpan = document.createElement('span');
                quantitySpan.classList.add('ingredient-count');
                let quantityText = formatQuantity(quantity, unit);
                if (suffix) {
                    quantityText += ` ${suffix}`;
                }
                quantitySpan.textContent = quantityText;
                if (quantitySpan.textContent) {
                    li.appendChild(quantitySpan);
                }

                shoppingListEl.appendChild(li);
            });
        }
    }

    /**
     * 쇼핑 목록 복사 버튼 클릭 이벤트 처리
     */
    function handleCopyClick() {
        if (!navigator.clipboard || !navigator.clipboard.writeText) {
            showToast('클립보드 복사는 HTTPS 환경에서만 지원됩니다.');
            return;
        }
        if (selectedMenus.size === 0) return;

        const { categorizedIngredients } = getShoppingList();

        // 복사할 텍스트 포맷 생성
        const selectedMenusTitle = '⭐ 선택한 메뉴';
        const selectedMenusText = Array.from(selectedMenus).sort().map(name => `- ${name}`).join('\n');

        const ingredientsTitle = '🛒 구매해야하는 식재료';
        const ingredientsListText = Array.from(categorizedIngredients.entries())
            .map(([category, ingredients]) => {
                const items = ingredients.map(ing => {
                    let line = `- ${ing.name}`;
                    let formattedQuantity = formatQuantity(ing.quantity, ing.unit);
                    if (ing.suffix) {
                        formattedQuantity += ` ${ing.suffix}`;
                    }
                    if (formattedQuantity) {
                        line += ` ${formattedQuantity}`;
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
            showToast('클립보드 복사에 실패했습니다.');
        });
    }

    // --- 모드 전환 관련 함수 ---

    function switchToMenuMode() {
        headerSubtitle.textContent = "원하는 메뉴를 선택하면 필요한 식재료 목록이 자동으로 생성되어, 장보기가 한결 간편해집니다.";
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
        const categorizedIngredients = new Map();
        allIngredients.forEach(ingredient => {
            const category = getIngredientCategory(ingredient);
            if (!categorizedIngredients.has(category)) {
                categorizedIngredients.set(category, []);
            }
            categorizedIngredients.get(category).push(ingredient);
        });

        // 각 카테고리 내에서 재료를 정렬 (그룹이 있는 경우 우선 배치)
        for (const ingredients of categorizedIngredients.values()) {
            ingredients.sort((a, b) => {
                const groupA = getIngredientGroup(a);
                const groupB = getIngredientGroup(b);

                // 둘 다 그룹에 속한 경우
                if (groupA && groupB) {
                    // 같은 그룹이면 이름순 (사실 렌더링 시 하나로 합쳐지므로 순서 중요치 않음)
                    if (groupA === groupB) return a.localeCompare(b);
                    // 다른 그룹이면 그룹 이름순
                    return groupA.localeCompare(groupB);
                }

                // 그룹에 속한 항목을 우선 배치
                if (groupA) return -1;
                if (groupB) return 1;

                // 둘 다 그룹이 아니면 이름순
                return a.localeCompare(b);
            });
        }

        // 카테고리 자체를 정해진 순서대로 정렬
        const sortedCategorizedIngredients = new Map(
            [...categorizedIngredients.entries()].sort(([catA], [catB]) => {
                const indexA = CATEGORY_ORDER.indexOf(catA);
                const indexB = CATEGORY_ORDER.indexOf(catB);
                if (indexA === -1 && indexB === -1) return catA.localeCompare(catB);
                if (indexA === -1) return 1;
                if (indexB === -1) return -1;
                return indexA - indexB;
            })
        );

        // 2. 화면에 렌더링
        allIngredientsListEl.innerHTML = ''; // This is now a div
        const renderedGroups = new Set(); // 전체 목록에서 이미 렌더링된 그룹 추적 (카테고리 간 중복 방지)
        for (const [category, ingredients] of sortedCategorizedIngredients.entries()) {
            const categorySection = document.createElement('div');
            categorySection.className = 'ingredient-category-section';

            const categoryHeading = document.createElement('h3');
            categoryHeading.textContent = category;
            categoryHeading.setAttribute('role', 'button');
            categoryHeading.setAttribute('tabindex', '0');
            categoryHeading.setAttribute('aria-expanded', 'false');
            categorySection.appendChild(categoryHeading);

            const ingredientGrid = document.createElement('ul');
            ingredientGrid.className = 'ingredient-grid';

            ingredients.forEach(ingredient => {
                const groupName = getIngredientGroup(ingredient);

                if (groupName) {
                    // 그룹에 속한 재료인 경우
                    if (!renderedGroups.has(groupName)) {
                        const li = document.createElement('li');
                        li.textContent = groupName + ' ▾'; // 드롭다운 표시
                        li.dataset.groupName = groupName;
                        li.classList.add('group-item');

                        // 그룹 내 재료 중 하나라도 선택되어 있으면 그룹 버튼도 선택 상태로 표시
                        const groupMembers = INGREDIENT_GROUPS[groupName];
                        if (groupMembers.some(member => ownedIngredients.has(member))) {
                            li.classList.add('selected');
                        }

                        ingredientGrid.appendChild(li);
                        renderedGroups.add(groupName);
                    }
                } else {
                    // 일반 재료인 경우
                    const li = document.createElement('li');
                    li.textContent = ingredient;
                    li.dataset.ingredientName = ingredient;
                    if (ownedIngredients.has(ingredient)) {
                        li.classList.add('selected');
                    }
                    ingredientGrid.appendChild(li);
                }
            });

            categorySection.appendChild(ingredientGrid);
            allIngredientsListEl.appendChild(categorySection);
        }

        // 3. 이벤트 리스너 설정
        allIngredientsListEl.addEventListener('click', (event) => {
            const targetLi = event.target.closest('.ingredient-grid li');
            const targetH3 = event.target.closest('.ingredient-category-section h3');

            if (targetLi) {
                if (targetLi.dataset.groupName) {
                    openGroupModal(targetLi.dataset.groupName);
                } else {
                    handleIngredientClick(targetLi);
                }
                return; // 재료 아이템 클릭 시 드롭다운 토글 방지
            }

            if (targetH3) {
                const section = targetH3.parentElement;
                section.classList.toggle('active');
                targetH3.setAttribute('aria-expanded', section.classList.contains('active') ? 'true' : 'false');
            }
        });

        // 재료 모드 아코디언 키보드 접근성
        allIngredientsListEl.addEventListener('keydown', (event) => {
            if (event.key === 'Enter' || event.key === ' ') {
                const targetH3 = event.target.closest('.ingredient-category-section h3');
                if (targetH3) {
                    event.preventDefault();
                    const section = targetH3.parentElement;
                    section.classList.toggle('active');
                    targetH3.setAttribute('aria-expanded', section.classList.contains('active') ? 'true' : 'false');
                }
            }
        });

        isIngredientModeInitialized = true;
    }

    /**
     * 그룹 모달 열기
     * @param {string} groupName
     */
    function openGroupModal(groupName) {
        const modal = document.getElementById('ingredient-group-modal');
        const title = document.getElementById('group-modal-title');
        const list = document.getElementById('group-ingredient-list');

        title.textContent = groupName;
        list.innerHTML = '';

        const groupMembers = INGREDIENT_GROUPS[groupName];

        // 레시피에 실제로 존재하는 재료만 필터링하여 표시
        groupMembers.forEach(ingName => {
             if (allIngredients.has(ingName)) {
                 const li = document.createElement('li');
                 li.textContent = ingName;
                 li.dataset.ingredientName = ingName;
                 if (ownedIngredients.has(ingName)) {
                     li.classList.add('selected');
                 }
                 li.addEventListener('click', () => {
                     handleIngredientClick(li);
                     updateGroupButtonState(groupName);
                 });
                 list.appendChild(li);
             }
        });

        modal.classList.add('show');
    }

    function updateGroupButtonState(groupName) {
        const groupBtn = document.querySelector(`li[data-group-name="${groupName}"]`);
        if (groupBtn) {
            const groupMembers = INGREDIENT_GROUPS[groupName];
            const hasOwned = groupMembers.some(member => ownedIngredients.has(member));
            groupBtn.classList.toggle('selected', hasOwned);
        }
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
        saveCurrentState();
    }

    function updatePossibleMenus() {
        possibleMenusListEl.innerHTML = '';

        if (ownedIngredients.size === 0) {
            possibleMenusListEl.innerHTML = '<p class="placeholder">보유한 재료를 선택해보세요.</p>';
            return;
        }

        let possibleMenus = allMenus.map(menu => {
            const missingIngredients = menu.ingredients.filter(ing => !ownedIngredients.has(ing.name));
            const ownedCount = menu.ingredients.length - missingIngredients.length;

            // 부족한 재료 포맷팅 및 정렬 키 생성
            let missingGroupedCount = 0;
            const missingGroups = [];
            const formattedMissingIngredients = missingIngredients.map(ing => {
                const group = getIngredientGroup(ing.name);
                if (group) {
                    missingGroupedCount++;
                    missingGroups.push(group);
                } else {
                    missingGroups.push(ing.name);
                }
                return ing.name; // 대분류(그룹) 없이 세부 재료명만 표시
            }).sort();
            const missingKey = formattedMissingIngredients.join('|');

            // 정렬을 위한 대표 그룹 선정
            const primaryGroup = missingGroups.sort()[0] || '';

            return { menu, missingIngredients, ownedCount, formattedMissingIngredients, missingKey, missingGroupedCount, primaryGroup };
        }).filter(item => item.ownedCount > 0); // 보유 재료가 하나라도 있는 메뉴만 필터링

        // 그룹 빈도수 계산
        const groupFrequency = new Map();
        possibleMenus.forEach(item => {
            if (item.missingIngredients.length > 0) {
                const group = item.primaryGroup;
                groupFrequency.set(group, (groupFrequency.get(group) || 0) + 1);
            }
        });

        possibleMenus.sort((a, b) => {
              // 1. 부족한 재료가 적은 순
              if (a.missingIngredients.length !== b.missingIngredients.length) {
                  return a.missingIngredients.length - b.missingIngredients.length;
              }
              // 2. 부족한 재료의 그룹 빈도수 (내림차순)
              const freqA = groupFrequency.get(a.primaryGroup) || 0;
              const freqB = groupFrequency.get(b.primaryGroup) || 0;
              if (freqA !== freqB) {
                  return freqB - freqA;
              }
              // 3. 부족한 재료의 그룹 이름 (오름차순) - 같은 빈도수끼리 뭉치게
              if (a.primaryGroup !== b.primaryGroup) {
                  return a.primaryGroup.localeCompare(b.primaryGroup);
              }
              // 4. 재료 그룹에 속한 케이스 우선
              if (a.missingGroupedCount !== b.missingGroupedCount) {
                  return b.missingGroupedCount - a.missingGroupedCount;
              }
              // 5. 세부 항목(보유 재료)이 더 많은 항목 먼저
              if (a.ownedCount !== b.ownedCount) {
                  return b.ownedCount - a.ownedCount;
              }
              // 6. 부족한 재료 이름 순
              return a.missingKey.localeCompare(b.missingKey);
          });

        if (possibleMenus.length === 0) {
            possibleMenusListEl.innerHTML = '<p class="placeholder">선택한 재료로 만들 수 있는 메뉴가 없습니다.</p>';
            return;
        }

        possibleMenus.forEach(({ menu, missingIngredients, formattedMissingIngredients }) => {
            const card = document.createElement('div');
            card.className = 'possible-menu-card';

            // Create heading with link
            const heading = document.createElement('h4');
            const link = document.createElement('a');
            if (menu.link) {
                link.href = menu.link;
            } else {
                link.href = `https://www.google.com/search?q=${encodeURIComponent(menu.name + ' 레시피')}`;
            }
            link.target = '_blank';
            link.rel = 'noopener noreferrer';
            link.textContent = menu.name;
            heading.appendChild(link);
            card.appendChild(heading);

            if (missingIngredients.length === 0) {
                const p = document.createElement('p');
                p.className = 'ready-to-cook';
                p.textContent = '✅ 재료 모두 보유!';
                card.appendChild(p);
            } else {
                const p = document.createElement('p');
                p.textContent = '추가 필요 재료:';
                card.appendChild(p);

                const ul = document.createElement('ul');
                ul.className = 'missing-ingredients-list';
                formattedMissingIngredients.forEach(name => {
                    const li = document.createElement('li');
                    li.textContent = name;
                    ul.appendChild(li);
                });
                card.appendChild(ul);
            }
            possibleMenusListEl.appendChild(card);
        });
    }

    // --- 프리셋 관련 함수 ---

    /**
     * 프리셋 관리 모달을 열고 목록을 렌더링하는 함수
     */
    function openPresetModal() {
        renderPresetList();
        presetModal.classList.add('show');
    }

    /**
     * 프리셋 목록을 모달에 렌더링하는 함수
     */
    function renderPresetList() {
        presetListEl.innerHTML = '';
        if (allPresets.length === 0) {
            presetListEl.innerHTML = '<li class="placeholder">저장된 프리셋이 없습니다.<br><span class="placeholder-hint">메뉴나 재료를 선택한 뒤 <b>프리셋 저장</b>을 누르면 여기에 저장됩니다.</span></li>';
            return;
        }

        // 최신순으로 정렬
        const sortedPresets = [...allPresets].sort((a, b) => b.timestamp - a.timestamp);

        sortedPresets.forEach(preset => {
            const li = document.createElement('li');
            li.dataset.presetId = preset.id;

            if (preset.id === currentPresetId) {
                li.classList.add('active-preset');
            }

            // 신규 포맷만 사용 (레거시는 loadPresetsFromStorage에서 마이그레이션됨)
            const mCount = (preset.menus || []).length;
            const iCount = (preset.ingredients || []).length;
            const detailsText = `메뉴 ${mCount}개, 재료 ${iCount}개`;

            li.innerHTML = `
                <div class="preset-info">
                    <span class="preset-name"></span>
                    <span class="preset-details">${detailsText}</span>
                </div>
                <div class="preset-actions">
                    <button class="preset-load-btn" data-action="load">불러오기</button>
                    <button class="preset-delete-btn" data-action="delete">삭제</button>
                </div>
            `;
            li.querySelector('.preset-name').textContent = preset.name; // XSS 방지: 사용자 입력값이므로 textContent로 삽입
            presetListEl.appendChild(li);
        });
    }

    /**
     * 현재 상태를 프리셋으로 저장하는 함수
     */
    async function saveCurrentStateAsPreset() {
        const menusToSave = Array.from(selectedMenus);
        const ingredientsToSave = Array.from(ownedIngredients);

        if (menusToSave.length === 0 && ingredientsToSave.length === 0) {
            showToast('저장할 항목이 없습니다. 메뉴 또는 재료를 선택해주세요.');
            return;
        }

        const presetName = await showInputDialog('프리셋 이름을 입력하세요', '이름 입력...');
        if (!presetName) return;

        const existingPresetIndex = allPresets.findIndex(p => p.name === presetName);

        if (existingPresetIndex > -1) {
            const overwrite = await showConfirmDialog(`'${presetName}' 프리셋이 이미 존재합니다. 덮어쓰시겠습니까?`, '덮어쓰기');
            if (!overwrite) return;
            allPresets[existingPresetIndex].menus = menusToSave;
            allPresets[existingPresetIndex].ingredients = ingredientsToSave;
            allPresets[existingPresetIndex].timestamp = Date.now();
            currentPresetId = allPresets[existingPresetIndex].id;
        } else {
            const newPreset = {
                id: `preset_${Date.now()}`,
                name: presetName,
                menus: menusToSave,
                ingredients: ingredientsToSave,
                timestamp: Date.now()
            };
            allPresets.push(newPreset);
            currentPresetId = newPreset.id;
        }

        try {
            savePresetsToStorage(allPresets);
            showToast(`'${presetName}' 프리셋이 저장되었습니다.`);
            updateCurrentPresetDisplay();
            if (presetModal.classList.contains('show')) renderPresetList();
        } catch (e) {
            console.error("프리셋 저장에 실패했습니다:", e);
            showToast('프리셋 저장 중 오류가 발생했습니다.');
        }
    }

    /**
     * 프리셋 목록의 버튼 클릭(불러오기/삭제)을 처리하는 함수
     * @param {Event} event
     */
    function handlePresetActions(event) {
        const button = event.target.closest('button');
        if (!button) return;

        const li = button.closest('li');
        const presetId = li.dataset.presetId;
        const action = button.dataset.action;

        if (action === 'load') {
            loadPreset(presetId);
        } else if (action === 'delete') {
            deletePreset(presetId);
        }
    }

    /**
     * 특정 프리셋을 불러오는 함수
     * @param {string} presetId
     */
    function loadPreset(presetId) {
        const preset = allPresets.find(p => p.id === presetId);
        if (!preset) {
            showToast('프리셋을 불러오는 데 실패했습니다.');
            return;
        }

        // 신규 포맷만 사용 (레거시는 loadPresetsFromStorage에서 마이그레이션됨)
        const menusToLoad = preset.menus || [];
        const ingredientsToLoad = preset.ingredients || [];

        // 메뉴 적용
        selectedMenus.clear();
        menusToLoad.forEach(menuName => selectedMenus.add(menuName));

        // 재료 적용
        ownedIngredients.clear();
        ingredientsToLoad.forEach(ingName => ownedIngredients.add(ingName));

        // UI 업데이트
        renderMenus();

        if (!isIngredientModeInitialized) initializeIngredientMode();
        document.querySelectorAll('#all-ingredients-list li').forEach(li => {
            const ingName = li.dataset.ingredientName;
            const groupName = li.dataset.groupName;
            if (ingName) li.classList.toggle('selected', ownedIngredients.has(ingName));
            if (groupName) updateGroupButtonState(groupName);
        });

        updateShoppingList();
        updatePossibleMenus();

        currentPresetId = preset.id;
        updateCurrentPresetDisplay();
        saveCurrentState();

        presetModal.classList.remove('show');
        showToast(`'${preset.name}' 프리셋을 불러왔습니다.`);
    }

    /**
     * 프리셋 업데이트 함수
     * @param {string} presetId
     */
    async function updatePreset(presetId) {
        const presetIndex = allPresets.findIndex(p => p.id === presetId);
        if (presetIndex === -1) return;

        const preset = allPresets[presetIndex];
        const menusToSave = Array.from(selectedMenus);
        const ingredientsToSave = Array.from(ownedIngredients);

        if (menusToSave.length === 0 && ingredientsToSave.length === 0) {
            showToast('저장할 항목이 없습니다.');
            return;
        }

        const confirmed = await showConfirmDialog(
            `'${preset.name}' 프리셋을 현재 선택된 내용으로 업데이트하시겠습니까?`,
            '업데이트'
        );
        if (!confirmed) return;

        allPresets[presetIndex].menus = menusToSave;
        allPresets[presetIndex].ingredients = ingredientsToSave;
        allPresets[presetIndex].timestamp = Date.now();

        try {
            savePresetsToStorage(allPresets);
            showToast(`'${preset.name}' 프리셋이 업데이트되었습니다.`);
            currentPresetId = presetId;
            updateCurrentPresetDisplay();
            if (presetModal.classList.contains('show')) renderPresetList();
        } catch (e) {
            console.error("프리셋 업데이트 실패:", e);
            showToast('프리셋 업데이트 중 오류가 발생했습니다.');
        }
    }

    /**
     * 특정 프리셋을 삭제하는 함수
     * @param {string} presetId
     */
    async function deletePreset(presetId) {
        const presetToDelete = allPresets.find(p => p.id === presetId);
        if (!presetToDelete) return;

        const confirmed = await showConfirmDialog(
            `'${presetToDelete.name}' 프리셋을 정말 삭제하시겠습니까?`,
            '삭제'
        );
        if (!confirmed) return;

        allPresets = allPresets.filter(p => p.id !== presetId);
        try {
            savePresetsToStorage(allPresets);
            if (currentPresetId === presetId) {
                currentPresetId = null;
                updateCurrentPresetDisplay();
            }
            renderPresetList();
        } catch (e) {
            console.error("프리셋 삭제에 실패했습니다:", e);
            showToast('프리셋 삭제 중 오류가 발생했습니다.');
        }
    }

    /**
     * 현재 선택된 프리셋 이름을 화면에 표시
     */
    function updateCurrentPresetDisplay() {
        const displayEl = document.getElementById('current-preset-display');

        // 업데이트 버튼 표시 상태 제어
        if (currentPresetId) {
            updatePresetMenuBtn.style.display = 'inline-block';
            updatePresetIngredientBtn.style.display = 'inline-block';
        } else {
            updatePresetMenuBtn.style.display = 'none';
            updatePresetIngredientBtn.style.display = 'none';
        }

        if (!displayEl) return;

        if (currentPresetId) {
            const preset = allPresets.find(p => p.id === currentPresetId);
            if (preset) {
                displayEl.textContent = `현재 프리셋: ${preset.name}`;
                displayEl.style.display = 'inline-block';
            } else {
                displayEl.style.display = 'none';
            }
        } else {
            displayEl.style.display = 'none';
        }
    }

    // 앱 실행
    init();
});
