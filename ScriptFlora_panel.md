Build a Photoshop-style detachable panel system for ScriptFlora 

Goal
- Panels can be docked to edges OR detached as floating windows the user can move anywhere on the screen.
- Users can re-attach a floating panel to a dock zone.
- Persist panel layout per user/project.

Primary panels to support
1) Nodes Library panel (draggable node types to canvas)
2) Node Inspector / Properties panel (selected node details)
3) Optional later: Coach panel, Assets panel

Core UX (Photoshop-like)
- Docked mode:
  - Can dock left, right, or bottom
  - Resizable width/height
  - Collapse/expand
- Floating mode:
  - Detach via drag on panel header or “Detach” control
  - Freely draggable anywhere over the app
  - Resizable
  - Z-index stacking when multiple floating panels
  - Double-click header or “Dock” control to reattach to last dock side (or nearest dock zone)
- Dock zones:
  - When dragging a panel near left/right/bottom edges, show a highlight dock target
  - Dropping on a zone docks the panel there
- Do not block React Flow canvas interactions except when interacting with the panel itself
- Mobile: fall back to bottom sheet / drawer (no free-float required in MVP)

Technical requirements
- React + TypeScript
- Keep state in a store (Zustand preferred, already used in ScriptFlora)
- Store for each panel:
  - id
  - mode: "docked" | "floating"
  - dockSide?: "left" | "right" | "bottom"
  - position: { x: number, y: number } for floating
  - size: { width: number, height: number }
  - collapsed: boolean
  - zIndex: number
- Persist layout to localStorage (and later user settings)
- Use pointer events for drag (mouse + touch where reasonable)
- Constrain floating panels within the viewport (with small margin)
- Bring panel to front on click/focus
- Smooth, minimal animation (no heavy libraries required)
- Accessible: keyboard focusable header controls (Detach, Dock, Collapse, Close if applicable)

Visual design
- Match ScriptFlora grey/silver dark UI
- Clear header drag handle
- Subtle border/shadow for floating panels so they read above the canvas
- Dock zone overlay should be obvious but not ugly (semi-transparent highlight)

Integration with React Flow
- Floating panels render above the canvas in a portal (document body or app overlay root)
- Dragging nodes FROM the Nodes Library to the canvas must still work when panel is docked or floating
- When panel is floating, node drag-preview should still drop onto React Flow correctly

MVP acceptance criteria
1. Nodes Library can dock left and detach to float
2. Inspector can dock right and detach to float
3. Drag floating panel freely and resize it
4. Drop near edge to re-dock with visible dock zone
5. Layout survives refresh (localStorage)
6. Canvas panning/zooming still works when not interacting with panels
7. Collapse works in docked mode

Deliverables
- PanelShell component (header, drag handle, dock/float controls, resize handles)
- DockZone overlays
- usePanelLayout store/hook
- Example wired Nodes Library + Inspector panels
- Short usage notes in comments

Implementation notes
- Prefer a clean, dependency-light approach
- If using a library is necessary, choose one that supports dockable/floating layouts without fighting React Flow
- Do not rewrite the whole app shell; integrate into existing ScriptFlora layout

