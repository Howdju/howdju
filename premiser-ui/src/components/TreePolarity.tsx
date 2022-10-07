import React, { ReactNode } from 'react'
import cn from 'classnames'
import { JustificationPolarities, JustificationPolarityType } from 'howdju-common'
import './TreePolarity.scss'

interface Props {
  polarity: JustificationPolarityType
  children: ReactNode
}
// Offsets and colors justifications in a tree according to their polarity.
export default function TreePolarityOffsetter({ polarity, children }: Props) {
  const isPositive = polarity === JustificationPolarities.POSITIVE
  const isNegative = polarity === JustificationPolarities.NEGATIVE
  return (
    <div
      className={cn({
        'tree-polarity--positive': isPositive,
        'tree-polarity--negative': isNegative
      })}
    >
      {children}
    </div>
  )
}
