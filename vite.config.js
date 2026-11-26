import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { execFile } from 'node:child_process'

function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = []
    req.on('data', (chunk) => chunks.push(chunk))
    req.on('end', () => {
      try {
        resolve(JSON.parse(Buffer.concat(chunks).toString('utf8')))
      } catch (err) {
        reject(err)
      }
    })
    req.on('error', reject)
  })
}

function customPacksMiddleware() {
  return {
    name: 'sat-custom-packs-api',
    configureServer(server) {
      server.middlewares.use('/api/import-pack', async (req, res, next) => {
        if (req.method !== 'POST') return next()
        try {
          const body = await readJsonBody(req)
          const { title, subtitle, theme, questionsPdfBase64, answersPdfBase64 } = body
          if (!title || !questionsPdfBase64 || !answersPdfBase64) {
            res.statusCode = 400
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ error: 'Missing title or PDF files' }))
            return
          }

          const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'sat-pack-'))
          const qPath = path.join(tmpDir, 'questions.pdf')
          const aPath = path.join(tmpDir, 'answers.pdf')
          fs.writeFileSync(qPath, Buffer.from(questionsPdfBase64, 'base64'))
          fs.writeFileSync(aPath, Buffer.from(answersPdfBase64, 'base64'))

          const scriptPath = path.resolve(process.cwd(), 'scripts', 'import_pdf_pack.py')
          const packId = `custom_${Date.now()}`

          execFile(
            'python',
            [
              scriptPath,
              '--action',
              'import',
              '--pack-id',
              packId,
              '--title',
              title,
              '--subtitle',
              subtitle || '',
              '--theme',
              theme || 'blue',
              '--questions-pdf',
              qPath,
              '--answers-pdf',
              aPath,
            ],
            { maxBuffer: 25 * 1024 * 1024 },
            (err, stdout, stderr) => {
              try {
                fs.rmSync(tmpDir, { recursive: true, force: true })
              } catch {
                // ignore cleanup errors
              }
              res.setHeader('Content-Type', 'application/json')
              if (err) {
                res.statusCode = 500
                res.end(JSON.stringify({ error: stderr || err.message }))
                return
              }
              res.statusCode = 200
              res.end(stdout)
            }
          )
        } catch (err) {
          res.statusCode = 500
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({ error: err.message }))
        }
      })

      server.middlewares.use('/api/delete-pack', async (req, res, next) => {
        if (req.method !== 'POST') return next()
        try {
          const { packId } = await readJsonBody(req)
          const scriptPath = path.resolve(process.cwd(), 'scripts', 'import_pdf_pack.py')
          execFile(
            'python',
            [scriptPath, '--action', 'delete', '--pack-id', packId],
            { maxBuffer: 10 * 1024 * 1024 },
            (err, stdout, stderr) => {
              res.setHeader('Content-Type', 'application/json')
              if (err) {
                res.statusCode = 500
                res.end(JSON.stringify({ error: stderr || err.message }))
                return
              }
              res.statusCode = 200
              res.end(stdout)
            }
          )
        } catch (err) {
          res.statusCode = 500
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({ error: err.message }))
        }
      })
    },
  }
}

export default defineConfig({
  plugins: [react(), tailwindcss(), customPacksMiddleware()],
})
