const FILE_VERSION = 3

export const exportData = ({ habits, checks, theme }) => {
  const payload = {
    app: 'bloom-habit-tracker',
    version: FILE_VERSION,
    exportedAt: new Date().toISOString(),
    habits,
    checks,
    theme,
  }
  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: 'application/json',
  })
  const url = URL.createObjectURL(blob)
  const stamp = new Date().toISOString().slice(0, 10)
  const a = document.createElement('a')
  a.href = url
  a.download = `bloom-habits-${stamp}.json`
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

export const readImportFile = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () => reject(new Error('Could not read file'))
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result))
        resolve(parsed)
      } catch {
        reject(new Error('File is not valid JSON'))
      }
    }
    reader.readAsText(file)
  })
