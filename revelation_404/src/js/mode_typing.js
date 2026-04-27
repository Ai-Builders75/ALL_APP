// Typing Mode Logic (Stages 4-5)

const CHOSEONG = ["ㄱ", "ㄲ", "ㄴ", "ㄷ", "ㄸ", "ㄹ", "ㅁ", "ㅂ", "ㅃ", "ㅅ", "ㅆ", "ㅇ", "ㅈ", "ㅉ", "ㅊ", "ㅋ", "ㅌ", "ㅍ", "ㅎ"];


function handleTypingKeypress(e) {
            // IME 조합 중이거나 모바일 키보드 버그(229)일 때는 Enter 무시
            if (e.key === 'Enter' && !e.isComposing && e.keyCode !== 229) {
                e.preventDefault();
                submitTyping();
            }
            // 스페이스바(e.key === ' ')는 이제 아무것도 방해하지 않고 자연스럽게 띄어쓰기가 입력되도록 둡니다.
        }

function handleTypingInput(e) {
            if (currentBlankIndex >= blanks.length) return;
            const inputEl = document.getElementById('typingInput');
            const userInput = inputEl.value;
            
            // 입력값이 비어있으면 무시
            if (!userInput.trim()) return;
            
            const currentBlank = blanks[currentBlankIndex];
            const answer = currentBlank.getAttribute('data-answer');
            const regexRemoveSpecial = /[^가-힣a-zA-Z0-9]/g;
            const normalizedInput = userInput.normalize('NFC').replace(regexRemoveSpecial, '');
            const normalizedAnswer = (synonyms[answer] || answer).normalize('NFC').replace(regexRemoveSpecial, '');
            const answerText = synonyms[answer] || answer;
            const targetSpaces = (answerText.match(/ /g) || []).length;
            const inputSpaces = (userInput.match(/ /g) || []).length + (userInput.match(/　/g) || []).length;
            
            // 정답과 완전히 일치하고 마지막이 공백인 경우 (기존 정상 입력)
            if (normalizedInput === normalizedAnswer && normalizedInput.length > 0) {
                if (userInput.endsWith(' ') || userInput.endsWith('　')) {
                    submitTyping();
                    return;
                }
            }
            
            // 오타가 났더라도, 정답에 포함된 띄어쓰기 개수보다 더 많은 띄어쓰기를 입력했다면 단어 입력이 끝난 것으로 간주하고 제출 (오답 처리)
            if (inputSpaces > targetSpaces && (userInput.endsWith(' ') || userInput.endsWith('　'))) {
                submitTyping();
            }
        }

function getChoseong(str) {
            let result = "";
            for (let i = 0; i < str.length; i++) {
                let code = str.charCodeAt(i) - 44032;
                if (code > -1 && code < 11172) {
                    result += CHOSEONG[Math.floor(code / 588)];
                } else {
                    result += str.charAt(i);
                }
            }
            return result;
        }

function hidePremiumHint() {
            document.getElementById('premiumHintBox').style.display = 'none';
            document.getElementById('typingInput').placeholder = '정답을 입력하세요';
            hintState = 0;
        }

