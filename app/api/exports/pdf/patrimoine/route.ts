/**
 * API Route: Export patrimoine en PDF
 * GET /api/exports/pdf/patrimoine?clientId=xxx&locale=fr
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generatePatrimoineReport, PDFOptions } from '@/lib/services/pdf-export-service';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const clientId = searchParams.get('clientId');
    const locale = (searchParams.get('locale') || 'fr') as 'fr' | 'en';

    if (!clientId) {
      return NextResponse.json(
        { error: 'clientId is required' },
        { status: 400 }
      );
    }

    // Récupérer les données du client
    const client = await prisma.client.findUnique({
      where: { id: clientId },
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
    });

    if (!client) {
      return NextResponse.json(
        { error: 'Client not found' },
        { status: 404 }
      );
    }

    // Récupérer les actifs, passifs et contrats
    const [actifs, passifs, contrats] = await Promise.all([
      prisma.actif.findMany({
        where: {
          clients: {
            some: {
              clientId,
            },
          },
        },
        include: {
          clients: {
            where: {
              clientId,
            },
            select: {
              ownershipPercentage: true,
            },
          },
        },
      }),
      prisma.passif.findMany({
        where: { clientId },
      }),
      prisma.contrat.findMany({
        where: { clientId },
      }),
    ]);

    // Aplatir les actifs avec le pourcentage de propriété
    const flattenedActifs = actifs.map((actif) => {
      const clientActif = actif.clients.find((ca) => ca.clientId === clientId);
      return {
        ...actif,
        ownershipPercentage: clientActif?.ownershipPercentage || 100,
      };
    });

    // Préparer les options PDF avec branding cabinet
    const address = client.cabinet.address as any;
    const addressStr = address
      ? `${address.street || ''}, ${address.city || ''} ${address.postalCode || ''}`
      : undefined;

    const pdfOptions: PDFOptions = {
      locale,
      cabinetInfo: {
        name: client.cabinet.name,
        address: addressStr,
        phone: client.cabinet.phone || undefined,
        email: client.cabinet.email,
      },
      includeCharts: true,
      includeFooter: true,
    };

    // Générer le PDF
    const pdfBlob = await generatePatrimoineReport(
      client,
      {
        actifs: flattenedActifs,
        passifs,
        contrats,
      },
      pdfOptions
    );

    // Convertir le Blob en Buffer pour Next.js
    const buffer = Buffer.from(await pdfBlob.arrayBuffer());

    // Retourner le PDF
    const filename = `patrimoine_${client.firstName}_${client.lastName}_${new Date().toISOString().split('T')[0]}.pdf`;

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': buffer.length.toString(),
      },
    });
  } catch (error) {
    console.error('Error generating patrimoine PDF:', error);
    return NextResponse.json(
      { error: 'Failed to generate PDF', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
