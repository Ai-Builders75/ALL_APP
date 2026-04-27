function renderKeyboard(keywords) {
    const kb = document.getElementById('keyboard');
    if (!kb) return;
    kb.innerHTML = '';
    const shuffled = [...keywords].sort(() => 0.5 - Math.random());
    shuffled.forEach(word => {
        const btn = document.createElement('button');
        btn.className = 'key';
        btn.textContent = word;
        btn.onclick = () => handleInput(word);
        kb.appendChild(btn);
    });
}

function handleInput(word) {
    if (currentBlankIndex >= blanks.length) return;
    
    const currentBlank = blanks[currentBlankIndex];
    const answer = currentBlank.getAttribute('data-answer');
    
    if (word === answer) {
        currentBlank.textContent = synonyms[word] || word;
        currentBlank.classList.remove('active');
        currentBlank.classList.add('filled');
        
        currentBlankIndex++;
        if (typeof hidePremiumHint === 'function') hidePremiumHint(); // 정답 맞추면 힌트 박스 닫기 및 초기화
        if (typeof updateProgress === 'function') updateProgress();
        
        if (currentBlankIndex < blanks.length) {
            blanks[currentBlankIndex].classList.add('active');
        } else {
            if (typeof handleStageClear === 'function') handleStageClear();
        }
    } else {
        if (typeof playErrorSound === 'function') playErrorSound();
        mistakesThisStage++;
        if (!incorrectStages.includes(currentStage)) {
            incorrectStages.push(currentStage);
            localStorage.setItem('incorrectStages', JSON.stringify(incorrectStages));
        }

        currentBlank.textContent = word;
        currentBlank.classList.add('error');
        setTimeout(() => {
            currentBlank.textContent = '';
            currentBlank.classList.remove('error');
        }, 500);
    }
}
