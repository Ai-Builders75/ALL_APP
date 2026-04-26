// GameBoard.js
export class GameBoard {
    constructor(container, onResult) {
        this.container = container;
        this.onResult = onResult;
        this.targetSequence = [];
        this.selectedBlocks = [];
        this.selectedWords = [];
        this.isDragging = false;
        this.currentBlock = null;
        this.lineDrawer = null;
    }

    render(stageData) {
        this.targetSequence = ["태초에", "말씀이", "계시니라"]; // 실제로는 stageData.targetSequence 등을 활용
        // 현재 database_chunked.js에는 targetSequence 필드가 없고 chunks만 있습니다.
        // 테스트용이므로 원본 chunks 배열을 섞어서 배치하고, 원래 순서대로 맞추는 로직으로 가정.
        // 여기서는 안전망으로 원본 chunks를 복사해서 정답 시퀀스로 삼습니다.
        this.targetSequence = [...stageData.chunks];
        
        // 섞인 블록 만들기
        const shuffledChunks = [...stageData.chunks].sort(() => Math.random() - 0.5);

        let html = `
            <div class="target-box" id="target-box"></div>
            <div class="grid" id="grid">
                <svg id="svg-layer"></svg>
        `;
        
        shuffledChunks.forEach((chunk, idx) => {
            html += `<div class="block" data-word="${chunk}" id="b${idx}">${chunk}</div>`;
        });
        html += `</div>`;
        
        this.container.innerHTML = html;
        
        this.targetBox = this.container.querySelector('#target-box');
        this.grid = this.container.querySelector('#grid');
        this.svgLayer = this.container.querySelector('#svg-layer');
        
        // LineDrawer 초기화
        this.lineDrawer = new LineDrawer(this.svgLayer, this.grid);
        
        this.updateTargetBox();
        this.attachEvents();
    }

    updateTargetBox() {
        this.targetBox.innerHTML = '';
        this.selectedWords.forEach(word => {
            this.targetBox.innerHTML += `<div class="filled-slot">${word}</div>`;
        });
        const remaining = this.targetSequence.length - this.selectedWords.length;
        for(let i=0; i<remaining; i++){
            this.targetBox.innerHTML += `<div class="empty-slot"></div>`;
        }
    }

    resetSelection() {
        this.selectedBlocks.forEach(b => b.classList.remove('selected'));
        this.selectedBlocks = [];
        this.selectedWords = [];
        this.lineDrawer.clear();
        this.updateTargetBox();
    }

    handleBlockSelect(block) {
        if (!this.selectedBlocks.includes(block)) {
            block.classList.add('selected');
            this.selectedBlocks.push(block);
            this.selectedWords.push(block.dataset.word);
            
            // 임시 효과음 대신 콘솔 또는 Audio API
            this.lineDrawer.draw(this.selectedBlocks);
            this.updateTargetBox();
        }
    }

    checkResult() {
        let isCorrect = true;
        if (this.selectedWords.length !== this.targetSequence.length) {
            isCorrect = false;
        } else {
            for (let i = 0; i < this.targetSequence.length; i++) {
                if (this.selectedWords[i] !== this.targetSequence[i]) {
                    isCorrect = false;
                    break;
                }
            }
        }

        if (isCorrect) {
            this.selectedBlocks.forEach(b => {
                b.classList.remove('selected');
                b.classList.add('correct');
            });
            setTimeout(() => this.onResult(true), 300);
        } else {
            // 실패 처리
            setTimeout(() => this.resetSelection(), 300);
            this.onResult(false);
        }
    }

    attachEvents() {
        const blocks = this.container.querySelectorAll('.block');
        
        // Mouse Events
        blocks.forEach(block => {
            block.addEventListener('mousedown', (e) => {
                this.isDragging = true;
                this.resetSelection();
                this.handleBlockSelect(block);
            });
            block.addEventListener('mouseenter', (e) => {
                if (this.isDragging) this.handleBlockSelect(block);
            });
        });

        document.addEventListener('mouseup', () => {
            if (this.isDragging) {
                this.isDragging = false;
                if(this.selectedBlocks.length > 0) this.checkResult();
            }
        });

        // Touch Events
        this.grid.addEventListener('touchstart', (e) => {
            this.isDragging = true;
            this.resetSelection();
            const touch = e.touches[0];
            const element = document.elementFromPoint(touch.clientX, touch.clientY);
            if(element && element.classList.contains('block')) {
                this.handleBlockSelect(element);
                this.currentBlock = element;
            }
            e.preventDefault();
        }, {passive: false});

        this.grid.addEventListener('touchmove', (e) => {
            if (!this.isDragging) return;
            const touch = e.touches[0];
            const element = document.elementFromPoint(touch.clientX, touch.clientY);
            if(element && element.classList.contains('block') && element !== this.currentBlock) {
                this.handleBlockSelect(element);
                this.currentBlock = element;
            }
            e.preventDefault();
        }, {passive: false});

        document.addEventListener('touchend', () => {
            if (this.isDragging) {
                this.isDragging = false;
                this.currentBlock = null;
                if(this.selectedBlocks.length > 0) this.checkResult();
            }
        });
    }
}

// LineDrawer.js
export class LineDrawer {
    constructor(svgLayer, gridElement) {
        this.svgLayer = svgLayer;
        this.gridElement = gridElement;
    }

    clear() {
        this.svgLayer.innerHTML = '';
    }

    draw(selectedBlocks) {
        this.clear();
        if (selectedBlocks.length < 2) return;

        let pathData = '';
        const gridRect = this.gridElement.getBoundingClientRect();

        for (let i = 0; i < selectedBlocks.length; i++) {
            const rect = selectedBlocks[i].getBoundingClientRect();
            const x = rect.left - gridRect.left + rect.width / 2;
            const y = rect.top - gridRect.top + rect.height / 2;

            if (i === 0) {
                pathData += `M ${x} ${y} `;
            } else {
                pathData += `L ${x} ${y} `;
            }
        }

        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        path.setAttribute('d', pathData);
        this.svgLayer.appendChild(path);
    }
}
