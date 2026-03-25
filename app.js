// --- CONSTANTS & GAME DATA ---
const BREAKPOINTS = [2, 6, 11, 16, 21, 31, 41];

// Index 0 and 1 are 0. Index 2 is cost from 1->2. 
const xpCostToNext = [0, 0, 15, 30, 30, 35, 35, 35, 40, 40, 40, 60, 90, 105, 120, 140, 160, 180, 205, 230, 255, 285, 315, 345, 375, 410, 445, 480, 520, 560, 600, 645, 690, 735, 780, 830, 880, 930, 985, 1040, 1095, 1155, 1215, 1275, 1335, 1400, 1465, 1530, 1600, 1670, 1740];

const STAR_RANK_MAP = {
    1: 10,
    2: 10,
    3: 20,
    4: 30,
    5: 50 // Bonus stats cap at 50
};

let database = null;

// --- 0. LOCALIZATION STATE & DICTIONARY ---
let currentLang = 'kr';

const uiTranslations = {
    kr: {
        title: "이격 인연작 최적화",
        baseChar: "원본 학생:",
        selectChar: "-- 학생 선택 --",
        targetStat: "목표 스탯:",
        statAtk: "공격력",
        statHp: "최대 체력",
        statHeal: "치유력",
        calcBtn: "최적화 계획 산출",
        alertNoChars: "최소 한 명의 학생을 선택해주세요!",
        roadmapTitle: "최적의 스탯 인연작 로드맵",
        totalXp: "총 필요 인연 XP:",
        totalStatGain: "총 {stat} 상승량:",
        allMaxRank: "선택한 모든 학생이 이미 최대 랭크입니다!",
        step: "단계",
        tieTitle: "동일 순위 (한 쪽을 먼저)",
        tieInstruction: "이 업그레이드는 가치가 동일합니다. <strong>초대권, 선물 등을 분산시키지 마세요.</strong> 목표 랭크에 도달할 때까지 한 학생에게 집중한 다음, 다음 학생으로 넘어가세요.",
        tieOr: "— 또는 —",
        rank: "인연랭",
        currentRank: "현 인연 랭크",
        stars: "성급",
        levelUpFrom: "다음 랭크로 레벨 업:",
        summaryViewBtn: "요약 보기",
        detailsViewBtn: "상세 보기",
        summaryTied: "Tie",
        include: "보유",
        notInclude: "미보유",
        reportIssue: "문제 보고",
        languageLabel: "언어:",
    },
    en: {
        title: "Bond Rank Bonus Stat Optimizer\nfor Students with Alts",
        baseChar: "Base Student:",
        selectChar: "-- Select Student --",
        targetStat: "Target Stat:",
        statAtk: "ATK",
        statHp: "Max HP",
        statHeal: "Healing",
        calcBtn: "Generate Optimal Bond Roadmap",
        alertNoChars: "Please select at least one character!",
        roadmapTitle: "Complete Optimal Roadmap to Rank 50",
        totalXp: "Total XP Required:",
        totalStatGain: "Total {stat} Gain:",
        allMaxRank: "All selected students are already at maximum rank!",
        step: "Step",
        tieTitle: "Tied Priority (Prioritize One First)",
        tieInstruction: "These upgrades have identical value. <strong>Do not split your gifts or invites.</strong> Focus all XP on one student until they hit the target rank, then move on to the next.",
        tieOr: "— OR —",
        rank: "Bond",
        currentRank: "Current Bond Rank",
        stars: "Stars",
        levelUpFrom: "Level up from",
        summaryViewBtn: "Summarize",
        detailsViewBtn: "Show Details",
        summaryTied: "Tied",
        include: "Have",
        notInclude: "Don't Have",
        reportIssue: "Report an Issue",
        languageLabel: "Language:",
    },
    jp: {
        title: "絆ランクボーナス最適化\n他の衣装をある生徒のため",
        baseChar: "元衣装の生徒:",
        selectChar: "-- 生徒選択 --",
        targetStat: "目標ステータス:",
        statAtk: "攻撃力",
        statHp: "最大HP",
        statHeal: "治癒力",
        calcBtn: "最適化ルート計算",
        alertNoChars: "少なくとも一人の生徒を選択してください！",
        roadmapTitle: "絆ランク50への完全最適化ロードマップ",
        totalXp: "総必要絆XP:",
        totalStatGain: "総{stat}上昇量:",
        allMaxRank: "選択された生徒は全員、すでに最大ランクです！",
        step: "ステップ",
        tieTitle: "同順位（まず一つを）",
        tieInstruction: "これらのアップグレードは価値が同じです。<strong>招待、贈り物を分散させないでください。</strong>目標ランクに到達するまで一人の生徒に全てのXPを集中させ、その後次に進んでください。",
        tieOr: "— または —",
        rank: "絆",
        currentRank: "現絆ランク",
        stars: "星",
        levelUpFrom: "レベルアップ:",
        summaryViewBtn: "要約表示",
        detailsViewBtn: "詳細表示",
        summaryTied: "同順位",
        include: "所属",
        notInclude: "未所属",
        reportIssue: "問題を報告",
        languageLabel: "言語:",
    }
};// Function to update all static HTML text
function updateStaticUI() {
    const elements = document.querySelectorAll('[data-i18n]');
    elements.forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (uiTranslations[currentLang][key]) {
            el.textContent = uiTranslations[currentLang][key];
        }
    });
}

