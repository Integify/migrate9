import { useEffect, useMemo, useRef, useState, type ChangeEvent, type DragEvent } from 'react'
import { createRoot } from 'react-dom/client'
import '@fontsource/bricolage-grotesque/500.css'
import '@fontsource/bricolage-grotesque/700.css'
import '@fontsource/bricolage-grotesque/800.css'
import '@fontsource/ibm-plex-mono/400.css'
import '@fontsource/ibm-plex-mono/500.css'
import '@fontsource/ibm-plex-mono/600.css'
import { operators, type Operator } from './lib/numbering'
import { convertVcard, type Conversion, type ReviewItem } from './lib/vcard'
import './styles.css'

const PAGE_SIZES = [10, 25, 50, 100] as const

type StatFilter = 'Africell' | 'QCell' | 'Comium' | 'pending' | 'unknown'

const STAT_CARDS: { key: StatFilter; label: string }[] = [
  { key: 'Africell', label: 'Africell' },
  { key: 'QCell', label: 'QCell' },
  { key: 'Comium', label: 'Comium' },
  { key: 'pending', label: 'Gamcel pending' },
  { key: 'unknown', label: 'Unknown' },
]

function matchesStatFilter(item: ReviewItem, filter: StatFilter): boolean {
  if (filter === 'pending') return item.status === 'pending'
  if (filter === 'unknown') return item.status === 'unknown'
  return item.status === 'converted' && item.operator === filter
}

function ReviewTable({
  items,
  manual,
  onManual,
}: {
  items: ReviewItem[]
  manual: Record<number, Operator>
  onManual: (id: number, operator: Operator) => void
}) {
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Contact</th>
            <th>Before</th>
            <th>After</th>
            <th>Operator</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.id}>
              <td>{item.name}</td>
              <td className="mono">{item.before}</td>
              <td className="mono">{item.after}</td>
              <td>
                {item.status === 'unknown' ? (
                  <select
                    aria-label={`Operator for ${item.before}`}
                    value={manual[item.id] ?? ''}
                    onChange={(event) => onManual(item.id, event.target.value as Operator)}
                  >
                    <option value="">Choose operator</option>
                    {Object.keys(operators).map((operator) => <option key={operator}>{operator}</option>)}
                  </select>
                ) : item.operator}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function Pager({
  page,
  totalPages,
  from,
  to,
  total,
  onPage,
}: {
  page: number
  totalPages: number
  from: number
  to: number
  total: number
  onPage: (page: number) => void
}) {
  return (
    <div className="pager">
      <p className="pager-meta mono">
        {total === 0 ? '0' : `${from}–${to}`} of {total}
      </p>
      <div className="pager-controls">
        <button type="button" className="btn ghost compact" disabled={page <= 1} onClick={() => onPage(page - 1)}>
          Prev
        </button>
        <span className="mono page-indicator">Page {page} / {totalPages}</span>
        <button type="button" className="btn ghost compact" disabled={page >= totalPages} onClick={() => onPage(page + 1)}>
          Next
        </button>
      </div>
    </div>
  )
}

