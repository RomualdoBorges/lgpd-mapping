import {
  Inject,
  Injectable,
  type OnModuleDestroy,
  type OnModuleInit,
} from '@nestjs/common';
import { drizzle } from 'drizzle-orm/node-postgres';
import { sql } from 'drizzle-orm';
import pg from 'pg';
import * as schema from './schema.js';
import { withTenant, type TenantTransaction } from './tenant-transaction.js';
import { ENVIRONMENT, type Environment } from '../config/environment.js';
import {
  findSessionByTokenDigest,
  type ResolvedSession,
} from './auth-repositories.js';
import {
  resolveMembership,
  type ResolvedMembership,
} from './membership-bootstrap-repository.js';
import type { AuthorizedTenantContext } from '../tenant/authorized-tenant-context.js';

@Injectable()
export class DatabaseService implements OnModuleInit, OnModuleDestroy {
  private readonly pool: pg.Pool;
  private readonly database;
  constructor(@Inject(ENVIRONMENT) environment: Environment) {
    this.pool = new pg.Pool(environment.database);
    this.pool.on('error', () =>
      console.error('Conexão PostgreSQL indisponível.'),
    );
    this.database = drizzle(this.pool, { schema });
  }
  withAuthorizedTenant<T>(
    context: AuthorizedTenantContext,
    operation: (transaction: TenantTransaction) => Promise<T>,
  ): Promise<T> {
    return withTenant(
      this.database,
      context.authorizedOrganizationId,
      operation,
    );
  }
  resolveSessionByTokenDigest(
    tokenDigest: string,
  ): Promise<ResolvedSession | null> {
    return findSessionByTokenDigest(this.database, tokenDigest);
  }
  resolveMembership(
    authenticatedUserId: string,
    requestedOrganizationId: string,
  ): Promise<ResolvedMembership | null> {
    return resolveMembership(
      this.database,
      authenticatedUserId,
      requestedOrganizationId,
    );
  }
  async onModuleInit(): Promise<void> {
    await this.database.execute(sql`select 1`);
  }
  async onModuleDestroy(): Promise<void> {
    await this.pool.end();
  }
}
