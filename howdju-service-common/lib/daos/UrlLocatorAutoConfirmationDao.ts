import {
  EntityId,
  logger,
  toJson,
  UrlLocatorAutoConfirmationStatus,
} from "howdju-common";
import { Moment } from "moment";

import { Database } from "../database/Database";

/** Records the outcome of auto-confirming a UrlLocator. */
export type CreateUrlLocatorAutoConfirmationResult = {
  /** The UrlLocator that was confirmed */
  urlLocatorId: EntityId;
  /** The URL that was requested */
  url: string;
  completeAt: Moment;
  /** The quotation that was confirmed */
  quotation: string;
} & (
  | {
      /** Must matche the auto_confirmation_result enum in the database. */
      status: "FOUND";
      /** The quotation that was found. */
      foundQuotation: string;
      errorMessage?: undefined;
    }
  | {
      status: "NOT_FOUND";
      foundQuotation?: undefined;
      errorMessage?: undefined;
    }
  | {
      status: "ERROR";
      foundQuotation?: undefined;
      errorMessage: string;
    }
);

export type UrlLocatorAutoConfirmationResult =
  CreateUrlLocatorAutoConfirmationResult & {
    id: EntityId;
  };

export class UrlLocatorAutoConfirmationDao {
  constructor(private readonly database: Database) {}

  async create(
    result: CreateUrlLocatorAutoConfirmationResult
  ): Promise<UrlLocatorAutoConfirmationResult> {
    const {
      rows: [row],
    } = await this.database.query(
      "UrlLocatorAutoConfirmationDao.create",
      `INSERT INTO url_locator_auto_confirmation_results
      (url_locator_id, url, complete_at, status, quotation, found_quotation, error_message)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      returning url_locator_auto_confirmation_result_id`,
      [
        result.urlLocatorId,
        result.url,
        result.completeAt,
        result.status,
        result.quotation,
        result.foundQuotation,
        result.errorMessage,
      ]
    );
    return {
      ...result,
      id: row.url_locator_auto_confirmation_result_id,
    };
  }

  async readConfirmationStatusForUrlLocatorId(
    urlLocatorId: EntityId
  ): Promise<UrlLocatorAutoConfirmationStatus> {
    // Read the most recent success and failure, if any
    const { rows } = await this.database.query(
      "readConfirmationStatusForUrlLocatorId",
      `
      -- We are potentially intersted in five timestamps:
      -- 1. The latest time the quotation was found
      -- 2. The earliest time the quotation was found in the window of continuous 'found's since (1)
      -- 3. The latest time the quotation was not found (if it was not found most recently)
      -- 4. The earliest time the quotation was not found in the window of continuous 'not-found's since (3)
      -- 5. The earliest time we checked for the quotation.

      with
        latest_found as (
          select
              *
            , 'latest_found' as case_name
          from url_locator_auto_confirmation_results
          where
                url_locator_id = $1
            and status = 'FOUND'
          order by complete_at desc
          limit 1
        )
        , earliest_found_after_not_found as (
          select
              *
            , 'earliest_found_after_not_found' as case_name
          from url_locator_auto_confirmation_results
          where
                url_locator_id = $1
            and status = 'FOUND'
            and complete_at > (
              select max(complete_at)
              from url_locator_auto_confirmation_results
              where
                    url_locator_id = $1
                and status = 'NOT_FOUND'
                and complete_at < (
                  select complete_at from latest_found
                )
            )
          order by complete_at asc
          limit 1
        )
        , earliest_found as (
          select
              *
            , 'earliest_found' as case_name
          from url_locator_auto_confirmation_results
          where
            url_locator_id = $1
            and status = 'FOUND'
          order by complete_at asc
          limit 1
        )
        , latest_not_found as (
          select
              *
            , 'latest_not_found' as case_name
          from url_locator_auto_confirmation_results
          where
                url_locator_id = $1
            and status = 'NOT_FOUND'
          order by complete_at desc
          limit 1
        )
        , earliest_not_found_after_found as (
          select
              *
            , 'earliest_not_found_after_found' as case_name
          from url_locator_auto_confirmation_results
          where
                url_locator_id = $1
            and status = 'NOT_FOUND'
            and complete_at > (
              select max(complete_at)
              from url_locator_auto_confirmation_results
              where
                   url_locator_id = $1
               and status = 'FOUND'
            )
          order by complete_at asc
          limit 1
        )
        , earliest_not_found as (
          select
              *
            , 'earliest_not_found' as case_name
          from url_locator_auto_confirmation_results
          where
                url_locator_id = $1
            and status = 'NOT_FOUND'
          order by complete_at asc
          limit 1
        )
        , errored as (
          select
              *
            , 'errored' as case_name
          from url_locator_auto_confirmation_results
          where
                url_locator_id = $1
            and status = 'NOT_FOUND'
          order by complete_at desc
          limit 1
        )
      select *
      from (
        select * from latest_found
        union
        select * from earliest_found
        union
        select * from earliest_found_after_not_found
        union
        select * from latest_not_found
        union
        select * from earliest_not_found
        union
        select * from earliest_not_found_after_found
        union
        select * from errored
      ) as results
      `,
      [urlLocatorId]
    );

    let foundQuotation,
      earliestFoundAt,
      earliestFoundAtAfterNotFound,
      latestFoundAt,
      earliestNotFoundAt,
      earliestNotFoundAtAfterFound,
      latestNotFoundAt,
      url,
      quotation,
      latestErrorAt,
      errorMessage;
    for (const row of rows) {
      switch (row.case_name) {
        case "latest_found":
          latestFoundAt = row.complete_at;
          foundQuotation = row.found_quotation;
          break;
        case "earliest_found":
          earliestFoundAt = row.complete_at;
          break;
        case "earliest_found_after_not_found":
          earliestFoundAtAfterNotFound = row.complete_at;
          break;
        case "latest_not_found":
          latestNotFoundAt = row.complete_at;
          break;
        case "earliest_not_found":
          earliestNotFoundAt = row.complete_at;
          break;
        case "earliest_not_found_after_found":
          earliestNotFoundAtAfterFound = row.complete_at;
          break;
        case "error":
          url = row.url;
          quotation = row.quotation;
          latestErrorAt = row.complete_at;
          errorMessage = row.error_message;
          break;
      }
    }

    if (!latestFoundAt && !latestNotFoundAt) {
      if (latestErrorAt) {
        logger.error(
          `Auto-confirmation of UrlLocator ${urlLocatorId} has only ever errored (latest at ${latestErrorAt}): ${toJson(
            {
              url,
              quotation,
              errorMessage,
            }
          )}`
        );
      }
      return {
        status: "NEVER_TRIED",
      };
    }

    if (!latestFoundAt && latestNotFoundAt) {
      return {
        status: "NEVER_FOUND",
        earliestNotFoundAt: earliestNotFoundAtAfterFound || earliestNotFoundAt,
        latestNotFoundAt,
      };
    }
    if (
      latestFoundAt &&
      (!latestNotFoundAt || latestFoundAt.isAfter(latestNotFoundAt))
    ) {
      return {
        status: "FOUND",
        latestFoundAt,
        earliestFoundAt: earliestFoundAtAfterNotFound || earliestFoundAt,
        foundQuotation,
      };
    }
    return {
      status: "PREVIOUSLY_FOUND",
      earliestNotFoundAt: earliestNotFoundAtAfterFound,
      latestNotFoundAt,
      earliestFoundAt: earliestFoundAtAfterNotFound || earliestFoundAt,
      latestFoundAt,
      foundQuotation,
    };
  }
}
