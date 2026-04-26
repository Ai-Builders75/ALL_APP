import GameData from './models/GameData.js';
import UserState from './models/UserState.js';
import { Lobby, Modal, StatusPanel } from './components/UIComponents.js';
import { GameBoard } from './components/GameBoard.js';

class GameController {
    constructor() {
        this.gameData = new GameData();
        this.userState = new UserState();
        
        this.appContainer = document.getElementById('app');
        this.modal = new Modal();
        
        this.init();
    }

    init() {
        this.showLobby();
    }

    showLobby() {
        this.appContainer.innerHTML = '';
        const lobby = new Lobby(this.appContainer, (chapter) => {
            this.startStage(this.gameData.getFirstStageOfChapter(chapter));
        });
        lobby.render(this.gameData.getTotalChapters(), this.userState.maxStageReached);
    }

    startStage(stageNumber) {
        this.userState.currentStage = stageNumber;
        const stageData = this.gameData.getStageData(stageNumber);
        
        if (!stageData) {
            alert('스테이지 데이터를 불러올 수 없습니다. 전체 클리어!');
            this.showLobby();
            return;
        }

        this.appContainer.innerHTML = `
            <div class="status-panel" id="status-panel"></div>
            <div class="game-container" id="game-container"></div>
        `;

        const statusContainer = document.getElementById('status-panel');
        const gameContainer = document.getElementById('game-container');

        const statusPanel = new StatusPanel(statusContainer, () => this.showLobby());
        statusPanel.render(stageData.chapter, stageData.verseRef.split(':')[1], this.userState.resources);

        const gameBoard = new GameBoard(gameContainer, (isSuccess) => {
            if (isSuccess) {
                this.handleSuccess();
            } else {
                this.handleFail();
            }
        });
        
        gameBoard.render(stageData);
    }

    handleSuccess() {
        const reward = 10;
        this.userState.addResource(reward);
        
        this.modal.showSuccess(`창세의 돌 ${reward}개 획득!`, () => {
            this.startStage(this.userState.currentStage + 1);
        });
    }

    handleFail() {
        // 사운드 등 추가 실패 처리 가능
    }
}

// 윈도우 로드 시 게임 컨트롤러 시작
window.onload = () => {
    new GameController();
};
