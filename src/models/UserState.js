export default class UserState {
    constructor() {
        this.storageKey = 'omniark_404_state';
        this.state = this.loadState();
    }

    loadState() {
        const saved = localStorage.getItem(this.storageKey);
        if (saved) {
            return JSON.parse(saved);
        }
        return {
            maxStageReached: 1, // 최고 도달 스테이지
            currentStage: 1,    // 현재 플레이 중인 스테이지
            resources: 0,       // 창세의 돌
            chapterProgress: {} // 장별 진행 상태 (옵션)
        };
    }

    saveState() {
        localStorage.setItem(this.storageKey, JSON.stringify(this.state));
    }

    get currentStage() { return this.state.currentStage; }
    set currentStage(val) { 
        this.state.currentStage = val; 
        if(val > this.state.maxStageReached) {
            this.state.maxStageReached = val;
        }
        this.saveState(); 
    }

    get maxStageReached() { return this.state.maxStageReached; }
    
    get resources() { return this.state.resources; }
    addResource(amount) {
        this.state.resources += amount;
        this.saveState();
    }
}
