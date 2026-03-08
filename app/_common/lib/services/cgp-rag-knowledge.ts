/**
 * RAG Knowledge Base — Base de connaissances vectorisée pour CGP
 *
 * Système de Retrieval-Augmented Generation spécialisé pour :
 *   - Découverte patrimoniale (5 piliers)
 *   - Réglementation financière française 2025
 *   - Méthodologie d'entretien professionnel
 *   - Alertes et bonnes pratiques
 *
 * Utilise un index TF-IDF simplifié en mémoire pour la recherche sémantique.
 * Pas de dépendance externe — fonctionne offline.
 */

// ── Types ──

export interface KnowledgeChunk {
  id: string
  category: KnowledgeCategory
  subcategory: string
  title: string
  content: string
  keywords: string[]
  /** Questions types associées */
  questions: string[]
  /** Alertes réglementaires associées */
  alerts: string[]
  /** Score de pertinence TF-IDF (calculé dynamiquement) */
  relevanceScore?: number
}

export type KnowledgeCategory =
  | 'situation_familiale'
  | 'situation_matrimoniale'
  | 'situation_professionnelle'
  | 'liberalites'
  | 'patrimoine_immobilier'
  | 'patrimoine_financier'
  | 'assurance_vie'
  | 'prevoyance'
  | 'fiscalite'
  | 'retraite'
  | 'passif'
  | 'objectifs'
  | 'reglementation'
  | 'methodologie'

export interface RAGRetrievalResult {
  chunks: KnowledgeChunk[]
  coveredTopics: string[]
  uncoveredTopics: string[]
  suggestedQuestions: string[]
  alerts: string[]
  completenessScore: number // 0-100
}

// ── Base de connaissances structurée ──

