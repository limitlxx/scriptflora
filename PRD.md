**Product Requirements Document (PRD)**  
**ScriptFlora – AI Scriptwriting Assistant**  
**AI BuildFest 2026 | Track 2 – Case Study 3**  
**Version 2.0 | Full Updated | 48-Hour Build Target**

---

### 1. Document Control

| Item | Detail |
|------|--------|
| Product Name | ScriptFlora |
| Tagline | Structured scripts. Continuity guaranteed. Human control first. |
| Case Study | Case Study 3 – AI Scriptwriting Assistant (LearnWave Media) |
| Target Build Time | 48 hours |
| Primary Stack | Next.js (App Router), TypeScript, React Flow, Zustand, Tailwind CSS, shadcn/ui |
| Auth | **Login with ChatGPT** (opencoredev/login-with-chatgpt SDK) – mandatory |
| AI Provider (MVP) | User’s own ChatGPT subscription via proxy |
| Persistence | Local-first (Zustand + IndexedDB) |
| Future Extensibility | Optional Anthropic / Google API keys later |

---

### 2. Vision

ScriptFlora is a **node-based AI scriptwriting workspace** that turns a simple creative brief into a structured, editable, multi-format script.

Users log in with their ChatGPT account (using their own subscription), choose a specialized skill/pipeline, and work inside a visual React Flow canvas. Every section can be independently regenerated while preserving the original brief, key facts, and continuity. The system is designed so that humans remain in full control at every step.

It directly solves the core pains described in Case Study 3: incomplete briefs, slow structure development, costly full-script revisions, and poor adaptation across video lengths and platforms.

---

### 3. Problem Statement

Writers and media teams at companies like LearnWave Media frequently receive incomplete briefs and spend many hours:
- Developing strong hooks and clear structure
- Writing natural dialogue and narration
- Adapting scripts for different durations and platforms
- Performing repeated revisions when tone, audience, or length changes
- Maintaining factual accuracy and continuity

Most current AI tools produce flat text that is difficult to partially edit and lack structured continuity awareness. ScriptFlora replaces that with a visual, skill-driven, section-level controllable system.

---

### 4. Goals & Success Metrics

**Primary Goal**  
Ship a stable, demo-ready prototype that demonstrates a complete, controllable AI scriptwriting workflow with Login with ChatGPT, skill-based pipelines, structured nodes, and individual node regeneration.

**Secondary Goals**
- Clear human-in-the-loop control (edit / lock / regenerate / approve)
- At least two working skills (Standard Script + Storyline Auteur Script)
- Key-fact preservation and basic continuity checking
- Multi-format output
- Clean export

**Judging Success Criteria**
- Judges can go from landing page → login → brief → generated structured script in under 90 seconds
- Individual node regeneration is visibly working with brief context
- Both skills produce meaningfully different pipelines
- Export works
- Demo remains stable

---

### 5. Target Users

- Scriptwriters, content producers, and media teams (primary – LearnWave Media profile)
- Educational content creators
- Marketing teams producing video and audio ads
- Solo creators who already pay for ChatGPT and want better structure and control

---

### 6. Authentication & AI Access (Mandatory)

**Primary & Only Required Method in MVP: Login with ChatGPT**

