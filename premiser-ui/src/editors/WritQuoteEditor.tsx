import WritQuoteEditorFields from '../WritQuoteEditorFields'
import withEditor from "@/editors/withEditor"
import { makeNewUrl } from 'howdju-common/lib/models'
import { editors } from '../actions'

export default withEditor(WritQuoteEditorFields, 'writQuote', {
  onAddUrl: (editorType: string, editorId: string, dispatch) =>
    (index: number) =>
      dispatch(editors.addListItem(editorType, editorId, index, 'urls', makeNewUrl)),
  onRemoveUrl: (editorType: string, editorId: string, dispatch) =>
    (url, index) =>
      dispatch(editors.removeListItem(editorType, editorId, index, 'urls')),
})
