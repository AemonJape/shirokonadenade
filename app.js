// --- CONSTANTS & GAME DATA ---
const BREAKPOINTS = [2, 6, 11, 16, 21, 31, 41];

// Make sure to fill this array with the exact XP costs for levels 2 through 50!
// Index 0 and 1 are 0. Index 2 is cost from 1->2. 
const xpCostToNext = [0, 0, 15, 30, 30, 35, 35, 35, 40, 40, 40, 60, 90, 105, 120, 140, 160, 180, 205, 230, 255, 285, 315, 345, 375, 410, 445, 480, 520, 560, 600, 645, 690, 735, 780, 830, 880, 930, 985, 1040, 1095, 1155, 1215, 1275, 1335, 1400, 1465, 1530, 1600, 1670, 1740];

let database = null;

// --- 1. INITIALIZATION ---
// Fetch the JSON file when the page loads
fetch('bond_data.json')
    .then(response => response.json())
    .then(data => {
        database = data.base_characters;
        populateBaseDropdown();
    })
    .catch(error => console.error("Error loading JSON:", error));

function populateBaseDropdown() {
    const select = document.getElementById('baseCharSelect');
    // Sort keys alphabetically so the dropdown is organized
    const sortedBases = Object.keys(database).sort();
    
    sortedBases.forEach(baseId => {
        let option = document.createElement('option');
        option.value = baseId;
        // Capitalize the first letter for the display name
        option.textContent = baseId.charAt(0).toUpperCase() + baseId.slice(1);
        select.appendChild(option);
    });
}

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
    
    for (const altId in alts) {
        const student = alts[altId];
        
        // Build a card for each alt using a template literal
        const cardHtml = `
            <div class="alt-card">
                <label>
                    <input type="checkbox" class="alt-toggle" data-id="${altId}" checked>
                    <strong>${student.name}</strong>
                </label>
                <div style="margin-top: 8px;">
                    <label>Current Rank:</label>
                    <input type="number" class="alt-rank" id="rank-${altId}" value="1" min="1" max="49">
                </div>
            </div>
        `;
        container.innerHTML += cardHtml;
    }
    
    calcBtn.style.display = 'block';
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
    
    let activeAlts = [];
    activeToggles.forEach(toggle => {
        const altId = toggle.getAttribute('data-id');
        const currentRank = parseInt(document.getElementById(`rank-${altId}`).value);
        const compactStats = database[selectedBase][altId].bonuses[targetStat];
        
        activeAlts.push({
            name: database[selectedBase][altId].name,
            currentRank: currentRank,
            statArray: expandStatData(compactStats)
        });
    });

    if (activeAlts.length === 0) {
        alert("Please select at least one character!");
        return;
    }

    // Generate the raw path, then compress it
    const rawRoadmapData = generateFullRoadmap(activeAlts, 50);
    const cleanedSteps = compressRoadmap(rawRoadmapData.steps);

    // Print Headers
    const resultsDiv = document.getElementById('results');
    resultsDiv.innerHTML = `
        <h3>Complete Optimal Roadmap to Rank 50</h3>
        <p>Total XP Required: <strong>${rawRoadmapData.totalCost}</strong></p>
        <p>Total ${targetStat.toUpperCase()} Gain: <strong>+${rawRoadmapData.totalGain}</strong></p>
        <hr>
    `;

    if (cleanedSteps.length === 0) {
        resultsDiv.innerHTML += `<p>All selected characters are already at maximum rank!</p>`;
        return;
    }

    // Render the Timeline
    let currentStepNum = 1;
    cleanedSteps.forEach(step => {
        
        if (step.isTieGroup) {
            // --- RENDER A TIE GROUP (OR CLAUSE) ---
            
            // Build the HTML for each tied option
            let optionsHtml = step.options.map(opt => `
                <div style="margin-left: 15px; border-left: 2px solid #ddd; padding-left: 10px; margin-bottom: 5px;">
                    <strong>${opt.name}:</strong> Rank ${opt.startRank} ➡ <strong>Rank ${opt.targetRank}</strong>
                    <br><span style="font-size: 0.85em; color: #555;">Cost: ${opt.cost} XP | Gain: +${opt.gain}</span>
                </div>
            `).join('<div style="margin-left: 15px; font-weight: bold; color: #888; font-size: 0.85em; margin-bottom: 5px;">— OR —</div>');

            resultsDiv.innerHTML += `
                <div style="margin-bottom: 12px; padding: 12px; background: #fffcf2; border-left: 4px solid #f0ad4e; border-radius: 4px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
                    <h4 style="margin: 0 0 6px 0; color: #d58512;">Step ${currentStepNum}: Tied Priority (Pick One)</h4>
                    <p style="font-size: 0.85em; margin: 0 0 10px 0; color: #666;">
                        These upgrades have identical value. <strong>Do not split your gifts.</strong> Focus all XP on one character until they hit the target rank, then move to the next.
                    </p>
                    ${optionsHtml}
                </div>
            `;
            
        } else {
            // --- RENDER A STANDARD STEP ---
            let efficiencyWarning = step.gain === 0 ? `<br><span style="color: #d9534f; font-size: 0.85em;">⚠️ Note: No ${targetStat.toUpperCase()} gained. Do this last.</span>` : '';
            
            resultsDiv.innerHTML += `
                <div style="margin-bottom: 12px; padding: 12px; background: #fdfdfd; border-left: 4px solid #007bff; border-radius: 4px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
                    <h4 style="margin: 0 0 6px 0;">Step ${currentStepNum}: ${step.name}</h4>
                    <div style="font-size: 0.95em;">
                        Level up from <strong>Rank ${step.startRank}</strong> ➡ <strong>Rank ${step.targetRank}</strong>
                    </div>
                    <div style="font-size: 0.85em; color: #555; margin-top: 6px;">
                        Cost: ${step.cost} XP | Gain: +${step.gain} ${targetStat.toUpperCase()} 
                        ${efficiencyWarning}
                    </div>
                </div>
            `;
        }
        currentStepNum++;
    });
});

