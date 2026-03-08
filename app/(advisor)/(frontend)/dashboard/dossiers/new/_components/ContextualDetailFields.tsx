'use client'

import { Input } from '@/app/_common/components/ui/Input'
import { Label } from '@/app/_common/components/ui/Label'
import { Textarea } from '@/app/_common/components/ui/Textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/_common/components/ui/Select'

interface Props {
  categorie: string
  type: string
  details: Record<string, string>
  onChange: (field: string, value: string) => void
}

export function ContextualDetailFields({ categorie, type, details, onChange }: Props) {
  // ==================== PATRIMOINE ====================
  if (categorie === 'PATRIMOINE') {
    if (type === 'BILAN_PATRIMONIAL' || type === 'AUDIT_FISCAL') {
      return (
        <div className="space-y-4">
          <div>
            <Label>Objectifs du client</Label>
            <Textarea value={details.objectifs || ''} onChange={(e) => onChange('objectifs', e.target.value)} placeholder="Retraite, transmission, revenus complémentaires, protection..." rows={3} className="mt-1" />
          </div>
          <div>
            <Label>Situation actuelle</Label>
            <Textarea value={details.situationActuelle || ''} onChange={(e) => onChange('situationActuelle', e.target.value)} placeholder="Résumé de la situation patrimoniale (actifs, passifs, revenus...)" rows={3} className="mt-1" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><Label>Patrimoine total estimé (€)</Label><Input type="number" value={details.patrimoineTotal || ''} onChange={(e) => onChange('patrimoineTotal', e.target.value)} className="mt-1" /></div>
            <div><Label>Revenus annuels (€)</Label><Input type="number" value={details.revenusAnnuels || ''} onChange={(e) => onChange('revenusAnnuels', e.target.value)} className="mt-1" /></div>
          </div>
          <div><Label>Honoraires de conseil (€)</Label><Input type="number" value={details.honoraires || ''} onChange={(e) => onChange('honoraires', e.target.value)} className="mt-1" /></div>
        </div>
      )
    }
    if (type === 'OPTIMISATION_FISCALE') {
      return (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div><Label>Impôt sur le revenu actuel (€)</Label><Input type="number" value={details.impotActuel || ''} onChange={(e) => onChange('impotActuel', e.target.value)} className="mt-1" /></div>
            <div><Label>TMI (Tranche Marginale)</Label>
              <Select value={details.tmi || ''} onValueChange={(v) => onChange('tmi', v)}><SelectTrigger className="mt-1"><SelectValue placeholder="Sélectionner" /></SelectTrigger>
                <SelectContent><SelectItem value="0">0%</SelectItem><SelectItem value="11">11%</SelectItem><SelectItem value="30">30%</SelectItem><SelectItem value="41">41%</SelectItem><SelectItem value="45">45%</SelectItem></SelectContent>
              </Select>
            </div>
          </div>
          <div><Label>Économie d'impôt visée (€)</Label><Input type="number" value={details.economieVisee || ''} onChange={(e) => onChange('economieVisee', e.target.value)} className="mt-1" /></div>
          <div><Label>Dispositifs envisagés</Label><Textarea value={details.dispositifs || ''} onChange={(e) => onChange('dispositifs', e.target.value)} placeholder="PER, FCPI, FIP, Girardin, Pinel, Malraux..." rows={2} className="mt-1" /></div>
        </div>
      )
    }
    if (type === 'CREATION_SCI' || type === 'CREATION_HOLDING') {
      return (
        <div className="space-y-4">
          <div><Label>Objet de la structure</Label><Textarea value={details.objetStructure || ''} onChange={(e) => onChange('objetStructure', e.target.value)} placeholder="Gestion locative, transmission, détention de participations..." rows={2} className="mt-1" /></div>
          <div className="grid grid-cols-2 gap-4">
            <div><Label>Capital social prévu (€)</Label><Input type="number" value={details.capitalSocial || ''} onChange={(e) => onChange('capitalSocial', e.target.value)} className="mt-1" /></div>
            <div><Label>Régime fiscal</Label>
              <Select value={details.regimeFiscal || ''} onValueChange={(v) => onChange('regimeFiscal', v)}><SelectTrigger className="mt-1"><SelectValue placeholder="Sélectionner" /></SelectTrigger>
                <SelectContent><SelectItem value="IR">IR (Impôt sur le Revenu)</SelectItem><SelectItem value="IS">IS (Impôt sur les Sociétés)</SelectItem></SelectContent>
              </Select>
            </div>
          </div>
          <div><Label>Associés prévus</Label><Textarea value={details.associes || ''} onChange={(e) => onChange('associes', e.target.value)} placeholder="Liste des associés avec leurs parts" rows={2} className="mt-1" /></div>
        </div>
      )
    }
    if (type === 'DIVORCE_SEPARATION') {
      return (
        <div className="space-y-4">
          <div><Label>Régime matrimonial</Label>
            <Select value={details.regimeMatrimonial || ''} onValueChange={(v) => onChange('regimeMatrimonial', v)}><SelectTrigger className="mt-1"><SelectValue placeholder="Sélectionner" /></SelectTrigger>
              <SelectContent><SelectItem value="communaute_reduite">Communauté réduite aux acquêts</SelectItem><SelectItem value="communaute_universelle">Communauté universelle</SelectItem><SelectItem value="separation">Séparation de biens</SelectItem><SelectItem value="participation">Participation aux acquêts</SelectItem></SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><Label>Patrimoine commun estimé (€)</Label><Input type="number" value={details.patrimoineCommun || ''} onChange={(e) => onChange('patrimoineCommun', e.target.value)} className="mt-1" /></div>
            <div><Label>Patrimoine propre client (€)</Label><Input type="number" value={details.patrimoinePropre || ''} onChange={(e) => onChange('patrimoinePropre', e.target.value)} className="mt-1" /></div>
          </div>
          <div><Label>Biens à partager</Label><Textarea value={details.biensAPartager || ''} onChange={(e) => onChange('biensAPartager', e.target.value)} placeholder="Résidence principale, comptes, placements..." rows={3} className="mt-1" /></div>
        </div>
      )
    }
    if (type === 'DONATION' || type === 'DEMEMBREMENT') {
      return (
        <div className="space-y-4">
          <div><Label>Bénéficiaire(s)</Label><Textarea value={details.beneficiaires || ''} onChange={(e) => onChange('beneficiaires', e.target.value)} placeholder="Nom et lien de parenté des bénéficiaires" rows={2} className="mt-1" /></div>
          <div><Label>Bien(s) concerné(s)</Label><Textarea value={details.biensConcernes || ''} onChange={(e) => onChange('biensConcernes', e.target.value)} placeholder="Description des biens à transmettre" rows={2} className="mt-1" /></div>
          <div className="grid grid-cols-2 gap-4">
            <div><Label>Valeur estimée (€)</Label><Input type="number" value={details.valeurEstimee || ''} onChange={(e) => onChange('valeurEstimee', e.target.value)} className="mt-1" /></div>
            <div><Label>Droits estimés (€)</Label><Input type="number" value={details.droitsEstimes || ''} onChange={(e) => onChange('droitsEstimes', e.target.value)} className="mt-1" /></div>
          </div>
          {type === 'DEMEMBREMENT' && (
            <div><Label>Type de démembrement</Label>
              <Select value={details.typeDemembrement || ''} onValueChange={(v) => onChange('typeDemembrement', v)}><SelectTrigger className="mt-1"><SelectValue placeholder="Sélectionner" /></SelectTrigger>
                <SelectContent><SelectItem value="donation_np">Donation de la nue-propriété</SelectItem><SelectItem value="donation_usufruit">Donation de l'usufruit</SelectItem><SelectItem value="achat_demembre">Achat en démembrement</SelectItem></SelectContent>
              </Select>
            </div>
          )}
        </div>
      )
    }
  }

  // ==================== SUCCESSION ====================
  if (categorie === 'SUCCESSION') {
    return (
      <div className="space-y-4">
        <div><Label>Héritiers / Bénéficiaires</Label><Textarea value={details.heritiers || ''} onChange={(e) => onChange('heritiers', e.target.value)} placeholder="Liste des héritiers avec leur lien de parenté" rows={3} className="mt-1" /></div>
        <div className="grid grid-cols-2 gap-4">
          <div><Label>Actif successoral estimé (€)</Label><Input type="number" value={details.actifSuccessoral || ''} onChange={(e) => onChange('actifSuccessoral', e.target.value)} className="mt-1" /></div>
          <div><Label>Passif successoral (€)</Label><Input type="number" value={details.passifSuccessoral || ''} onChange={(e) => onChange('passifSuccessoral', e.target.value)} className="mt-1" /></div>
        </div>
        {type === 'ASSURANCE_DECES' && (
          <div className="grid grid-cols-2 gap-4">
            <div><Label>Capital décès souhaité (€)</Label><Input type="number" value={details.capitalDeces || ''} onChange={(e) => onChange('capitalDeces', e.target.value)} className="mt-1" /></div>
            <div><Label>Prime annuelle estimée (€)</Label><Input type="number" value={details.primeAnnuelle || ''} onChange={(e) => onChange('primeAnnuelle', e.target.value)} className="mt-1" /></div>
          </div>
        )}
        {type === 'CLAUSE_BENEFICIAIRE' && (
          <div><Label>Contrat(s) concerné(s)</Label><Textarea value={details.contratsConcernes || ''} onChange={(e) => onChange('contratsConcernes', e.target.value)} placeholder="Liste des contrats dont la clause est à modifier" rows={2} className="mt-1" /></div>
        )}
        <div><Label>Situation particulière</Label><Textarea value={details.situationParticuliere || ''} onChange={(e) => onChange('situationParticuliere', e.target.value)} placeholder="Famille recomposée, enfants mineurs, handicap..." rows={2} className="mt-1" /></div>
      </div>
    )
  }

  // ==================== RETRAITE ====================
  if (categorie === 'RETRAITE') {
    if (type === 'BILAN_RETRAITE') {
      return (
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div><Label>Âge actuel</Label><Input type="number" value={details.ageActuel || ''} onChange={(e) => onChange('ageActuel', e.target.value)} className="mt-1" /></div>
            <div><Label>Âge de départ souhaité</Label><Input type="number" value={details.ageDepartSouhaite || ''} onChange={(e) => onChange('ageDepartSouhaite', e.target.value)} className="mt-1" /></div>
            <div><Label>Trimestres validés</Label><Input type="number" value={details.trimestresValides || ''} onChange={(e) => onChange('trimestresValides', e.target.value)} className="mt-1" /></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><Label>Revenus actuels (€/an)</Label><Input type="number" value={details.revenusActuels || ''} onChange={(e) => onChange('revenusActuels', e.target.value)} className="mt-1" /></div>
            <div><Label>Pension estimée (€/mois)</Label><Input type="number" value={details.pensionEstimee || ''} onChange={(e) => onChange('pensionEstimee', e.target.value)} className="mt-1" /></div>
          </div>
          <div><Label>Régimes de cotisation</Label><Textarea value={details.regimesCotisation || ''} onChange={(e) => onChange('regimesCotisation', e.target.value)} placeholder="CNAV, AGIRC-ARRCO, CIPAV, MSA..." rows={2} className="mt-1" /></div>
        </div>
      )
    }
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div><Label>Montant de l'opération (€)</Label><Input type="number" value={details.montantOperation || ''} onChange={(e) => onChange('montantOperation', e.target.value)} className="mt-1" /></div>
          <div><Label>Compagnie / Contrat</Label><Input value={details.compagnie || ''} onChange={(e) => onChange('compagnie', e.target.value)} placeholder="Ex: Linxea Spirit PER" className="mt-1" /></div>
        </div>
        {type === 'OUVERTURE_PER' && (
          <div><Label>Profil de gestion</Label>
            <Select value={details.profilGestion || ''} onValueChange={(v) => onChange('profilGestion', v)}><SelectTrigger className="mt-1"><SelectValue placeholder="Sélectionner" /></SelectTrigger>
              <SelectContent><SelectItem value="prudent">Prudent</SelectItem><SelectItem value="equilibre">Équilibré</SelectItem><SelectItem value="dynamique">Dynamique</SelectItem><SelectItem value="libre">Gestion libre</SelectItem></SelectContent>
            </Select>
          </div>
        )}
        {type === 'RACHAT_PER' && (
          <div><Label>Motif de déblocage</Label>
            <Select value={details.motifDeblocage || ''} onValueChange={(v) => onChange('motifDeblocage', v)}><SelectTrigger className="mt-1"><SelectValue placeholder="Sélectionner" /></SelectTrigger>
              <SelectContent><SelectItem value="achat_rp">Achat résidence principale</SelectItem><SelectItem value="deces_conjoint">Décès du conjoint</SelectItem><SelectItem value="invalidite">Invalidité</SelectItem><SelectItem value="surendettement">Surendettement</SelectItem><SelectItem value="fin_droits">Fin de droits chômage</SelectItem></SelectContent>
            </Select>
          </div>
        )}
      </div>
    )
  }

  // ==================== INVESTISSEMENT ====================
  if (categorie === 'INVESTISSEMENT') {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div><Label>Montant de l'opération (€)</Label><Input type="number" value={details.montantOperation || ''} onChange={(e) => onChange('montantOperation', e.target.value)} className="mt-1" /></div>
          <div><Label>Compagnie / Produit</Label><Input value={details.compagnieProduit || ''} onChange={(e) => onChange('compagnieProduit', e.target.value)} placeholder="Ex: Generali, Linxea..." className="mt-1" /></div>
        </div>
        {type.includes('SOUSCRIPTION') && (
          <>
            <div><Label>Profil de risque</Label>
              <Select value={details.profilRisque || ''} onValueChange={(v) => onChange('profilRisque', v)}><SelectTrigger className="mt-1"><SelectValue placeholder="Sélectionner" /></SelectTrigger>
                <SelectContent><SelectItem value="securitaire">Sécuritaire</SelectItem><SelectItem value="prudent">Prudent</SelectItem><SelectItem value="equilibre">Équilibré</SelectItem><SelectItem value="dynamique">Dynamique</SelectItem><SelectItem value="offensif">Offensif</SelectItem></SelectContent>
              </Select>
            </div>
            <div><Label>Mode de gestion</Label>
              <Select value={details.modeGestion || ''} onValueChange={(v) => onChange('modeGestion', v)}><SelectTrigger className="mt-1"><SelectValue placeholder="Sélectionner" /></SelectTrigger>
                <SelectContent><SelectItem value="pilotee">Gestion pilotée</SelectItem><SelectItem value="profilee">Gestion profilée</SelectItem><SelectItem value="libre">Gestion libre</SelectItem></SelectContent>
              </Select>
            </div>
          </>
        )}
        {type.includes('AV') && <div><Label>Clause bénéficiaire</Label><Textarea value={details.beneficiaires || ''} onChange={(e) => onChange('beneficiaires', e.target.value)} placeholder="Clause bénéficiaire standard ou personnalisée" rows={2} className="mt-1" /></div>}
        {type.includes('ARBITRAGE') && <div><Label>Détail de l'arbitrage</Label><Textarea value={details.detailArbitrage || ''} onChange={(e) => onChange('detailArbitrage', e.target.value)} placeholder="Supports vendus → Supports achetés" rows={3} className="mt-1" /></div>}
        {type.includes('RACHAT') && (
          <div><Label>Type de rachat</Label>
            <Select value={details.typeRachat || ''} onValueChange={(v) => onChange('typeRachat', v)}><SelectTrigger className="mt-1"><SelectValue placeholder="Sélectionner" /></SelectTrigger>
              <SelectContent><SelectItem value="partiel">Rachat partiel</SelectItem><SelectItem value="total">Rachat total</SelectItem><SelectItem value="programme">Rachats programmés</SelectItem></SelectContent>
            </Select>
          </div>
        )}
        {type.includes('SCPI') && (
          <>
            <div><Label>SCPI sélectionnée(s)</Label><Textarea value={details.scpiSelectionnees || ''} onChange={(e) => onChange('scpiSelectionnees', e.target.value)} placeholder="Nom des SCPI et répartition" rows={2} className="mt-1" /></div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Rendement visé (%)</Label><Input type="number" step="0.1" value={details.rendementVise || ''} onChange={(e) => onChange('rendementVise', e.target.value)} className="mt-1" /></div>
              <div><Label>Mode d'acquisition</Label>
                <Select value={details.modeAcquisition || ''} onValueChange={(v) => onChange('modeAcquisition', v)}><SelectTrigger className="mt-1"><SelectValue placeholder="Sélectionner" /></SelectTrigger>
                  <SelectContent><SelectItem value="comptant">Comptant</SelectItem><SelectItem value="credit">À crédit</SelectItem><SelectItem value="demembre">Démembrement</SelectItem><SelectItem value="av">Via Assurance-vie</SelectItem></SelectContent>
                </Select>
              </div>
            </div>
          </>
        )}
      </div>
    )
  }

  // ==================== IMMOBILIER ====================
  if (categorie === 'IMMOBILIER') {
    return (
      <div className="space-y-4">
        <div><Label>Type de bien</Label>
          <Select value={details.typeBien || ''} onValueChange={(v) => onChange('typeBien', v)}><SelectTrigger className="mt-1"><SelectValue placeholder="Sélectionner" /></SelectTrigger>
            <SelectContent><SelectItem value="appartement">Appartement</SelectItem><SelectItem value="maison">Maison</SelectItem><SelectItem value="terrain">Terrain</SelectItem><SelectItem value="local_commercial">Local commercial</SelectItem><SelectItem value="immeuble">Immeuble</SelectItem></SelectContent>
          </Select>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div><Label>Prix (€)</Label><Input type="number" value={details.prixBien || ''} onChange={(e) => onChange('prixBien', e.target.value)} className="mt-1" /></div>
          <div><Label>Surface (m²)</Label><Input type="number" value={details.surface || ''} onChange={(e) => onChange('surface', e.target.value)} className="mt-1" /></div>
          <div><Label>Ville</Label><Input value={details.ville || ''} onChange={(e) => onChange('ville', e.target.value)} className="mt-1" /></div>
        </div>
        {(type.includes('LOCATIF') || type.includes('LMNP') || type.includes('DEFISCALISATION')) && (
          <div className="grid grid-cols-2 gap-4">
            <div><Label>Loyer mensuel prévu (€)</Label><Input type="number" value={details.loyerMensuel || ''} onChange={(e) => onChange('loyerMensuel', e.target.value)} className="mt-1" /></div>
            <div><Label>Rendement brut (%)</Label><Input type="number" step="0.1" value={details.rendementBrut || ''} onChange={(e) => onChange('rendementBrut', e.target.value)} className="mt-1" /></div>
          </div>
        )}
        {type.includes('DEFISCALISATION') && (
          <div className="grid grid-cols-2 gap-4">
            <div><Label>Durée d'engagement</Label>
              <Select value={details.dureeEngagement || ''} onValueChange={(v) => onChange('dureeEngagement', v)}><SelectTrigger className="mt-1"><SelectValue placeholder="Sélectionner" /></SelectTrigger>
                <SelectContent><SelectItem value="6">6 ans</SelectItem><SelectItem value="9">9 ans</SelectItem><SelectItem value="12">12 ans</SelectItem></SelectContent>
              </Select>
            </div>
            <div><Label>Réduction d'impôt (€/an)</Label><Input type="number" value={details.reductionImpot || ''} onChange={(e) => onChange('reductionImpot', e.target.value)} className="mt-1" /></div>
          </div>
        )}
        {type === 'TRAVAUX_RENOVATION' && <div><Label>Nature des travaux</Label><Textarea value={details.natureTravaux || ''} onChange={(e) => onChange('natureTravaux', e.target.value)} placeholder="Rénovation énergétique, extension..." rows={2} className="mt-1" /></div>}
      </div>
    )
  }

  // ==================== CRÉDIT ====================
  if (categorie === 'CREDIT') {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div><Label>Montant emprunté (€)</Label><Input type="number" value={details.montantEmprunte || ''} onChange={(e) => onChange('montantEmprunte', e.target.value)} className="mt-1" /></div>
          <div><Label>Durée (mois)</Label><Input type="number" value={details.dureeMois || ''} onChange={(e) => onChange('dureeMois', e.target.value)} placeholder="Ex: 240 (20 ans)" className="mt-1" /></div>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div><Label>Taux nominal (%)</Label><Input type="number" step="0.01" value={details.tauxNominal || ''} onChange={(e) => onChange('tauxNominal', e.target.value)} className="mt-1" /></div>
          <div><Label>Taux assurance (%)</Label><Input type="number" step="0.01" value={details.tauxAssurance || ''} onChange={(e) => onChange('tauxAssurance', e.target.value)} className="mt-1" /></div>
          <div><Label>TAEG (%)</Label><Input type="number" step="0.01" value={details.taeg || ''} onChange={(e) => onChange('taeg', e.target.value)} className="mt-1" /></div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div><Label>Apport personnel (€)</Label><Input type="number" value={details.apport || ''} onChange={(e) => onChange('apport', e.target.value)} className="mt-1" /></div>
          <div><Label>Mensualité (€)</Label><Input type="number" value={details.mensualite || ''} onChange={(e) => onChange('mensualite', e.target.value)} className="mt-1" /></div>
        </div>
        {type === 'CREDIT_IMMOBILIER' && (
          <div><Label>Objet du financement</Label>
            <Select value={details.objetFinancement || ''} onValueChange={(v) => onChange('objetFinancement', v)}><SelectTrigger className="mt-1"><SelectValue placeholder="Sélectionner" /></SelectTrigger>
              <SelectContent><SelectItem value="rp">Résidence principale</SelectItem><SelectItem value="rs">Résidence secondaire</SelectItem><SelectItem value="locatif">Investissement locatif</SelectItem><SelectItem value="travaux">Travaux</SelectItem></SelectContent>
            </Select>
          </div>
        )}
        {type === 'RENEGOCIATION_CREDIT' && (
          <div className="grid grid-cols-2 gap-4">
            <div><Label>Taux actuel (%)</Label><Input type="number" step="0.01" value={details.tauxActuel || ''} onChange={(e) => onChange('tauxActuel', e.target.value)} className="mt-1" /></div>
            <div><Label>Capital restant dû (€)</Label><Input type="number" value={details.crd || ''} onChange={(e) => onChange('crd', e.target.value)} className="mt-1" /></div>
          </div>
        )}
        <div><Label>Banque(s) contactée(s)</Label><Input value={details.banques || ''} onChange={(e) => onChange('banques', e.target.value)} placeholder="Ex: Crédit Agricole, LCL..." className="mt-1" /></div>
      </div>
    )
  }

  // ==================== ASSURANCE PERSONNES ====================
  if (categorie === 'ASSURANCE_PERSONNES') {
    return (
      <div className="space-y-4">
        {(type.includes('PREVOYANCE') || type === 'GAV') && (
          <div className="grid grid-cols-2 gap-4">
            <div><Label>Capital garanti (€)</Label><Input type="number" value={details.capitalGaranti || ''} onChange={(e) => onChange('capitalGaranti', e.target.value)} className="mt-1" /></div>
            <div><Label>Prime mensuelle (€)</Label><Input type="number" value={details.primeMensuelle || ''} onChange={(e) => onChange('primeMensuelle', e.target.value)} className="mt-1" /></div>
          </div>
        )}
        {type === 'SANTE_MUTUELLE' && (
          <>
            <div><Label>Niveau de couverture</Label>
              <Select value={details.niveauCouverture || ''} onValueChange={(v) => onChange('niveauCouverture', v)}><SelectTrigger className="mt-1"><SelectValue placeholder="Sélectionner" /></SelectTrigger>
                <SelectContent><SelectItem value="economique">Économique</SelectItem><SelectItem value="standard">Standard</SelectItem><SelectItem value="confort">Confort</SelectItem><SelectItem value="premium">Premium</SelectItem></SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Cotisation mensuelle (€)</Label><Input type="number" value={details.cotisationMensuelle || ''} onChange={(e) => onChange('cotisationMensuelle', e.target.value)} className="mt-1" /></div>
              <div><Label>Nombre de bénéficiaires</Label><Input type="number" value={details.nbBeneficiaires || ''} onChange={(e) => onChange('nbBeneficiaires', e.target.value)} className="mt-1" /></div>
            </div>
          </>
        )}
        {type === 'ASSURANCE_EMPRUNTEUR' && (
          <>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Capital restant dû (€)</Label><Input type="number" value={details.capitalRestantDu || ''} onChange={(e) => onChange('capitalRestantDu', e.target.value)} className="mt-1" /></div>
              <div><Label>Durée restante (mois)</Label><Input type="number" value={details.dureeRestante || ''} onChange={(e) => onChange('dureeRestante', e.target.value)} className="mt-1" /></div>
            </div>
            <div><Label>Garanties demandées</Label><Textarea value={details.garantiesDemandees || ''} onChange={(e) => onChange('garantiesDemandees', e.target.value)} placeholder="Décès, PTIA, ITT, IPT, IPP..." rows={2} className="mt-1" /></div>
          </>
        )}
        <div><Label>Bénéficiaire(s)</Label><Textarea value={details.beneficiaires || ''} onChange={(e) => onChange('beneficiaires', e.target.value)} placeholder="Bénéficiaires désignés" rows={2} className="mt-1" /></div>
        <div><Label>Compagnie</Label><Input value={details.compagnie || ''} onChange={(e) => onChange('compagnie', e.target.value)} placeholder="Ex: AXA, Generali, Swiss Life..." className="mt-1" /></div>
      </div>
    )
  }

  // ==================== ASSURANCE BIENS ====================
  if (categorie === 'ASSURANCE_BIENS') {
    return (
      <div className="space-y-4">
        {(type === 'ASSURANCE_HABITATION' || type === 'ASSURANCE_PNO') && (
          <>
            <div><Label>Type de logement</Label>
              <Select value={details.typeLogement || ''} onValueChange={(v) => onChange('typeLogement', v)}><SelectTrigger className="mt-1"><SelectValue placeholder="Sélectionner" /></SelectTrigger>
                <SelectContent><SelectItem value="appartement">Appartement</SelectItem><SelectItem value="maison">Maison</SelectItem></SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div><Label>Surface (m²)</Label><Input type="number" value={details.surface || ''} onChange={(e) => onChange('surface', e.target.value)} className="mt-1" /></div>
              <div><Label>Nombre de pièces</Label><Input type="number" value={details.nbPieces || ''} onChange={(e) => onChange('nbPieces', e.target.value)} className="mt-1" /></div>
              <div><Label>Code postal</Label><Input value={details.codePostal || ''} onChange={(e) => onChange('codePostal', e.target.value)} className="mt-1" /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Capital mobilier (€)</Label><Input type="number" value={details.capitalMobilier || ''} onChange={(e) => onChange('capitalMobilier', e.target.value)} className="mt-1" /></div>
              <div><Label>Prime annuelle (€)</Label><Input type="number" value={details.primeAnnuelle || ''} onChange={(e) => onChange('primeAnnuelle', e.target.value)} className="mt-1" /></div>
            </div>
          </>
        )}
        {(type === 'ASSURANCE_AUTO' || type === 'ASSURANCE_MOTO') && (
          <>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Marque / Modèle</Label><Input value={details.marqueModele || ''} onChange={(e) => onChange('marqueModele', e.target.value)} className="mt-1" /></div>
              <div><Label>Immatriculation</Label><Input value={details.immatriculation || ''} onChange={(e) => onChange('immatriculation', e.target.value)} className="mt-1" /></div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div><Label>Année</Label><Input type="number" value={details.annee || ''} onChange={(e) => onChange('annee', e.target.value)} className="mt-1" /></div>
              <div><Label>Puissance (CV)</Label><Input type="number" value={details.puissance || ''} onChange={(e) => onChange('puissance', e.target.value)} className="mt-1" /></div>
              <div><Label>Valeur (€)</Label><Input type="number" value={details.valeurVehicule || ''} onChange={(e) => onChange('valeurVehicule', e.target.value)} className="mt-1" /></div>
            </div>
            <div><Label>Formule</Label>
              <Select value={details.formule || ''} onValueChange={(v) => onChange('formule', v)}><SelectTrigger className="mt-1"><SelectValue placeholder="Sélectionner" /></SelectTrigger>
                <SelectContent><SelectItem value="tiers">Tiers</SelectItem><SelectItem value="tiers_plus">Tiers étendu</SelectItem><SelectItem value="tous_risques">Tous risques</SelectItem></SelectContent>
              </Select>
            </div>
          </>
        )}
        <div><Label>Compagnie actuelle (si existante)</Label><Input value={details.compagnieActuelle || ''} onChange={(e) => onChange('compagnieActuelle', e.target.value)} className="mt-1" /></div>
      </div>
    )
  }

  // ==================== ASSURANCE PRO ====================
  if (categorie === 'ASSURANCE_PRO') {
    return (
      <div className="space-y-4">
        <div><Label>Activité de l'entreprise</Label><Input value={details.activite || ''} onChange={(e) => onChange('activite', e.target.value)} placeholder="Ex: Conseil, BTP, Commerce..." className="mt-1" /></div>
        <div className="grid grid-cols-3 gap-4">
          <div><Label>Chiffre d'affaires (€)</Label><Input type="number" value={details.chiffreAffaires || ''} onChange={(e) => onChange('chiffreAffaires', e.target.value)} className="mt-1" /></div>
          <div><Label>Effectif</Label><Input type="number" value={details.effectif || ''} onChange={(e) => onChange('effectif', e.target.value)} className="mt-1" /></div>
          <div><Label>Prime annuelle (€)</Label><Input type="number" value={details.primeAnnuelle || ''} onChange={(e) => onChange('primeAnnuelle', e.target.value)} className="mt-1" /></div>
        </div>
        {type === 'DECENNALE' && <div><Label>Activités BTP couvertes</Label><Textarea value={details.activitesBTP || ''} onChange={(e) => onChange('activitesBTP', e.target.value)} placeholder="Gros œuvre, second œuvre, lots techniques..." rows={2} className="mt-1" /></div>}
        {(type.includes('TNS') || type.includes('COLLECTIVE')) && (
          <div><Label>Nombre de personnes à couvrir</Label><Input type="number" value={details.nbPersonnes || ''} onChange={(e) => onChange('nbPersonnes', e.target.value)} className="mt-1" /></div>
        )}
        <div><Label>Garanties souhaitées</Label><Textarea value={details.garantiesSouhaitees || ''} onChange={(e) => onChange('garantiesSouhaitees', e.target.value)} placeholder="Détail des garanties demandées" rows={2} className="mt-1" /></div>
      </div>
    )
  }

  // ==================== ENTREPRISE ====================
  if (categorie === 'ENTREPRISE') {
    return (
      <div className="space-y-4">
        <div><Label>Nom de l'entreprise</Label><Input value={details.nomEntreprise || ''} onChange={(e) => onChange('nomEntreprise', e.target.value)} className="mt-1" /></div>
        <div className="grid grid-cols-2 gap-4">
          <div><Label>Forme juridique</Label>
            <Select value={details.formeJuridique || ''} onValueChange={(v) => onChange('formeJuridique', v)}><SelectTrigger className="mt-1"><SelectValue placeholder="Sélectionner" /></SelectTrigger>
              <SelectContent><SelectItem value="EI">Entreprise individuelle</SelectItem><SelectItem value="EURL">EURL</SelectItem><SelectItem value="SARL">SARL</SelectItem><SelectItem value="SAS">SAS</SelectItem><SelectItem value="SASU">SASU</SelectItem><SelectItem value="SA">SA</SelectItem></SelectContent>
            </Select>
          </div>
          <div><Label>Secteur d'activité</Label><Input value={details.secteurActivite || ''} onChange={(e) => onChange('secteurActivite', e.target.value)} className="mt-1" /></div>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div><Label>Chiffre d'affaires (€)</Label><Input type="number" value={details.chiffreAffaires || ''} onChange={(e) => onChange('chiffreAffaires', e.target.value)} className="mt-1" /></div>
          <div><Label>Résultat net (€)</Label><Input type="number" value={details.resultatNet || ''} onChange={(e) => onChange('resultatNet', e.target.value)} className="mt-1" /></div>
          <div><Label>Effectif</Label><Input type="number" value={details.effectif || ''} onChange={(e) => onChange('effectif', e.target.value)} className="mt-1" /></div>
        </div>
        {(type === 'CESSION_ENTREPRISE' || type === 'VALORISATION_ENTREPRISE') && (
          <div><Label>Valorisation estimée (€)</Label><Input type="number" value={details.valorisation || ''} onChange={(e) => onChange('valorisation', e.target.value)} className="mt-1" /></div>
        )}
        {type === 'TRANSMISSION_ENTREPRISE' && (
          <div><Label>Repreneur(s) envisagé(s)</Label><Textarea value={details.repreneurs || ''} onChange={(e) => onChange('repreneurs', e.target.value)} placeholder="Famille, salariés, tiers..." rows={2} className="mt-1" /></div>
        )}
        <div><Label>Objectif de l'opération</Label><Textarea value={details.objectifOperation || ''} onChange={(e) => onChange('objectifOperation', e.target.value)} rows={2} className="mt-1" /></div>
      </div>
    )
  }

  // Fallback par défaut
  return (
    <div className="space-y-4">
      <div><Label>Description de l'opération</Label><Textarea value={details.description || ''} onChange={(e) => onChange('description', e.target.value)} placeholder="Décrivez les détails de l'opération..." rows={4} className="mt-1" /></div>
      <div><Label>Montant concerné (€)</Label><Input type="number" value={details.montant || ''} onChange={(e) => onChange('montant', e.target.value)} className="mt-1" /></div>
    </div>
  )
}
