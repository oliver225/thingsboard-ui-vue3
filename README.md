# thingsboard-ui-vue


ThingsBoard凭借其优秀的性能和高效的性能得到了广大开发者的认可

本项目为基于Vue开发的 ThingsBoard 前台
## thingsbaord
 
- 后台版本为 thingsboard：V3.5.1 

## 使用技术

- [Vite](https://vitejs.dev/) 
- [Vue-v3](https://cn.vuejs.org/) 
- [Vue-Router-v4](https://next.router.vuejs.org/) 
- [JeeSite Vue3](https://gitee.com/thinkgem/jeesite-vue/)
- [Vue-Vben-Admin](https://jeesite.com/front/vben-admin/)
- [Ant-Design-Vue](https://antdv.com/components/overview-cn/)
- [AntV x6](https://x6.antv.antgroup.com/)
  
## 启动
- 打开 .env.development 文件，修改后台接口：
  ```bash
  # 代理设置，可配置多个，不能换行，格式：[访问接口的根路径, 代理地址, 是否保持Host头]
   VITE_PROXY = [["/api","http://127.0.0.1:8080/api",false]]
  # 访问接口的根路径
   VITE_GLOB_API_URL =
- 运行、打包
   ```bash
   # 安装依赖
   yarn install
   # 开发环境运行
   yarn serve
   # 编译打包后运行访问
   yarn preview
   # 打包
   yarn build
## 规则引擎
- [AntV x6](https://x6.antv.antgroup.com/)
  

![规则引擎](images/%E5%BE%AE%E4%BF%A1%E5%9B%BE%E7%89%87_20240227085337.png)

## 预览图片

![管理员仪表盘](images/%E5%BE%AE%E4%BF%A1%E5%9B%BE%E7%89%87_20240219165424.png)
![租户仪表盘](images/%E5%BE%AE%E4%BF%A1%E5%9B%BE%E7%89%87_20240219165338.png)
![租户仪表盘](images/%E5%BE%AE%E4%BF%A1%E5%9B%BE%E7%89%87_20240219164906.png)
![租户仪表盘](images/%E5%BE%AE%E4%BF%A1%E5%9B%BE%E7%89%87_20240219164934.png)
![租户仪表盘](images/%E5%BE%AE%E4%BF%A1%E5%9B%BE%E7%89%87_20240219165036.png)
![租户仪表盘](images/%E5%BE%AE%E4%BF%A1%E5%9B%BE%E7%89%87_20240219165220.png)
![租户仪表盘](images/%E5%BE%AE%E4%BF%A1%E5%9B%BE%E7%89%87_20240219165220.png)
![租户仪表盘](images/%E5%BE%AE%E4%BF%A1%E5%9B%BE%E7%89%87_20240219165300.png)
![租户仪表盘](images/%E5%BE%AE%E4%BF%A1%E5%9B%BE%E7%89%87_20240219165313.png)
![租户仪表盘](images/%E5%BE%AE%E4%BF%A1%E5%9B%BE%E7%89%87_20240219165618.png)