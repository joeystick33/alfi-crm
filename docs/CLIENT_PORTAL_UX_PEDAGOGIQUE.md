# Propositions UX Pédagogiques - Portail Client

> Ce document présente les recommandations pour rendre l'interface client plus accessible et pédagogique. 
> Les clients ne sont pas des professionnels de la finance - l'interface doit les guider, les rassurer et les éduquer.

---

## 🎯 Principes Fondamentaux

### 1. Langage Simple et Accessible
- **Éviter le jargon financier** : Remplacer les termes techniques par des équivalents compréhensibles
- **Phrases courtes** : Maximum 2 lignes par explication
- **Ton rassurant** : Utiliser "vous", "votre", formulations positives

### 2. Aide Contextuelle Permanente
- **Info-boxes bleues** : Explications générales en haut de chaque page
- **Tooltips** : Sur chaque terme technique (icône `?`)
- **FAQ intégrée** : Questions fréquentes dans chaque section

### 3. Visualisation Intuitive
- **Barres de progression** : Pour les objectifs et l'épargne
- **Codes couleurs cohérents** : Vert = positif, Bleu = info, Ambre = attention, Rouge = important
- **Icônes explicites** : Accompagnées de labels texte

---

## 📋 Propositions Détaillées par Section

### Dashboard (Tableau de Bord)

**Implémenté :**
- ✅ Message d'accueil personnalisé avec prénom
- ✅ Chiffres clés en grand format
- ✅ Prochain RDV mis en avant
- ✅ Actions rapides accessibles

**À améliorer :**
| Élément | Amélioration proposée |
|---------|----------------------|
| Patrimoine net | Ajouter tooltip "Ce montant représente ce que vous possédez (actifs) moins ce que vous devez (crédits)" |
| Évolution % | Ajouter "Par rapport à l'année dernière" ou la période concernée |
| Objectifs | Ajouter encouragement "Vous avancez bien !" ou "Continuez vos efforts" |

**Nouvelles fonctionnalités suggérées :**
1. **Widget "Le saviez-vous ?"** : Conseil financier du jour en langage simple
2. **Indicateur météo financière** : ☀️ Tout va bien / 🌤️ À surveiller / ⛈️ Action nécessaire
3. **Timeline simplifiée** : "Ce qui s'est passé ce mois-ci" avec icônes

---

### Mon Patrimoine

**Implémenté :**
- ✅ Distinction claire Actifs / Passifs
- ✅ Répartition visuelle par catégorie
- ✅ Onglets pour navigation

**À améliorer :**
| Élément | Amélioration proposée |
|---------|----------------------|
| Actifs/Passifs | Définir ces termes : "Actifs = Ce que vous possédez", "Passifs = Vos crédits en cours" |
| Catégories | Ajouter description au survol : "Immobilier : vos biens (maisons, appartements)" |
| Évolution | Graphique simple montrant l'évolution sur 12 mois |

**Nouvelles fonctionnalités suggérées :**
1. **Vue "Puzzle"** : Représentation visuelle du patrimoine en blocs proportionnels
2. **Comparateur temporel** : "Il y a 1 an, vous aviez X€. Aujourd'hui : Y€"
3. **Explication des variations** : "Votre patrimoine a augmenté grâce à..."

---

### Mes Objectifs

**Implémenté :**
- ✅ Explications par type d'objectif
- ✅ Barres de progression avec montants
- ✅ Distinction objectifs/projets
- ✅ Conseils personnalisés

**À améliorer :**
| Élément | Amélioration proposée |
|---------|----------------------|
| Progression | Ajouter jalons : "25% - Premier quart !", "50% - À mi-chemin !" |
| Horizon | Afficher en années restantes ET en date : "Dans 15 ans (2040)" |
| Versements | Simulateur : "Si vous versez 100€ de plus/mois, vous atteindrez votre objectif 2 ans plus tôt" |

**Nouvelles fonctionnalités suggérées :**
1. **Célébration des étapes** : Animation/message quand un palier est atteint
2. **Rappel de motivation** : "Pourquoi cet objectif est important pour vous"
3. **Scénarios alternatifs** : "Que se passe-t-il si je verse plus/moins ?"

---

### Mes Contrats

**Implémenté :**
- ✅ Explication de chaque type de contrat
- ✅ Avantages listés clairement
- ✅ Performance visible
- ✅ Alertes échéances

**À améliorer :**
| Élément | Amélioration proposée |
|---------|----------------------|
| Performance | Contextualiser : "+8% c'est bien ? Oui, la moyenne est de 4%" |
| Compagnie | Ajouter note de confiance ou ancienneté : "Generali - Leader européen" |
| Frais | Section "Comprendre les frais" (optionnel, accessible sur demande) |

**Nouvelles fonctionnalités suggérées :**
1. **Frise chronologique** : Historique du contrat depuis l'ouverture
2. **Comparaison** : "Votre contrat vs marché" (si pertinent)
3. **Prochaines étapes** : "Dans 2 ans, votre PEA aura 5 ans = fiscalité avantageuse"

---

### Mes Documents

**Implémenté :**
- ✅ Filtrage par catégorie
- ✅ Recherche
- ✅ Téléchargement facile

**À améliorer :**
| Élément | Amélioration proposée |
|---------|----------------------|
| Catégories | Renommer en français simple : "Relevés de compte", "Documents fiscaux", "Contrats signés" |
| Documents | Ajouter description : "À quoi sert ce document ?" |
| Nouveaux | Badge "Nouveau" persistant 7 jours |