/**
 * Simulates leveling all characters to max rank, recording the most efficient steps in order.
 */
function generateFullRoadmap(alts, maxRank = 50) {
    // Create a deep copy so we don't mutate the user's HTML inputs during the simulation
    let simulatedAlts = alts.map(alt => ({
        name: alt.name,
        currentRank: alt.currentRank,
        statArray: alt.statArray
    }));

    let roadmap = [];
    let totalXpSpent = 0;
    let totalStatGained = 0;

    // Keep looping until every character hits the max rank
    while (true) {
        let bestUpgrade = null;

        simulatedAlts.forEach((alt, index) => {
            if (alt.currentRank >= maxRank) return;

            let bestEfficiency = -1;
            let bestTarget = -1;
            let bestCost = 0;
            let bestGain = 0;

            // Find the most efficient future milestone for THIS character
            for (let target = alt.currentRank + 1; target <= maxRank; target++) {
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
    let compressed = [];
    
    for (let i = 0; i < rawSteps.length; i++) {
        let current = { ...rawSteps[i] };
        let last = compressed[compressed.length - 1];

        // 1. COLLAPSE SEQUENTIAL: Merge if it's the exact same character back-to-back
        if (last && !last.isTieGroup && last.name === current.name) {
            last.targetRank = current.targetRank;
            last.cost += current.cost;
            last.gain += current.gain;
            last.efficiency = last.gain / last.cost; // Recalculate combined efficiency
            continue; 
        }

        // 2. COLLAPSE TIES: Group characters ONLY if they have identical efficiency AND identical cost
        if (last && Math.abs(last.efficiency - current.efficiency) < 0.0001 && last.cost === current.cost) {
                    
            // If the previous step isn't a Tie Group yet, convert it into one
            if (!last.isTieGroup) {
                let standaloneStep = { ...last };
                compressed[compressed.length - 1] = {
                    isTieGroup: true,
                    efficiency: current.efficiency,
                    cost: current.cost, // Track the shared cost for the group
                    options: [standaloneStep]
                };
                last = compressed[compressed.length - 1];
            }
            
            // Add the current character to the Tie Group options
            last.options.push(current);
            continue;
        }

        // 3. Otherwise, just add it as a standard standalone step
        compressed.push(current);
    }
    
    return compressed;
}