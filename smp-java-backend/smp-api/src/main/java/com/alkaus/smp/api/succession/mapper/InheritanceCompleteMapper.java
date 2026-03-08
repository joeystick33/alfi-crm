package com.alkaus.smp.api.succession.mapper;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;

import org.springframework.stereotype.Component;

import com.alkaus.smp.api.succession.dto.common.AdvisorDto;
import com.alkaus.smp.api.succession.dto.common.IdentityDto;
import com.alkaus.smp.api.succession.dto.request.ChildDto;
import com.alkaus.smp.api.succession.dto.request.DeceasedParentDto;
import com.alkaus.smp.api.succession.dto.request.InheritanceCompleteRequestDto;
import com.alkaus.smp.api.succession.dto.request.SiblingsDto;
import com.alkaus.smp.api.succession.dto.request.SpouseDto;
import com.alkaus.smp.api.succession.dto.response.AlertDto;
import com.alkaus.smp.api.succession.dto.response.DdvScenarioDto;
import com.alkaus.smp.api.succession.dto.response.AssetDetailDto;
import com.alkaus.smp.api.succession.dto.response.DeceasedDto;
import com.alkaus.smp.api.succession.dto.response.FinancialImpactDto;
import com.alkaus.smp.api.succession.dto.response.FiscalDetailsDto;
import com.alkaus.smp.api.succession.dto.response.HeirDto;
import com.alkaus.smp.api.succession.dto.response.HeritageDto;
import com.alkaus.smp.api.succession.dto.response.InheritanceCompleteResponseDto;
import com.alkaus.smp.api.succession.dto.response.LiquidationDto;
import com.alkaus.smp.api.succession.dto.response.MassDto;
import com.alkaus.smp.api.succession.dto.response.MetadataDto;
import com.alkaus.smp.api.succession.dto.response.OptimizationItemDto;
import com.alkaus.smp.api.succession.dto.response.OptimizationsDto;
import com.alkaus.smp.api.succession.dto.response.RepartitionDto;
import com.alkaus.smp.api.succession.dto.response.RepartitionItemDto;
import com.alkaus.smp.api.succession.dto.response.ScenarioDto;
import com.alkaus.smp.api.succession.dto.response.YearImpactDto;
import com.alkaus.smp.application.inheritanceCompleteResults.command.AdvisorCommand;
import com.alkaus.smp.application.inheritanceCompleteResults.command.AssetCommand;
import com.alkaus.smp.application.inheritanceCompleteResults.command.CompleteResultsCommand;
import com.alkaus.smp.application.inheritanceCompleteResults.command.DonationCommand;
import com.alkaus.smp.application.inheritanceCompleteResults.command.LegCommand;
import com.alkaus.smp.application.inheritanceCompleteResults.command.LifeInsuranceCommand;
import com.alkaus.smp.application.inheritanceCompleteResults.command.ParentsCommand;
import com.alkaus.smp.application.inheritanceCompleteResults.command.PersonCommand;
import com.alkaus.smp.application.inheritanceCompleteResults.command.SiblingsCommand;
import com.alkaus.smp.application.inheritanceCompleteResults.model.CompleteResultsResult;
import com.alkaus.smp.application.inheritanceCompleteResults.model.ScenarioResult;

@Component
public class InheritanceCompleteMapper {

