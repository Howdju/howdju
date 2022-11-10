import { rest } from 'msw'

export const handlers = [
  // rest.get('http://localhost:8081/api/registration-requests', (req, res, ctx) => {
  //   return res(
  //     // Respond with a 200 status code
  //     ctx.status(200),
  //     ctx.json({
  //       username: "admin",
  //     })
  //   )
  // }),
]
