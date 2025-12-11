import fs from 'node:fs/promises'
import path from 'node:path'
import Papa from 'papaparse'
import dotenv from 'dotenv'
import { createClient } from '@supabase/supabase-js'

const LOCAL_ENV_PATH = path.resolve('.env.local')
dotenv.config({ path: LOCAL_ENV_PATH, override: true })
dotenv.config()

const SUPABASE_URL =
  process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const EXPECTED_DIMENSION = Number(process.env.EMBEDDING_DIMENSION || 1536)
const DEFAULT_CONFIDENCE = Number(process.env.DEFAULT_SDG_CONFIDENCE || 0.8)

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('Missing SUPABASE_URL/VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables.')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
})

const [, , csvPath, ...restArgs] = process.argv

if (!csvPath) {
  console.error('Usage: node scripts/import-papers.mjs <path-to-csv> [--default-sdg=13]')
  process.exit(1)
}

const defaultSdgArg = restArgs.find((arg) => arg.startsWith('--default-sdg='))
const defaultSdgId = defaultSdgArg ? Number(defaultSdgArg.split('=')[1]) : null

function parseEmbedding(rawValue) {
  if (!rawValue) return null
  const cleaned = rawValue.replace(/\[|\]/g, '').trim()
  if (!cleaned) return null
  const values = cleaned
    .split(',')
    .map((part) => Number(part.trim()))
    .filter((num) => Number.isFinite(num))
  return values.length ? values : null
}

function normalizeEmail(firstName, lastName) {
  const base = [firstName, lastName]
    .filter(Boolean)
    .join('.')
    .toLowerCase()
    .replace(/[^a-z.]/g, '')
  if (!base) return null
  return `${base}@byu.edu`
}

async function getOrCreateInstitution(name) {
  if (!name) return null
  const trimmed = name.trim()
  const existing = await supabase
    .from('institutions')
    .select('id')
    .eq('name', trimmed)
    .limit(1)
    .maybeSingle()

  if (existing?.data?.id) {
    return existing.data.id
  }

  const { data, error } = await supabase
    .from('institutions')
    .insert({
      name: trimmed,
      country: 'USA',
      type: 'university',
    })
    .select('id')
    .single()

  if (error) {
    console.error(`Failed to create institution "${trimmed}"`, error.message)
    return null
  }

  return data.id
}

async function upsertAuthor(row) {
  const firstName = (row['First Name'] || '').trim()
  const lastName = (row['Last Name'] || '').trim()
  const name = [firstName, lastName].filter(Boolean).join(' ').trim()
  if (!name) {
    throw new Error('Missing first/last name')
  }

  const email = (row.Email || '').trim() || normalizeEmail(firstName, lastName)
  const institutionName = (row['Primary College (Most Recent)'] || '').trim() || 'Brigham Young University'
  const institutionId = await getOrCreateInstitution(institutionName)

  const existing = await supabase
    .from('authors')
    .select('id')
    .eq('name', name)
    .eq('institution_id', institutionId)
    .limit(1)
    .maybeSingle()

  if (existing?.data?.id) {
    return existing.data.id
  }

  const { data, error } = await supabase
    .from('authors')
    .insert({
      name,
      email,
      institution_id: institutionId,
    })
    .select('id')
    .single()

  if (error) {
    throw new Error(`Failed to insert author "${name}": ${error.message}`)
  }

  return data.id
}

async function insertPaper(row, embedding, authorId, sdgIds) {
  const title = (row.TITLE || row.Title || '').trim()
  if (!title) {
    throw new Error('Missing paper title')
  }

  const abstract = (row.ABSTRACT || row.Abstract || '').trim() || null

  const existingPaper = await supabase.from('papers').select('id').eq('title', title).limit(1).maybeSingle()
  if (existingPaper?.data?.id) {
    return existingPaper.data.id
  }

  const embeddingLiteral = `[${embedding.join(',')}]`

  const { data, error } = await supabase
    .from('papers')
    .insert({
      title,
      abstract,
      embedding: embeddingLiteral,
    })
    .select('id')
    .single()

  if (error) {
    throw new Error(`Failed to insert paper "${title}": ${error.message}`)
  }

  const paperId = data.id

  if (authorId) {
    await supabase.from('author_papers').upsert(
      {
        author_id: authorId,
        paper_id: paperId,
        author_order: 1,
      },
      { onConflict: 'author_id,paper_id' },
    )
  }

  if (sdgIds.length) {
    const sdgRows = sdgIds.map((sdgId) => ({
      paper_id: paperId,
      sdg_id: sdgId,
      confidence_score: DEFAULT_CONFIDENCE,
    }))

    const { error: sdgError } = await supabase
      .from('paper_sdgs')
      .upsert(sdgRows, { onConflict: 'paper_id,sdg_id' })

    if (sdgError) {
      console.warn(`Unable to tag SDGs for paper "${title}": ${sdgError.message}`)
    }
  }

  return paperId
}

function parseSdgIds(row) {
  const sdgRaw = row.sdg_ids || row.SDGs || row.sdg || row.SDG
  if (sdgRaw) {
    return sdgRaw
      .toString()
      .split(/[,|]/)
      .map((val) => Number(val.trim()))
      .filter((num) => Number.isInteger(num) && num >= 1 && num <= 17)
  }

  return defaultSdgId ? [defaultSdgId] : []
}

async function main() {
  const resolvedPath = path.resolve(csvPath)
  console.log(`Reading ${resolvedPath}`)
  const csvContent = await fs.readFile(resolvedPath, 'utf8')

  const parsed = Papa.parse(csvContent, {
    header: true,
    skipEmptyLines: true,
  })

  if (parsed.errors.length) {
    console.error('CSV parse errors:', parsed.errors)
    process.exit(1)
  }

  const rows = parsed.data
  if (!rows.length) {
    console.error('CSV file is empty.')
    process.exit(1)
  }

  const sampleEmbedding = parseEmbedding(rows[0].embedding || rows[0].Embedding)
  if (!sampleEmbedding) {
    console.error('Unable to parse embedding column from the first row.')
    process.exit(1)
  }

  if (sampleEmbedding.length !== EXPECTED_DIMENSION) {
    console.error(
      `Embedding dimension mismatch. Expected ${EXPECTED_DIMENSION}, but CSV rows contain ${sampleEmbedding.length}.`,
    )
    console.error('Re-generate embeddings with the OpenAI text-embedding-3-small model before importing.')
    process.exit(1)
  }

  let processed = 0
  let skipped = 0

  for (const row of rows) {
    try {
      const embedding = parseEmbedding(row.embedding || row.Embedding)
      if (!embedding) {
        skipped += 1
        console.warn('Skipping row due to missing embedding.')
        continue
      }

      if (embedding.length !== EXPECTED_DIMENSION) {
        skipped += 1
        console.warn('Skipping row due to incorrect embedding dimension.')
        continue
      }

      const authorId = await upsertAuthor(row)
      const sdgIds = parseSdgIds(row)
      await insertPaper(row, embedding, authorId, sdgIds)
      processed += 1
      if (processed % 50 === 0) {
        console.log(`Imported ${processed} papers...`)
      }
    } catch (error) {
      skipped += 1
      console.error('Failed to import row:', error.message)
    }
  }

  console.log(`Done! Imported ${processed} papers. Skipped ${skipped}.`)
}

main().catch((error) => {
  console.error('Unexpected error during import:', error)
  process.exit(1)
})