const KNOWLEDGE_BASE: KnowledgeChunk[] = [
  // ═══════════════════════════════════════════════════════════════
  // PILIER 1 — SITUATION FAMILIALE
  // ═══════════════════════════════════════════════════════════════
  {
    id: 'fam-01',
    category: 'situation_familiale',
    subcategory: 'structure_familiale',
    title: 'Structure familiale et composition du foyer',
    content: `La structure familiale est le socle de toute analyse patrimoniale. Elle détermine les droits successoraux (art. 731 et suivants du Code civil), le nombre de parts fiscales (quotient familial), les abattements applicables en matière de donation et succession, et les options de protection du conjoint survivant. Un enfant d'un premier lit modifie fondamentalement la stratégie successorale : il est héritier réservataire et ne peut pas être déshérité (art. 913 CC). La présence de petits-enfants ouvre la voie à des donations transgénérationnelles avec abattement de 31 865 € par petit-enfant tous les 15 ans.`,
    keywords: ['famille', 'enfant', 'fils', 'fille', 'parent', 'petit-enfant', 'grand-parent', 'foyer', 'structure familiale', 'composition', 'fratrie', 'frère', 'sœur'],
    questions: [
      'Comment se compose votre famille ? Combien d\'enfants avez-vous ?',
      'Vos enfants sont-ils tous communs au couple ou avez-vous des enfants d\'une précédente union ?',
      'Quels sont les âges de vos enfants ?',
      'Vos enfants sont-ils autonomes financièrement ?',
      'Êtes-vous grand-parent ? Combien de petits-enfants avez-vous ?',
      'Y a-t-il des personnes à charge dans votre foyer (parents âgés, enfant handicapé) ?',
    ],
    alerts: [
      'Enfant d\'un premier lit = héritier réservataire — impact majeur sur la stratégie successorale',
      'Enfant handicapé : abattement supplémentaire de 159 325 € en donation/succession',
    ],
  },
  {
    id: 'fam-02',
    category: 'situation_familiale',
    subcategory: 'personnes_charge',
    title: 'Enfants à charge et personnes dépendantes',
    content: `Les enfants à charge fiscalement (rattachés au foyer fiscal ou bénéficiant d'une pension alimentaire déductible) impactent directement le quotient familial et donc le montant de l'IR. Un enfant majeur peut être rattaché jusqu'à 21 ans (ou 25 ans s'il poursuit des études). La pension alimentaire versée à un enfant majeur non rattaché est déductible dans la limite de 6 674 € en 2025. Les parents à charge (obligation alimentaire art. 205 CC) et les personnes handicapées au foyer modifient également le nombre de parts fiscales.`,
    keywords: ['charge', 'rattachement', 'pension alimentaire', 'quotient familial', 'parts fiscales', 'étudiant', 'majeur'],
    questions: [
      'Combien d\'enfants sont actuellement rattachés à votre foyer fiscal ?',
      'Versez-vous des pensions alimentaires ? À qui et quel montant ?',
      'Avez-vous des parents âgés dont vous assurez la prise en charge ?',
    ],
    alerts: [
      'Plafonnement du quotient familial : 1 759 € par demi-part en 2025',
      'Pension alimentaire déductible : max 6 674 € par enfant majeur non rattaché',
    ],
  },

  // ═══════════════════════════════════════════════════════════════
  // PILIER 1 bis — SITUATION MATRIMONIALE
  // ═══════════════════════════════════════════════════════════════
  {
    id: 'mat-01',
    category: 'situation_matrimoniale',
    subcategory: 'regime_matrimonial',
    title: 'Régime matrimonial — Principes et impact patrimonial',
    content: `Le régime matrimonial détermine la propriété des biens entre époux et la liquidation en cas de divorce ou décès. Régimes principaux :
- Communauté réduite aux acquêts (régime légal depuis 1966) : biens acquis pendant le mariage = communs, biens antérieurs/reçus par donation ou succession = propres
- Séparation de biens : chaque époux reste propriétaire de ses biens, pas de patrimoine commun
- Communauté universelle : tous les biens sont communs (souvent avec clause d'attribution intégrale au survivant)
- Participation aux acquêts : séparation pendant le mariage, partage de l'enrichissement à la dissolution
Le changement de régime matrimonial est possible par acte notarié (art. 1397 CC), sans délai depuis la loi de 2019, avec homologation judiciaire si enfants mineurs ou opposition des créanciers.`,
    keywords: ['régime matrimonial', 'communauté', 'séparation de biens', 'acquêts', 'mariage', 'époux', 'conjoint', 'notaire', 'contrat de mariage'],
    questions: [
      'Connaissez-vous votre régime matrimonial ?',
      'Avez-vous signé un contrat de mariage devant notaire ?',
      'Avez-vous envisagé de changer de régime matrimonial ?',
      'Connaissez-vous les conséquences de votre régime en cas de décès ?',
    ],
    alerts: [
      'Sans contrat de mariage après 1966 = communauté réduite aux acquêts par défaut',
      'Communauté universelle avec clause d\'attribution intégrale : le conjoint reçoit tout mais les enfants n\'héritent qu\'au second décès — attention à la perte d\'un abattement successoral de 100 000 € par enfant',
    ],
  },
  {
    id: 'mat-02',
    category: 'situation_matrimoniale',
    subcategory: 'protection_conjoint',
    title: 'Protection du conjoint survivant — DDV et avantages matrimoniaux',
    content: `Outils de protection du conjoint :
1. Donation au dernier vivant (DDV) : permet au conjoint survivant de choisir entre la totalité en usufruit, 1/4 en PP + 3/4 en usufruit, ou la quotité disponible en PP. Révocable unilatéralement.
2. Clause de préciput : permet au conjoint de prélever un bien précis avant le partage de la communauté (ex: résidence principale)
3. Clause d'attribution intégrale de la communauté : dans le régime de communauté universelle, tout revient au conjoint
4. Assurance-vie avec clause bénéficiaire en faveur du conjoint : hors succession (art. L132-12 Code assurances)
Le conjoint survivant est exonéré de droits de succession (loi TEPA 2007). Il a des droits légaux : 1/4 en PP ou totalité en usufruit (art. 757 CC) en présence d'enfants communs, ou 1/4 en PP si enfants non communs.`,
    keywords: ['DDV', 'donation au dernier vivant', 'conjoint survivant', 'protection', 'préciput', 'usufruit', 'attribution intégrale', 'clause bénéficiaire'],
    questions: [
      'Avez-vous mis en place une donation au dernier vivant ?',
      'Connaissez-vous les options offertes par la DDV (usufruit, PP, mix) ?',
      'Avez-vous une clause de préciput sur votre résidence principale ?',
      'Vos clauses bénéficiaires d\'assurance-vie sont-elles à jour ?',
    ],
    alerts: [
      'Sans DDV, le conjoint survivant n\'a que des droits légaux limités (1/4 PP avec enfants non communs)',
      'Clause bénéficiaire "mon conjoint" : devient caduque en cas de divorce — préférer nommer la personne',
    ],
  },
  {
    id: 'mat-03',
    category: 'situation_matrimoniale',
    subcategory: 'pacs_union_libre',
    title: 'PACS et union libre — Différences avec le mariage',
    content: `PACS : Régime de séparation de biens par défaut (depuis 2007), possibilité d'opter pour l'indivision. Le partenaire de PACS est exonéré de droits de succession (comme le conjoint marié) mais n'a AUCUN droit successoral automatique — il faut impérativement rédiger un testament. En matière d'IR, imposition commune dès l'année du PACS.
Union libre : Aucun droit successoral, droits de mutation à titre gratuit = 60% (tarif entre non-parents). Aucune protection automatique. L'assurance-vie est le seul outil efficace (art. L132-12 Code assurances, hors succession).`,
    keywords: ['PACS', 'pacsé', 'union libre', 'concubinage', 'concubin', 'testament', 'partenaire'],
    questions: [
      'Êtes-vous marié, pacsé ou en union libre ?',
      'Si pacsé : avez-vous rédigé un testament en faveur de votre partenaire ?',
      'Connaissez-vous les différences de protection entre PACS et mariage ?',
    ],
    alerts: [
      'PACS SANS testament = le partenaire survivant n\'hérite de RIEN (0 droits légaux)',
      'Union libre : droits de succession = 60% — seule l\'assurance-vie protège efficacement',
    ],
  },

  // ═══════════════════════════════════════════════════════════════
  // PILIER 2 — SITUATION PROFESSIONNELLE
  // ═══════════════════════════════════════════════════════════════
  {
    id: 'pro-01',
    category: 'situation_professionnelle',
    subcategory: 'statut_revenus',
    title: 'Statut professionnel et composition des revenus',
    content: `Le statut professionnel impacte : la protection sociale (maladie, retraite, prévoyance), les enveloppes d'épargne disponibles (PER, Madelin, article 83), la fiscalité des revenus, et les possibilités d'optimisation (holding, SCI, démembrement de parts). Statuts principaux : salarié cadre/non-cadre, fonctionnaire, profession libérale, gérant majoritaire SARL (TNS), président SAS (assimilé salarié), auto-entrepreneur. La rémunération peut inclure : fixe, variable, avantages en nature (voiture, logement), épargne salariale (PEE, PERCO, intéressement, participation), stock-options, AGA (attribution gratuite d'actions), retraite supplémentaire (art. 83, art. 39, PER entreprise).`,
    keywords: ['métier', 'profession', 'salarié', 'fonctionnaire', 'libéral', 'dirigeant', 'gérant', 'TNS', 'rémunération', 'salaire', 'employeur', 'retraité'],
    questions: [
      'Quel est votre métier et depuis combien de temps l\'exercez-vous ?',
      'Quel est votre statut : salarié, fonctionnaire, profession libérale, dirigeant ?',
      'Comment se compose votre rémunération (fixe, variable, avantages) ?',
      'Bénéficiez-vous d\'épargne salariale (PEE, PERCO, intéressement) ?',
      'Avez-vous des stock-options ou attributions gratuites d\'actions ?',
      'Quels sont vos projets professionnels (évolution, cession, retraite) ?',
    ],
    alerts: [
      'TNS (gérant majoritaire) : protection sociale réduite — prévoyance complémentaire indispensable',
      'Dirigeant sans Madelin/PER : gap retraite potentiellement important',
    ],
  },

  // ═══════════════════════════════════════════════════════════════
  // PILIER 3 — LIBÉRALITÉS
  // ═══════════════════════════════════════════════════════════════
  {
    id: 'lib-01',
    category: 'liberalites',
    subcategory: 'donations',
    title: 'Donations — Stratégie de transmission du vivant',
    content: `Principales formes de donations :
- Donation simple : entre vifs, irrévocable (sauf cas légaux)
- Donation-partage : répartit les biens entre héritiers de son vivant, fige la valeur au jour de la donation (art. 1076 CC) — évite les rappels et réévaluations
- Don manuel : remise matérielle (espèces, virement, objets). Doit être déclaré au fisc dans le mois suivant si > seuil de déclaration
- Don familial de sommes d'argent (ex-Sarkozy) : exonéré jusqu'à 31 865 € tous les 15 ans si donateur < 80 ans et donataire majeur

Abattements 2025 (renouvelables tous les 15 ans) :
- Parent → enfant : 100 000 €
- Grand-parent → petit-enfant : 31 865 €
- Arrière-grand-parent → arrière-petit-enfant : 5 310 €
- Entre époux/pacsés : 80 724 €

Le démembrement de propriété (donation de la nue-propriété) est une stratégie puissante : le donateur conserve l'usufruit (revenus/jouissance) et transmet à moindre coût fiscal grâce au barème de l'art. 669 CGI.`,
    keywords: ['donation', 'transmission', 'libéralité', 'don manuel', 'donation-partage', 'abattement', 'nue-propriété', 'usufruit', 'démembrement', 'testament', 'legs'],
    questions: [
      'Avez-vous déjà effectué des donations ? De quelle nature ?',
      'Avez-vous utilisé les abattements de 100 000 € par enfant ?',
      'Pratiquez-vous des dons manuels ou présents d\'usage réguliers ?',
      'Avez-vous envisagé des donations en nue-propriété (démembrement) ?',
      'Vos donations sont-elles des donations simples ou des donations-partage ?',
      'Avez-vous rédigé un testament ?',
    ],
    alerts: [
      'Donation simple non rapportable : risque de déséquilibre successoral entre héritiers',
      'Don manuel non déclaré : sanction fiscale si découvert (pénalités + intérêts de retard)',
      'Abattements non utilisés depuis 15+ ans : opportunité d\'optimisation fiscale',
    ],
  },

  // ═══════════════════════════════════════════════════════════════
  // PILIER 4 — PATRIMOINE IMMOBILIER
  // ═══════════════════════════════════════════════════════════════
  {
    id: 'immo-01',
    category: 'patrimoine_immobilier',
    subcategory: 'residence_principale',
    title: 'Résidence principale — Aspects patrimoniaux et fiscaux',
    content: `La résidence principale bénéficie d'un régime fiscal privilégié : exonération totale de plus-value à la vente (art. 150 U II-1° CGI), abattement de 30% sur la valeur pour l'IFI (art. 973 CGI). Elle est exclue du calcul de l'abattement pour durée de détention en matière de plus-value (puisqu'exonérée). En matière successorale, la RP peut faire l'objet d'un droit viager du conjoint survivant (art. 764 CC). Le financement par crédit immobilier génère une déduction des intérêts pour l'IFI (passif déductible). Enjeux stratégiques : vaut-il mieux être propriétaire ou locataire ? La RP est-elle surdimensionnée par rapport au patrimoine total ? Perspective de downsizing à la retraite ?`,
    keywords: ['résidence principale', 'maison', 'appartement', 'propriétaire', 'locataire', 'RP', 'habitation'],
    questions: [
      'Êtes-vous propriétaire ou locataire de votre résidence principale ?',
      'Quelle valeur estimez-vous pour votre résidence principale ?',
      'Subsiste-t-il un crédit immobilier sur la résidence ?',
      'Envisagez-vous de déménager ou de réduire la taille de votre logement ?',
      'La résidence est-elle détenue en propre, en indivision ou via une SCI ?',
    ],
    alerts: [
      'RP > 50% du patrimoine total : risque de concentration, peu de liquidités en cas de besoin',
      'IFI : abattement 30% sur la RP applicable uniquement au domicile principal',
    ],
  },
  {
    id: 'immo-02',
    category: 'patrimoine_immobilier',
    subcategory: 'immobilier_locatif',
    title: 'Immobilier locatif — Investissement et fiscalité',
    content: `L'investissement locatif peut prendre plusieurs formes : location nue (revenus fonciers), location meublée (BIC), SCPI (papier), SCI (société civile), Pinel/Denormandie (défiscalisation). Fiscalité location nue : micro-foncier (< 15 000 € de revenus, abattement 30%) ou réel (déduction charges, intérêts, travaux, amortissement). Le déficit foncier est imputable sur le revenu global dans la limite de 10 700 €/an (21 400 € avec rénovation énergétique). Location meublée (LMNP/LMP) : amortissement du bien et des meubles, régime micro-BIC (abattement 50%) ou réel. SCPI : mutualisation du risque, ticket d'entrée faible, mais frais d'entrée élevés (8-12%), imposition comme revenus fonciers.`,
    keywords: ['immobilier locatif', 'investissement locatif', 'SCPI', 'SCI', 'location', 'loyer', 'meublé', 'LMNP', 'LMP', 'Pinel', 'déficit foncier', 'terrain', 'foncier'],
    questions: [
      'Avez-vous des investissements immobiliers locatifs ? Combien de biens ?',
      'Quelle est la valeur actuelle et le montant des loyers ?',
      'Les biens sont-ils loués en nu ou en meublé ?',
      'Bénéficiez-vous de dispositifs fiscaux (Pinel, Denormandie, déficit foncier) ?',
      'Détenez-vous des parts de SCPI ? Lesquelles et pour quel montant ?',
    ],
    alerts: [
      'Location meublée > 23 000 €/an de CA : statut LMP automatique — implications fiscales et sociales importantes',
      'SCPI en direct : soumises à l\'IFI pour leur quote-part immobilière',
    ],
  },

  // ═══════════════════════════════════════════════════════════════
  // PILIER 4 bis — PATRIMOINE FINANCIER
  // ═══════════════════════════════════════════════════════════════
  {
    id: 'fin-01',
    category: 'patrimoine_financier',
    subcategory: 'epargne_liquidites',
    title: 'Épargne et liquidités — Épargne de précaution et placements court terme',
    content: `L'épargne de précaution recommandée est de 3 à 6 mois de dépenses courantes. Supports : Livret A (plafond 22 950 €, taux 2.4% en 2025, exonéré IR+PS), LDDS (12 000 €, mêmes conditions), LEP (10 000 €, taux 3.5%, conditions de ressources), CEL/PEL, comptes sur livret. Au-delà de la précaution, les liquidités excessives sur comptes courants sont un manque à gagner (0% de rendement, érodé par l'inflation). L'épargne salariale (PEE : blocage 5 ans, PERCO/PERCOL : blocage retraite) offre un cadre fiscal avantageux avec l'abondement employeur exonéré de charges sociales (sauf CSG/CRDS).`,
    keywords: ['épargne', 'livret', 'liquidité', 'compte', 'Livret A', 'LDDS', 'LEP', 'PEL', 'CEL', 'précaution', 'PEE', 'PERCO', 'épargne salariale'],
    questions: [
      'Quel est votre niveau d\'épargne de précaution (livrets, comptes) ?',
      'Quelle est votre capacité d\'épargne mensuelle ?',
      'Bénéficiez-vous d\'épargne salariale (PEE, PERCO) ?',
      'Votre épargne salariale est-elle investie ou sur le fonds monétaire par défaut ?',
    ],
    alerts: [
      'Livret A au plafond + LDDS au plafond = 34 950 € — au-delà, arbitrer vers des placements plus rémunérateurs',
      'Fonds en euros à 0% = perte de pouvoir d\'achat garantie avec l\'inflation',
    ],
  },
  {
    id: 'fin-02',
    category: 'patrimoine_financier',
    subcategory: 'pea_cto',
    title: 'PEA et compte-titres — Investissement en valeurs mobilières',
    content: `PEA (Plan d'Épargne en Actions) : plafond 150 000 € (225 000 € PEA-PME), exonération d'IR sur les gains après 5 ans (PS de 17.2% restent dus). Seuls les titres européens sont éligibles. Retrait avant 5 ans = clôture et imposition au PFU (30%). Le PEA est un outil d'optimisation fiscale majeur pour l'investissement en actions.
Compte-titres ordinaire (CTO) : pas de plafond, univers d'investissement mondial, mais imposition des gains au PFU (30%) ou barème progressif + 17.2% PS. Les moins-values sont imputables sur les plus-values de même nature pendant 10 ans.`,
    keywords: ['PEA', 'PEA-PME', 'compte-titres', 'CTO', 'actions', 'obligations', 'portefeuille', 'bourse', 'valeurs mobilières', 'plus-value', 'FCPI', 'FIP'],
    questions: [
      'Détenez-vous un PEA ? Depuis quand et quel montant ?',
      'Avez-vous un compte-titres ordinaire ?',
      'Quel est votre profil de risque (prudent, équilibré, dynamique) ?',
      'Gérez-vous vous-même ou déléguez-vous la gestion ?',
      'Quel est votre horizon de placement ?',
    ],
    alerts: [
      'PEA < 5 ans : tout retrait = clôture et perte de l\'avantage fiscal',
      'PEA au plafond de 150 000 € : les gains ne sont pas plafonnés, c\'est le versement qui l\'est',
    ],
  },

  // ═══════════════════════════════════════════════════════════════
  // ASSURANCE-VIE
  // ═══════════════════════════════════════════════════════════════
  {
    id: 'av-01',
    category: 'assurance_vie',
    subcategory: 'contrat_av',
    title: 'Assurance-vie — Pilier de la stratégie patrimoniale française',
    content: `L'assurance-vie est l'enveloppe fiscale la plus polyvalente du patrimoine français. Fonctions : épargne (fonds en euros + UC), transmission (clause bénéficiaire hors succession), complément de revenus (rachats partiels programmés), garantie (nantissement pour crédit).
Fiscalité des rachats après 8 ans : abattement annuel de 4 600 € (seul) ou 9 200 € (couple) sur les intérêts, puis PFU 24.7% (7.5% IR + 17.2% PS) jusqu'à 150 000 € de primes versées, au-delà PFU 30%.
Fiscalité décès : art. 990 I CGI (primes versées avant 70 ans) = abattement de 152 500 € par bénéficiaire, puis 20% jusqu'à 700 000 €, puis 31.25%. Art. 757 B (primes versées après 70 ans) = abattement global de 30 500 €, puis droits de succession selon le lien de parenté, mais les intérêts sont exonérés.`,
    keywords: ['assurance-vie', 'AV', 'contrat', 'fonds en euros', 'unités de compte', 'UC', 'clause bénéficiaire', 'rachat', 'capitalisation', '152 500', '990 I', '757 B'],
    questions: [
      'Combien de contrats d\'assurance-vie possédez-vous ?',
      'Quelle est la répartition fonds en euros / unités de compte ?',
      'À quel âge avez-vous effectué vos versements (avant ou après 70 ans) ?',
      'Vos clauses bénéficiaires sont-elles rédigées sur mesure ?',
      'Avez-vous des contrats anciens (avant 1998) bénéficiant d\'avantages fiscaux historiques ?',
      'Utilisez-vous l\'assurance-vie comme outil de transmission ?',
    ],
    alerts: [
      'Clause bénéficiaire = "mes héritiers" est souvent sous-optimale — préférer une rédaction nominative',
      'Versements après 70 ans : le 757 B est globalisé (30 500 € tous contrats confondus), mais les intérêts sont exonérés — pertinent si espérance de gain importante',
      'Contrats > 8 ans non utilisés : l\'abattement annuel de 4 600/9 200 € est perdu s\'il n\'est pas utilisé',
    ],
  },

  // ═══════════════════════════════════════════════════════════════
  // PILIER 4 ter — RETRAITE & PRÉVOYANCE
  // ═══════════════════════════════════════════════════════════════
  {
    id: 'ret-01',
    category: 'retraite',
    subcategory: 'per',
    title: 'PER — Plan d\'Épargne Retraite',
    content: `Le PER (loi PACTE 2019) est l'outil principal d'épargne retraite. Les versements volontaires sont déductibles du revenu imposable dans la limite de 10% des revenus nets (max 37 094 € en 2025) ou du plancher de 4 637 €. Reports possibles sur 3 ans + mutualisation avec le conjoint. Sortie en rente viagère et/ou en capital à la retraite. Cas de déblocage anticipé : achat de la résidence principale, invalidité, décès du conjoint, surendettement, liquidation judiciaire, fin de droits chômage. Le PER est particulièrement intéressant pour les TMI élevées (30%, 41%, 45%) car la déduction se fait au taux marginal mais l'imposition à la sortie se fait potentiellement à un taux plus faible (revenus moindres à la retraite).`,
    keywords: ['PER', 'retraite', 'PERP', 'Madelin', 'épargne retraite', 'déduction', 'rente', 'capital', 'PACTE'],
    questions: [
      'Avez-vous ouvert un PER individuel ?',
      'Utilisez-vous les plafonds de déduction disponibles (vérifier avis d\'imposition) ?',
      'Avez-vous reporté des plafonds non utilisés des 3 dernières années ?',
      'Quel est votre projet de sortie : rente, capital, ou mixte ?',
      'Avez-vous d\'anciens contrats Madelin ou PERP à transférer vers un PER ?',
    ],
    alerts: [
      'TMI < 30% : le PER est moins intéressant — préférer l\'assurance-vie',
      'Plafonds non utilisés perdus au bout de 3 ans : vérifier l\'avis d\'imposition',
      'PER pour achat RP : le capital est imposé au barème IR (pas de flat tax)',
    ],
  },
  {
    id: 'prev-01',
    category: 'prevoyance',
    subcategory: 'protection_risques',
    title: 'Prévoyance — Protection contre les risques de la vie',
    content: `La prévoyance couvre les risques : décès (capital ou rente), invalidité (incapacité de travail), dépendance (perte d'autonomie). Les TNS ont une protection sociale minimale — la prévoyance complémentaire est critique. Pour les salariés, la convention collective impose souvent un contrat collectif mais les garanties peuvent être insuffisantes. Le contrat Madelin (pour TNS) offre une déduction fiscale des cotisations. Points à vérifier : franchise en cas d'arrêt de travail, définition de l'invalidité (fonctionnelle vs professionnelle), revalorisation des prestations, clause bénéficiaire du capital décès. Le GAP de prévoyance (différence entre revenus actuels et prestations en cas de sinistre) est souvent sous-estimé.`,
    keywords: ['prévoyance', 'décès', 'invalidité', 'incapacité', 'dépendance', 'protection', 'Madelin', 'capital décès', 'rente invalidité', 'mandat de protection'],
    questions: [
      'Avez-vous des contrats de prévoyance (décès, invalidité) ?',
      'Connaissez-vous vos prestations en cas d\'arrêt de travail prolongé ?',
      'Avez-vous une assurance dépendance ?',
      'Avez-vous rédigé un mandat de protection future ?',
      'Votre capital décès est-il suffisant pour maintenir le niveau de vie de votre famille ?',
    ],
    alerts: [
      'TNS sans prévoyance complémentaire : risque majeur en cas d\'arrêt de travail',
      'Mandat de protection future non rédigé : risque de tutelle judiciaire en cas de dépendance',
    ],
  },

  // ═══════════════════════════════════════════════════════════════
  // PILIER 5 — FISCALITÉ
  // ═══════════════════════════════════════════════════════════════
  {
    id: 'fisc-01',
    category: 'fiscalite',
    subcategory: 'ir_tmi',
    title: 'Impôt sur le revenu — TMI et optimisation',
    content: `Barème IR 2025 : 0% (0-11 497 €), 11% (11 497-29 315 €), 30% (29 315-83 823 €), 41% (83 823-180 294 €), 45% (> 180 294 €). TMI = Taux Marginal d'Imposition = taux appliqué au dernier euro de revenu. C'est LE paramètre clé de l'optimisation fiscale. Leviers d'optimisation : déduction PER (effet TMI), déficit foncier (10 700 €/an), emploi à domicile (crédit d'impôt 50%, max 12 000-15 000 €), dons (réduction 66% IR ou 75% pour organismes d'aide, dans la limite de 20% du revenu), investissements PME (réduction 25% Madelin IR-PME, plafond 50 000/100 000 €). Plafond global des niches fiscales : 10 000 €/an (+ 8 000 € pour Outre-mer et SOFICA).`,
    keywords: ['impôt', 'IR', 'TMI', 'fiscal', 'tranche', 'barème', 'réduction', 'crédit d\'impôt', 'niche fiscale', 'défiscalisation', 'revenu fiscal', 'RFR'],
    questions: [
      'Dans quelle tranche d\'imposition êtes-vous (TMI) ?',
      'Quel est votre Revenu Fiscal de Référence ?',
      'Quel est le montant de votre impôt sur le revenu ?',
      'Bénéficiez-vous de réductions ou crédits d\'impôt ?',
      'Utilisez-vous le plafond des niches fiscales (10 000 €) ?',
    ],
    alerts: [
      'TMI 41% ou 45% : PER obligatoire pour optimiser — chaque € versé économise 41 ou 45 centimes d\'IR',
      'Plafond des niches fiscales atteint : SCPI Pinel, FCPI/FIP ne génèrent plus d\'économie',
    ],
  },
  {
    id: 'fisc-02',
    category: 'fiscalite',
    subcategory: 'ifi',
    title: 'IFI — Impôt sur la Fortune Immobilière',
    content: `L'IFI (depuis 2018, remplace l'ISF) taxe le patrimoine immobilier net > 1 300 000 €. Assiette : tous les biens immobiliers (RP avec abattement 30%, locatif, SCPI, OPCI part immobilière, SCI). Exclusions : biens professionnels, forêts et vignobles (abattement 75%). Barème : 0.5% (800K-1.3M), 0.7% (1.3M-2.57M), 1% (2.57M-5M), 1.25% (5M-10M), 1.5% (>10M). Décote entre 1.3M et 1.4M : 17 500 - 1.25% × patrimoine net taxable. Passif déductible : emprunts immobiliers, travaux, impôts fonciers. Plafonnement : IFI + IR + PS ne peut dépasser 75% des revenus.`,
    keywords: ['IFI', 'ISF', 'fortune', 'immobilière', '1 300 000', 'patrimoine taxable', 'abattement 30%'],
    questions: [
      'Êtes-vous assujetti à l\'IFI ?',
      'Quel est le montant de votre patrimoine immobilier net taxable ?',
      'Avez-vous optimisé votre IFI (passif déductible, biens professionnels) ?',
    ],
    alerts: [
      'Patrimoine immobilier > 1.3M€ : déclaration IFI obligatoire',
      'SCPI détenues via PEA ou contrat de capitalisation : non soumises à l\'IFI',
      'Donations d\'immobilier : réduisent l\'assiette IFI tout en transmettant',
    ],
  },

  // ═══════════════════════════════════════════════════════════════
  // PASSIF
  // ═══════════════════════════════════════════════════════════════
  {
    id: 'pass-01',
    category: 'passif',
    subcategory: 'endettement',
    title: 'Passif et endettement — Analyse de la capacité financière',
    content: `L'endettement se mesure par le taux d'endettement (charges d'emprunt / revenus nets). Seuil de vigilance : 33% (critère bancaire historique, assoupli à 35% par le HCSF). Types : crédit immobilier (RP, locatif), crédit consommation, découvert, prêt in fine. L'assurance emprunteur est un élément clé : délégation possible (loi Lagarde), résiliation annuelle (loi Bourquin/Hamon/Lemoine). Un crédit in fine adossé à un contrat d'assurance-vie peut être une stratégie d'optimisation (intérêts déductibles des revenus fonciers, capital remboursé par l'AV à terme). Le remboursement anticipé est souvent avantageux si le taux du crédit est supérieur au rendement de l'épargne.`,
    keywords: ['crédit', 'emprunt', 'dette', 'endettement', 'mensualité', 'remboursement', 'taux', 'prêt', 'hypothèque', 'in fine', 'assurance emprunteur'],
    questions: [
      'Avez-vous des crédits en cours ? Immobilier, consommation ?',
      'Quel est votre taux d\'endettement global ?',
      'Avez-vous renégocié ou fait racheter vos crédits récemment ?',
      'Votre assurance emprunteur est-elle compétitive (loi Lemoine) ?',
    ],
    alerts: [
      'Taux d\'endettement > 35% : risque de refus bancaire, situation tendue',
      'Crédit conso à taux élevé : rembourser en priorité avant d\'épargner',
    ],
  },

  // ═══════════════════════════════════════════════════════════════
  // OBJECTIFS ET HORIZON
  // ═══════════════════════════════════════════════════════════════
  {
    id: 'obj-01',
    category: 'objectifs',
    subcategory: 'objectifs_horizon',
    title: 'Objectifs patrimoniaux et horizon de placement',
    content: `L'identification des objectifs est le fondement de toute stratégie patrimoniale. Méthodologie :
1. Objectifs à court terme (< 3 ans) : constitution d'épargne de précaution (3-6 mois de charges), projet immobilier, financement études enfants
2. Objectifs à moyen terme (3-8 ans) : investissement immobilier locatif, diversification patrimoniale, préparation transmission
3. Objectifs à long terme (> 8 ans) : préparation retraite, optimisation fiscale structurelle, transmission intergénérationnelle
Hiérarchisation : urgent vs important, montant nécessaire, horizon de réalisation, tolérance au risque acceptable pour chaque objectif.
Profil de risque MiFID II : évaluation de la capacité à supporter des pertes, de l'expérience financière, de la situation financière globale, et des objectifs d'investissement. Le profil doit être réévalué à chaque changement de situation significatif.
Allocation cible : dépend du profil de risque, de l'horizon, et des objectifs — prudent (fonds euros 70%+), équilibré (50/50), dynamique (UC 70%+), offensif (actions 80%+).`,
    keywords: ['objectif', 'horizon', 'projet', 'priorité', 'court terme', 'long terme', 'moyen terme', 'profil de risque', 'MiFID', 'allocation', 'diversification', 'tolérance', 'risque'],
    questions: [
      'Quels sont vos objectifs patrimoniaux prioritaires ?',
      'Quel est votre horizon de placement principal ?',
      'Comment réagiriez-vous face à une baisse de 20% de la valeur de votre portefeuille ?',
      'Avez-vous des projets importants dans les 3 à 5 prochaines années ?',
      'Quelle est votre capacité d\'épargne mensuelle ?',
    ],
    alerts: [
      'Profil de risque MiFID II non évalué : aucune recommandation de produit ne peut être formulée',
      'Objectifs contradictoires : sécurité et rendement élevé sont incompatibles — arbitrer avec le client',
      'Horizon court (<3 ans) : éviter les supports à risque de perte en capital',
    ],
  },

  // ═══════════════════════════════════════════════════════════════
  // RÉGLEMENTATION
  // ═══════════════════════════════════════════════════════════════
  {
    id: 'reg-01',
    category: 'reglementation',
    subcategory: 'conformite',
    title: 'Réglementation — Obligations du CGP',
    content: `Obligations réglementaires du CGP lors de l'entretien :
1. DDA (Directive Distribution Assurance) : devoir de conseil documenté, analyse des besoins et exigences du client avant toute recommandation de produit d'assurance
2. KYC (Know Your Customer) : collecte et mise à jour annuelle des données client, questionnaire de connaissance client
3. LCB-FT (Lutte Contre le Blanchiment et Financement du Terrorisme) : vigilance sur opérations atypiques, déclaration TRACFIN si soupçon
4. RGPD : consentement pour traitement des données personnelles, droit d'accès, rectification, effacement
5. MiFID II : évaluation du profil de risque (test d'adéquation), information sur les coûts et charges, meilleure exécution
6. Devoir de mise en garde : risque de perte en capital, liquidité limitée, durée de placement recommandée
7. Archivage : conserver les échanges et documents pendant 5 ans minimum (10 ans pour les opérations suspectes LCB-FT)`,
    keywords: ['DDA', 'KYC', 'LCB-FT', 'RGPD', 'MiFID', 'conformité', 'réglementation', 'devoir de conseil', 'TRACFIN', 'profil de risque'],
    questions: [],
    alerts: [
      'DDA : documenter le conseil donné — un conseil non documenté n\'existe pas juridiquement',
      'KYC : actualiser les données au moins une fois par an ou lors d\'un changement de situation',
      'Opération > 10 000 € en espèces : déclaration TRACFIN obligatoire',
      'Profil de risque non évalué : toute recommandation de produit financier est irrégulière',
    ],
  },

  // ═══════════════════════════════════════════════════════════════
  // MÉTHODOLOGIE
  // ═══════════════════════════════════════════════════════════════
  {
    id: 'meth-01',
    category: 'methodologie',
    subcategory: 'entretien',
    title: 'Méthodologie d\'entretien — Bonnes pratiques CGP',
    content: `Phases de l'entretien de découverte :
1. Accueil et mise en confiance (5 min) : présentation, rappel de la confidentialité, objectif de l'entretien
2. Écoute active et découverte (40-50 min) : questions ouvertes → fermées, reformulation, prise de notes structurée
3. Synthèse et prochaines étapes (10 min) : résumer ce qui a été compris, identifier les manques, fixer le prochain RDV

Techniques d'écoute active :
- Questions ouvertes : "Comment voyez-vous votre situation ?" "Qu'est-ce qui est important pour vous ?"
- Reformulation : "Si je comprends bien, vous souhaitez..." "Donc, ce qui vous préoccupe c'est..."
- Silence : laisser le client développer sa pensée, ne pas remplir les blancs
- Empathie : reconnaître les émotions "Je comprends que cela puisse vous inquiéter"
- Approfondissement : "Pouvez-vous m'en dire plus ?" "Qu'entendez-vous par... ?"

Erreurs à éviter :
- Couper la parole du client
- Proposer des solutions avant d'avoir compris la situation globale
- Utiliser du jargon technique sans vérifier la compréhension
- Parler plus que le client (ratio idéal : 70% client / 30% conseiller)`,
    keywords: ['méthodologie', 'entretien', 'écoute active', 'découverte', 'question ouverte', 'reformulation', 'technique'],
    questions: [],
    alerts: [],
  },
]

