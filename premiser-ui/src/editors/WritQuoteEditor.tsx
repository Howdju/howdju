import WritQuoteEditorFields from '../WritQuoteEditorFields'
import withEditor, { EntityEditorFieldsProps } from "@/editors/withEditor"
import { makeNewUrl } from 'howdju-common'
import { editors } from '../actions'
import { ComponentType } from 'react'
import { AppDispatch } from '@/store'

// TODO(#1): remove typecast
export default withEditor(WritQuoteEditorFields as ComponentType<EntityEditorFieldsProps>, 'writQuote', {
  onAddUrl: (editorType: string, editorId: string, dispatch: AppDispatch) =>
    (index: number) =>
      dispatch(editors.addListItem(editorType, editorId, index, 'urls', makeNewUrl)),
  onRemoveUrl: (editorType: string, editorId: string, dispatch: AppDispatch) =>
    (_url: string, index: number) =>
      dispatch(editors.removeListItem(editorType, editorId, index, 'urls')),
})
