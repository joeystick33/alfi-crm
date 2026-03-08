package com.alkaus.smp.application.inheritanceCompleteResults.service;

import static org.assertj.core.api.Assertions.assertThat;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import com.alkaus.smp.application.inheritanceCompleteResults.command.AdvisorCommand;
import com.alkaus.smp.application.inheritanceCompleteResults.command.CompleteResultsCommand;
import com.alkaus.smp.application.inheritanceCompleteResults.command.PersonCommand;
import com.alkaus.smp.application.inheritanceCompleteResults.model.MetadataResult;

public class MetadataServiceImplTest {

    private final MetadataServiceImpl svc = new MetadataServiceImpl();

    @Test
    @DisplayName("build(): advisor null -> advisor fields null and normalizations applied")
    void build_advisorNull_normalizeAndCustomer() {
        PersonCommand client = new PersonCommand("John", "Doe", 40, "M");
        CompleteResultsCommand cmd = new CompleteResultsCommand(
                "marié", // maritalStatus
                "communauté réduite", // matrimonialRegime
                client,
                null,
                List.of(),
                null,
                List.of(),
                List.of(),
                BigDecimal.ZERO,
                BigDecimal.ZERO,
                null,
                null,
                BigDecimal.ZERO,
                BigDecimal.ZERO
        );

        MetadataResult res = svc.build(cmd);

        assertThat(res).isNotNull();
        assertThat(res.studyDate()).isEqualTo(LocalDate.now());
        assertThat(res.customer().firstName()).isEqualTo("John");
        assertThat(res.customer().lastName()).isEqualTo("Doe");
        assertThat(res.advisor().name()).isNull();
        assertThat(res.advisor().firm()).isNull();
        assertThat(res.advisor().email()).isNull();
        assertThat(res.maritalStatus()).isEqualTo("Marié(e)");
        assertThat(res.matrimonialRegime()).isEqualTo("Communauté réduite aux acquêts");
    }

    @Test
    @DisplayName("build(): advisor provided -> advisor fields copied; blank regime -> null")
    void build_withAdvisor_blankRegimeBecomesNull() {
        PersonCommand client = new PersonCommand("Ann", "Smith", 30, "F");
        AdvisorCommand adv = new AdvisorCommand("Advisor Name", "MyFirm", "a@firm.com");

        CompleteResultsCommand cmd = new CompleteResultsCommand(
                "célibataire", // maritalStatus (accented)
                "   ", // matrimonialRegime blank -> should become null
                client,
                null,
                List.of(),
                null,
                List.of(),
                List.of(),
                BigDecimal.ZERO,
                BigDecimal.ZERO,
                null,
                adv,
                BigDecimal.ZERO,
                BigDecimal.ZERO
        );

        MetadataResult res = svc.build(cmd);

        assertThat(res.advisor().name()).isEqualTo("Advisor Name");
        assertThat(res.advisor().firm()).isEqualTo("MyFirm");
        assertThat(res.advisor().email()).isEqualTo("a@firm.com");
        assertThat(res.matrimonialRegime()).isNull();
        assertThat(res.maritalStatus()).isEqualTo("Célibataire");
    }

    @Test
    @DisplayName("build(): unknown values are trimmed and returned as-is when no mapping applies")
    void build_unknownValues_trimmedDefault() {
        PersonCommand client = new PersonCommand("X", "Y", 50, "M");

        CompleteResultsCommand cmd = new CompleteResultsCommand(
                "  Inconnu ", // no mapping -> trimmed
                " Custom Regime  ", // no mapping -> trimmed
                client,
                null,
                List.of(),
                null,
                List.of(),
                List.of(),
                BigDecimal.ZERO,
                BigDecimal.ZERO,
                null,
                null,
                BigDecimal.ZERO,
                BigDecimal.ZERO
        );

        MetadataResult res = svc.build(cmd);

        assertThat(res.maritalStatus()).isEqualTo("Inconnu");
        assertThat(res.matrimonialRegime()).isEqualTo("Custom Regime");
    }

    @Test
    @DisplayName("build(): null or blank maritalStatus -> null")
    void build_nullOrBlankMaritalStatus_returnsNull() {
        PersonCommand client = new PersonCommand("A", "B", 20, "F");

        CompleteResultsCommand cmdNull = new CompleteResultsCommand(
                null,
                null,
                client,
                null,
                List.of(),
                null,
                List.of(),
                List.of(),
                BigDecimal.ZERO,
                BigDecimal.ZERO,
                null,
                null,
                BigDecimal.ZERO,
                BigDecimal.ZERO
        );

        MetadataResult r1 = svc.build(cmdNull);
        assertThat(r1.maritalStatus()).isNull();

        CompleteResultsCommand cmdBlank = new CompleteResultsCommand(
                "   ",
                "   ",
                client,
                null,
                List.of(),
                null,
                List.of(),
                List.of(),
                BigDecimal.ZERO,
                BigDecimal.ZERO,
                null,
                null,
                BigDecimal.ZERO,
                BigDecimal.ZERO
        );

        MetadataResult r2 = svc.build(cmdBlank);
        assertThat(r2.maritalStatus()).isNull();
        assertThat(r2.matrimonialRegime()).isNull();
    }
}
