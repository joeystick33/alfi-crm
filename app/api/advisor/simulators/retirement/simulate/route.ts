import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      currentAge,
      retirementAge,
      lifeExpectancy,
      currentSavings,
      monthlyContribution,
      expectedReturn,
      inflationRate,
      currentIncome,
      desiredReplacementRate
    } = body;

    // Calculate years until retirement
    const yearsUntilRetirement = retirementAge - currentAge;
    const yearsInRetirement = lifeExpectancy - retirementAge;

    // Calculate total contributions
    const totalContributions = currentSavings + (monthlyContribution * 12 * yearsUntilRetirement);

    // Calculate savings at retirement (simplified compound interest)
    const monthlyRate = expectedReturn / 12;
    const months = yearsUntilRetirement * 12;
    const futureValueContributions = monthlyContribution * (((1 + monthlyRate) ** months - 1) / monthlyRate);
    const futureValueInitial = currentSavings * ((1 + expectedReturn) ** yearsUntilRetirement);
    const savingsAtRetirement = futureValueInitial + futureValueContributions;

    // Calculate investment gains
    const investmentGains = savingsAtRetirement - totalContributions;

    // Calculate desired annual income
    const desiredAnnualIncome = currentIncome * desiredReplacementRate;

    // Calculate sustainable withdrawal (4% rule)
    const sustainableAnnualIncome = savingsAtRetirement * 0.04;

    // Calculate income shortfall
    const incomeShortfall = Math.max(0, desiredAnnualIncome - sustainableAnnualIncome);

    // Determine if retirement is feasible
    const isRetirementFeasible = incomeShortfall === 0;

    // Generate projection data
    const projection = [];
    for (let age = currentAge; age <= lifeExpectancy; age++) {
      const yearsFromNow = age - currentAge;
      let savingsBalance = 0;
      let totalContributionsAtAge = 0;

      if (age < retirementAge) {
        // Accumulation phase
        const monthsFromNow = yearsFromNow * 12;
        savingsBalance = currentSavings * ((1 + expectedReturn) ** yearsFromNow) +
          monthlyContribution * (((1 + monthlyRate) ** monthsFromNow - 1) / monthlyRate);
        totalContributionsAtAge = currentSavings + (monthlyContribution * 12 * yearsFromNow);
      } else {
        // Retirement phase
        const yearsIntoRetirement = age - retirementAge;
        savingsBalance = savingsAtRetirement * ((1 - 0.04) ** yearsIntoRetirement);
        totalContributionsAtAge = totalContributions;
      }

      projection.push({
        age,
        savingsBalance: Math.round(savingsBalance),
        totalContributions: Math.round(totalContributionsAtAge),
        annualWithdrawal: age >= retirementAge ? Math.round(sustainableAnnualIncome) : 0
      });
    }

    // Generate recommendations
    const recommendations = [];
    if (incomeShortfall > 0) {
      recommendations.push(`Augmentez votre épargne mensuelle de ${Math.round(incomeShortfall / (yearsUntilRetirement * 12))}€ pour combler le déficit.`);
      recommendations.push(`Envisagez de reporter votre départ à la retraite de ${Math.ceil(incomeShortfall / (monthlyContribution * 12))} ans.`);
      recommendations.push(`Réduisez votre taux de remplacement cible à ${Math.round((sustainableAnnualIncome / currentIncome) * 100)}% pour rester dans vos moyens.`);
    } else {
      recommendations.push('Votre plan de retraite est sur la bonne voie. Continuez vos contributions régulières.');
      recommendations.push('Diversifiez vos investissements pour optimiser le rendement tout en gérant le risque.');
      recommendations.push('Réévaluez votre plan annuellement pour ajuster selon l\'évolution de votre situation.');
    }

    return NextResponse.json({
      success: true,
      data: {
        currentAge,
        retirementAge,
        lifeExpectancy,
        yearsUntilRetirement,
        yearsInRetirement,
        savingsAtRetirement: Math.round(savingsAtRetirement),
        totalContributions: Math.round(totalContributions),
        investmentGains: Math.round(investmentGains),
        desiredAnnualIncome: Math.round(desiredAnnualIncome),
        desiredReplacementRate,
        sustainableAnnualIncome: Math.round(sustainableAnnualIncome),
        incomeShortfall: Math.round(incomeShortfall),
        isRetirementFeasible,
        projection,
        recommendations
      }
    });
  } catch (error: any) {
    console.error('Error in retirement simulation:', error);
    return NextResponse.json(
      { success: false, error: 'Erreur lors de la simulation' },
      { status: 500 }
    );
  }
}
