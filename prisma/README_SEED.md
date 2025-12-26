# Database Seed Script

This seed script populates the database with realistic test data for development and testing purposes.

## What's Included

The seed script creates:

- **1 Cabinet**: Cabinet Aura Test (complete configuration)
- **2 Users**: 
  - Admin: `admin@aura.fr` (ADMIN role)
  - Conseiller: `conseiller@aura.fr` (ADVISOR role)
  - Password for both: `Password123!`

- **5 Clients**:
  - 3 Particuliers (Jean Dupont, Marie Martin, Pierre Durand)
  - 2 Professionnels (François Leblanc SARL, Isabelle Rousseau SAS)
  - All with realistic French data (addresses, SIRET, etc.)

- **Per Client Data**:
  - 2-3 Actifs (real estate, financial products)
  - 1-2 Passifs (mortgages, loans)
  - 1-2 Contrats (insurance, savings)
  - 3-5 Documents (ID, tax notices, bank statements)
  - 1-2 Objectifs (retirement, education, real estate)
  - 1 Projet with 2-3 linked Tâches

- **Global Data**:
  - 10 Tâches (various statuses: TODO, IN_PROGRESS, COMPLETED)
  - 5 RendezVous (future appointments with reminders)
  - 5 Opportunités (different pipeline statuses)
  - KYC Documents (complete for 2 clients)
  - 3 Simulations (retirement, loan, tax optimization)
  - Timeline Events (client history)

## Usage

### Run the seed script

```bash
npm run db:seed
```

### Verify the seeded data

```bash
npx tsx scripts/verify-seed.ts
```

### View data in Prisma Studio

```bash
npm run db:studio
```

## Idempotency

The script is idempotent - it checks if the cabinet already exists before seeding. If data exists, it will skip the seed process:

```
✅ Cabinet already exists, skipping seed
```

To re-seed, you need to manually delete the cabinet or reset the database:

```bash
# Reset database (WARNING: deletes all data)
npx prisma migrate reset

# Then seed again
npm run db:seed
```

## Test Credentials

After seeding, you can login with:

- **Admin**: 
  - Email: `admin@aura.fr`
  - Password: `Password123!`
  - Role: ADMIN (full permissions)

- **Conseiller**: 
  - Email: `conseiller@aura.fr`
  - Password: `Password123!`
  - Role: ADVISOR (client management)

## Data Characteristics

### Realistic French Data
- French names (Dupont, Martin, Durand, Leblanc, Rousseau)
- French addresses (Paris, Lyon, Bordeaux, Lille, Nice)
- Valid SIRET numbers for professional clients
- French phone numbers format
- Realistic financial values in EUR

### Complete Client Profiles
- Full KYC information
- Risk profiles (CONSERVATEUR to OFFENSIF)
- Investment horizons and goals
- Tax information (IR rates, IFI)
- Family information

### Varied Statuses
- Clients: ACTIVE, PROSPECT
- KYC: COMPLETED, IN_PROGRESS
- Tasks: TODO, IN_PROGRESS, COMPLETED
- Opportunities: DETECTED, QUALIFIED, CONTACTED, PRESENTED, ACCEPTED
- Projects: PLANNED, IN_PROGRESS

### Realistic Relationships
- Actifs linked to clients via ClientActif
- Passifs linked to actifs (mortgages)
- Documents linked to clients, actifs, passifs, contrats
- Tâches linked to clients and projets
- Timeline events tracking client history

## Customization

To customize the seed data, edit `prisma/seed.ts`:

1. Modify cabinet configuration
2. Add/remove users
3. Adjust client profiles
4. Change financial values
5. Add more documents, tasks, etc.

After making changes, run:

```bash
npm run db:seed
```

## Troubleshooting

### Error: Cabinet already exists
The script is idempotent. To re-seed, reset the database first.

### Error: Foreign key constraint
Make sure all migrations are applied:
```bash
npm run db:migrate
```

### Error: Connection refused
Check your DATABASE_URL in `.env` file.

## Notes

- All passwords are hashed with bcrypt
- Dates are set relative to current date where appropriate
- File URLs are placeholder paths (actual files not created)
- Email addresses are fictional
- SIRET numbers are valid format but fictional
