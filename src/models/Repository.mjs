// DAO: toda consulta usa parâmetros; o domínio não conhece HTTP.
export class Repository {
  constructor(db) { this.db = db; }
  async one(sql, ...args) { return this.db.prepare(sql).bind(...args).first(); }
  async all(sql, ...args) { return (await this.db.prepare(sql).bind(...args).all()).results; }
  async run(sql, ...args) { return this.db.prepare(sql).bind(...args).run(); }
  async batch(statements) { return this.db.batch(statements.map(([sql,...args])=>this.db.prepare(sql).bind(...args))); }
}
