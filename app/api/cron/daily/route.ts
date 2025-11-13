/**
 * API Route - Cron Job Quotidien
 * POST /api/cron/daily - Exécuter les tâches quotidiennes
 * 
 * À appeler via un cron job externe (Vercel Cron, GitHub Actions, etc.)
 * Sécurisé par un token CRON_SECRET
 */

import { NextRequest, NextResponse } from 'next/server';
import { runDailyTasks } from '@/lib/services/automation-service';

export async function POST(request: NextRequest) {
  try {
    // Vérifier le token de sécurité
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (!token || token !== process.env.CRON_SECRET) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.log('🤖 Starting daily cron job...');

    const results = await runDailyTasks();

    console.log('✅ Daily cron job completed:', results);

    return NextResponse.json({
      success: true,
      results
    });
  } catch (error: any) {
    console.error('❌ Daily cron job failed:', error);
    return NextResponse.json(
      { error: error.message || 'Cron job failed' },
      { status: 500 }
    );
  }
}

// Permettre GET pour tester (en développement uniquement)
export async function GET(request: NextRequest) {
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json(
      { error: 'Method not allowed' },
      { status: 405 }
    );
  }

  return POST(request);
}
