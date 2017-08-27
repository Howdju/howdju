const {
  JustificationRootPolarity,
} = require('../src/models')
const {
  JustificationTargetType,
} = require('howdju-models')

const updateRootPolarity = () => query(`
      update justifications j1
        set root_polarity = 
          case 
            when j2.root_polarity = $2 then $3 
            when j2.root_polarity = $3 then $2
          end
        from justifications j2 
          where
              j1.target_type = $1 
          and j1.root_polarity is null
          and j1.target_id = j2.justification_id 
          and j2.root_polarity is not null 
      `, [JustificationTargetType.JUSTIFICATION, JustificationRootPolarity.POSITIVE, JustificationRootPolarity.NEGATIVE])
    .then( ({rows}) => {
      // Continue until no more have been updated
      if (rows.length > 0) {
        updateRootPolarity()
      }
    })

const updateRootJustifications =
    query(`update justifications set root_polarity = polarity where target_type = $1 and root_polarity is null`, [JustificationTargetType.STATEMENT])
        .then(updateRootPolarity)

updateRootJustifications()