function App() {
  const input = useRef<HTMLInputElement>(null)
  const [fileName, setFileName] = useState('')
  const [source, setSource] = useState('')
  const [manual, setManual] = useState<Record<number, Operator>>({})
  const [error, setError] = useState('')
  const [importOpen, setImportOpen] = useState(false)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState<(typeof PAGE_SIZES)[number]>(25)
  const [filterOpen, setFilterOpen] = useState<StatFilter | null>(null)
  const [filterPage, setFilterPage] = useState(1)
  const [filterPageSize, setFilterPageSize] = useState<(typeof PAGE_SIZES)[number]>(25)
  const conversion: Conversion | null = source ? convertVcard(source, manual) : null

  async function choose(file?: File) {
    if (!file) return
    if (!file.name.toLowerCase().endsWith('.vcf')) {
      setError('Choose a contacts file ending in .vcf.')
      return
    }
    setError('')
    setFileName(file.name)
    setManual({})
    setPage(1)
    setFilterOpen(null)
    setSource(await file.text())
    setImportOpen(false)
  }

  function openFilter(filter: StatFilter) {
    setFilterOpen(filter)
    setFilterPage(1)
  }

  function onPick(event: ChangeEvent<HTMLInputElement>) {
    void choose(event.target.files?.[0])
    event.target.value = ''
  }

  function onDrop(event: DragEvent<HTMLButtonElement>) {
    event.preventDefault()
    void choose(event.dataTransfer.files[0])
  }

  function download() {
    if (!conversion) return
    const stem = fileName.replace(/\.vcf$/i, '') || 'contacts'
    const url = URL.createObjectURL(new Blob([conversion.output], { type: 'text/vcard;charset=utf-8' }))
    const link = document.createElement('a')
    link.href = url
    link.download = `${stem}-9digit.vcf`
    link.click()
    URL.revokeObjectURL(url)
  }

  function setOperator(id: number, operator: Operator) {
    setManual((current) => ({ ...current, [id]: operator }))
  }

  const reviews = conversion?.reviews ?? []
  const filteredReviews = useMemo(() => {
    if (!filterOpen) return []
    return reviews.filter((item) => matchesStatFilter(item, filterOpen))
  }, [reviews, filterOpen])
  const statCounts = useMemo(() => ({
    Africell: reviews.filter((item) => matchesStatFilter(item, 'Africell')).length,
    QCell: reviews.filter((item) => matchesStatFilter(item, 'QCell')).length,
    Comium: reviews.filter((item) => matchesStatFilter(item, 'Comium')).length,
    pending: reviews.filter((item) => matchesStatFilter(item, 'pending')).length,
    unknown: reviews.filter((item) => matchesStatFilter(item, 'unknown')).length,
  }), [reviews])

  const totalPages = Math.max(1, Math.ceil(reviews.length / pageSize))
  const safePage = Math.min(page, totalPages)
  const pageItems = useMemo(() => {
    const start = (safePage - 1) * pageSize
    return reviews.slice(start, start + pageSize)
  }, [reviews, safePage, pageSize])

  const filterLabel = STAT_CARDS.find((card) => card.key === filterOpen)?.label
  const filterTotalPages = Math.max(1, Math.ceil(filteredReviews.length / filterPageSize))
  const safeFilterPage = Math.min(filterPage, filterTotalPages)
  const filterPageItems = useMemo(() => {
    const start = (safeFilterPage - 1) * filterPageSize
    return filteredReviews.slice(start, start + filterPageSize)
  }, [filteredReviews, safeFilterPage, filterPageSize])

  useEffect(() => {
    if (page > totalPages) setPage(totalPages)
  }, [page, totalPages])

  useEffect(() => {
    if (filterPage > filterTotalPages) setFilterPage(filterTotalPages)
  }, [filterPage, filterTotalPages])

  useEffect(() => {
    if (!importOpen && !filterOpen) return
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setImportOpen(false)
        setFilterOpen(null)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [importOpen, filterOpen])

  return (
    <div className="shell">
      <header className="topbar">
        <div className="brand">
          <p className="mark">Migrate9</p>
          <div>
            <h1>Gambia Number Fixer</h1>
            <p className="tagline">Keep legacy numbers. Add 9-digit companions. Private on this device.</p>
          </div>
        </div>
        <div className="actions">
          <button type="button" className="btn ghost" onClick={() => { setError(''); setImportOpen(true) }}>
            Import
          </button>
          <button type="button" className="btn solid" onClick={download} disabled={!conversion}>
            Download
          </button>
        </div>
      </header>

      <main className="dashboard">
        {!conversion ? (
          <section className="empty" aria-label="Get started">
            <p className="empty-kicker">No file loaded</p>
            <h2>Import a contacts export to begin</h2>
            <p>Export contacts as a <code>.vcf</code> from your phone or computer, then import it here. Nothing is uploaded.</p>
            <button type="button" className="btn solid" onClick={() => { setError(''); setImportOpen(true) }}>
              Import contacts
            </button>
          </section>
        ) : (
          <>
            <section className="meta-row" aria-label="Loaded file">
              <div>
                <span className="label">Loaded</span>
                <strong className="mono">{fileName}</strong>
              </div>
              <p className="hint">Old numbers stay. New 9-digit numbers are added beside them. Re-import the download into Contacts when ready.</p>
            </section>

            <section className="stats" aria-label="Conversion summary">
              {STAT_CARDS.map(({ key, label }) => {
                const active = filterOpen === key
                return (
                  <button
                    key={key}
                    type="button"
                    className={`stat${active ? ' active' : ''}`}
                    aria-haspopup="dialog"
                    aria-expanded={active}
                    aria-label={`Open ${label} numbers`}
                    onClick={() => openFilter(key)}
                  >
                    <b className="mono">{statCounts[key]}</b>
                    <span>{label}</span>
                  </button>
                )
              })}
            </section>

            <section className="panel" aria-label="Review numbers">
              <div className="panel-head">
                <div>
                  <h2>Review</h2>
                  <p>All flagged numbers. Click a summary card to open that list.</p>
                </div>
                <label className="page-size">
                  <span>Rows</span>
                  <select
                    aria-label="Rows per page"
                    value={pageSize}
                    onChange={(event) => {
                      setPageSize(Number(event.target.value) as (typeof PAGE_SIZES)[number])
                      setPage(1)
                    }}
                  >
                    {PAGE_SIZES.map((size) => <option key={size} value={size}>{size}</option>)}
                  </select>
                </label>
              </div>

              {reviews.length === 0 ? (
                <p className="empty-inline">No legacy Gambian numbers found in this file.</p>
              ) : (
                <>
                  <ReviewTable items={pageItems} manual={manual} onManual={setOperator} />
                  <Pager
                    page={safePage}
                    totalPages={totalPages}
                    from={(safePage - 1) * pageSize + 1}
                    to={Math.min(safePage * pageSize, reviews.length)}
                    total={reviews.length}
                    onPage={setPage}
                  />
                </>
              )}
            </section>
          </>
        )}
      </main>

      <footer className="footer">
        <p className="footer-note">
          Dual running of 7-digit and 9-digit dialing ends on November 30, 2026.
        </p>
        <a
          className="powered-by"
          href="https://www.integify.io"
          target="_blank"
          rel="noopener noreferrer"
        >
          <span>Powered by</span>
          <img src="/Integify_white_logo.png" alt="Integify" className="powered-by-logo" />
        </a>
      </footer>

      {importOpen && (
        <div className="modal-root" role="presentation" onClick={() => setImportOpen(false)}>
          <div
            className="modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="import-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="modal-head">
              <h2 id="import-title">Import contacts</h2>
              <button type="button" className="btn ghost compact" aria-label="Close import" onClick={() => setImportOpen(false)}>
                Close
              </button>
            </div>
            <p className="modal-copy">Drop a <code>.vcf</code> export, or choose one from this device. Your file never leaves the browser.</p>
            <button
              type="button"
              className="dropzone"
              onClick={() => input.current?.click()}
              onDrop={onDrop}
              onDragOver={(event) => event.preventDefault()}
            >
              <strong>Drop .vcf here</strong>
              <span>or tap to browse</span>
            </button>
            <input ref={input} type="file" accept=".vcf,text/vcard" onChange={onPick} hidden />
            {error && <p role="alert" className="error">{error}</p>}
          </div>
        </div>
      )}

      {filterOpen && filterLabel && (
        <div className="modal-root" role="presentation" onClick={() => setFilterOpen(null)}>
          <div
            className="modal modal-wide"
            role="dialog"
            aria-modal="true"
            aria-labelledby="filter-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="modal-head">
              <div>
                <h2 id="filter-title">{filterLabel}</h2>
                <p className="modal-sub mono">{filteredReviews.length} numbers</p>
              </div>
              <div className="panel-tools">
                <label className="page-size">
                  <span>Rows</span>
                  <select
                    aria-label="Rows per page in filter list"
                    value={filterPageSize}
                    onChange={(event) => {
                      setFilterPageSize(Number(event.target.value) as (typeof PAGE_SIZES)[number])
                      setFilterPage(1)
                    }}
                  >
                    {PAGE_SIZES.map((size) => <option key={size} value={size}>{size}</option>)}
                  </select>
                </label>
                <button type="button" className="btn ghost compact" aria-label="Close filter list" onClick={() => setFilterOpen(null)}>
                  Close
                </button>
              </div>
            </div>

            {filteredReviews.length === 0 ? (
              <p className="empty-inline">No numbers in this group.</p>
            ) : (
              <>
                <ReviewTable items={filterPageItems} manual={manual} onManual={setOperator} />
                <Pager
                  page={safeFilterPage}
                  totalPages={filterTotalPages}
                  from={(safeFilterPage - 1) * filterPageSize + 1}
                  to={Math.min(safeFilterPage * filterPageSize, filteredReviews.length)}
                  total={filteredReviews.length}
                  onPage={setFilterPage}
                />
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

createRoot(document.getElementById('root')!).render(<App />)
