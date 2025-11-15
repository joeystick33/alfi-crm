#!/usr/bin/env tsx
/**
 * Script de vérification - Aucune dépendance MongoDB
 * 
 * Ce script vérifie qu'il n'y a plus aucune référence à MongoDB/Mongoose
 * dans le code source de alfi-crm.
 */

import { readFileSync, readdirSync, statSync } from 'fs';
import { join } from 'path';

interface VerificationResult {
  passed: boolean;
  message: string;
  details?: string[];
}

const MONGODB_PATTERNS = [
  /import.*mongoose/i,
  /require.*mongoose/i,
  /from ['"]mongoose['"]/i,
  /import.*mongodb/i,
  /require.*mongodb/i,
  /from ['"]mongodb['"]/i,
  /connectDB/,
  /dbConnect/,
  /ObjectId.*from.*mongodb/i,
  /@\/lib\/models\//,
  /lib\/models\//,
];

const EXCLUDE_DIRS = [
  'node_modules',
  '.next',
  '.git',
  'dist',
  'build',
  'coverage',
  '.kiro',
  'docs',
  'backups',
];

const EXCLUDE_FILES = [
  'verify-no-mongodb.ts', // Ce script lui-même
  'package-lock.json',
];

function getAllFiles(dir: string, fileList: string[] = []): string[] {
  const files = readdirSync(dir);

  files.forEach((file) => {
    const filePath = join(dir, file);
    const stat = statSync(filePath);

    // Skip excluded directories
    if (stat.isDirectory()) {
      if (!EXCLUDE_DIRS.includes(file)) {
        getAllFiles(filePath, fileList);
      }
    } else {
      // Only check source files
      if (
        (file.endsWith('.ts') ||
          file.endsWith('.tsx') ||
          file.endsWith('.js') ||
          file.endsWith('.jsx')) &&
        !EXCLUDE_FILES.includes(file)
      ) {
        fileList.push(filePath);
      }
    }
  });

  return fileList;
}

function checkFileForMongoDBReferences(filePath: string): string[] {
  const content = readFileSync(filePath, 'utf-8');
  const issues: string[] = [];

  MONGODB_PATTERNS.forEach((pattern, index) => {
    if (pattern.test(content)) {
      const lines = content.split('\n');
      lines.forEach((line, lineNum) => {
        if (pattern.test(line)) {
          issues.push(
            `Line ${lineNum + 1}: ${line.trim().substring(0, 80)}...`
          );
        }
      });
    }
  });

  return issues;
}

function verifyPackageJson(): VerificationResult {
  try {
    const packageJson = JSON.parse(
      readFileSync(join(process.cwd(), 'package.json'), 'utf-8')
    );

    const dependencies = {
      ...packageJson.dependencies,
      ...packageJson.devDependencies,
    };

    const mongoDBDeps = Object.keys(dependencies).filter(
      (dep) => dep === 'mongoose' || dep === 'mongodb'
    );

    if (mongoDBDeps.length > 0) {
      return {
        passed: false,
        message: 'MongoDB dependencies found in package.json',
        details: mongoDBDeps,
      };
    }

    return {
      passed: true,
      message: 'No MongoDB dependencies in package.json',
    };
  } catch (error) {
    return {
      passed: false,
      message: `Error reading package.json: ${error}`,
    };
  }
}

function verifySourceFiles(): VerificationResult {
  const files = getAllFiles(process.cwd());
  const filesWithIssues: { file: string; issues: string[] }[] = [];

  files.forEach((file) => {
    const issues = checkFileForMongoDBReferences(file);
    if (issues.length > 0) {
      filesWithIssues.push({
        file: file.replace(process.cwd(), ''),
        issues,
      });
    }
  });

  if (filesWithIssues.length > 0) {
    const details = filesWithIssues.map(
      ({ file, issues }) => `${file}:\n  ${issues.join('\n  ')}`
    );

    return {
      passed: false,
      message: `MongoDB references found in ${filesWithIssues.length} file(s)`,
      details,
    };
  }

  return {
    passed: true,
    message: `No MongoDB references found in ${files.length} source files`,
  };
}

function main() {
  console.log('🔍 Vérification des dépendances MongoDB...\n');

  // Check package.json
  console.log('1️⃣  Vérification de package.json...');
  const packageResult = verifyPackageJson();
  console.log(
    packageResult.passed ? '✅' : '❌',
    packageResult.message
  );
  if (packageResult.details) {
    packageResult.details.forEach((detail) => console.log(`   - ${detail}`));
  }
  console.log();

  // Check source files
  console.log('2️⃣  Vérification des fichiers source...');
  const sourceResult = verifySourceFiles();
  console.log(
    sourceResult.passed ? '✅' : '❌',
    sourceResult.message
  );
  if (sourceResult.details) {
    sourceResult.details.forEach((detail) => console.log(`   ${detail}`));
  }
  console.log();

  // Final result
  const allPassed = packageResult.passed && sourceResult.passed;

  if (allPassed) {
    console.log('✅ SUCCÈS: Aucune dépendance MongoDB détectée!');
    console.log('   Le projet utilise maintenant 100% Prisma/Supabase.');
    process.exit(0);
  } else {
    console.log('❌ ÉCHEC: Des références MongoDB ont été trouvées.');
    console.log('   Veuillez les supprimer avant de continuer.');
    process.exit(1);
  }
}

main();