	/**
	 * Mapping API requestDto to input CompleteResultsCommand
	 * 
	 * @param requestDto
	 * @return
	 */
	public CompleteResultsCommand toCommand(InheritanceCompleteRequestDto requestDto) {

		// --- Resolve matrimonial regime: top-level OR from nested conjoint ---
		String regime = requestDto.matrimonialRegime();
		if ((regime == null || regime.isBlank()) && requestDto.spouse() != null
				&& requestDto.spouse().regimeMatrimonial() != null) {
			regime = mapRegimeEnum(requestDto.spouse().regimeMatrimonial());
		}
		// Append clause d'attribution intégrale to regime string so LiquidationRegimeService detects it
		if (regime != null && requestDto.spouse() != null
				&& Boolean.TRUE.equals(requestDto.spouse().clauseAttributionIntegrale())) {
			regime = regime + " avec clause d'attribution intégrale";
		}

		// --- Resolve spouse option: only relevant for married with children ---
		String statut = requestDto.maritalStatus();
		boolean isMarried = statut != null && (statut.equalsIgnoreCase("marié") || statut.equalsIgnoreCase("marie")
				|| statut.equalsIgnoreCase("married"));
		boolean hasChildren = requestDto.children() != null && !requestDto.children().isEmpty();
		String spouseOption = (isMarried && hasChildren) ? resolveSpouseOption(requestDto) : null;

		// --- Resolve annual income: top-level OR from identity.revenusMensuels * 12 ---
		BigDecimal annualIncome = requestDto.annualIncome();
		if (annualIncome == null && requestDto.identity() != null
				&& requestDto.identity().revenusMensuels() != null) {
			annualIncome = requestDto.identity().revenusMensuels()
					.multiply(BigDecimal.valueOf(12));
		}

		BigDecimal annualCharges = requestDto.annualCharges();

		boolean presenceDDV = Boolean.TRUE.equals(requestDto.presenceDDV());
		boolean hasWill = Boolean.TRUE.equals(requestDto.testamentPartenaire());
		boolean allCommonChildren = requestDto.enfantsTousCommuns() == null
				|| Boolean.TRUE.equals(requestDto.enfantsTousCommuns()); // default true if not specified

		// NPE guard: identity is required but might be null in malformed payloads
		PersonCommand clientPerson;
		if (requestDto.identity() != null) {
			clientPerson = new PersonCommand(requestDto.identity().firstName(), requestDto.identity().lastName(),
					requestDto.identity().age(), requestDto.identity().sex());
		} else {
			clientPerson = new PersonCommand("Défunt", null, null, null);
		}

		return new CompleteResultsCommand(requestDto.maritalStatus(), regime,
				clientPerson,
				isSpouseAbsent(requestDto.spouse()) ? null
						: new PersonCommand(requestDto.spouse().firstName(), requestDto.spouse().lastName(),
								requestDto.spouse().age(), null),
				mapChildren(requestDto.children()),
				mapParents(requestDto.deceasedParent()),
				mapSiblings(requestDto.deceasedSiblings()),
				mapParents(requestDto.spouseParent()),
				mapSiblings(requestDto.spouseSiblings()),
				requestDto.assets() == null ? List.of()
						: requestDto.assets().stream()
								.map(a -> new AssetCommand(a.type(), a.value(), a.debt(), a.label(), a.ownership()))
								.toList(),
				requestDto.totalNetWorth(), requestDto.totalDebts(), spouseOption,
				requestDto.advisor() == null ? null
						: new AdvisorCommand(requestDto.advisor().name(), requestDto.advisor().office(),
								requestDto.advisor().email()),
				annualIncome, annualCharges,
				presenceDDV,
				mapDonations(requestDto.donationsList()),
				mapLegs(requestDto.legsParticuliers()),
				mapLifeInsurances(requestDto.contratsAV(),
					requestDto.identity() != null ? requestDto.identity().age() : null,
					isSpouseAbsent(requestDto.spouse()) ? null : requestDto.spouse().firstName(),
					isSpouseAbsent(requestDto.spouse()) ? null : requestDto.spouse().age(),
					mapChildren(requestDto.children()).stream().map(PersonCommand::firstName).toList()),
				hasWill,
				allCommonChildren,
				parseDateOfDeath(requestDto.dateDeces()));
	}

	/**
	 * Maps children from DTO to PersonCommand list, handling predeceased children:
	 * - Alive children: mapped as PersonCommand normally (soucheName = null)
	 * - Predeceased children with representants: each representant carries
	 *   soucheName = predeceased child's name, so the engine can compute shares
	 *   per souche (art. 751 C.civ) instead of per head
	 * - Predeceased children without representants: skipped (extinct branch)
	 */
	private List<PersonCommand> mapChildren(List<ChildDto> children) {
		if (children == null || children.isEmpty()) return List.of();
		List<PersonCommand> result = new java.util.ArrayList<>();
		for (ChildDto c : children) {
			if (Boolean.TRUE.equals(c.predecede())) {
				if (c.representants() != null && !c.representants().isEmpty()) {
					String soucheName = c.firstName() != null ? c.firstName() : "Enfant prédécédé";
					for (ChildDto.RepresentantDto rep : c.representants()) {
						String name = rep.firstName() != null ? rep.firstName() : "Petit-enfant";
						result.add(new PersonCommand(name, null, null, null, false, soucheName));
					}
				}
			} else {
				boolean disabled = Boolean.TRUE.equals(c.handicape());
				result.add(new PersonCommand(c.firstName(), null, c.age(), null, disabled, null));
			}
		}
		return result;
	}

