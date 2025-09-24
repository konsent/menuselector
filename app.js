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

    // 재료 우선 모드 요소
    const allIngredientsListEl = document.getElementById('all-ingredients-list');
    const possibleMenusListEl = document.getElementById('possible-menus-list');

    // --- 상태 관리 ---
    let allMenus = [];
    let allIngredients = new Set();
    const selectedMenus = new Set();
    let ownedIngredients = new Set(); // 보유한 재료 이름 저장
    let isIngredientModeInitialized = false;
    const basicIngredientKeywords = ['고춧가루', '마늘', '쌀', '밥', '설탕', '간장', '고추장', '참기름', '소금', '된장', '식초', '후추', '통깨', '맛술', '식용유', '김치국물'];

    // --- 재료 카테고리 분류 ---
    const ingredientCategoryMap = {
        // 육류/가공육
        '돼지고기': '육류/가공육', '소고기': '육류/가공육', '닭': '육류/가공육', '오리': '육류/가공육', '갈비': '육류/가공육', '삼겹살': '육류/가공육', '목살': '육류/가공육', '앞다리살': '육류/가공육', '안심': '육류/가공육', '등심': '육류/가공육', '차돌': '육류/가공육', '우삼겹': '육류/가공육', '항정살': '육류/가공육', '아롱사태': '육류/가공육', '우둔살': '육류/가공육', '양지': '육류/가공육', '다짐육': '육류/가공육', '불고기': '육류/가공육', '국거리': '육류/가공육', '사골': '육류/가공육', '잡뼈': '육류/가공육', '곱창': '육류/가공육', '오돌뼈': '육류/가공육', '힘줄': '육류/가공육', '베이컨': '육류/가공육', '소세지': '육류/가공육', '소시지': '육류/가공육', '스팸': '육류/가공육', '어묵': '육류/가공육', '오뎅': '육류/가공육', '순대': '육류/가공육', '떡갈비': '육류/가공육',
        // 해산물
        '황태': '해산물', '고등어': '해산물', '오징어': '해산물', '새우': '해산물', '해물': '해산물', '멸치': '해산물', '북어': '해산물', '꽁치': '해산물', '낙지': '해산물', '명란': '해산물', '골뱅이': '해산물', '꽃게': '해산물', '참치': '해산물', '진미채': '해산물', '바지락': '해산물', '전복': '해산물', '홍합': '해산물', '가리비': '해산물', '꼬막': '해산물', '굴': '해산물', '장어': '해산물', '날치알': '해산물', '파래': '해산물', '크래미': '해산물', '갈치': '해산물',
        // 채소/과일
        '파': '채소/과일', '양파': '채소/과일', '애호박': '채소/과일', '버섯': '채소/과일', '당근': '채소/과일', '양배추': '채소/과일', '시금치': '채소/과일', '콩나물': '채소/과일', '생강': '채소/과일', '감자': '채소/과일', '피망': '채소/과일', '부추': '채소/과일', '무': '채소/과일', '고구마': '채소/과일', '숙주': '채소/과일', '토마토': '채소/과일', '상추': '채소/과일', '깻잎': '채소/과일', '나물': '채소/과일', '오이': '채소/과일', '고사리': '채소/과일', '가지': '채소/과일', '고추': '채소/과일', '다시마': '채소/과일', '마늘': '채소/과일', '김치': '채소/과일', '배': '채소/과일', '브로콜리': '채소/과일', '사과': '채소/과일', '알배추': '채소/과일', '우엉': '채소/과일', '호박': '채소/과일', '파슬리': '채소/과일', '셀러리': '채소/과일', '청경채': '채소/과일', '쑥갓': '채소/과일', '미나리': '채소/과일', '더덕': '채소/과일', '시래기': '채소/과일', '토란대': '채소/과일', '깻순': '채소/과일', '마늘쫑': '채소/과일', '참나물': '채소/과일', '무순': '채소/과일', '새싹': '채소/과일', '레몬': '채소/과일', '파인애플': '채소/과일', '아보카도': '채소/과일', '할라피뇨': '채소/과일', '로즈마리': '채소/과일', '샐러드': '채소/과일', '허브': '채소/과일',
        // 유제품/계란
        '치즈': '유제품/계란', '파르미지아노': '유제품/계란', '계란': '유제품/계란', '버터': '유제품/계란', '생크림': '유제품/계란', '우유': '유제품/계란', '메추리알': '유제품/계란', '요거트': '유제품/계란',
        // 곡물/면/떡/가루
        '밀가루': '곡물/면/떡/가루', '부침가루': '곡물/면/떡/가루', '당면': '곡물/면/떡/가루', '스파게티': '곡물/면/떡/가루', '떡': '곡물/면/떡/가루', '국수': '곡물/면/떡/가루', '밥': '곡물/면/떡/가루', '빵가루': '곡물/면/떡/가루', '소면': '곡물/면/떡/가루', '쌀': '곡물/면/떡/가루', '찹쌀': '곡물/면/떡/가루', '전분': '곡물/면/떡/가루', '가루': '곡물/면/떡/가루', '들깨가루': '곡물/면/떡/가루', '면': '곡물/면/떡/가루', '누룽지': '곡물/면/떡/가루', '식빵': '곡물/면/떡/가루', '베이글': '곡물/면/떡/가루', '바게트': '곡물/면/떡/가루', '또띠아': '곡물/면/떡/가루', '빵': '곡물/면/떡/가루', '안남미': '곡물/면/떡/가루', '에그누들': '곡물/면/떡/가루',
        // 소스/조미료
        '액젓': '소스/조미료', '새우젓': '소스/조미료', '소스': '소스/조미료', '마요네즈': '소스/조미료', '두반장': '소스/조미료', '다시다': '소스/조미료', '간장': '소스/조미료', '고추장': '소스/조미료', '고춧가루': '소스/조미료', '소금': '소스/조미료', '깨': '소스/조미료', '된장': '소스/조미료', '맛술': '소스/조미료', '매실': '소스/조미료', '물엿': '소스/조미료', '설탕': '소스/조미료', '소주': '소스/조미료', '식초': '소스/조미료', '올리고당': '소스/조미료', '월계수': '소스/조미료', '커피': '소스/조미료', '청주': '소스/조미료', '케첩': '소스/조미료', '후추': '소스/조미료', '쌈장': '소스/조미료', '춘장': '소스/조미료', '우스터': '소스/조미료', '데리야끼': '소스/조미료', '스리라차': '소스/조미료', '타바스코': '소스/조미료', '머스타드': '소스/조미료', '연겨자': '소스/조미료', '와사비': '소스/조미료', '초고추장': '소스/조미료', '초생강': '소스/조미료', '쯔유': '소스/조미료', '노추': '소스/조미료', '조청': '소스/조미료', '시럽': '소스/조미료', '꿀': '소스/조미료', '참치액': '소스/조미료', '육수': '소스/조미료', '스톡': '소스/조미료', '혼다시': '소스/조미료', '미원': '소스/조미료', '페퍼': '소스/조미료', '시즈닝': '소스/조미료', '시치미': '소스/조미료', '바질': '소스/조미료', '오레가노': '소스/조미료', '오향분': '소스/조미료', '갈치속젓': '소스/조미료', '레몬즙': '소스/조미료', '유자청': '소스/조미료', '발사믹': '소스/조미료', '마라': '소스/조미료', '토마토페이스트': '소스/조미료', '가람마살라': '소스/조미료', '큐민': '소스/조미료', '강황': '소스/조미료', '스테비아': '소스/조미료',
        // 유지류
        '올리브유': '유지류', '들기름': '유지류', '식용유': '유지류', '참기름': '유지류', '고추기름': '유지류', '기름': '유지류',
        // 기타
        '두부': '기타', '유부': '기타', '만두': '기타', '김': '기타', '가쓰오부시': '기타', '베이크드빈': '기타', '스위트콘': '기타', '약재': '기타', '코코넛 밀크': '기타', '초콜릿': '기타'
    };

    // 가장 긴 키워드부터 확인하기 위해 키워드를 길이순으로 정렬합니다.
    const sortedIngredientKeywords = Object.keys(ingredientCategoryMap).sort((a, b) => b.length - a.length);

    /**
     * 재료의 카테고리를 반환하는 함수
     * @param {string} ingredient 
     * @returns {string} category
     */
    function getIngredientCategory(ingredient) {
        if (ingredient.includes('김치')) return '채소/과일';

        // 정렬된 키워드 배열을 순회하며 가장 긴 키워드부터 매칭을 시도합니다.
        // 이렇게 하면 '스파게티 소스'가 '파'보다 먼저, '토마토 소스'가 '토마토'보다 먼저 매칭됩니다.
        for (const keyword of sortedIngredientKeywords) {
            if (ingredient.includes(keyword)) {
                return ingredientCategoryMap[keyword];
            }
        }

        return '기타'; // 일치하는 키워드가 없으면 '기타'로 분류
    }

    /**
     * 문자열 형태의 수량을 숫자로 변환하는 함수 (e.g., "1/2" -> 0.5)
     * @param {string} qtyStr 
     * @returns {number}
     */
    function parseQuantity(qtyStr) {
        if (!qtyStr || typeof qtyStr !== 'string' || qtyStr.trim() === '') return 0;

        // "250~300" 같은 범위 값에서 첫 번째 숫자 사용
        qtyStr = qtyStr.trim().split('~')[0].trim();

        if (qtyStr.includes('/')) {
            const parts = qtyStr.split('/');
            if (parts.length === 2) {
                const num = parseFloat(parts[0]);
                const den = parseFloat(parts[1]);
                if (!isNaN(num) && !isNaN(den) && den !== 0) {
                    return num / den;
                }
            }
        }
        const num = parseFloat(qtyStr);
        return isNaN(num) ? 0 : num;
    }

    /**
     * 수량을 표시 형식에 맞게 변환하는 함수. 특정 단위에 대해 올림 처리.
     * @param {number} quantity
     * @param {string} unit
     * @returns {string}
     */
    function formatQuantity(quantity, unit) {
        if (quantity > 0) {
            // 1000g 이상일 경우 kg으로 변환하고 소수점 첫째 자리에서 올림
            if (unit === 'g' && quantity >= 1000) {
                const kgQuantity = quantity / 1000;
                // 소수점 첫째 자리까지 올림 (예: 1.23kg -> 1.3kg, 1.2kg -> 1.2kg)
                const displayQuantity = Math.ceil(kgQuantity * 10) / 10;
                return `${displayQuantity} kg`;
            }

            const roundUpUnits = new Set(['개', '모', '팩', '장', '마리', '알', '봉지', '캔', '포기', '통', '큰술']);
            let displayQuantity;
            if (roundUpUnits.has(unit) && quantity % 1 !== 0) {
                displayQuantity = Math.ceil(quantity);
            } else {
                // 다른 단위는 소수점 둘째 자리까지 표시 (예: 0.5, 1.25)
                displayQuantity = Number(quantity.toFixed(2));
            }
            return `${displayQuantity} ${unit}`;
        } else if (unit) {
            return unit;
        }
        return '';
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

        sortedTypes.forEach(type => {
            const typeSection = document.createElement('div');
            typeSection.classList.add('menu-type-section');

            const typeHeading = document.createElement('h3');
            typeHeading.textContent = type;
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
                // h3의 부모인 .menu-type-section에 active 클래스를 토글
                targetH3.parentElement.classList.toggle('active');
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
     * 메뉴 검색 이벤트 처리 (자동완성 및 목록 필터링)
     * @param {Event} event - input 이벤트 객체
     */
    function handleMenuSearch(event) {
        const searchTerm = event.target.value.toLowerCase().trim();

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

                // 검색어 하이라이팅
                const regex = new RegExp(`(${searchTerm})`, 'gi');
                const highlightedName = menu.name.replace(regex, '<span class="highlight">$1</span>');
                itemEl.innerHTML = highlightedName;

                itemEl.addEventListener('click', () => {
                    menuSearchInput.value = menu.name; // 입력창에 선택한 메뉴 이름 설정
                    autocompleteListEl.innerHTML = ''; // 드롭다운 숨기기
                    filterMenuList(menu.name.toLowerCase()); // 선택한 메뉴로 목록 필터링
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

            const menu = allMenus.find(m => m.name === menuName);

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
            const menu = allMenus.find(m => m.name === menuName);
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
     * 선택된 메뉴를 기반으로 쇼핑 목록 데이터를 계산하는 함수
     * @returns {{categorizedIngredients: Map<string, any[]>, totalCount: number}}
     */
    function getShoppingList() {
        const ingredientsData = new Map(); // key: name, value: { units: Map<unit, totalQuantity>, nonSummable: Set<unit> }

        selectedMenus.forEach(menuName => {
            const menu = allMenus.find(m => m.name === menuName);
            if (!menu) return;

            menu.ingredients.forEach(ingredient => {
                const { name, quantity, unit } = ingredient;
                if (!name) return;

                // 1. 기본 재료는 쇼핑 목록에서 제외
                const isBasic = basicIngredientKeywords.some(keyword => name.includes(keyword));
                if (isBasic) {
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

        const categoryOrder = ['육류', '해산물', '채소', '가공/유제품', '곡물/면/가루', '소스/기타', '기타'];
        const sortedCategorizedIngredients = new Map(
            [...categorizedIngredients.entries()].sort(([catA], [catB]) => {
                const indexA = categoryOrder.indexOf(catA);
                const indexB = categoryOrder.indexOf(catB);
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
        totalIngredientsCountEl.textContent = `(${totalCount}개)`;

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
            alert('이 브라우저에서는 클립보드 복사 기능을 지원하지 않습니다. (HTTPS 또는 localhost 환경에서 사용해주세요)');
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
            alert('클립보드 복사에 실패했습니다.');
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
        const allIngredientsSet = new Set();
        allMenus.forEach(menu => {
            menu.ingredients.forEach(ing => allIngredientsSet.add(ing.name));
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
        const categoryOrder = ['육류/가공육', '해산물', '채소/과일', '유제품/계란', '곡물/면/떡/가루', '소스/조미료', '유지류', '기타'];
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
            const missingIngredients = menu.ingredients.filter(ing => !ownedIngredients.has(ing.name));
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
                missingIngredients.forEach(ing => {
                    const li = document.createElement('li');
                    li.textContent = ing.name;
                    ul.appendChild(li);
                });
                card.appendChild(ul);
            }
            possibleMenusListEl.appendChild(card);
        });
    }

    // 앱 실행
    init();
});