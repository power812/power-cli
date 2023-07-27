const axios = require('axios')
const ComponentRequest = {
  async createComponent(component) {
    try{
      const response = await axios.post('http://127.0.0.1:7001/api/v1/components', component)
        return response.data 
   
    }catch(e) {
      throw new Error(e)
    }
  }
}
module.exports = ComponentRequest