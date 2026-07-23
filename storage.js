export const GROCERY_PLANNER_PRESETS_KEY = 'groceryPlannerPresets';
export const GROCERY_PLANNER_STATE_KEY = 'groceryPlannerState'; // 새로고침 시 선택 유지용 (프리셋과 별개)

/**
 * 로컬 스토리지에서 프리셋 목록을 불러오는 함수
 * @returns {Array} 프리셋 배열 (신규 포맷으로 마이그레이션됨)
 */
export function loadPresetsFromStorage() {
    try {
        const storedPresets = localStorage.getItem(GROCERY_PLANNER_PRESETS_KEY);
        if (!storedPresets) return [];

        let presets = JSON.parse(storedPresets);
        // 레거시 포맷(mode/data) → 신규 포맷(menus/ingredients) 마이그레이션
        return presets.map(preset => {
            if (!preset.menus && !preset.ingredients && preset.mode && preset.data) {
                return {
                    id: preset.id,
                    name: preset.name,
                    timestamp: preset.timestamp,
                    menus: preset.mode === 'menu' ? preset.data : [],
                    ingredients: preset.mode === 'ingredient' ? preset.data : []
                };
            }
            return preset;
        });
    } catch (e) {
        console.error("프리셋을 불러오는 데 실패했습니다:", e);
        return [];
    }
}

/**
 * 프리셋 목록을 로컬 스토리지에 저장하는 함수
 * @param {Array} allPresets
 */
export function savePresetsToStorage(allPresets) {
    localStorage.setItem(GROCERY_PLANNER_PRESETS_KEY, JSON.stringify(allPresets));
}

/**
 * 현재 선택 상태(선택한 메뉴/보유 재료)를 로컬 스토리지에 저장하는 함수.
 * 새로고침해도 선택이 유지되도록 변경 시마다 호출한다. 프리셋과는 별개의 임시 상태.
 * @param {{selectedMenus: Set<string>, ownedIngredients: Set<string>, currentPresetId: string|null}} state
 */
export function saveCurrentState({ selectedMenus, ownedIngredients, currentPresetId }) {
    try {
        localStorage.setItem(GROCERY_PLANNER_STATE_KEY, JSON.stringify({
            selectedMenus: Array.from(selectedMenus),
            ownedIngredients: Array.from(ownedIngredients),
            currentPresetId
        }));
    } catch (e) {
        console.error("현재 상태를 저장하는 데 실패했습니다:", e);
    }
}

/**
 * 로컬 스토리지에서 이전 선택 상태를 불러오는 함수
 * @returns {{selectedMenus: string[], ownedIngredients: string[], currentPresetId: string|null}}
 */
export function loadCurrentStateFromStorage() {
    try {
        const stored = localStorage.getItem(GROCERY_PLANNER_STATE_KEY);
        if (!stored) return { selectedMenus: [], ownedIngredients: [], currentPresetId: null };
        const state = JSON.parse(stored);
        return {
            selectedMenus: state.selectedMenus || [],
            ownedIngredients: state.ownedIngredients || [],
            currentPresetId: state.currentPresetId || null
        };
    } catch (e) {
        console.error("이전 상태를 불러오는 데 실패했습니다:", e);
        return { selectedMenus: [], ownedIngredients: [], currentPresetId: null };
    }
}
