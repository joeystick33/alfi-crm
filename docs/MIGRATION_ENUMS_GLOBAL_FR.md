# Migration Globale des Enums vers FR Uniforme

## Principe
- **Valeurs IDENTIQUES** partout: Frontend = Prisma = Supabase
- **Plus de mapping** entre les couches
- **Valeurs françaises** lisibles et cohérentes

---

## CATÉGORIE 1: Enums Client/Patrimoine (PRIORITÉ HAUTE)

### MaritalStatus → SituationMatrimoniale
| Actuel (EN) | Nouveau (FR) | Label UI |
|-------------|--------------|----------|
| SINGLE | CELIBATAIRE | Célibataire |
| MARRIED | MARIE | Marié(e) |
| DIVORCED | DIVORCE | Divorcé(e) |
| WIDOWED | VEUF | Veuf/Veuve |
| PACS | PACSE | Pacsé(e) |
| COHABITATION | CONCUBINAGE | Concubinage |

### InvestmentHorizon → HorizonInvestissement
| Actuel (EN) | Nouveau (FR) | Label UI |
|-------------|--------------|----------|
| SHORT | COURT | Court terme (&lt;3 ans) |
| MEDIUM | MOYEN | Moyen terme (3-8 ans) |
| LONG | LONG | Long terme (&gt;8 ans) |

### ClientStatus → StatutClient
| Actuel (EN) | Nouveau (FR) | Label UI |
|-------------|--------------|----------|
| PROSPECT | PROSPECT | Prospect |
| ACTIVE | ACTIF | Client actif |
| INACTIVE | INACTIF | Client inactif |
| ARCHIVED | ARCHIVE | Archivé |
| LOST | PERDU | Perdu |

### KYCStatus → StatutKYC
| Actuel (EN) | Nouveau (FR) | Label UI |
|-------------|--------------|----------|
| PENDING | EN_ATTENTE | En attente |
| IN_PROGRESS | EN_COURS | En cours |
| COMPLETED | COMPLET | Complet |
| EXPIRED | EXPIRE | Expiré |
| REJECTED | REJETE | Rejeté |

---

## CATÉGORIE 2: Actifs (66 valeurs)

