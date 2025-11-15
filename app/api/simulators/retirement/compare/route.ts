import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { baseInput, scenarios } = body;

    const {
      currentAge,
      lifeExpectancy,
      currentSavings,
      monthlyContribution: baseMonthlyContribution,
      expectedReturn: baseExpectedReturn,
      inflationRate,
      currentIncome,
      desiredReplacementRate
    } = baseInput;

    const desiredAnnualIncome = currentIncome * desiredReplacementRate;

    // Calculate each scenario
    const scenarioResults = scenarios.map((scenario: any) => {
      const retirementAge = scenario.retirementAge;
      const monthlyContribution = scenario.monthlyContribution || baseMonthlyContribution;
      const expectedReturn = scenario.expectedReturn || baseExpectedReturn;

      // Calculate years
      const yearsUntilRetirement = retirementAge - currentAge;
      const yearsInRetirement = lifeExpectancy - retirementAge;

      // Calculate total contributions
      const totalContributions = currentSavings + (monthlyContribution * 12 * yearsUntilRetirement);

      // Calculate savings at retirement
      const monthlyRate = expectedReturn / 12;
      const months = yearsUntilRetirement * 12;
      const futureValueContributions = monthlyContribution * (((1 + monthlyRate) ** months - 1) / monthlyRate);
      const futureValueInitial = currentSavings * ((1 + expectedReturn) ** yearsUntilRetirement);
      const savingsAtRetirement = futureValueInitial + futureValueContributions;

      // Calculate sustainable income (4% rule)
      const sustainableAnnualIncome = savingsAtRetirement * 0.04;

      // Calculate shortfall
      const incomeShortfall = Math.max(0, desiredAnnualIncome - sustainableAnnualIncome);

      // Determine feasibility
      const isRetirementFeasible = incomeShortfall === 0;

      return {
        name: scenario.name,
        description: scenario.description,
        retirementAge,
        yearsUntilRetirement,
        yearsInRetirement,
        savingsAtRetirement: Math.round(savingsAtRetirement),
        totalContributions: Math.round(totalContributions),
        sustainableAnnualIncome: Math.round(sustainableAnnualIncome),
        incomeShortfall: Math.round(incomeShortfall),
        isRetirementFeasible
      };
    });

    // Find best scenario (highest savings with feasibility)
    const feasibleScenarios = scenarioResults.filter((s: any) => s.isRetirementFeasible);
    const bestScenario = feasibleScenarios.length > 0
      ? feasibleScenarios.reduce((best: any, current: any) =>
          current.savingsAtRetirement > best.savingsAtRetirement ? current : best
        )
      : scenarioResults.reduce((best: any, current: any) =>
          current.incomeShortfall < best.incomeShortfall ? current : best
        );

    // Generate summary
    const feasibleCount = scenarioResults.filter((s: any) => s.isRetirementFeasible).length;
    const summary = feasibleCount > 0
      ? `${feasibleCount} scénario(s) sur ${scenarioResults.length} permettent d'atteindre vos objectifs de revenu. Le scénario "${bestScenario.name}" offre le meilleur équilibre.`
      : `Aucun scénario ne permet d'atteindre vos objectifs actuels. Le scénario "${bestScenario.name}" présente le déficit le plus faible.`;

    // Generate recommendations
    const recommendations = [];
    if (feasibleCount === 0) {
      recommendations.push('Augmentez votre épargne mensuelle pour améliorer tous les scénarios.');
      recommendations.push('Envisagez de reporter votre départ à la retraite pour accumuler plus de capital.');
      recommendations.push('Réduisez votre taux de remplacement cible pour le rendre plus réaliste.');
    } else if (feasibleCount < scenarioResults.length) {
      recommendations.push(`Le scénario "${bestScenario.name}" est recommandé pour maximiser votre capital tout en atteignant vos objectifs.`);
      recommendations.push('Les scénarios de départ anticipé nécessitent une épargne plus importante.');
    } else {
      recommendations.push('Tous vos scénarios sont viables. Choisissez en fonction de vos préférences personnelles.');
      recommendations.push(`Le scénario "${bestScenario.name}" maximise votre capital de retraite.`);
    }

    return NextResponse.json({
      success: true,
      data: {
        desiredAnnualIncome: Math.round(desiredAnnualIncome),
        scenarios: scenarioResults,
        bestScenario,
        summary,
        recommendations
      }
    });
  } catch (error) {
    console.error('Error in retirement comparison:', error);
    return NextResponse.json(
      { success: false, error: 'Erreur lors de la comparaison' },
      { status: 500 }
    );
  }
}
