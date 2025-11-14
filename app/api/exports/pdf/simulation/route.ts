/**
 * API Route: Export simulation en PDF
 * GET /api/exports/pdf/simulation?simulationId=xxx&locale=fr
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generateSimulationReport, PDFOptions } from '@/lib/services/pdf-export-service';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const simulationId = searchParams.get('simulationId');
    const locale = (searchParams.get('locale') || 'fr') as 'fr' | 'en';

    if (!simulationId) {
      return NextResponse.json(
        { error: 'simulationId is required' },
        { status: 400 }
      );
    }

    // Récupérer la simulation
    const simulation = await prisma.simulation.findUnique({
      where: { id: simulationId },
      include: {
        client: {
          include: {
            cabinet: {
              select: {
                name: true,
                address: true,
                phone: true,
                email: true,
              },
            },
          },
        },
      },
    });

    if (!simulation) {
      return NextResponse.json(
        { error: 'Simulation not found' },
        { status: 404 }
      );
    }

    // Préparer les options PDF avec branding cabinet
    const address = simulation.client.cabinet.address as any;
    const addressStr = address
      ? `${address.street || ''}, ${address.city || ''} ${address.postalCode || ''}`
      : undefined;

    const pdfOptions: PDFOptions = {
      locale,
      cabinetInfo: {
        name: simulation.client.cabinet.name,
        address: addressStr,
        phone: simulation.client.cabinet.phone || undefined,
        email: simulation.client.cabinet.email,
      },
      includeCharts: true,
      includeFooter: true,
    };

    // Générer le PDF
    const pdfBlob = await generateSimulationReport(
      simulation,
      simulation.client,
      pdfOptions
    );

    // Convertir le Blob en Buffer pour Next.js
    const buffer = Buffer.from(await pdfBlob.arrayBuffer());

    // Retourner le PDF
    const filename = `simulation_${simulation.simulationType}_${new Date().toISOString().split('T')[0]}.pdf`;

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': buffer.length.toString(),
      },
    });
  } catch (error) {
    console.error('Error generating simulation PDF:', error);
    return NextResponse.json(
      { error: 'Failed to generate PDF', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
