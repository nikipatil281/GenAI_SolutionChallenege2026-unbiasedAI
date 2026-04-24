export function analyzeDataset(data: any[]) {
  if (!data || data.length === 0) return { totalRows: 0 };
  const totalRows = data.length;
  const columns = Object.keys(data[0]);
  const stats: any = {};
  
  columns.forEach(col => {
    let missing = 0;
    const typeCount: any = {};
    data.forEach(row => {
      let val = row[col];
      if (val === null || val === undefined || val === '') missing++;
      let type = typeof val;
      if (!isNaN(Number(val)) && val !== '') type = 'number';
      typeCount[type] = (typeCount[type] || 0) + 1;
    });
    
    // infer type
    let inferredType = 'string';
    if (typeCount['number'] > typeCount['string'] || (!typeCount['string'] && typeCount['number'])) {
      inferredType = 'number';
    }
    
    // if number, calculate mean etc (basic)
    let min, max, mean;
    if (inferredType === 'number') {
      const nums = data.map(r => Number(r[col])).filter(n => !isNaN(n));
      if (nums.length > 0) {
        min = Math.min(...nums);
        max = Math.max(...nums);
        mean = nums.reduce((a, b) => a + b, 0) / nums.length;
      }
    }

    // if string, group count (if unique < 20)
    let uniqueValues;
    if (inferredType === 'string') {
      const unique = new Set(data.map(r => r[col]));
      if (unique.size < 20) {
        uniqueValues = Array.from(unique);
      }
    }

    stats[col] = {
      missing,
      missingPercentage: (missing / totalRows) * 100,
      inferredType,
      min, max, mean,
      uniqueCount: new Set(data.map(r => r[col])).size,
      uniqueValues
    };
  });

  return { totalRows, columns, stats };
}

// Calculate Mutual Information (MI)
function calculateMutualInformation(data: any[], colX: string, colY: string) {
  const countX: any = {};
  const countY: any = {};
  const countXY: any = {};
  const n = data.length;
  if (n === 0) return 0;

  data.forEach(r => {
    const x = String(r[colX]);
    const y = String(r[colY]);
    countX[x] = (countX[x] || 0) + 1;
    countY[y] = (countY[y] || 0) + 1;
    const xy = `${x}|||${y}`;
    countXY[xy] = (countXY[xy] || 0) + 1;
  });

  let mi = 0;
  for (const [xy, count] of Object.entries(countXY)) {
    const [x, y] = xy.split('|||');
    const px = countX[x] / n;
    const py = countY[y] / n;
    const pxy = (count as number) / n;
    mi += pxy * Math.log2(pxy / (px * py));
  }

  // Calculate Entropy of X to normalize into Uncertainty Coefficient (0 to 1)
  let hx = 0;
  for (const count of Object.values(countX)) {
    const p = (count as number) / n;
    hx -= p * Math.log2(p);
  }

  if (hx === 0) return 0;
  return mi / hx; // Normalized score [0, 1]
}

export function analyzeAssociations(data: any[], targetCol: string) {
  const columns = Object.keys(data[0]).filter(c => c !== targetCol);
  const associations: any[] = [];
  
  columns.forEach(col => {
    associations.push({
      feature: col,
      score: calculateMutualInformation(data, col, targetCol)
    });
  });
  
  return associations.sort((a, b) => b.score - a.score);
}

