// Lobby.js
export class Lobby {
    constructor(container, onChapterSelect) {
        this.container = container;
        this.onChapterSelect = onChapterSelect;
    }

    render(totalChapters, maxStageReached) {
        let html = `
            <div class="lobby-container">
                <div class="lobby-title">요한계시록 챕터 선택</div>
                <div class="chapter-grid">
        `;
        
        for (let i = 1; i <= totalChapters; i++) {
            // maxStageReached에 따라 해금 여부 시각화 가능 (현재는 모두 열어둠)
            html += `<div class="chapter-card" data-chapter="${i}">제 ${i} 장</div>`;
        }
        
        html += `</div></div>`;
        this.container.innerHTML = html;

        const cards = this.container.querySelectorAll('.chapter-card');
        cards.forEach(card => {
            card.addEventListener('click', () => {
                this.onChapterSelect(parseInt(card.dataset.chapter));
            });
        });
    }
}

// Modal.js
export class Modal {
    constructor() {
        this.overlay = document.createElement('div');
        this.overlay.className = 'modal-overlay hidden';
        this.overlay.innerHTML = `
            <div class="modal-content">
                <div class="modal-title" id="modal-title">성공!</div>
                <div class="modal-text" id="modal-text"></div>
                <button class="modal-btn" id="modal-btn">다음</button>
            </div>
        `;
        document.body.appendChild(this.overlay);

        this.btn = this.overlay.querySelector('#modal-btn');
        this.title = this.overlay.querySelector('#modal-title');
        this.text = this.overlay.querySelector('#modal-text');
        
        this.onNext = null;
        this.btn.addEventListener('click', () => {
            this.hide();
            if(this.onNext) this.onNext();
        });
    }

    showSuccess(rewardText, callback) {
        this.title.textContent = '성구 완성! ✨';
        this.text.innerHTML = `<span style="color:#f39c12; font-weight:bold;">+ ${rewardText}</span>`;
        this.btn.textContent = '다음 구절로';
        this.onNext = callback;
        this.overlay.classList.remove('hidden');
    }

    hide() {
        this.overlay.classList.add('hidden');
    }
}

// StatusPanel.js
export class StatusPanel {
    constructor(container, onHomeClick) {
        this.container = container;
        this.onHomeClick = onHomeClick;
    }

    render(chapter, verse, resources) {
        this.container.innerHTML = `
            <button class="home-btn">🏠</button>
            <div class="status-chapter">${chapter}장 ${verse}절</div>
            <div class="status-resources">💎 ${resources}</div>
        `;
        
        this.container.querySelector('.home-btn').addEventListener('click', () => {
            this.onHomeClick();
        });
    }
}
