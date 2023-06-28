import { AuthToken } from "howdju-common";

import { requestMediaExcerptInfo } from "../requestMediaExcerptInfo";
import { AuthService } from "./AuthService";

export class MediaExcerptInfosService {
  constructor(private authService: AuthService) {}

  async inferMediaExcerptInfo(
    authToken: AuthToken,
    url: string,
    quotation: string
  ) {
    // Just ensure the user exists to prevent anonymous requests to this endpoint.
    await this.authService.readUserIdForAuthToken(authToken);

    return requestMediaExcerptInfo(url, quotation);
  }
}
