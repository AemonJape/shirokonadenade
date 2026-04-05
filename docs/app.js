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

let database = null;
let uiTranslations = null;
let globalGiftNames = null;

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
    updateStaticUI();
    populateBaseDropdown();

    // Add the new budget calculation button
    const calcBtn = document.getElementById('calcButton');
    if (calcBtn && !document.getElementById('calcBudgetBtn')) {
        const calcBudgetBtn = document.createElement('button');
        calcBudgetBtn.id = 'calcBudgetBtn';
        calcBudgetBtn.style.display = 'none';
        calcBudgetBtn.style.marginLeft = '10px';
        calcBudgetBtn.setAttribute('data-i18n', 'calcBudgetBtn');
        calcBtn.parentNode.insertBefore(calcBudgetBtn, calcBtn.nextSibling);
        
        updateStaticUI(); // Translate the newly added button
        calcBudgetBtn.addEventListener('click', openGiftMenu);
    }
})
.catch(error => console.error("Error loading JSON data:", error));

// --- 2. UI EVENT LISTENERS ---
// When the user selects a character, generate the input fields
document.getElementById('baseCharSelect').addEventListener('change', (e) => {
    const selectedBase = e.target.value;
    const container = document.getElementById('altsContainer');
    const calcBtn = document.getElementById('calcButton');
    const budgetBtn = document.getElementById('calcBudgetBtn');
    container.innerHTML = ''; // Clear previous fields

    if (!selectedBase) {
        calcBtn.style.display = 'none';
        if (budgetBtn) budgetBtn.style.display = 'none';
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
                ${bonusDetailsHtml}
            </div>
        `;
        container.innerHTML += cardHtml;
    }
    
    calcBtn.style.display = 'inline-block';
    if (budgetBtn) budgetBtn.style.display = 'inline-block';
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
            const path = getProgression(alt.currentRank, target, alt.statArray);

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
    }

    return {
        steps: roadmap,
        totalCost: totalXpSpent,
        totalGain: totalStatGained
    };
}

/**
 * Opens a modal to input owned gifts, separating preferred gifts from default ones.
 */
function openGiftMenu() {
    const selectedBase = document.getElementById('baseCharSelect').value;
    const activeToggles = document.querySelectorAll('.alt-toggle:checked');
    const t = uiTranslations[currentLang];

    if (activeToggles.length === 0) {
        alert(t.alertNoChars);
        return;
    }

    let prefSr = [];
    let prefSsr = [];

    // Find preferred SR gifts
    globalGiftNames.sr.forEach((giftObj, index) => {
        let maxPref = 20;
        let likenessSet = new Set();
        activeToggles.forEach(toggle => {
            const altId = toggle.getAttribute('data-id');
            const pref = database[selectedBase][altId].gifts.sr[index];
            if (pref > maxPref) maxPref = pref;
            likenessSet.add(LIKENESS_MAPPING_SR[pref] || 1);
        });
        if (maxPref > 20) prefSr.push({ giftObj, index, maxPref, likenesses: Array.from(likenessSet).sort((a, b) => b - a) });
    });

    // Find preferred SSR gifts
    globalGiftNames.ssr.forEach((giftObj, index) => {
        let maxPref = 120;
        let likenessSet = new Set();
        activeToggles.forEach(toggle => {
            const altId = toggle.getAttribute('data-id');
            const pref = database[selectedBase][altId].gifts.ssr[index];
            if (pref > maxPref) maxPref = pref;
            likenessSet.add(LIKENESS_MAPPING_SSR[pref] || 2);
        });
        if (maxPref > 120) prefSsr.push({ giftObj, index, maxPref, likenesses: Array.from(likenessSet).sort((a, b) => b - a) });
    });

    // Sort by highest preference first
    prefSr.sort((a, b) => b.maxPref - a.maxPref);
    prefSsr.sort((a, b) => b.maxPref - a.maxPref);

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
    const otherSsrIds = globalGiftNames.ssr.filter((_, i) => !prefSsr.some(p => p.index === i)).map(g => g.id);
    const otherSrIds = globalGiftNames.sr.filter((_, i) => !prefSr.some(p => p.index === i)).map(g => g.id);

    // Generate HTML for the Modal
    let html = `
    <div id="giftModalOverlay" style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.6); z-index: 1000; display: flex; justify-content: center; align-items: center;">
        <div class="gift-modal" style="background: var(--bg-color, #1e1e2e); color: var(--text-color, #cdd6f4); padding: 20px; border-radius: 8px; max-width: 450px; width: 90%; max-height: 85vh; overflow-y: auto; box-shadow: 0 4px 15px rgba(0,0,0,0.5);">
            <h3 style="margin-top: 0;">${t.giftMenuTitle}</h3>`;

    if (prefSsr.length > 0 || prefSr.length > 0) {
        html += `<div style="margin-bottom: 15px;">`;
        prefSsr.forEach(item => {
            const iconsHtml = item.likenesses.map(l => `<img src="images/gift_${l}.png" style="width: 16px; height: 16px; margin-left: 2px;" alt="L${l}">`).join('');
            html += `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                <div style="display: flex; align-items: center;">
                    <img src="images/${encodeURIComponent(item.giftObj.id)}.webp" style="width: 32px; height: 32px; object-fit: contain; background-color: #8b5cf6; border-radius: 4px; margin-right: 10px; padding: 2px;" alt="SSR">
                    <span>${item.giftObj[currentLang]}</span>
                    <div style="margin-left: 6px; display: flex;">${iconsHtml}</div>
                </div>
                <input type="number" min="0" value="0" id="gift-ssr-${item.index}" style="width: 60px; padding: 4px; border-radius: 4px;">
            </div>`;
        });
        prefSr.forEach(item => {
            const iconsHtml = item.likenesses.map(l => `<img src="images/gift_${l}.png" style="width: 16px; height: 16px; margin-left: 2px;" alt="L${l}">`).join('');
            html += `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                <div style="display: flex; align-items: center;">
                    <img src="images/${encodeURIComponent(item.giftObj.id)}.webp" style="width: 32px; height: 32px; object-fit: contain; background-color: #eab308; border-radius: 4px; margin-right: 10px; padding: 2px;" alt="SR">
                    <span>${item.giftObj[currentLang]}</span>
                    <div style="margin-left: 6px; display: flex;">${iconsHtml}</div>
                </div>
                <input type="number" min="0" value="0" id="gift-sr-${item.index}" style="width: 60px; padding: 4px; border-radius: 4px;">
            </div>`;
        });
        html += `</div>`;
    }

    const hasOtherSsr = prefSsr.length < globalGiftNames.ssr.length;
    const hasOtherSr = prefSr.length < globalGiftNames.sr.length;

    if (hasOtherSsr || hasOtherSr) {
        if (prefSsr.length > 0 || prefSr.length > 0) {
            html += `<hr style="border-top: 1px solid #45475a; margin: 15px 0;">`;
        }
        
        if (hasOtherSsr) {
            html += `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                <div style="display: flex; align-items: center;">
                    <img id="img-other-ssr" src="images/${encodeURIComponent(otherSsrIds[0])}.webp" style="width: 32px; height: 32px; object-fit: contain; background-color: #8b5cf6; border-radius: 4px; margin-right: 10px; padding: 2px;" alt="Other SSR">
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
                    <img id="img-other-sr" src="images/${encodeURIComponent(otherSrIds[0])}.webp" style="width: 32px; height: 32px; object-fit: contain; background-color: #eab308; border-radius: 4px; margin-right: 10px; padding: 2px;" alt="Other SR">
                    <span>${t.otherSrGifts}</span>
                    <div style="margin-left: 6px; display: flex;">
                        <img src="images/gift_1.png" style="width: 16px; height: 16px; margin-left: 2px;" alt="L1">
                        <img src="images/${encodeURIComponent('선물 선택 상자')}.webp" style="width: 16px; height: 16px; margin-left: 2px; object-fit: contain;" alt="Choice Box">
                    </div>
                </div>
                <input type="number" min="0" value="0" id="gift-other-sr" style="width: 60px; padding: 4px; border-radius: 4px;">
            </div>`;
        }
    }

    html += `<hr style="border-top: 1px solid #45475a; margin: 15px 0;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                <div style="display: flex; align-items: center;">
                    <img id="img-beautiful-bouquet" src="images/${encodeURIComponent('아름다운 꽃다발0')}.webp" style="width: 32px; height: 32px; object-fit: contain; background-color: #8b5cf6; border-radius: 4px; margin-right: 10px; padding: 2px;" alt="SSR">
                    <span>${t.beautifulBouquet}</span>
                    <div style="margin-left: 6px; display: flex;"><img src="images/gift_4.png" style="width: 16px; height: 16px; margin-left: 2px;" alt="L4"></div>
                </div>
                <input type="number" min="0" value="0" id="gift-beautiful-bouquet" style="width: 60px; padding: 4px; border-radius: 4px;">
            </div>
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                <div style="display: flex; align-items: center;">
                    <img id="img-shiny-bouquet" src="images/${encodeURIComponent('반짝이는 꽃다발0')}.webp" style="width: 32px; height: 32px; object-fit: contain; background-color: #8b5cf6; border-radius: 4px; margin-right: 10px; padding: 2px;" alt="SSR">
                    <span>${t.shinyBouquet}</span>
                    <div style="margin-left: 6px; display: flex;"><img src="images/gift_2.png" style="width: 16px; height: 16px; margin-left: 2px;" alt="L2"></div>
                </div>
                <input type="number" min="0" value="0" id="gift-shiny-bouquet" style="width: 60px; padding: 4px; border-radius: 4px;">
            </div>
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                <div style="display: flex; align-items: center;">
                    <img src="images/${encodeURIComponent('상급 합성용 기동석')}.webp" style="width: 32px; height: 32px; object-fit: contain; background-color: #eab308; border-radius: 4px; margin-right: 10px; padding: 2px;" alt="SR">
                    <span>${t.advancedFusionKeystone}</span>
                </div>
                <input type="number" min="0" value="0" id="gift-fusion-keystone" style="width: 60px; padding: 4px; border-radius: 4px;">
            </div>
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                <div style="display: flex; align-items: center;">
                    <img src="images/${encodeURIComponent('선물 선택 상자')}.webp" style="width: 32px; height: 32px; object-fit: contain; background-color: #eab308; border-radius: 4px; margin-right: 10px; padding: 2px;" alt="SR">
                    <span>${t.giftChoiceBox}</span>
                    <div style="margin-left: 6px; display: flex;">${choiceBoxIconsHtml}</div>
                </div>
                <input type="number" min="0" value="0" id="gift-choice-box" style="width: 60px; padding: 4px; border-radius: 4px;">
            </div>
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                <div style="display: flex; align-items: center;">
                    <img src="images/${encodeURIComponent('카페 쓰담쓰담')}.png" style="width: 32px; height: 32px; object-fit: contain; border-radius: 4px; margin-right: 10px; padding: 2px;" alt="Cafe">
                    <span>${t.cafeHeadpat}</span>
                </div>
                <input type="number" min="0" value="0" id="gift-cafe-headpat" style="width: 60px; padding: 4px; border-radius: 4px;">
            </div>`;

    html += `
            <div style="display: flex; justify-content: flex-end; gap: 10px; margin-top: 20px;">
                <button id="closeGiftModal" class="btn-inline">${t.closeBtnModal}</button>
                <button id="runBudgetCalc" class="btn-inline" style="background-color: #007bff; color: white;">${t.calcBtnModal}</button>
            </div>
        </div>
    </div>`;

    document.body.insertAdjacentHTML('beforeend', html);
    
    // Setup Image Rotation Animation
    let animIdx = 0;
    if (window.giftModalInterval) clearInterval(window.giftModalInterval);
    
    window.giftModalInterval = setInterval(() => {
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

    document.getElementById('closeGiftModal').addEventListener('click', () => {
        if (window.giftModalInterval) clearInterval(window.giftModalInterval);
        document.getElementById('giftModalOverlay').remove();
    });
    document.getElementById('runBudgetCalc').addEventListener('click', () => alert("Budget calculation logic not yet implemented!"));
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
                    <h4>${t.step} ${currentStepNum}: ${step.name}</h4>
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