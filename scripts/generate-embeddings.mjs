import fs from 'node:fs/promises'
import path from 'node:path'
import Papa from 'papaparse'
import dotenv from 'dotenv'

const LOCAL_ENV_PATH = path.resolve('.env.local')
dotenv.config({ path: LOCAL_ENV_PATH, override: true })
dotenv.config()

const OPENAI_API_KEY = process.env.OPENAI_API_KEY
const OPENAI_MODEL = process.env.OPENAI_EMBEDDING_MODEL || 'text-embedding-3-small'
const EXPECTED_DIMENSION = Number(process.env.EMBEDDING_DIMENSION || 1536)

if (!OPENAI_API_KEY) {
  console.error('Missing OPENAI_API_KEY in environment variables.')
  process.exit(1)
}

const [, , inputCsv, outputCsv] = process.argv

if (!inputCsv || !outputCsv) {
  console.error('Usage: node scripts/generate-embeddings.mjs <input.csv> <output.csv>')
  process.exit(1)
}

async function fetchEmbedding(text) {
  const response = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: OPENAI_MODEL,
      input: text,
    }),
  })

  if (!response.ok) {
    const detail = await response.text()
    throw new Error(`OpenAI error (${response.status}): ${detail}`)
  }

  const json = await response.json()
  const embedding = json?.data?.[0]?.embedding
  if (!embedding || embedding.length !== EXPECTED_DIMENSION) {
    throw new Error('Embedding dimension mismatch or missing embedding in response.')
  }

  return embedding
}

function buildInputText(row) {
  const title = (row.TITLE || row.Title || '').trim()
  const abstract = (row.ABSTRACT || row.Abstract || '').trim()
  const combined = (row._combined_text || row.combined_text || '').trim()

  if (combined) return combined

  return `Title: ${title}\n\nAbstract: ${abstract}`.trim()
}

async function main() {
  const inputPath = path.resolve(inputCsv)
  const outputPath = path.resolve(outputCsv)
  console.log(`Reading ${inputPath}`)
  const csvContent = await fs.readFile(inputPath, 'utf8')

  const parsed = Papa.parse(csvContent, { header: true, skipEmptyLines: true })
  if (parsed.errors.length) {
    console.error('CSV parse errors:', parsed.errors)
    process.exit(1)
  }

  const rows = parsed.data
  if (!rows.length) {
    console.error('Input CSV is empty.')
    process.exit(1)
  }

  const updatedRows = []
  let processed = 0

  for (const row of rows) {
    try {
      const text = buildInputText(row)
      if (!text) {
        console.warn('Skipping row due to missing text content.')
        updatedRows.push({ ...row, embedding: '' })
        continue
      }

      const embedding = await fetchEmbedding(text)
      updatedRows.push({ ...row, embedding: embedding.join(',') })
      processed += 1
      if (processed % 50 === 0) {
        console.log(`Generated embeddings for ${processed} rows...`)
      }
    } catch (error) {
      console.error('Failed to embed row:', error.message)
      updatedRows.push({ ...row, embedding: '' })
    }
  }

  const csvOutput = Papa.unparse(updatedRows)
  await fs.writeFile(outputPath, csvOutput, 'utf8')
  console.log(`Done! Wrote updated CSV with embeddings to ${outputPath}`)
}

main().catch((error) => {
  console.error('Unexpected error:', error)
  process.exit(1)
})
