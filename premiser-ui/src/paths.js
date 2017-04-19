export const paths = {
  home: () => '/',
  login: () => '/login',
  statement: ({id, slug}) => `/s/${id}/${slug}`,
}

export default paths