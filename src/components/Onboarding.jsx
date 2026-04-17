import { useRef } from 'react'
import { Sparkles, Plus, Upload } from 'lucide-react'
import { readImportFile } from '../lib/dataIO.js'

export default function Onboarding({ onChoose, onImport }) {
  const fileRef = useRef(null)

  const handleFile = async (e) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    try {
      const parsed = await readImportFile(file)
      const ok = onImport(parsed)
      if (!ok) alert('That file does not look like a Bloom export.')
    } catch (err) {
      alert(err.message || 'Could not read that file.')
    }
  }

  return (
    <div className="onboarding">
      <div className="onboarding__card">
        <span className="onboarding__petal" aria-hidden="true">❀</span>
        <h1 className="onboarding__title">Welcome to Bloom</h1>
        <p className="onboarding__lead">
          A gentle space for the rituals you keep. Pick a starting point — you can change
          everything later.
        </p>

        <div className="onboarding__choices">
          <button
            type="button"
            className="onboarding__choice onboarding__choice--primary"
            onClick={() => onChoose('starter')}
          >
            <Sparkles size={18} />
            <span className="onboarding__choice-title">Use starter habits</span>
            <span className="onboarding__choice-sub">
              A curated daily/weekend routine to get rolling
            </span>
          </button>

          <button
            type="button"
            className="onboarding__choice"
            onClick={() => onChoose('blank')}
          >
            <Plus size={18} />
            <span className="onboarding__choice-title">Start fresh</span>
            <span className="onboarding__choice-sub">
              Build your own list from scratch
            </span>
          </button>

          <button
            type="button"
            className="onboarding__choice"
            onClick={() => fileRef.current?.click()}
          >
            <Upload size={18} />
            <span className="onboarding__choice-title">Import a backup</span>
            <span className="onboarding__choice-sub">
              Restore from a previous Bloom export
            </span>
          </button>
        </div>

        <input
          ref={fileRef}
          type="file"
          accept="application/json,.json"
          onChange={handleFile}
          hidden
        />
      </div>
    </div>
  )
}
