import React  from 'react'

const ToolsPage = props => {
  const bookmarklet = '%22use%20strict%22%3B(function()%7Bvar%20e%3Dwindow.document%2Co%3D%7Burl%3Awindow.location.href%2Cdescription%3Ae.title%2Cquote%3Awindow.getSelection()%7C%7Ce.getSelection%7C%7Ce.getSelection()%7C%7Ce.selection%7C%7Ce.selection.createRange().text%2Csource%3A%22bookmarklet-v1%22%7D%2Ct%3D%5B%5D%3Bfor(var%20n%20in%20o)o.hasOwnProperty(n)%26%26t.push(n%2B%22%3D%22%2Bfunction(e)%7Breturn%20window.encodeURIComponent(e)%7D(o%5Bn%5D))%3Bvar%20i%3D%22%22%2Cc%3D%22http%3A%2F%2Fwww.howdju.com%22%2Bi%2B%22%2Fsubmit%3F%22%2Bt.join(%22%26%22)%3Bwindow.open(c)%7D)()%3B'
  return (
      <div className="md-grid">
        <div className="md-cell md-cell--12">
          <a title="Submit to Howdju" href={'javascript:' + bookmarklet}>+Howdju</a>
        </div>
      </div>
  )
}

export default ToolsPage
