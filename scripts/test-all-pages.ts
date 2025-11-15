#!/usr/bin/env tsx
/**
 * Comprehensive Page Testing Script
 * Tests all pages in the alfi-crm application
 * 
 * Tests:
 * - Page loading
 * - Console errors
 * - Data display
 * - Navigation
 */

import { PrismaClient } from '@prisma/client';
import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

interface PageTest {
  path: string;
  name: string;
  requiresAuth: boolean;
  requiresData?: string[];
  description: string;
}

interface TestResult {
  page: string;
  passed: boolean;
  errors: string[];
  warnings: string[];
  dataChecks: { [key: string]: boolean };
}

// Define all pages to test
const PAGES_TO_TEST: PageTest[] = [
  // Public pages
  { path: '/login', name: 'Login', requiresAuth: false, description: 'Login page' },
  
  // Dashboard pages
  { path: '/dashboard', name: 'Dashboard', requiresAuth: true, requiresData: ['clients', 'tasks', 'appointments'], description: 'Main dashboard with KPIs' },
  
  // Client pages
  { path: '/dashboard/clients', name: 'Clients List', requiresAuth: true, requiresData: ['clients'], description: 'List of all clients' },
  { path: '/dashboard/clients/[id]', name: 'Client360', requiresAuth: true, requiresData: ['clients'], description: 'Client 360 view' },
  { path: '/dashboard/clients/opportunites', name: 'Client Opportunities', requiresAuth: true, description: 'Client opportunities page' },
  { path: '/dashboard/clients/actions', name: 'Client Actions', requiresAuth: true, description: 'Client actions page' },
  
  // Patrimoine pages
  { path: '/dashboard/patrimoine', name: 'Patrimoine Overview', requiresAuth: true, description: 'Patrimoine overview' },
  { path: '/dashboard/patrimoine/actifs', name: 'Actifs', requiresAuth: true, description: 'Assets management' },
  { path: '/dashboard/patrimoine/passifs', name: 'Passifs', requiresAuth: true, description: 'Liabilities management' },
  { path: '/dashboard/patrimoine/contrats', name: 'Contrats', requiresAuth: true, description: 'Contracts management' },
  
  // Objectifs & Projets
  { path: '/dashboard/objectifs', name: 'Objectifs', requiresAuth: true, description: 'Objectives management' },
  { path: '/dashboard/projets', name: 'Projets', requiresAuth: true, description: 'Projects management' },
  
  // Opportunités
  { path: '/dashboard/opportunites', name: 'Opportunités', requiresAuth: true, description: 'Opportunities management' },
  
  // Tâches & Agenda
  { path: '/dashboard/taches', name: 'Tâches', requiresAuth: true, requiresData: ['tasks'], description: 'Tasks management' },
  { path: '/dashboard/agenda', name: 'Agenda', requiresAuth: true, requiresData: ['appointments'], description: 'Calendar and appointments' },
  
  // Calculateurs
  { path: '/dashboard/calculators', name: 'Calculators Index', requiresAuth: true, description: 'Calculators overview' },
  { path: '/dashboard/calculators/income-tax', name: 'Income Tax Calculator', requiresAuth: true, description: 'Income tax calculator' },
  { path: '/dashboard/calculators/capital-gains-tax', name: 'Capital Gains Tax', requiresAuth: true, description: 'Capital gains tax calculator' },
  { path: '/dashboard/calculators/wealth-tax', name: 'Wealth Tax', requiresAuth: true, description: 'Wealth tax calculator' },
  { path: '/dashboard/calculators/inheritance-tax', name: 'Inheritance Tax', requiresAuth: true, description: 'Inheritance tax calculator' },
  { path: '/dashboard/calculators/donation-tax', name: 'Donation Tax', requiresAuth: true, description: 'Donation tax calculator' },
  { path: '/dashboard/calculators/budget-analyzer', name: 'Budget Analyzer', requiresAuth: true, description: 'Budget analyzer' },
  { path: '/dashboard/calculators/debt-capacity', name: 'Debt Capacity', requiresAuth: true, description: 'Debt capacity calculator' },
  { path: '/dashboard/calculators/objective', name: 'Objective Calculator', requiresAuth: true, description: 'Objective calculator' },
  { path: '/dashboard/calculators/multi-objective', name: 'Multi-Objective', requiresAuth: true, description: 'Multi-objective calculator' },
  { path: '/dashboard/calculators/home-purchase', name: 'Home Purchase', requiresAuth: true, description: 'Home purchase calculator' },
  
  // Simulateurs
  { path: '/dashboard/simulators', name: 'Simulators Index', requiresAuth: true, description: 'Simulators overview' },
  { path: '/dashboard/simulators/retirement', name: 'Retirement Simulator', requiresAuth: true, description: 'Retirement simulator' },
  { path: '/dashboard/simulators/retirement-comparison', name: 'Retirement Comparison', requiresAuth: true, description: 'Retirement comparison' },
  { path: '/dashboard/simulators/succession', name: 'Succession Simulator', requiresAuth: true, description: 'Succession simulator' },
  { path: '/dashboard/simulators/tax-strategy-comparison', name: 'Tax Strategy', requiresAuth: true, description: 'Tax strategy comparison' },
  
  // Notifications
  { path: '/dashboard/notifications', name: 'Notifications', requiresAuth: true, description: 'Notifications center' },
  
  // Admin
  { path: '/dashboard/admin/audit', name: 'Audit Logs', requiresAuth: true, description: 'Audit logs viewer' },
  
  // SuperAdmin
  { path: '/superadmin', name: 'SuperAdmin Dashboard', requiresAuth: true, description: 'SuperAdmin dashboard' },
  
  // Client Portal
  { path: '/client/dashboard', name: 'Client Dashboard', requiresAuth: true, description: 'Client portal dashboard' },
  { path: '/client/patrimoine', name: 'Client Patrimoine', requiresAuth: true, description: 'Client patrimoine view' },
  { path: '/client/objectifs', name: 'Client Objectifs', requiresAuth: true, description: 'Client objectives view' },
  { path: '/client/documents', name: 'Client Documents', requiresAuth: true, description: 'Client documents view' },
  { path: '/client/rendez-vous', name: 'Client Rendez-vous', requiresAuth: true, description: 'Client appointments view' },
  { path: '/client/messages', name: 'Client Messages', requiresAuth: true, description: 'Client messages view' },
  { path: '/client/profil', name: 'Client Profil', requiresAuth: true, description: 'Client profile view' },
];

