# SMP Simulateur — Backend Java (Spring Boot)

## Prérequis
- **Java 17+** (ou Java 21)
- Maven 3.9+ (inclus via `mvnw`)

## Démarrage rapide

```bash
cd smp-java-backend
chmod +x mvnw
./mvnw clean install -DskipTests
./mvnw -pl smp-api spring-boot:run
```

Le serveur démarre sur **http://localhost:8081**.

## Architecture

```
smp-java-backend/
├── pom.xml                    # Parent POM (multi-module Maven)
├── smp-domain/                # Modèle métier (entités, enums, interfaces)
├── smp-application/           # Moteurs de calcul + services résultats
├── smp-infra/                 # Infrastructure (YAML fiscal rules)
├── smp-api/                   # Contrôleurs REST Spring Boot
└── src/                       # Application principale (SmpApplication)
```

## Endpoints principaux

| Méthode | URL | Description |
|---------|-----|-------------|
| POST | `/api/succession/simulate` | Simulation de succession complète |
| POST | `/api/succession/notarial` | Calcul notarial détaillé |

## Configuration

- Port : `8081` (configurable dans `smp-api/src/main/resources/application.yml`)
- Règles fiscales : `smp-infra/src/main/resources/fiscal-rules.yml` (barème 2026)

## Intégration avec le CRM Next.js

Le frontend Next.js appelle ce backend Java via les API routes proxy dans :
`app/(advisor)/(backend)/api/advisor/simulators/succession-smp/`
