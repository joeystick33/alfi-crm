 
'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/app/_common/components/ui/Card'
import { Button } from '@/app/_common/components/ui/Button'
import { Download, TrendingUp, PieChart, Calendar, AlertCircle, FileText } from 'lucide-react'
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    PieChart as RePieChart,
    Pie,
    Cell,
    Legend
} from 'recharts'
import { formatCurrency } from '@/app/_common/lib/utils'
import { useClientReporting } from '@/app/_common/hooks/use-api'
import { useToast } from '@/app/_common/hooks/use-toast'
import { Loader2 } from 'lucide-react'

interface TabReportingProps {
    clientId: string
    client: {
        lastName?: string | null
    }
}

type ClientReportingMetrics = {
    totalValue: number
    totalInvestment: number
    unrealizedGain: number
    performancePercent: number
    lastUpdate: string | Date
}

type ClientReportingAllocationItem = {
    name: string
    value: number
    amount: number
    color: string
}

type ClientReportingHistoryPoint = {
    date: string
    value: number
}

type ClientReportingData = {
    metrics: ClientReportingMetrics
    allocation: ClientReportingAllocationItem[]
    history: ClientReportingHistoryPoint[]
    hasAssets: boolean
}

export default function TabReporting({ clientId, client }: TabReportingProps) {
    const { data, isLoading, isError } = useClientReporting(clientId)
    const { toast } = useToast()
    const [downloading, setDownloading] = useState(false)
    const [downloadingSynthese, setDownloadingSynthese] = useState(false)

    const handleDownloadReport = async () => {
        setDownloading(true)
        try {
            const response = await fetch(`/api/advisor/clients/${clientId}/reports/patrimoine`, {
                method: 'GET',
            })
            
            if (!response.ok) {
                throw new Error('Erreur génération rapport')
            }
            
            const blob = await response.blob()
            const url = window.URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = `rapport-patrimoine-${client?.lastName || 'client'}-${new Date().toISOString().slice(0, 10)}.pdf`
            document.body.appendChild(a)
            a.click()
            window.URL.revokeObjectURL(url)
            a.remove()
            
            toast({ title: 'Rapport téléchargé', description: 'Le rapport PDF a été généré avec succès' })
        } catch (error) {
            console.error('Erreur téléchargement rapport:', error)
            toast({ 
                title: 'Erreur', 
                description: 'Impossible de générer le rapport',
                variant: 'destructive' 
            })
        } finally {
            setDownloading(false)
        }
    }

    const handleDownloadSynthese = async () => {
        setDownloadingSynthese(true)
        try {
            const response = await fetch(`/api/advisor/clients/${clientId}/reports/synthese`, {
                method: 'GET',
            })
            
            if (!response.ok) {
                throw new Error('Erreur génération synthèse')
            }
            
            const blob = await response.blob()
            const url = window.URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = `bilan-patrimonial-${client?.lastName || 'client'}-${new Date().toISOString().slice(0, 10)}.pdf`
            document.body.appendChild(a)
            a.click()
            window.URL.revokeObjectURL(url)
            a.remove()
            
            toast({ title: 'Bilan téléchargé', description: 'Le bilan patrimonial professionnel a été généré avec succès' })
        } catch (error) {
            console.error('Erreur téléchargement synthèse:', error)
            toast({ 
                title: 'Erreur', 
                description: 'Impossible de générer le bilan patrimonial',
                variant: 'destructive' 
            })
        } finally {
            setDownloadingSynthese(false)
        }
    }

    if (isLoading) {
        return (
            <div className="flex h-64 items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        )
    }

    if (isError) {
        return (
            <div className="flex h-64 flex-col items-center justify-center text-red-500">
                <AlertCircle className="mb-2 h-8 w-8" />
                <p>Erreur lors du chargement du rapport</p>
            </div>
        )
    }

    const reporting = data as ClientReportingData | undefined
    const metrics = reporting?.metrics
    const allocation = reporting?.allocation
    const history = reporting?.history
    const hasAssets = reporting?.hasAssets

    if (!hasAssets) {
        return (
            <div className="flex h-64 flex-col items-center justify-center text-muted-foreground">
                <PieChart className="mb-4 h-12 w-12 opacity-20" />
                <p className="text-lg font-medium">Aucun actif trouvé</p>
                <p className="text-sm">Ajoutez des actifs au patrimoine du client pour générer le rapport.</p>
            </div>
        )
    }

    if (!metrics || !allocation || !history) {
        return (
            <div className="flex h-64 items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-lg font-semibold">Rapport de Performance</h2>
                    <p className="text-sm text-muted-foreground">
                        Analyse détaillée du portefeuille et de l'allocation d'actifs
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button onClick={handleDownloadReport} disabled={downloading} variant="outline">
                        {downloading ? (
                            <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Génération...</>
                        ) : (
                            <><Download className="mr-2 h-4 w-4" /> Rapport Patrimoine</>
                        )}
                    </Button>
                    <Button onClick={handleDownloadSynthese} disabled={downloadingSynthese}>
                        {downloadingSynthese ? (
                            <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Génération...</>
                        ) : (
                            <><FileText className="mr-2 h-4 w-4" /> Bilan CGP Complet</>
                        )}
                    </Button>
                </div>
            </div>

            {/* Key Metrics */}
            <div className="grid gap-4 md:grid-cols-4">
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Performance Globale</p>
                                <p className={`text-2xl font-bold ${metrics.performancePercent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                    {metrics.performancePercent > 0 ? '+' : ''}{metrics.performancePercent.toFixed(1)}%
                                </p>
                            </div>
                            <div className={`h-10 w-10 rounded-full flex items-center justify-center ${metrics.performancePercent >= 0 ? 'bg-green-100' : 'bg-red-100'}`}>
                                <TrendingUp className={`h-5 w-5 ${metrics.performancePercent >= 0 ? 'text-green-600' : 'text-red-600'}`} />
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Valeur Totale</p>
                                <p className="text-2xl font-bold text-slate-900">{formatCurrency(metrics.totalValue)}</p>
                            </div>
                            <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center">
                                <PieChart className="h-5 w-5 text-slate-600" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Plus-value latente</p>
                                <p className={`text-2xl font-bold ${metrics.unrealizedGain >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                    {metrics.unrealizedGain > 0 ? '+' : ''}{formatCurrency(metrics.unrealizedGain)}
                                </p>
                            </div>
                            <div className={`h-10 w-10 rounded-full flex items-center justify-center ${metrics.unrealizedGain >= 0 ? 'bg-green-100' : 'bg-red-100'}`}>
                                <TrendingUp className={`h-5 w-5 ${metrics.unrealizedGain >= 0 ? 'text-green-600' : 'text-red-600'}`} />
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Dernière maj</p>
                                <p className="text-2xl font-bold text-slate-900">
                                    {new Date(metrics.lastUpdate).toLocaleDateString()}
                                </p>
                            </div>
                            <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                                <Calendar className="h-5 w-5 text-blue-600" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                {/* Performance Chart */}
                <Card className="col-span-2 lg:col-span-1">
                    <CardHeader>
                        <CardTitle>Évolution du portefeuille (Estimée)</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div style={{ width: '100%', height: 300 }}>
                            <ResponsiveContainer width="100%" height={300}>
                                <LineChart data={history} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                    <XAxis
                                        dataKey="date"
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: '#64748b', fontSize: 12 }}
                                        dy={10}
                                    />
                                    <YAxis
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: '#64748b', fontSize: 12 }}
                                        tickFormatter={(value) => `${value / 1000}k€`}
                                    />
                                    <Tooltip
                                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                        formatter={(value: number) => [formatCurrency(value), 'Valeur']}
                                    />
                                    <Line
                                        type="monotone"
                                        dataKey="value"
                                        stroke="#3b82f6"
                                        strokeWidth={3}
                                        dot={{ r: 4, fill: '#3b82f6', strokeWidth: 2, stroke: '#fff' }}
                                        activeDot={{ r: 6, strokeWidth: 0 }}
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

                {/* Asset Allocation Chart */}
                <Card className="col-span-2 lg:col-span-1">
                    <CardHeader>
                        <CardTitle>Allocation d'actifs</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center justify-center" style={{ width: '100%', height: 300 }}>
                            <ResponsiveContainer width="100%" height={300}>
                                <RePieChart>
                                    <Pie
                                        data={allocation}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={100}
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        {allocation.map((entry: any, index: number) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        formatter={(value: number) => [`${value}%`, 'Allocation']}
                                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                    />
                                    <Legend
                                        verticalAlign="bottom"
                                        height={36}
                                        iconType="circle"
                                    />
                                </RePieChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Detailed Table Placeholder */}
            <Card>
                <CardHeader>
                    <CardTitle>Détail des positions</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-center py-8 text-muted-foreground">
                        Tableau détaillé des positions à venir...
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
