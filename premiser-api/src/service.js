const {query, queries} = require('./db')
const {toStatement, toJustification} = require('./orm')

exports.statements = () => query('select * from statements')
    .then(({rows: statements}) => statements.map(toStatement))

exports.statementJustifications = (statementId) => queries([
      [
        'select * from statements where statement_id = $1',
        [statementId]
      ],
      [
        `select 
                  j.*,
                  s.text as basis_statement_text,
                  r.reference_id as basis_reference_id,
                  r.quote as basis_reference_quote,
                  c.citation_id as basis_reference_citation_id,
                  c.text as basis_reference_citation_text
                from justifications j 
                  left join statements s ON j.basis_type = 'STATEMENT' AND j.basis_id = s.statement_id
                  left join "references" r ON j.basis_type = 'REFERENCE' AND j.basis_id = r.reference_id
                  left join citations c USING (citation_id)
                  where j.target_type = $1 AND j.target_id = $2`,
        ['STATEMENT', statementId]
      ],
      [
        `select 
                    j.justification_id, 
                    u.* 
                  from justifications j 
                    join "references" r ON j.basis_type = 'REFERENCE' AND j.basis_id = r.reference_id
                    join reference_urls USING (reference_id)
                    join urls u USING (url_id)
                    where j.target_type = $1 AND j.target_id = $2
                    order by j.justification_id`,
        ['STATEMENT', statementId]
      ]
    ])
    .then(([{rows: [statement]}, {rows: justifications}, {rows: urls}]) => {
      const urlsByJustificationId = {}
      for (let url of urls) {
        if (!urlsByJustificationId.hasOwnProperty(url.justification_id)) {
          urlsByJustificationId[url.justification_id] = []
        }
        urlsByJustificationId[url.justification_id].push(url)
      }
      debugger
      return {
        statement: toStatement(statement),
        justifications: justifications.map(j => toJustification(j, urlsByJustificationId[j.justification_id]))
      }
    })