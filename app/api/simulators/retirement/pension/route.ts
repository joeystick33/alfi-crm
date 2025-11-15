import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      regime,
      yearsWorked,
      averageSalary,
      currentAge,
      retirementAge,
      fullRateAge
    } = body;

    // Calculate quarters (4 per year)
    const quartersValidated = yearsWorked * 4;
    const quartersRequired = 172; // Standard for full rate in France

    // Calculate missing quarters
    const missingQuarters = Math.max(0, quartersRequired - quartersValidated);

    // Calculate pension rate (taux de liquidation)
    let pensionRate = 0.5; // Base rate (50%)

    // Apply discount (décote) if retiring before full rate age
    const hasDiscount = retirementAge < fullRateAge && missingQuarters > 0;
    const discountRate = hasDiscount ? Math.min(0.25, missingQuarters * 0.00625) : 0;

    // Apply bonus (surcote) if working beyond full rate age
    const hasBonus = retirementAge > fullRateAge;
    const bonusQuarters = hasBonus ? (retirementAge - fullRateAge) * 4 : 0;
    const bonusRate = hasBonus ? bonusQuarters * 0.0125 : 0;

    // Final pension rate
    pensionRate = pensionRate - discountRate + bonusRate;

    // Calculate reference salary (salaire de référence)
    const referenceSalary = averageSalary;

    // Calculate base pension (pension de base)
    const basePension = (referenceSalary * pensionRate) / 12;

    // Calculate complementary pension (pension complémentaire)
    // Simplified calculation: approximately 25-30% of base pension
    const complementaryPension = basePension * 0.27;

    // Total monthly pension
    const monthlyPension = basePension + complementaryPension;
    const annualPension = monthlyPension * 12;

    // Calculate replacement rate
    const replacementRate = annualPension / averageSalary;

    // Generate recommendations
    const recommendations = [];
    if (missingQuarters > 0) {
      recommendations.push(`Il vous manque ${missingQuarters} trimestres pour le taux plein. Envisagez de travailler ${Math.ceil(missingQuarters / 4)} années supplémentaires.`);
      recommendations.push(`Vous pouvez racheter jusqu'à 12 trimestres pour améliorer votre pension.`);
    }
    if (replacementRate < 0.7) {
      recommendations.push(`Votre taux de remplacement est de ${Math.round(replacementRate * 100)}%. Envisagez une épargne retraite complémentaire.`);
    }
    if (retirementAge < fullRateAge) {
      recommendations.push(`Reporter votre départ à ${fullRateAge} ans vous permettrait d'éviter la décote de ${Math.round(discountRate * 100)}%.`);
    }
    if (recommendations.length === 0) {
      recommendations.push('Votre situation est favorable. Vous bénéficiez du taux plein.');
      recommendations.push('Pensez à vérifier régulièrement votre relevé de carrière sur le site de l\'Assurance Retraite.');
    }

    return NextResponse.json({
      success: true,
      data: {
        regime,
        yearsWorked,
        quartersValidated,
        quartersRequired,
        missingQuarters,
        pensionRate,
        hasDiscount,
        discountRate,
        hasBonus,
        bonusRate,
        referenceSalary: Math.round(referenceSalary),
        basePension: Math.round(basePension),
        complementaryPension: Math.round(complementaryPension),
        monthlyPension: Math.round(monthlyPension),
        annualPension: Math.round(annualPension),
        replacementRate,
        recommendations
      }
    });
  } catch (error) {
    console.error('Error in pension estimation:', error);
    return NextResponse.json(
      { success: false, error: 'Erreur lors de l\'estimation' },
      { status: 500 }
    );
  }
}
