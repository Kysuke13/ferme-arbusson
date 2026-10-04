type SessionToken = object

type PlaceResult = {
  fetchFields(request: { fields: string[] }): Promise<unknown>
  formattedAddress?: string
}

type PlacePrediction = {
  text: { toString(): string }
  toPlace(): PlaceResult
}

type PlacesLibrary = {
  AutocompleteSuggestion: {
    fetchAutocompleteSuggestions(request: {
      input: string
      sessionToken?: SessionToken
      includedRegionCodes?: string[]
      language?: string
      region?: string
      locationBias?: { center: { lat: number; lng: number }; radius: number }
    }): Promise<{ suggestions: Array<{ placePrediction: PlacePrediction | null }> }>
  }
  AutocompleteSessionToken: new () => SessionToken
}

type MapsNamespace = {
  importLibrary: (library: string) => Promise<PlacesLibrary>
  __ib__?: () => void
}

declare global {
  interface Window {
    google?: { maps: MapsNamespace }
  }
}

const FARM = { lat: 43.384, lng: 5.583 }

let booted = false

function bootGoogleMaps(apiKey: string) {
  if (booted) return
  booted = true
  const google = (window.google = window.google || { maps: {} as MapsNamespace })
  const maps = (google.maps = google.maps || ({} as MapsNamespace))
  if (typeof maps.importLibrary === 'function' && maps.__ib__) return

  const pending = new Set<string>()
  let loader: Promise<void> | undefined
  const load = () =>
    loader ||
    (loader = new Promise<void>((resolve, reject) => {
      const script = document.createElement('script')
      const query = new URLSearchParams({
        key: apiKey,
        v: 'weekly',
        libraries: [...pending].join(','),
        callback: 'google.maps.__ib__',
      })
      script.src = `https://maps.googleapis.com/maps/api/js?${query}`
      script.async = true
      maps.__ib__ = () => resolve()
      script.onerror = () => {
        loader = undefined
        booted = false
        reject(new Error('Google Maps'))
      }
      document.head.append(script)
    }))

  const stub = (name: string) => {
    pending.add(name)
    return load().then(() => {
      if (maps.importLibrary === stub) throw new Error('Google Maps importLibrary missing')
      return maps.importLibrary(name)
    })
  }
  maps.importLibrary = stub
}

export function attachAddressAutocomplete(scope: ParentNode, apiKey: string) {
  const input = scope.querySelector<HTMLInputElement>('#f-adresse')
  const anchor = input?.parentElement
  if (!input || !anchor || !apiKey) return () => {}

  bootGoogleMaps(apiKey)

  const list = document.createElement('ul')
  list.id = 'adresse-suggestions'
  list.className = 'address-suggest'
  list.setAttribute('role', 'listbox')
  list.hidden = true
  anchor.append(list)

  let requestId = 0
  let active = -1
  let token: SessionToken | undefined
  let places: PlacesLibrary | undefined
  let timer = 0
  let disposed = false
  const predictions: PlacePrediction[] = []

  function setOpen(open: boolean) {
    list.hidden = !open
    input?.setAttribute('aria-expanded', open ? 'true' : 'false')
    if (!open) {
      active = -1
      input?.removeAttribute('aria-activedescendant')
    }
  }

  function paint() {
    list.replaceChildren()
    predictions.forEach((prediction, index) => {
      const item = document.createElement('li')
      item.setAttribute('role', 'presentation')
      const button = document.createElement('button')
      button.type = 'button'
      button.id = `adresse-option-${index}`
      button.setAttribute('role', 'option')
      button.setAttribute('aria-selected', index === active ? 'true' : 'false')
      button.textContent = prediction.text.toString()
      button.addEventListener('mousedown', (event) => {
        event.preventDefault()
        void choose(index)
      })
      item.append(button)
      list.append(item)
    })
    if (predictions.length) {
      const brand = document.createElement('li')
      brand.className = 'address-suggest-brand'
      brand.setAttribute('aria-hidden', 'true')
      const img = document.createElement('img')
      img.src = 'https://maps.gstatic.com/mapfiles/api-3/images/powered-by-google-on-white3.png'
      img.alt = 'Powered by Google'
      brand.append(img)
      list.append(brand)
      setOpen(true)
      markActive()
    } else {
      setOpen(false)
    }
  }

  function markActive() {
    list.querySelectorAll<HTMLButtonElement>('[role="option"]').forEach((button, index) => {
      const on = index === active
      button.setAttribute('aria-selected', on ? 'true' : 'false')
      if (on) input?.setAttribute('aria-activedescendant', button.id)
    })
    if (active < 0) input?.removeAttribute('aria-activedescendant')
  }

  async function choose(index: number) {
    const prediction = predictions[index]
    if (!prediction || !input) return
    const fallback = prediction.text.toString()
    setOpen(false)
    predictions.length = 0
    try {
      const place = prediction.toPlace()
      await place.fetchFields({ fields: ['formattedAddress'] })
      if (disposed) return
      input.value = place.formattedAddress || fallback
    } catch {
      if (!disposed) input.value = fallback
    }
    token = undefined
  }

  async function search(value: string) {
    const current = ++requestId
    if (value.trim().length < 3) {
      predictions.length = 0
      paint()
      return
    }
    try {
      places = places || (await window.google!.maps.importLibrary('places'))
      if (!token) token = new places.AutocompleteSessionToken()
      const { suggestions } = await places.AutocompleteSuggestion.fetchAutocompleteSuggestions({
        input: value.trim(),
        sessionToken: token,
        includedRegionCodes: ['fr'],
        language: 'fr',
        region: 'fr',
        locationBias: { center: FARM, radius: 50000 },
      })
      if (disposed || current !== requestId) return
      predictions.length = 0
      for (const suggestion of suggestions) {
        if (suggestion.placePrediction) predictions.push(suggestion.placePrediction)
      }
      active = predictions.length ? 0 : -1
      paint()
    } catch (error) {
      if (disposed || current !== requestId) return
      predictions.length = 0
      paint()
      console.error('Suggestions d’adresse indisponibles.', error)
    }
  }

  function onInput() {
    window.clearTimeout(timer)
    timer = window.setTimeout(() => {
      void search(input?.value || '')
    }, 250)
  }

  function onKeyDown(event: KeyboardEvent) {
    if (list.hidden) return
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      active = Math.min(predictions.length - 1, active + 1)
      markActive()
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      active = Math.max(0, active - 1)
      markActive()
    } else if (event.key === 'Enter' && active >= 0) {
      event.preventDefault()
      void choose(active)
    } else if (event.key === 'Escape') {
      setOpen(false)
    }
  }

  function onPointerDown(event: Event) {
    if (!(event.target instanceof Node) || anchor?.contains(event.target)) return
    setOpen(false)
  }

  input.addEventListener('input', onInput)
  input.addEventListener('keydown', onKeyDown)
  document.addEventListener('pointerdown', onPointerDown)

  return () => {
    disposed = true
    window.clearTimeout(timer)
    input.removeEventListener('input', onInput)
    input.removeEventListener('keydown', onKeyDown)
    document.removeEventListener('pointerdown', onPointerDown)
    list.remove()
  }
}