### ActifType → TypeActif
| Actuel (EN) | Nouveau (FR) | Catégorie |
|-------------|--------------|-----------|
| REAL_ESTATE_MAIN | RESIDENCE_PRINCIPALE | Immobilier |
| REAL_ESTATE_RENTAL | IMMOBILIER_LOCATIF | Immobilier |
| REAL_ESTATE_SECONDARY | RESIDENCE_SECONDAIRE | Immobilier |
| REAL_ESTATE_COMMERCIAL | IMMOBILIER_COMMERCIAL | Immobilier |
| SCPI | SCPI | Immobilier |
| SCI | SCI | Immobilier |
| OPCI | OPCI | Immobilier |
| CROWDFUNDING_IMMO | CROWDFUNDING_IMMO | Immobilier |
| VIAGER | VIAGER | Immobilier |
| NUE_PROPRIETE | NUE_PROPRIETE | Immobilier |
| USUFRUIT | USUFRUIT | Immobilier |
| PEE | PEE | Épargne salariale |
| PEG | PEG | Épargne salariale |
| PERCO | PERCO | Épargne salariale |
| PERECO | PERECO | Épargne salariale |
| CET | CET | Épargne salariale |
| PARTICIPATION | PARTICIPATION | Épargne salariale |
| INTERESSEMENT | INTERESSEMENT | Épargne salariale |
| STOCK_OPTIONS | STOCK_OPTIONS | Épargne salariale |
| ACTIONS_GRATUITES | ACTIONS_GRATUITES | Épargne salariale |
| BSPCE | BSPCE | Épargne salariale |
| PER | PER | Épargne retraite |
| PERP | PERP | Épargne retraite |
| MADELIN | MADELIN | Épargne retraite |
| ARTICLE_83 | ARTICLE_83 | Épargne retraite |
| PREFON | PREFON | Épargne retraite |
| COREM | COREM | Épargne retraite |
| LIFE_INSURANCE | ASSURANCE_VIE | Financier |
| CAPITALIZATION_CONTRACT | CONTRAT_CAPITALISATION | Financier |
| SECURITIES_ACCOUNT | COMPTE_TITRES | Financier |
| PEA | PEA | Financier |
| PEA_PME | PEA_PME | Financier |
| BANK_ACCOUNT | COMPTE_BANCAIRE | Bancaire |
| SAVINGS_ACCOUNT | LIVRETS | Bancaire |
| PEL | PEL | Bancaire |
| CEL | CEL | Bancaire |
| TERM_DEPOSIT | COMPTE_A_TERME | Bancaire |
| COMPANY_SHARES | PARTS_SOCIALES | Professionnel |
| PROFESSIONAL_REAL_ESTATE | IMMOBILIER_PRO | Professionnel |
| PROFESSIONAL_EQUIPMENT | MATERIEL_PRO | Professionnel |
| GOODWILL | FONDS_COMMERCE | Professionnel |
| PATENTS_IP | BREVETS_PI | Professionnel |
| PRECIOUS_METALS | METAUX_PRECIEUX | Mobilier |
| JEWELRY | BIJOUX | Mobilier |
| ART_COLLECTION | OEUVRES_ART | Mobilier |
| WINE_COLLECTION | VINS | Mobilier |
| WATCHES | MONTRES | Mobilier |
| VEHICLES | VEHICULES | Mobilier |
| FURNITURE | MOBILIER | Mobilier |
| CRYPTO | CRYPTO | Mobilier |
| NFT | NFT | Mobilier |
| OTHER | AUTRE | Autre |

---

## CATÉGORIE 3: Passifs (14 valeurs)

### PassifType → TypePassif
| Actuel (EN) | Nouveau (FR) | Label UI |
|-------------|--------------|----------|
| MORTGAGE | CREDIT_IMMOBILIER | Crédit immobilier |
| MORTGAGE_PTZ | PTZ | Prêt à taux zéro |
| MORTGAGE_ACTION_LOG | PRET_ACTION_LOGEMENT | Prêt Action Logement |
| CONSUMER_LOAN | CREDIT_CONSOMMATION | Crédit consommation |
| CAR_LOAN | CREDIT_AUTO | Crédit auto |
| STUDENT_LOAN | PRET_ETUDIANT | Prêt étudiant |
| PROFESSIONAL_LOAN | PRET_PROFESSIONNEL | Prêt professionnel |
| REVOLVING_CREDIT | CREDIT_REVOLVING | Crédit revolving |
| BRIDGE_LOAN | PRET_RELAIS | Prêt relais |
| IN_FINE_LOAN | PRET_IN_FINE | Prêt in fine |
| FAMILY_LOAN | PRET_FAMILIAL | Prêt familial |
| OVERDRAFT | DECOUVERT | Découvert bancaire |
| LEASING | LEASING | Leasing / LOA |
| OTHER | AUTRE | Autre |

---

## CATÉGORIE 4: Contrats (9 valeurs)

### ContratType → TypeContrat
| Actuel (EN) | Nouveau (FR) | Label UI |
|-------------|--------------|----------|
| LIFE_INSURANCE | ASSURANCE_VIE | Assurance-vie |
| HEALTH_INSURANCE | MUTUELLE | Mutuelle santé |
| HOME_INSURANCE | ASSURANCE_HABITATION | Assurance habitation |
| CAR_INSURANCE | ASSURANCE_AUTO | Assurance auto |
| PROFESSIONAL_INSURANCE | ASSURANCE_PRO | Assurance professionnelle |
| DEATH_INSURANCE | ASSURANCE_DECES | Assurance décès |
| DISABILITY_INSURANCE | PREVOYANCE | Prévoyance |
| RETIREMENT_SAVINGS | EPARGNE_RETRAITE | Épargne retraite |
| OTHER | AUTRE | Autre |

