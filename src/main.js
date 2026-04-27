import { gameData } from "./data/database_chunked.js";
window.gameData = gameData;


        let currentStage = 1;
        let currentChapter = 1;
        let currentLevel = 1;
        const totalStages = Object.keys(gameData).length;
        let blanks = [];
        let currentBlankIndex = 0;
        let currentStageBlanks = [];
        let hintState = 0; // 0: 없음, 1: 첫글자 힌트, 2: 초성 힌트

        // 오답 관리
        let incorrectStages = JSON.parse(localStorage.getItem('incorrectStages')) || [];
        let isIncorrectMode = false;
        let mistakesThisStage = 0;
        
        // 특수 예외 처리어 사전 (키워드 -> 성경 본문 내의 실제 텍스트)
        const synonyms = {
    "밧모섬": "밧모라",
    "사망 음부": "사망과 음부",
    "침상,": "침상",
    "새벽별": "새벽",
    "흰옷": "흰",
    "문 밖": "문밖",
    "이십사": "이십 사",
    "유리바다": "유리 바다가",
    "일곱뿔": "일곱",
    "일곱눈": "일곱",
    "책을 취함": "책을 취하시니라",
    "새노래": "새 노래를",
    "만만 천천": "만만이요 천천",
    "붉은 말": "붉은 다른 말",
    "셋째 인": "세째 인을",
    "밀 한 되": "밀 한되",
    "보리 석 되": "보리 석되",
    "넷째 인": "네째 인을",
    "피의 신원": "피를 신원하여",
    "흰두루마기": "흰 두루마기를",
    "해, 달": "해가 총담 같이 검어지고 온 달",
    "굴, 산": "굴과 산",
    "어린양의": "어린 양의",
    "인 맞은": "인맞은",
    "스블론": "스불론",
    "흰 옷 입은": "흰옷 입은",
    "나팔 예비": "나팔 가진 일곱 천사가 나팔 불기를 예비",
    "첫째 나팔": "첫째 천사가 나팔",
    "둘째 나팔": "둘째 천사가 나팔",
    "셋째 나팔": "세째 천사가 나팔을",
    "물 샘": "물샘",
    "넷째 나팔": "네째 천사가 나팔을",
    "다섯째 나팔": "다섯째 천사가 나팔",
    "무저갱의열쇠": "무저갱의 열쇠를",
    "다섯 달": "다섯달",
    "살인 복술": "살인과 복술",
    "백, 나": "백성과 나",
    "방, 임": "방언과 임",
    "원수 소멸": "원수를 소멸",
    "구원, 능력": "구원과 능력",
    "어린양의 피": "어린 양의 피와",
    "강같이 토함": "강 같이 토하여",
    "바다 짐승": "바다에서 한 짐승",
    "싸워 이김": "싸워 이기게",
    "땅 짐승": "다른 짐승이",
    "내려옴": "내려",
    "둘째 천사": "다른 천사",
    "셋째 천사": "다른 천사",
    "얻지 못함": "얻지 못하리라",
    "곡식 거둠": "곡식이 거두어지니라",
    "어린양의 노래": "어린 양의 노래를",
    "와서 경배": "와서 주께 경배",
    "증거장막": "증거 장막의",
    "가진 천사": "가진 일곱 천사",
    "금 대접": "금대접",
    "첫째 대접": "첫째가 가서 그 대접",
    "둘째 대접": "둘째가 그 대접",
    "셋째 대접": "그 대접을",
    "피를 마심": "피를 마시게",
    "참되고": "참되시고",
    "넷째 대접": "그 대접을",
    "다섯째 대접": "다섯째가 그 대접",
    "짐승 보좌": "짐승의 보좌",
    "여섯째 대접": "여섯째가 그 대접",
    "도적같이": "도적 같이",
    "일곱째 대접": "일곱째가 그 대접",
    "섬, 산악": "섬도 없어지고 산악",
    "피에 취함": "피에 취한지라",
    "미워함": "미워하여",
    "24장로": "장로와",
    "백마 탄 자": "백마와 탄 자",
    "산 채로": "산채로",
    "유황 불붙는": "유황불 붙는",
    "못에 던짐": "못에 던지우고",
    "잠간 놓임": "잠간 놓이리라",
    "천 년 동안": "천년 동안",
    "왕 노릇": "왕노릇",
    "천 년이": "천년이",
    "기록된 대로": "기록된대로",
    "다 지나감": "다시 있지",
    "열두 문": "열 두 문이",
    "열두": "열 두",
    "장, 광, 고": "장과 광과 고",
    "쓸데 없음": "쓸데 없으니",
    "생명나무": "생명 나무가",
    "저주 없음": "저주가 없으며",
    "은혜, 아멘": "은혜가 모든 자들에게 있을찌어다 아멘"
};
        
        // Initialize Chapter Dropdown
        const chapterSelect = document.getElementById('chapterSelect');
        for(let i=1; i<=22; i++) {
            const opt = document.createElement('option');
            opt.value = i;
            opt.textContent = `제 ${i} 장`;
            chapterSelect.appendChild(opt);
        }

        function onChapterSelect(chapterStr) {
            currentChapter = parseInt(chapterStr);
            showVerseGrid(); // Show grid instead of jumping to first verse
        }

        function changeLevel(levelStr) {
            currentLevel = parseInt(levelStr);
            loadStage(currentStage); // reload current stage with new level
        }

        function getExtraKeywords(verseText, coreKeywords, count, isLevel5 = false) {
            let words = verseText.replace(/[.,!?]/g, '').split(' ');
            
            if (isLevel5) {
                return words.filter(w => w.length > 0 && !coreKeywords.some(ck => w.includes(ck) || ck.includes(w)));
            }

            // 성경에서 자주 쓰이는 서술어, 조사, 대명사, 부사 등 (핵심 빈칸으로 덜 중요한 단어들)
            const stopWords = [
                '있어', '하는', '하여', '가라사대', '하시더라', '하느니라', '하니', '가로되', 
                '하고', '하며', '이는', '내가', '네가', '그가', '너희가', '또', '곧', '이제',
                '전에도', '장차', '나를', '너를', '그를', '나의', '너의', '그의', '내', '네',
                '이', '저', '그', '요한은', '가서', '오직', '이러므로', '또한', '만일'
            ];
            
            const stopEndings = ['더라', '노라', '찌어다', '나니', '느니라', '느니', '리라', '리니', '도다', '어다', '사대', '어니와', '시며', '거늘', '거든', '으니', '므로', '나이다'];

            let filteredWords = words.filter(w => {
                if (w.length <= 1) return false;
                if (coreKeywords.some(ck => w.includes(ck) || ck.includes(w))) return false;
                
                // 불용어 및 서술어 어미 필터링
                if (stopWords.includes(w)) return false;
                if (stopEndings.some(ending => w.endsWith(ending))) return false;
                
                return true;
            });
            
            // 필터링 후 남은 단어가 요구하는 count보다 적을 경우, 긴 단어 위주로 백업 추가
            if (filteredWords.length < count) {
                let fallbackWords = words.filter(w => 
                    w.length > 1 && 
                    !coreKeywords.some(ck => w.includes(ck) || ck.includes(w)) && 
                    !filteredWords.includes(w)
                ).sort((a,b) => b.length - a.length); // 긴 단어 우선순위
                
                filteredWords = filteredWords.concat(fallbackWords.slice(0, count - filteredWords.length));
            }

            filteredWords.sort(() => 0.5 - Math.random());
            return filteredWords.slice(0, count);
        }

        function generateVerseHTML(verseText, coreKeywords) {
            let htmlText = verseText;
            let missingKeywords = [];
            
            // Determine target keywords based on level
            let targetKeywords = [...coreKeywords];
            
            if (currentLevel === 2) {
                targetKeywords = targetKeywords.concat(getExtraKeywords(verseText, coreKeywords, 2));
            } else if (currentLevel === 3) {
                targetKeywords = targetKeywords.concat(getExtraKeywords(verseText, coreKeywords, 5));
            } else if (currentLevel === 4) {
                let allWords = verseText.replace(/[.,!?]/g, '').split(' ').filter(w => w.length > 1);
                let count = Math.floor(allWords.length * 0.5);
                targetKeywords = targetKeywords.concat(getExtraKeywords(verseText, coreKeywords, count));
            } else if (currentLevel === 5) {
                let allWords = verseText.replace(/[.,!?]/g, '').split(' ').filter(w => w.length > 0);
                targetKeywords = targetKeywords.concat(getExtraKeywords(verseText, coreKeywords, allWords.length, true));
            }
            
            // Sort target keywords by length descending so longer words get replaced first
            targetKeywords.sort((a, b) => b.length - a.length);

            currentStageBlanks = [];
            
            targetKeywords.forEach((kw, i) => {
                let searchWord = synonyms[kw];
                if (!searchWord) {
                    let cleanKw = kw.replace(/[.,!?]/g, '').trim();
                    searchWord = cleanKw.split(' ').join('[^<>]*?');
                }
                
                // Regex to avoid replacing inside HTML tags
                let regex = new RegExp(`(?<!<[^>]*)${searchWord}(?![^<]*>)`, 'i');
                if (regex.test(htmlText)) {
                    htmlText = htmlText.replace(regex, `<span class="blank" data-answer="${kw}" id="blank${i}"></span>`);
                    currentStageBlanks.push(kw);
                } else {
                    if (coreKeywords.includes(kw)) {
                        missingKeywords.push({ kw, index: i });
                    }
                }
            });

            if (missingKeywords.length > 0) {
                htmlText += `<div style="margin-top:15px; padding-top:15px; border-top:1px dashed rgba(255,255,255,0.2);">
                    <div style="font-size:0.85em; color:var(--primary); margin-bottom:10px;">✚ 누락된 핵심 키워드 추가</div>`;
                missingKeywords.forEach(mk => {
                    htmlText += `<span class="blank" data-answer="${mk.kw}" id="blank${mk.index}"></span> `;
                    currentStageBlanks.push(mk.kw);
                });
                htmlText += `</div>`;
            }

            return htmlText;
        }

        function loadStage(stageNumber) {
            const data = gameData[stageNumber];
            if (!data) return;
            
            mistakesThisStage = 0; // Reset mistakes
            currentChapter = data.chapter;
            chapterSelect.value = data.chapter;


            
            // Generate HTML with dynamic level blanks
            let stageDesc = isIncorrectMode ? `<span style="color:#ef4444;">[오답복습]</span> ${data.verseRef}` : `${data.verseRef} (전체 404구절 중 ${stageNumber}번째)`;
            document.getElementById('verseBox').innerHTML = `<div style="font-size:0.75em; color:#60a5fa; margin-bottom:12px; font-weight:bold;">${stageDesc}</div>` + generateVerseHTML(data.verseText, data.keywords);
            
            blanks = Array.from(document.querySelectorAll('.blank'));
            currentBlankIndex = 0;
            hidePremiumHint(); // 스테이지 변경 시 힌트 상태 초기화
            if (blanks.length > 0) {
                blanks[currentBlankIndex].classList.add('active');
            } else {
                handleStageClear();
            }
            
            // Build keyboard words - exact blanks + distractors
            let keyboardWords = [...currentStageBlanks];
            
            // 모든 스테이지의 키워드를 모아서 오답 보기(Distractors) 생성
            let allKeywords = [];
            Object.values(gameData).forEach(d => {
                if(d.keywords) allKeywords.push(...d.keywords);
            });
            // 중복 제거 및 현재 정답 제외
            allKeywords = [...new Set(allKeywords)].filter(k => !keyboardWords.includes(k));
            allKeywords.sort(() => 0.5 - Math.random());
            
            // 키보드 버튼 개수를 4의 배수로 맞춤 (최소 8개)
            let targetKeyCount = Math.max(8, Math.ceil(keyboardWords.length / 4) * 4);
            
            while(keyboardWords.length < targetKeyCount && allKeywords.length > 0) {
                keyboardWords.push(allKeywords.pop());
            }
            
            if (currentLevel >= 4) {
                document.getElementById('keyboard').style.display = 'none';
                document.getElementById('typingContainer').style.display = 'flex';
                document.getElementById('typingInput').value = '';
                document.getElementById('typingInput').placeholder = '정답을 입력하세요';
                document.getElementById('typingInput').focus();
            } else {
                document.getElementById('keyboard').style.display = 'grid';
                document.getElementById('typingContainer').style.display = 'none';
                renderKeyboard(keyboardWords);
            }
            updateProgress();
            
            document.getElementById('successModal').classList.remove('show');
            document.querySelectorAll('.confetti-piece').forEach(el => el.remove());
        }

        function renderKeyboard(keywords) {
            const kb = document.getElementById('keyboard');
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

        function handleTypingKeypress(e) {
            if (e.key === 'Enter') {
                submitTyping();
            }
        }

        const CHOSEONG = ["ㄱ", "ㄲ", "ㄴ", "ㄷ", "ㄸ", "ㄹ", "ㅁ", "ㅂ", "ㅃ", "ㅅ", "ㅆ", "ㅇ", "ㅈ", "ㅉ", "ㅊ", "ㅋ", "ㅌ", "ㅍ", "ㅎ"];
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
            
            const normalizedInput = userInput.replace(/\s+/g, '');
            const normalizedAnswer = (synonyms[answer] || answer).replace(/\s+/g, '');
            
            if (normalizedInput === normalizedAnswer || normalizedInput === answer.replace(/\s+/g, '')) {
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

        function shareTelegram() {
            const chapterMistakes = incorrectStages.filter(s => gameData[s].chapter === currentChapter).length;
            const message = `🎉 [404 마스터] 제 ${currentChapter}장 (Level ${currentLevel}) 암기 학습 완료!\n\n${chapterMistakes === 0 ? "💯 오답 없이 완벽하게 통과했습니다!" : "💪 오답 노트까지 꼼꼼하게 복습했습니다!"}\n\n말씀으로 인맞는 그날까지 화이팅입니다!`;
            const tgUrl = `tg://msg?text=${encodeURIComponent(message)}`;
            window.location.href = tgUrl;
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
                hidePremiumHint(); // 정답 맞추면 힌트 박스 닫기 및 초기화
                updateProgress();
                
                if (currentBlankIndex < blanks.length) {
                    blanks[currentBlankIndex].classList.add('active');
                } else {
                    handleStageClear();
                }
            } else {
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

        function handleStageClear() {
            // Stage cleared, save progress
            localStorage.setItem(`cleared_${currentStage}_${currentLevel}`, "true");
            
            // Remove from incorrect list if cleared perfectly
            if (mistakesThisStage === 0 && incorrectStages.includes(currentStage)) {
                incorrectStages = incorrectStages.filter(s => s !== currentStage);
                localStorage.setItem('incorrectStages', JSON.stringify(incorrectStages));
            }

            createConfetti();

            if (isIncorrectMode) {
                setTimeout(() => {
                    nextStage();
                }, 2200);
                return;
            }

            // Normal mode
            const nextData = gameData[currentStage + 1];
            const isLastOfChapter = !nextData || nextData.chapter !== currentChapter;

            if (isLastOfChapter) {
                setTimeout(() => {
                    showChapterEndModal();
                }, 2200);
            } else {
                setTimeout(() => {
                    nextStage();
                }, 2200);
            }
        }

        function updateProgress() {
            if (blanks.length === 0) {
                document.getElementById('progressFill').style.width = '100%';
                return;
            }
            const progress = (currentBlankIndex / blanks.length) * 100;
            document.getElementById('progressFill').style.width = `${progress}%`;
        }

        function showSuccess() {
            const data = gameData[currentStage];
            const modal = document.getElementById('successModal');
            document.getElementById('successTitle').innerHTML = `🎉 STAGE ${currentStage} CLEAR!`;
            document.getElementById('successDesc').textContent = `${data.verseRef} ${currentLevel}단계 암기 성공!`;
            
            const btn = modal.querySelector('.next-btn');
            if (currentStage < totalStages) {
                btn.style.display = "block";
            } else {
                btn.style.display = "none";
                document.getElementById('successDesc').innerHTML += `<br><br><span style="color:var(--success); font-weight:bold;">축하합니다! 전체를 마스터했습니다!</span>`;
            }

            modal.classList.add('show');
            createConfetti();
        }
        
        function showChapterEndModal() {
            document.getElementById('chapterEndTitle').innerText = `제 ${currentChapter} 장 완료! 🎉`;
            const modal = document.getElementById('chapterEndModal');
            
            const nextBtn = document.getElementById('nextChapterBtn');
            if (gameData[currentStage + 1]) {
                nextBtn.style.display = 'block';
            } else {
                nextBtn.style.display = 'none';
            }
            
            modal.classList.add('show');
        }

        function retryChapter() {
            document.getElementById('chapterEndModal').classList.remove('show');
            // Find first stage of current chapter
            const firstStage = Object.values(gameData).find(d => d.chapter === currentChapter).stage;
            currentStage = firstStage;
            loadStage(currentStage);
        }

        function goToNextChapter() {
            document.getElementById('chapterEndModal').classList.remove('show');
            const nextData = gameData[currentStage + 1];
            if (nextData) {
                currentStage++;
                loadStage(currentStage);
            }
        }

        function reviewChapterIncorrect() {
            document.getElementById('chapterEndModal').classList.remove('show');
            if (incorrectStages.length === 0) {
                alert("전체 범위에서 틀린 문제가 하나도 없습니다! 완벽합니다! 🎉");
                return;
            }
            
            const chapterMistakes = incorrectStages.filter(s => gameData[s].chapter === currentChapter);
            
            isIncorrectMode = true;
            const btn = document.getElementById('incorrectModeBtn');
            btn.classList.add('active');
            
            // If there are mistakes in THIS chapter, start with those
            if (chapterMistakes.length > 0) {
                chapterMistakes.sort((a,b) => a - b);
                currentStage = chapterMistakes[0];
            } else {
                incorrectStages.sort((a,b) => a - b);
                currentStage = incorrectStages[0];
            }
            
            loadStage(currentStage);
        }
        
        function nextStage() {
            if (isIncorrectMode) {
                if (incorrectStages.length === 0) {
                    alert('오답 노트가 모두 비워졌습니다! 🎉');
                    toggleIncorrectMode();
                    return;
                }
                let next = incorrectStages.find(s => s > currentStage);
                if (!next) next = incorrectStages[0]; // Wrap around
                currentStage = next;
                loadStage(currentStage);
            } else {
                if (currentStage < totalStages) {
                    currentStage++;
                    loadStage(currentStage);
                }
            }
        }

        function prevStage() {
            if (isIncorrectMode) {
                if (incorrectStages.length === 0) {
                    return;
                }
                let prev = [...incorrectStages].reverse().find(s => s < currentStage);
                if (!prev) prev = incorrectStages[incorrectStages.length - 1]; // Wrap around
                currentStage = prev;
                loadStage(currentStage);
            } else {
                if (currentStage > 1) {
                    currentStage--;
                    loadStage(currentStage);
                }
            }
        }

        function toggleIncorrectMode() {
            isIncorrectMode = !isIncorrectMode;
            const btn = document.getElementById('incorrectModeBtn');
            if (isIncorrectMode) {
                if (incorrectStages.length === 0) {
                    alert('저장된 오답이 없습니다. 훌륭합니다!');
                    isIncorrectMode = false;
                    return;
                }
                btn.classList.add('active');
                incorrectStages.sort((a,b) => a - b);
                currentStage = incorrectStages[0];
                loadStage(currentStage);
            } else {
                btn.classList.remove('active');
                loadStage(currentStage);
            }
        }

        function createConfetti() {
            const container = document.querySelector('.app-container');
            const colors = ['#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4'];
            
            for(let i=0; i<100; i++) {
                const conf = document.createElement('div');
                conf.style.position = 'absolute';
                conf.style.left = '50%';
                conf.style.top = '50%';
                conf.style.width = Math.random() * 10 + 6 + 'px';
                conf.style.height = Math.random() * 10 + 6 + 'px';
                conf.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
                conf.style.borderRadius = Math.random() > 0.5 ? '50%' : '2px';
                conf.style.zIndex = '1000';
                conf.style.pointerEvents = 'none';
                
                container.appendChild(conf);

                // Calculate random angle and distance for explosion
                const angle = Math.random() * Math.PI * 2;
                const velocity = 250 + Math.random() * 300; // Increased distance
                const tx = Math.cos(angle) * velocity;
                const ty = Math.sin(angle) * velocity - 100; // slightly biased upwards
                
                const duration = 1800 + Math.random() * 1200; // 1.8s to 3.0s
                
                conf.animate([
                    { transform: 'translate(-50%, -50%) scale(0) rotate(0deg)', opacity: 1 },
                    { transform: `translate(calc(-50% + ${tx * 0.7}px), calc(-50% + ${ty * 0.7}px)) scale(1.2) rotate(${Math.random() * 360}deg)`, opacity: 1, offset: 0.3 },
                    { transform: `translate(calc(-50% + ${tx * 1.5}px), calc(-50% + ${ty * 1.5 + 250}px)) scale(0) rotate(${Math.random() * 720}deg)`, opacity: 0 }
                ], {
                    duration: duration,
                    easing: 'cubic-bezier(0.25, 1, 0.5, 1)',
                    fill: 'forwards'
                });
                
                setTimeout(() => conf.remove(), duration);
            }
        }

        // Verse Grid Logic
        function showVerseGrid() {
            document.getElementById('successModal').classList.remove('show');
            const gridModal = document.getElementById('gridModal');
            document.getElementById('gridTitle').textContent = `제 ${currentChapter} 장 (Level ${currentLevel})`;
            
            const verseGrid = document.getElementById('verseGrid');
            verseGrid.innerHTML = '';
            
            // Find all stages for currentChapter
            let stageNumInChapter = 1;
            for (let i = 1; i <= totalStages; i++) {
                if (gameData[i].chapter === currentChapter) {
                    const btn = document.createElement('button');
                    btn.className = 'verse-btn';
                    
                    // Check if cleared
                    const isCleared = localStorage.getItem(`cleared_${i}_${currentLevel}`) === "true";
                    if (isCleared) {
                        btn.classList.add('cleared');
                        btn.innerHTML = `${stageNumInChapter}절 ✔`;
                    } else {
                        btn.textContent = `${stageNumInChapter}절`;
                    }
                    
                    const targetStage = i;
                    btn.onclick = () => {
                        currentStage = targetStage;
                        loadStage(currentStage);
                        closeVerseGrid();
                    };
                    verseGrid.appendChild(btn);
                    stageNumInChapter++;
                }
            }
            gridModal.classList.add('show');
        }

        function closeVerseGrid() {
            document.getElementById('gridModal').classList.remove('show');
        }

        // ==========================================
        // Settings & Home Screen Logic
        // ==========================================
        function openSettings() {
            document.getElementById('settingsModal').style.display = 'flex';
        }

        function closeSettings() {
            document.getElementById('settingsModal').style.display = 'none';
        }

        function applyTheme(themeName) {
            document.documentElement.setAttribute('data-theme', themeName);
            localStorage.setItem('appTheme', themeName);
            
            // Update UI buttons
            document.querySelectorAll('.theme-btn').forEach(btn => {
                btn.classList.remove('active');
                if (btn.getAttribute('data-theme-val') === themeName) {
                    btn.classList.add('active');
                }
            });
        }

        function changeFontSize(delta) {
            let root = document.documentElement;
            let currentSize = parseFloat(getComputedStyle(root).getPropertyValue('--verse-font-size')) || 1.15;
            let newSize = currentSize + delta;
            if (newSize < 0.8) newSize = 0.8;
            if (newSize > 2.0) newSize = 2.0;
            
            root.style.setProperty('--verse-font-size', newSize.toFixed(2) + 'rem');
            localStorage.setItem('verseFontSize', newSize.toFixed(2));
            updateFontSizeDisplay(newSize);
        }

        function updateFontSizeDisplay(size) {
            let display = "기본";
            if (size < 1.1) display = "작게";
            else if (size > 1.3 && size <= 1.5) display = "크게";
            else if (size > 1.5) display = "매우 크게";
            const displayEl = document.getElementById('fontSizeDisplay');
            if(displayEl) displayEl.textContent = display;
        }

        function startLearning() {
            const home = document.getElementById('homeScreen');
            home.style.opacity = '0';
            home.style.pointerEvents = 'none';
            setTimeout(() => {
                home.style.display = 'none';
                const app = document.getElementById('appContainer');
                app.style.display = 'flex';
                // Trigger reflow for transition
                void app.offsetWidth;
                app.style.opacity = '1';
                app.style.transform = 'scale(1)';
                
                // Initialize the game state based on selected chapter/level
                currentChapter = parseInt(document.getElementById('chapterSelect').value);
                currentLevel = parseInt(document.getElementById('levelSelect').value);
                
                // Find first stage of the selected chapter
                let firstStageOfChapter = 1;
                for (let i = 1; i <= totalStages; i++) {
                    if (gameData[i].chapter === currentChapter) {
                        firstStageOfChapter = i;
                        break;
                    }
                }
                currentStage = firstStageOfChapter;
                loadStage(currentStage);
            }, 500);
        }

        function goHome() {
            const app = document.getElementById('appContainer');
            app.style.opacity = '0';
            app.style.transform = 'scale(0.95)';
            setTimeout(() => {
                app.style.display = 'none';
                const home = document.getElementById('homeScreen');
                home.style.display = 'flex';
                // Trigger reflow
                void home.offsetWidth;
                home.style.opacity = '1';
                home.style.pointerEvents = 'auto';
            }, 500);
        }

        // Initialize App
        function initApp() {
            // Load saved settings
            let savedFontSize = localStorage.getItem('verseFontSize');
            if (savedFontSize) {
                document.documentElement.style.setProperty('--verse-font-size', savedFontSize + 'rem');
                updateFontSizeDisplay(parseFloat(savedFontSize));
            } else {
                updateFontSizeDisplay(1.15); // Default
            }

            let savedTheme = localStorage.getItem('appTheme') || 'dark';
            applyTheme(savedTheme);

            // Set initial state of the app container
            const appContainer = document.getElementById('appContainer');
            appContainer.style.display = 'none';
            appContainer.style.opacity = '0';
            
            const homeScreen = document.getElementById('homeScreen');
            homeScreen.style.display = 'flex';
            homeScreen.style.opacity = '1';
            
            // Ensure first stage is ready for fast load
            loadStage(1);
        }

        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', initApp);
        } else {
            initApp();
        }

        // ==========================================
        // 서비스 워커 등록 (오프라인 캐싱 및 성능 최적화)
        // ==========================================
        if ('serviceWorker' in navigator) {
            window.addEventListener('load', () => {
                navigator.serviceWorker.register('./sw.js').then(registration => {
                    console.log('ServiceWorker registration successful with scope: ', registration.scope);
                }).catch(err => {
                    console.log('ServiceWorker registration failed: ', err);
                });
            });

            // 새 버전 감지 시 자동 새로고침 (좀비 캐시 방지)
            let refreshing = false;
            navigator.serviceWorker.addEventListener('controllerchange', () => {
                if (!refreshing) {
                    window.location.reload();
                    refreshing = true;
                }
            });
        }
    

// Expose all functions
window.retryChapter = retryChapter;
window.showVerseGrid = showVerseGrid;
window.showChapterEndModal = showChapterEndModal;
window.changeFontSize = changeFontSize;
window.generateVerseHTML = generateVerseHTML;
window.handleTypingKeypress = handleTypingKeypress;
window.nextStage = nextStage;
window.prevStage = prevStage;
window.handleStageClear = handleStageClear;
window.goHome = goHome;
window.handleInput = handleInput;
window.hidePremiumHint = hidePremiumHint;
window.onChapterSelect = onChapterSelect;
window.createConfetti = createConfetti;
window.closeVerseGrid = closeVerseGrid;
window.submitTyping = submitTyping;
window.reviewChapterIncorrect = reviewChapterIncorrect;
window.startLearning = startLearning;
window.changeLevel = changeLevel;
window.getChoseong = getChoseong;
window.closeSettings = closeSettings;
window.shareTelegram = shareTelegram;
window.applyTheme = applyTheme;
window.updateFontSizeDisplay = updateFontSizeDisplay;
window.toggleIncorrectMode = toggleIncorrectMode;
window.renderKeyboard = renderKeyboard;
window.updateProgress = updateProgress;
window.showChoseongHint = showChoseongHint;
window.showSuccess = showSuccess;
window.loadStage = loadStage;
window.openSettings = openSettings;
window.getExtraKeywords = getExtraKeywords;
window.goToNextChapter = goToNextChapter;
