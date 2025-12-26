'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/app/_common/components/ui/Button'
import { Input } from '@/app/_common/components/ui/Input'
import { Label } from '@/app/_common/components/ui/Label'
import { useToast } from '@/app/_common/hooks/use-toast'
import { Loader2, ArrowRight } from 'lucide-react'
import { motion } from 'framer-motion'
import Link from 'next/link'

// Schéma de validation
const registerSchema = z.object({
    fullName: z.string().min(2, 'Le nom complet est requis'),
    email: z.string().min(1, 'L\'email est requis').email('Email invalide'),
    companyName: z.string().min(2, 'Le nom du cabinet est requis'),
    password: z.string().min(8, 'Le mot de passe doit faire au moins 8 caractères'),
})

type RegisterFormValues = z.infer<typeof registerSchema>

export function RegisterForm() {
    const [isLoading, setIsLoading] = useState(false)
    const [focusedField, setFocusedField] = useState<string | null>(null)
    const router = useRouter()
    const { toast } = useToast()

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<RegisterFormValues>({
        resolver: zodResolver(registerSchema),
        defaultValues: {
            fullName: '',
            email: '',
            companyName: '',
            password: '',
        },
    })

    const onSubmit = async (values: RegisterFormValues) => {
        setIsLoading(true)

        // Simulation d'inscription pour l'instant (à connecter avec le backend réel)
        try {
            await new Promise(resolve => setTimeout(resolve, 1500)) // Fake delay
            
            toast({
                title: 'Demande envoyée',
                description: 'Votre demande d\'accès a été reçue. Un administrateur vous contactera bientôt.',
                variant: 'success',
            })

            router.push('/login')
        } catch (error) {
            toast({
                title: 'Erreur',
                description: 'Une erreur est survenue lors de l\'inscription.',
                variant: 'destructive',
            })
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <motion.form 
            onSubmit={handleSubmit(onSubmit)} 
            className="space-y-5"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
        >
            <div className="space-y-4">
                {/* Full Name */}
                <motion.div 
                    className="space-y-2"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 }}
                >
                    <Label htmlFor="fullName" className="text-slate-700 font-medium ml-1">Nom complet</Label>
                    <div className="relative group">
                        <Input
                            id="fullName"
                            placeholder="Jean Dupont"
                            {...register('fullName')}
                            disabled={isLoading}
                            className={`h-11 rounded-xl bg-white border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-[#7373FF] focus:ring-1 focus:ring-[#7373FF] transition-all pl-4 ${errors.fullName ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'hover:border-slate-300'}`}
                        />
                    </div>
                    {errors.fullName && (
                        <p className="text-sm text-red-500 ml-1">{errors.fullName.message}</p>
                    )}
                </motion.div>

                {/* Email */}
                <motion.div 
                    className="space-y-2"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.25 }}
                >
                    <Label htmlFor="email" className="text-slate-700 font-medium ml-1">Email professionnel</Label>
                    <div className="relative group">
                        <Input
                            id="email"
                            type="email"
                            placeholder="nom@cabinet.com"
                            {...register('email')}
                            disabled={isLoading}
                            className={`h-11 rounded-xl bg-white border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-[#7373FF] focus:ring-1 focus:ring-[#7373FF] transition-all pl-4 ${errors.email ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'hover:border-slate-300'}`}
                        />
                    </div>
                    {errors.email && (
                        <p className="text-sm text-red-500 ml-1">{errors.email.message}</p>
                    )}
                </motion.div>

                {/* Company Name */}
                <motion.div 
                    className="space-y-2"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 }}
                >
                    <Label htmlFor="companyName" className="text-slate-700 font-medium ml-1">Nom du cabinet</Label>
                    <div className="relative group">
                        <Input
                            id="companyName"
                            placeholder="Dupont Patrimoine"
                            {...register('companyName')}
                            disabled={isLoading}
                            className={`h-11 rounded-xl bg-white border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-[#7373FF] focus:ring-1 focus:ring-[#7373FF] transition-all pl-4 ${errors.companyName ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'hover:border-slate-300'}`}
                        />
                    </div>
                    {errors.companyName && (
                        <p className="text-sm text-red-500 ml-1">{errors.companyName.message}</p>
                    )}
                </motion.div>

                {/* Password */}
                <motion.div 
                    className="space-y-2"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.35 }}
                >
                    <Label htmlFor="password" className="text-slate-700 font-medium ml-1">Mot de passe</Label>
                    <div className="relative group">
                        <Input
                            id="password"
                            type="password"
                            placeholder="Minimum 8 caractères"
                            {...register('password')}
                            disabled={isLoading}
                            className={`h-11 rounded-xl bg-white border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-[#7373FF] focus:ring-1 focus:ring-[#7373FF] transition-all pl-4 ${errors.password ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'hover:border-slate-300'}`}
                        />
                    </div>
                    {errors.password && (
                        <p className="text-sm text-red-500 ml-1">{errors.password.message}</p>
                    )}
                </motion.div>
            </div>

            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="pt-2"
            >
                <Button 
                    type="submit" 
                    className="w-full h-12 bg-[#7373FF] hover:bg-[#5c5ce6] text-white font-medium rounded-xl transition-all shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/40 relative overflow-hidden group" 
                    disabled={isLoading}
                >
                    <span className="relative z-10 flex items-center justify-center gap-2">
                        {isLoading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Traitement...
                            </>
                        ) : (
                            <>
                                Commencer l'essai gratuit
                                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                            </>
                        )}
                    </span>
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                </Button>
                <p className="text-xs text-center text-gray-500 mt-4 px-4">
                    En cliquant sur "Commencer", vous acceptez nos <Link href="#" className="underline">CGU</Link> et notre <Link href="#" className="underline">Politique de confidentialité</Link>.
                </p>
            </motion.div>
        </motion.form>
    )
}
