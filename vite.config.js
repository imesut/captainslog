export default {
  server: {
    allowedHosts: process.env.VITE_ALLOWED_HOSTS 
      ? process.env.VITE_ALLOWED_HOSTS.split(",") 
      : ["cms.captainslog.page"],
  },
}