// Listen for language dropdown changes
document.getElementById('langSelect').addEventListener('change', (e) => {
    currentLang = e.target.value;
    updateStaticUI();
    
    // Re-render the base character dropdown so names translate
    if (database) populateBaseDropdown();
    
    // Re-render the character input cards if a base character is already selected
    const baseSelect = document.getElementById('baseCharSelect');
    if (baseSelect.value) {
        // Trigger the 'change' event manually to redraw the inputs
        baseSelect.dispatchEvent(new Event('change'));
    }
    
    // Clear old results to prevent language mixing
    document.getElementById('results').innerHTML = ''; 
});

function populateBaseDropdown() {
    const select = document.getElementById('baseCharSelect');
    
    // Save the currently selected value so it doesn't reset when changing languages
    const currentValue = select.value; 
    
    // Clear existing options except the placeholder
    select.innerHTML = `<option value="" data-i18n="selectChar">${uiTranslations[currentLang].selectChar}</option>`;
    
    const sortedBases = Object.keys(database).sort();
    
    sortedBases.forEach(baseId => {
        let option = document.createElement('option');
        option.value = baseId;
        
        // Use the translated name of the first character in this group
        const firstAltKey = Object.keys(database[baseId])[0];
        const localizedName = database[baseId][firstAltKey].names.full[currentLang];
        
        option.textContent = localizedName;
        select.appendChild(option);
    });
    
    select.value = currentValue; // Restore selection
}

// --- 1. INITIALIZATION ---
// Fetch the JSON file when the page loads
fetch('bond_data.json')
    .then(response => response.json())
    .then(data => {
        database = data.base_characters;
        populateBaseDropdown();
    })
    .catch(error => console.error("Error loading JSON:", error));

