"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Command as CommandPrimitive } from "cmdk"
import { Search, Calculator, User, LayoutDashboard, FileText, Settings, Moon, Sun, CreditCard } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

export function CommandPalette() {
    const router = useRouter()
    const [open, setOpen] = React.useState(false)

    React.useEffect(() => {
        const down = (e: KeyboardEvent) => {
            if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
                e.preventDefault()
                setOpen((open) => !open)
            }
        }
        document.addEventListener("keydown", down)
        return () => document.removeEventListener("keydown", down)
    }, [])

    const runCommand = React.useCallback((command: () => unknown) => {
        setOpen(false)
        command()
    }, [])

    return (
        <AnimatePresence>
            {open && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
                    onClick={() => setOpen(false)}
                >
                    <motion.div
                        initial={{ scale: 0.95, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.95, opacity: 0 }}
                        className="w-full max-w-2xl overflow-hidden rounded-xl border border-white/10 bg-[#0F111A] shadow-2xl shadow-indigo-500/10"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <CommandPrimitive className="flex h-full w-full flex-col overflow-hidden rounded-xl bg-transparent text-slate-100">
                            <div className="flex items-center border-b border-white/5 px-4" cmdk-input-wrapper="">
                                <Search className="mr-2 h-5 w-5 shrink-0 text-slate-500" />
                                <CommandPrimitive.Input
                                    placeholder="Rechercher un client, une page, un outil..."
                                    className="flex h-12 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-slate-500 disabled:cursor-not-allowed disabled:opacity-50"
                                    autoFocus
                                />
                            </div>
                            <CommandPrimitive.List className="max-h-[300px] overflow-y-auto overflow-x-hidden p-2">
                                <CommandPrimitive.Empty className="py-6 text-center text-sm text-slate-500">
                                    Aucun résultat trouvé.
                                </CommandPrimitive.Empty>

                                <CommandPrimitive.Group heading="Navigation Rapide" className="text-xs font-medium text-slate-500 px-2 py-1.5 mb-2">
                                    <Item icon={LayoutDashboard} onSelect={() => runCommand(() => router.push('/dashboard'))}>
                                        Tableau de bord
                                    </Item>
                                    <Item icon={User} onSelect={() => runCommand(() => router.push('/dashboard/clients'))}>
                                        Clients & Prospects
                                    </Item>
                                    <Item icon={FileText} onSelect={() => runCommand(() => router.push('/dashboard/documents'))}>
                                        Documents
                                    </Item>
                                    <Item icon={CreditCard} onSelect={() => runCommand(() => router.push('/dashboard/patrimoine'))}>
                                        Patrimoine
                                    </Item>
                                </CommandPrimitive.Group>

                                <CommandPrimitive.Group heading="Outils & Simulateurs" className="text-xs font-medium text-slate-500 px-2 py-1.5 mb-2">
                                    <Item icon={Calculator} onSelect={() => runCommand(() => router.push('/dashboard/simulators/pinel'))}>
                                        Simulateur Pinel
                                    </Item>
                                    <Item icon={Calculator} onSelect={() => runCommand(() => router.push('/dashboard/simulators/assurance-vie'))}>
                                        Simulateur Assurance Vie
                                    </Item>
                                    <Item icon={Calculator} onSelect={() => runCommand(() => router.push('/dashboard/simulators/sci'))}>
                                        Simulateur SCI
                                    </Item>
                                </CommandPrimitive.Group>

                                <CommandPrimitive.Group heading="Système" className="text-xs font-medium text-slate-500 px-2 py-1.5 mb-2">
                                    <Item icon={Settings} onSelect={() => runCommand(() => router.push('/settings'))}>
                                        Paramètres
                                    </Item>
                                    <Item icon={Moon} onSelect={() => runCommand(() => { })}>
                                        Thème Sombre (Actif)
                                    </Item>
                                </CommandPrimitive.Group>

                            </CommandPrimitive.List>
                        </CommandPrimitive>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    )
}

function Item({ children, icon: Icon, onSelect }: { children: React.ReactNode; icon: any; onSelect: () => void }) {
    return (
        <CommandPrimitive.Item
            onSelect={onSelect}
            className="relative flex cursor-default select-none items-center rounded-lg px-2 py-2 text-sm outline-none bg-transparent hover:bg-white/5 aria-selected:bg-white/10 aria-selected:text-white text-slate-300 transition-colors data-[disabled]:pointer-events-none data-[disabled]:opacity-50"
        >
            <Icon className="mr-2 h-4 w-4" />
            <span>{children}</span>
        </CommandPrimitive.Item>
    )
}
