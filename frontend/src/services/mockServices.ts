import type { PortalState, RequestCase, Task, PortalDocument, Goal, AuditEvent } from '../types'

export interface ClientService { getProfile: (state: PortalState) => PortalState['client'] }
export interface RequestService { list: (state: PortalState) => RequestCase[]; update: (state: PortalState, id: string, patch: Partial<RequestCase>) => RequestCase[] }
export interface DocumentService { list: (state: PortalState) => PortalDocument[] }
export interface FormService { list: (state: PortalState) => PortalState['formSubmissions'] }
export interface ProviderService { submit: (caseId: string) => { status: 'accepted'; providerReference: string } }
export interface TaskService { list: (state: PortalState) => Task[]; complete: (state: PortalState, id: string) => Task[] }
export interface GoalService { list: (state: PortalState) => Goal[] }
export interface PhotoLocationResult {
  detected: boolean
  source: 'ai_visual_landmarks' | 'exif_gps'
  confidence: number
  landmark: string
  coordinates: { lat: number; lng: number }
  formattedCoords: string
  accuracy: string
  timestamp: string
}

export async function mockDetectLocationFromPhoto(
  _photo?: string | File
): Promise<PhotoLocationResult> {
  await new Promise((resolve) => setTimeout(resolve, 2200))
  return {
    detected: true,
    source: 'ai_visual_landmarks',
    confidence: 0.98,
    landmark: 'Commissioner Street & Sauer Street, Marshalltown, Johannesburg',
    coordinates: {
      lat: -26.2041,
      lng: 28.0473,
    },
    formattedCoords: '-26.2041° S, 28.0473° E',
    accuracy: '±3 meters (AI Verified)',
    timestamp: '15:26:44 SAST',
  }
}

export const mockServices = {
  client: { getProfile: (state: PortalState) => state.client } satisfies ClientService,
  requests: {
    list: (state: PortalState) => state.requests,
    update: (state: PortalState, id: string, patch: Partial<RequestCase>) => state.requests.map((request) => request.id === id ? { ...request, ...patch } : request),
  } satisfies RequestService,
  documents: { list: (state: PortalState) => state.documents } satisfies DocumentService,
  forms: { list: (state: PortalState) => state.formSubmissions } satisfies FormService,
  providers: { submit: (caseId: string) => ({ status: 'accepted' as const, providerReference: `RSF-MOCK-${caseId}` }) } satisfies ProviderService,
  tasks: {
    list: (state: PortalState) => state.tasks,
    complete: (state: PortalState, id: string) => state.tasks.map((task) => task.id === id ? { ...task, status: 'complete' as const } : task),
  } satisfies TaskService,
  goals: { list: (state: PortalState) => state.goals } satisfies GoalService,
  accident: {
    detectLocationFromPhoto: mockDetectLocationFromPhoto,
  },
}

export const audit = (action: string, description: string, actor: AuditEvent['actor'] = 'client', requestId?: string): AuditEvent => ({
  id: `audit-${Date.now()}-${Math.random().toString(16).slice(2)}`,
  action, description, actor, requestId, timestamp: new Date().toISOString(),
})
