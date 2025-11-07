// vite.config.js
import { defineConfig } from "file:///D:/OneDrive%20-%20Universitas%20Katolik%20Parahyangan/UNPAR/Semester%208/TA/MiWau-Tugas%20Akhir/frontend/node_modules/vite/dist/node/index.js";
import react from "file:///D:/OneDrive%20-%20Universitas%20Katolik%20Parahyangan/UNPAR/Semester%208/TA/MiWau-Tugas%20Akhir/frontend/node_modules/@vitejs/plugin-react/dist/index.js";
import path from "path";
import tagger from "file:///D:/OneDrive%20-%20Universitas%20Katolik%20Parahyangan/UNPAR/Semester%208/TA/MiWau-Tugas%20Akhir/frontend/node_modules/@dhiwise/component-tagger/dist/index.mjs";
var vite_config_default = defineConfig({
  plugins: [react(), tagger()],
  build: {
    outDir: "build"
  },
  resolve: {
    alias: {
      "@": path.resolve("./src"),
      "@components": path.resolve("./src/components"),
      "@pages": path.resolve("./src/pages"),
      "@assets": path.resolve("./src/assets"),
      "@constants": path.resolve("./src/constants"),
      "@styles": path.resolve("./src/styles")
    }
  },
  server: {
    port: "4028",
    host: "0.0.0.0",
    strictPort: true,
    allowedHosts: [".amazonaws.com", ".builtwithrocket.new"],
    proxy: {
      // Setiap permintaan yang dimulai dengan '/api'
      "/api": {
        // Akan diarahkan ke server backend Anda di port 3000
        target: "http://localhost:3000",
        // Wajib untuk mengubah origin header
        changeOrigin: true
      }
    }
  }
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcuanMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJEOlxcXFxPbmVEcml2ZSAtIFVuaXZlcnNpdGFzIEthdG9saWsgUGFyYWh5YW5nYW5cXFxcVU5QQVJcXFxcU2VtZXN0ZXIgOFxcXFxUQVxcXFxNaVdhdS1UdWdhcyBBa2hpclxcXFxmcm9udGVuZFwiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9maWxlbmFtZSA9IFwiRDpcXFxcT25lRHJpdmUgLSBVbml2ZXJzaXRhcyBLYXRvbGlrIFBhcmFoeWFuZ2FuXFxcXFVOUEFSXFxcXFNlbWVzdGVyIDhcXFxcVEFcXFxcTWlXYXUtVHVnYXMgQWtoaXJcXFxcZnJvbnRlbmRcXFxcdml0ZS5jb25maWcuanNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfaW1wb3J0X21ldGFfdXJsID0gXCJmaWxlOi8vL0Q6L09uZURyaXZlJTIwLSUyMFVuaXZlcnNpdGFzJTIwS2F0b2xpayUyMFBhcmFoeWFuZ2FuL1VOUEFSL1NlbWVzdGVyJTIwOC9UQS9NaVdhdS1UdWdhcyUyMEFraGlyL2Zyb250ZW5kL3ZpdGUuY29uZmlnLmpzXCI7Ly8gdml0ZS5jb25maWcuanNcbmltcG9ydCB7IGRlZmluZUNvbmZpZyB9IGZyb20gJ3ZpdGUnO1xuaW1wb3J0IHJlYWN0IGZyb20gJ0B2aXRlanMvcGx1Z2luLXJlYWN0JztcbmltcG9ydCBwYXRoIGZyb20gJ3BhdGgnO1xuaW1wb3J0IHRhZ2dlciBmcm9tIFwiQGRoaXdpc2UvY29tcG9uZW50LXRhZ2dlclwiO1xuXG4vLyBodHRwczovL3ZpdGVqcy5kZXYvY29uZmlnL1xuZXhwb3J0IGRlZmF1bHQgZGVmaW5lQ29uZmlnKHtcbiAgcGx1Z2luczogW3JlYWN0KCksIHRhZ2dlcigpXSxcbiAgYnVpbGQ6IHtcbiAgICBvdXREaXI6IFwiYnVpbGRcIixcbiAgfSxcbiAgcmVzb2x2ZToge1xuICAgIGFsaWFzOiB7XG4gICAgICAnQCc6IHBhdGgucmVzb2x2ZSgnLi9zcmMnKSxcbiAgICAgICdAY29tcG9uZW50cyc6IHBhdGgucmVzb2x2ZSgnLi9zcmMvY29tcG9uZW50cycpLFxuICAgICAgJ0BwYWdlcyc6IHBhdGgucmVzb2x2ZSgnLi9zcmMvcGFnZXMnKSxcbiAgICAgICdAYXNzZXRzJzogcGF0aC5yZXNvbHZlKCcuL3NyYy9hc3NldHMnKSxcbiAgICAgICdAY29uc3RhbnRzJzogcGF0aC5yZXNvbHZlKCcuL3NyYy9jb25zdGFudHMnKSxcbiAgICAgICdAc3R5bGVzJzogcGF0aC5yZXNvbHZlKCcuL3NyYy9zdHlsZXMnKSxcbiAgICB9LFxuICB9LFxuICBzZXJ2ZXI6IHtcbiAgICBwb3J0OiBcIjQwMjhcIixcbiAgICBob3N0OiBcIjAuMC4wLjBcIixcbiAgICBzdHJpY3RQb3J0OiB0cnVlLFxuICAgIGFsbG93ZWRIb3N0czogWycuYW1hem9uYXdzLmNvbScsICcuYnVpbHR3aXRocm9ja2V0Lm5ldyddLFxuXG4gICAgcHJveHk6IHtcbiAgICAgIC8vIFNldGlhcCBwZXJtaW50YWFuIHlhbmcgZGltdWxhaSBkZW5nYW4gJy9hcGknXG4gICAgICAnL2FwaSc6IHtcbiAgICAgICAgLy8gQWthbiBkaWFyYWhrYW4ga2Ugc2VydmVyIGJhY2tlbmQgQW5kYSBkaSBwb3J0IDMwMDBcbiAgICAgICAgdGFyZ2V0OiAnaHR0cDovL2xvY2FsaG9zdDozMDAwJyxcbiAgICAgICAgLy8gV2FqaWIgdW50dWsgbWVuZ3ViYWggb3JpZ2luIGhlYWRlclxuICAgICAgICBjaGFuZ2VPcmlnaW46IHRydWUsXG4gICAgICB9LFxuICAgIH1cbiAgfVxufSk7XG4iXSwKICAibWFwcGluZ3MiOiAiO0FBQ0EsU0FBUyxvQkFBb0I7QUFDN0IsT0FBTyxXQUFXO0FBQ2xCLE9BQU8sVUFBVTtBQUNqQixPQUFPLFlBQVk7QUFHbkIsSUFBTyxzQkFBUSxhQUFhO0FBQUEsRUFDMUIsU0FBUyxDQUFDLE1BQU0sR0FBRyxPQUFPLENBQUM7QUFBQSxFQUMzQixPQUFPO0FBQUEsSUFDTCxRQUFRO0FBQUEsRUFDVjtBQUFBLEVBQ0EsU0FBUztBQUFBLElBQ1AsT0FBTztBQUFBLE1BQ0wsS0FBSyxLQUFLLFFBQVEsT0FBTztBQUFBLE1BQ3pCLGVBQWUsS0FBSyxRQUFRLGtCQUFrQjtBQUFBLE1BQzlDLFVBQVUsS0FBSyxRQUFRLGFBQWE7QUFBQSxNQUNwQyxXQUFXLEtBQUssUUFBUSxjQUFjO0FBQUEsTUFDdEMsY0FBYyxLQUFLLFFBQVEsaUJBQWlCO0FBQUEsTUFDNUMsV0FBVyxLQUFLLFFBQVEsY0FBYztBQUFBLElBQ3hDO0FBQUEsRUFDRjtBQUFBLEVBQ0EsUUFBUTtBQUFBLElBQ04sTUFBTTtBQUFBLElBQ04sTUFBTTtBQUFBLElBQ04sWUFBWTtBQUFBLElBQ1osY0FBYyxDQUFDLGtCQUFrQixzQkFBc0I7QUFBQSxJQUV2RCxPQUFPO0FBQUE7QUFBQSxNQUVMLFFBQVE7QUFBQTtBQUFBLFFBRU4sUUFBUTtBQUFBO0FBQUEsUUFFUixjQUFjO0FBQUEsTUFDaEI7QUFBQSxJQUNGO0FBQUEsRUFDRjtBQUNGLENBQUM7IiwKICAibmFtZXMiOiBbXQp9Cg==
