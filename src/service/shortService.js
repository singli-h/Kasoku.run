import axios from "axios"

const shortService = {
  shortenUrl: async (longUrl) => {
    try {
      const response = await axios.post(`/api/shorten`, {
        url: longUrl,
      })
      return response.data
    } catch (error) {
      return error
    }
  },
  redirectUser: async (shortUrlCode) => {
    try {
      const response = await axios.get(`/api/expand/${shortUrlCode}`)
      return response.data
    } catch (error) {
      return error
    }
  },
}

export default shortService