	private ParentsCommand mapParents(DeceasedParentDto parentDto) {
		if (parentDto == null) return null;
		return new ParentsCommand(
				parentDto.father() != null && Boolean.TRUE.equals(parentDto.father().alive()),
				parentDto.mother() != null && Boolean.TRUE.equals(parentDto.mother().alive()));
	}

	private List<SiblingsCommand> mapSiblings(List<SiblingsDto> siblingsDto) {
		if (siblingsDto == null || siblingsDto.isEmpty()) return List.of();
		return siblingsDto.stream().map(s -> new SiblingsCommand(
				s.firstName(), s.alive(),
				s.representants() == null ? List.of()
						: s.representants().stream()
								.map(r -> r.firstName() != null ? r.firstName() : "Neveu/Nièce")
								.toList(),
				s.relationship()))
				.toList();
	}

	private boolean isSpouseAbsent(SpouseDto spouse) {
		if (spouse == null) return true;
		boolean noName = (spouse.firstName() == null || spouse.firstName().isBlank())
				&& (spouse.lastName() == null || spouse.lastName().isBlank());
		return noName && spouse.age() == null;
	}

	private String mapRegimeEnum(String enumValue) {
		if (enumValue == null) return null;
		return switch (enumValue.toUpperCase()) {
			case "COMMUNAUTE_LEGALE" -> "communauté réduite aux acquêts";
			case "SEPARATION_BIENS" -> "séparation de biens";
			case "COMMUNAUTE_UNIVERSELLE" -> "communauté universelle";
			case "PARTICIPATION_ACQUETS" -> "participation aux acquêts";
			default -> enumValue;
		};
	}

	/**
	 * Maps donations from frontend to DonationCommand.
	 * Frontend fields: beneficiaireNom, valeur, dateActe, horsPart (inverted!), lien
	 * Backend fallbacks: beneficiaire/beneficiaryName, montant/amount, date/dateDonation, rapportable
	 */
	private List<DonationCommand> mapDonations(List<Map<String, Object>> rawDonations) {
		if (rawDonations == null || rawDonations.isEmpty()) return List.of();
		return rawDonations.stream().map(m -> {
			String beneficiary = strVal(m, "beneficiaireNom",
					strVal(m, "beneficiaire", strVal(m, "beneficiaryName", null)));
			String relationship = strVal(m, "lien", strVal(m, "relationship", "enfant"));
			BigDecimal amount = decimalVal(m, "valeur",
					decimalVal(m, "montant", decimalVal(m, "amount", null)));
			LocalDate date = dateVal(m, "dateActe",
					dateVal(m, "date", dateVal(m, "dateDonation", null)));
			// Frontend sends horsPart (true = non-rapportable), rapportable is the inverse
			boolean rapportable;
			if (m.containsKey("horsPart")) {
				rapportable = !boolVal(m, "horsPart", false);
			} else {
				rapportable = boolVal(m, "rapportable", true);
			}
			// Read owner: CLIENT = deceased's donation, CONJOINT = spouse's donation
			String owner = strVal(m, "owner", strVal(m, "proprietaire", null));
			return new DonationCommand(beneficiary, relationship, amount, date, rapportable, owner);
		}).toList();
	}

	/**
	 * Art. 669 CGI — barème de la nue-propriété par tranche d'âge de l'usufruitier.
	 * Retourne le pourcentage de NP (ex: 60 pour 60%).
	 */
	private int npPercentByAge(int usufructAge) {
		if (usufructAge < 21) return 10;
		if (usufructAge <= 30) return 20;
		if (usufructAge <= 40) return 30;
		if (usufructAge <= 50) return 40;
		if (usufructAge <= 60) return 50;
		if (usufructAge <= 70) return 60;
		if (usufructAge <= 80) return 70;
		if (usufructAge <= 90) return 80;
		return 90;
	}

