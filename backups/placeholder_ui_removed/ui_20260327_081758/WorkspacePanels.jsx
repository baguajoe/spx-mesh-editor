
import React from "react"
import WORKSPACE_PANELS from "./registry/workspacePanels"

import * as Panels from "./panels"

export default function WorkspacePanels({
  activeWorkspace,
  context = {}
}) {

  const panelNames =
    WORKSPACE_PANELS[activeWorkspace] || []

  return (

    <div className="workspace-panels">

      {panelNames.map((name) => {

        const PanelComponent = Panels[name]

        if (!PanelComponent) {

          return (
            <div
              key={name}
              className="panel-missing"
            >
              Missing panel: {name}
            </div>
          )

        }

        return (

          <PanelComponent
            key={name}
            {...context}
          />

        )

      })}

    </div>

  )

}