### ContratStatus → StatutContrat
| Actuel (EN) | Nouveau (FR) | Label UI |
|-------------|--------------|----------|
| ACTIVE | ACTIF | Actif |
| SUSPENDED | SUSPENDU | Suspendu |
| TERMINATED | RESILIE | Résilié |
| EXPIRED | EXPIRE | Expiré |

---

## CATÉGORIE 5: Documents (21 valeurs)

### DocumentType → TypeDocument
| Actuel (EN) | Nouveau (FR) | Label UI |
|-------------|--------------|----------|
| ID_CARD | CARTE_IDENTITE | Carte d'identité |
| PASSPORT | PASSEPORT | Passeport |
| PROOF_OF_ADDRESS | JUSTIFICATIF_DOMICILE | Justificatif de domicile |
| TAX_NOTICE | AVIS_IMPOSITION | Avis d'imposition |
| BANK_STATEMENT | RELEVE_BANCAIRE | Relevé bancaire |
| PROPERTY_DEED | TITRE_PROPRIETE | Titre de propriété |
| LOAN_AGREEMENT | CONTRAT_PRET | Contrat de prêt |
| INSURANCE_POLICY | CONTRAT_ASSURANCE | Contrat d'assurance |
| INVESTMENT_STATEMENT | RELEVE_PLACEMENT | Relevé de placement |
| ENTRY_AGREEMENT | CONVENTION_ENTREE | Convention d'entrée |
| MISSION_LETTER | LETTRE_MISSION | Lettre de mission |
| ADEQUACY_DECLARATION | DECLARATION_ADEQUATION | Déclaration d'adéquation |
| INVESTOR_PROFILE | PROFIL_INVESTISSEUR | Profil investisseur |
| ANNUAL_REPORT | RAPPORT_ANNUEL | Rapport annuel |
| EMAIL_ATTACHMENT | PIECE_JOINTE_EMAIL | Pièce jointe email |
| MEETING_MINUTES | COMPTE_RENDU_RDV | Compte-rendu RDV |
| PROPOSAL | PROPOSITION | Proposition |
| CONTRACT | CONTRAT | Contrat |
| INVOICE | FACTURE | Facture |
| OTHER | AUTRE | Autre |

---

## CATÉGORIE 6: Objectifs & Projets

### ObjectifType → TypeObjectif
| Actuel (EN) | Nouveau (FR) | Label UI |
|-------------|--------------|----------|
| RETIREMENT | RETRAITE | Préparation retraite |
| REAL_ESTATE_PURCHASE | ACHAT_IMMOBILIER | Achat immobilier |
| EDUCATION | ETUDES | Financement études |
| WEALTH_TRANSMISSION | TRANSMISSION | Transmission patrimoine |
| TAX_OPTIMIZATION | OPTIMISATION_FISCALE | Optimisation fiscale |
| INCOME_GENERATION | REVENUS_COMPLEMENTAIRES | Revenus complémentaires |
| CAPITAL_PROTECTION | PROTECTION_CAPITAL | Protection du capital |
| OTHER | AUTRE | Autre |

### ProjetType → TypeProjet
| Actuel (EN) | Nouveau (FR) | Label UI |
|-------------|--------------|----------|
| REAL_ESTATE_PURCHASE | ACHAT_IMMOBILIER | Achat immobilier |
| BUSINESS_CREATION | CREATION_ENTREPRISE | Création entreprise |
| RETIREMENT_PREPARATION | PREPARATION_RETRAITE | Préparation retraite |
| WEALTH_RESTRUCTURING | RESTRUCTURATION_PATRIMOINE | Restructuration patrimoine |
| TAX_OPTIMIZATION | OPTIMISATION_FISCALE | Optimisation fiscale |
| SUCCESSION_PLANNING | PLANIFICATION_SUCCESSION | Planification succession |
| OTHER | AUTRE | Autre |

