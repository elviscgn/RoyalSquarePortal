import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'mock-accident-location-api',
      configureServer(server) {
        server.middlewares.use('/api/v1/detect-location', (req, res) => {
          res.setHeader('Content-Type', 'application/json')
          res.setHeader('Access-Control-Allow-Origin', '*')
          res.end(
            JSON.stringify({
              detected: true,
              source: 'ai_visual_landmarks',
              confidence: 0.98,
              landmark: 'Commissioner Street & Sauer Street, Marshalltown, Johannesburg',
              coordinates: { lat: -26.2041, lng: 28.0473 },
              formattedCoords: '-26.2041° S, 28.0473° E',
              accuracy: '±3 meters (AI Verified)',
              timestamp: '15:26:44 SAST',
            })
          )
        })
      },
    },
  ],
  server: { port: 5173 },
})
