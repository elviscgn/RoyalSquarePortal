import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Route, Routes, useLocation } from 'react-router-dom'
import { useEffect } from 'react'
import { ClientShell } from './components/Shell'
import { PrototypePage } from './components/PrototypePage'
import { AdviserPrototypePage } from './components/AdviserPrototypePage'
import { ServiceRequestHub } from './components/ServiceRequestHub'
import { AppStoreProvider } from './store'
import { Finances } from './pages/Finances'
import { Home } from './pages/Home'
import { Tasks } from './pages/Tasks'
import { Onboarding } from './pages/Onboarding'
import { Login } from './pages/Login'
import { DocumentSuite } from './pages/DocumentSuite'
import './styles.css'

function App() {
  const { pathname } = useLocation()
  const isAdviserWorkspace = pathname === '/adviser' || pathname.startsWith('/adviser/')
  const isOnboarding = pathname === '/onboarding'
  const isLogin = pathname === '/login'
  const isDocumentSuite = pathname === '/documents/suite'

  return <AppStoreProvider><Routes>
    <Route path="/" element={<Home />} />
    <Route path="/login" element={<Login />} />
    <Route path="/onboarding" element={<Onboarding />} />
    <Route path="/requests" element={<PrototypePage source="/prototype/client_requests_ui.html" route="requests" />} />
    <Route path="/documents" element={<PrototypePage source="/prototype/client_documents.html" route="documents" />} />
    <Route path="/documents/suite" element={<DocumentSuite />} />
    <Route path="/forms/client-consent" element={<PrototypePage source="/prototype/client_consent.html" route="consent" />} />
    <Route path="/banking-details" element={<PrototypePage source="/prototype/client_change_bank_prot1.html" route="banking" />} />
    <Route path="/accident" element={<PrototypePage source="/prototype/client_report.html" route="accident" />} />
    <Route path="/tasks" element={<ClientShell><Tasks /></ClientShell>} />
    <Route path="/finances" element={<ClientShell><Finances /></ClientShell>} />
    <Route path="/adviser" element={<AdviserPrototypePage source="/prototype-adviser/adviser_ui.html" route="dashboard" />} />
    <Route path="/adviser/inbox" element={<AdviserPrototypePage source="/prototype-adviser/adviser_inbox.html" route="inbox" />} />
    <Route path="/adviser/clients" element={<AdviserPrototypePage source="/prototype-adviser/adviser_clients.html" route="clients" />} />
    <Route path="*" element={<ClientShell><Tasks /></ClientShell>} />
  </Routes>{!isAdviserWorkspace && !isOnboarding && !isLogin && !isDocumentSuite && <ServiceRequestHub />}</AppStoreProvider>
}

function ScrollToTop() {
  const { pathname } = useLocation()

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' })
  }, [pathname])

  return null
}

createRoot(document.getElementById('root')!).render(<StrictMode><BrowserRouter><ScrollToTop /><App /></BrowserRouter></StrictMode>)

if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/service-worker.js').catch(() => undefined)
  })
}
