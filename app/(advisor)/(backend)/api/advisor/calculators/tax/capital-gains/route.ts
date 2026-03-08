import { NextRequest, NextResponse } from 'next/server';
import { TaxCalculator } from '@/app/_common/lib/services/calculators/tax-calculator';
import { logger } from '@/app/_common/lib/logger'
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { grossGain, holdingPeriod, assetType = 'stocks' } = body;

    // Validation
    if (typeof grossGain !== 'number' || grossGain < 0) {
      return NextResponse.json(
        { error: 'Gross gain must be a positive number' },
        { status: 400 }
      );
    }

    if (typeof holdingPeriod !== 'number' || holdingPeriod < 0) {
      return NextResponse.json(
        { error: 'Holding period must be a positive number' },
        { status: 400 }
      );
    }

    if (!['stocks', 'real_estate', 'other'].includes(assetType)) {
      return NextResponse.json(
        { error: 'Asset type must be stocks, real_estate, or other' },
        { status: 400 }
      );
    }

    // Calculate capital gains tax
    const result = TaxCalculator.calculateCapitalGainsTax(
      grossGain,
      holdingPeriod,
      assetType
    );

    return NextResponse.json({
      success: true,
      data: result
    });
  } catch (error) {
    logger.error('Capital gains tax calculation error:', { error: error instanceof Error ? error.message : String(error) });
    return NextResponse.json(
      { 
        error: 'Failed to calculate capital gains tax',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
