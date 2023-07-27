const axios = require('axios')
const ComponentRequest = {
  async createComponent(component) {
    try{
      const response = await axios.post('http://127.0.0.1:7001/api/v1/components', component)
      if (response.code === 1) {
        return response.data 
      } else {
        throw new Error('组件添加失败')
      }
    }catch(e) {
      throw new Error(e)
    }
  }
}
module.exports = ComponentRequest