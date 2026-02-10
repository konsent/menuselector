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
    let allIngredients = new Set();
    const selectedMenus = new Set();
    let ownedIngredients = new Set(); // 보유한 재료 이름 저장
    let currentPresetId = null; // 현재 선택된 프리셋 ID
    let isIngredientModeInitialized = false;
    let allPresets = [];
    const GROCERY_PLANNER_PRESETS_KEY = 'groceryPlannerPresets';
    const basicIngredientKeywords = ['고춧가루', '마늘', '쌀', '밥', '설탕', '간장', '고추장', '참기름', '소금', '된장', '식초', '후추', '통깨', '맛술', '식용유', '김치국물'];

    // --- 재료 그룹 정의 ---
    const INGREDIENT_GROUPS = {
        '김치': ['김치', '신김치', '묵은지', '김치국물', '다진 김치', '볶음김치', '배추겉절이', '파김치', '깍두기', '열무김치', '갓김치', '총각김치'],
        '돼지고기': ['돼지고기', '삼겹살', '목살', '앞다리살', '뒷다리살', '안심', '등심', '갈비', '돼지갈비', '대패삼겹살', '돼지고기 다짐육', '돼지고기 찌개용', '돼지고기 카레용', '돼지고기 잡채용', '돼지고기 앞다리살(불고기용)', '항정살', '등갈비','통삼겹살', '돼지곱창', '돼지껍데기', '수육용 돼지고기', '돼지고기 앞다리살', '돼지고기 안심', '돼지고기 목살', '돼지고기 목뼈', '돼지고기 곱창'],
        '소고기': ['소고기', '소불고기', '소갈비', '차돌박이', '우삼겹', '양지', '사태', '아롱사태', '우둔살', '소고기 다짐육', '소고기 국거리용', '소고기 스테이크용', '소고기 불고기용', '소고기 등심', 'LA갈비', '소곱창', '소고기 힘줄', '채끝살', '안창살', '살치살', '다진 소고기','소고기 등심', '소고기 우둔살'],
        '닭': ['닭', '닭다리살', '닭가슴살', '닭안심', '닭봉', '닭날개', '닭 닭도리탕용', '닭다리살 정육', '닭오돌뼈', '통닭', '닭근위'],
        '버섯': ['버섯', '양송이 버섯', '표고버섯', '팽이버섯', '느타리버섯', '새송이버섯', '양송이버섯', '목이버섯', '능이버섯', '만가닥버섯', '새송이', '모듬 버섯', '황제버섯', '양송이'],
        '치즈': ['치즈', '모짜렐라', '모짜렐라 치즈', '체다치즈', '파마산 치즈', '파르미지아노', '파르미지아노 레지아노', '슬라이스 치즈', '크림치즈', '파다노 치즈'],
        '면류': ['냉면 사리', '당면', '라면', '메밀면', '소면', '실당면', '에그누들', '파스타면', '중면', '중화면', '칼국수면', '페투치네면'],
        '대파': ['대파', '다진 대파', '쪽파', '파채'],
        '부추': ['부추', '다진 부추'],
        '밀가루': ['밀가루', '밀가루(박력분)','부침가루','핫케이크가루','빵가루'],
        '무': ['무', '갈은 무', '무순'],
        '우엉': ['우엉', '우엉채'],
        '생강': ['생강', '다진 생강'],
        '배추': ['배추', '알배추', '양배추', '얼갈이배추'],
        '피망': ['피망', '청피망', '홍피망'],
        '카레': ['카레', '고형카레', '골든카레', '카레가루'],
        '고추': ['고추', '꽈리고추', '오이고추', '청양고추', '건고추', '홍고추'],
        '마늘': ['마늘', '통마늘', '다진 마늘'],
        '소금': ['소금', '깨소금', '굵은 소금','꽃소금','맛소금'],
        '후추': ['통후추', '후추', '순후추'],
        '두부': ['두부', '순두부', '연두부'],
        '빵': ['식빵', '버거 빵', '바게트', '베이글', '카스테라'],
        '다시다': ['다시다', '멸치 다시다', '소고기 다시다', '조개 다시다'],
        '간장': ['간장', '진간장', '국간장', '양조간장']
    };

    // 재료가 속한 그룹 이름을 반환하는 헬퍼 함수
    function getIngredientGroup(ingredientName) {
        for (const [groupName, members] of Object.entries(INGREDIENT_GROUPS)) {
            if (members.includes(ingredientName)) {
                return groupName;
            }
        }
        return null;
    }

    // --- 재료 카테고리 분류 ---
    const ingredientCategoryMap = {
        // 육류/가공육
        '돼지고기': '육류/가공육', '소고기': '육류/가공육', '닭': '육류/가공육', '오리': '육류/가공육', '갈비': '육류/가공육', '삼겹살': '육류/가공육', '목살': '육류/가공육', '앞다리살': '육류/가공육', '안심': '육류/가공육', '등심': '육류/가공육', '차돌': '육류/가공육', '우삼겹': '육류/가공육', '항정살': '육류/가공육', '아롱사태': '육류/가공육', '우둔살': '육류/가공육', '양지': '육류/가공육', '다짐육': '육류/가공육', '불고기': '육류/가공육', '국거리': '육류/가공육', '사골': '육류/가공육', '잡뼈': '육류/가공육', '곱창': '육류/가공육', '오돌뼈': '육류/가공육', '힘줄': '육류/가공육', '베이컨': '육류/가공육', '소세지': '육류/가공육', '소시지': '육류/가공육', '스팸': '육류/가공육', '어묵': '육류/가공육', '오뎅': '육류/가공육', '순대': '육류/가공육', '떡갈비': '육류/가공육', '페퍼로니': '육류/가공육',
        // 해산물
        '황태': '해산물', '고등어': '해산물', '오징어': '해산물', '새우': '해산물', '해물': '해산물', '멸치': '해산물', '북어': '해산물', '꽁치': '해산물', '낙지': '해산물', '명란': '해산물', '골뱅이': '해산물', '꽃게': '해산물', '참치': '해산물', '진미채': '해산물', '바지락': '해산물', '전복': '해산물', '홍합': '해산물', '가리비': '해산물', '꼬막': '해산물', '굴': '해산물', '장어': '해산물', '날치알': '해산물', '파래': '해산물', '크래미': '해산물', '갈치': '해산물', '다시마': '해산물', '건다시마': '해산물', '쭈꾸미': '해산물', '연어': '해산물',
        // 채소/과일
        '파': '채소/과일', '양파': '채소/과일', '애호박': '채소/과일', '버섯': '채소/과일', '당근': '채소/과일', '양배추': '채소/과일', '시금치': '채소/과일', '콩나물': '채소/과일', '생강': '채소/과일', '감자': '채소/과일', '피망': '채소/과일', '부추': '채소/과일', '무': '채소/과일', '고구마': '채소/과일', '숙주': '채소/과일', '토마토': '채소/과일', '상추': '채소/과일', '깻잎': '채소/과일', '나물': '채소/과일', '오이': '채소/과일', '고사리': '채소/과일', '가지': '채소/과일', '고추': '채소/과일', '마늘': '채소/과일', '김치': '채소/과일', '배': '채소/과일', '브로콜리': '채소/과일', '사과': '채소/과일', '알배추': '채소/과일', '우엉': '채소/과일', '호박': '채소/과일', '파슬리': '채소/과일', '셀러리': '채소/과일', '청경채': '채소/과일', '쑥갓': '채소/과일', '미나리': '채소/과일', '더덕': '채소/과일', '시래기': '채소/과일', '토란대': '채소/과일', '깻순': '채소/과일', '마늘쫑': '채소/과일', '참나물': '채소/과일', '무순': '채소/과일', '새싹': '채소/과일', '레몬': '채소/과일', '파인애플': '채소/과일', '아보카도': '채소/과일', '할라피뇨': '채소/과일', '샐러드': '채소/과일', '허브': '채소/과일', '묵은지': '채소/과일', '깍두기': '채소/과일', '딸기': '채소/과일', '방울토마토': '채소/과일',
        // 유제품/계란
        '치즈': '유제품/계란', '파르미지아노': '유제품/계란', '계란': '유제품/계란', '버터': '유제품/계란', '생크림': '유제품/계란', '우유': '유제품/계란', '메추리알': '유제품/계란', '요거트': '유제품/계란', '모짜렐라': '유제품/계란',
        // 곡물/면/떡/가루
        '카스테라': '곡물/면/떡/가루', '마늘가루': '곡물/면/떡/가루','분모자': '곡물/면/떡/가루','불닭볶음면': '곡물/면/떡/가루','밀가루': '곡물/면/떡/가루', '부침가루': '곡물/면/떡/가루', '당면': '곡물/면/떡/가루', '스파게티': '곡물/면/떡/가루', '떡': '곡물/면/떡/가루', '국수': '곡물/면/떡/가루', '밥': '곡물/면/떡/가루', '빵가루': '곡물/면/떡/가루', '소면': '곡물/면/떡/가루', '쌀': '곡물/면/떡/가루', '찹쌀': '곡물/면/떡/가루', '전분': '곡물/면/떡/가루', '가루': '곡물/면/떡/가루', '들깨가루': '곡물/면/떡/가루', '면': '곡물/면/떡/가루', '누룽지': '곡물/면/떡/가루', '식빵': '곡물/면/떡/가루', '베이글': '곡물/면/떡/가루', '바게트': '곡물/면/떡/가루', '또띠아': '곡물/면/떡/가루', '빵': '곡물/면/떡/가루', '안남미': '곡물/면/떡/가루', '에그누들': '곡물/면/떡/가루', '파스타': '곡물/면/떡/가루', '감자전분': '곡물/면/떡/가루', '라면': '곡물/면/떡/가루', '칼국수면': '곡물/면/떡/가루', '우동면': '곡물/면/떡/가루', '페투치네면': '곡물/면/떡/가루', '중화면': '곡물/면/떡/가루', '메밀면': '곡물/면/떡/가루', '소면': '곡물/면/떡/가루', '밀떡': '곡물/면/떡/가루', '가래떡': '곡물/면/떡/가루', '떡볶이떡': '곡물/면/떡/가루', '찹쌀누룽지': '곡물/면/떡/가루', '우동사리': '곡물/면/떡/가루', '분모자': '곡물/면/떡/가루',
        // 소스/조미료
        '토마토 스파게티 소스': '소스/조미료','소고기 다시다': '소스/조미료', '액젓': '소스/조미료', '새우젓': '소스/조미료', '소스': '소스/조미료', '마요네즈': '소스/조미료', '두반장': '소스/조미료', '다시다': '소스/조미료', '간장': '소스/조미료', '고추장': '소스/조미료', '고춧가루': '소스/조미료', '소금': '소스/조미료', '깨': '소스/조미료', '된장': '소스/조미료', '맛술': '소스/조미료', '매실': '소스/조미료', '물엿': '소스/조미료', '설탕': '소스/조미료', '소주': '소스/조미료', '식초': '소스/조미료', '올리고당': '소스/조미료', '월계수': '소스/조미료', '커피': '소스/조미료', '청주': '소스/조미료', '케첩': '소스/조미료', '후추': '소스/조미료', '쌈장': '소스/조미료', '춘장': '소스/조미료', '우스터': '소스/조미료', '데리야끼': '소스/조미료', '스리라차': '소스/조미료', '타바스코': '소스/조미료', '머스타드': '소스/조미료', '연겨자': '소스/조미료', '와사비': '소스/조미료', '초고추장': '소스/조미료', '초생강': '소스/조미료', '쯔유': '소스/조미료', '노추': '소스/조미료', '조청': '소스/조미료', '시럽': '소스/조미료', '꿀': '소스/조미료', '참치액': '소스/조미료', '육수': '소스/조미료', '스톡': '소스/조미료', '혼다시': '소스/조미료', '미원': '소스/조미료', '페퍼': '소스/조미료', '시즈닝': '소스/조미료', '시치미': '소스/조미료', '바질': '소스/조미료', '오레가노': '소스/조미료', '오향분': '소스/조미료', '갈치속젓': '소스/조미료', '레몬즙': '소스/조미료', '유자청': '소스/조미료', '발사믹': '소스/조미료', '마라': '소스/조미료', '토마토페이스트': '소스/조미료', '가람마살라': '소스/조미료', '큐민': '소스/조미료', '강황': '소스/조미료', '스테비아': '소스/조미료', '허브솔트': '소스/조미료', '슈가파우더': '소스/조미료', '로즈마리': '소스/조미료', '멸치다시팩': '소스/조미료', '멸치 다시팩': '소스/조미료', '멸치 액젓': '소스/조미료', '멸치액젓': '소스/조미료', '진간장': '소스/조미료', '국간장': '소스/조미료', '양조간장': '소스/조미료', '참소스': '소스/조미료', '돈까스 소스': '소스/조미료', '캐러멜 소스': '소스/조미료', '애플 사이다 식초': '소스/조미료', '메이플 시럽': '소스/조미료', '맛소금': '소스/조미료', '꽃소금': '소스/조미료', '굵은 소금': '소스/조미료', '순후추': '소스/조미료', '통후추': '소스/조미료', '땅콩버터': '소스/조미료', '홀그레인머스타드': '소스/조미료', '라면 후레이크 스프': '소스/조미료', '라면 분말스프': '소스/조미료', '코인 육수': '소스/조미료', '사골곰탕': '소스/조미료', '도가니탕': '소스/조미료', '냉면 육수': '소스/조미료', '짜장가루': '소스/조미료',
        // 유지류
        '올리브유': '유지류', '들기름': '유지류', '식용유': '유지류', '참기름': '유지류', '고추기름': '유지류', '기름': '유지류',
        // 기타
        '버섯': '기타', '두부': '기타', '유부': '기타', '만두': '기타', '김': '기타', '가쓰오부시': '기타', '베이크드빈': '기타', '스위트콘': '기타', '약재': '기타', '코코넛 밀크': '기타', '초콜릿': '기타', '코코아파우더': '기타', '갈아만든 배': '기타', '삼계탕 약재': '기타', '찹쌀가루': '기타', '김가루': '기타', '콩': '기타', '두태기름': '기타', '카스테라': '기타', '딸기잼': '기타', '페퍼론치노': '기타', '올리브': '기타', '쭈꾸미': '해산물', '연어': '해산물', '딸기': '채소/과일'
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
     * 로컬 스토리지에서 프리셋을 불러오는 함수
     */
    function loadPresetsFromStorage() {
        try {
            const storedPresets = localStorage.getItem(GROCERY_PLANNER_PRESETS_KEY);
            if (storedPresets) {
                allPresets = JSON.parse(storedPresets);
            }
        } catch (e) {
            console.error("프리셋을 불러오는 데 실패했습니다:", e);
            allPresets = [];
        }
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
            
            // 전체 재료 목록 생성 (그룹 모달에서 사용)
            allMenus.forEach(menu => {
                menu.ingredients.forEach(ing => allIngredients.add(ing.name));
            });

            loadPresetsFromStorage(); // 프리셋 불러오기

            // 프리셋 표시 요소 생성
            const presetDisplay = document.createElement('span');
            presetDisplay.id = 'current-preset-display';
            presetDisplay.className = 'current-preset-display';
            if (presetManageBtn && presetManageBtn.parentNode) {
                presetManageBtn.parentNode.insertBefore(presetDisplay, presetManageBtn.nextSibling);
            }

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

        // 모달 외부 클릭 시 닫기 (단위, 그룹, 프리셋 모달 통합 처리)
        window.onclick = function(event) {
            if (event.target == unitInfoModal) unitInfoModal.classList.remove('show');
            if (event.target == groupModal) groupModal.classList.remove('show');
            if (event.target == presetModal) presetModal.classList.remove('show');
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
     * 선택된 메뉴에 포함된 프리셋(보유) 재료 목록을 렌더링
     */
    function renderPresetIngredients() {
        const includedPresetIngredients = new Set();
        
        let presetIngredients = new Set();
        if (currentPresetId) {
            const currentPreset = allPresets.find(p => p.id === currentPresetId);
            if (currentPreset) {
                const ingredients = currentPreset.ingredients || (currentPreset.mode === 'ingredient' ? currentPreset.data : []);
                if (ingredients) {
                    ingredients.forEach(ing => presetIngredients.add(ing));
                }
            }
        }

        if (presetIngredients.size === 0) {
            if (ownedIngredientsDisplayContainerEl) ownedIngredientsDisplayContainerEl.style.display = 'none';
            return;
        }

        selectedMenus.forEach(menuName => {
            const menu = allMenus.find(m => m.name === menuName);
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
                const ingredients = currentPreset.ingredients || (currentPreset.mode === 'ingredient' ? currentPreset.data : []);
                if (ingredients) {
                    ingredients.forEach(ing => presetIngredients.add(ing));
                }
            }
        }

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

            const renderedGroups = new Set(); // 해당 카테고리에서 이미 렌더링된 그룹 추적

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
                // h3의 부모인 .ingredient-category-section에 active 클래스를 토글
                targetH3.parentElement.classList.toggle('active');
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
                return group ? `${group} [ ${ing.name} ]` : ing.name;
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
            presetListEl.innerHTML = '<li class="placeholder">저장된 프리셋이 없습니다.</li>';
            return;
        }

        // 최신순으로 정렬
        const sortedPresets = [...allPresets].sort((a, b) => b.timestamp - a.timestamp);

        sortedPresets.forEach(preset => {
            const li = document.createElement('li');
            li.dataset.presetId = preset.id;
            
            // 현재 선택된 프리셋 하이라이트
            if (preset.id === currentPresetId) {
                li.classList.add('active-preset');
            }

            let detailsText = '';
            if (preset.menus || preset.ingredients) {
                const mCount = (preset.menus || []).length;
                const iCount = (preset.ingredients || []).length;
                detailsText = `메뉴 ${mCount}개, 재료 ${iCount}개`;
            } else {
                const modeText = preset.mode === 'menu' ? '메뉴' : '재료';
                const itemCount = preset.data.length;
                detailsText = `${modeText} 프리셋 | ${itemCount}개 항목`;
            }

            li.innerHTML = `
                <div class="preset-info">
                    <span class="preset-name">${preset.name}</span>
                    <span class="preset-details">${detailsText}</span>
                </div>
                <div class="preset-actions">
                    <button class="preset-load-btn" data-action="load">불러오기</button>
                    <button class="preset-delete-btn" data-action="delete">삭제</button>
                </div>
            `;
            presetListEl.appendChild(li);
        });
    }

    /**
     * 현재 상태를 프리셋으로 저장하는 함수
     */
    function saveCurrentStateAsPreset() {
        const menusToSave = Array.from(selectedMenus);
        const ingredientsToSave = Array.from(ownedIngredients);

        if (menusToSave.length === 0 && ingredientsToSave.length === 0) {
            alert('저장할 항목이 없습니다. 메뉴 또는 재료를 선택해주세요.');
            return;
        }

        const presetName = prompt('프리셋 이름을 입력하세요:', '');
        if (!presetName || presetName.trim() === '') {
            return; // 사용자가 취소하거나 빈 이름을 입력한 경우
        }

        const existingPresetIndex = allPresets.findIndex(p => p.name === presetName.trim());

        if (existingPresetIndex > -1) {
            if (!confirm(`같은 이름의 프리셋이 이미 존재합니다. 덮어쓰시겠습니까?`)) {
                return;
            }
            // 덮어쓰기
            allPresets[existingPresetIndex].menus = menusToSave;
            allPresets[existingPresetIndex].ingredients = ingredientsToSave;
            // 레거시 데이터 삭제
            delete allPresets[existingPresetIndex].mode;
            delete allPresets[existingPresetIndex].data;
            
            allPresets[existingPresetIndex].timestamp = Date.now();
            currentPresetId = allPresets[existingPresetIndex].id;
        } else {
            // 새로 추가
            const newPreset = {
                id: `preset_${Date.now()}`,
                name: presetName.trim(),
                menus: menusToSave,
                ingredients: ingredientsToSave,
                timestamp: Date.now()
            };
            allPresets.push(newPreset);
            currentPresetId = newPreset.id;
        }

        try {
            localStorage.setItem(GROCERY_PLANNER_PRESETS_KEY, JSON.stringify(allPresets));
            alert(`'${presetName.trim()}' 프리셋이 저장되었습니다.`);
            updateCurrentPresetDisplay();
            if (presetModal.classList.contains('show')) {
                renderPresetList(); // 모달이 열려있으면 목록 새로고침
            }
        } catch (e) {
            console.error("프리셋 저장에 실패했습니다:", e);
            alert('프리셋 저장 중 오류가 발생했습니다.');
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
            alert('프리셋을 불러오는 데 실패했습니다.');
            return;
        }

        let menusToLoad = [];
        let ingredientsToLoad = [];

        if (preset.menus || preset.ingredients) {
            menusToLoad = preset.menus || [];
            ingredientsToLoad = preset.ingredients || [];
        } else if (preset.mode && preset.data) {
            if (preset.mode === 'menu') {
                menusToLoad = preset.data;
            } else {
                ingredientsToLoad = preset.data;
            }
        }

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

        presetModal.classList.remove('show');
        alert(`'${preset.name}' 프리셋을 불러왔습니다.`);
    }

    /**
     * 프리셋 업데이트 함수
     * @param {string} presetId 
     */
    function updatePreset(presetId) {
        const presetIndex = allPresets.findIndex(p => p.id === presetId);
        if (presetIndex === -1) return;

        const preset = allPresets[presetIndex];
        const menusToSave = Array.from(selectedMenus);
        const ingredientsToSave = Array.from(ownedIngredients);

        if (menusToSave.length === 0 && ingredientsToSave.length === 0) {
            alert('저장할 항목이 없습니다.');
            return;
        }

        if (confirm(`'${preset.name}' 프리셋을 현재 선택된 내용(메뉴 및 재료)으로 업데이트하시겠습니까?`)) {
            allPresets[presetIndex].menus = menusToSave;
            allPresets[presetIndex].ingredients = ingredientsToSave;
            delete allPresets[presetIndex].mode;
            delete allPresets[presetIndex].data;
            allPresets[presetIndex].timestamp = Date.now();
            
            try {
                localStorage.setItem(GROCERY_PLANNER_PRESETS_KEY, JSON.stringify(allPresets));
                alert(`'${preset.name}' 프리셋이 업데이트되었습니다.`);
                currentPresetId = presetId;
                updateCurrentPresetDisplay();
                renderPresetList();
            } catch (e) {
                console.error("프리셋 업데이트 실패:", e);
                alert('프리셋 업데이트 중 오류가 발생했습니다.');
            }
        }
    }

    /**
     * 특정 프리셋을 삭제하는 함수
     * @param {string} presetId
     */
    function deletePreset(presetId) {
        const presetToDelete = allPresets.find(p => p.id === presetId);
        if (!presetToDelete) return;

        if (confirm(`'${presetToDelete.name}' 프리셋을 정말 삭제하시겠습니까?`)) {
            allPresets = allPresets.filter(p => p.id !== presetId);
            try {
                localStorage.setItem(GROCERY_PLANNER_PRESETS_KEY, JSON.stringify(allPresets));
                if (currentPresetId === presetId) {
                    currentPresetId = null;
                    updateCurrentPresetDisplay();
                }
                renderPresetList(); // 모달 목록 새로고침
            } catch (e) {
                console.error("프리셋 삭제에 실패했습니다:", e);
                alert('프리셋 삭제 중 오류가 발생했습니다.');
            }
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