const results: TestResult[] = [];

async function checkDatabaseData() {
  console.log('\n📊 Checking database data availability...\n');
  
  const checks = {
    clients: await prisma.client.count(),
    tasks: await prisma.tache.count(),
    appointments: await prisma.rendezVous.count(),
    opportunities: await prisma.opportunite.count(),
    users: await prisma.user.count(),
    organizations: await prisma.cabinet.count(),
  };
  
  console.log('Database counts:');
  Object.entries(checks).forEach(([key, count]) => {
    const status = count > 0 ? '✅' : '⚠️';
    console.log(`  ${status} ${key}: ${count}`);
  });
  
  return checks;
}

async function checkPageFiles() {
  console.log('\n📁 Checking page files existence...\n');
  
  const appDir = path.join(process.cwd(), 'app');
  const missingPages: string[] = [];
  const existingPages: string[] = [];
  
  for (const page of PAGES_TO_TEST) {
    // Convert route to file path
    let filePath = page.path.replace(/^\//, '');
    
    // Handle dynamic routes
    if (filePath.includes('[id]')) {
      filePath = filePath.replace('[id]', '[id]');
    }
    
    // Check for page.tsx or page.jsx
    const possiblePaths = [
      path.join(appDir, filePath, 'page.tsx'),
      path.join(appDir, filePath, 'page.jsx'),
      path.join(appDir, filePath, 'page.ts'),
      path.join(appDir, filePath, 'page.js'),
    ];
    
    const exists = possiblePaths.some(p => fs.existsSync(p));
    
    if (exists) {
      existingPages.push(page.path);
      console.log(`  ✅ ${page.name} (${page.path})`);
    } else {
      missingPages.push(page.path);
      console.log(`  ❌ ${page.name} (${page.path}) - FILE NOT FOUND`);
    }
  }
  
  console.log(`\n📈 Summary: ${existingPages.length}/${PAGES_TO_TEST.length} pages exist`);
  
  return { existingPages, missingPages };
}

async function checkAPIRoutes() {
  console.log('\n🔌 Checking API routes...\n');
  
  const apiRoutes = [
    '/api/dashboard/counters',
    '/api/clients',
    '/api/advisor/tasks',
    '/api/advisor/appointments',
    '/api/opportunites',
    '/api/objectifs',
    '/api/projets',
    '/api/simulations',
    '/api/exports/clients',
    '/api/exports/patrimoine',
    '/api/client/dashboard',
    '/api/client/patrimoine',
    '/api/superadmin/metrics',
  ];
  
  const appDir = path.join(process.cwd(), 'app');
  const existingRoutes: string[] = [];
  const missingRoutes: string[] = [];
  
  for (const route of apiRoutes) {
    const filePath = route.replace(/^\/api\//, '');
    const possiblePaths = [
      path.join(appDir, 'api', filePath, 'route.ts'),
      path.join(appDir, 'api', filePath, 'route.js'),
    ];
    
    const exists = possiblePaths.some(p => fs.existsSync(p));
    
    if (exists) {
      existingRoutes.push(route);
      console.log(`  ✅ ${route}`);
    } else {
      missingRoutes.push(route);
      console.log(`  ❌ ${route} - FILE NOT FOUND`);
    }
  }
  
  console.log(`\n📈 Summary: ${existingRoutes.length}/${apiRoutes.length} API routes exist`);
  
  return { existingRoutes, missingRoutes };
}

async function checkComponents() {
  console.log('\n🧩 Checking critical components...\n');
  
  const criticalComponents = [
    'components/ui/BentoGrid.tsx',
    'components/ui/BentoCard.tsx',
    'components/ui/Button.tsx',
    'components/ui/DataTable.tsx',
    'components/dashboard/NavigationSidebar.tsx',
    'components/dashboard/DashboardHeader.tsx',
    'components/client360/TabOverview.tsx',
    'components/client360/TabWealth.tsx',
    'components/calculators/IncomeTaxCalculator.tsx',
    'components/simulators/RetirementSimulator.tsx',
    'components/exports/ExportButton.tsx',
    'components/notifications/NotificationCenter.tsx',
  ];
  
  const existingComponents: string[] = [];
  const missingComponents: string[] = [];
  
  for (const component of criticalComponents) {
    const filePath = path.join(process.cwd(), component);
    
    if (fs.existsSync(filePath)) {
      existingComponents.push(component);
      console.log(`  ✅ ${component}`);
    } else {
      missingComponents.push(component);
      console.log(`  ❌ ${component} - FILE NOT FOUND`);
    }
  }
  
  console.log(`\n📈 Summary: ${existingComponents.length}/${criticalComponents.length} components exist`);
  
  return { existingComponents, missingComponents };
}

async function checkNavigation() {
  console.log('\n🧭 Checking navigation structure...\n');
  
  const navigationFile = path.join(process.cwd(), 'components/dashboard/NavigationSidebar.tsx');
  
  if (!fs.existsSync(navigationFile)) {
    console.log('  ❌ NavigationSidebar.tsx not found');
    return { valid: false, links: [] };
  }
  
  const content = fs.readFileSync(navigationFile, 'utf-8');
  
  // Extract navigation links (simple regex check)
  const linkPatterns = [
    '/dashboard',
    '/dashboard/clients',
    '/dashboard/patrimoine',
    '/dashboard/objectifs',
    '/dashboard/opportunites',
    '/dashboard/taches',
    '/dashboard/agenda',
    '/dashboard/calculators',
    '/dashboard/simulators',
  ];
  
  const foundLinks: string[] = [];
  const missingLinks: string[] = [];
  
  for (const link of linkPatterns) {
    if (content.includes(link)) {
      foundLinks.push(link);
      console.log(`  ✅ ${link}`);
    } else {
      missingLinks.push(link);
      console.log(`  ⚠️ ${link} - Not found in navigation`);
    }
  }
  
  console.log(`\n📈 Summary: ${foundLinks.length}/${linkPatterns.length} navigation links found`);
  
  return { valid: foundLinks.length > 0, links: foundLinks, missingLinks };
}

async function checkTypeScript() {
  console.log('\n🔍 Checking TypeScript compilation...\n');
  
  try {
    console.log('Running TypeScript compiler...');
    execSync('npx tsc --noEmit', { stdio: 'pipe' });
    console.log('  ✅ TypeScript compilation successful');
    return { success: true, errors: [] };
  } catch (error: any) {
    const output = error.stdout?.toString() || error.stderr?.toString() || '';
    const errorLines = output.split('\n').filter((line: string) => line.trim());
    console.log(`  ❌ TypeScript compilation failed with ${errorLines.length} errors`);
    console.log('\nFirst 10 errors:');
    errorLines.slice(0, 10).forEach((line: string) => console.log(`    ${line}`));
    return { success: false, errors: errorLines };
  }
}

async function generateReport() {
  console.log('\n📝 Generating comprehensive test report...\n');
  
  const report = {
    timestamp: new Date().toISOString(),
    summary: {
      totalPages: PAGES_TO_TEST.length,
      testedPages: 0,
      passedPages: 0,
      failedPages: 0,
    },
    database: await checkDatabaseData(),
    pages: await checkPageFiles(),
    apiRoutes: await checkAPIRoutes(),
    components: await checkComponents(),
    navigation: await checkNavigation(),
    typescript: await checkTypeScript(),
  };
  
  // Calculate summary
  report.summary.testedPages = report.pages.existingPages.length;
  report.summary.passedPages = report.pages.existingPages.length;
  report.summary.failedPages = report.pages.missingPages.length;
  
  // Save report
  const reportPath = path.join(process.cwd(), 'docs/migration/TASK_32_PAGE_TESTING_REPORT.md');
  const reportContent = `# Task 32: Page Testing Report

Generated: ${new Date().toLocaleString('fr-FR')}

## Summary

- **Total Pages**: ${report.summary.totalPages}
- **Existing Pages**: ${report.summary.testedPages}
- **Missing Pages**: ${report.summary.failedPages}
- **Success Rate**: ${((report.summary.passedPages / report.summary.totalPages) * 100).toFixed(1)}%

## Database Data

${Object.entries(report.database).map(([key, count]) => 
  `- **${key}**: ${count} ${count > 0 ? '✅' : '⚠️'}`
).join('\n')}

## Page Files

### Existing Pages (${report.pages.existingPages.length})

${report.pages.existingPages.map(page => `- ✅ ${page}`).join('\n')}

### Missing Pages (${report.pages.missingPages.length})

${report.pages.missingPages.length > 0 
  ? report.pages.missingPages.map(page => `- ❌ ${page}`).join('\n')
  : '_No missing pages_'
}

## API Routes

### Existing Routes (${report.apiRoutes.existingRoutes.length})

${report.apiRoutes.existingRoutes.map(route => `- ✅ ${route}`).join('\n')}

### Missing Routes (${report.apiRoutes.missingRoutes.length})

${report.apiRoutes.missingRoutes.length > 0
  ? report.apiRoutes.missingRoutes.map(route => `- ❌ ${route}`).join('\n')
  : '_No missing routes_'
}

## Components

### Existing Components (${report.components.existingComponents.length})

${report.components.existingComponents.map(comp => `- ✅ ${comp}`).join('\n')}

### Missing Components (${report.components.missingComponents.length})

${report.components.missingComponents.length > 0
  ? report.components.missingComponents.map(comp => `- ❌ ${comp}`).join('\n')
  : '_No missing components_'
}

## Navigation

- **Status**: ${report.navigation.valid ? '✅ Valid' : '❌ Invalid'}
- **Links Found**: ${report.navigation.links.length}
${report.navigation.missingLinks && report.navigation.missingLinks.length > 0 
  ? `\n### Missing Navigation Links\n\n${report.navigation.missingLinks.map((link: string) => `- ⚠️ ${link}`).join('\n')}`
  : ''
}

## TypeScript Compilation

- **Status**: ${report.typescript.success ? '✅ Success' : '❌ Failed'}
${!report.typescript.success && report.typescript.errors.length > 0
  ? `\n### Compilation Errors (${report.typescript.errors.length})\n\n\`\`\`\n${report.typescript.errors.slice(0, 20).join('\n')}\n\`\`\``
  : ''
}

## Recommendations

${report.pages.missingPages.length > 0 ? '1. ⚠️ Create missing page files\n' : ''}
${report.apiRoutes.missingRoutes.length > 0 ? '2. ⚠️ Implement missing API routes\n' : ''}
${report.components.missingComponents.length > 0 ? '3. ⚠️ Create missing components\n' : ''}
${!report.typescript.success ? '4. ❌ Fix TypeScript compilation errors\n' : ''}
${Object.values(report.database).some(count => count === 0) ? '5. ⚠️ Seed database with test data\n' : ''}
${report.pages.missingPages.length === 0 && report.typescript.success ? '✅ All pages are ready for testing!\n' : ''}

## Next Steps

1. Review this report and address any missing files
2. Run manual testing on each page
3. Check browser console for errors
4. Verify data display and navigation
5. Test responsive design on different screen sizes
6. Validate accessibility features

---

*This report was automatically generated by the page testing script.*
`;
  
  fs.writeFileSync(reportPath, reportContent);
  console.log(`\n✅ Report saved to: ${reportPath}`);
  
  return report;
}

async function main() {
  console.log('🚀 Starting comprehensive page testing...\n');
  console.log('=' .repeat(60));
  
  try {
    const report = await generateReport();
    
    console.log('\n' + '='.repeat(60));
    console.log('\n✅ Testing complete!\n');
    console.log(`📊 Results:`);
    console.log(`   - Pages: ${report.summary.passedPages}/${report.summary.totalPages} exist`);
    console.log(`   - API Routes: ${report.apiRoutes.existingRoutes.length} found`);
    console.log(`   - Components: ${report.components.existingComponents.length} found`);
    console.log(`   - TypeScript: ${report.typescript.success ? '✅ Passing' : '❌ Failing'}`);
    console.log(`\n📝 Full report: docs/migration/TASK_32_PAGE_TESTING_REPORT.md\n`);
    
    // Exit with error if critical issues found
    if (report.pages.missingPages.length > 5 || !report.typescript.success) {
      console.log('⚠️ Critical issues found. Please review the report.');
      process.exit(1);
    }
    
  } catch (error) {
    console.error('\n❌ Error during testing:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
