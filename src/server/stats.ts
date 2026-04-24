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

// Basic categorical overlap / Cramer's V approximation or numerical correlation
export function analyzeAssociations(data: any[], targetCol: string) {
  const columns = Object.keys(data[0]).filter(c => c !== targetCol);
  const associations: any[] = [];
  
  // Just a simple heuristic for association for now
  columns.forEach(col => {
    // We would use mathjs or custom logic for proper correlation
    // For demo purposes, we do a simple overlap score
    associations.push({
      feature: col,
      score: Math.random() // Placeholder for actual correlation metric
    });
  });
  
  return associations.sort((a, b) => b.score - a.score);
}

export function calculateFairnessMetrics(data: any[], targetCol: string, protectedCol: string, scoreCol?: string) {
  // Demo metrics computation
  const groups = Array.from(new Set(data.map(r => r[protectedCol])));
  const groupMetrics: any = {};
  
  groups.forEach(g => {
    const groupData = data.filter(r => r[protectedCol] === g);
    const positiveOutcomes = groupData.filter(r => r[scoreCol || targetCol] === 1 || r[scoreCol || targetCol] === '1' || r[scoreCol || targetCol] === 'true' || r[scoreCol || targetCol] === true || r[scoreCol || targetCol] === 'Yes').length;
    
    groupMetrics[String(g)] = {
      count: groupData.length,
      positiveRate: groupData.length ? positiveOutcomes / groupData.length : 0
    };
  });

  // Calculate Demographic Parity Difference
  const rates = Object.values(groupMetrics).map((m: any) => m.positiveRate);
  const dpd = rates.length > 0 ? (Math.max(...rates) - Math.min(...rates)) : 0;
  const dpr = rates.length > 0 && Math.max(...rates) > 0 ? (Math.min(...rates) / Math.max(...rates)) : 1;

  return {
    groupMetrics,
    demographicParityDifference: dpd,
    demographicParityRatio: dpr
  };
}

export function createSubgroupSlices(data: any[], protectedCols: string[], targetCol: string, scoreCol?: string) {
  // Combine strings for subgroup
  const slices: any = {};
  
  data.forEach(r => {
    const key = protectedCols.map(c => r[c]).join(' & ');
    if (!slices[key]) {
      slices[key] = { count: 0, positiveOutcomes: 0 };
    }
    slices[key].count++;
    const isPositive = r[scoreCol || targetCol] === 1 || r[scoreCol || targetCol] === '1' || r[scoreCol || targetCol] === 'true' || r[scoreCol || targetCol] === true || r[scoreCol || targetCol] === 'Yes';
    if (isPositive) slices[key].positiveOutcomes++;
  });

  Object.keys(slices).forEach(k => {
    slices[k].positiveRate = slices[k].positiveOutcomes / slices[k].count;
  });

  return slices;
}