// --- 2. UI EVENT LISTENERS ---
// When the user selects a character, generate the input fields
document.getElementById('baseCharSelect').addEventListener('change', (e) => {
    const selectedBase = e.target.value;
    const container = document.getElementById('altsContainer');
    const calcBtn = document.getElementById('calcButton');
    container.innerHTML = ''; // Clear previous fields

    if (!selectedBase) {
        calcBtn.style.display = 'none';
        return;
    }

    const alts = database[selectedBase];
    const t = uiTranslations[currentLang];
    
    for (const altId in alts) {
        const student = alts[altId];
        
        // Build a card for each alt using a template literal
        const cardHtml = `
            <div class="alt-card">
                <label>
                    <input type="checkbox" class="alt-toggle" data-id="${altId}" checked>
                    <strong>${student.names.full[currentLang]}</strong>
                    <span id="include-status-${altId}" style="font-size: 0.8em; color: #888; margin-left: 8px;">(${t.include})</span>
                </label>
                <div style="margin-top: 8px; display: flex; gap: 15px;">
                    <div>
                        <label for="rank-${altId}">${t.currentRank}:</label>
                        <input type="number" class="alt-rank" id="rank-${altId}" value="1" min="1" max="49" style="width: 80px;">
                    </div>
                    <div>
                        <label for="stars-${altId}">${t.stars}:</label>
                        <select class="alt-stars" id="stars-${altId}" style="width: 120px;">
                            <option value="1">★</option>
                            <option value="2">★★</option>
                            <option value="3">★★★</option>
                            <option value="4">★★★★</option>
                            <option value="5" selected>★★★★★</option>
                        </select>
                    </div>
                </div>
            </div>
        `;
        container.innerHTML += cardHtml;
    }
    
    calcBtn.style.display = 'block';
});

// When the user changes a star rating, update the max rank of the corresponding input
document.getElementById('altsContainer').addEventListener('change', (e) => {
    if (e.target.classList.contains('alt-stars')) {
        const altId = e.target.id.replace('stars-', '');
        const rankInput = document.getElementById(`rank-${altId}`);
        
        const stars = parseInt(e.target.value);
        const newMaxRank = STAR_RANK_MAP[stars];
        
        // The highest inputtable rank is 49, as 50 is the goal.
        const inputMax = Math.min(newMaxRank, 49);
        rankInput.max = inputMax;

        if (parseInt(rankInput.value) > inputMax) {
            rankInput.value = inputMax;
        }
    }

    // When a student is toggled, grey out the card and update text
    if (e.target.classList.contains('alt-toggle')) {
        const card = e.target.closest('.alt-card');
        const altId = e.target.getAttribute('data-id');
        const statusSpan = document.getElementById(`include-status-${altId}`);
        const t = uiTranslations[currentLang];

        if (card && statusSpan) {
            card.classList.toggle('deselected', !e.target.checked);
            statusSpan.textContent = e.target.checked ? `(${t.include})` : `(${t.notInclude})`;
        }
    }
});

// --- 3. HELPER MATH FUNCTIONS ---
function expandStatData(compactGains, maxRank = 50) {
    let fullArray = [];
    let currentGainIndex = 0;
    // If the character doesn't have this stat (e.g., missing healing), return all 0s
    if (!compactGains) return Array(maxRank + 1).fill(0);

    for (let rank = 2; rank <= maxRank; rank++) {
        if (currentGainIndex < BREAKPOINTS.length - 1 && rank === BREAKPOINTS[currentGainIndex + 1]) {
            currentGainIndex++;
        }
        fullArray[rank] = compactGains[currentGainIndex] || 0;
    }
    return fullArray;
}

function getProgression(startRank, targetRank, statArray) {
    let totalXp = 0;
    let totalStat = 0;
    for (let r = startRank + 1; r <= targetRank; r++) {
        totalXp += xpCostToNext[r];
        totalStat += statArray[r];
    }
    return { cost: totalXp, gain: totalStat, targetRank: targetRank };
}

