import { gameData } from '../data/database_chunked.js';

export default class GameData {
    constructor() {
        this.data = gameData;
        this.totalStages = Object.keys(this.data).length;
    }

    getStageData(stageNumber) {
        if (!this.data[stageNumber]) return null;
        return {
            stageId: stageNumber,
            ...this.data[stageNumber]
        };
    }

    // 특정 장(chapter)의 첫 번째 스테이지 번호를 찾기
    getFirstStageOfChapter(chapterNumber) {
        for (let i = 1; i <= this.totalStages; i++) {
            if (this.data[i] && this.data[i].chapter === chapterNumber) {
                return i;
            }
        }
        return 1;
    }

    // 총 장(chapter) 수 계산 (1~22)
    getTotalChapters() {
        let maxChapter = 1;
        for (let key in this.data) {
            if (this.data[key].chapter > maxChapter) {
                maxChapter = this.data[key].chapter;
            }
        }
        return maxChapter;
    }
}