export function calculateFairnessMetrics(data: any[], targetCol: string, protectedCol: string, groundTruthCol?: string) {
  const groups = Array.from(new Set(data.map(r => r[protectedCol])));
  const groupMetrics: any = {};
  
  groups.forEach(g => {
    const groupData = data.filter(r => r[protectedCol] === g);
    const count = groupData.length;
    
    let tp = 0, fp = 0, tn = 0, fn = 0;
    let posPredictions = 0;

    groupData.forEach(r => {
      const isPosPred = (r[targetCol] === 1 || r[targetCol] === '1' || r[targetCol] === 'true' || r[targetCol] === true || r[targetCol] === 'Yes');
      if (isPosPred) posPredictions++;
      
      if (groundTruthCol) {
        const isPosTruth = (r[groundTruthCol] === 1 || r[groundTruthCol] === '1' || r[groundTruthCol] === 'true' || r[groundTruthCol] === true || r[groundTruthCol] === 'Yes');
        if (isPosPred && isPosTruth) tp++;
        if (isPosPred && !isPosTruth) fp++;
        if (!isPosPred && !isPosTruth) tn++;
        if (!isPosPred && isPosTruth) fn++;
      }
    });
    
    const positiveRate = count > 0 ? posPredictions / count : 0;
    const tpr = (tp + fn) > 0 ? tp / (tp + fn) : 0;
    const fpr = (fp + tn) > 0 ? fp / (fp + tn) : 0;
    const errorRate = count > 0 ? (fp + fn) / count : 0;

    groupMetrics[String(g)] = {
      count,
      positiveRate,
      ...(groundTruthCol && { tpr, fpr, errorRate })
    };
  });

  // Calculate Demographic Parity Difference
  const rates = Object.values(groupMetrics).map((m: any) => m.positiveRate);
  const dpd = rates.length > 0 ? (Math.max(...rates) - Math.min(...rates)) : 0;
  const dpr = rates.length > 0 && Math.max(...rates) > 0 ? (Math.min(...rates) / Math.max(...rates)) : 1;

  let advancedMetrics: any = {};
  if (groundTruthCol) {
    const tprs = Object.values(groupMetrics).map((m: any) => m.tpr);
    const fprs = Object.values(groupMetrics).map((m: any) => m.fpr);
    const errRates = Object.values(groupMetrics).map((m: any) => m.errorRate);
    
    const eod = tprs.length > 0 ? (Math.max(...tprs) - Math.min(...tprs)) : 0;
    const fprDiff = fprs.length > 0 ? (Math.max(...fprs) - Math.min(...fprs)) : 0;
    const avgOddsDiff = (eod + fprDiff) / 2;
    const errDiff = errRates.length > 0 ? (Math.max(...errRates) - Math.min(...errRates)) : 0;
    
    advancedMetrics = {
      equalOpportunityDifference: eod,
      averageOddsDifference: avgOddsDiff,
      errorRateDifference: errDiff
    };
  }

  return {
    groupMetrics,
    demographicParityDifference: dpd,
    demographicParityRatio: dpr,
    ...advancedMetrics
  };
}

export function createSubgroupSlices(data: any[], protectedCols: string[], targetCol: string, groundTruthCol?: string) {
  const slices: any = {};
  
  data.forEach(r => {
    const key = protectedCols.map(c => r[c]).join(' & ');
    if (!slices[key]) {
      slices[key] = { count: 0, posPredictions: 0, tp: 0, fp: 0, tn: 0, fn: 0 };
    }
    
    slices[key].count++;
    const isPosPred = (r[targetCol] === 1 || r[targetCol] === '1' || r[targetCol] === 'true' || r[targetCol] === true || r[targetCol] === 'Yes');
    if (isPosPred) slices[key].posPredictions++;

    if (groundTruthCol) {
      const isPosTruth = (r[groundTruthCol] === 1 || r[groundTruthCol] === '1' || r[groundTruthCol] === 'true' || r[groundTruthCol] === true || r[groundTruthCol] === 'Yes');
      if (isPosPred && isPosTruth) slices[key].tp++;
      if (isPosPred && !isPosTruth) slices[key].fp++;
      if (!isPosPred && !isPosTruth) slices[key].tn++;
      if (!isPosPred && isPosTruth) slices[key].fn++;
    }
  });

  Object.keys(slices).forEach(k => {
    slices[k].positiveRate = slices[k].count > 0 ? slices[k].posPredictions / slices[k].count : 0;
    if (groundTruthCol) {
      const tp = slices[k].tp;
      const fp = slices[k].fp;
      const tn = slices[k].tn;
      const fn = slices[k].fn;
      slices[k].tpr = (tp + fn) > 0 ? tp / (tp + fn) : 0;
      slices[k].fpr = (fp + tn) > 0 ? fp / (fp + tn) : 0;
      slices[k].errorRate = slices[k].count > 0 ? (fp + fn) / slices[k].count : 0;
    }
  });

  return slices;
}
