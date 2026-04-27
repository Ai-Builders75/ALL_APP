// Core Logic & Global State

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
        
        let isSoundEnabled = true;

        function toggleSound() {
            isSoundEnabled = !isSoundEnabled;
            const btn = document.getElementById('soundToggleBtn');
            if (btn) {
                btn.innerHTML = isSoundEnabled ? '🔊' : '🔇';
                btn.style.opacity = isSoundEnabled ? '1' : '0.5';
            }
        }

        function playErrorSound() {
            if (!isSoundEnabled) return;
            try {
                const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
                const oscillator = audioCtx.createOscillator();
                const gainNode = audioCtx.createGain();
                
                // 깔끔한 짧은 '띡' 혹은 '삐-' 소리로 변경
                oscillator.type = 'square'; // 'sine', 'square', 'triangle' 중 하나
                oscillator.frequency.setValueAtTime(300, audioCtx.currentTime);
                
                gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1);
                
                oscillator.connect(gainNode);
                gainNode.connect(audioCtx.destination);
                
                oscillator.start();
                oscillator.stop(audioCtx.currentTime + 0.1);
            } catch(e) {
                console.log('Audio not supported or blocked');
            }
        }

        function playSuccessSound() {
            if (!isSoundEnabled) return;
            try {
                const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
                
                // Play a quick ascending bright chime (C5 -> E5 -> G5)
                const playNote = (freq, startTime) => {
                    const osc = audioCtx.createOscillator();
                    const gain = audioCtx.createGain();
                    osc.type = 'sine';
                    osc.frequency.setValueAtTime(freq, startTime);
                    gain.gain.setValueAtTime(0, startTime);
                    gain.gain.linearRampToValueAtTime(0.1, startTime + 0.02);
                    gain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.2);
                    osc.connect(gain);
                    gain.connect(audioCtx.destination);
                    osc.start(startTime);
                    osc.stop(startTime + 0.2);
                };

                const now = audioCtx.currentTime;
                playNote(523.25, now);       // C5
                playNote(659.25, now + 0.1); // E5
                playNote(783.99, now + 0.2); // G5
            } catch(e) {
                console.log('Audio not supported or blocked');
            }
        }
        
        // 특수 예외 처리어 사전 (키워드 -> 성경 본문 내의 실제 텍스트)
        const synonyms = {};
        
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
            if (typeof updateAdPosition === 'function') updateAdPosition(currentLevel);
            loadStage(currentStage); // reload current stage with new level
        }

        function toggleLevelDropdown() {
            const dropdown = document.getElementById('levelDropdown');
            dropdown.classList.toggle('show');
        }

        document.addEventListener('click', function(event) {
            const container = document.querySelector('.dropdown-container');
            if (container && !container.contains(event.target)) {
                const dropdown = document.getElementById('levelDropdown');
                if(dropdown) dropdown.classList.remove('show');
            }
        });

        function changeLevelInDropdown(level) {
            changeLevel(level);
            document.getElementById('levelSelect').value = level; // Sync home screen dropdown
            document.getElementById('levelDropdownBtn').innerHTML = `📊 ${level}단계 ▼`;
            
            // Update active styling
            const items = document.querySelectorAll('.level-dropdown-item');
            items.forEach((item, index) => {
                if (index + 1 === level) {
                    item.classList.add('active');
                } else {
                    item.classList.remove('active');
                }
            });
            
            document.getElementById('levelDropdown').classList.remove('show');
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
                targetKeywords = verseText.replace(/[.,!?]/g, '').split(' ').filter(w => w.length > 0);
            }
            
            // Sort target keywords by length descending so longer words get replaced first
            targetKeywords.sort((a, b) => b.length - a.length);

            currentStageBlanks = [];
            
            targetKeywords.forEach((kw, i) => {
                let searchWord = synonyms[kw];
                if (!searchWord) {
                    let cleanKw = kw.replace(/[.,!?]/g, '').trim();
                    searchWord = cleanKw.split(' ').join('[\\s.,!?]+');
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

            // Update level dropdown button text to reflect the current level
            document.getElementById('levelDropdownBtn').innerHTML = `📊 ${currentLevel}단계 ▼`;
            
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
                // removed auto focus to prevent keyboard from popping up immediately
            } else {
                document.getElementById('keyboard').style.display = 'flex';
                document.getElementById('typingContainer').style.display = 'none';
                renderKeyboard(keyboardWords);
            }
            updateProgress();
            
            document.getElementById('successModal').classList.remove('show');
            document.querySelectorAll('.confetti-piece').forEach(el => el.remove());
        }

        

        

        // 입력될 때마다 실시간으로 정답을 확인하여, 맞으면 즉시 다음 빈칸으로 넘어가는 기능 (마법 같은 사용자 경험)
        

                

        

        

        

        function shareTelegram() {
            const chapterMistakes = incorrectStages.filter(s => gameData[s].chapter === currentChapter).length;
            const message = `🎉 [404 마스터] 제 ${currentChapter}장 (Level ${currentLevel}) 암기 학습 완료!\n\n${chapterMistakes === 0 ? "💯 오답 없이 완벽하게 통과했습니다!" : "💪 오답 노트까지 꼼꼼하게 복습했습니다!"}\n\n말씀으로 인맞는 그날까지 화이팅입니다!`;
            const tgUrl = `tg://msg?text=${encodeURIComponent(message)}`;
            window.location.href = tgUrl;
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
            if (typeof playSuccessSound === 'function') playSuccessSound();
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

        const FONT_SIZES = [
            { value: 0.9, label: "작게" },
            { value: 1.15, label: "기본" },
            { value: 1.4, label: "크게" },
            { value: 1.65, label: "매우 크게" }
        ];

        function changeFontSize(delta) {
            let root = document.documentElement;
            let currentSize = parseFloat(getComputedStyle(root).getPropertyValue('--verse-font-size')) || 1.15;
            
            let currentIndex = 1;
            let minDiff = Infinity;
            FONT_SIZES.forEach((fs, i) => {
                let diff = Math.abs(fs.value - currentSize);
                if (diff < minDiff) {
                    minDiff = diff;
                    currentIndex = i;
                }
            });

            let step = delta > 0 ? 1 : -1;
            let newIndex = currentIndex + step;
            
            if (newIndex < 0) newIndex = 0;
            if (newIndex >= FONT_SIZES.length) newIndex = FONT_SIZES.length - 1;
            
            let newSize = FONT_SIZES[newIndex].value;
            
            root.style.setProperty('--verse-font-size', newSize + 'rem');
            localStorage.setItem('verseFontSize', newSize);
            updateFontSizeDisplay(newSize);
        }

        function updateFontSizeDisplay(size) {
            let label = "기본";
            let minDiff = Infinity;
            FONT_SIZES.forEach((fs) => {
                let diff = Math.abs(fs.value - size);
                if (diff < minDiff) {
                    minDiff = diff;
                    label = fs.label;
                }
            });
            const displayEl = document.getElementById('fontSizeDisplay');
            if(displayEl) displayEl.textContent = label;
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
        window.onload = () => {
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
        };

        // 키보드 화살표 키로 이전/다음 구절 이동
        document.addEventListener('keydown', function(e) {
            // 사용자의 요청으로 4, 5단계(입력창 활성화)에서도 좌우 화살표 키는 구절 이동으로 사용함
            // 모달창(오답복습, 설정, 절표 등)이 떠있지 않고 학습 모드(appContainer)가 보일 때만 동작
            const appContainer = document.getElementById('appContainer');
            const successModal = document.getElementById('successModal');
            const chapterEndModal = document.getElementById('chapterEndModal');
            const gridModal = document.getElementById('gridModal');
            
            if (appContainer && appContainer.style.display !== 'none' && 
                (!successModal || !successModal.classList.contains('show')) &&
                (!chapterEndModal || !chapterEndModal.classList.contains('show')) &&
                (!gridModal || !gridModal.classList.contains('show'))) {
                
                if (e.key === 'ArrowLeft') {
                    e.preventDefault(); // 스크롤 등 기본 동작 방지
                    prevStage();
                } else if (e.key === 'ArrowRight') {
                    e.preventDefault();
                    nextStage();
                }
            }
        });

        // ==========================================
        // 서비스 워커 등록 해제 (캐시 스트레스 방지)
        // ==========================================
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.getRegistrations().then(function(registrations) {
                for(let registration of registrations) {
                    registration.unregister();
                    console.log('ServiceWorker unregistered successfully.');
                }
            });
        }


// Native & Monetization Settings

        document.addEventListener("DOMContentLoaded", async function() {
            // Removed mobile focus scroll block which caused UI layout breaks and header hiding
            window.updateAdPosition = async function(level) {
                if (window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.AdMob) {
                    try {
                        const AdMob = window.Capacitor.Plugins.AdMob;
                        await AdMob.removeBanner().catch(e => {}); // safe remove
                        const pos = (level >= 4) ? 'TOP_CENTER' : 'BOTTOM_CENTER';
                        
                        const appContainer = document.getElementById('appContainer');
                        if (appContainer) {
                            if (level >= 4) {
                                appContainer.style.paddingTop = '90px';
                                appContainer.style.paddingBottom = '40px'; // Ensure space for Android navigation bar
                            } else {
                                appContainer.style.paddingTop = '0px';
                                appContainer.style.paddingBottom = '70px'; // Restore default bottom padding for bottom ad
                            }
                        }

                        const options = {
                            adId: 'ca-app-pub-3940256099942544/6300978111', // Test Banner ID
                            margin: 0,
                            isTesting: false,
                            adSize: 'ADAPTIVE_BANNER',
                            position: pos
                        };
                        await AdMob.showBanner(options);
                        console.log(`[Monetization] AdMob banner moved to ${pos}`);
                    } catch (e) {
                        console.error("[Monetization] AdMob Position Update Error:", e);
                    }
                }
            };

            const isNative = window.Capacitor && window.Capacitor.isNativePlatform();

            if (isNative) {
                // [APP] Capacitor Native Environment: Use AdMob & Setup Hardware Back Button
                console.log("[Monetization] Native environment detected. Initializing AdMob...");
                
                try {
                    if (window.Capacitor.Plugins.App) {
                        window.Capacitor.Plugins.App.addListener('backButton', () => {
                            const appContainer = document.getElementById('appContainer');
                            if (appContainer && appContainer.style.display !== 'none') {
                                if (typeof goHome === 'function') goHome();
                            } else {
                                window.Capacitor.Plugins.App.exitApp();
                            }
                        });
                        console.log("[Mobile] Hardware back button intercepted.");
                    }
                } catch (err) {
                    console.error("[Mobile] Back button setup failed", err);
                }

                try {
                    // Try to initialize AdMob via Capacitor plugins
                    if (window.Capacitor.Plugins && window.Capacitor.Plugins.AdMob) {
                        const AdMob = window.Capacitor.Plugins.AdMob;
                        await AdMob.initialize();
                        
                        // Set initial ad position based on currentLevel
                        updateAdPosition(typeof currentLevel !== 'undefined' ? currentLevel : 1);
                    } else {
                        console.warn("[Monetization] AdMob plugin not found.");
                    }
                } catch (e) {
                    console.error("[Monetization] AdMob Error:", e);
                }
            } else {
                // [WEB] Web Environment: Use AdSense
                console.log("[Monetization] Web environment detected. Initializing AdSense...");
                const adsenseContainer = document.getElementById('adsense-container');
                if (adsenseContainer) {
                    adsenseContainer.style.display = 'block';
                    adsenseContainer.innerHTML = `
                        <ins class="adsbygoogle"
                             style="display:inline-block;width:320px;height:50px"
                             data-ad-client="ca-pub-7902247777992049"
                             data-ad-slot="1234567890"></ins>
                    `;
                    
                    const script = document.createElement('script');
                    script.async = true;
                    script.src = "https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-7902247777992049";
                    script.crossOrigin = "anonymous";
                    document.head.appendChild(script);

                    const inlineScript = document.createElement('script');
                    inlineScript.textContent = "(adsbygoogle = window.adsbygoogle || []).push({});";
                    document.body.appendChild(inlineScript);
                }
            }
        });
