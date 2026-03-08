import { NextRequest, NextResponse } from 'next/server';
import { TaxCalculator } from '@/app/_common/lib/services/calculators/tax-calculator';
import { logger } from '@/app/_common/lib/logger'
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { donationAmount, relationship, previousDonations = 0 } = body;

    // Validation
    if (typeof donationAmount !== 'number' || donationAmount < 0) {
      return NextResponse.json(
        { error: 'Donation amount must be a positive number' },
        { status: 400 }
      );
    }

    if (!['child', 'grandchild', 'sibling', 'other'].includes(relationship)) {
      return NextResponse.json(
        { error: 'Invalid relationship type' },
        { status: 400 }
      );
    }

    if (typeof previousDonations !== 'number' || previousDonations < 0) {
      return NextResponse.json(
        { error: 'Previous donations must be a positive number' },
        { status: 400 }
      );
    }

    // Calculate donation tax
    const result = TaxCalculator.calculateDonationTax(
      donationAmount,
      relationship as 'child' | 'grandchild' | 'sibling' | 'other',
      previousDonations
    );

    return NextResponse.json({
      success: true,
      data: result
    });
  } catch (error) {
    logger.error('Donation tax calculation error:', { error: error instanceof Error ? error.message : String(error) });
    return NextResponse.json(
      { 
        error: 'Failed to calculate donation tax',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