	private List<LifeInsuranceCommand> mapLifeInsurances(List<Map<String, Object>> rawContratsAV,
			Integer ageDefunt, String spouseName, Integer spouseAge, List<String> childrenNames) {
		if (rawContratsAV == null || rawContratsAV.isEmpty()) return List.of();
		List<LifeInsuranceCommand> result = new java.util.ArrayList<>();
		String defaultSpouse = spouseName != null ? spouseName : "Conjoint";
		int nbChildren = childrenNames != null ? childrenNames.size() : 0;
		int age = ageDefunt != null ? ageDefunt : 65;

		// NP fraction for démembrement (art. 669 CGI), based on surviving spouse's age
		int npPct = npPercentByAge(spouseAge != null ? spouseAge : 65);
		BigDecimal npFraction = new BigDecimal(npPct).divide(new BigDecimal("100"), 6, java.math.RoundingMode.HALF_UP);

		for (Map<String, Object> contrat : rawContratsAV) {
			BigDecimal avant70 = decimalVal(contrat, "montantVersementsAvant70", BigDecimal.ZERO);
			BigDecimal apres70 = decimalVal(contrat, "montantVersementsApres70", BigDecimal.ZERO);
			BigDecimal capitalDeces = decimalVal(contrat, "valeurContratActuelle", BigDecimal.ZERO);
			String clause = strVal(contrat, "clauseBeneficiaire", "STANDARD");
			// Read owner from multiple possible field names:
			// - "owner" / "proprietaire": backend convention (CLIENT / CONJOINT)
			// - "souscripteur": frontend UI convention (MONSIEUR / MADAME)
			String avOwner = strVal(contrat, "owner", strVal(contrat, "proprietaire", null));
			if (avOwner == null || avOwner.isBlank()) {
				String souscripteur = strVal(contrat, "souscripteur", null);
				if ("MONSIEUR".equalsIgnoreCase(souscripteur)) avOwner = "CLIENT";
				else if ("MADAME".equalsIgnoreCase(souscripteur)) avOwner = "CONJOINT";
			}

			@SuppressWarnings("unchecked")
			List<Map<String, Object>> beneficiaires = contrat.get("beneficiaires") instanceof List<?> raw
					? (List<Map<String, Object>>) raw : List.of();

			if (beneficiaires.isEmpty()) {
				if ("DEMEMBRE".equals(clause) && nbChildren > 0 && childrenNames != null) {
					// ─── DÉMEMBREMENT ───
					// Conjoint = usufruitier → exempt art. 990 I (conjoint/PACS)
					// Enfants = nus-propriétaires → taxés sur la VALEUR de la NP (art. 669 CGI)
					//
					// Art. 990 I: la base taxable de chaque enfant est:
					//   (capitalDeces × NP%) / nbChildren
					// Art. 757 B: les primes après 70 ans sont réintégrées en totalité
					//   (pas de prorata NP pour 757 B, c'est le montant des primes versées)

					// Conjoint entry: exempt, reçoit USF du capital (pour info, pas de taxe)
					result.add(new LifeInsuranceCommand(defaultSpouse, "CONJOINT",
							avant70, apres70, capitalDeces, age, BigDecimal.ONE, avOwner));

					// Chaque enfant: NP-valued deathBenefit for art. 990 I
					BigDecimal npCapitalTotal = capitalDeces.multiply(npFraction)
							.setScale(2, java.math.RoundingMode.HALF_UP);
					BigDecimal npCapitalPerChild = npCapitalTotal
							.divide(new BigDecimal(nbChildren), 2, java.math.RoundingMode.HALF_UP);
					// Primes avant 70 pour chaque enfant (art. 990 I base = NP du capital)
					BigDecimal npAvant70PerChild = avant70.multiply(npFraction)
							.divide(new BigDecimal(nbChildren), 2, java.math.RoundingMode.HALF_UP);
					// Primes après 70 pour chaque enfant (art. 757 B = primes pleines / nbChildren)
					BigDecimal apres70PerChild = apres70
							.divide(new BigDecimal(nbChildren), 2, java.math.RoundingMode.HALF_UP);

					for (String childName : childrenNames) {
						result.add(new LifeInsuranceCommand(childName, "ENFANT",
								npAvant70PerChild, apres70PerChild, npCapitalPerChild,
								age < 70 ? age : 50, npFraction, avOwner));
					}
				} else {
					// ─── STANDARD ───
					// "Mon conjoint, à défaut mes enfants" → spouse is primary beneficiary (exempt)
					result.add(new LifeInsuranceCommand(defaultSpouse, "CONJOINT",
							avant70, apres70, capitalDeces, age, BigDecimal.ONE, avOwner));
				}
			} else {
				// ─── PERSONNALISE ───
				// Split amounts proportionally among named beneficiaries by their part (%)
				BigDecimal totalParts = BigDecimal.ZERO;
				for (Map<String, Object> b : beneficiaires) {
					totalParts = totalParts.add(decimalVal(b, "part", BigDecimal.ZERO));
				}
				if (totalParts.signum() <= 0) totalParts = new BigDecimal(beneficiaires.size());

				for (Map<String, Object> b : beneficiaires) {
					String nom = strVal(b, "nom", "Bénéficiaire");
					String lien = strVal(b, "lien", "AUTRE");
					BigDecimal part = decimalVal(b, "part", BigDecimal.ZERO);
					BigDecimal ratio = totalParts.signum() > 0
							? part.divide(totalParts, 6, java.math.RoundingMode.HALF_UP)
							: BigDecimal.ONE.divide(new BigDecimal(beneficiaires.size()), 6, java.math.RoundingMode.HALF_UP);

					// Resolve beneficiary name to match heir name
					String resolvedName = resolveAvBeneficiaryName(nom, lien, defaultSpouse, childrenNames);

					result.add(new LifeInsuranceCommand(resolvedName, lien,
							avant70.multiply(ratio).setScale(2, java.math.RoundingMode.HALF_UP),
							apres70.multiply(ratio).setScale(2, java.math.RoundingMode.HALF_UP),
							capitalDeces.multiply(ratio).setScale(2, java.math.RoundingMode.HALF_UP),
							age, BigDecimal.ONE, avOwner));
				}
			}
		}
		return result;
	}

