type UpdateSW = (reloadPage?: boolean) => Promise<void>

let updateSW: UpdateSW | null = null

export function setUpdateSW(fn: UpdateSW) {
  updateSW = fn
}

/** Fetch any waiting service worker, then reload so the latest build loads. */
export async function reloadToLatestVersion(): Promise<void> {
  try {
    const registration = await navigator.serviceWorker?.getRegistration()
    if (registration) {
      await registration.update()
    }
  } catch {
    // Still reload even if the update check fails (e.g. offline).
  }

  if (updateSW) {
    await updateSW(true)
    return
  }

  window.location.reload()
}
