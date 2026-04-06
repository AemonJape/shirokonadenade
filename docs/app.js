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

const LIKENESS_MAPPING_SR = {
    20 : 1,
    40 : 2,
    60 : 3,
    80 : 4
}

const LIKENESS_MAPPING_SSR = {
    120 : 2,
    180 : 3,
    240 : 4
}

// --- UTILS ---
function escapeHtml(unsafe) {
    return (unsafe || '').toString()
         .replace(/&/g, "&amp;")
         .replace(/</g, "&lt;")
         .replace(/>/g, "&gt;")
         .replace(/"/g, "&quot;")
         .replace(/'/g, "&#039;");
}

let database = null;
let uiTranslations = null;
let globalGiftNames = null;
let currentMode = 'roadmap'; // 'roadmap' or 'stats'

// --- 0. LOCALIZATION STATE & DICTIONARY ---
let currentLang = 'kr';

// Function to update all static HTML text
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
// Fetch the JSON files when the page loads
Promise.all([
    fetch('bond_data.json').then(response => response.json()),
    fetch('translations.json').then(response => response.json())
])
.then(([bondData, transData]) => {
    database = bondData.base_characters;
    globalGiftNames = bondData.gift_names;
    uiTranslations = transData;
    
    setupModeToggle();
    updateStaticUI();
    populateBaseDropdown();
})
.catch(error => console.error("Error loading JSON data:", error));

// --- MODE TOGGLE LOGIC ---
function setupModeToggle() {
    const baseCharSelect = document.getElementById('baseCharSelect');
    if (!baseCharSelect) return;
    const container = baseCharSelect.parentNode;

    const modeToggleContainer = document.createElement('div');
    modeToggleContainer.id = 'appModeToggle';
    modeToggleContainer.style.display = 'flex';
    modeToggleContainer.style.gap = '10px';
    modeToggleContainer.style.marginBottom = '20px';
    modeToggleContainer.style.background = 'var(--bg-color, rgba(0,0,0,0.1))';
    modeToggleContainer.style.padding = '8px';
    modeToggleContainer.style.borderRadius = '8px';

    modeToggleContainer.innerHTML = `
        <button id="btnModeRoadmap" class="btn-inline" style="flex: 1; padding: 10px; border-radius: 6px; border: none; font-weight: bold; background-color: #007bff; color: white;" data-i18n="modeRoadmap">${uiTranslations[currentLang].modeRoadmap}</button>
        <button id="btnModeStats" class="btn-inline" style="flex: 1; padding: 10px; border-radius: 6px; border: none; background-color: transparent; color: inherit;" data-i18n="modeStats">${uiTranslations[currentLang].modeStats}</button>
    `;

    container.parentNode.insertBefore(modeToggleContainer, container);

    document.getElementById('btnModeRoadmap').addEventListener('click', () => switchMode('roadmap'));
    document.getElementById('btnModeStats').addEventListener('click', () => switchMode('stats'));
}

function switchMode(mode) {
    currentMode = mode;
    const btnRoadmap = document.getElementById('btnModeRoadmap');
    const btnStats = document.getElementById('btnModeStats');
    const calcBtn = document.getElementById('calcButton');
    let giftContainer = document.getElementById('giftMenuContainer');

    if (mode === 'roadmap') {
        btnRoadmap.style.backgroundColor = '#007bff';
        btnRoadmap.style.color = 'white';
        btnRoadmap.style.fontWeight = 'bold';
        btnStats.style.backgroundColor = 'transparent';
        btnStats.style.fontWeight = 'normal';

        if (calcBtn) calcBtn.style.display = document.getElementById('baseCharSelect').value ? 'inline-block' : 'none';
        if (giftContainer) giftContainer.style.display = 'none';
        
        document.getElementById('results').innerHTML = '';
    } else {
        btnStats.style.backgroundColor = '#007bff';
        btnStats.style.color = 'white';
        btnStats.style.fontWeight = 'bold';
        btnRoadmap.style.backgroundColor = 'transparent';
        btnRoadmap.style.fontWeight = 'normal';

        if (calcBtn) calcBtn.style.display = 'none';
        
        document.getElementById('results').innerHTML = '';
        
        if (document.getElementById('baseCharSelect').value) {
            renderGiftMenu();
        }
    }
}

// --- 2. UI EVENT LISTENERS ---
// When the user selects a character, generate the input fields
document.getElementById('baseCharSelect').addEventListener('change', (e) => {
    const selectedBase = e.target.value;
    const container = document.getElementById('altsContainer');
    const calcBtn = document.getElementById('calcButton');
    container.innerHTML = ''; // Clear previous fields

    if (!selectedBase) {
        if (calcBtn) calcBtn.style.display = 'none';
        let giftContainer = document.getElementById('giftMenuContainer');
        if (giftContainer) giftContainer.innerHTML = '';
        return;
    }

    const alts = database[selectedBase];
    const t = uiTranslations[currentLang];
    
    for (const altId in alts) {
        const student = alts[altId];
        
        // --- Generate bonus details HTML ---
        let bonusDetailsList = '';
        const statNameMap = {
            atk: t.statAtk,
            hp: t.statHp,
            healing: t.statHeal,
            def: t.statDef
        };

        for (let i = 0; i < BREAKPOINTS.length; i++) {
            const startRank = BREAKPOINTS[i];
            const endRank = (i < BREAKPOINTS.length - 1) ? BREAKPOINTS[i + 1] - 1 : 50;

            const gainsForRange = Object.keys(statNameMap)
                .map(statType => {
                    const gain = student.bonuses[statType]?.[i] || 0;
                    if (gain > 0) {
                        return `${statNameMap[statType]} +${gain}`;
                    }
                    return null;
                })
                .filter(Boolean);

            if (gainsForRange.length > 0) {
                const rankRangeStr = `${t.rank} ${startRank}${t.fromTo}${endRank}`;
                const gainsStr = gainsForRange.join(', ');
                bonusDetailsList += `<li><strong>${rankRangeStr} :</strong> ${gainsStr}</li>`;
            }
        }
        
        let bonusDetailsHtml = '';
        if (bonusDetailsList) {
            bonusDetailsHtml = `
                <details class="bond-bonus-details" style="margin-top: 10px; font-size: 0.9em;">
                    <summary style="cursor: pointer;">${t.viewBonuses}</summary>
                    <ul style="margin-top: 5px; padding-left: 20px;">${bonusDetailsList}</ul>
                </details>
            `;
        }

        // Build a card for each alt using a template literal
        const cardHtml = `
            <div class="alt-card">
                <label>
                    <span style="display: inline-flex; align-items: center; white-space: nowrap;">
                        <strong>${escapeHtml(student.names.full[currentLang])}</strong>
                        <span id="include-status-${altId}" style="font-size: 0.8em; color: #888; margin-left: 8px;">(${t.include})</span>
                        <input type="checkbox" class="alt-toggle" data-id="${altId}" checked style="margin: 0 0 0 5px;">
                    </span>
                </label>
                <div style="margin-top: 8px; display: flex; gap: 15px; align-items: flex-end;">
                    <div style="flex: 1;">
                        <label for="rank-${altId}">${t.currentRank}</label>
                        <input type="number" class="alt-rank" id="rank-${altId}" value="1" min="1" max="49">
                    </div>
                    <div style="flex: 1; position: relative;">
                        <label for="xp-${altId}" style="display: inline-block;">${t.currentXp}</label>
                        <span style="cursor: pointer; margin-left: 4px;" onclick="const popup = this.nextElementSibling; document.querySelectorAll('.xp-info-popup').forEach(el => { if(el !== popup) el.style.display = 'none'; }); popup.style.display = popup.style.display === 'none' ? 'block' : 'none'; event.stopPropagation();">🛈</span>
                        <div class="xp-info-popup" style="display: none; position: absolute; bottom: 100%; left: 0; margin-bottom: 5px; background: var(--bg-color, #1e1e2e); border: 1px solid #45475a; padding: 10px; border-radius: 6px; width: 230px; z-index: 1000; box-shadow: 0 4px 8px rgba(0,0,0,0.5); font-size: 0.85em; font-weight: normal; line-height: 1.4; color: var(--text-color, #cdd6f4);" onclick="event.stopPropagation();">
                            ${t.xpInfoHover}
                        </div>
                        <input type="number" class="alt-xp" id="xp-${altId}" value="0" min="0">
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
                ${bonusDetailsHtml}
            </div>
        `;
        container.innerHTML += cardHtml;
    }
    
    if (currentMode === 'roadmap') {
        if (calcBtn) calcBtn.style.display = 'inline-block';
        let giftContainer = document.getElementById('giftMenuContainer');
        if (giftContainer) giftContainer.style.display = 'none';
    } else {
        if (calcBtn) calcBtn.style.display = 'none';
        renderGiftMenu();
    }
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
        
        if (currentMode === 'stats') {
            renderGiftMenu();
        }
    }
});

// Close popups when clicking anywhere outside of them
document.addEventListener('click', () => {
    document.querySelectorAll('.xp-info-popup').forEach(el => el.style.display = 'none');
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

function getProgression(startRank, targetRank, statArray, currentXp = 0) {
    let totalXp = 0;
    let totalStat = 0;
    for (let r = startRank + 1; r <= targetRank; r++) {
        totalXp += xpCostToNext[r];
        totalStat += statArray[r];
    }
    totalXp = Math.max(0, totalXp - currentXp); // Subtract existing XP towards next level
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
        const currentXp = parseInt(document.getElementById(`xp-${altId}`).value) || 0;
        const stars = parseInt(document.getElementById(`stars-${altId}`).value);
        const maxRankForAlt = STAR_RANK_MAP[stars];
        const compactStats = database[selectedBase][altId].bonuses[targetStat];
        
        activeAlts.push({
            name: database[selectedBase][altId].names.full[currentLang],
            shortName: database[selectedBase][altId].names.short[currentLang],
            currentRank: currentRank,
            currentXp: currentXp,
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
        <pre>${escapeHtml(summaryText)}</pre>
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
    // Create a deep copy to avoid mutating the original array during simulation.
    let simulatedAlts = JSON.parse(JSON.stringify(alts));
    let roadmap = [];
    let totalXpSpent = 0;
    let totalStatGained = 0;

    // Helper to find the single most efficient next milestone for one character.
    const findBestMilestoneForAlt = (alt) => {
        if (alt.currentRank >= alt.maxRank) return null;

        let bestMilestone = {
            efficiency: -1,
            targetRank: -1,
            cost: 0,
            gain: 0
        };

        // Find the most efficient future milestone for THIS character
        for (let target = alt.currentRank + 1; target <= alt.maxRank; target++) {
            const path = getProgression(alt.currentRank, target, alt.statArray, alt.currentXp);

            if (path.cost > 0) {
                const efficiency = path.gain / path.cost;
                let isBetter = false;

                // Use a small epsilon for floating point comparison
                const epsilon = 0.0001;
                if (efficiency > bestMilestone.efficiency + epsilon) {
                    isBetter = true;
                } else if (Math.abs(efficiency - bestMilestone.efficiency) <= epsilon) {
                    // If efficiency is identical, prefer the cheaper upgrade
                    if (path.cost < bestMilestone.cost || bestMilestone.cost === 0) {
                        isBetter = true;
                    }
                }

                if (isBetter) {
                    bestMilestone = {
                        efficiency: efficiency,
                        targetRank: target,
                        cost: path.cost,
                        gain: path.gain
                    };
                }
            }
        }

        return bestMilestone.targetRank !== -1 ? bestMilestone : null;
    };

    // Keep finding the best next step until all characters are at their max rank.
    while (true) {
        const possibleUpgrades = simulatedAlts.map((alt, index) => {
            const milestone = findBestMilestoneForAlt(alt);
            if (!milestone) return null;

            // Combine character data with the milestone data
            return {
                ...milestone,
                altIndex: index,
                name: alt.name,
                shortName: alt.shortName,
                startRank: alt.currentRank,
            };
        }).filter(Boolean); // Remove nulls for characters who are maxed out

        // If no upgrades are possible, we're done.
        if (possibleUpgrades.length === 0) break;

        // Sort to find the best overall upgrade: highest efficiency, then lowest cost.
        possibleUpgrades.sort((a, b) => {
            if (Math.abs(a.efficiency - b.efficiency) > 0.0001) {
                return b.efficiency - a.efficiency; // Higher efficiency first
            }
            return a.cost - b.cost; // Lower cost first
        });

        const bestNextStep = possibleUpgrades[0];

        // 1. Record the winning step.
        roadmap.push(bestNextStep);
        totalXpSpent += bestNextStep.cost;
        totalStatGained += bestNextStep.gain;

        // 2. Apply the simulated level-up for the next iteration.
        simulatedAlts[bestNextStep.altIndex].currentRank = bestNextStep.targetRank;
        simulatedAlts[bestNextStep.altIndex].currentXp = 0; // Reset XP towards next level after a level up
    }

    return {
        steps: roadmap,
        totalCost: totalXpSpent,
        totalGain: totalStatGained
    };
}

/**
 * Renders the inline menu to input owned gifts directly into the page.
 */
function renderGiftMenu() {
    if (currentMode !== 'stats') return;

    let container = document.getElementById('giftMenuContainer');
    if (!container) {
        container = document.createElement('div');
        container.id = 'giftMenuContainer';
        container.style.marginTop = '20px';
        const altsContainer = document.getElementById('altsContainer');
        altsContainer.parentNode.insertBefore(container, altsContainer.nextSibling);
    }
    
    // Preserve previous input values to avoid resetting as user modifies toggles
    let previousInputs = {};
    if (container.innerHTML !== '') {
        container.querySelectorAll('input[type="number"]').forEach(input => {
            previousInputs[input.id] = input.value;
        });
    }

    container.style.display = 'block';

    const selectedBase = document.getElementById('baseCharSelect').value;
    const activeToggles = document.querySelectorAll('.alt-toggle:checked');
    const t = uiTranslations[currentLang];

    if (activeToggles.length === 0) {
        container.innerHTML = '';
        if (window.giftMenuInterval) clearInterval(window.giftMenuInterval);
        return;
    }

    let viewMode = localStorage.getItem('shirokoGiftViewMode') || 'detailed';
    const isCompact = viewMode === 'compact';
    const isKeystoneInfinite = localStorage.getItem('shirokoInfiniteKeystones') === 'true';

    // Get all SR gifts
    let allSr = globalGiftNames.sr.map((giftObj, index) => {
        let maxPref = 20;
        let likenessSet = new Set();
        activeToggles.forEach(toggle => {
            const altId = toggle.getAttribute('data-id');
            const pref = database[selectedBase][altId].gifts.sr[index];
            if (pref > maxPref) maxPref = pref;
            likenessSet.add(LIKENESS_MAPPING_SR[pref] || 1);
        });
        return { giftObj, index, maxPref, likenesses: Array.from(likenessSet).sort((a, b) => b - a) };
    });

    // Get all SSR gifts
    let allSsr = globalGiftNames.ssr.map((giftObj, index) => {
        let maxPref = 120;
        let likenessSet = new Set();
        activeToggles.forEach(toggle => {
            const altId = toggle.getAttribute('data-id');
            const pref = database[selectedBase][altId].gifts.ssr[index];
            if (pref > maxPref) maxPref = pref;
            likenessSet.add(LIKENESS_MAPPING_SSR[pref] || 2);
        });
        return { giftObj, index, maxPref, likenesses: Array.from(likenessSet).sort((a, b) => b - a) };
    });

    let renderSr = isCompact ? allSr.filter(g => g.maxPref > 20).sort((a, b) => b.maxPref - a.maxPref) : allSr;
    let renderSsr = isCompact ? allSsr.filter(g => g.maxPref > 120).sort((a, b) => b.maxPref - a.maxPref) : allSsr;

    // Calculate max SR likeness for the Gift Choice Box
    let choiceBoxLikenessSet = new Set();
    activeToggles.forEach(toggle => {
        const altId = toggle.getAttribute('data-id');
        const srGifts = database[selectedBase][altId].gifts.sr;
        const maxSrPref = srGifts.length > 0 ? Math.max(...srGifts) : 20;
        choiceBoxLikenessSet.add(LIKENESS_MAPPING_SR[maxSrPref] || 1);
    });
    const choiceBoxLikenesses = Array.from(choiceBoxLikenessSet).sort((a, b) => b - a);
    const choiceBoxIconsHtml = choiceBoxLikenesses.map(l => `<img src="images/gift_${l}.png" style="width: 16px; height: 16px; margin-left: 2px;" alt="L${l}">`).join('');

    // Get the IDs of the "other" gifts for the rotating icons
    const otherSsrIds = allSsr.filter(g => g.maxPref <= 120).map(g => g.giftObj.id);
    const otherSrIds = allSr.filter(g => g.maxPref <= 20).map(g => g.giftObj.id);

    // Read from localStorage once
    let savedInventory = {};
    try {
        savedInventory = JSON.parse(localStorage.getItem('shirokoGiftInventory')) || {};
    } catch (e) {}

    // Merge previousInputs into savedInventory so hot-reloads keep unsaved session state (if any)
    Object.assign(savedInventory, previousInputs);

    // Generate Inline HTML
    let html = `
    <div class="gift-inline-section" style="background: var(--bg-color, rgba(0,0,0,0.2)); color: var(--text-color, inherit); padding: 20px; border-radius: 8px; border: 1px solid #45475a; margin-top: 15px; margin-bottom: 20px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
            <h3 style="margin: 0;">${t.giftMenuTitle}</h3>
            <label style="display: flex; align-items: center; cursor: pointer; font-size: 0.9em; font-weight: normal; user-select: none; white-space: nowrap;">
                ${t.giftViewCompactToggle}
                <input type="checkbox" id="giftViewToggle" ${isCompact ? 'checked' : ''} style="margin-right: 6px;">
            </label>
        </div>`;

    if (renderSsr.length > 0 || renderSr.length > 0) {
        html += `<div style="margin-bottom: 15px;">`;
        renderSsr.forEach(item => {
            const iconsHtml = item.likenesses.map(l => `<img src="images/gift_${l}.png" style="width: 16px; height: 16px; margin-left: 2px;" alt="L${l}">`).join('');
            html += `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                <div style="display: flex; align-items: center;">
                    <img src="images/${encodeURIComponent(item.giftObj.id)}.webp" style="width: 32px; height: 32px; object-fit: contain; background-color: #8b5cf6; border-radius: 4px; margin-right: 10px; padding: 2px;" alt="${escapeHtml(item.giftObj[currentLang])}">
                    <span>${escapeHtml(item.giftObj[currentLang])}</span>
                    <div style="margin-left: 6px; display: flex;">${iconsHtml}</div>
                </div>
                <input type="number" min="0" value="0" id="gift-ssr-${item.index}" style="width: 60px; padding: 4px; border-radius: 4px;">
            </div>`;
        });
        renderSr.forEach(item => {
            const iconsHtml = item.likenesses.map(l => `<img src="images/gift_${l}.png" style="width: 16px; height: 16px; margin-left: 2px;" alt="L${l}">`).join('');
            html += `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                <div style="display: flex; align-items: center;">
                    <img src="images/${encodeURIComponent(item.giftObj.id)}.webp" style="width: 32px; height: 32px; object-fit: contain; background-color: #eab308; border-radius: 4px; margin-right: 10px; padding: 2px;" alt="${escapeHtml(item.giftObj[currentLang])}">
                    <span>${escapeHtml(item.giftObj[currentLang])}</span>
                    <div style="margin-left: 6px; display: flex;">${iconsHtml}</div>
                </div>
                <input type="number" min="0" value="0" id="gift-sr-${item.index}" style="width: 60px; padding: 4px; border-radius: 4px;">
            </div>`;
        });
        html += `</div>`;
    }

    const hasOtherSsr = isCompact && (renderSsr.length < allSsr.length);
    const hasOtherSr = isCompact && (renderSr.length < allSr.length);

    if (renderSsr.length > 0 || renderSr.length > 0) {
        html += `<hr style="border-top: 1px solid #45475a; margin: 15px 0;">`;
    }

    html += `<div style="margin-bottom: 15px;">`;

    if (hasOtherSsr) {
        html += `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                <div style="display: flex; align-items: center;">
                    <img id="img-other-ssr" src="images/${encodeURIComponent(otherSsrIds[0])}.webp" style="width: 32px; height: 32px; object-fit: contain; background-color: #8b5cf6; border-radius: 4px; margin-right: 10px; padding: 2px;" alt="${t.otherSsrGifts}">
                    <span>${t.otherSsrGifts}</span>
                    <div style="margin-left: 6px; display: flex;"><img src="images/gift_2.png" style="width: 16px; height: 16px; margin-left: 2px;" alt="L2"></div>
                </div>
                <input type="number" min="0" value="0" id="gift-other-ssr" style="width: 60px; padding: 4px; border-radius: 4px;">
            </div>`;
    }
        
    if (hasOtherSr) {
        html += `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                <div style="display: flex; align-items: center;">
                    <img id="img-other-sr" src="images/${encodeURIComponent(otherSrIds[0])}.webp" style="width: 32px; height: 32px; object-fit: contain; background-color: #eab308; border-radius: 4px; margin-right: 10px; padding: 2px;" alt="${t.otherSrGifts}">
                    <span>${t.otherSrGifts}</span>
                    <div style="margin-left: 6px; display: flex;">
                        <img src="images/gift_1.png" style="width: 16px; height: 16px; margin-left: 2px;" alt="L1">
                        <img src="images/${encodeURIComponent('선물 선택 상자')}.webp" style="width: 16px; height: 16px; margin-left: 2px; object-fit: contain;" alt="${t.giftChoiceBox}">
                    </div>
                </div>
                <input type="number" min="0" value="0" id="gift-other-sr" style="width: 60px; padding: 4px; border-radius: 4px;">
            </div>`;
    }

    if (hasOtherSsr || hasOtherSr) {
        html += `<hr style="border-top: 1px solid #45475a; margin: 15px 0;">`;
    }

    html += `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                <div style="display: flex; align-items: center;">
                    <img id="img-beautiful-bouquet" src="images/${encodeURIComponent('아름다운 꽃다발0')}.webp" style="width: 32px; height: 32px; object-fit: contain; background-color: #8b5cf6; border-radius: 4px; margin-right: 10px; padding: 2px;" alt="${t.beautifulBouquet}">
                    <span>${t.beautifulBouquet}</span>
                    <div style="margin-left: 6px; display: flex;"><img src="images/gift_4.png" style="width: 16px; height: 16px; margin-left: 2px;" alt="L4"></div>
                </div>
                <input type="number" min="0" value="0" id="gift-beautiful-bouquet" style="width: 60px; padding: 4px; border-radius: 4px;">
            </div>
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                <div style="display: flex; align-items: center;">
                    <img id="img-shiny-bouquet" src="images/${encodeURIComponent('반짝이는 꽃다발0')}.webp" style="width: 32px; height: 32px; object-fit: contain; background-color: #8b5cf6; border-radius: 4px; margin-right: 10px; padding: 2px;" alt="${t.shinyBouquet}">
                    <span>${t.shinyBouquet}</span>
                    <div style="margin-left: 6px; display: flex;"><img src="images/gift_2.png" style="width: 16px; height: 16px; margin-left: 2px;" alt="L2"></div>
                </div>
                <input type="number" min="0" value="0" id="gift-shiny-bouquet" style="width: 60px; padding: 4px; border-radius: 4px;">
            </div>
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                <div style="display: flex; align-items: center;">
                    <img src="images/${encodeURIComponent('상급 합성용 기동석')}.webp" style="width: 32px; height: 32px; object-fit: contain; background-color: #eab308; border-radius: 4px; margin-right: 10px; padding: 2px;" alt="${t.advancedFusionKeystone}">
                    <span>${t.advancedFusionKeystone}</span>
                </div>
                <div style="display: flex; align-items: center;">
                    <label style="display: flex; align-items: center; cursor: pointer; font-size: 0.85em; margin-right: 8px; user-select: none; white-space: nowrap;">
                        ${t.infiniteKeystones}
                        <input type="checkbox" id="toggle-infinite-keystone" ${isKeystoneInfinite ? 'checked' : ''} style="margin-right: 4px;">
                    </label>
                    <input type="number" min="0" value="0" id="gift-fusion-keystone" style="width: 60px; padding: 4px; border-radius: 4px;" ${isKeystoneInfinite ? 'disabled' : ''}>
                </div>
            </div>
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                <div style="display: flex; align-items: center;">
                    <img src="images/${encodeURIComponent('선물 선택 상자')}.webp" style="width: 32px; height: 32px; object-fit: contain; background-color: #eab308; border-radius: 4px; margin-right: 10px; padding: 2px;" alt="${t.giftChoiceBox}">
                    <span>${t.giftChoiceBox}</span>
                    <div style="margin-left: 6px; display: flex;">${choiceBoxIconsHtml}</div>
                </div>
                <input type="number" min="0" value="0" id="gift-choice-box" style="width: 60px; padding: 4px; border-radius: 4px;">
            </div>
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                <div style="display: flex; align-items: center;">
                    <img src="images/${encodeURIComponent('카페 쓰담쓰담')}.png" style="width: 32px; height: 32px; object-fit: contain; border-radius: 4px; margin-right: 10px; padding: 2px;" alt="${t.cafeHeadpat}">
                    <span>${t.cafeHeadpat}</span>
                </div>
                <input type="number" min="0" value="0" id="gift-cafe-headpat" style="width: 60px; padding: 4px; border-radius: 4px;">
            </div>
        </div>
    </div>`;

    html += `
        <div style="margin-top: 20px; display: flex; gap: 10px;">
            <button id="clearGiftsBtn" class="btn-inline" style="flex: 1; padding: 12px; font-size: 1.1em; border-radius: 6px; border: 1px solid #45475a; background: var(--bg-color, rgba(0,0,0,0.2)); color: var(--text-color, inherit); font-weight: bold; cursor: pointer;">${t.clearGiftsBtn}</button>
            <button id="runBudgetCalc" class="btn-inline" style="flex: 2; background-color: #007bff; color: white; padding: 12px; font-size: 1.1em; border-radius: 6px; border: none; font-weight: bold; cursor: pointer;">${t.calcBtnModal}</button>
        </div>
    </div>`;

    container.innerHTML = html;

    // Restore previous input values and attach save listeners
    container.querySelectorAll('input[type="number"]').forEach(input => {
        if (savedInventory[input.id] !== undefined) {
            input.value = savedInventory[input.id];
        }
        input.addEventListener('input', (e) => {
            let currentInv = {};
            try { currentInv = JSON.parse(localStorage.getItem('shirokoGiftInventory')) || {}; } catch(err) {}
            currentInv[e.target.id] = e.target.value;
            localStorage.setItem('shirokoGiftInventory', JSON.stringify(currentInv));
        });
    });

    const viewToggle = document.getElementById('giftViewToggle');
    if (viewToggle) {
        viewToggle.addEventListener('change', (e) => {
            localStorage.setItem('shirokoGiftViewMode', e.target.checked ? 'compact' : 'detailed');
            renderGiftMenu();
        });
    }

    const infKeystoneToggle = document.getElementById('toggle-infinite-keystone');
    if (infKeystoneToggle) {
        infKeystoneToggle.addEventListener('change', (e) => {
            localStorage.setItem('shirokoInfiniteKeystones', e.target.checked);
            const keystoneInput = document.getElementById('gift-fusion-keystone');
            if (keystoneInput) {
                keystoneInput.disabled = e.target.checked;
            }
        });
    }

    const clearBtn = document.getElementById('clearGiftsBtn');
    if (clearBtn) {
        clearBtn.addEventListener('click', () => {
            container.querySelectorAll('input[type="number"]').forEach(input => {
                input.value = 0;
                input.dispatchEvent(new Event('input')); // Triggers localStorage save
            });
        });
    }
    
    // Setup Image Rotation Animation
    let animIdx = 0;
    if (window.giftMenuInterval) clearInterval(window.giftMenuInterval);
    
    window.giftMenuInterval = setInterval(() => {
        animIdx++;
        
        const imgBeautiful = document.getElementById('img-beautiful-bouquet');
        if (imgBeautiful) imgBeautiful.src = `images/${encodeURIComponent('아름다운 꽃다발' + (animIdx % 2))}.webp`;
        
        const imgShiny = document.getElementById('img-shiny-bouquet');
        if (imgShiny) imgShiny.src = `images/${encodeURIComponent('반짝이는 꽃다발' + (animIdx % 2))}.webp`;
        
        const imgOtherSsr = document.getElementById('img-other-ssr');
        if (imgOtherSsr && otherSsrIds.length > 0) imgOtherSsr.src = `images/${encodeURIComponent(otherSsrIds[animIdx % otherSsrIds.length])}.webp`;
        
        const imgOtherSr = document.getElementById('img-other-sr');
        if (imgOtherSr && otherSrIds.length > 0) imgOtherSr.src = `images/${encodeURIComponent(otherSrIds[animIdx % otherSrIds.length])}.webp`;
    }, 1500); // Rotate every 1.5 seconds

    document.getElementById('runBudgetCalc').addEventListener('click', calculateBudgetStats);
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
                    <strong>${escapeHtml(opt.name)}:</strong> ${t.rank} ${opt.startRank} ➡ <strong>${t.rank} ${opt.targetRank}</strong>
                    <div class="meta">${opt.cost} XP | ${statName} +${opt.gain} | ${t.efficiency} ${(opt.efficiency * 1000).toFixed(2)}/1k&nbsp;XP</div>
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
                    <h4>${t.step} ${currentStepNum}: ${escapeHtml(step.name)}</h4>
                    <div class="details">
                        ${t.levelUpFrom} ${t.rank} ${step.startRank} ➡ <strong>${t.rank} ${step.targetRank}</strong>
                    </div>
                    <div class="meta">
                        ${step.cost} XP | ${statName} +${step.gain} | ${t.efficiency} ${(step.efficiency * 1000).toFixed(2)}/1k&nbsp;XP
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
 * Calculates the maximum stat gain from a given inventory of gifts.
 */
function calculateBudgetStats() {
    // 1. GATHER DATA
    const targetStat = document.getElementById('statSelect').value;
    const activeToggles = document.querySelectorAll('.alt-toggle:checked');
    const selectedBase = document.getElementById('baseCharSelect').value;
    const t = uiTranslations[currentLang];
    const statKeyMap = { atk: 'statAtk', hp: 'statHp', healing: 'statHeal', def: 'statDef' };
    const statName = t[statKeyMap[targetStat]];

    if (activeToggles.length === 0) {
        alert(t.alertNoChars);
        return;
    }

    let initialAlts = [];
    activeToggles.forEach(toggle => {
        const altId = toggle.getAttribute('data-id');
        const compactStats = database[selectedBase][altId].bonuses[targetStat];
        initialAlts.push({
            name: database[selectedBase][altId].names.full[currentLang],
            rank: parseInt(document.getElementById(`rank-${altId}`).value),
            xp: parseInt(document.getElementById(`xp-${altId}`).value) || 0,
            maxRank: STAR_RANK_MAP[parseInt(document.getElementById(`stars-${altId}`).value)],
            gifts: database[selectedBase][altId].gifts,
            statArray: expandStatData(compactStats)
        });
    });
    let simulatedAlts = JSON.parse(JSON.stringify(initialAlts));

    const originalInventory = {};
    document.querySelectorAll('#giftMenuContainer input[type="number"]').forEach(input => {
        originalInventory[input.id] = parseInt(input.value) || 0;
    });
    const simulatedInventory = { ...originalInventory };


    function getGiftXp(student, giftKey) {
        if (giftKey === 'gift-beautiful-bouquet') return 240;
        if (giftKey === 'gift-shiny-bouquet') return 120;
        if (giftKey === 'gift-other-ssr') return 120;
        if (giftKey === 'gift-choice-box') return student.gifts.sr.length > 0 ? Math.max(20, ...student.gifts.sr) : 20;
        if (giftKey === 'gift-other-sr') return 20;
        if (giftKey === 'gift-cafe-headpat') return 15;
        if (giftKey.startsWith('gift-ssr-')) return student.gifts.ssr[parseInt(giftKey.replace('gift-ssr-', ''))] || 120;
        if (giftKey.startsWith('gift-sr-')) return student.gifts.sr[parseInt(giftKey.replace('gift-sr-', ''))] || 20;
        return 0;
    }

    // 3. FAST PATH: CHECK IF WE CAN JUST MAX EVERYONE GREEDILY
    let greedyAlts = JSON.parse(JSON.stringify(initialAlts));
    let greedyInv = { ...simulatedInventory };
    let greedySuccess = false;

    function getXpNeededToMax(student) {
        let needed = -student.xp;
        for (let r = student.rank + 1; r <= student.maxRank; r++) {
            needed += xpCostToNext[r];
        }
        return Math.max(0, needed);
    }

    while (true) {
        let allMaxed = true;
        let bestScore = -1;
        let bestStudentIdx = -1;
        let bestGiftKey = null;

        for (let i = 0; i < greedyAlts.length; i++) {
            let needed = getXpNeededToMax(greedyAlts[i]);
            if (needed > 0) {
                allMaxed = false; // We found at least one student who still needs XP
                for (let key in greedyInv) {
                    if (greedyInv[key] > 0 && key !== 'gift-fusion-keystone') {
                        let xp = getGiftXp(greedyAlts[i], key);
                        if (xp > 0) {
                            // The score is the amount of *useful* XP. 
                            // It caps out at the total XP the student needs to reach max rank.
                            let score = Math.min(xp, needed);
                            
                            if (score > bestScore) {
                                bestScore = score;
                                bestStudentIdx = i;
                                bestGiftKey = key;
                            } else if (score === bestScore) {
                                // Tie-breaker: If two gifts provide the same amount of useful XP, 
                                // prefer the one with the *lowest* base XP value.
                                // E.g., if a student needs 15 XP, both a 20 XP gift and a 240 XP gift 
                                // score a 15. We pick the 20 XP gift to minimize wasted XP.
                                let currentBestXp = getGiftXp(greedyAlts[bestStudentIdx], bestGiftKey);
                                if (xp < currentBestXp) {
                                    bestStudentIdx = i;
                                    bestGiftKey = key;
                                }
                            }
                        }
                    }
                }
            }
        }

        // If everyone reached their max rank, the fast path succeeded!
        if (allMaxed) {
            greedySuccess = true;
            break;
        }

        // If there are still students who need XP, but we ran out of useful gifts
        if (bestStudentIdx === -1 || !bestGiftKey) {
            break;
        }

        // Apply the chosen optimal gift for this iteration
        greedyInv[bestGiftKey]--;
        let target = greedyAlts[bestStudentIdx];
        target.usedGifts = target.usedGifts || {};
        target.usedGifts[bestGiftKey] = (target.usedGifts[bestGiftKey] || 0) + 1;
        
        let xpGain = getGiftXp(target, bestGiftKey);
        target.xp += xpGain;
        while (target.rank < target.maxRank && target.xp >= xpCostToNext[target.rank + 1]) {
            target.xp -= xpCostToNext[target.rank + 1];
            target.rank++;
        }
    }

    let totalStatGain = 0;
    let warningHtml = '';

    let greedyStatGain = 0;
    for (let i = 0; i < greedyAlts.length; i++) {
        let alt = greedyAlts[i];
        let orig = initialAlts[i];
        for (let r = orig.rank + 1; r <= alt.rank; r++) {
            greedyStatGain += alt.statArray[r];
        }
    }

    if (greedySuccess) {
        simulatedAlts = greedyAlts;
        totalStatGain = greedyStatGain;
    } else {
        // 4. FALLBACK: MAIN DP KNAPSACK CALCULATION
        let giftTypes = [];
        let initialInv = [];
        let groupDetails = [];

        let profileMap = new Map();
        for (let key in simulatedInventory) {
            if (simulatedInventory[key] > 0 && key !== 'gift-fusion-keystone') {
                // Generate XP pattern for this gift across all active students
                let xpArray = initialAlts.map(alt => getGiftXp(alt, key));
                if (xpArray.every(xp => xp === 0)) continue;

                let pattern = xpArray.join(',');
                if (!profileMap.has(pattern)) {
                    profileMap.set(pattern, { count: 0, keys: [], xpArray: xpArray });
                }
                let group = profileMap.get(pattern);
                group.count += simulatedInventory[key];
                group.keys.push({ key: key, amount: simulatedInventory[key] });
            }
        }

        for (let [pattern, group] of profileMap.entries()) {
            giftTypes.push(pattern);
            initialInv.push(group.count);
            groupDetails.push(group);
        }

        // Keystones are tracked separately — they're only used for on-the-fly crafting, never given directly.
        const isKeystoneInfinite = document.getElementById('toggle-infinite-keystone')?.checked;
        // For infinite keystones, cap at the maximum number of boxes that could ever be crafted
        // (i.e. total gift pairs available), so the DP state remains finite.
        const initialKeystones = isKeystoneInfinite
            ? Math.floor(initialInv.reduce((s, c) => s + c, 0) / 2)
            : (simulatedInventory['gift-fusion-keystone'] || 0);

        // Pre-compute gift priority order per student.
        // Gifts this student prefers most come first (positive diff = exclusive/more XP for this student),
        // then neutral gifts (diff = 0), then gifts other alts want more (negative diff).
        // For students whose best SR preference > 40 XP, a virtual "crafted choice box" entry is
        // inserted at the appropriate priority position. It costs 2 SR gifts that give ≤20 XP to
        // this student (craft materials) plus 1 keystone, and yields bestSrXp to this student.
        // Its effective diff = bestSrXp − 40, which positions it correctly relative to direct gifts.
        let studentGiftPriority = initialAlts.map((_, sIdx) => {
            let bestSrXp = initialAlts[sIdx].gifts.sr.length > 0
                ? Math.max(20, ...initialAlts[sIdx].gifts.sr) : 20;

            let directGifts = groupDetails
                .map((group, gIdx) => {
                    let myXp = group.xpArray[sIdx];
                    if (myXp <= 0) return null;
                    let maxOtherXp = initialAlts.reduce(
                        (max, _, i) => i !== sIdx ? Math.max(max, group.xpArray[i]) : max, 0);
                    return { type: 'direct', gIdx, myXp, diff: myXp - maxOtherXp };
                })
                .filter(p => p !== null)
                .sort((a, b) => b.diff - a.diff || b.myXp - a.myXp);

            if (bestSrXp > 40 && initialKeystones > 0) {
                // Craft material groups: any gift where xp < bestSrXp for this student.
                // Mixed-XP pairs are handled by the two-pointer algorithm in computeCraftPlan.
                // e.g. with bestSrXp=80: a leftover +20 gift can pair with a +40 gift (60<80).
                let craftGroups = groupDetails
                    .map((group, gIdx) => {
                        if (group.keys.some(k => k.key === 'gift-cafe-headpat')) return null;
                        let myXp = group.xpArray[sIdx];
                        if (myXp <= 0 || myXp >= bestSrXp) return null;
                        let maxOtherXp = initialAlts.reduce(
                            (max, _, i) => i !== sIdx ? Math.max(max, group.xpArray[i]) : max, 0);
                        return { gIdx, xp: myXp, maxOtherXp, diff: myXp - maxOtherXp };
                    })
                    .filter(p => p !== null);

                if (craftGroups.length > 0) {
                    let minCraftXp = Math.min(...craftGroups.map(g => g.xp));
                    // Only create the virtual entry if the cheapest self-pair is profitable
                    if (2 * minCraftXp < bestSrXp) {
                        let virtualDiff = bestSrXp - 2 * minCraftXp;
                        let virtualEntry = { type: 'crafted', myXp: bestSrXp, diff: virtualDiff, craftGroups };
                        // Place crafting after any direct gift that already gives bestSrXp (e.g. stock
                        // Gift Choice Boxes, named SR gifts with the max preference). Those are strictly
                        // better than crafting because they cost no additional craft materials.
                        let insertIdx = directGifts.findIndex(g => g.myXp < bestSrXp && g.diff < virtualDiff);
                        if (insertIdx === -1) directGifts.push(virtualEntry);
                        else directGifts.splice(insertIdx, 0, virtualEntry);
                    }
                }
            }

            return directGifts;
        });

        // Two-pointer maximum matching: pairs cheapest craft material with most-expensive-that-still-profits.
        // Handles mixed-XP pairs (e.g. one +20 + one +40 when bestSrXp=80) and single-group self-pairing.
        // Returns { boxes, deductions: Map<gIdx, count> } for up to `limit` boxes.
        function computeCraftPlan(craftGroups, inv, usedCounts, craftMaterialCounts, bestSrXp, limit) {
            let gs = craftGroups
                .map(m => ({
                    gIdx: m.gIdx,
                    xp: m.xp,
                    maxOtherXp: m.maxOtherXp,
                    avail: Math.max(0, (inv[m.gIdx] || 0)
                        - (usedCounts.get(m.gIdx) || 0)
                        - (craftMaterialCounts.get(m.gIdx) || 0))
                }))
                .filter(g => g.avail > 0)
                .sort((a, b) => a.xp - b.xp || a.maxOtherXp - b.maxOtherXp || a.gIdx - b.gIdx);

            const deductions = new Map();
            let boxesMade = 0;
            const avail = gs.map(g => g.avail);
            let L = 0, R = gs.length - 1;

            // Cross-pair items with strictly different xp values (e.g. +20 with +40 when bestSrXp=80).
            // Stop when L and R reach the same xp tier; same-xp groups are handled below via self-pairing.
            while (boxesMade < limit) {
                while (L < R && avail[L] === 0) L++;
                while (L < R && avail[R] === 0) R--;
                if (L >= R) break;
                if (gs[L].xp === gs[R].xp) break; // same xp: hand off to self-pairing

                if (gs[L].xp + gs[R].xp < bestSrXp) {
                    const pairs = Math.min(avail[L], avail[R], limit - boxesMade);
                    deductions.set(gs[L].gIdx, (deductions.get(gs[L].gIdx) || 0) + pairs);
                    deductions.set(gs[R].gIdx, (deductions.get(gs[R].gIdx) || 0) + pairs);
                    avail[L] -= pairs;
                    avail[R] -= pairs;
                    boxesMade += pairs;
                } else {
                    avail[R] = 0; // R is too expensive to pair with anything at L or cheaper
                }
            }

            // Self-pairing: each group pairs its own units with itself.
            // Process groups in ascending maxOtherXp order so gifts least valuable to other alts
            // are consumed first (e.g. plain Other SR before a Summer Tube that benefits an alt).
            let selfPairGs = gs
                .map((g, i) => ({ g, i }))
                .filter(({ g, i }) => avail[i] > 0 && 2 * g.xp < bestSrXp)
                .sort((a, b) => a.g.maxOtherXp - b.g.maxOtherXp || a.g.gIdx - b.g.gIdx);

            for (let { g, i } of selfPairGs) {
                if (boxesMade >= limit) break;
                const pairs = Math.min(Math.floor(avail[i] / 2), limit - boxesMade);
                if (pairs > 0) {
                    deductions.set(g.gIdx, (deductions.get(g.gIdx) || 0) + pairs * 2);
                    avail[i] -= pairs * 2;
                    boxesMade += pairs;
                }
            }

            return { boxes: boxesMade, deductions };
        }

        // Greedily pick gifts (and optionally craft choice boxes on-the-fly) to advance
        // student sIdx from (currentRank, currentXp) to targetRank.
        // Direct gifts are used in priority order; craft materials are consumed when the virtual
        // crafted-box entry is reached in that same ordering.
        // Returns { success, usedCounts, craftMaterialCounts, craftedBoxes, keystonesUsed }
        function greedyAdvance(sIdx, targetRank, inv, currentRank, currentXp, keystones) {
            let xpNeeded = -currentXp;
            for (let r = currentRank + 1; r <= targetRank; r++) xpNeeded += xpCostToNext[r];
            if (xpNeeded <= 0) return { success: true, usedCounts: new Map(), craftMaterialCounts: new Map(), craftedBoxes: 0, keystonesUsed: 0 };

            let usedCounts = new Map();
            let craftMaterialCounts = new Map();
            let craftedBoxes = 0;
            let keystonesUsed = 0;
            let xpGained = 0;

            for (let entry of studentGiftPriority[sIdx]) {
                if (xpGained >= xpNeeded) break;

                if (entry.type === 'direct') {
                    let available = (inv[entry.gIdx] || 0) - (usedCounts.get(entry.gIdx) || 0) - (craftMaterialCounts.get(entry.gIdx) || 0);
                    if (available <= 0) continue;
                    let use = Math.min(available, Math.ceil((xpNeeded - xpGained) / entry.myXp));
                    usedCounts.set(entry.gIdx, (usedCounts.get(entry.gIdx) || 0) + use);
                    xpGained += use * entry.myXp;
                } else { // 'crafted'
                    let keystonesLeft = keystones - keystonesUsed;
                    if (keystonesLeft <= 0) continue;
                    let boxesNeeded = Math.ceil((xpNeeded - xpGained) / entry.myXp);
                    let plan = computeCraftPlan(entry.craftGroups, inv, usedCounts, craftMaterialCounts, entry.myXp, Math.min(boxesNeeded, keystonesLeft));
                    if (plan.boxes <= 0) continue;
                    for (let [gIdx, count] of plan.deductions) {
                        craftMaterialCounts.set(gIdx, (craftMaterialCounts.get(gIdx) || 0) + count);
                    }
                    xpGained += plan.boxes * entry.myXp;
                    keystonesUsed += plan.boxes;
                    craftedBoxes += plan.boxes;
                }
            }

            if (xpGained < xpNeeded) return { success: false };
            return { success: true, usedCounts, craftMaterialCounts, craftedBoxes, keystonesUsed };
        }

        const memo = new Map();

        // DP State: (Student Index, Inventory Counts, Keystones Remaining)
        // For each student, decide which target rank to advance them to (or skip entirely).
        // Gift selection and on-the-fly crafting within each advancement is handled by greedyAdvance.
        function solve(sIdx, inv, keystones) {
            if (sIdx >= initialAlts.length) return { bestStat: 0, bestTargetRank: -1 };

            let key = sIdx + '|' + inv.join(',') + '|' + keystones;
            if (memo.has(key)) return memo.get(key);

            // Safety valve: prevent catastrophic memory usage
            if (memo.size > 1500000) return { bestStat: 0, bestTargetRank: initialAlts[sIdx].rank };

            let currentRank = initialAlts[sIdx].rank;
            let currentXp = initialAlts[sIdx].xp;

            // Option A: Skip this student entirely
            let skipResult = solve(sIdx + 1, inv, keystones);
            let bestStat = skipResult.bestStat;
            let bestTargetRank = currentRank;

            // Option B: Advance this student to each possible target rank (multiple ranks at once).
            // Since reaching rank R requires less XP than rank R+1, if we can't reach R we stop.
            for (let targetRank = currentRank + 1; targetRank <= initialAlts[sIdx].maxRank; targetRank++) {
                let advance = greedyAdvance(sIdx, targetRank, inv, currentRank, currentXp, keystones);
                if (!advance.success) break;

                let newInv = [...inv];
                for (let [gIdx, count] of advance.usedCounts) newInv[gIdx] -= count;
                for (let [gIdx, count] of advance.craftMaterialCounts) newInv[gIdx] -= count;
                let newKeystones = keystones - advance.keystonesUsed;

                let statGain = 0;
                for (let r = currentRank + 1; r <= targetRank; r++) statGain += initialAlts[sIdx].statArray[r];

                let res = solve(sIdx + 1, newInv, newKeystones);
                if (statGain + res.bestStat > bestStat) {
                    bestStat = statGain + res.bestStat;
                    bestTargetRank = targetRank;
                }
            }

            let result = { bestStat, bestTargetRank };
            memo.set(key, result);
            return result;
        }

        let finalResult = solve(0, initialInv, initialKeystones);

        let dpStatGain = finalResult.bestStat;
        let dpLimitReached = memo.size > 1500000;

        if (dpLimitReached && greedyStatGain > dpStatGain) {
            simulatedAlts = greedyAlts;
            totalStatGain = greedyStatGain;
            warningHtml = `<p style="color: #f38ba8; font-size: 0.9em; margin-bottom: 10px;">${t.complexityWarning}</p>`;
        } else {
            totalStatGain = dpStatGain;
            warningHtml = dpLimitReached ? `<p style="color: #f38ba8; font-size: 0.9em; margin-bottom: 10px;">${t.complexityWarning}</p>` : '';

            for (let i = 0; i < simulatedAlts.length; i++) {
                simulatedAlts[i].usedGifts = {};
            }

            let currInv = [...initialInv];
            let currKeystones = initialKeystones;
            let groupRemainingGifts = groupDetails.map(g => JSON.parse(JSON.stringify(g.keys)));

            for (let sIdx = 0; sIdx < initialAlts.length; sIdx++) {
                let key = sIdx + '|' + currInv.join(',') + '|' + currKeystones;
                let decision = memo.get(key);
                if (!decision || decision.bestTargetRank <= initialAlts[sIdx].rank) continue;

                let advance = greedyAdvance(sIdx, decision.bestTargetRank, currInv, initialAlts[sIdx].rank, initialAlts[sIdx].xp, currKeystones);
                if (!advance.success) break;

                // Direct gifts: deduct from inventory and record as named gifts for display
                for (let [gIdx, count] of advance.usedCounts) {
                    currInv[gIdx] -= count;
                    let remaining = count;
                    let availableGifts = groupRemainingGifts[gIdx];
                    for (let i = 0; i < availableGifts.length && remaining > 0; i++) {
                        let use = Math.min(availableGifts[i].amount, remaining);
                        if (use > 0) {
                            let specificGiftKey = availableGifts[i].key;
                            simulatedAlts[sIdx].usedGifts[specificGiftKey] = (simulatedAlts[sIdx].usedGifts[specificGiftKey] || 0) + use;
                            availableGifts[i].amount -= use;
                            remaining -= use;
                        }
                    }
                }

                // Craft materials: deduct from inventory and pool, record specific gift keys used
                simulatedAlts[sIdx].craftMaterials = simulatedAlts[sIdx].craftMaterials || {};
                for (let [gIdx, count] of advance.craftMaterialCounts) {
                    currInv[gIdx] -= count;
                    let remaining = count;
                    let availableGifts = groupRemainingGifts[gIdx];
                    for (let i = 0; i < availableGifts.length && remaining > 0; i++) {
                        let use = Math.min(availableGifts[i].amount, remaining);
                        if (use > 0) {
                            let specificGiftKey = availableGifts[i].key;
                            simulatedAlts[sIdx].craftMaterials[specificGiftKey] = (simulatedAlts[sIdx].craftMaterials[specificGiftKey] || 0) + use;
                            availableGifts[i].amount -= use;
                            remaining -= use;
                        }
                    }
                }
                if (advance.craftedBoxes > 0) {
                    simulatedAlts[sIdx].usedGifts['gift-choice-box'] = (simulatedAlts[sIdx].usedGifts['gift-choice-box'] || 0) + advance.craftedBoxes;
                }

                currKeystones -= advance.keystonesUsed;
                simulatedAlts[sIdx].rank = decision.bestTargetRank;
            }
        }
    }

    function getGiftName(giftKey) {
        if (giftKey === 'gift-beautiful-bouquet') return t.beautifulBouquet;
        if (giftKey === 'gift-shiny-bouquet') return t.shinyBouquet;
        if (giftKey === 'gift-other-ssr') return t.otherSsrGifts;
        if (giftKey === 'gift-choice-box') return t.giftChoiceBox;
        if (giftKey === 'gift-other-sr') return t.otherSrGifts;
        if (giftKey === 'gift-cafe-headpat') return t.cafeHeadpat;
        if (giftKey.startsWith('gift-ssr-')) return globalGiftNames.ssr[parseInt(giftKey.replace('gift-ssr-', ''))][currentLang];
        if (giftKey.startsWith('gift-sr-')) return globalGiftNames.sr[parseInt(giftKey.replace('gift-sr-', ''))][currentLang];
        return giftKey;
    }

    // Returns the gift-sr-{i} key that gives the most XP to this student, or null if no SR gift
    // stands out above the base 20 XP (i.e. the student has no preference).
    function getBestChoiceBoxTarget(alt) {
        if (!alt.gifts || !alt.gifts.sr || alt.gifts.sr.length === 0) return null;
        let bestXp = 20; // base threshold — only flag a preference if a gift beats this
        let bestIdx = -1;
        for (let i = 0; i < alt.gifts.sr.length; i++) {
            if (alt.gifts.sr[i] > bestXp) {
                bestXp = alt.gifts.sr[i];
                bestIdx = i;
            }
        }
        return bestIdx !== -1 ? 'gift-sr-' + bestIdx : null;
    }

    // 4. DISPLAY RESULTS
    let resultHtml = `
        <div style="padding: 10px; border: 1px solid #45475a; border-radius: 8px; margin-top: 20px;">
            <h3>${t.modeStats}</h3>
            ${warningHtml}
            <p style="font-size: 1.2em; margin-bottom: 15px;">
                ${t.totalStatGain.replace('{stat}', `<strong>${statName}</strong>`)} 
                <strong style="color: #58a6ff; font-size: 1.3em;">+${totalStatGain.toLocaleString()}</strong>
            </p>
            <hr style="border-top: 1px solid #45475a; margin: 15px 0;">
            <h4 style="margin-bottom: 10px;">${t.finalRanks}</h4>
            <ul style="list-style-type: none; padding-left: 0; margin: 0;">
    `;

    simulatedAlts.forEach((alt, i) => {
        const originalAlt = initialAlts[i];
        const rankChange = alt.rank - originalAlt.rank;
        
        let usedGiftsHtml = [];
        if (alt.usedGifts) {
            for (let [giftKey, count] of Object.entries(alt.usedGifts)) {
                let label = escapeHtml(getGiftName(giftKey));
                if (giftKey === 'gift-choice-box') {
                    let targetKey = getBestChoiceBoxTarget(alt);
                    if (targetKey) label += ` → ${escapeHtml(getGiftName(targetKey))}`;
                }
                usedGiftsHtml.push(`<span style="background: rgba(255, 255, 255, 0.1); padding: 2px 6px; border-radius: 4px;">${label} <strong style="color:#a6e3a1;">x${count}</strong></span>`);
            }
        }
        let giftsDisplay = usedGiftsHtml.length > 0 ? usedGiftsHtml.join('') : `<span style="color: #888; font-style: italic;">${t.noGiftsUsed}</span>`;

        let altStatGain = 0;
        for (let r = originalAlt.rank + 1; r <= alt.rank; r++) {
            altStatGain += alt.statArray[r];
        }
        const statGainHtml = altStatGain > 0 ? `<span style="color: #58a6ff; margin-left: 8px; font-size: 0.9em;">${statName} +${altStatGain}</span>` : '';

        resultHtml += `
            <li style="margin-bottom: 10px; padding: 10px; background: var(--bg-color, rgba(0,0,0,0.2)); border: 1px solid #45475a; border-radius: 6px;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                    <strong>${escapeHtml(alt.name)}</strong>
                    <span>
                        ${t.rank} ${originalAlt.rank} → <strong>${alt.rank}</strong>
                        ${statGainHtml}
                    </span>
                </div>
                <div style="font-size: 0.85em; display: flex; flex-wrap: wrap; gap: 8px;">
                    ${giftsDisplay}
                </div>
            </li>
        `;
    });

    resultHtml += `</ul>`;

    // Aggregate craft materials used across all alts
    const totalCraftMaterials = {};
    let totalCraftedBoxes = 0;
    simulatedAlts.forEach(alt => {
        if (alt.craftMaterials) {
            for (let [key, count] of Object.entries(alt.craftMaterials)) {
                totalCraftMaterials[key] = (totalCraftMaterials[key] || 0) + count;
            }
        }
        if (alt.usedGifts && alt.usedGifts['gift-choice-box']) {
            totalCraftedBoxes += alt.usedGifts['gift-choice-box'];
        }
    });
    const userChoiceBoxCount = originalInventory['gift-choice-box'] || 0;
    const boxesToCraft = Math.max(0, totalCraftedBoxes - userChoiceBoxCount);

    if (boxesToCraft > 0) {
        // Build material list from actual gift keys used as craft materials
        const materialsStr = Object.entries(totalCraftMaterials)
            .map(([key, count]) => `${escapeHtml(getGiftName(key))} ×${count}`)
            .join(', ');
        const noticeText = t.craftNotice
            .replace('{boxes}', boxesToCraft)
            .replace('{choiceBox}', t.giftChoiceBox)
            .replace('{materials}', materialsStr)
            .replace('{keystoneCount}', boxesToCraft)
            .replace('{keystone}', t.advancedFusionKeystone);
        resultHtml += `<div style="margin-top: 15px; padding: 10px; background: rgba(234, 179, 8, 0.1); border-left: 4px solid #eab308; border-radius: 4px; font-size: 0.9em; line-height: 1.4;">${noticeText}</div>`;
    }

    resultHtml += `</div>`;
    document.getElementById('results').innerHTML = resultHtml;
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