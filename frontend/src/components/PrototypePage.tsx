import { createElement, useEffect, useRef, useState, type ElementType, type MouseEvent as ReactMouseEvent } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import * as Lucide from 'lucide-react'
import { useLocation, useNavigate } from 'react-router-dom'
import { MenuDrawer } from './Shell'
import { usePortal } from '../store'
import { mockDetectLocationFromPhoto } from '../services/mockServices'
import { useTranslation, LANGUAGE_METADATA } from '../i18n/translations'
import type { Locale, Client } from '../types'
import clientMobileCss from '../client-mobile.css?raw'

type PrototypeRoute = 'home' | 'requests' | 'documents' | 'consent' | 'banking' | 'accident'
type IconComponent = ElementType
type PrototypeWindow = Window & {
  lucide?: { createIcons: () => void }
  [key: string]: unknown
}

const iconAliases: Record<string, keyof typeof Lucide> = {
  'edit-3': 'Edit3',
  'share-2': 'Share2',
  'shield-alert': 'ShieldAlert',
  'trending-up': 'TrendingUp',
  'credit-card': 'CreditCard',
  'file-text': 'FileText',
  'shield-check': 'ShieldCheck',
  'more-horizontal': 'MoreHorizontal',
  'message-square': 'MessageSquare',
  'sliders-horizontal': 'SlidersHorizontal',
  'check-circle-2': 'CircleCheck',
  'file-check-2': 'FileCheck2',
  'alert-circle': 'CircleAlert',
  'refresh-cw': 'RefreshCw',
  'pen-tool': 'PenTool',
  'file-check': 'FileCheck',
}

export const INCIDENT_TARGET_CONFIGS: Record<string, {
  label: string
  icon: string
  card5Title: string
  card5Meta: string
  card5Img: string
  card1Meta: string
  card6Meta: string
  step4Heading: string
  step4Sub: string
}> = {
  other_vehicle: {
    label: 'Another Vehicle',
    icon: 'car',
    card5Title: 'Damage to other vehicle',
    card5Meta: 'Point of impact & exterior damage',
    card5Img: 'https://images.unsplash.com/photo-1542282088-72c9c27ed0cd?w=100&auto=format&fit=crop&q=80',
    card1Meta: 'Both vehicles in position',
    card6Meta: 'Involved vehicle licence plates',
    step4Heading: 'Who was involved?',
    step4Sub: "Your insured vehicle is linked to policy RS-48192. Capture the other driver's details below.",
  },
  stationary_pole: {
    label: 'Pole / Barrier',
    icon: 'zap',
    card5Title: 'Damage to pole or barrier',
    card5Meta: 'Impact point with light pole, tree or barrier',
    card5Img: 'https://images.unsplash.com/photo-1517524008697-84bbe3c3fd98?w=100&auto=format&fit=crop&q=80',
    card1Meta: 'Vehicle position against fixed object',
    card6Meta: 'Vehicle licence plate (JHB 482 GP)',
    step4Heading: 'Stationary Object & Property Info',
    step4Sub: 'Single vehicle impact. Record pole reference number, property location or owner details.',
  },
  gov_property: {
    label: 'Gov Property',
    icon: 'landmark',
    card5Title: 'Damage to municipal property',
    card5Meta: 'Guard rail, traffic robot, curb or road barrier',
    card5Img: 'https://images.unsplash.com/photo-1506521781263-d8422e82f27a?w=100&auto=format&fit=crop&q=80',
    card1Meta: 'Municipal road infrastructure impact zone',
    card6Meta: 'Municipal asset code & vehicle plate',
    step4Heading: 'Municipal Authority & Road Infrastructure',
    step4Sub: 'Impact on City of Johannesburg / SANRAL property. Record asset code or depot.',
  },
  natural_disaster: {
    label: 'Natural Disaster',
    icon: 'cloud-lightning',
    card5Title: 'Natural disaster & storm damage',
    card5Meta: 'Hail indentations, flash flood line, or fallen branch',
    card5Img: 'https://images.unsplash.com/photo-1527482797697-8795b05a13fe?w=100&auto=format&fit=crop&q=80',
    card1Meta: 'Environmental scene & weather perimeter',
    card6Meta: 'Vehicle registration & licence disc',
    step4Heading: 'Weather & Disaster Incident Declaration',
    step4Sub: 'Acts of nature claim. No third party involved. Record storm or weather details.',
  },
  pedestrian: {
    label: 'Person / Pedestrian',
    icon: 'user',
    card5Title: 'Pedestrian point of impact',
    card5Meta: 'Impact zone, pedestrian crossing & safety perimeter',
    card5Img: 'https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?w=100&auto=format&fit=crop&q=80',
    card1Meta: 'Pedestrian position & vehicle stopping distance',
    card6Meta: 'Vehicle registration plate & licence disc',
    step4Heading: 'Pedestrian & Paramedic Information',
    step4Sub: 'Capture pedestrian identity, contact, and attending emergency medical service.',
  },
  dui_impairment: {
    label: 'Drinking & Driving Check',
    icon: 'shield-alert',
    card5Title: 'SAPS sobriety & breathalyzer docket',
    card5Meta: 'Roadside breath test record & attending SAPS officer docket',
    card5Img: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=100&auto=format&fit=crop&q=80',
    card1Meta: 'Collision scene & police inspection perimeter',
    card6Meta: 'Both vehicle plates & driver licences',
    step4Heading: 'Attending SAPS Officer & Breathalyzer Docket',
    step4Sub: 'Record attending police station, officer badge number, and roadside testing record.',
  },
}


function iconComponent(name: string): IconComponent | null {
  const pascal = name.split('-').map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join('')
  const component = Lucide[iconAliases[name] ?? pascal as keyof typeof Lucide] as unknown
  return component !== null && (typeof component === 'function' || typeof component === 'object') ? component as IconComponent : null
}

export function hydratePrototypeIcons(root: HTMLElement) {
  root.querySelectorAll<HTMLElement>('[data-lucide]').forEach((element) => {
    const name = element.dataset.lucide
    if (!name) return
    const Icon = iconComponent(name)
    if (!Icon) return
    const style = element.getAttribute('style')?.split(';').reduce<Record<string, string>>((result, declaration) => {
      const [property, value] = declaration.split(':').map((part) => part.trim())
      if (!property || !value) return result
      result[property.replace(/-([a-z])/g, (_, letter: string) => letter.toUpperCase())] = value
      return result
    }, {})
    const className = element.getAttribute('class') ?? undefined
    element.outerHTML = renderToStaticMarkup(createElement(Icon, { className, style, 'aria-hidden': true }))
  })
}

