/**
 * 📖 성경 통합 아이콘 꾸러미 (Bible Icon Dictionary)
 * 
 * 요한계시록 및 성경 전반의 핵심 키워드를 직관적인 시각적 앵커(이모지/아이콘)로 변환해주는 공용 모듈입니다.
 * 모든 성경 앱(팡팡 게임, 마스터 암기 앱 등)에서 공통으로 사용됩니다.
 */

const BibleIconDict = {
    // 🥇 1순위: 코어 상징 키워드
    "하나님": "✨",
    "예수": "✝️",
    "그리스도": "👑",
    "성령": "🕊️",
    "천사": "👼",
    "보좌": "🪑", // 추후 커스텀 SVG 교체 권장
    "짐승": "🐉",
    "인": "📜", // 도장/봉인
    "어린양": "🐑",
    "생물": "👁️",
    "나팔": "🎺",
    "성전": "🏛️",
    "용": "🦖",
    "교회": "⛪",
    "면류관": "👑",
    "대접": "🥣",
    "장로": "🧔",

    // 🥈 2순위: 자연/사물 키워드
    "땅": "🌍",
    "하늘": "☁️",
    "바다": "🌊",
    "피": "🩸",
    "책": "📖",
    "두루마리": "📜",
    "불": "🔥",
    "금": "🪙",
    "옷": "👗",
    "세마포": "🥼",
    "눈": "👁️",
    "발": "🦶",
    "해": "☀️",
    "태양": "🌞",
    "별": "⭐",
    "연기": "💨",
    "문": "🚪",
    "향로": "🏺",
    "향": "♨️",
    "뿔": "🦏",
    "포도주": "🍷",
    "물": "💧",
    "강": "🏞️",
    "낫": "🪝",
    "구름": "☁️",
    "나무": "🌳",
    "거문고": "🪕",
    "보석": "💎",
    "꼬리": "🐍",
    "우상": "🗿",

    // 🥉 3순위: 개념/상태 키워드
    "진노": "💢",
    "사망": "💀",
    "권세": "⚡",
    "영광": "🌟",
    "나라": "🚩",
    "만국": "🌐",
    "심판": "⚖️",
    "재앙": "☄️",
    "이적": "✨",
    "음행": "💔",
    "생명": "🌱",
    "노래": "🎵",
    "환난": "🌩️",
    "전쟁": "⚔️"
};

/**
 * 단어(어절)를 입력받아, 내부에 핵심 키워드가 포함되어 있으면 매핑된 아이콘을 반환합니다.
 * 예: "하나님이" -> "하나님" 감지 -> "✨" 반환
 * 예: "어린양에게" -> "어린양" 감지 -> "🐑" 반환
 * 
 * @param {string} word 분석할 단어 (예: "하나님이")
 * @returns {object|null} 아이콘이 있으면 { keyword: "하나님", icon: "✨" }, 없으면 null 반환
 */
function getBibleIcon(word) {
    if (!word) return null;
    
    // 긴 키워드부터 우선 매칭하기 위해 키 배열을 길이순으로 정렬 (예: '어린양'이 '양'보다 먼저 매칭되도록)
    const keywords = Object.keys(BibleIconDict).sort((a, b) => b.length - a.length);
    
    for (const keyword of keywords) {
        // 단어 안에 핵심 키워드가 포함되어 있으면 (부분 일치)
        if (word.includes(keyword)) {
            const fallbackEmoji = BibleIconDict[keyword];
            // 🏭 무중단 하이브리드 엔진 도입: 
            // 1. 공장이 생성한 이미지(PNG)를 먼저 로딩 시도
            // 2. 파일이 없으면(onerror) 기존 고해상도 이모지로 자연스럽게 대체 (Fallback)
            const html = `<img src="../ALL_APP/shared_assets/icons/${keyword}.png" style="width: 1em; height: 1em; object-fit: contain; filter: drop-shadow(0px 4px 4px rgba(0,0,0,0.5));" onerror="this.onerror=null; this.outerHTML='${fallbackEmoji}';">`;
            
            return {
                keyword: keyword,
                icon: html
            };
        }
    }
    
    // 매칭되는 키워드가 없으면 null 반환
    return null;
}

// 글로벌 객체로 노출하여 HTML에서 스크립트 태그로 바로 쓸 수 있게 함
window.BibleIcons = {
    dict: BibleIconDict,
    getIcon: getBibleIcon
};
