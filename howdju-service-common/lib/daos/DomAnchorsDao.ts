import { merge } from "lodash";

import { CreateDomAnchor, EntityId } from "howdju-common";

import { Database } from "../database";

// DO_NOT_MERGE delete this?
export class DomAnchorsDao {
  database: Database;
  constructor(database: Database) {
    this.database = database;
  }

  async readOrCreateDomAnchors(
    creatorUserId: EntityId,
    urlLocatorId: EntityId,
    createDomAnchors: CreateDomAnchor[],
    created: Date
  ) {
    return await Promise.all(
      createDomAnchors.map((da) =>
        this.readOrCreateDomAnchor(creatorUserId, urlLocatorId, da, created)
      )
    );
  }

  async readOrCreateDomAnchor(
    creatorUserId: EntityId,
    urlLocatorId: EntityId,
    createDomAnchor: CreateDomAnchor,
    created: Date
  ) {
    const {
      rows: [row],
    } = await this.database.query(
      "readOrCreateDomAnchor",
      `insert into dom_anchors (
        url_locator_id,
        exact_text,
        prefix_text,
        suffix_text,
        start_offset,
        end_offset,
        creator_user_id,
        created
      ) values ($1, $2, $3, $4, $5, $6, $7, $8)
      `,
      [
        urlLocatorId,
        createDomAnchor.exactText,
        createDomAnchor.prefixText,
        createDomAnchor.suffixText,
        createDomAnchor.startOffset,
        createDomAnchor.endOffset,
        creatorUserId,
        created,
      ]
    );

    return merge({}, createDomAnchor, { id: row.dom_anchor_id });
  }
}