function functionNames(source: string) {
  return [...source.matchAll(/function\s+([A-Za-z_$][\w$]*)\s*\(/g)].map((match) => match[1])
}

function cleanSource(parsed: Document, route: PrototypeRoute) {
  const scripts = [...parsed.body.querySelectorAll('script:not([src])')].map((script) => script.textContent ?? '').join('\n')
  parsed.querySelectorAll('script, link, meta, title').forEach((node) => node.remove())
  // React owns this shared control. Keeping an inline prototype handler here
  // would make a click run twice (once inline and once through React).
  parsed.body.querySelectorAll<HTMLElement>('#simpleModeToggle, #simpleToggleBtn').forEach((node) => node.removeAttribute('onclick'))
  if (route === 'home') parsed.querySelectorAll<HTMLElement>('[onclick]').forEach((node) => node.removeAttribute('onclick'))
  const markup = parsed.body.innerHTML.replace(/(FSP(?: License(?: No\.)?)?)(\s+)48192/g, '$1$2' + '29370')
  return { markup, scripts }
}

function routeForName(name: string) {
  return ({ Home: '/', Requests: '/requests', Documents: '/documents', Finances: '/finances' } as Record<string, string>)[name] ?? '/'
}

// Force the prototype DOM to match Simple Mode state without depending on the
// prototype's own script functions. Idempotent: safe to run on every sync.
function applySimpleModeDom(scope: ParentNode, on: boolean, clientName = 'Latoya Matai') {
  const firstName = clientName ? clientName.trim().split(' ')[0] : 'Client'
  document.body.classList.toggle('simple-mode', on)
  const toggle = scope.querySelector('#simpleModeToggle, #simpleToggleBtn')
  toggle?.classList.toggle('active', on)
  toggle?.setAttribute('aria-pressed', String(on))
  const label = scope.querySelector('#modeToggleLabel, #modeLabel, #simpleLabelText')
  if (label) label.textContent = on ? 'Simple Mode: ON' : 'Simple Mode'
  const hero = scope.querySelector('#heroHeading')
  if (hero) hero.textContent = on ? `All clear, ${firstName}.` : `Hey, ${firstName}. Need help?`
  const sub = scope.querySelector('#heroSubheading')
  if (sub) sub.innerHTML = on
    ? '<span class="calm-dot">●</span> <span>Your portfolio is healthy and on track</span>'
    : '<span class="cursor-bar">|</span> <span>Just ask me anything!</span>'
}

function applyLocaleDom(scope: ParentNode, locale: Locale, clientName = 'Latoya Matai') {
  const firstName = clientName ? clientName.trim().split(' ')[0] : 'Client'
  const t = useTranslation(locale)
  const meta = LANGUAGE_METADATA[locale] || LANGUAGE_METADATA['en-ZA']

  // 1. Language Button label in prototype header
  const langLabel = scope.querySelector<HTMLElement>('#lang-btn span, .lang-label')
  if (langLabel) langLabel.textContent = meta.label

  // 2. Main Page Headings
  const mainHeading = scope.querySelector<HTMLElement>('#pageMainHeading, .intro-headline')
  if (mainHeading) {
    const orig = mainHeading.getAttribute('data-orig') || mainHeading.textContent || ''
    if (!mainHeading.getAttribute('data-orig')) mainHeading.setAttribute('data-orig', orig)

    if (orig.includes('Everything Royal Square') || orig.includes('Konke okudingwa') || orig.includes('Tsohle tseo') || orig.includes('Alles wat') || orig.includes('Yonke into')) {
      mainHeading.innerHTML = locale === 'en-ZA'
        ? 'Everything Royal Square needs, <strong>in one place.</strong>'
        : locale === 'zu-ZA'
        ? 'Konke okudingwa yi-Royal Square, <strong>endaweni eyodwa.</strong>'
        : locale === 'st-ZA'
        ? 'Tsohle tseo Royal Square e li hlokang, <strong>sebakeng se le seng.</strong>'
        : locale === 'af-ZA'
        ? 'Alles wat Royal Square benodig, <strong>op een plek.</strong>'
        : 'Yonke into efunwa yi-Royal Square, <strong>kwindawo enye.</strong>'
    } else if (orig.includes('waiting on') || orig.includes('okulindile') || orig.includes('letetseng') || orig.includes('waarvoor') || orig.includes('oyilindeleyo')) {
      mainHeading.innerHTML = locale === 'en-ZA'
        ? 'Everything you’re <strong>waiting on.</strong>'
        : locale === 'zu-ZA'
        ? 'Konke <strong>okulindile.</strong>'
        : locale === 'st-ZA'
        ? 'Tsohle tseo u li <strong>letetseng.</strong>'
        : locale === 'af-ZA'
        ? 'Alles waarvoor jy <strong>wag.</strong>'
        : 'Yonke into <strong>oyilindeleyo.</strong>'
    } else if (orig.includes('Track every service') || orig.includes('Landelela zonke') || orig.includes('Latedisa kopo') || orig.includes('Volg elke') || orig.includes('Landela sonke')) {
      mainHeading.innerHTML = locale === 'en-ZA'
        ? 'Track every service request, <strong>step by step.</strong>'
        : locale === 'zu-ZA'
        ? 'Landelela zonke izicelo zenkonzo, <strong>isinyathelo ngesinyathelo.</strong>'
        : locale === 'st-ZA'
        ? 'Latedisa kopo e ’ngwe le e ’ngwe ea litšebeletso, <strong>mohato ka mohato.</strong>'
        : locale === 'af-ZA'
        ? 'Volg elke diensversoek, <strong>stap vir stap.</strong>'
        : 'Landela sonke isicelo senkonzo, <strong>inyathelo ngenyathelo.</strong>'
    } else if (orig.includes('banking details') || orig.includes('yasebhange') || orig.includes('tsa banka') || orig.includes('bankbesonderhede') || orig.includes('zebhanki')) {
      mainHeading.innerHTML = locale === 'en-ZA'
        ? 'Change your <strong>banking details.</strong>'
        : locale === 'zu-ZA'
        ? 'Shintsha <strong>imininingwane yasebhange.</strong>'
        : locale === 'st-ZA'
        ? 'Fetola <strong>lintlha tsa banka.</strong>'
        : locale === 'af-ZA'
        ? 'Verander jou <strong>bankbesonderhede.</strong>'
        : 'Tshintsha <strong>iinkcukacha zebhanki.</strong>'
    }
  }

  // 3. Subtitles
  const subHeading = scope.querySelector<HTMLElement>('#pageSubHeading, .intro-supporting')
  if (subHeading) {
    const orig = subHeading.getAttribute('data-orig') || subHeading.textContent || ''
    if (!subHeading.getAttribute('data-orig')) subHeading.setAttribute('data-orig', orig)

    if (orig.includes('Upload, complete, sign') || orig.includes('Layisha, gcwalisa') || orig.includes('Kenya, tlatsa') || orig.includes('Laai op') || orig.includes('Layisha, gqiba')) {
      subHeading.textContent = locale === 'en-ZA'
        ? 'Upload, complete, sign and securely store your financial documents.'
        : locale === 'zu-ZA'
        ? 'Layisha, gcwalisa, sayina futhi ugcine amadokhumenti akho ezezimali ngokuphepha.'
        : locale === 'st-ZA'
        ? 'Kenya, tlatsa, saena le ho boloka litokomane tsa hau tsa lichelete ka mokhoa o sireletsehileng.'
        : locale === 'af-ZA'
        ? 'Laai op, voltooi, teken en bewaar jou finansiële dokumente veilig.'
        : 'Layisha, gqiba, sayina uze ugcine amaxwebhu akho emali ngokukhuselekileyo.'
    } else if (orig.includes('submission to completion') || orig.includes('ekuthunyelweni') || orig.includes('li romela') || orig.includes('indiening tot') || orig.includes('ekuthunyelweni kude')) {
      subHeading.textContent = locale === 'en-ZA'
        ? 'Follow your requests from submission to completion.'
        : locale === 'zu-ZA'
        ? 'Landela izicelo zakho kusukela ekuthunyelweni kuze kube sekugcineni.'
        : locale === 'st-ZA'
        ? 'Latela likopo tsa hau ho tloha ha u li romela ho fihlela li phethoa.'
        : locale === 'af-ZA'
        ? 'Volg jou versoeke van indiening tot voltooiing.'
        : 'Landela izicelo zakho ukususela ekuthunyelweni kude kube sekugqityweni.'
    } else if (orig.includes('Real-time visibility') || orig.includes('Ukubonakala') || orig.includes('Pono ea nako') || orig.includes('Intydse sigbaarheid')) {
      subHeading.textContent = locale === 'en-ZA'
        ? 'Real-time visibility on what is happening with Qiniso and your financial providers.'
        : locale === 'zu-ZA'
        ? 'Ukubonakala kwesikhathi sangempela kokwenzekayo noQiniso nabahlinzeki bakho bezezimali.'
        : locale === 'st-ZA'
        ? 'Pono ea nako ea nnete ea se etsahalang ka Qiniso le bafani ba hau ba lichelete.'
        : locale === 'af-ZA'
        ? 'Intydse sigbaarheid oor wat gebeur met Qiniso en jou finansiële verskaffers.'
        : 'Ukubonakala kwexesha lokwenyani kwinto eyenzekayo ngoQiniso nababoneleli bakho bemali.'
    }
  }

  // 4. Hero greetings (Home dashboard)
  const heroHeading = scope.querySelector<HTMLElement>('#heroHeading')
  if (heroHeading) {
    heroHeading.textContent = locale === 'en-ZA'
      ? `Hey, ${firstName}. Need help?`
      : locale === 'zu-ZA'
      ? `Sawubona, ${firstName}. Udinga usizo?`
      : locale === 'st-ZA'
      ? `Lumela, ${firstName}. Na o hloka thuso?`
      : locale === 'af-ZA'
      ? `Hallo, ${firstName}. Benodig hulp?`
      : `Molo, ${firstName}. Ingaba ufuna uncedo?`
  }

  const heroSub = scope.querySelector<HTMLElement>('#heroSubheading span:last-child')
  if (heroSub && (heroSub.textContent?.includes('ask') || heroSub.textContent?.includes('Buza') || heroSub.textContent?.includes('Botsa') || heroSub.textContent?.includes('Vra'))) {
    heroSub.textContent = locale === 'en-ZA'
      ? 'Just ask me anything!'
      : locale === 'zu-ZA'
      ? 'Buza noma yini!'
      : locale === 'st-ZA'
      ? 'Botsa eng kapa eng!'
      : locale === 'af-ZA'
      ? 'Vra my enigiets!'
      : 'Buza nantoni na!'
  }

  // 5. Tasks button on home dashboard
  const tasksBtnSpan = scope.querySelector<HTMLElement>('.btn-coral-tasks span:first-child')
  if (tasksBtnSpan) {
    tasksBtnSpan.textContent = t.showMyTasks
  }

  // 6. Section Tags & Badges
  const urgentTags = scope.querySelectorAll<HTMLElement>('.section-label-tag.urgent span, .stat-pill.attention span:last-child')
  urgentTags.forEach(el => {
    el.textContent = t.needsAttention
  })

  // 7. Buttons
  const uploadBtn = scope.querySelector<HTMLElement>('.btn-coral-upload span')
  if (uploadBtn && (uploadBtn.textContent?.includes('Upload') || uploadBtn.textContent?.includes('Layisha') || uploadBtn.textContent?.includes('Kenya') || uploadBtn.textContent?.includes('Laai'))) {
    uploadBtn.textContent = t.uploadDoc
  }

  // 8. Profile badge in prototype top bar
  const profileRole = scope.querySelector<HTMLElement>('.profile-pill-topright .client-role span:first-child')
  if (profileRole) {
    profileRole.textContent = t.privateClient
  }

  // 9. Card Kicker
  const cardKicker = scope.querySelector<HTMLElement>('.card-kicker')
  if (cardKicker && (cardKicker.textContent?.includes('Portfolio') || cardKicker.textContent?.includes('Iphothifoliyo') || cardKicker.textContent?.includes('Potefolio') || cardKicker.textContent?.includes('Kliëntportefeulje'))) {
    cardKicker.textContent = locale === 'en-ZA'
      ? 'Client Portfolio'
      : locale === 'zu-ZA'
      ? 'Iphothifoliyo Yekhasimende'
      : locale === 'st-ZA'
      ? 'Potefolio ea Moreki'
      : locale === 'af-ZA'
      ? 'Kliëntportefeulje'
      : 'Iphothifoliyo yoMxhasi'
  }
}

function applyClientProfileDom(scope: ParentNode, client?: Client) {
  if (!client || !client.name) return
  const fullName = client.name.trim()
  const firstName = fullName.split(' ')[0] || 'Client'

  // 1. Client name text elements across prototype headers, pills, and navigation
  scope.querySelectorAll<HTMLElement>('.client-name').forEach((el) => {
    el.textContent = fullName
  })

  // 2. Avatar alt text
  scope.querySelectorAll<HTMLImageElement>('.client-avatar').forEach((img) => {
    img.alt = fullName
  })

  // 3. Document and Form Fields in prototype pages
  const docClientName = scope.querySelector<HTMLElement>('#docClientName')
  if (docClientName) docClientName.textContent = fullName

  const docClientSigner = scope.querySelector<HTMLElement>('#docClientSignerName')
  if (docClientSigner) docClientSigner.textContent = fullName

  const typeSigInput = scope.querySelector<HTMLInputElement>('#typeSigInput')
  if (typeSigInput) typeSigInput.value = fullName

  // 4. Verification and summary labels
  scope.querySelectorAll<HTMLElement>('.verif-val, .summary-val').forEach((el) => {
    if (el.textContent && (el.textContent.includes('Latoya') || el.textContent.includes('Matai'))) {
      el.textContent = `${fullName} ✓`
    }
  })

  // 5. Signature metadata lines
  scope.querySelectorAll<HTMLElement>('.sig-meta-line').forEach((el) => {
    if (el.textContent && el.textContent.includes('Latoya Matai')) {
      el.textContent = el.textContent.replace(/Latoya Matai/g, fullName)
    }
  })

  // 6. Interactive buttons with alerts or toasts
  const notifBtn = scope.querySelector<HTMLButtonElement>('.notif-btn')
  if (notifBtn) {
    notifBtn.setAttribute('onclick', `if(window.showToast){window.showToast('${firstName}, you have 1 pending portfolio update action.');}else{alert('${firstName}, you have 1 pending portfolio update action.');}`)
  }

  const taskBtn = scope.querySelector<HTMLButtonElement>('.btn-coral-tasks')
  if (taskBtn) {
    taskBtn.setAttribute('onclick', `if(window.showToast){window.showToast('Showing pending tasks for ${fullName}');}else{alert('Showing pending tasks for ${fullName}');}`)
  }

  const micBtn = scope.querySelector<HTMLButtonElement>('.mic-button')
  if (micBtn) {
    micBtn.setAttribute('onclick', `if(window.showToast){window.showToast('Voice search listening: What can we help you with, ${firstName}?');}else{alert('Voice search listening: What can we help you with, ${firstName}?');}`)
  }

  const advBtn = scope.querySelector<HTMLButtonElement>('.btn-adviser-subtle')
  if (advBtn) {
    advBtn.setAttribute('onclick', `if(window.showToast){window.showToast('Messaging Qiniso Ntuli for ${fullName}...');}else{alert('Messaging Qiniso Ntuli for ${fullName}...');}`)
  }

  // 7. Profile pill click toast
  const profilePill = scope.querySelector<HTMLElement>('.profile-pill-topright')
  if (profilePill) {
    profilePill.setAttribute('onclick', `if(window.showToast){window.showToast('Viewing profile & security settings for ${fullName}...');}else{alert('Viewing profile & security settings for ${fullName}...');}`)
  }
}

export function PrototypePage({ source, route }: { source: string; route: PrototypeRoute }) {
  const hostRef = useRef<HTMLDivElement>(null)
  const [payload, setPayload] = useState<{ markup: string; scripts: string } | null>(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const { state, dispatch } = usePortal()
  const navigate = useNavigate()
  const location = useLocation()
  const localeRef = useRef(state.locale)
  const simpleRef = useRef(state.simpleMode)
  simpleRef.current = state.simpleMode

  const handlePrototypeClick = (event: ReactMouseEvent<HTMLDivElement>) => {
    const target = event.target
    if (!(target instanceof Element)) return

    if (target.closest('#simpleModeToggle, #simpleToggleBtn')) {
      // Keep this handler on the React host instead of on injected prototype
      // nodes. Those nodes can be recreated as the prototype responds to
      // state, but React's delegated handler remains attached across renders.
      event.preventDefault()
      const next = !simpleRef.current
      simpleRef.current = next
      if (hostRef.current) applySimpleModeDom(hostRef.current, next, state.client.name)
      dispatch({ type: 'set-simple-mode', value: next })
      return
    }

    if (target.closest('#lang-btn')) {
      event.preventDefault()
      const locales: Locale[] = ['en-ZA', 'zu-ZA', 'st-ZA', 'af-ZA', 'xh-ZA']
      const next = locales[(locales.indexOf(localeRef.current) + 1) % locales.length]
      localeRef.current = next
      if (hostRef.current) applyLocaleDom(hostRef.current, next, state.client.name)
      dispatch({ type: 'set-locale', locale: next })
      const nextMeta = LANGUAGE_METADATA[next]
      const nextT = useTranslation(next)
      const win = window as unknown as { showToast?: (msg: string) => void }
      if (typeof win.showToast === 'function') {
        win.showToast(`${nextT.languageSwitched} (${nextMeta.nativeName})`)
      }
      return
    }

    if (target.closest('[data-more-requests]')) {
      event.preventDefault()
      setMenuOpen(false)
      navigate(`${window.location.pathname}?service=catalog`)
      return
    }

    if (route === 'accident') {
      const incidentPill = target.closest<HTMLElement>('.incident-pill-tab')
      if (incidentPill) {
        event.preventDefault()
        const key = incidentPill.dataset.incident
        if (key) {
          const prototypeWindow = window as unknown as PrototypeWindow
          const fn = prototypeWindow.applyIncidentTarget as ((k: string) => void) | undefined
          if (typeof fn === 'function') fn(key)
        }
        return
      }

      const exitLink = target.closest<HTMLAnchorElement>('a[href="client_ui.html"], a[href="/"], a.btn-circle[title*="Exit"], a.btn-neutral-back[href*="client_ui"]')
      if (exitLink) {
        event.preventDefault()
        navigate('/')
        return
      }

      const trackBtn = target.closest<HTMLElement>('button[onclick*="navigateToRequestsClaim"]')
      if (trackBtn) {
        event.preventDefault()
        navigate('/requests?claim=RSF-2841')
        return
      }

      const submitBtn = target.closest<HTMLElement>('button[onclick*="submitAccidentDossier"], #btnFinalSubmitAction')
      if (submitBtn) {
        event.preventDefault()
        const prototypeWindow = window as unknown as PrototypeWindow
        const fn = prototypeWindow.submitAccidentDossier as (() => void) | undefined
        if (typeof fn === 'function') {
          fn()
        }
        return
      }

      const gpsBtn = target.closest<HTMLElement>('button[onclick*="simulateGpsLock"]')
      if (gpsBtn) {
        event.preventDefault()
        const prototypeWindow = window as unknown as PrototypeWindow
        const fn = prototypeWindow.simulateGpsLock as (() => void) | undefined
        if (typeof fn === 'function') {
          fn()
        }
        return
      }

      const demoSnapBtn = target.closest<HTMLElement>('button[onclick*="snapAllEvidenceDemo"]')
      if (demoSnapBtn) {
        event.preventDefault()
        const prototypeWindow = window as unknown as PrototypeWindow
        const fn = prototypeWindow.snapAllEvidenceDemo as (() => void) | undefined
        if (typeof fn === 'function') {
          fn()
        }
        return
      }

      const stepBtn = target.closest<HTMLElement>('button[onclick*="goToStep"], button[onclick*="jumpToStep"], .btn-coral-action')
      if (stepBtn) {
        const onclickAttr = stepBtn.getAttribute('onclick') ?? ''
        const match = onclickAttr.match(/(?:goToStep|jumpToStep)\s*\(\s*(\d+)\s*\)/)
        const targetStep = match ? Number(match[1]) : (stepBtn.textContent?.includes('Capture Location') ? 2 : null)
        if (targetStep !== null) {
          event.preventDefault()
          const prototypeWindow = window as unknown as PrototypeWindow
          const fn = prototypeWindow.goToStep as ((s: number) => void) | undefined
          if (typeof fn === 'function') {
            fn(targetStep)
          }
          return
        }
      }
    }

    if (route !== 'home') return

    const homeDestinations: Array<[string, string]> = [
      ['.btn-coral-tasks', '/tasks'],
      ['.btn-accident-action', '/accident'],
      ['.portfolio-edit-link', '/banking-details'],
      ['.btn-light-pill, .vault-row-item', '/documents'],
      ['.center-stack, .networth-card, .goals-master-card, .btn-dark-pill, .capsule-action[title="Share Portfolio"]', '/finances'],
      ['.capsule-action[title="Quick Add"]', '/?service=catalog'],
      ['.btn-adviser-subtle, .calendar-circle, .btn-adviser-action, .mic-button, .adviser-card [aria-label="More"]', '/?service=consultation'],
      ['.profile-pill-topright', '/?service=personal_details_update'],
      ['.btn-add-goal', '/finances'],
    ]
    const destination = homeDestinations.find(([selector]) => target.closest(selector))?.[1]
    if (destination) {
      event.preventDefault()
      navigate(destination)
      return
    }

    if (target.closest('.brand-cluster .btn-circle')) {
      event.preventDefault()
      setMenuOpen(true)
      return
    }

    if (target.closest('.notif-btn')) {
      event.preventDefault()
      navigate('/tasks')
    }
  }

  useEffect(() => {
    let cancelled = false
    fetch(source)
      .then((response) => response.text())
      .then((html) => {
        if (cancelled) return
        const parsed = new DOMParser().parseFromString(html, 'text/html')
        const style = document.createElement('style')
        style.id = `prototype-styles-${route}`
        const isolation = '\n.prototype-page-host .top-header { padding: 0; border: 0; background: transparent; backdrop-filter: none; position: static; z-index: auto; }' + (route === 'home' ? '\n.prototype-home .vault-card, .prototype-home .adviser-card { grid-area: auto; }' : '')
        style.textContent = `${parsed.querySelector('style')?.textContent ?? ''}\nbody { font-size: initial; }\nbutton, input, textarea, select { font-size: revert; }${isolation}\n${clientMobileCss}`
        document.head.appendChild(style)
        setPayload(cleanSource(parsed, route))
      })
    return () => {
      cancelled = true
      document.getElementById(`prototype-styles-${route}`)?.remove()
      document.body.classList.remove('simple-mode')
    }
  }, [route, source])

  useEffect(() => {
    const root = hostRef.current
    if (!root || !payload) return
    root.innerHTML = payload.markup
    const prototypeWindow = window as unknown as PrototypeWindow
    const names = functionNames(payload.scripts)
    const previous = new Map<string, { present: boolean; value: unknown }>()
    const remember = (name: string) => {
      if (!previous.has(name)) previous.set(name, { present: name in prototypeWindow, value: prototypeWindow[name] })
    }
    names.forEach(remember)
    // Use the cached lucide-local.js icon runtime (built by `npm run icons`
    // from the installed lucide-react package) as the primary icon renderer.
    // It resolves all 82 data-lucide names by exact SVG nodes document-wide,
    // including icons injected dynamically by prototype scripts.
    const stub = { createIcons: () => hydratePrototypeIcons(root), __rsStub: true }
    const existingLucide = prototypeWindow.lucide as { createIcons?: () => void; __rsStub?: boolean } | undefined
    if (!existingLucide || existingLucide.__rsStub) {
      remember('lucide')
      prototypeWindow.lucide = stub
    }
    const sweepIcons = () => {
      try {
        ;(prototypeWindow.lucide as { createIcons?: () => void } | undefined)?.createIcons?.()
      } catch { /* prototype icon sweep is best-effort */ }
    }
    if (!document.querySelector('script[data-lucide-local]')) {
      const local = document.createElement('script')
      local.src = '/prototype/lucide-local.js'
      local.setAttribute('data-lucide-local', 'true')
      local.onload = () => sweepIcons()
      local.onerror = () => sweepIcons()
      document.head.appendChild(local)
    }
    // Self-healing icons: if anything (simple-mode toggle, prototype
    // re-render, toast injection) reintroduces <i data-lucide> placeholders,
    // sweep them on the next microtask. Terminates because swept SVGs carry
    // no data-lucide attribute.
    let sweepQueued = false
    const queueSweep = () => {
      if (sweepQueued) return
      sweepQueued = true
      queueMicrotask(() => {
        sweepQueued = false
        if (root.querySelector('[data-lucide]')) sweepIcons()
      })
    }
    const iconObserver = new MutationObserver(queueSweep)
    iconObserver.observe(root, { childList: true, subtree: true })

    const script = document.createElement('script')
    const exposed = payload.scripts
      .replace(/const sceneEvidenceData\s*=/g, 'window.sceneEvidenceData =')
      .replace(/function\s+([A-Za-z_$][\w$]*)\s*\(/g, 'window.$1 = function $1(')
    script.textContent = `(function () {\nvar lucide = window.lucide || { createIcons: function () {} };\n${exposed}\n})();`
    root.appendChild(script)
    hydratePrototypeIcons(root)
    sweepIcons()
    applyClientProfileDom(root, state.client)
    applyLocaleDom(root, state.locale, state.client.name)
    applySimpleModeDom(root, state.simpleMode, state.client.name)
    document.dispatchEvent(new Event('DOMContentLoaded'))
    window.dispatchEvent(new Event('load'))

    const routeLinks: Record<string, string> = { 'index.html': '/', 'client_ui.html': '/', 'requests.html': '/requests', 'documents.html': '/documents', 'finances.html': '/finances' }
    root.querySelectorAll<HTMLAnchorElement>('a[href]').forEach((anchor) => {
      const href = anchor.getAttribute('href') ?? ''
      const [target, query] = href.split('?')
      if (routeLinks[target]) anchor.setAttribute('href', `${routeLinks[target]}${query ? `?${query}` : ''}`)
    })

    root.querySelectorAll<HTMLInputElement>('.header-center-search input').forEach((input) => {
      input.setAttribute('placeholder', 'Search requests, documents, advice...')
      input.addEventListener('keydown', (event) => {
        if (event.key === 'Enter') {
          event.preventDefault()
          const q = input.value.trim()
          navigate(`/requests${q ? `?q=${encodeURIComponent(q)}` : ''}`)
        }
      })
    })

    const raw = (name: string) => prototypeWindow[name] as ((...args: any[]) => any) | undefined
    const install = (name: string, value: unknown) => { remember(name); prototypeWindow[name] = value }
    if (typeof raw('handleNavClick') === 'function') {
      install('handleNavClick', (event: Event, name: string) => {
        event.preventDefault()
        raw('closeNavDrawer')?.()
        navigate(routeForName(name))
      })
    }
    const serviceForDrawerAction: Record<string, string> = {
      'Update beneficiary': 'beneficiary_update',
      'Update personal details': 'personal_details_update',
      'Book a review': 'consultation',
      'Ask my adviser': 'consultation',
      'Report change in circumstances': 'info_collection',
    }
    const rawDrawerAction = raw('handleDrawerAction')
    if (typeof rawDrawerAction === 'function') {
      install('handleDrawerAction', (name: string) => {
        const service = serviceForDrawerAction[name]
        raw('closeNavDrawer')?.()
        if (service) navigate(`${window.location.pathname}?service=${service}`)
        else rawDrawerAction(name)
      })
    }
    // Append a 'More requests' entry to the prototype's own Quick Actions list.
    const moreButtons: HTMLButtonElement[] = []
    root.querySelectorAll<HTMLElement>('.drawer-actions-list').forEach((list) => {
      if (list.querySelector('[data-more-requests]')) return
      const button = document.createElement('button')
      button.className = 'drawer-action-btn'
      button.setAttribute('data-more-requests', 'true')
      button.innerHTML = '<span class="action-icon-pill"><i data-lucide="plus"></i></span><span>More requests…</span>'
      button.addEventListener('click', () => {
        raw('closeNavDrawer')?.()
        navigate(`${window.location.pathname}?service=catalog`)
      })
      list.appendChild(button)
      moreButtons.push(button)
    })
    hydratePrototypeIcons(root)
    sweepIcons()
    if (typeof raw('handleBackToDocuments') === 'function') install('handleBackToDocuments', () => navigate('/documents'))
    if (typeof raw('navigateToRequestsClaim') === 'function') {
      install('navigateToRequestsClaim', () => navigate('/requests?claim=RSF-2841'))
    }
    if (route === 'banking') {
      const rawGoToStep = raw('goToStep')
      if (typeof rawGoToStep === 'function') {
        install('goToStep', (step: number) => {
          rawGoToStep(step)
          dispatch({ type: 'set-banking-stage', stage: step })
        })
      }
      const rawUpload = raw('simulateFileUpload')
      if (typeof rawUpload === 'function') {
        install('simulateFileUpload', (old: boolean) => {
          rawUpload(old)
          dispatch({ type: 'upload-statement', valid: !old })
        })
      }
      const rawSubmit = raw('submitBankingInstruction')
      if (typeof rawSubmit === 'function') {
        install('submitBankingInstruction', () => {
          rawSubmit()
          dispatch({ type: 'sign-banking' })
          dispatch({ type: 'submit-banking' })
        })
      }
      if (state.banking.submitted) {
        root.querySelectorAll<HTMLElement>('.step-section').forEach((section) => section.classList.remove('active'))
        const success = root.querySelector<HTMLElement>('#successSectionView')
        if (success) success.style.display = 'flex'
      } else if (state.banking.stage > 1 && state.banking.stage < 8 && typeof rawGoToStep === 'function') {
        rawGoToStep(state.banking.stage)
      }
    }
    if (route === 'consent') {
      const rawFinalise = raw('handleFinaliseSubmission')
      if (typeof rawFinalise === 'function') {
        install('handleFinaliseSubmission', () => {
          rawFinalise()
          window.setTimeout(() => {
            if (root.querySelector('#successCardView.visible')) dispatch({ type: 'sign-consent', signature: 'Signed electronically' })
          }, 0)
        })
      }
      if (state.formSubmissions.some((submission) => submission.formType === 'client-consent' && submission.status === 'signed')) {
        root.querySelector<HTMLElement>('#activeWorkflowView')?.style.setProperty('display', 'none')
        root.querySelector<HTMLElement>('#successCardView')?.classList.add('visible')
        root.querySelector<HTMLElement>('#docVerifiedStamp')?.classList.add('visible')
      }
    }
    if (route === 'accident') {
      const rawGoToStep = raw('goToStep')
      const performStepTransition = (step: number) => {
        try {
          if (typeof rawGoToStep === 'function') rawGoToStep(step)
        } catch (err) {
          console.warn('[PrototypePage] Error in rawGoToStep:', err)
        }
        for (let i = 1; i <= 7; i++) {
          const view = root.querySelector<HTMLElement>(`#stepView${i}`)
          const pill = root.querySelector<HTMLElement>(`#stepPill${i}`)
          if (view) view.style.display = i === step ? 'block' : 'none'
          if (pill) {
            pill.classList.toggle('active', i === step)
            if (i < step) pill.classList.add('done')
            else pill.classList.remove('done')
          }
        }
        const successView = root.querySelector<HTMLElement>('#stepViewSuccess')
        if (successView) successView.style.display = 'none'
        const progressTag = root.querySelector<HTMLElement>('#stepProgressTag')
        if (progressTag) progressTag.textContent = `Step ${step} of 7`
        try {
          window.scrollTo({ top: 0, behavior: 'smooth' })
        } catch { /* ignore */ }
        dispatch({ type: 'update-accident', patch: { step } })
      }

      install('goToStep', performStepTransition)
      install('jumpToStep', performStepTransition)
      if (state.accident.step > 1) {
        performStepTransition(state.accident.step)
      }
      const rawToggleNetwork = raw('toggleOnlineSimulation')
      if (typeof rawToggleNetwork === 'function') {
        install('toggleOnlineSimulation', () => {
          rawToggleNetwork()
          const offline = root.querySelector('#connectionStatusPill')?.classList.contains('offline') ?? false
          dispatch({ type: 'update-accident', patch: { online: !offline } })
        })
        if (state.accident.online) rawToggleNetwork()
      }
      const rawSubmit = raw('submitAccidentDossier')
      if (typeof rawSubmit === 'function') {
        install('submitAccidentDossier', () => {
          rawSubmit()
          const offline = root.querySelector('#connectionStatusPill')?.classList.contains('offline') ?? false
          if (offline) dispatch({ type: 'update-accident', patch: { savedOffline: true, online: false } })
          else dispatch({ type: 'sync-accident' })
        })
      }

      let detectionTimer1: number | undefined
      let detectionTimer2: number | undefined
      let detectionTimer3: number | undefined

      const triggerMockAiLocationDetection = async (sourceLabel = 'scene photo') => {
        window.clearTimeout(detectionTimer1)
        window.clearTimeout(detectionTimer2)
        window.clearTimeout(detectionTimer3)

        const toast = root.querySelector<HTMLElement>('#actionToastEl')
        const toastMsg = root.querySelector<HTMLElement>('#toastMsgContent')

        const spinLoaderSvg = `<svg class="spin-icon" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="#e85d3f" stroke-width="2.5" style="display:inline-block; vertical-align:middle; animation: toastSpin 0.85s linear infinite;"><circle cx="12" cy="12" r="10" stroke-opacity="0.25"></circle><path d="M12 2a10 10 0 0 1 10 10" stroke-linecap="round"></path></svg>`
        const scanRadarSvg = `<svg class="pulse-icon" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="#e85d3f" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block; vertical-align:middle; animation: toastPulse 0.9s ease-in-out infinite;"><circle cx="12" cy="12" r="10"></circle><line x1="22" y1="12" x2="18" y2="12"></line><line x1="6" y1="12" x2="2" y2="12"></line><line x1="12" y1="6" x2="12" y2="2"></line><line x1="12" y1="22" x2="12" y2="18"></line></svg>`
        const checkSvg = `<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="#2b7a48" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block; vertical-align:middle;"><polyline points="20 6 9 17 4 12"></polyline></svg>`

        const gpsBtnLabel = root.querySelector<HTMLElement>('#btnGpsLabel')
        if (gpsBtnLabel) gpsBtnLabel.textContent = 'Analyzing Photo EXIF...'

        // Stage 1: Initial metadata inspection (0s - 1.1s)
        if (toast && toastMsg) {
          const iconEl = toast.querySelector('i, svg')
          if (iconEl) iconEl.outerHTML = spinLoaderSvg
          toastMsg.textContent = `Analyzing ${sourceLabel} metadata & visual geometry...`
          toast.classList.add('active')
        }

        // Stage 2: Geospatial grid matching (1.1s - 2.2s)
        detectionTimer1 = window.setTimeout(() => {
          if (toast && toastMsg) {
            const iconEl = toast.querySelector('i, svg')
            if (iconEl) iconEl.outerHTML = scanRadarSvg
            toastMsg.textContent = 'Matching road landmarks against Johannesburg GIS...'
          }
          if (gpsBtnLabel) gpsBtnLabel.textContent = 'Matching GIS Landmarks...'
        }, 1100)

        const result = await mockDetectLocationFromPhoto()

        // Stage 3: Resolved & Verified (2.2s+)
        const lat = root.querySelector<HTMLElement>('#latDisplay')
        const lng = root.querySelector<HTMLElement>('#longDisplay')
        const acc = root.querySelector<HTMLElement>('#accuracyDisplay')
        const time = root.querySelector<HTMLElement>('#gpsTimeDisplay')
        const street = root.querySelector<HTMLInputElement>('#streetInputEl')

        if (lat) lat.textContent = `${result.coordinates.lat}° S`
        if (lng) lng.textContent = `${result.coordinates.lng}° E`
        if (acc) acc.textContent = result.accuracy
        if (time) time.textContent = result.timestamp
        if (street) street.value = result.landmark
        if (gpsBtnLabel) gpsBtnLabel.textContent = 'Location Verified via Photo ✓'

        if (toast && toastMsg) {
          const iconEl = toast.querySelector('i, svg')
          if (iconEl) iconEl.outerHTML = checkSvg
          toastMsg.textContent = `Location resolved: Commissioner & Sauer St (${Math.round(result.confidence * 100)}% match)`
          toast.classList.add('active')
          detectionTimer2 = window.setTimeout(() => toast.classList.remove('active'), 3800)
        }

        dispatch({
          type: 'update-accident',
          patch: {
            gpsCaptured: true,
            location: result.landmark,
          },
        })
      }

      const rawGps = raw('simulateGpsLock')
      install('simulateGpsLock', async () => {
        if (typeof rawGps === 'function') rawGps()
        await triggerMockAiLocationDetection('camera sensors & RTK GPS')
      })

      const rawToggleEvidence = raw('toggleEvidenceCard')
      if (typeof rawToggleEvidence === 'function') {
        install('toggleEvidenceCard', async (id: string | number) => {
          rawToggleEvidence(id)
          await triggerMockAiLocationDetection('scene photo evidence')
        })
      }

      const rawSnapAll = raw('snapAllEvidenceDemo')
      if (typeof rawSnapAll === 'function') {
        install('snapAllEvidenceDemo', async () => {
          rawSnapAll()
          await triggerMockAiLocationDetection('all 8 scene photos')
        })
      }

      const applyIncidentTarget = (targetKey: string, notify = true) => {
        const config = INCIDENT_TARGET_CONFIGS[targetKey] || INCIDENT_TARGET_CONFIGS.other_vehicle
        const pWin = window as unknown as PrototypeWindow & {
          sceneEvidenceData?: Array<{ id: number; title: string; meta: string; captured: boolean; img: string | null }>
          renderSceneEvidenceGrid?: () => void
          showFeedbackToast?: (msg: string) => void
        }

        if (Array.isArray(pWin.sceneEvidenceData)) {
          const card5 = pWin.sceneEvidenceData.find((i) => i.id === 5)
          if (card5) {
            card5.title = config.card5Title
            card5.meta = config.card5Meta
            if (card5.captured) card5.img = config.card5Img
          }
          const card1 = pWin.sceneEvidenceData.find((i) => i.id === 1)
          if (card1) card1.meta = config.card1Meta
          const card6 = pWin.sceneEvidenceData.find((i) => i.id === 6)
          if (card6) card6.meta = config.card6Meta

          if (typeof pWin.renderSceneEvidenceGrid === 'function') {
            pWin.renderSceneEvidenceGrid()
          }
        }

        const s4Heading = root.querySelector<HTMLElement>('#step4Heading')
        const s4Sub = root.querySelector<HTMLElement>('#step4Sub')
        if (s4Heading) s4Heading.textContent = config.step4Heading
        if (s4Sub) s4Sub.textContent = config.step4Sub

        root.querySelectorAll<HTMLElement>('.incident-pill-tab').forEach((pill) => {
          pill.classList.toggle('active', pill.dataset.incident === targetKey)
        })

        if (notify && typeof pWin.showFeedbackToast === 'function') {
          pWin.showFeedbackToast(`Incident requirement: ${config.card5Title}`)
        }

        dispatch({
          type: 'update-accident',
          patch: {
            incidentTarget: targetKey as any,
          },
        })
      }

      install('applyIncidentTarget', applyIncidentTarget)

      const initialTarget = state.accident.incidentTarget || 'other_vehicle'

      const step3Header = root.querySelector<HTMLElement>('#stepView3 .intake-header-block')
      if (step3Header && !root.querySelector('#incidentSelectorStep3')) {
        const bar = document.createElement('div')
        bar.id = 'incidentSelectorStep3'
        bar.className = 'incident-type-selector-bar'
        bar.innerHTML = `
          <div class="incident-selector-title">
            <i data-lucide="layers" style="width: 13px; height: 13px; color: var(--accent-coral);"></i>
            <span>Impact target / Incident category</span>
          </div>
          <div class="incident-pill-tabs">
            ${Object.entries(INCIDENT_TARGET_CONFIGS).map(([key, cfg]) => `
              <button type="button" class="incident-pill-tab ${key === initialTarget ? 'active' : ''}" data-incident="${key}">
                <i data-lucide="${cfg.icon}" style="width: 13px; height: 13px;"></i>
                <span>${cfg.label}</span>
              </button>
            `).join('')}
          </div>
        `
        step3Header.insertAdjacentElement('afterend', bar)
        hydratePrototypeIcons(bar)
      }

      const step1Fields = root.querySelector<HTMLElement>('#stepView1 .interactive-fields-flow')
      if (step1Fields && !root.querySelector('#incidentSelectorStep1')) {
        const bar1 = document.createElement('div')
        bar1.id = 'incidentSelectorStep1'
        bar1.className = 'form-row-group'
        bar1.style.marginTop = '14px'
        bar1.innerHTML = `
          <div class="field-label-group">
            <span class="field-title">Collision or damage category</span>
            <span class="field-subtext">Adapts required photographs and party declarations</span>
          </div>
          <div class="incident-pill-tabs" style="margin-top: 6px;">
            ${Object.entries(INCIDENT_TARGET_CONFIGS).map(([key, cfg]) => `
              <button type="button" class="incident-pill-tab ${key === initialTarget ? 'active' : ''}" data-incident="${key}">
                <i data-lucide="${cfg.icon}" style="width: 13px; height: 13px;"></i>
                <span>${cfg.label}</span>
              </button>
            `).join('')}
          </div>
        `
        const useRow = step1Fields.querySelector('.form-row-group:nth-child(2)')
        if (useRow) useRow.insertAdjacentElement('afterend', bar1)
        else step1Fields.appendChild(bar1)
        hydratePrototypeIcons(bar1)
      }

      if (initialTarget !== 'other_vehicle') {
        applyIncidentTarget(initialTarget, false)
      }
    }

    return () => {
      iconObserver.disconnect()
      moreButtons.forEach((button) => button.remove())
      script.remove()
      previous.forEach(({ present, value }, name) => {
        if (name === 'lucide') return // restored below; never clobber the cached runtime
        if (present) prototypeWindow[name] = value
        else delete prototypeWindow[name]
      })
      if (prototypeWindow.lucide === stub) {
        const entry = previous.get('lucide')
        if (entry) {
          if (entry.present) prototypeWindow.lucide = entry.value as PrototypeWindow['lucide']
          else delete prototypeWindow.lucide
        }
      }
      document.body.classList.remove('simple-mode')
    }
  }, [dispatch, navigate, payload, route])

  useEffect(() => {
    localeRef.current = state.locale
    if (hostRef.current) {
      applyClientProfileDom(hostRef.current, state.client)
      applyLocaleDom(hostRef.current, state.locale, state.client.name)
    }
  }, [location.key, payload, state.locale, state.client])

  // One-directional sync: the store is the source of truth. Forcing (never
  // flipping) means this can never fight the click handler or double-toggle.
  useEffect(() => {
    if (!payload || !hostRef.current) return
    applySimpleModeDom(hostRef.current, state.simpleMode, state.client.name)
  }, [location.key, payload, state.simpleMode, state.client.name])

  return <>
    <div ref={hostRef} className={`prototype-page-host prototype-${route}`} onClick={handlePrototypeClick} />
    {route === 'home' && <MenuDrawer open={menuOpen} onClose={() => setMenuOpen(false)} />}
  </>
}
