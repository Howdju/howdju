import { requestMediaExcerptInfo } from "../requestMediaExcerptInfo";

export class MediaExcerptInfosService {
  async inferMediaExcerptInfo(url: string, quotation: string | undefined) {
    return requestMediaExcerptInfo(url, quotation);
  }
}