We use the official open-source SDK: [opencoredev/login-with-chatgpt](https://github.com/opencoredev/login-with-chatgpt)

**Key Properties**
- Users sign in with their existing ChatGPT account
- They use **their own ChatGPT subscription** (no project-paid tokens)
- Tokens never reach the browser (HttpOnly cookie only)
- All generation requests are proxied through our backend
- Works with Vercel AI SDK (`streamText`, etc.)

**User Flow**
1. Landing page shows “Continue with ChatGPT”
2. User completes the consent + OpenAI device verification flow
3. On success, user is redirected into the ScriptFlora canvas
4. Generation is completely blocked until the user is authenticated

**Future (Post-MVP)**
- Settings page to optionally add Anthropic or Google AI API keys for multi-model support

**Technical Requirements**
- `LWC_SECRET` environment variable (stable secret)
- Server route at `/api/chatgpt/[...path]`
- `<LoginWithChatGPT />` component on the landing / login screen
- Use `createChatGPTProxyProvider()` for all LLM calls in MVP

---

### 7. Core Features (MVP Scope)

#### 7.1 Landing Page
- Clear hero explaining the value
- “Continue with ChatGPT” primary CTA
- Short explanation that users bring their own ChatGPT subscription
- Optional secondary links (How it works, Privacy)

#### 7.2 Authentication Gate
- Mandatory Login with ChatGPT
- Protected canvas route
- Session status check before allowing generation

#### 7.3 Brief Intake Node
Required fields:
- Topic / Title
- Objective
- Target Audience
- Platform(s) – multi-select
- Desired Duration
- Tone / Voice
- Key Facts (list – treated as hard constraints)
- Optional additional notes

#### 7.4 Skill Selector
User chooses a pipeline. MVP skills:

1. **Standard Script**  
   Classic structure: Hook → Scenes/Beats → Dialogue/Narration → Visual Directions → CTA

2. **Storyline Auteur Script**  
   Implements the Frequency Over Force / 5-stage funnel (Stageplay → Screenplay → Technical Screenplay → Production Summary → Auteur Script with macro-states). Optimized for generative video continuity.

Selecting a skill **dynamically creates the corresponding set of nodes and edges**.

#### 7.5 Dynamic Pipeline Nodes
Nodes are generated according to the chosen skill. Core node types:
- Brief Intake
- Skill Selector
- Hook
- Scene / Beat (repeatable)
- Dialogue / Narration
- Visual Directions / Camera
- CTA
- Continuity / Fact Checker
- Multi-Format Output
- Export / Approve
- Auteur-specific stage nodes (when that skill is selected)

#### 7.6 Individual Node Regeneration (Critical)
- Every content node has a **Regenerate** action
- Regeneration always receives:
  - The full current Brief
  - Content of all upstream nodes
  - Locked status of other nodes
  - Key facts as hard constraints
  - Node-type specific instructions
- Locked nodes are never overwritten

#### 7.7 Continuity & Fact Protection
- Key facts from the Brief are injected into every generation prompt
- Basic Continuity Checker node that surfaces missing key facts or obvious inconsistencies

#### 7.8 Multi-Format Output
- Generate at least two versions from the master script (example: Short-form vertical + Longer form)
- Each version remains editable

#### 7.9 Export & Human Review Layer
- Copy full script to clipboard
- Download as clean Markdown
- Visual status indicators (Generated / Edited / Locked / Approved)
- Explicit final approval step before export is considered complete

#### 7.10 Persistence
- All projects saved locally in the browser via Zustand + IndexedDB
- Support for multiple scripts per user
- Fast restore on page reload

---

### 8. Complete User Flow

1. User lands on marketing page
2. Clicks “Continue with ChatGPT” and completes authentication
3. Enters the canvas
4. Fills the Brief Intake node
5. Selects a Skill (Standard or Storyline Auteur Script)
6. System generates the matching node pipeline
7. User reviews content, edits text, locks strong sections, regenerates weak ones
8. (Optional) Runs Continuity Checker
9. Generates multi-format versions
10. Approves and exports the final script

---

### 9. Technical Architecture

**Frontend**
- Next.js App Router + TypeScript
- React Flow (`@xyflow/react`)
- Zustand (with persist + IndexedDB)
- Tailwind CSS + shadcn/ui
- `@opencoredev/loginwithchatgpt-react`

**Backend / API**
- Next.js Route Handlers
- `@opencoredev/loginwithchatgpt-server` mounted at `/api/chatgpt/*`
- All ChatGPT calls proxied through this handler

**AI Layer**
- `createChatGPTProxyProvider()` from `@opencoredev/loginwithchatgpt-ai`
- Vercel AI SDK (`streamText` or `generateObject` for structured output)
- Strong system prompts + JSON mode / tool calling for structured script nodes

**State**
- Single Zustand store holding:
  - Auth/session status
  - Current Brief
  - Nodes + edges
  - Project list & active project ID

---

### 10. Core Data Model

```ts
interface Brief {
  topic: string;
  objective: string;
  audience: string;
  platforms: string[];
  duration: string;
  tone: string;
  keyFacts: string[];
  additionalNotes?: string;
}

interface ScriptNode {
  id: string;
  type: NodeType;
  position: { x: number; y: number };
  data: {
    label: string;
    content: string | Record<string, any>;
    locked: boolean;
    status: "empty" | "generated" | "edited" | "approved";
  };
}

type NodeType =
  | "brief"
  | "skill-selector"
  | "hook"
  | "scene"
  | "dialogue"
  | "visual"
  | "cta"
  | "continuity-checker"
  | "multi-format"
  | "auteur-stage"
  | "export";
```

---

### 11. Detailed 48-Hour Build Plan

**Hours 0–8 | Foundation + Auth**
- Next.js + TypeScript + Tailwind + shadcn setup
- Install React Flow, Zustand, and Login-with-ChatGPT packages
- Landing page with “Continue with ChatGPT”
- Mount `/api/chatgpt/[...path]` handler
- Protected canvas route + basic session check
- Zustand store skeleton + IndexedDB persistence

**Hours 8–16 | Brief + Canvas Core**
- Brief Intake node (complete form)
- Skill Selector node
- Reusable Content Node component (content area, Lock toggle, Regenerate button, status)
- Logic that spawns different node pipelines based on selected skill
- Basic layout / positioning of generated nodes

**Hours 16–26 | AI Generation Engine**
- Wire `createChatGPTProxyProvider` + streaming/generation helpers
- Standard Script pipeline (full generation + individual node regeneration)
- Storyline Auteur Script skill (core stages implemented and labeled)
- Every regeneration call includes full Brief + upstream context + key facts
- Loading and error states

**Hours 26–36 | Control, Output & Continuity**
- Lock / Unlock behavior fully working
- Continuity / Fact Checker node (basic but visible)
- Multi-Format Output node (at least Short + Long)
- Export (Markdown download + clipboard)
- Clear visual distinction between generated / edited / locked content

**Hours 36–44 | Polish, Testing & Demo Preparation**
- UI refinement and consistent node styling
- 2–3 strong sample Brief presets
- End-to-end testing of both skills
- Edge-case handling (not logged in, missing fields, regeneration failures)
- Demo script rehearsal
- Prepare required submission materials

**Hours 44–48 | Final Hardening**
- Bug fixes
- README + list of tools and models
- Final packaging and submission checklist

---

### 12. Out of Scope (Strict 48-Hour Boundary)

- Real multi-user collaboration or cloud project sync
- Actual video generation
- Advanced React Flow features (grouping, minimap complexity, custom edge routing)
- Mobile-first responsive design
- Usage analytics
- Team workspaces
- Full multi-provider API key management (only ChatGPT in MVP)

---

### 13. Risks & Mitigations

| Risk | Mitigation |
|------|----------|
| Login-with-ChatGPT integration takes longer than expected | Follow official quickstart closely; keep a simple fallback status check |
| Structured output from the model is inconsistent | Use `generateObject` / tool calling + strong schemas + retry logic |
| Auteur Script skill becomes too large | Implement a solid 3–4 stage version first; expand only if time remains |
| React Flow state gets messy | Keep all business data in Zustand; treat React Flow as a pure view layer |
| Demo breaks live | Pre-load two complete example projects as backup |

---

### 14. Recommended Live Demo Script (≈ 5 minutes)

1. Show landing page → click “Continue with ChatGPT” and complete login
2. Fill a realistic educational video brief
3. Select **Storyline Auteur Script** → pipeline appears
4. Open one Scene node → make an edit → Lock it
5. Regenerate the Hook (show that it respects the Brief and the locked scene)
6. Run the Continuity Checker
7. Generate Short-form + Long-form versions
8. Export clean Markdown
9. Quickly switch to Standard skill to demonstrate flexibility

---

### 15. Expected Business Impact (for Submission)

- Reduces time from brief to structured first draft from hours to minutes
- Dramatically lowers revision cost by enabling precise, section-level regeneration
- Improves factual accuracy and tonal consistency across formats and platforms
- Lets teams use their existing ChatGPT subscriptions instead of incurring new AI costs
- Provides media and education teams with a professional, controllable scripting system rather than a black-box chatbot

---

### 16. Required Submission Checklist (Track 2)

- Clear explanation of the selected problem
- Functional AI-powered prototype
- Brief explanation of the solution workflow
- List of tools, platforms, and AI models used
- Sample inputs and generated outputs
- Evidence that users can review and control the final content
- Evidence that the solution was tested
- Short presentation / demonstration
- Brief explanation of expected business or creative impact

---
