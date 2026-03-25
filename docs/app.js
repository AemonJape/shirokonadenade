// --- CONSTANTS & GAME DATA ---
const BREAKPOINTS = [2, 6, 11, 16, 21, 31, 41];

// Index 0 and 1 are 0. Index 2 is cost from 1->2. 
const xpCostToNext = [0, 0, 15, 30, 30, 35, 35, 35, 40, 40, 40, 60, 90, 105, 120, 140, 160, 180, 205, 230, 255, 285, 315, 345, 375, 410, 445, 480, 520, 560, 600, 645, 690, 735, 780, 830, 880, 930, 985, 1040, 1095, 1155, 1215, 1275, 1335, 1400, 1465, 1530, 1600, 1670, 1740];

const STAR_RANK_MAP = {
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
        title: "블루 아카이브\n이격 인연작 최적화 계산기",
        baseChar: "원본 학생:",
        selectChar: "-- 학생 선택 --",
        targetStat: "목표 스탯:",
        statAtk: "공격력",
        statHp: "최대 체력",
        statHeal: "치유력",
        statDef: "방어력",
        calcBtn: "최적화 계획 산출",
        alertNoChars: "최소 한 명의 학생을 선택해주세요!",
        roadmapTitle: "최적의 스탯 인연작 로드맵",
        totalXp: "총 필요 인연 XP:",
        totalStatGain: "총 {stat} 상승량:",
        allMaxRank: "획득 가능한 보너스 스탯이 없습니다!",
        step: "단계",
        tieTitle: "동순위 (한 쪽을 먼저)",
        tieInstruction: "가치가 동일한 부분입니다. <strong>초대권, 선물 등을 분산시키지 마세요.</strong> 목표 랭크에 도달할 때까지 한 학생에게 집중한 다음, 다음 학생으로 넘어가세요.",
        tieOr: "— 또는 —",
        rank: "인연랭",
        currentRank: "현 인연 랭크",
        stars: "성급:",
        star12: "★~★★",
        star3: "★★★",
        star4: "★★★★",
        star5: "★★★★★",
        levelUpFrom: "다음 랭크로 레벨 업:",
        summaryViewBtn: "요약 보기",
        detailsViewBtn: "상세 보기",
        summaryTied: "Tie",
        include: "보유",
        notInclude: "미보유",
        reportIssue: "문제 보고",
        languageLabel: "Language:",
        copyBtn: "복사",
        copiedBtn: "복사됨!",
        graphViewBtn: "그래프 보기",
        graphXAxis: "누적 인연 XP",
        graphYAxis: "누적 {stat} 상승량",
        graphStart: "시작",
    },
    en: {
        title: "Blue Archive\nBond Rank Bonus Stat Optimizer for Students with Alts",
        baseChar: "Base Student:",
        selectChar: "-- Select Student --",
        targetStat: "Target Stat:",
        statAtk: "ATK",
        statHp: "Max HP",
        statHeal: "Healing",
        statDef: "DEF",
        calcBtn: "Generate Optimal Bond Roadmap",
        alertNoChars: "Please select at least one character!",
        roadmapTitle: "Optimal Roadmap",
        totalXp: "Total XP Required:",
        totalStatGain: "Total {stat} Gain:",
        allMaxRank: "No earnable Bonus Stats are available!",
        step: "Step",
        tieTitle: "Tied Priority (Prioritize One First)",
        tieInstruction: "These upgrades have identical value. <strong>Do not split your gifts or invites.</strong> Focus all XP on one student until they hit the target rank, then move on to the next.",
        tieOr: "— OR —",
        rank: "Bond",
        currentRank: "Current Bond Rank",
        stars: "Stars:",
        star12: "★ or ★★",
        star3: "★★★",
        star4: "★★★★",
        star5: "★★★★★",
        levelUpFrom: "Level up from",
        summaryViewBtn: "Summarize",
        detailsViewBtn: "Details",
        summaryTied: "Tied",
        include: "Have",
        notInclude: "Don't Have",
        reportIssue: "Report an Issue",
        languageLabel: "Language:",
        copyBtn: "Copy",
        copiedBtn: "Copied!",
        graphViewBtn: "Show Graph",
        graphXAxis: "Cumulative Bond XP",
        graphYAxis: "Cumulative {stat} Gain",
        graphStart: "Start",
    },
    jp: {
        title: "ブルーアーカイブ\n絆ランクボーナス最適化\n他の衣装がある生徒のため",
        baseChar: "元衣装の生徒:",
        selectChar: "-- 生徒選択 --",
        targetStat: "目標ステータス：",
        statAtk: "攻撃力",
        statHp: "最大HP",
        statHeal: "治癒力",
        statDef: "防御力",
        calcBtn: "最適化ルート計算",
        alertNoChars: "少なくとも一人の生徒を選択してください！",
        roadmapTitle: "最適化ロードマップ",
        totalXp: "総必要絆XP：",
        totalStatGain: "総{stat}上昇量：",
        allMaxRank: "取得可能なボーナスステータスはありません！",
        step: "ステップ",
        tieTitle: "同順位（まず一つを）",
        tieInstruction: "これらのアップグレードは価値が同じです。<strong>招待、贈り物を分散させないでください。</strong>目標ランクに到達するまで一人の生徒に全てのXPを集中させ、その後次に進んでください。",
        tieOr: "— または —",
        rank: "絆",
        currentRank: "現絆ランク",
        stars: "星：",
        star12: "★～★★",
        star3: "★★★",
        star4: "★★★★",
        star5: "★★★★★",
        levelUpFrom: "レベルアップ：",
        summaryViewBtn: "要約",
        detailsViewBtn: "詳細",
        summaryTied: "同順位",
        include: "所属",
        notInclude: "未所属",
        reportIssue: "問題を報告",
        languageLabel: "Language:",
        copyBtn: "コピー",
        copiedBtn: "コピーしました！",
        graphViewBtn: "グラフ表示",
        graphXAxis: "累積絆XP",
        graphYAxis: "累積{stat}上昇量",
        graphStart: "開始",
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
    
    const charactersWithNames = Object.keys(database).map(baseId => {
        // Use the translated name of the first character in this group for sorting
        const firstAltKey = Object.keys(database[baseId])[0];
        const localizedName = database[baseId][firstAltKey].names.full[currentLang];
        return { id: baseId, name: localizedName };
    });

    // Sort the array of characters alphabetically by their localized name
    charactersWithNames.sort((a, b) => a.name.localeCompare(b.name, currentLang));

    charactersWithNames.forEach(character => {
        let option = document.createElement('option');
        option.value = character.id;
        option.textContent = character.name;
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
                    <span style="display: inline-flex; align-items: center; white-space: nowrap;">
                        <strong>${student.names.full[currentLang]}</strong>
                        <span id="include-status-${altId}" style="font-size: 0.8em; color: #888; margin-left: 8px;">(${t.include})</span>
                        <input type="checkbox" class="alt-toggle" data-id="${altId}" checked style="margin: 0 0 0 5px;">
                    </span>
                </label>
                <div style="margin-top: 8px; display: flex; gap: 15px; align-items: flex-end;">
                    <div style="flex: 1;">
                        <label for="rank-${altId}">${t.currentRank}</label>
                        <input type="number" class="alt-rank" id="rank-${altId}" value="1" min="1" max="49">
                    </div>
                    <div style="flex: 1;">
                        <label for="stars-${altId}">${t.stars}</label>
                        <select class="alt-stars" id="stars-${altId}">
                            <option value="2">${t.star12}</option>
                            <option value="3">${t.star3}</option>
                            <option value="4">${t.star4}</option>
                            <option value="5" selected>${t.star5}</option>
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
        healing: 'statHeal',
        def: 'statDef'
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

    // Create a separate list of steps for the graph from the raw, uncompressed data.
    const gainfulRawStepsForGraph = rawRoadmapData.steps.filter(step => step.gain > 0);

    // Recalculate total cost and gain for only the steps being shown.
    const { cost: displayTotalCost, gain: displayTotalGain } = gainfulSteps.reduce((totals, step) => {
        if (step.isTieGroup) {
            totals.cost += step.cost * step.options.length;
            totals.gain += step.gain * step.options.length;
        } else {
            totals.cost += step.cost;
            totals.gain += step.gain;
        }
        return totals;
    }, { cost: 0, gain: 0 });

    const resultsDiv = document.getElementById('results');

    // If no steps, show a simple message and stop.
    if (gainfulSteps.length === 0) {
        resultsDiv.innerHTML = `
            <h3>${t.roadmapTitle}</h3>
            <p>${t.totalXp} <strong>${displayTotalCost}</strong></p>
            <p>${t.totalStatGain.replace('{stat}', statName)} <strong>+${displayTotalGain}</strong></p>
            <hr>
            <p>${t.allMaxRank}</p>
        `;
        return;
    }

    // Generate all three views
    const detailedHtml = generateDetailedHtml(gainfulSteps, t, statName);
    const summaryText = generateSummaryText(gainfulSteps, t);
    const summaryHtml = `
        <pre>${summaryText}</pre>
        <button id="copySummaryBtn" class="btn-inline" style="margin-top: 10px;">${t.copyBtn}</button>
    `;
    const graphHtml = generateGraphSvg(gainfulRawStepsForGraph, t, statName, activeAlts);

    // Set up initial HTML with a container for steps and a toggle button
    resultsDiv.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center;">
            <h3>${t.roadmapTitle}</h3>
            <div id="view-toggle-container">
                <button id="detailsViewBtn" class="btn-inline" disabled>${t.detailsViewBtn}</button>
                <button id="summaryViewBtn" class="btn-inline">${t.summaryViewBtn}</button>
                <button id="graphViewBtn" class="btn-inline">${t.graphViewBtn}</button>
            </div>
        </div>
        <p>${t.totalXp} <strong>${displayTotalCost}</strong></p>
        <p>${t.totalStatGain.replace('{stat}', statName)} <strong>+${displayTotalGain}</strong></p>
        <hr>
        <div id="roadmap-steps-container">${detailedHtml}</div>
    `;

    // Add event listeners for the view toggle buttons
    const stepsContainer = document.getElementById('roadmap-steps-container');
    const detailsBtn = document.getElementById('detailsViewBtn');
    const summaryBtn = document.getElementById('summaryViewBtn');
    const graphBtn = document.getElementById('graphViewBtn');
    const allViewBtns = [detailsBtn, summaryBtn, graphBtn];

    const copyAction = (e) => {
        navigator.clipboard.writeText(summaryText).then(() => {
            const copyBtn = e.target;
            const originalText = copyBtn.textContent;
            copyBtn.textContent = t.copiedBtn;
            copyBtn.disabled = true;
            setTimeout(() => {
                copyBtn.textContent = originalText;
                copyBtn.disabled = false;
            }, 1500);
        }).catch(err => console.error('Failed to copy text: ', err));
    };

    const setActiveButton = (activeBtn) => {
        allViewBtns.forEach(btn => btn.disabled = false);
        activeBtn.disabled = true;
    };

    detailsBtn.addEventListener('click', () => {
        stepsContainer.innerHTML = detailedHtml;
        setActiveButton(detailsBtn);
    });

    summaryBtn.addEventListener('click', () => {
        stepsContainer.innerHTML = summaryHtml;
        setActiveButton(summaryBtn);
        document.getElementById('copySummaryBtn').addEventListener('click', copyAction);
    });

    graphBtn.addEventListener('click', () => {
        stepsContainer.innerHTML = graphHtml;
        setActiveButton(graphBtn);
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
            
            const lastGain = last.gain;
            const lastCost = last.cost;

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
 * Generates an SVG graph of the roadmap.
 */
function generateGraphSvg(steps, t, statName, activeAlts) {
    if (steps.length === 0) return '';

    // 1. Prepare data points with full state at each step
    let cumulativeXp = 0;
    let cumulativeStat = 0;

    const studentRanks = {};
    const studentShortNames = {};
    activeAlts.forEach(alt => {
        studentRanks[alt.name] = alt.currentRank;
        studentShortNames[alt.name] = alt.shortName;
    });

    const dataPoints = [{ x: 0, y: 0, step: 0, ranks: {...studentRanks} }];

    steps.forEach((step, index) => {
        cumulativeXp += step.cost;
        cumulativeStat += step.gain;
        studentRanks[step.name] = step.targetRank;
        dataPoints.push({ x: cumulativeXp, y: cumulativeStat, step: index + 1, ranks: {...studentRanks} });
    });

    // 2. SVG dimensions and scales
    const width = 500;
    const height = 300;
    const margin = { top: 20, right: 20, bottom: 50, left: 70 };
    const graphWidth = width - margin.left - margin.right;
    const graphHeight = height - margin.top - margin.bottom;
    const maxXp = dataPoints.length > 1 ? dataPoints[dataPoints.length - 1].x : 1;
    const maxStat = dataPoints.length > 1 ? dataPoints[dataPoints.length - 1].y : 1;

    if (maxXp === 0 || maxStat === 0) return `<p style="text-align: center; padding: 20px;">Cannot draw graph: No XP cost or stat gain.</p>`;
    const xScale = (x) => (x / maxXp) * graphWidth;
    const yScale = (y) => graphHeight - (y / maxStat) * graphHeight;

    // Export the graph data globally so our tooltip functions can read it later
    window.activeGraphConfig = {
        data: dataPoints,
        shortNames: studentShortNames,
        statName: statName,
        t: t,
        graphWidth: graphWidth
    };

    // 3. Build SVG parts
    const style = `
        <style>
            .line { fill: none; stroke: #007bff; stroke-width: 2; pointer-events: none; }
            .marker-diamond { fill: #007bff; stroke: white; stroke-width: 1; pointer-events: none; }
            .marker-area { fill: transparent; cursor: pointer; }
            .axis-line { stroke: #ccc; }
            .axis-label { fill: #666; font-size: 12px; }
            .tick-label, .step-label { fill: #333; font-size: 12px; }
            .tooltip { font-size: 12px; pointer-events: none; }
            .tooltip-bg { fill: #fff; stroke: #ccc; stroke-width: 1; opacity: 0.95; }

            @media (prefers-color-scheme: dark) {
                .line { stroke: #58a6ff; }
                .marker-diamond { fill: #58a6ff; stroke: #21262d; }
                .axis-line { stroke: #444; }
                .axis-label { fill: #8b949e; }
                .tick-label, .step-label { fill: #c9d1d9; }
                .tooltip-bg { fill: #21262d; stroke: #444; }
                .tooltip text, .tooltip tspan { fill: #c9d1d9; }
            }
        </style>
    `;

    const linePoints = dataPoints.map(p => `${xScale(p.x)},${yScale(p.y)}`).join(' ');
    const line = `<polyline class="line" points="${linePoints}" />`;

    let visibleMarkers = '';
    let hoverAreas = '';
    dataPoints.forEach((p, i) => {
        const cx = xScale(p.x);
        const cy = yScale(p.y);
        visibleMarkers += `<path class="marker-diamond" d="M${cx},${cy - 4} L${cx + 4},${cy} L${cx},${cy + 4} L${cx - 4},${cy} Z" />`;
        
        // Pass 'this' into the function so the script knows exactly which graph is being hovered
        hoverAreas += `<circle class="marker-area" cx="${cx}" cy="${cy}" r="8" onmouseover="showGraphTooltip(event, ${i}, this)" onmouseout="hideGraphTooltip(this)" />`;
    });

    const yAxisLabel = t.graphYAxis.replace('{stat}', statName);
    const axes = `<line class="axis-line" x1="0" y1="0" x2="0" y2="${graphHeight}" /><text class="axis-label" transform="rotate(-90)" x="${-graphHeight / 2}" y="-50" text-anchor="middle">${yAxisLabel}</text><text class="tick-label" x="-10" y="0" text-anchor="end" dy="0.3em">${maxStat.toLocaleString()}</text><text class="tick-label" x="-10" y="${graphHeight}" text-anchor="end">0</text><line class="axis-line" x1="0" y1="${graphHeight}" x2="${graphWidth}" y2="${graphHeight}" /><text class="axis-label" x="${graphWidth / 2}" y="${graphHeight + 40}" text-anchor="middle">${t.graphXAxis}</text><text class="tick-label" x="${graphWidth}" y="${graphHeight + 20}" text-anchor="end">${maxXp.toLocaleString()}</text>`;

    // Changed all 'id' attributes to 'class' attributes to prevent duplicates
    const tooltip = `
        <g class="tooltip graph-tooltip" visibility="hidden">
            <rect class="tooltip-bg" width="150" height="80" rx="4" />
            <text class="tooltip-text" x="10" y="20">
                <tspan class="tooltip-xp" x="10" dy="0"></tspan>
                <tspan class="tooltip-stat" x="10" dy="1.2em"></tspan>
                <tspan class="tooltip-ranks-header" x="10" dy="1.5em" font-style="italic" font-size="0.9em">${t.rank}:</tspan>
            </text>
        </g>`;
    // (The <script> tag has been entirely removed from here)
    
    return `
        <div class="graph-container" style="max-width: ${width}px; margin: 20px auto 0;">
            <svg viewBox="0 0 ${width} ${height}" style="width: 100%; height: auto; overflow: visible;">
                ${style}
                <g transform="translate(${margin.left}, ${margin.top})">
                    ${axes}
                    ${line}
                    ${visibleMarkers}
                    ${tooltip}
                    ${hoverAreas}
                </g>
            </svg>
        </div>
    `;
}

/**
 * Generates the HTML for the detailed, step-by-step roadmap view.
 */
function generateDetailedHtml(steps, t, statName) {
    let html = '';
    let currentStepNum = 1;
    steps.forEach(step => {
        if (step.isTieGroup) {
            let optionsHtml = step.options.map(opt => `
                <div class="tie-option">
                    <strong>${opt.name}:</strong> ${t.rank} ${opt.startRank} ➡ <strong>${t.rank} ${opt.targetRank}</strong>
                    <div class="meta">${opt.cost} XP | ${statName} +${opt.gain}</div>
                </div>
            `).join(`<div class="tie-separator">${t.tieOr}</div>`);

            html += `
                <div class="roadmap-step tie">
                    <h4>${t.step} ${currentStepNum}: ${t.tieTitle}</h4>
                    <p class="instruction">
                        ${t.tieInstruction}
                    </p>
                    ${optionsHtml}
                </div>
            `;
        } else {
            html += `
                <div class="roadmap-step standard">
                    <h4>${t.step} ${currentStepNum}: ${step.name}</h4>
                    <div class="details">
                        ${t.levelUpFrom} ${t.rank} ${step.startRank} ➡ <strong>${t.rank} ${step.targetRank}</strong>
                    </div>
                    <div class="meta">
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

/**
 * Shows Graph Tooltip
 */
window.showGraphTooltip = function(evt, index, circleElem) {
    const config = window.activeGraphConfig;
    const point = config.data[index];

    // Find the specific SVG container we are hovering inside
    const svg = circleElem.closest('svg');
    const tooltip = svg.querySelector('.graph-tooltip');
    const tooltipBg = svg.querySelector('.tooltip-bg');
    const tooltipText = svg.querySelector('.tooltip-text');
    const tooltipXp = svg.querySelector('.tooltip-xp');
    const tooltipStat = svg.querySelector('.tooltip-stat');
    const tooltipRanksHeader = svg.querySelector('.tooltip-ranks-header');

    // Clear previously generated rank tspan elements
    while (tooltipRanksHeader.nextSibling) {
        tooltipText.removeChild(tooltipRanksHeader.nextSibling);
    }

    // Populate data
    tooltipXp.textContent = `${config.t.graphXAxis}: ${point.x.toLocaleString()}`;
    if (point.step > 0) {
        tooltipStat.textContent = `${config.statName}: +${point.y.toLocaleString()}`;
        tooltipStat.setAttribute('visibility', 'visible');
    } else {
        tooltipStat.setAttribute('visibility', 'hidden');
    }
    
    let rankLines = 0;
    Object.keys(point.ranks).forEach(charName => {
        const shortName = config.shortNames[charName] || charName;
        const rank = point.ranks[charName];
        
        const tspan = document.createElementNS("http://www.w3.org/2000/svg", "tspan");
        tspan.setAttribute("x", 15);
        tspan.setAttribute("dy", "1.2em");
        tspan.textContent = `${shortName}: ${rank}`;
        tooltipText.appendChild(tspan);
        
        rankLines++;
    });

    // Get the dimensions of the populated text to calculate the required size for the tooltip box.
    const textMetrics = tooltipText.getBBox();
    const padding = 10;

    // Calculate the new width. It's the text's starting X position, plus its calculated width, plus padding.
    const newWidth = textMetrics.x + textMetrics.width + padding;
    tooltipBg.setAttribute('width', newWidth);

    // Calculate the new height. This is more robust than counting lines with magic numbers.
    const newHeight = textMetrics.y + textMetrics.height + padding;
    tooltipBg.setAttribute('height', newHeight);

    // Calculate position
    const pointX = evt.target.cx.baseVal.value;
    let x = pointX + 15;
    let y = evt.target.cy.baseVal.value - (newHeight / 2);
    
    // Prevent clipping off the right edge of the graph, using the new dynamic width
    if (x + newWidth > config.graphWidth) {
        x = pointX - newWidth - 15;
    }

    tooltip.setAttribute('transform', `translate(${x}, ${y})`);
    tooltip.setAttribute('visibility', 'visible');
};

window.hideGraphTooltip = function(circleElem) {
    const svg = circleElem.closest('svg');
    if (!svg) return;
    const tooltip = svg.querySelector('.graph-tooltip');
    if (tooltip) {
        tooltip.setAttribute('visibility', 'hidden');
        // As a safeguard, also explicitly hide the stat line. This prevents it from
        // occasionally being "stuck" on screen if mouseout events fire in an unusual order.
        const tooltipStat = svg.querySelector('.tooltip-stat');
        if (tooltipStat) {
            tooltipStat.setAttribute('visibility', 'hidden');
        }
    }
};