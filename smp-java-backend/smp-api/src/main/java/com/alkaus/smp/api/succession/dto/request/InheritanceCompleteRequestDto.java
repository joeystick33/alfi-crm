package com.alkaus.smp.api.succession.dto.request;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

import com.alkaus.smp.api.succession.dto.common.AdvisorDto;
import com.alkaus.smp.api.succession.dto.common.IdentityDto;
import com.fasterxml.jackson.annotation.JsonAlias;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;

@JsonIgnoreProperties(ignoreUnknown = true)
public record InheritanceCompleteRequestDto(
		
		@JsonProperty("statut_matrimonial")
		String maritalStatus,
		
		@JsonProperty("regime_matrimonial")
        String matrimonialRegime,

        @JsonProperty("identite")
        IdentityDto identity,

        @JsonProperty("conjoint")
        SpouseDto spouse,

        @JsonProperty("enfants")
        List<ChildDto> children,

        @JsonProperty("parents_defunt")
        DeceasedParentDto deceasedParent,

        @JsonProperty("fratrie_defunt")
        List<SiblingsDto> deceasedSiblings,

        @JsonProperty("actifs")
        List<AssetsRequestDto> assets,

        @JsonProperty("patrimoine_net_total")
        BigDecimal totalNetWorth,

        @JsonProperty("dettes_totales")
		BigDecimal totalDebts,

        @JsonProperty("option_conjoint")
        @JsonAlias("option_ddv")
        String spouseOption,

        @JsonProperty("conseiller")
        AdvisorDto advisor,

        @JsonProperty("revenus_annuels")
		BigDecimal annualIncome,

        @JsonProperty("charges_annuelles")
		BigDecimal annualCharges,

        // --- Champs supplémentaires envoyés par le frontend ---

        @JsonProperty("nombre_enfants")
        Integer nombreEnfants,

        @JsonProperty("presence_ddv")
        Boolean presenceDDV,

        @JsonProperty("presence_residence_principale")
        Boolean presenceResidencePrincipale,

        @JsonProperty("valeur_residence_principale")
        BigDecimal valeurResidencePrincipale,

        @JsonProperty("residence_occupation_conjoint")
        Boolean residenceOccupationConjoint,

        @JsonProperty("presence_assurance_vie")
        Boolean presenceAssuranceVie,

        @JsonProperty("contrats_av")
        List<Map<String, Object>> contratsAV,

        @JsonProperty("donations")
        List<Map<String, Object>> donationsList,

        @JsonProperty("legs_particuliers")
        List<Map<String, Object>> legsParticuliers,

        @JsonProperty("date_deces")
        String dateDeces,

        @JsonProperty("testament_partenaire")
        Boolean testamentPartenaire,

        @JsonProperty("enfants_tous_communs")
        Boolean enfantsTousCommuns,

        @JsonProperty("mode_couple")
        Boolean modeCouple,

        @JsonProperty("parents_partenaire")
        DeceasedParentDto spouseParent,

        @JsonProperty("fratrie_partenaire")
        List<SiblingsDto> spouseSiblings
		
) {}
