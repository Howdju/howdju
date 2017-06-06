export class ApiResponseError extends Error {
  constructor(status, json, error) {
    super()

    this.status = status
    this.error = error
    this.json = json
  }
}