import { EntityId } from "howdju-common";

import { AppearancesService } from "./AppearancesService";
import { SourcesService } from "./SourcesService";
import { UserIdent } from "./types";
import { UrlsService } from "./UrlsService";
import { UsersService } from "./UsersService";

export class FactChecksService {
  constructor(
    private readonly appearancesService: AppearancesService,
    private readonly usersService: UsersService,
    private readonly urlsService: UrlsService,
    private readonly sourcesService: SourcesService
  ) {}

  async readFactCheck(
    userIdent: UserIdent,
    userIds: EntityId[],
    urlIds: EntityId[],
    sourceIds: EntityId[]
  ) {
    const [appearances, users, urls, sources] = await Promise.all([
      this.appearancesService.readAppearancesWithOverlappingMediaExcerptsForUsers(
        userIdent,
        userIds,
        urlIds,
        sourceIds
      ),
      this.usersService.readUserBlurbsForIds(userIds),
      this.urlsService.readUrlsForIds(urlIds),
      this.sourcesService.readSourcesForIds(sourceIds),
    ]);
    return {
      appearances,
      users,
      urls,
      sources,
    };
  }
}
