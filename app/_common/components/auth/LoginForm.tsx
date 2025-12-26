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
import { ForgotPasswordForm } from './ForgotPasswordForm'
import { motion, AnimatePresence } from 'framer-motion'

// Schéma de validation
const loginSchema = z.object({
    email: z.string().min(1, 'L\'email est requis').email('Email invalide'),
    password: z.string().min(1, 'Le mot de passe est requis').min(6, 'Le mot de passe doit faire au moins 6 caractères'),
})

type LoginFormValues = z.infer<typeof loginSchema>

export function LoginForm() {
    const [isLoading, setIsLoading] = useState(false)
    const [showForgotPassword, setShowForgotPassword] = useState(false)
    const [focusedField, setFocusedField] = useState<string | null>(null)
    const router = useRouter()
    const { toast } = useToast()

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<LoginFormValues>({
        resolver: zodResolver(loginSchema),
        defaultValues: {
            email: '',
            password: '',
        },
    })

    const onSubmit = async (values: LoginFormValues) => {
        setIsLoading(true)

        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify(values),
            })

            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.error || 'Identifiants invalides')
            }

            toast({
                title: 'Connexion réussie',
                description: 'Bienvenue sur Aura',
                variant: 'success',
            })

            let redirectUrl = '/dashboard'
            if (data.user?.isSuperAdmin === true) {
                redirectUrl = '/superadmin'
            } else if (data.user?.isClient === true) {
                redirectUrl = '/portal'
            }
            router.push(redirectUrl)
            router.refresh()
        } catch (error) {
            toast({
                title: 'Erreur de connexion',
                description: error instanceof Error ? error.message : 'Identifiants invalides',
                variant: 'destructive',
            })
        } finally {
            setIsLoading(false)
        }
    }

    // Afficher le formulaire de mot de passe oublié
    if (showForgotPassword) {
        return (
            <AnimatePresence mode='wait'>
                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3 }}
                >
                    <ForgotPasswordForm onBack={() => setShowForgotPassword(false)} />
                </motion.div>
            </AnimatePresence>
        )
    }

    return (
        <motion.form 
            onSubmit={handleSubmit(onSubmit)} 
            className="space-y-6"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
        >
            <div className="space-y-4">
                <motion.div 
                    className="space-y-2"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 }}
                >
                    <Label htmlFor="email" className="text-slate-700 font-medium ml-1">Email</Label>
                    <div className="relative group">
                        <Input
                            id="email"
                            type="email"
                            placeholder="nom@exemple.com"
                            {...register('email')}
                            disabled={isLoading}
                            className={`h-12 rounded-xl bg-white border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-[#7373FF] focus:ring-1 focus:ring-[#7373FF] transition-all pl-4 ${errors.email ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'hover:border-slate-300'}`}
                        />
                    </div>
                    {errors.email && (
                        <motion.p 
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            className="text-sm text-red-500 ml-1"
                        >
                            {errors.email.message}
                        </motion.p>
                    )}
                </motion.div>

                <motion.div 
                    className="space-y-2"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 }}
                >
                    <div className="flex items-center justify-between ml-1 mr-1">
                        <Label htmlFor="password" className="text-slate-700 font-medium">Mot de passe</Label>
                        <button
                            type="button"
                            onClick={() => setShowForgotPassword(true)}
                            className="text-sm text-[#7373FF] hover:text-[#5c5ce6] font-medium transition-colors"
                        >
                            Mot de passe oublié ?
                        </button>
                    </div>
                    <div className="relative group">
                        <Input
                            id="password"
                            type="password"
                            placeholder="••••••••"
                            {...register('password')}
                            disabled={isLoading}
                            className={`h-12 rounded-xl bg-white border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-[#7373FF] focus:ring-1 focus:ring-[#7373FF] transition-all pl-4 ${errors.password ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'hover:border-slate-300'}`}
                        />
                    </div>
                    {errors.password && (
                        <motion.p 
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            className="text-sm text-red-500 ml-1"
                        >
                            {errors.password.message}
                        </motion.p>
                    )}
                </motion.div>
            </div>

            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
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
                                Connexion...
                            </>
                        ) : (
                            <>
                                Se connecter
                                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                            </>
                        )}
                    </span>
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                </Button>
            </motion.div>
        </motion.form>
    )
}