function showChoseongHint() {
            if (currentBlankIndex >= blanks.length) return;
            const currentBlank = blanks[currentBlankIndex];
            const answer = currentBlank.getAttribute('data-answer');
            const inputEl = document.getElementById('typingInput');
            
            const hintBox = document.getElementById('premiumHintBox');
            const hintBadge = document.getElementById('hintBadge');
            const hintText = document.getElementById('hintText');
            const hintSubtext = document.getElementById('hintSubtext');
            
            hintBox.style.display = 'block';
            
            if (hintState === 0) {
                // 1단계 힌트: 첫 글자 + 나머지 O 표시
                let firstChar = answer.charAt(0);
                let rest = "";
                for(let i=1; i<answer.length; i++) {
                    rest += answer[i] === " " ? " " : "○";
                }
                
                hintBadge.textContent = "💡 1단계 마중물 힌트";
                hintBadge.style.color = "#93c5fd";
                hintBadge.style.borderColor = "rgba(59, 130, 246, 0.4)";
                hintBadge.style.background = "rgba(59, 130, 246, 0.15)";
                
                hintText.textContent = firstChar + rest;
                hintText.style.letterSpacing = "16px";
                hintSubtext.textContent = "전구를 한 번 더 누르면 전체 초성이 공개됩니다.";
                
                inputEl.placeholder = "정답을 입력하세요";
                hintState = 1;
            } else if (hintState === 1) {
                // 2단계 힌트: 전체 초성
                const hint = getChoseong(answer);
                
                hintBadge.textContent = "🔥 2단계 전체 초성 힌트";
                hintBadge.style.color = "#fca5a5";
                hintBadge.style.borderColor = "rgba(239, 68, 68, 0.4)";
                hintBadge.style.background = "rgba(239, 68, 68, 0.15)";
                
                hintText.textContent = hint;
                hintText.style.letterSpacing = "8px";
                hintSubtext.innerHTML = "초성을 보고 유추해 보세요. <br><span style='color: #fbbf24; font-size: 0.85rem; font-weight: bold;'>💡 (한 번 더 누르면 정답이 노출되지만 오답 처리됩니다)</span>";
                
                hintState = 2;
            } else {
                // 3단계 힌트: 정답 노출 및 강제 오답 처리
                hintBadge.textContent = "🚨 3단계 정답 공개";
                hintBadge.style.color = "#fcd34d";
                hintBadge.style.borderColor = "rgba(251, 191, 36, 0.4)";
                hintBadge.style.background = "rgba(251, 191, 36, 0.15)";
                
                hintText.textContent = synonyms[answer] || answer;
                hintText.style.letterSpacing = "4px";
                hintSubtext.innerHTML = "<span style='color:#f87171; font-weight:bold;'>눈으로 보고 직접 타이핑하세요. (오답으로 자동 기록됨)</span>";
                
                mistakesThisStage++;
                if (!incorrectStages.includes(currentStage)) {
                    incorrectStages.push(currentStage);
                    localStorage.setItem('incorrectStages', JSON.stringify(incorrectStages));
                }
                
                hintState = 3;
            }
            
            // 애니메이션 재시작
            hintBox.style.animation = 'none';
            hintBox.offsetHeight; /* trigger reflow */
            hintBox.style.animation = 'slideDownFade 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
            
            inputEl.focus();
        }

function submitTyping() {
            if (currentBlankIndex >= blanks.length) return;
            const inputEl = document.getElementById('typingInput');
            let userInput = inputEl.value.trim();
            if (!userInput) return;
            
            const currentBlank = blanks[currentBlankIndex];
            const answer = currentBlank.getAttribute('data-answer');
            const regexRemoveSpecial = /[^가-힣a-zA-Z0-9]/g;
            const normalizedInput = userInput.normalize('NFC').replace(regexRemoveSpecial, '');
            const normalizedAnswer = (synonyms[answer] || answer).normalize('NFC').replace(regexRemoveSpecial, '');
            if (normalizedInput === normalizedAnswer) {
                currentBlank.textContent = synonyms[answer] || answer;
                currentBlank.classList.remove('active');
                currentBlank.classList.add('filled');
                
                currentBlankIndex++;
                hidePremiumHint(); // 정답 맞추면 힌트 박스 닫기 및 초기화
                updateProgress();
                
                inputEl.value = '';
                inputEl.placeholder = '정답을 입력하세요';
                inputEl.focus();
                
                if (currentBlankIndex < blanks.length) {
                    blanks[currentBlankIndex].classList.add('active');
                } else {
                    handleStageClear();
                }
            } else {
                if (typeof playErrorSound === 'function') playErrorSound();
                mistakesThisStage++;
                if (!incorrectStages.includes(currentStage)) {
                    incorrectStages.push(currentStage);
                    localStorage.setItem('incorrectStages', JSON.stringify(incorrectStages));
                }

                currentBlank.textContent = userInput;
                currentBlank.classList.add('error');
                
                inputEl.classList.add('error-shake');
                setTimeout(() => inputEl.classList.remove('error-shake'), 500);

                setTimeout(() => {
                    currentBlank.textContent = '';
                    currentBlank.classList.remove('error');
                    inputEl.value = '';
                    inputEl.focus();
                }, 500);
            }
        }