	/**
	 * Resolves an AV beneficiary name to match the actual heir name used by the engine.
	 * This ensures the fiscal engine can match the beneficiary to the heir for tax computation.
	 * Strategy: if lien indicates conjoint → use spouse name; if enfant → find matching child by partial name.
	 */
	private String resolveAvBeneficiaryName(String nom, String lien, String spouseName, List<String> childrenNames) {
		if (nom == null || nom.isBlank()) return nom;
		String lienLower = lien != null ? lien.toLowerCase() : "";

		// If lien is conjoint/spouse, use the actual spouse name
		if (lienLower.contains("conjoint") || lienLower.contains("pacs") || lienLower.contains("spouse")) {
			return spouseName;
		}

		// If lien is enfant/child, try to match against known children names
		if (lienLower.contains("enfant") || lienLower.contains("child")) {
			if (childrenNames != null) {
				String nomLower = nom.trim().toLowerCase();
				for (String childName : childrenNames) {
					if (childName != null && childName.toLowerCase().contains(nomLower)) return childName;
					if (childName != null && nomLower.contains(childName.toLowerCase())) return childName;
				}
				// Exact match attempt
				for (String childName : childrenNames) {
					if (childName != null && childName.equalsIgnoreCase(nom.trim())) return childName;
				}
			}
		}

		// Fallback: return original name (best effort)
		return nom;
	}

	/**
	 * Maps legs from frontend to LegCommand.
	 * Frontend fields: beneficiaireNom, valeur
	 * Backend fallbacks: beneficiaire/beneficiaryName, montant/amount
	 */
	private List<LegCommand> mapLegs(List<Map<String, Object>> rawLegs) {
		if (rawLegs == null || rawLegs.isEmpty()) return List.of();
		return rawLegs.stream().map(m -> {
			String beneficiary = strVal(m, "beneficiaireNom",
					strVal(m, "beneficiaire", strVal(m, "beneficiaryName", null)));
			BigDecimal amount = decimalVal(m, "valeur",
					decimalVal(m, "montant", decimalVal(m, "amount", null)));
			String description = strVal(m, "description", strVal(m, "libelle", null));
			String relationship = strVal(m, "lien", strVal(m, "relationship", "tiers"));
			String owner = strVal(m, "owner", strVal(m, "proprietaire", null));
			return new LegCommand(beneficiary, amount, description, relationship, owner);
		}).toList();
	}

	private String strVal(Map<String, Object> m, String key, String def) {
		Object v = m.get(key);
		return v instanceof String s ? s : def;
	}

	private BigDecimal decimalVal(Map<String, Object> m, String key, BigDecimal def) {
		Object v = m.get(key);
		if (v instanceof Number n) return BigDecimal.valueOf(n.doubleValue());
		if (v instanceof String s) { try { return new BigDecimal(s); } catch (Exception e) { return def; } }
		return def;
	}

	private LocalDate dateVal(Map<String, Object> m, String key, LocalDate def) {
		Object v = m.get(key);
		if (v instanceof String s && !s.isBlank()) {
			try { return LocalDate.parse(s); } catch (Exception e) { return def; }
		}
		return def;
	}

