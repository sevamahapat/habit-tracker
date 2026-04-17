import { Download } from 'lucide-react'

export default function InstallButton({ onInstall }) {
  return (
    <button
      type="button"
      className="install-btn"
      onClick={onInstall}
      aria-label="Install Bloom as an app"
    >
      <Download size={14} />
      <span>Install</span>
    </button>
  )
}
