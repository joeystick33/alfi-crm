#!/usr/bin/env node

/**
 * Script d'analyse des composants pour identifier les doublons
 * entre CRM source et alfi-crm
 */

const fs = require('fs');
const path = require('path');

const CRM_COMPONENTS_DIR = path.join(__dirname, '../../CRM/components');
const ALFI_COMPONENTS_DIR = path.join(__dirname, '../components');

function getAllFiles(dir, fileList = []) {
  if (!fs.existsSync(dir)) {
    return fileList;
  }

  const files = fs.readdirSync(dir);

  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      getAllFiles(filePath, fileList);
    } else if (file.match(/\.(jsx?|tsx?)$/)) {
      fileList.push(filePath);
    }
  });

  return fileList;
}

function getComponentName(filePath) {
  return path.basename(filePath, path.extname(filePath));
}

function getRelativePath(filePath, baseDir) {
  return path.relative(baseDir, filePath);
}

function analyzeComponents() {
  console.log('🔍 Analyse des composants...\n');

  const crmFiles = getAllFiles(CRM_COMPONENTS_DIR);
  const alfiFiles = getAllFiles(ALFI_COMPONENTS_DIR);

  console.log(`📊 Statistiques:`);
  console.log(`   CRM source: ${crmFiles.length} fichiers`);
  console.log(`   alfi-crm: ${alfiFiles.length} fichiers\n`);

  // Créer des maps par nom de composant
  const crmComponents = new Map();
  const alfiComponents = new Map();

  crmFiles.forEach(file => {
    const name = getComponentName(file);
    const relativePath = getRelativePath(file, CRM_COMPONENTS_DIR);
    if (!crmComponents.has(name)) {
      crmComponents.set(name, []);
    }
    crmComponents.get(name).push(relativePath);
  });

  alfiFiles.forEach(file => {
    const name = getComponentName(file);
    const relativePath = getRelativePath(file, ALFI_COMPONENTS_DIR);
    if (!alfiComponents.has(name)) {
      alfiComponents.set(name, []);
    }
    alfiComponents.get(name).push(relativePath);
  });

  // Identifier les doublons
  const duplicates = [];
  const crmOnly = [];
  const alfiOnly = [];

  crmComponents.forEach((paths, name) => {
    if (alfiComponents.has(name)) {
      duplicates.push({
        name,
        crmPaths: paths,
        alfiPaths: alfiComponents.get(name)
      });
    } else {
      crmOnly.push({ name, paths });
    }
  });

  alfiComponents.forEach((paths, name) => {
    if (!crmComponents.has(name)) {
      alfiOnly.push({ name, paths });
    }
  });

  // Afficher les résultats
  console.log(`\n📋 Résultats de l'analyse:\n`);
  console.log(`✅ Composants existants dans les deux projets: ${duplicates.length}`);
  console.log(`📦 Composants uniquement dans CRM: ${crmOnly.length}`);
  console.log(`🆕 Composants uniquement dans alfi-crm: ${alfiOnly.length}`);

  // Générer le rapport
  const report = {
    timestamp: new Date().toISOString(),
    stats: {
      crmTotal: crmFiles.length,
      alfiTotal: alfiFiles.length,
      duplicates: duplicates.length,
      crmOnly: crmOnly.length,
      alfiOnly: alfiOnly.length
    },
    duplicates: duplicates.sort((a, b) => a.name.localeCompare(b.name)),
    crmOnly: crmOnly.sort((a, b) => a.name.localeCompare(b.name)),
    alfiOnly: alfiOnly.sort((a, b) => a.name.localeCompare(b.name))
  };

  // Sauvegarder le rapport
  const reportPath = path.join(__dirname, '../docs/migration/COMPONENT_ANALYSIS.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(`\n💾 Rapport sauvegardé: ${reportPath}`);

  // Afficher quelques exemples
  console.log(`\n📝 Exemples de doublons (10 premiers):`);
  duplicates.slice(0, 10).forEach(({ name, crmPaths, alfiPaths }) => {
    console.log(`\n   ${name}:`);
    console.log(`      CRM: ${crmPaths[0]}`);
    console.log(`      alfi-crm: ${alfiPaths[0]}`);
  });

  return report;
}

// Exécuter l'analyse
if (require.main === module) {
  try {
    analyzeComponents();
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    process.exit(1);
  }
}

module.exports = { analyzeComponents };