// ── Moteur de recherche TF-IDF simplifié ──

/** Tokenize et normalise un texte français */
function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Supprimer accents pour la recherche
    .replace(/[^\w\s'-]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 2) // Mots de plus de 2 caractères
    .filter(w => !STOP_WORDS.has(w))
}

const STOP_WORDS = new Set([
  'les', 'des', 'une', 'dans', 'pour', 'par', 'sur', 'avec', 'que', 'qui',
  'est', 'sont', 'ont', 'ete', 'etre', 'avoir', 'fait', 'peut', 'plus',
  'tout', 'tous', 'cette', 'ces', 'son', 'ses', 'leur', 'leurs', 'notre',
  'votre', 'vos', 'nos', 'entre', 'comme', 'mais', 'donc', 'car', 'pas',
  'bien', 'tres', 'aussi', 'autre', 'meme', 'quand', 'encore', 'apres',
  'avant', 'depuis', 'sans', 'sous', 'chez', 'vers', 'dont', 'peu', 'trop',
])

/** Calcule un score de pertinence entre une requête et un chunk */
function computeRelevance(query: string[], chunk: KnowledgeChunk): number {
  const chunkTokens = new Set([
    ...tokenize(chunk.title),
    ...tokenize(chunk.content),
    ...chunk.keywords.flatMap(k => tokenize(k)),
  ])

  let matchCount = 0
  let keywordBoost = 0

  for (const token of query) {
    if (chunkTokens.has(token)) {
      matchCount++
    }
    // Boost si le token matche un keyword exactement
    for (const keyword of chunk.keywords) {
      if (keyword.toLowerCase().includes(token)) {
        keywordBoost += 0.5
      }
    }
  }

  if (query.length === 0) return 0
  return (matchCount / query.length) + (keywordBoost / Math.max(1, chunk.keywords.length))
}

// ── API publique ──

/**
 * Recherche les chunks de connaissances les plus pertinents pour une requête donnée.
 */
export function searchKnowledge(query: string, maxResults: number = 5): KnowledgeChunk[] {
  const queryTokens = tokenize(query)
  if (queryTokens.length === 0) return []

  const scored = KNOWLEDGE_BASE.map(chunk => ({
    ...chunk,
    relevanceScore: computeRelevance(queryTokens, chunk),
  }))

  return scored
    .filter(c => c.relevanceScore! > 0.1)
    .sort((a, b) => b.relevanceScore! - a.relevanceScore!)
    .slice(0, maxResults)
}

/**
 * Analyse une conversation et retourne les chunks pertinents + les lacunes détectées.
 * C'est le cœur du RAG pour l'assistant IA.
 */
export function analyzeConversation(
  transcriptionText: string,
  entretienType: string = 'DECOUVERTE'
): RAGRetrievalResult {
  const queryTokens = tokenize(transcriptionText)

  // Scorer chaque chunk
  const scored = KNOWLEDGE_BASE.map(chunk => ({
    ...chunk,
    relevanceScore: computeRelevance(queryTokens, chunk),
  }))

  // Chunks pertinents (sujets abordés dans la conversation)
  const relevant = scored
    .filter(c => c.relevanceScore! > 0.15)
    .sort((a, b) => b.relevanceScore! - a.relevanceScore!)

  // Détecter les sujets couverts et non couverts
  const coveredCategories = new Set(relevant.map(c => c.category))
  const allCategories: KnowledgeCategory[] = [
    'situation_familiale', 'situation_matrimoniale', 'situation_professionnelle',
    'liberalites', 'patrimoine_immobilier', 'patrimoine_financier',
    'assurance_vie', 'retraite', 'prevoyance', 'fiscalite', 'passif', 'objectifs',
  ]

  const coveredTopics = relevant
    .slice(0, 8)
    .map(c => c.title)

  const uncoveredCategories = allCategories.filter(cat => !coveredCategories.has(cat))
  const uncoveredTopics = uncoveredCategories.map(cat => {
    const chunk = KNOWLEDGE_BASE.find(c => c.category === cat)
    return chunk?.title || cat
  })

  // Questions suggérées : priorité aux sujets NON couverts
  const suggestedQuestions: string[] = []

  // 1. Questions d'approfondissement sur les sujets en cours
  for (const chunk of relevant.slice(0, 3)) {
    if (chunk.questions.length > 0) {
      suggestedQuestions.push(chunk.questions[Math.floor(Math.random() * chunk.questions.length)])
    }
  }

  // 2. Questions pour ouvrir de nouveaux sujets
  for (const cat of uncoveredCategories.slice(0, 3)) {
    const chunk = KNOWLEDGE_BASE.find(c => c.category === cat)
    if (chunk?.questions.length) {
      suggestedQuestions.push(chunk.questions[0])
    }
  }

  // Alertes pertinentes
  const alerts = relevant
    .flatMap(c => c.alerts)
    .slice(0, 5)

  // Score de complétude (% de catégories couvertes)
  const completenessScore = Math.round((coveredCategories.size / allCategories.length) * 100)

  return {
    chunks: relevant.slice(0, 8),
    coveredTopics,
    uncoveredTopics,
    suggestedQuestions: [...new Set(suggestedQuestions)].slice(0, 6),
    alerts,
    completenessScore,
  }
}

/**
 * Génère un contexte RAG formaté pour injection dans un prompt LLM.
 */
export function buildRAGContext(
  transcriptionText: string,
  entretienType: string = 'DECOUVERTE'
): string {
  const analysis = analyzeConversation(transcriptionText, entretienType)

  let context = `\n═══ ANALYSE RAG — CONTEXTE PATRIMONIAL ═══\n`
  context += `Score de complétude de la découverte : ${analysis.completenessScore}%\n\n`

  if (analysis.coveredTopics.length > 0) {
    context += `SUJETS ABORDÉS :\n${analysis.coveredTopics.map(t => `✓ ${t}`).join('\n')}\n\n`
  }

  if (analysis.uncoveredTopics.length > 0) {
    context += `SUJETS NON ENCORE ABORDÉS (PRIORITAIRES) :\n${analysis.uncoveredTopics.map(t => `✗ ${t}`).join('\n')}\n\n`
  }

  if (analysis.alerts.length > 0) {
    context += `ALERTES RÉGLEMENTAIRES & PATRIMONIALES :\n${analysis.alerts.map(a => `⚠️ ${a}`).join('\n')}\n\n`
  }

  // Ajouter le contenu détaillé des chunks les plus pertinents
  const topChunks = analysis.chunks.slice(0, 3)
  if (topChunks.length > 0) {
    context += `CONNAISSANCES DÉTAILLÉES (les plus pertinentes) :\n`
    for (const chunk of topChunks) {
      context += `\n--- ${chunk.title} ---\n${chunk.content.slice(0, 500)}\n`
    }
  }

  return context
}

/**
 * Extrait les entités patrimoniales détectées dans la transcription.
 * Utilisé pour construire un profil client en temps réel.
 */
export function extractEntities(text: string): Record<string, string[]> {
  const entities: Record<string, string[]> = {
    montants: [],
    produits: [],
    statuts: [],
    objectifs: [],
    personnes: [],
  }

  // Montants
  const montantRegex = /(\d[\d\s,.]*)\s*(?:€|euros?|mille|million)/gi
  let match
  while ((match = montantRegex.exec(text)) !== null) {
    entities.montants.push(match[0].trim())
  }

  // Produits financiers
  const produits = [
    'assurance-vie', 'assurance vie', 'PER', 'PEA', 'SCPI', 'OPCI', 'SCI',
    'PEE', 'PERCO', 'PERCOL', 'livret A', 'LDDS', 'LEP', 'PEL', 'CEL',
    'compte-titres', 'FCPI', 'FIP', 'Madelin', 'article 83',
    'contrat de capitalisation', 'fonds en euros', 'unités de compte',
    'LMNP', 'LMP', 'Pinel', 'Malraux', 'Denormandie', 'Girardin',
    'nue-propriété', 'usufruit', 'démembrement', 'donation-partage',
  ]
  for (const produit of produits) {
    if (text.toLowerCase().includes(produit.toLowerCase())) {
      entities.produits.push(produit)
    }
  }

  // Statuts
  const statuts = [
    'marié', 'pacsé', 'divorcé', 'veuf', 'célibataire', 'union libre',
    'salarié', 'fonctionnaire', 'libéral', 'dirigeant', 'gérant', 'retraité', 'TNS',
    'propriétaire', 'locataire',
  ]
  for (const statut of statuts) {
    if (text.toLowerCase().includes(statut.toLowerCase())) {
      entities.statuts.push(statut)
    }
  }

  // Objectifs
  const objectifs = [
    'retraite', 'transmission', 'protection', 'défiscalisation', 'épargne',
    'investir', 'placement', 'optimiser', 'réduire impôts', 'succession',
    'prévoyance', 'revenus complémentaires',
  ]
  for (const objectif of objectifs) {
    if (text.toLowerCase().includes(objectif.toLowerCase())) {
      entities.objectifs.push(objectif)
    }
  }

  return entities
}
