import React from 'react'
import cn from 'classnames'
import { AccountSettings } from 'howdju-common'
import { ComponentId } from '@/types'

interface Props {
  id: ComponentId
  accountSettings: AccountSettings | null,
  className?: string
}

export default function AccountSettingsViewer({
  id,
  accountSettings,
  className,
}: Props) {
  return (
    <div
      id={id}
      className={cn(className, "persorg-viewer")}
    >
      {accountSettings && (
        <>
          <h2>Paid contributions disclosure</h2>
          <p>
            {accountSettings.paidContributionsDisclosure || <em>None</em>}
          </p>
        </>
      )}
    </div>
  )
}