	private boolean boolVal(Map<String, Object> m, String key, boolean def) {
		Object v = m.get(key);
		if (v instanceof Boolean b) return b;
		return def;
	}

	private LocalDate parseDateOfDeath(String dateDeces) {
		if (dateDeces == null || dateDeces.isBlank()) return null;
		try { return LocalDate.parse(dateDeces); } catch (Exception e) { return null; }
	}

	private String resolveSpouseOption(InheritanceCompleteRequestDto dto) {
		String opt = dto.spouseOption();
		if (opt == null || opt.isBlank()) return null;
		return switch (opt.toUpperCase().replace(" ", "_")) {
			case "TOTALITE_USUFRUIT", "TOTALITE_EN_USUFRUIT" -> "usufruit total";
			case "QUOTITE_DISPONIBLE_PP", "PP_QUOTITE_DISPONIBLE" -> "pleine propriété quotité disponible";
			case "QUART_PP_TROIS_QUARTS_USUFRUIT", "QUART_PP_ET_TROIS_QUARTS_USUFRUIT"
					-> "1/4 PP + 3/4 usufruit";
			case "QUART_PP" -> "1/4 pleine propriété";
			default -> opt; // Already in human-readable format (e.g. "usufruit total")
		};
	}

	/**
	 * Creates an inverse command where the spouse dies first and the client is the survivor.
	 * Roles are swapped:
	 *   - spouse becomes the "client" (deceased), client becomes the "spouse" (survivor)
	 *   - parentsOfDeceased ↔ parentsOfSpouse (the new deceased's family is the spouse's family)
	 *   - siblingsOfDeceased ↔ siblingsOfSpouse
	 *   - same patrimony, children, regime, donations, legs, AV (tied to the estate, not the person)
	 *
	 * @param original the original command (client dies first)
	 * @return the inverse command (spouse dies first)
	 */
	public CompleteResultsCommand toInverseCommand(CompleteResultsCommand original) {
		if (original.spouse() == null) return null;

		// ── 1. Swap client ↔ spouse identity ──
		PersonCommand newClient = original.spouse(); // spouse is now the deceased
		PersonCommand newSpouse = original.client(); // client is now the survivor

		// ── 2. Swap families ──
		ParentsCommand newDeceasedParents = original.parentsOfSpouse();
		List<SiblingsCommand> newDeceasedSiblings = original.siblingsOfSpouse() != null
				? original.siblingsOfSpouse() : List.of();
		ParentsCommand newSpouseParents = original.parentsOfDeceased();
		List<SiblingsCommand> newSpouseSiblings = original.siblingsOfDeceased() != null
				? original.siblingsOfDeceased() : List.of();

		// ── 3. Swap asset ownership perspective ──
		// PROPRE_CLIENT ↔ PROPRE_CONJOINT (the asset doesn't move, but the deceased changed)
		List<AssetCommand> invertedAssets = original.assets() == null ? List.of()
				: original.assets().stream().map(a -> {
					String own = a.ownership();
					if (own == null || own.isBlank()) return a;
					String swapped = own.toUpperCase().contains("PROPRE_CLIENT") ? "PROPRE_CONJOINT"
							: own.toUpperCase().contains("PROPRE_CONJOINT") ? "PROPRE_CLIENT" : own;
					return new AssetCommand(a.type(), a.value(), a.debt(), a.label(), swapped);
				}).toList();

		// ── 4. Swap liberality ownership ──
		// Donations: swap owner so only the new deceased's donations are fiscally recalled
		List<DonationCommand> invertedDonations = original.donations() == null ? List.of()
				: original.donations().stream().map(d -> new DonationCommand(
						d.beneficiaryName(), d.relationship(), d.amount(), d.donationDate(),
						d.rapportable(), swapOwner(d.owner())
				)).toList();

		// Legs: swap owner so only the new deceased's legs reduce their estate
		List<LegCommand> invertedLegs = original.legs() == null ? List.of()
				: original.legs().stream().map(l -> new LegCommand(
						l.beneficiaryName(), l.amount(), l.description(), l.relationship(),
						swapOwner(l.owner())
				)).toList();

		// Life insurance: swap owner — art. 990 I/757 B apply to subscriber's death
		List<LifeInsuranceCommand> invertedAV = original.lifeInsurances() == null ? List.of()
				: original.lifeInsurances().stream().map(av -> new LifeInsuranceCommand(
						av.beneficiaryName(), av.beneficiaryRelationship(),
						av.primesAvant70(), av.primesApres70(), av.capitalDeces(),
						av.ageAssureAuVersement(), av.allowanceFraction(),
						swapOwner(av.owner())
				)).toList();

		return new CompleteResultsCommand(
				original.maritalStatus(),
				original.matrimonialRegime(),
				newClient,
				newSpouse,
				original.children(),
				newDeceasedParents,
				newDeceasedSiblings,
				newSpouseParents,
				newSpouseSiblings,
				invertedAssets,
				original.totalNetWorth(),
				original.totalDebts(),
				original.spouseOption(),
				original.advisor(),
				original.annualIncome(),
				original.annualCharges(),
				original.presenceDDV(),
				invertedDonations,
				invertedLegs,
				invertedAV,
				original.hasWill(),
				original.allCommonChildren(),
				original.dateOfDeath()
		);
	}

