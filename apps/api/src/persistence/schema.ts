import { sql } from 'drizzle-orm';
import {
  pgTable,
  uuid,
  text,
  timestamp,
  boolean,
  unique,
  foreignKey,
  primaryKey,
  check,
  index,
} from 'drizzle-orm/pg-core';

const timestamps = () => ({
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
});
const id = () => uuid('id').primaryKey().defaultRandom();
// No soft-delete, hierarchy, email uniqueness or permission matrix is inferred.
export const organizations = pgTable('organizations', {
  id: id(),
  name: text('name').notNull(),
  ...timestamps(),
}).enableRLS();
export const users = pgTable('users', {
  id: id(),
  name: text('name').notNull(),
  email: text('email').notNull(),
  ...timestamps(),
});
export const roles = pgTable('roles', {
  id: id(),
  code: text('code').notNull().unique(),
  ...timestamps(),
});
export const businessUnits = pgTable(
  'business_units',
  {
    id: id(),
    organizationId: uuid('organization_id')
      .notNull()
      .references(() => organizations.id),
    name: text('name').notNull(),
    ...timestamps(),
  },
  (t) => [unique('business_units_tenant_id').on(t.organizationId, t.id)],
).enableRLS();
export const memberships = pgTable(
  'memberships',
  {
    id: id(),
    organizationId: uuid('organization_id')
      .notNull()
      .references(() => organizations.id),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id),
    active: boolean('active').notNull(),
    ...timestamps(),
  },
  (t) => [
    unique('memberships_tenant_id').on(t.organizationId, t.id),
    unique('memberships_user_tenant').on(t.organizationId, t.userId),
    index('memberships_user_idx').on(t.userId),
  ],
).enableRLS();
export const roleAssignments = pgTable(
  'role_assignments',
  {
    id: id(),
    organizationId: uuid('organization_id').notNull(),
    membershipId: uuid('membership_id').notNull(),
    roleId: uuid('role_id')
      .notNull()
      .references(() => roles.id),
    scope: text('scope').notNull(),
    ...timestamps(),
  },
  (t) => [
    check(
      'role_assignments_scope',
      sql`${t.scope} in ('ORGANIZATION', 'BUSINESS_UNIT')`,
    ),
    unique('role_assignments_tenant_id').on(t.organizationId, t.id),
    unique('role_assignments_tenant_id_scope').on(
      t.organizationId,
      t.id,
      t.scope,
    ),
    foreignKey({
      columns: [t.organizationId, t.membershipId],
      foreignColumns: [memberships.organizationId, memberships.id],
      name: 'role_assignments_membership_tenant_fk',
    }),
    index('role_assignments_membership_idx').on(
      t.organizationId,
      t.membershipId,
    ),
    index('role_assignments_role_idx').on(t.roleId),
  ],
).enableRLS();
// Areas belong to the individual grant, never to a Cartesian product of roles/areas.
export const roleAssignmentBusinessUnits = pgTable(
  'role_assignment_business_units',
  {
    organizationId: uuid('organization_id').notNull(),
    roleAssignmentId: uuid('role_assignment_id').notNull(),
    businessUnitId: uuid('business_unit_id').notNull(),
    scope: text('scope').notNull().default('BUSINESS_UNIT'),
  },
  (t) => [
    primaryKey({
      columns: [t.organizationId, t.roleAssignmentId, t.businessUnitId],
    }),
    check('grant_areas_business_unit_scope', sql`${t.scope} = 'BUSINESS_UNIT'`),
    foreignKey({
      columns: [t.organizationId, t.roleAssignmentId, t.scope],
      foreignColumns: [
        roleAssignments.organizationId,
        roleAssignments.id,
        roleAssignments.scope,
      ],
      name: 'grant_areas_assignment_tenant_scope_fk',
    }),
    foreignKey({
      columns: [t.organizationId, t.businessUnitId],
      foreignColumns: [businessUnits.organizationId, businessUnits.id],
      name: 'grant_areas_business_unit_tenant_fk',
    }),
    index('grant_areas_business_unit_idx').on(
      t.organizationId,
      t.businessUnitId,
    ),
  ],
).enableRLS();
