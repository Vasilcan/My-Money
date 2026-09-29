const fs = require('fs');
let content = fs.readFileSync('src/pages/HomePage.tsx', 'utf-8');

content = content.replace(
  `      // If no budget and no spent amount, skip it from the list
      if (!budget && spentMinor === 0) return null;`,
  `      const hasBudget = budget && budget.monthlyLimitMinor > 0;
      // If no budget and no spent amount, skip it from the list
      if (!hasBudget && spentMinor === 0) return null;`
);

fs.writeFileSync('src/pages/HomePage.tsx', content);