	/**
	 * Swaps liberality owner: CLIENT ↔ CONJOINT.
	 * null/blank defaults to CLIENT, so swapping null gives CONJOINT.
	 */
	private String swapOwner(String owner) {
		if (owner == null || owner.isBlank() || owner.equalsIgnoreCase("CLIENT")) {
			return "CONJOINT";
		}
		if (owner.equalsIgnoreCase("CONJOINT")) {
			return "CLIENT";
		}
		return owner; // unknown → keep as-is
	}

	/**
	 * Mapping output completeResult to API responseDto
	 * 
	 * @param result
	 * @return
	 */
	public InheritanceCompleteResponseDto toResponse(CompleteResultsResult result) {
		var metadata = result.metadata();
		var heritage = result.heritage();

		var scenario1 = toScenarioDto(result.scenario1());
		var scenario2 = toScenarioDto(result.scenario2());

		var optim = result.optimizations();
		var optimDto = new OptimizationsDto(optim.potentialSavings(),
				optim.optimizations().stream()
						.map(i -> new OptimizationItemDto(i.title(), i.description(), i.saving(), i.advisable(), i.deadline()))
						.toList());

		var alertDto = result.alerts().stream().map(a -> new AlertDto(a.type(), a.title(), a.message())).toList();

		return new InheritanceCompleteResponseDto(
				new MetadataDto(metadata.studyDate().toString(),
						new IdentityDto(metadata.customer().firstName(),
								metadata.customer().lastName(), metadata.customer().age(), metadata.customer().sex(), null),
						new AdvisorDto(metadata.advisor().name(),
								metadata.advisor().firm(), metadata.advisor().email(), ""),
						metadata.maritalStatus(), metadata.matrimonialRegime()),
				new HeritageDto(heritage.totalGross(), heritage.totalNet(),
						new RepartitionDto(
								new RepartitionItemDto(
										heritage.repartition().realEstate().total(),
										heritage.repartition().realEstate().percentage()),
								new RepartitionItemDto(
										heritage.repartition().financial().total(),
										heritage.repartition().financial().percentage()),
								new RepartitionItemDto(
										heritage.repartition().professional().total(),
										heritage.repartition().professional().percentage()),
								new RepartitionItemDto(
										heritage.repartition().other().total(),
										heritage.repartition().other().percentage())),
						heritage.assets().stream()
								.map(a -> new AssetDetailDto(a.type(),
										a.designation(), a.label(), a.value(), a.debt(), a.netValue()))
								.toList()),
				scenario1, scenario2,
				result.ddvScenarios() == null ? List.of()
						: result.ddvScenarios().stream().map(ddv -> new DdvScenarioDto(
								ddv.optionLabel(), ddv.optionCode(),
								toScenarioDto(ddv.firstDeath()),
								toScenarioDto(ddv.secondDeath())
						)).toList(),
				result.legalScenarios() == null ? List.of()
						: result.legalScenarios().stream().map(ls -> new DdvScenarioDto(
								ls.optionLabel(), ls.optionCode(),
								toScenarioDto(ls.firstDeath()),
								toScenarioDto(ls.secondDeath())
						)).toList(),
				optimDto, alertDto, mapFiscalDetails(result.fiscalDetails()));
	}
	