**Nouvelles fonctionnalités suggérées :**
1. **Checklist fiscale** : "Pour votre déclaration, vous aurez besoin de..." avec liens directs
2. **Organisation automatique** : Vue "Pour ma déclaration 2024" / "Mes contrats" / "Mes relevés"
3. **Prévisualisation** : Voir le PDF sans télécharger

---

### Mes Rendez-vous

**Implémenté :**
- ✅ Explication des types de RDV
- ✅ Conseils de préparation
- ✅ Choix de créneaux multiples

**À améliorer :**
| Élément | Amélioration proposée |
|---------|----------------------|
| Préparation | Checklist interactive : ☐ J'ai préparé mes questions ☐ J'ai mes documents |
| Visio | Bouton "Tester ma connexion" avant le jour J |
| Rappels | Option SMS/email de rappel à J-1 et H-1 |

**Nouvelles fonctionnalités suggérées :**
1. **Guide de préparation PDF** : Téléchargeable, personnalisé selon le type de RDV
2. **Questions types** : Liste de questions à poser selon le sujet
3. **Compte-rendu** : Résumé du RDV accessible après (rédigé par le conseiller)

---

### Messages

**Implémenté :**
- ✅ Délai de réponse affiché
- ✅ FAQ intégrée
- ✅ Coordonnées conseiller

**À améliorer :**
| Élément | Amélioration proposée |
|---------|----------------------|
| Nouveau message | Sujets pré-définis : "Question sur mon épargne", "Demander un document", "Signaler un changement" |
| Réponse | Accusé de réception automatique : "Votre message a été reçu, réponse sous 48h" |
| Urgence | Option "Urgent" avec explication de quand l'utiliser |

**Nouvelles fonctionnalités suggérées :**
1. **Modèles de messages** : Pré-remplis pour les demandes courantes
2. **Pièces jointes** : Possibilité d'envoyer un document
3. **Historique thématique** : Regrouper les échanges par sujet

---

### Mon Profil

**Implémenté :**
- ✅ Distinction données modifiables / non modifiables
- ✅ Explication de l'importance des infos à jour

**À améliorer :**
| Élément | Amélioration proposée |
|---------|----------------------|
| Modifications | Confirmation visuelle après enregistrement |
| Données sensibles | Expliquer pourquoi certaines données ne sont pas modifiables en ligne |
| Famille | Permettre de signaler un changement (naissance, mariage...) |

**Nouvelles fonctionnalités suggérées :**
1. **Rappel annuel** : "Vos informations sont-elles toujours à jour ?"
2. **Historique** : "Dernière mise à jour le..."
3. **Événements de vie** : Bouton "Signaler un changement" avec formulaire guidé

---

## 🎨 Composants Pédagogiques à Créer

### 1. `<ExplainerCard />`
Carte d'explication contextuelle avec :
- Titre avec icône ℹ️
- Texte explicatif court
- Lien "En savoir plus" optionnel

### 2. `<TermTooltip />`
Tooltip sur les termes techniques :
```tsx
<TermTooltip term="PER">
  Plan d'Épargne Retraite : une épargne pour votre retraite avec avantages fiscaux
</TermTooltip>
```

### 3. `<ProgressMilestone />`
Barre de progression avec jalons et encouragements :
- 0-25% : "Bon début !"
- 25-50% : "Vous progressez !"
- 50-75% : "Plus de la moitié !"
- 75-99% : "Presque là !"
- 100% : "Objectif atteint ! 🎉"

### 4. `<GuidedTour />`
Tour guidé pour les nouveaux utilisateurs :
- Étape par étape
- Possibilité de passer
- Mémorise si déjà vu

### 5. `<SimpleChart />`
Graphiques simplifiés :
- Pas plus de 5 données
- Légende claire
- Tooltip explicatif

---

## 📱 Considérations Mobile

1. **Navigation** : Menu hamburger avec icônes + labels
2. **Scroll** : Éviter les tableaux, préférer les cartes empilées
3. **Actions** : Boutons assez grands (min 44px)
4. **Texte** : Taille min 16px pour la lisibilité

---

## 🔔 Système de Notifications Pédagogiques

### Types de notifications avec contexte :

| Type | Message classique | Version pédagogique |
|------|-------------------|---------------------|
| Document | "Nouveau document" | "📄 Votre relevé trimestriel est disponible. Il résume l'évolution de votre épargne ces 3 derniers mois." |
| RDV | "Rappel RDV" | "📅 Rappel : rendez-vous demain à 14h. Pensez à préparer vos questions !" |
| Objectif | "Objectif atteint" | "🎯 Félicitations ! Vous avez atteint votre objectif d'épargne de précaution. Parlons de la suite avec votre conseiller." |

---

## 📊 Métriques de Succès

Pour mesurer l'efficacité des améliorations pédagogiques :

1. **Taux de connexion** : Fréquence des visites sur le portail
2. **Temps passé** : Durée moyenne par session
3. **Taux d'interaction** : Clics sur les tooltips/explications
4. **Questions conseiller** : Réduction des questions basiques
5. **Satisfaction** : Enquête NPS intégrée

---

## 🚀 Priorisation

### Phase 1 (Immédiat) ✅
- Info-boxes sur chaque page
- Tooltips sur termes clés
- Messages d'encouragement objectifs

### Phase 2 (Court terme)
- Tour guidé nouveaux utilisateurs
- Composant TermTooltip
- Graphiques simplifiés

### Phase 3 (Moyen terme)
- Notifications contextuelles enrichies
- Simulateurs interactifs
- Compte-rendus RDV

### Phase 4 (Long terme)
- Chatbot d'aide
- Vidéos explicatives
- Personnalisation par profil client

---

*Document créé le 26/11/2024 - À mettre à jour selon les retours utilisateurs*
