const gpuInfo = require('../data/gpuInfo.json');

function getGpuInfo(platform, name) {
  const gpus = gpuInfo[platform.toLowerCase()];
  if (!gpus) return null;
  
  const searchName = name.toLowerCase().trim();
  
  // First try exact match (case-insensitive)
  let gpu = gpus.find(gpu => gpu.name.toLowerCase() === searchName);
  if (gpu) return gpu;
  
  // Find all potential matches
  const matches = gpus.filter(gpu => {
    const gpuNameLower = gpu.name.toLowerCase();
    return gpuNameLower.includes(searchName) || searchName.includes(gpuNameLower);
  });
  
  if (matches.length === 0) return null;
  if (matches.length === 1) return matches[0];
  
  // Multiple matches - prefer the most specific match
  // Key: if search has variant (ti, xt, s), prefer GPU with variant; otherwise prefer base model
  const variantSuffixes = ['ti', 'xt', 's', 'super'];
  const searchHasVariant = variantSuffixes.some(suffix => searchName.includes(suffix));
  
  // Sort by: 1) exact match, 2) variant matching, 3) shortest match (base model preferred when no variant)
  matches.sort((a, b) => {
    const nameA = a.name.toLowerCase();
    const nameB = b.name.toLowerCase();
    
    // Exact match gets highest priority
    if (nameA === searchName) return -1;
    if (nameB === searchName) return 1;
    
    // Variant matching logic
    const aHasVariant = variantSuffixes.some(s => nameA.includes(s));
    const bHasVariant = variantSuffixes.some(s => nameB.includes(s));
    
    if (searchHasVariant) {
      // Search has variant - prefer GPU with variant
      if (aHasVariant && !bHasVariant) return -1;
      if (bHasVariant && !aHasVariant) return 1;
    } else {
      // Search has no variant - prefer base model (no variant)
      if (!aHasVariant && bHasVariant) return -1;
      if (aHasVariant && !bHasVariant) return 1;
    }
    
    // If both have same variant status, prefer shorter (more specific to the search term)
    // This helps "4060" match "rtx4060" over "rtx4060ti" when search is just "4060"
    return nameA.length - nameB.length;
  });
  
  return matches[0];
}

// Returns total hashrate in kH/s (GPU hashrate values in gpuInfo.json are in kH/s)
function calculateTotalHashrate(rig) {
  let total = 0;
  for (const item of rig) {
    const gpu = getGpuInfo(item.platform, item.gpuName);
    if (gpu) {
      total += item.qty * gpu.hashrate;
    }
  }
  return total; // Returns in kH/s
}

function calculateTotalPower(rig) {
  let total = 0;
  for (const item of rig) {
    const gpu = getGpuInfo(item.platform, item.gpuName);
    if (gpu && gpu.power && gpu.pl && gpu.pl.toUpperCase() !== 'N/A') {
      total += item.qty * gpu.power;
    }
  }
  return total;
}

// userHashrateKH: user hashrate in kH/s
// networkHashrateH: network hashrate in H/s
// blockReward: block reward in CCX
function calculateExpectedReward(userHashrateKH, networkHashrateH, blockReward) {
  // Convert user hashrate from kH/s to H/s
  const userHashrateH = userHashrateKH * 1000;
  // CCX blocks per day: 24*60*60 / 120 = 720
  const blocksPerDay = 720;
  const share = userHashrateH / networkHashrateH;
  return share * blockReward * blocksPerDay;
}

function getAllGpus(platform) {
  return gpuInfo[platform.toLowerCase()] || [];
}

function formatOcTable(gpus) {
  // Discord doesn't support markdown tables, so use code block with monospace formatting
  let table = '```\n';
  table += 'GPU Name        | Core Clock | Memory Clock | Power Limit\n';
  table += '----------------|------------|--------------|-------------\n';
  for (const gpu of gpus) {
    // Pad GPU name to 15 chars for alignment
    const paddedName = gpu.name.padEnd(15);
    table += `${paddedName} | ${String(gpu.cc).padEnd(10)} | ${String(gpu.mc).padEnd(12)} | ${gpu.pl}\n`;
  }
  table += '```';
  return table;
}

function formatGpuList(gpus) {
  return gpus.map(gpu => gpu.name).join(', ');
}

module.exports = {
  getGpuInfo,
  calculateTotalHashrate,
  calculateTotalPower,
  calculateExpectedReward,
  getAllGpus,
  formatOcTable,
  formatGpuList
};