	/**
	 * Mapping ScenarioResult to ScenarioDto
	 * @param s
	 * @return
	 */
	private ScenarioDto toScenarioDto(ScenarioResult s) {
		if (s == null || !s.relevant()) {
	        return new ScenarioDto(
	                "Non applicable",
	                null,
	                null,
	                null,
	                null,
	                null,
	                List.of(),
	                null,
	                null,
	                null,
	                null,
	                null
	        );
	    }
		
		return new ScenarioDto(
	            s.label(),
	            new DeceasedDto(
	                    s.deceased().firstName(),
	                    s.deceased().lastName(),
	                    s.deceased().age()
	            ),
	            s.spouseOption(),
	            s.inheritanceAsset(),
	            new LiquidationDto(
	            		s.liquidation().deceasedSeparateAsset(),
	            		s.liquidation().commonAsset(),
	            		s.liquidation().deceasedShare(),
	            		s.liquidation().spouseShare(),
	                    s.liquidation().inheritanceAsset()
	            ),
		            new MassDto(
		                    s.mass().civil(),
		                    s.mass().reserve(),
		                    s.mass().availableQuota(),
		                    s.mass().residenceAllowance(),
		                    s.mass().residenceBaseBeforeAllowance(),
		                    s.mass().spouseExemption(),
		                    s.mass().fiscal()
		            ),
	            s.heirs().stream()
	                    .map(h -> new HeirDto(
	                            h.name(),
	                            relationshipLabel(h.relationship()),
	                            h.rightType(),
	                            h.quota(),
	                            h.amountTransmitted(),
	                            h.taxableValue(),
	                            h.taxAllowance(),
	                            h.baseAfterAllowance(),
	                            h.taxRights(),
	                            h.disabled()
	                    ))
	                    .toList(),
	            s.inheritanceRights(),
	            s.notaryFees(),
	            s.netTransmission(),
	            s.transmissionRate(),
	            new FinancialImpactDto(
	                    new YearImpactDto(
	                            s.financialImpact().yearN().annualIncome(),
	                            s.financialImpact().yearN().annualCharges(),
	                            s.financialImpact().yearN().funeralFees(),
	                            s.financialImpact().yearN().inheritanceRights(),
	                            s.financialImpact().yearN().notaryFees(),
	                            s.financialImpact().yearN().total(),
	                            s.financialImpact().yearN().balance()
	                    ),
	                    new YearImpactDto(
	                            s.financialImpact().year1().annualIncome(),
	                            s.financialImpact().year1().annualCharges(),
	                            s.financialImpact().year1().funeralFees(),
	                            s.financialImpact().year1().inheritanceRights(),
	                            s.financialImpact().year1().notaryFees(),
	                            s.financialImpact().year1().total(),
	                            s.financialImpact().year1().balance()
	                    )
	            )
	    );
	}

	private String relationshipLabel(com.alkaus.smp.domain.fiscal.RelationshipEnum rel) {
		if (rel == null) return "";
		return switch (rel) {
			case DIRECT_LINE -> "Ligne directe";
			case SIBLINGS -> "Frères et sœurs";
			case NIECE_NEPHEW -> "Neveux et nièces";
			case GRANDPARENT -> "Grands-parents";
			case UNCLE_AUNT -> "Oncles / Tantes / Cousins";
			case OTHERS -> "Conjoint / Autre";
		};
	}

	private FiscalDetailsDto mapFiscalDetails(
			com.alkaus.smp.application.inheritanceCompleteResults.model.FiscalDetailsResult fd) {
		if (fd == null) return null;
		return new FiscalDetailsDto(
				fd.avDetails() == null ? List.of() : fd.avDetails().stream().map(av ->
						new FiscalDetailsDto.AvBeneficiaryDetailDto(
								av.beneficiaryName(), av.relationship(),
								av.art990I_capital(), av.art990I_allowance(),
								av.art990I_taxable(), av.art990I_tax(),
								av.art757B_premiums(), av.art757B_allowanceShare(),
								av.art757B_reintegrated(), av.exempt()
						)).toList(),
				fd.donationDetails() == null ? List.of() : fd.donationDetails().stream().map(don ->
						new FiscalDetailsDto.DonationRecallDetailDto(
								don.beneficiaryName(), don.montant(), don.dateDonation(),
								don.rapportable(), don.recalled(), don.montantRappele(),
								don.abattementInitial(), don.abattementApresRappel()
						)).toList(),
				fd.legDetails() == null ? List.of() : fd.legDetails().stream().map(leg ->
						new FiscalDetailsDto.LegDetailDto(
								leg.legataireName(), leg.relationship(),
								leg.montant(), leg.droits()
						)).toList(),
				fd.totalLegsDeducted()
		);
	}
}
