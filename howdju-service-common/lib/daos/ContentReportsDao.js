const { BaseDao } = require("./BaseDao");
const { toContentReport, fromIdString } = require("./orm");

module.exports.ContentReportsDao = class ContentReportsDao extends BaseDao {
  constructor(logger, database) {
    super(logger, database, toContentReport);
  }

  async createContentReport(contentReport, userId, now) {
    const args = [
      contentReport.entityType,
      fromIdString(contentReport.entityId),
      contentReport.url,
      contentReport.types,
      contentReport.description,
      fromIdString(userId),
      now,
    ];
    const sql = `
      insert into content_reports (
        entity_type,
        entity_id,
        url,
        types,
        description,
        reporter_user_id,
        created
      ) 
      values ($1, $2, $3, $4, $5, $6, $7)
      returning *
    `;
    return await this.queryOne("createContentReport", sql, args);
  }
};