---

## CATÉGORIE 7: Tâches & Rendez-vous

### TacheType → TypeTache
| Actuel (EN) | Nouveau (FR) | Label UI |
|-------------|--------------|----------|
| CALL | APPEL | Appel téléphonique |
| EMAIL | EMAIL | Email |
| MEETING | REUNION | Réunion |
| DOCUMENT_REVIEW | REVUE_DOCUMENTS | Revue documents |
| KYC_UPDATE | MISE_A_JOUR_KYC | Mise à jour KYC |
| CONTRACT_RENEWAL | RENOUVELLEMENT_CONTRAT | Renouvellement contrat |
| FOLLOW_UP | SUIVI | Suivi |
| ADMINISTRATIVE | ADMINISTRATIF | Administratif |
| OTHER | AUTRE | Autre |

### TacheStatus → StatutTache
| Actuel (EN) | Nouveau (FR) | Label UI |
|-------------|--------------|----------|
| TODO | A_FAIRE | À faire |
| IN_PROGRESS | EN_COURS | En cours |
| COMPLETED | TERMINE | Terminé |
| CANCELLED | ANNULE | Annulé |

### RendezVousType → TypeRendezVous
| Actuel (EN) | Nouveau (FR) | Label UI |
|-------------|--------------|----------|
| FIRST_MEETING | PREMIER_RDV | Premier rendez-vous |
| FOLLOW_UP | SUIVI | Suivi |
| ANNUAL_REVIEW | BILAN_ANNUEL | Bilan annuel |
| SIGNING | SIGNATURE | Signature |
| PHONE_CALL | APPEL_TEL | Appel téléphonique |
| VIDEO_CALL | VISIO | Visioconférence |
| OTHER | AUTRE | Autre |

### RendezVousStatus → StatutRendezVous
| Actuel (EN) | Nouveau (FR) | Label UI |
|-------------|--------------|----------|
| SCHEDULED | PLANIFIE | Planifié |
| CONFIRMED | CONFIRME | Confirmé |
| COMPLETED | TERMINE | Terminé |
| CANCELLED | ANNULE | Annulé |
| NO_SHOW | ABSENT | Absent |

---

## CATÉGORIE 8: Priorités & Statuts génériques

### ObjectifPriority, TachePriority → Priorite
| Actuel (EN) | Nouveau (FR) | Label UI |
|-------------|--------------|----------|
| LOW | BASSE | Basse |
| MEDIUM | MOYENNE | Moyenne |
| HIGH | HAUTE | Haute |
| CRITICAL/URGENT | URGENTE | Urgente |

### Statuts génériques
| Actuel (EN) | Nouveau (FR) | Label UI |
|-------------|--------------|----------|
| ACTIVE | ACTIF | Actif |
| ACHIEVED | ATTEINT | Atteint |
| CANCELLED | ANNULE | Annulé |
| ON_HOLD | EN_PAUSE | En pause |
| PLANNED | PLANIFIE | Planifié |
| IN_PROGRESS | EN_COURS | En cours |
| COMPLETED | TERMINE | Terminé |

---

## Enums NON MIGRÉS (conservent les valeurs EN)

Ces enums sont techniques ou standards et n'ont pas besoin d'être traduits:
- `EmailStatus`, `EmailDirection` (standards SMTP)
- `SignatureProvider`, `SignatureStatus` (intégrations tierces)
- `CalendarProvider` (Google, Outlook)
- `WebhookStatus` (technique)
- `SaaSInvoiceStatus`, `PaymentMethod` (standards financiers)

---

## Commandes d'exécution

```bash
# 1. Mettre à jour Prisma et exécuter la migration
npx prisma db execute --schema ./prisma/schema.prisma --file ./scripts/migrate-all-enums-fr.sql

# 2. Régénérer les types
npx prisma generate

# 3. Redémarrer le serveur
npm run dev
```
