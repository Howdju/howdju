import WritQuoteEditorFields from '../WritQuoteEditorFields'
import withEditor, { EntityEditorFieldsProps } from "@/editors/withEditor"
import { makeNewUrl, schemaIds } from 'howdju-common'
import { editors } from '../actions'
import { ComponentType } from 'react'
import { AppDispatch } from '@/store'
import { EditorType, EditorTypes } from '@/reducers/editors'

// TODO(#1): remove typecast
export default withEditor(
  EditorTypes.WRIT_QUOTE,
  WritQuoteEditorFields as ComponentType<EntityEditorFieldsProps>,
  'writQuote',
  schemaIds.writQuote,
  {
    onAddUrl: (editorType: EditorType, editorId: string, dispatch: AppDispatch) =>
      (index: number) =>
        dispatch(editors.addListItem(editorType, editorId, index, 'urls', makeNewUrl)),
    onRemoveUrl: (editorType: EditorType, editorId: string, dispatch: AppDispatch) =>
      (_url: string, index: number) =>
        dispatch(editors.removeListItem(editorType, editorId, index, 'urls')),
  }
)