// --- 4. THE ROADMAP GENERATOR ALGORITHM ---
document.getElementById('calcButton').addEventListener('click', () => {
    const selectedBase = document.getElementById('baseCharSelect').value;
    const targetStat = document.getElementById('statSelect').value;
    const activeToggles = document.querySelectorAll('.alt-toggle:checked');

    // Get current translations and localized stat name
    const t = uiTranslations[currentLang];
    const statKeyMap = {
        atk: 'statAtk',
        hp: 'statHp',
        healing: 'statHeal'
    };
    const statName = t[statKeyMap[targetStat]];
    
    let activeAlts = [];
    activeToggles.forEach(toggle => {
        const altId = toggle.getAttribute('data-id');
        const currentRank = parseInt(document.getElementById(`rank-${altId}`).value);
        const stars = parseInt(document.getElementById(`stars-${altId}`).value);
        const maxRankForAlt = STAR_RANK_MAP[stars];
        const compactStats = database[selectedBase][altId].bonuses[targetStat];
        
        activeAlts.push({
            name: database[selectedBase][altId].names.full[currentLang],
            shortName: database[selectedBase][altId].names.short[currentLang],
            currentRank: currentRank,
            maxRank: maxRankForAlt,
            statArray: expandStatData(compactStats)
        });
    });

    if (activeAlts.length === 0) {
        alert(t.alertNoChars);
        return;
    }

    // Generate the raw path, then compress it
    const rawRoadmapData = generateFullRoadmap(activeAlts);
    let cleanedSteps = compressRoadmap(rawRoadmapData.steps);

    // Filter out steps that provide no stat gain for the target stat.
    const gainfulSteps = cleanedSteps.filter(step => {
        if (step.isTieGroup) {
            // Tie groups have their efficiency calculated. If it's 0, gain is 0.
            return step.efficiency > 0;
        }
        // Standard steps have a direct gain property.
        return step.gain > 0;
    });

    // Recalculate total cost for only the steps being shown.
    const displayTotalCost = gainfulSteps.reduce((total, step) => total + step.cost, 0);

    const resultsDiv = document.getElementById('results');

    // If no steps, show a simple message and stop.
    if (gainfulSteps.length === 0) {
        resultsDiv.innerHTML = `
            <h3>${t.roadmapTitle}</h3>
            <p>${t.totalXp} <strong>${displayTotalCost}</strong></p>
            <p>${t.totalStatGain.replace('{stat}', statName)} <strong>+${rawRoadmapData.totalGain}</strong></p>
            <hr>
            <p>${t.allMaxRank}</p>
        `;
        return;
    }

    // Generate both detailed and summary views
    const detailedHtml = generateDetailedHtml(gainfulSteps, t, statName);
    const summaryText = generateSummaryText(gainfulSteps, t);

    // Set up initial HTML with a container for steps and a toggle button
    resultsDiv.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center;">
            <h3>${t.roadmapTitle}</h3>
            <button id="summaryToggleBtn" style="width: auto; padding: 5px 10px; margin: 0;">${t.summaryViewBtn}</button>
        </div>
        <p>${t.totalXp} <strong>${displayTotalCost}</strong></p>
        <p>${t.totalStatGain.replace('{stat}', statName)} <strong>+${rawRoadmapData.totalGain}</strong></p>
        <hr>
        <div id="roadmap-steps-container">${detailedHtml}</div>
    `;

    // Add event listener for the new toggle button
    const toggleBtn = document.getElementById('summaryToggleBtn');
    const stepsContainer = document.getElementById('roadmap-steps-container');

    toggleBtn.addEventListener('click', () => {
        const isShowingDetails = stepsContainer.querySelector('pre') === null;
        if (isShowingDetails) {
            stepsContainer.innerHTML = `<pre style="white-space: pre-wrap; word-break: break-word;">${summaryText}</pre>`;
            toggleBtn.textContent = t.detailsViewBtn;
        } else {
            stepsContainer.innerHTML = detailedHtml;
            toggleBtn.textContent = t.summaryViewBtn;
        }
    });
});

/**
 * Simulates leveling all characters to max rank, recording the most efficient steps in order.
 */
function generateFullRoadmap(alts) {
    // Create a deep copy so we don't mutate the user's HTML inputs during the simulation
    let simulatedAlts = alts.map(alt => ({
        name: alt.name,
        shortName: alt.shortName,
        currentRank: alt.currentRank,
        maxRank: alt.maxRank,
        statArray: alt.statArray
    }));

    let roadmap = [];
    let totalXpSpent = 0;
    let totalStatGained = 0;

    // Keep looping until every character hits the max rank
    while (true) {
        let bestUpgrade = null;

        simulatedAlts.forEach((alt, index) => {
            if (alt.currentRank >= alt.maxRank) return;

            let bestEfficiency = -1;
            let bestTarget = -1;
            let bestCost = 0;
            let bestGain = 0;

            // Find the most efficient future milestone for THIS character
            for (let target = alt.currentRank + 1; target <= alt.maxRank; target++) {
                let path = getProgression(alt.currentRank, target, alt.statArray);
                
                if (path.cost > 0) {
                    let efficiency = path.gain / path.cost;
                    
                    // NEW LOGIC: Check efficiency first, then break ties with lower cost
                    let isBetter = false;
                    // Use 0.0001 to prevent JavaScript floating point math errors
                    if (efficiency > bestEfficiency + 0.0001) {
                        isBetter = true;
                    } else if (Math.abs(efficiency - bestEfficiency) <= 0.0001) {
                        // If efficiency is identical, prefer the cheaper upgrade
                        if (path.cost < bestCost || bestCost === 0) {
                            isBetter = true;
                        }
                    }

                    if (isBetter) {
                        bestEfficiency = efficiency;
                        bestTarget = target;
                        bestCost = path.cost;
                        bestGain = path.gain;
                    }
                }
            }

            // Compare this character's best milestone against the rest of the group
            if (bestTarget !== -1) {
                let isBetterOverall = false;
                
                if (!bestUpgrade) {
                    isBetterOverall = true;
                } else if (bestEfficiency > bestUpgrade.efficiency + 0.0001) {
                    isBetterOverall = true;
                } else if (Math.abs(bestEfficiency - bestUpgrade.efficiency) <= 0.0001) {
                    // If efficiency is tied between two characters, pick the cheaper one
                    if (bestCost < bestUpgrade.cost) {
                        isBetterOverall = true;
                    }
                }

                if (isBetterOverall) {
                    bestUpgrade = {
                        altIndex: index,
                        name: alt.name,
                        shortName: alt.shortName,
                        startRank: alt.currentRank,
                        targetRank: bestTarget,
                        cost: bestCost,
                        gain: bestGain,
                        efficiency: bestEfficiency
                    };
                }
            }
        });

        // If no upgrades were found, everyone is at max rank. Break the loop.
        if (!bestUpgrade) break;

        // 1. Record the winning step into our timeline
        roadmap.push(bestUpgrade);
        totalXpSpent += bestUpgrade.cost;
        totalStatGained += bestUpgrade.gain;

        // 2. Apply the simulated level-up to the character so the next loop calculates correctly
        simulatedAlts[bestUpgrade.altIndex].currentRank = bestUpgrade.targetRank;
    }

    return {
        steps: roadmap,
        totalCost: totalXpSpent,
        totalGain: totalStatGained
    };
}

/**
 * Cleans up the raw roadmap by merging consecutive steps and grouping tied efficiencies.
 */
function compressRoadmap(rawSteps) {
    if (rawSteps.length === 0) return [];

    // Pass 1: Collapse sequential steps for the same character that are back-to-back.
    let sequentiallyCompressed = [];
    sequentiallyCompressed.push({ ...rawSteps[0] });

    for (let i = 1; i < rawSteps.length; i++) {
        const current = { ...rawSteps[i] };
        const last = sequentiallyCompressed[sequentiallyCompressed.length - 1];
        
        // Merge if it's the same character and the rank progression is continuous.
        if (last.name === current.name && last.targetRank === current.startRank) {
            last.targetRank = current.targetRank;
            last.cost += current.cost;
            last.gain += current.gain;
            last.efficiency = last.cost > 0 ? last.gain / last.cost : 0;
        } else {
            sequentiallyCompressed.push(current);
        }
    }

    // Pass 2: Collapse steps with identical cost and gain into tie groups.
    let finalCompressed = [];
    if (sequentiallyCompressed.length > 0) {
        finalCompressed.push({ ...sequentiallyCompressed[0] });
        for (let i = 1; i < sequentiallyCompressed.length; i++) {
            const current = { ...sequentiallyCompressed[i] };
            let last = finalCompressed[finalCompressed.length - 1];
            
            const lastGain = last.isTieGroup ? last.gain : last.gain;
            const lastCost = last.isTieGroup ? last.cost : last.cost;

            // Group if they have identical gain and cost.
            if (lastGain === current.gain && lastCost === current.cost) {
                if (!last.isTieGroup) {
                    // Convert the previous step into a new tie group.
                    finalCompressed[finalCompressed.length - 1] = {
                        isTieGroup: true,
                        efficiency: current.efficiency,
                        gain: current.gain,
                        cost: current.cost,
                        options: [{ ...last }]
                    };
                    last = finalCompressed[finalCompressed.length - 1];
                }
                last.options.push(current);
            } else {
                finalCompressed.push(current);
            }
        }
    }
    
    return finalCompressed;
}

// --- 5. VIEW RENDERING FUNCTIONS ---

/**
 * Generates the HTML for the detailed, step-by-step roadmap view.
 */
function generateDetailedHtml(steps, t, statName) {
    let html = '';
    let currentStepNum = 1;
    steps.forEach(step => {
        if (step.isTieGroup) {
            let optionsHtml = step.options.map(opt => `
                <div style="margin-left: 15px; border-left: 2px solid #ddd; padding-left: 10px; margin-bottom: 5px;">
                    <strong>${opt.name}:</strong> ${t.rank} ${opt.startRank} ➡ <strong>${t.rank} ${opt.targetRank}</strong>
                    <br><span style="font-size: 0.85em; color: #555;">${opt.cost} XP | ${statName} +${opt.gain}</span>
                </div>
            `).join(`<div style="margin-left: 15px; font-weight: bold; color: #888; font-size: 0.85em; margin-bottom: 5px;">${t.tieOr}</div>`);

            html += `
                <div style="margin-bottom: 12px; padding: 12px; background: #fffcf2; border-left: 4px solid #f0ad4e; border-radius: 4px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
                    <h4 style="margin: 0 0 6px 0; color: #d58512;">${t.step} ${currentStepNum}: ${t.tieTitle}</h4>
                    <p style="font-size: 0.85em; margin: 0 0 10px 0; color: #666;">
                        ${t.tieInstruction}
                    </p>
                    ${optionsHtml}
                </div>
            `;
        } else {
            html += `
                <div style="margin-bottom: 12px; padding: 12px; background: #fdfdfd; border-left: 4px solid #007bff; border-radius: 4px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
                    <h4 style="margin: 0 0 6px 0;">${t.step} ${currentStepNum}: ${step.name}</h4>
                    <div style="font-size: 0.95em;">
                        ${t.levelUpFrom} ${t.rank} ${step.startRank} ➡ <strong>${t.rank} ${step.targetRank}</strong>
                    </div>
                    <div style="font-size: 0.85em; color: #555; margin-top: 6px;">
                        ${step.cost} XP | ${statName} +${step.gain}
                    </div>
                </div>
            `;
        }
        currentStepNum++;
    });
    return html;
}

/**
 * Generates the simple text summary of the roadmap.
 */
function generateSummaryText(steps, t) {
    return steps.map(step => {
        if (step.isTieGroup) {
            const tiedSummaries = step.options.map(opt => `${opt.shortName} ${opt.targetRank}`);
            return `${t.summaryTied}: ${tiedSummaries.join(', ')}`;
        } else {
            return `${step.shortName} ${step.targetRank}`;
        }
    }).join('\n');
}