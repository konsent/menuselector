/**
 * 문자열 형태의 수량을 숫자로 변환하는 함수 (e.g., "1/2" -> 0.5)
 * @param {string} qtyStr
 * @returns {number}
 */
export function parseQuantity(qtyStr) {
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
export function formatQuantity(quantity, unit) {
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
